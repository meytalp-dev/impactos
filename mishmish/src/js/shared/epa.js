/* ============================================================
   מישמיש — js/shared/epa.js  →  window.MishmishEPA
   ------------------------------------------------------------
   שכבת ה-EPA (Error Pattern Analysis) — אבחון-כשל → תגבור.
   מודל-מקור: avnei-yesod/architecture-mvp.md §4.3.5c +
   avnei-yesod/underwater-app/interventions/*.json.

   🔴 כלל-הברזל (זהה לאבני-יסוד): EPA = **ספירה תיאורית בלבד**, לא מודל
      סטטיסטי. ה-BKT הוא הבייסיאני; EPA רק סופר דפוסי-כשל ובוחר תגבור.

   3 צירים אורתוגונליים פר-כשל: Failure × Context × Task.
     · Failure = miss.{sound,pattern,vocab}      (מ-BKT.snapshot().kcs[].miss)
     · Context = pb.{onset,sentence}             (מ-BKT.snapshot().pb)
     · Task    = דרגה (recognize / produce_supported / produce_independent)

   v1: קורא מ-BKT.snapshot() (האגרגט הקיים) — read-only, בלי לגעת בשום
   מכניקה/BKT. שדרוג-עתיד: יומן-אירועים 3-צירי נפרד (tap ב-ingest) כמו
   באבני-יסוד, לרזולוציית Task/Context מלאה.

   הפלט — שניהם (בחירת מיטל 14.7):
     · recommendNext(diag) → תגבור בתוך-האפליקציה (איזו מכניקה/תבנית הבאה)
     · teacherPlan(diag)   → המלצת-אינטרבנציה למורה (מבנה avnei-yesod)

   מבוסס על תבנית js/shared/scaffold.js (FALLBACK מוטבע עד להחצנה ל-data/).
   ============================================================ */
window.MishmishEPA = (function () {
  var BKT = window.MishmishBKT;

  // סף-דומיננטיות תיאורי. אבני-יסוד עובד בחלון-שבוע ("8 כשלים"); כאן קטן
  // ל-MVP/מפגש-בודד. חשוף לכיול (setThreshold).
  var MIN_DOMINANT = 2;

  // ── מאגר-אינטרבנציות (טיוטה — מוטבע כ-FALLBACK) ──
  // 🔴 תוכן פדגוגי = טיוטה לאישור מיטל/מומחה (asks.meytal). המבנה נגזר מ-
  //    avnei-yesod/interventions/*.json (pattern_id/goal/tier/group/stages).
  //    כאן שלד קצר בלבד; ה-stages המלאים ייכתבו ע"י פדגוג (כמו "deepened by
  //    סוכן 21 פדגוגי" באבני-יסוד). כל אינטרבנציה נושאת:
  //      in_app  = לאיזו מכניקה לנתב את התלמיד (תגבור בתוך-האפליקציה)
  //      teacher = פרמטרי-מפגש לתגבור מונחה-מורה
  var INTERVENTIONS = {
    sound: {
      pattern_id: 'pb-discrimination',
      title_he: 'הַבְחָנַת בּ/פּ',
      goal_he: 'הַיֶּלֶד מַבְחִין בֵּין /b/ לְ-/p/ בְּתַחֲלַת הֲבָרָה',
      in_app: { mechanic: 'same-different' },
      teacher: { tier: 'Tier-2', group: [3, 4], minutes: [8, 12] }
    },
    pattern: {
      pattern_id: 'frame-support',
      title_he: 'חִזּוּק הַתַּבְנִית',
      goal_he: 'הַיֶּלֶד מַשְׁלִים אֶת הַתַּבְנִית עִם מִלִּים מִתְחַלְּפוֹת',
      in_app: { mechanic: 'missing-slot' },
      teacher: { tier: 'Tier-2', group: [3, 4], minutes: [8, 12] }
    },
    vocab: {
      pattern_id: 'vocab-recognition',
      title_he: 'זִהוּי-מִלִּים בַּשְּׁמִיעָה',
      goal_he: 'הַיֶּלֶד מְזַהֶה אֶת הַמִּלָּה שֶׁשָּׁמַע מִבֵּין תְּמוּנוֹת',
      in_app: { mechanic: 'lantern' },
      teacher: { tier: 'Tier-1', group: [2, 4], minutes: [6, 10] }
    },
    pb_sentence: {
      pattern_id: 'pb-in-sentence',
      title_he: 'בּ/פּ בְּתוֹךְ מִשְׁפָּט',
      goal_he: 'מַבְחִין בּ/פּ גַּם בְּתוֹךְ מִשְׁפָּט, לֹא רַק בְּתַחֲלַת מִלָּה',
      in_app: { mechanic: 'missing-slot' },
      teacher: { tier: 'Tier-2', group: [3, 4], minutes: [8, 12] }
    }
  };

  function snap() { return (BKT && BKT.snapshot) ? BKT.snapshot() : { kcs: {}, pb: {} }; }
  function rate(c) { return c && c.a ? c.s / c.a : 1; }
  function pickTop(obj) {
    var best = { axis: null, count: -1 };
    for (var a in obj) { if (obj[a] > best.count) best = { axis: a, count: obj[a] }; }
    return best;
  }

  // ── diagnose — ספירה תיאורית של דפוסי-הכשל מתוך snapshot ──
  function diagnose(s) {
    s = s || snap();
    var byAxis = { sound: 0, pattern: 0, vocab: 0 };
    var perKc = [];
    var kcs = s.kcs || {};
    for (var k in kcs) {
      var kc = kcs[k], miss = kc.miss || {};
      byAxis.sound   += miss.sound   || 0;
      byAxis.pattern += miss.pattern || 0;
      byAxis.vocab   += miss.vocab   || 0;
      var top = pickTop({ sound: miss.sound || 0, pattern: miss.pattern || 0, vocab: miss.vocab || 0 });
      if (top.count > 0) {
        perKc.push({ kc: k, pattern: kc.pattern, patternHe: kc.patternHe || kc.pattern,
                     axis: top.axis, count: top.count, level: kc.level });
      }
    }

    // ציר-Context של פּ/בּ: onset תקין אך sentence חלש → דפוס pb_sentence
    // ("מבחין בתחילת-מילה אך לא בתוך משפט") — האות המפוצל שכבר קיים ב-BKT.
    var pb = s.pb || {}, onset = pb.onset || { a: 0, s: 0 }, sent = pb.sentence || { a: 0, s: 0 };
    var pbSentenceWeak = (sent.a - sent.s) >= MIN_DOMINANT && rate(onset) > rate(sent);

    // הדפוס הדומיננטי הכללי (pb_sentence גובר — הוא אבחנה ספציפית יותר)
    var domAxis = pickTop(byAxis);
    var dominant = null;
    if (pbSentenceWeak) dominant = { kind: 'pb_sentence', count: sent.a - sent.s };
    else if (domAxis.count >= MIN_DOMINANT) dominant = { kind: domAxis.axis, count: domAxis.count };

    perKc.sort(function (a, b) { return b.count - a.count; });
    return {
      byAxis: byAxis, perKc: perKc,
      pb: { onset: onset, sentence: sent, sentenceWeak: pbSentenceWeak },
      dominant: dominant
    };
  }

  function ivFor(kind) { return INTERVENTIONS[kind === 'pb_sentence' ? 'pb_sentence' : kind] || null; }

  // ── recommendNext — תגבור בתוך-האפליקציה: המכניקה/התבנית הבאה ──
  function recommendNext(diag) {
    diag = diag || diagnose();
    var focus = diag.perKc[0] || null;
    if (!diag.dominant) {
      return { kind: null, mechanic: null, pattern: focus ? focus.pattern : null,
               reason: 'אֵין דְּפוּס-כֶּשֶׁל דּוֹמִינַנְטִי — הֶמְשֵׁךְ רָגִיל' };
    }
    var iv = ivFor(diag.dominant.kind);
    return {
      kind: diag.dominant.kind,
      mechanic: iv ? iv.in_app.mechanic : null,
      pattern: focus ? focus.pattern : null,          // התבנית עם הכי הרבה כשלים באותו ציר
      interventionId: iv ? iv.pattern_id : null,
      reason: iv ? ('תִּגְבּוּר: ' + iv.title_he) : null
    };
  }

  // ── teacherPlan — המלצת-אינטרבנציה למורה (מבנה avnei-yesod) ──
  function teacherPlan(diag) {
    diag = diag || diagnose();
    if (!diag.dominant) return null;
    var iv = ivFor(diag.dominant.kind);
    if (!iv) return null;
    return {
      interventionId: iv.pattern_id, title_he: iv.title_he, goal_he: iv.goal_he,
      tier: iv.teacher.tier, group_size: iv.teacher.group, minutes: iv.teacher.minutes,
      // ראיה בשפה-אנושית (בלי אחוזים) — למה הומלץ התגבור הזה
      evidence: { axis: diag.dominant.kind, count: diag.dominant.count, kcs: diag.perKc.slice(0, 3) },
      _draft: true   // 🔴 תוכן פדגוגי לאישור מיטל/מומחה
    };
  }

  return {
    diagnose: diagnose,
    recommendNext: recommendNext,
    teacherPlan: teacherPlan,
    interventions: function () { return INTERVENTIONS; },
    setThreshold: function (n) { if (typeof n === 'number' && n > 0) MIN_DOMINANT = n; },
    threshold: function () { return MIN_DOMINANT; }
  };
})();
