/* ============================================================
   מישמיש — bkt.js  →  window.MishmishBKT   (BKT-L2, גל A / MVP)
   ------------------------------------------------------------
   מנוע-ראיות אדפטיבי. הציר הנמדד = כוונה+תבנית כ-KC (לא מילת-יעד).
   מפתח-KC = intent::pattern  → מודד "שליטה בתבנית עם מילים מתחלפות",
   לא "האם הילד מכיר מילה אחת".

   סולם 3 רמות (כל רמה = ראיה נפרדת, פר-KC):
     L1 identifies            — מזהה בשמיעה (dimension: recognize)
     L2 produces_supported    — מפיק בתמיכה (dimension: produce_supported)
     L3 produces_independent  — מפיק עצמאי  (dimension: produce_independent)

   סף-מעבר (אושר ע"י מיטל 13.7): דרגה "נרכשת" כשיש ≥2 תשובות-נכונות
   בניסיון-ראשון עם ≥2 מילות-יעד שונות באותה תבנית — מוכיח שליטה
   בתבנית ולא שינון מילה בודדת.

   דגלי-ראיה שקופים — 🔴 בלי אחוזים בממשק-המבוגר. snapshot() חושף
   ספירות + booleans (reached/status), לא הסתברויות. pKnown נשמר
   כאות-פנימי בלבד (תחת _signal), לא לתצוגה.

   תיוג-מסיח רב-צירי: כל טעות נושאת axis (sound/pattern/vocab), כדי
   שהמבט-מבוגר יידע להבחין "מבחין פּ/בּ בתחילת מילה אך לא בתוך משפט"
   (פּ/בּ מפוצל לפי context: onset מול sentence).

   offline-first: כתיבה ל-localStorage בלבד. מבוסס lumi/app/js/bkt.js.
   ============================================================ */
window.MishmishBKT = (function () {
  var KEY = 'mishmish-bkt-v2';
  var KEY_V1 = 'mishmish-bkt-v1';                          // מיגרציה מהמבנה הישן
  var P = { pL0: 0.20, pT: 0.14, pG: 0.22, pS: 0.10 };     // BKT 4-פרמטרים (אות-פנימי בלבד)
  var THRESH = { minCorrect: 2, minWords: 2 };             // סף-דרגה: ≥2 נכונות · ≥2 מילים שונות

  // ── סט ה-KC של גל A: 5 תבניות-השדרה (חוזרות ב-≥3 נושאים) ──
  // pattern → { intent, he (מנוקד), spine }. 'mapping' = probe שקט (לא תבנית-שדרה).
  var KC_META = {
    this_that:  { intent: 'identify',       he: 'זֶה / זֹאת',          spine: true },
    have:       { intent: 'possess',        he: 'יֵשׁ לִי',            spine: true },
    want:       { intent: 'request',        he: 'אֲנִי רוֹצֶה',        spine: true },
    give_me:    { intent: 'request_object', he: 'תֵּן לִי',            spine: true },
    see_hear:   { intent: 'perceive',       he: 'אֲנִי רוֹאֶה / שׁוֹמֵעַ', spine: true },
    mapping:    { intent: 'probe',          he: 'מִיפּוּי',            spine: false }
  };

  // dimension → שם-דרגה בסולם
  var DIM_RUNG = {
    recognize:           'identifies',
    produce_supported:   'produces_supported',
    produce_independent: 'produces_independent'
  };
  var RUNG_ORDER = ['identifies', 'produces_supported', 'produces_independent'];
  var AXES = ['sound', 'pattern', 'vocab'];

  var state = load();

  // ── טעינה + מיגרציה offline ──
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) {}
    try {
      var old = localStorage.getItem(KEY_V1);
      if (old) return migrateV1(JSON.parse(old));
    } catch (e) {}
    return fresh();
  }
  function fresh() {
    return { v: 2, session: 0, kcs: {}, pb: freshPb() };
  }
  function freshPb() {
    return { attempts: 0, success: 0, byContext: { onset: { a: 0, s: 0 }, sentence: { a: 0, s: 0 } } };
  }
  function normalize(s) {                                  // מגן מפני state חלקי
    if (!s || typeof s !== 'object') return fresh();
    s.v = 2; s.session = s.session || 0; s.kcs = s.kcs || {};
    if (!s.pb) s.pb = freshPb();
    if (!s.pb.byContext) s.pb.byContext = { onset: { a: 0, s: 0 }, sentence: { a: 0, s: 0 } };
    return s;
  }
  function migrateV1(old) {                                // v1: {session, patterns:{pat:{...}}, pb:{success,attempts}}
    var s = fresh();
    s.session = (old && old.session) || 0;
    var pats = (old && old.patterns) || {};
    for (var patKey in pats) {
      var op = pats[patKey], meta = KC_META[patKey] || { intent: 'unknown' };
      var kc = getKc(meta.intent, patKey, s);
      var r = kc.rungs.identifies;                         // v1 מדד רק recognize
      r.attempts = op.attempts || 0;
      r.correct = op.firstTry || 0;
      for (var t in (op.targets || {})) if (op.targets[t] > 0) r.words[t] = true;
      if (typeof op.pKnown === 'number') r.pKnown = op.pKnown;
      kc.lastSession = op.lastSession || 0;
    }
    if (old && old.pb) {
      s.pb.attempts = old.pb.attempts || 0; s.pb.success = old.pb.success || 0;
      s.pb.byContext.onset.a = s.pb.attempts; s.pb.byContext.onset.s = s.pb.success;
    }
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  // ── יצירת/שליפת KC ──
  function intentFor(evt) {
    if (evt.intent) return evt.intent;
    var m = KC_META[evt.pattern];
    return m ? m.intent : 'unknown';
  }
  function keyOf(intent, pattern) { return intent + '::' + pattern; }
  function freshRung() { return { attempts: 0, correct: 0, words: {}, pKnown: P.pL0 }; }
  function getKc(intent, pattern, s) {
    s = s || state;
    var k = keyOf(intent, pattern);
    if (!s.kcs[k]) {
      s.kcs[k] = {
        intent: intent, pattern: pattern,
        rungs: { identifies: freshRung(), produces_supported: freshRung(), produces_independent: freshRung() },
        miss: { sound: 0, pattern: 0, vocab: 0 },
        lastSession: 0
      };
    }
    return s.kcs[k];
  }

  // ── BKT: עדכון פוסטריורי + למידה (אות-פנימי) ──
  function bktUpdate(pKnown, correct) {
    var post = correct
      ? (pKnown * (1 - P.pS)) / (pKnown * (1 - P.pS) + (1 - pKnown) * P.pG)
      : (pKnown * P.pS) / (pKnown * P.pS + (1 - pKnown) * (1 - P.pG));
    return post + (1 - post) * P.pT;
  }

  // ── סולם-הרמות ──
  function distinctWords(r) { var n = 0; for (var w in r.words) n++; return n; }
  function rungReached(r) { return !!r && r.correct >= THRESH.minCorrect && distinctWords(r) >= THRESH.minWords; }
  function rungStatus(r) {
    if (!r || r.attempts === 0) return 'untested';
    if (rungReached(r)) return 'reached';
    if (r.correct >= 1) return 'emerging';
    return 'attempting';
  }
  function levelOf(kc) {
    for (var i = RUNG_ORDER.length - 1; i >= 0; i--) {
      if (rungReached(kc.rungs[RUNG_ORDER[i]])) return RUNG_ORDER[i];
    }
    for (var j = 0; j < RUNG_ORDER.length; j++) if (kc.rungs[RUNG_ORDER[j]].correct >= 1) return 'emerging';
    return 'new';
  }
  // צורת-ראיה שקופה למבט-מבוגר: ספירות + booleans, בלי אחוזים
  function evidenceOf(kc) {
    var out = {};
    for (var i = 0; i < RUNG_ORDER.length; i++) {
      var name = RUNG_ORDER[i], r = kc.rungs[name];
      out[name] = {
        seen: r.attempts, correct: r.correct, distinctWords: distinctWords(r),
        reached: rungReached(r), status: rungStatus(r),
        _signal: { pKnown: r.pKnown }                     // הסתברות פנימית — לא לתצוגה
      };
    }
    return out;
  }

  // ── אות פּ/בּ מפוצל-context (onset מול sentence) ──
  function pbContext(evt) { return evt.pb_context === 'sentence' ? 'sentence' : 'onset'; }

  return {
    beginSession: function () { state.session++; save(); return state.session; },

    /* נקודת-הקליטה היחידה.
       evt = { pattern, target, dimension, firstTry, correct,
               intent?, pb_focus?, pb_context?('onset'|'sentence'),
               errorAxis?('sound'|'pattern'|'vocab') }
       מודדים רק ניסיון-ראשון (עיקרון נעול; אחרי טעות = מצב-למידה לא-נמדד). */
    ingest: function (evt) {
      if (!evt || !evt.pattern) return null;
      var rungName = DIM_RUNG[evt.dimension || 'recognize'];
      if (!rungName) return null;                          // dimension לא-מוכר → לא נמדד
      if (!evt.firstTry) return null;

      var intent = intentFor(evt);
      var kc = getKc(intent, evt.pattern);
      var r = kc.rungs[rungName];

      r.attempts++;
      r.pKnown = bktUpdate(r.pKnown, !!evt.correct);
      if (evt.correct) {
        r.correct++;
        if (evt.target != null) r.words[evt.target] = true;
      } else {
        // תיוג-מסיח רב-צירי: axis מפורש, אחרת נגזר (פּ/בּ→sound, ברירת-מחדל→vocab)
        var axis = evt.errorAxis || (evt.pb_focus ? 'sound' : 'vocab');
        if (kc.miss.hasOwnProperty(axis)) kc.miss[axis]++;
      }

      if (evt.pb_focus) {
        var ctx = pbContext(evt);
        state.pb.attempts++; state.pb.byContext[ctx].a++;
        if (evt.correct) { state.pb.success++; state.pb.byContext[ctx].s++; }
      }

      kc.lastSession = state.session;
      save();
      return { key: keyOf(intent, evt.pattern), rung: rungName, level: levelOf(kc), reached: rungReached(r) };
    },

    /* ── קריאות (compat + חדש) ── */
    getKc: function (key) { return state.kcs[key] || null; },
    getPattern: function (arg) {                           // compat: מקבל key מלא או pattern בלבד
      if (state.kcs[arg]) return state.kcs[arg];
      for (var k in state.kcs) if (state.kcs[k].pattern === arg) return state.kcs[k];
      return null;
    },
    level: function (arg) {
      var kc = state.kcs[arg];
      if (!kc) for (var k in state.kcs) if (state.kcs[k].pattern === arg) { kc = state.kcs[k]; break; }
      return kc ? levelOf(kc) : 'new';
    },
    // דיוק פּ/בּ גלובלי (compat ל-lantern peek). המבט-המבוגר האמיתי משתמש ב-snapshot().pb (ספירות).
    pbAccuracy: function () { return state.pb.attempts ? state.pb.success / state.pb.attempts : null; },

    /* snapshot למבט-מבוגר — דגלי-ראיה שקופים, ספירות בלבד (בלי אחוזים) */
    snapshot: function () {
      var out = {
        session: state.session,
        pb: {
          onset: state.pb.byContext.onset,
          sentence: state.pb.byContext.sentence,
          overall: { attempts: state.pb.attempts, success: state.pb.success }
        },
        kcs: {}
      };
      for (var k in state.kcs) {
        var kc = state.kcs[k], meta = KC_META[kc.pattern] || {};
        out.kcs[k] = {
          intent: kc.intent, pattern: kc.pattern,
          patternHe: meta.he || kc.pattern, spine: !!meta.spine,
          level: levelOf(kc),
          rungs: evidenceOf(kc),
          miss: kc.miss                                    // תיוג רב-צירי: sound/pattern/vocab
        };
      }
      return out;
    },

    // מטא-דאטה של סט-ה-KC (5 תבניות-השדרה) — לכיול תוכן/מבט-מבוגר
    spine: function () {
      var out = [];
      for (var p in KC_META) if (KC_META[p].spine) out.push({ pattern: p, intent: KC_META[p].intent, he: KC_META[p].he });
      return out;
    },

    reset: function () { state = fresh(); save(); }
  };
})();
