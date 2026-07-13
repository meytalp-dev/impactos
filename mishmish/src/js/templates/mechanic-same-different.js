/* ============================================================
   מישמיש — templates/mechanic-same-different.js  →  window.MishmishSameDiff
   ------------------------------------------------------------
   מכניקת "אוֹתוֹ אוֹ שׁוֹנֶה?" — הבחנת-צליל מינימלית (רצפטיבי טהור).
   שומעים שתי השמעות (אותה מילה פעמיים = "אותו", או זוג-ניגוד = "שונה")
   → בוחרים בין 2 אריחים גדולים: "אוֹתוֹ" / "שׁוֹנֶה".

   זו המכניקה שנושאת את מסלול פּ/בּ השנתי (גל 1–2 = שמיעה בלבד).
   היא DATA-DRIVEN: קוראת את `contrasts` מה-pack —
     contrast = { pair:["בַּ","פַּ"], words:[["בָּנָנָה","פָּנָס"]], wave, pb_focus? }
   ומסננת לפי `contrast.wave` מול גל-הצליל של ה-pack (sound_wave)
   כדי לדעת אילו זוגות פעילים בנושא. אין תוכן קשיח בקוד — רק FALLBACK
   בטיחות (מסומן, טיוטה) כדי שהמסך ירוץ לפני ש-pack מספק contrasts.

   חוזה נעול (זהה למנוע measured.js, מומש כאן עצמאית כמו lantern.js):
     · שמיעתי-קודם — האריחים נעולים עד סוף שתי ההשמעות.
     · רק הניסיון-הראשון נמדד; אחרי טעות = מצב-למידה (לא נמדד).
     · בלי אדום/ירוק — טעות = הזמנה להאזין שוב (מישמיש confused-soft),
       מדרג-רמז: השמעה חוזרת איטית → הצבעה חזותית → פיגום-עאמייה (אמיר).
     · מדידה = הבחנת-צליל פר-pair → BKT (pb_focus, pb_context:'onset').

   מחובר ל-window.MishmishBKT (ingest), window.MishmishAudio (hebrew),
   window.MishmishData (pick pack), window.MishmishScaffold (שורת-הישרדות).
   דגלי-URL: ?reset=1 (איפוס BKT) · ?peek=1 (מבט-מבוגר) · ?open=1 (דילוג-פתיחה).
   ============================================================ */
window.MishmishSameDiff = (function () {
  var BKT = window.MishmishBKT, A = window.MishmishAudio;

  function q(s) { return document.querySelector(s); }
  function flag(n) { try { return new URLSearchParams(location.search).get(n); } catch (e) { return null; } }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function wait(ms) { return new Promise(function (r) { window.setTimeout(r, ms); }); }
  function stripNiqud(s) { return String(s || '').replace(/[֑-ׇ]/g, ''); }

  var MOODS = ['idle', 'speaking', 'listening', 'thinking', 'hint', 'confused-soft', 'happy', 'celebrate'];
  var MAX_TRIALS = 6;
  var GAP_MS = 480;                         // שהות בין שתי ההשמעות (הפרדה שמיעתית ברורה)

  // 🔴 FALLBACK בטיחות בלבד (מראה, לא מקור-אמת) — כמו scaffold.js.FALLBACK.
  // רץ רק אם ה-pack הנבחר עדיין לא מספק `contrasts` (משימת-pack נפרדת).
  // התוכן = טיוטה: כל זוג נרשם ב-asks.meytal ומיועד לעבור ל-pack. מילים
  // מוכרות-לגיל (גן/א'), פּ/בּ בתחילת-מילה, גל 1 (שמיעתי בלבד).
  var FALLBACK = {
    contrasts: [
      { pair: ['בַּ', 'פַּ'], words: [['בָּנָנָה', 'פָּנָס']], wave: 1, pb_focus: true, _draft: true },
      { pair: ['פֶּ', 'בַּ'], words: [['פֶּרַח', 'בַּיִת']], wave: 1, pb_focus: true, _draft: true }
    ]
  };

  // האם ה-contrast הוא ניגוד פּ/בּ (מוקד-ההפרעה #1)? מפורש דרך pb_focus, אחרת נגזר.
  function isPB(c) {
    if (c.pb_focus === true) return true;
    if (c.pb_focus === false) return false;
    var probe = (c.pair || []).slice();
    (c.words || []).forEach(function (wp) { probe = probe.concat(wp || []); });
    var base = stripNiqud(probe.join(''));
    return base.indexOf('פ') !== -1 && base.indexOf('ב') !== -1;
  }

  // תווית-הזוג ל-BKT (target) — כדי ש-distinctWords יספור זוגות-ניגוד שונים.
  function pairLabel(c) {
    if (c.pair && c.pair.length >= 2) return stripNiqud(c.pair[0]) + '~' + stripNiqud(c.pair[1]);
    var w = (c.words && c.words[0]) || [];
    return stripNiqud(w[0] || '?') + '~' + stripNiqud(w[1] || '?');
  }

  // בניית רצף-פריטים מה-contrasts הפעילים. פר זוג-מילים: 2 "שונה" + 2 "אותו"
  // (מאוזן במבנה) — ואז ערבוב וגזירה ל-MAX_TRIALS.
  function buildTrials(contrasts) {
    var trials = [];
    contrasts.forEach(function (c) {
      var pb = isPB(c), label = pairLabel(c);
      // מעדיפים זוגות-מילים מלאות (מוכרות-לגיל) על-פני הברות מבודדות; נופלים ל-pair.
      var wordPairs = (c.words && c.words.length) ? c.words : [c.pair];
      wordPairs.forEach(function (wp) {
        if (!wp || wp.length < 2) return;
        var A0 = wp[0], B0 = wp[1];
        trials.push({ kind: 'different', a: A0, b: B0, label: label, pb: pb });
        trials.push({ kind: 'different', a: B0, b: A0, label: label, pb: pb });
        trials.push({ kind: 'same', a: A0, b: A0, label: label, pb: pb });
        trials.push({ kind: 'same', a: B0, b: B0, label: label, pb: pb });
      });
    });
    return shuffle(trials).slice(0, MAX_TRIALS);
  }

  function start() {
    if (flag('reset')) BKT.reset();
    BKT.beginSession();
    MOODS.forEach(function (m) { var im = new Image(); im.src = '../assets/characters/mishmish/mishmish-' + m + '.png'; });
    ['idle', 'hint', 'listening', 'happy'].forEach(function (m) { var im = new Image(); im.src = '../assets/characters/peers/amir-' + m + '.png'; });

    // בחירת-pack בזמן-ריצה (?pack=/?mechanic=). ברירת-מחדל = market (נושא-האוכל
    // שנושא את זוג בָּנָנָה/פָּנָס). fallback ל-DATA אם ה-loader לא נטען.
    var sel = window.MishmishData && window.MishmishData.pick({ pack: 'market', mechanic: 'same-different' });
    var pack = sel ? sel.pack :
      ((window.MISHMISH_DATA && window.MISHMISH_DATA.packs.filter(function (p) { return p.pack === 'market'; })[0]) || null);

    // גל-הצליל של הנושא (sound_wave) — קובע אילו זוגות פעילים כאן.
    var packWave = pack && (pack.sound_wave != null ? pack.sound_wave
      : (pack.meta && pack.meta.sound_wave)) ;
    if (packWave == null) packWave = Infinity;

    // מקור ה-contrasts: מה-pack אם קיים, אחרת FALLBACK בטיחות (מסומן).
    var usingFallback = !(pack && pack.contrasts && pack.contrasts.length);
    var allContrasts = usingFallback ? FALLBACK.contrasts : pack.contrasts;

    // 🔵 סינון לפי גל: זוג פעיל אם contrast.wave ≤ גל-הנושא. אם אף זוג לא
    // עומד בתנאי — לא נועלים את המסך; משתמשים בכל הזוגות (עם console.warn).
    var active = allContrasts.filter(function (c) { return (c.wave == null ? 1 : c.wave) <= packWave; });
    if (!active.length) { active = allContrasts.slice(); console.warn('[same-different] אין זוגות בגל ' + packWave + ' — מציג את כולם'); }

    console.log('[same-different] pack=' + (pack && pack.pack) + ' wave=' + packWave +
      ' contrasts=' + active.length + (usingFallback ? ' (FALLBACK — טיוטה, ממתין ל-pack.contrasts)' : ''));

    var trials = buildTrials(active);
    var idx = 0, cur = null, firstItem = true;

    var els = {
      stage: q('#stage'), scene: q('.scene-bg'),
      progress: q('#progress'), placeHe: q('#place-he'),
      bubble: q('#bubble'), snd1: q('#snd-1'), snd2: q('#snd-2'),
      tiles: q('#tiles'), tSame: q('#tile-same'), tDiff: q('#tile-different'),
      mishmish: q('#mishmish'), scaffold: q('#scaffold'), amirText: q('#amir-text')
    };

    // רקע-סצנה לפי המרחב של ה-pack (מסגור-גשר: חצר-שלי מול מרחב-משותף).
    var setting = pack && (pack.setting || (pack.space === 'hara' ? 'hara-courtyard' : 'shared-market'));
    if (els.scene) els.scene.src = '../assets/backgrounds/bg-' + (setting || 'shared-market') + '.png';
    if (els.placeHe && pack && pack.place) els.placeHe.textContent = pack.place.he || '';

    // שורת-התקדמות (נקודה פר-פריט)
    els.progress.innerHTML = '';
    trials.forEach(function () { var s = document.createElement('span'); s.className = 'dot'; els.progress.appendChild(s); });
    function paintProgress() {
      Array.prototype.forEach.call(els.progress.children, function (d, i) {
        d.classList.toggle('done', i < idx);
        d.classList.toggle('current', i === idx);
      });
    }

    function setMood(m) {
      els.mishmish.src = '../assets/characters/mishmish/mishmish-' + m + '.png';
      els.mishmish.classList.toggle('celebrate', m === 'celebrate');
    }
    function setAmir(m) { var img = q('#amir-img'); if (img) img.src = '../assets/characters/peers/amir-' + m + '.png'; }

    function lockTiles(on) {
      [els.tSame, els.tDiff].forEach(function (b) { b.setAttribute('aria-disabled', on ? 'false' : 'true'); });
    }
    function clearMarks() {
      [els.tSame, els.tDiff].forEach(function (b) { b.classList.remove('chosen', 'point'); });
    }

    // השמעה בודדת (יעד עברית → clip מוקלט אם קיים, אחרת Web Speech fallback חי).
    function playOne(word, slow, chipEl) {
      return A.hebrew(word, { key: 'sd:' + stripNiqud(word), slow: slow, statusEl: chipEl });
    }
    // שתי ההשמעות ברצף, ואז פתיחת-האריחים (שמיעתי-קודם). גם בשגיאת-אודיו — פותחים.
    function playSequence(slow) {
      lockTiles(false);
      clearMarks();
      setMood('speaking');
      els.snd1.classList.remove('done'); els.snd2.classList.remove('done');
      return playOne(cur.a, slow, els.snd1)
        .then(function () { els.snd1.classList.add('done'); return wait(GAP_MS); })
        .then(function () { return playOne(cur.b, slow, els.snd2); })
        .then(function () { els.snd2.classList.add('done'); }, function () {})
        .then(openForAnswer, openForAnswer);
    }
    function openForAnswer() { setMood('listening'); lockTiles(true); }

    function mount() {
      if (idx >= trials.length) return finale();
      paintProgress();
      cur = { trial: trials[idx], measuredDone: false, wrong: 0, hintStep: 0,
              a: trials[idx].a, b: trials[idx].b };
      clearMarks();
      els.scaffold.classList.remove('show');
      els.bubble.textContent = 'אוֹתוֹ אוֹ שׁוֹנֶה?';
      lockTiles(false);

      // הוראה מושמעת פעם-אחת בלבד (בפריט הראשון), ואז שתי ההשמעות.
      var lead = firstItem
        ? A.hebrew('הַקְשִׁיבוּ. אוֹתוֹ אוֹ שׁוֹנֶה?', { key: 'sd:instr' }).catch(function () {})
        : Promise.resolve();
      firstItem = false;
      lead.then(function () { return wait(180); }).then(function () { return playSequence(false); });
    }

    function onTile(choiceKind, btn) {
      if (btn.getAttribute('aria-disabled') === 'true') return;
      var correct = (choiceKind === cur.trial.kind);

      // ── מדידה: ניסיון-ראשון בלבד (עיקרון נעול) ──
      if (!cur.measuredDone) {
        cur.measuredDone = true;
        BKT.ingest({
          pattern: 'contrast', intent: 'discriminate', target: cur.trial.label,
          dimension: 'recognize', firstTry: true, correct: correct,
          pb_focus: !!cur.trial.pb, pb_context: 'onset',
          errorAxis: correct ? undefined : 'sound'
        });
        if (correct) return commit(btn);
        return enterLearning(btn);
      }
      // אחרי מצב-למידה — תגובה לא-נמדדת
      if (correct) return commit(btn);
      return nudge(btn);
    }

    function commit(btn) {
      lockTiles(false);
      clearMarks();
      btn.classList.add('chosen');           // הבלטת-זהות (משמש/זהב), לא ירוק
      setMood('celebrate');
      // בלי "יופי" — שבח קולי יגיע כקליפ מוקלט (מצוין/מעולה). כרגע חזותי.
      window.setTimeout(function () { setMood('happy'); idx++; window.setTimeout(mount, 260); }, 950);
    }

    // טעות-ראשונה → מצב-למידה (לא נמדד): מישמיש מתבלבל בעדינות, מזמין להאזין שוב.
    function enterLearning(btn) {
      btn.classList.add('point');
      window.setTimeout(function () { btn.classList.remove('point'); }, 700);
      setMood('confused-soft');
      window.setTimeout(hint, 650);
    }
    function nudge(btn) {
      btn.classList.add('point');
      window.setTimeout(function () { btn.classList.remove('point'); }, 700);
      hint();
    }

    // מדרג-רמז: (1) השמעה-חוזרת איטית + אמיר-encourage · (2) הצבעה חזותית על
    // הנכון + אמיר-point · (3) פיגום-עאמייה (אמיר-amiya, טקסט ערבי מגודר).
    function hint() {
      cur.hintStep++;
      setMood('hint');
      showAmir(cur.hintStep >= 3 ? 'amiya' : (cur.hintStep >= 2 ? 'point' : 'encourage'));
      playSequence(true).then(function () {
        if (cur.hintStep >= 2) {
          var t = (cur.trial.kind === 'same') ? els.tSame : els.tDiff;
          t.classList.add('point');           // הצבעה חזותית על האריח הנכון
        }
        setMood('listening');
      }, function () { setMood('listening'); });
    }

    // אמיר (פיגום-עמית). טקסט he = מדרג מ-scaffold.json (טיוטת מיטל);
    // טקסט ar = עאמייה מגודרת (ar_verified:false) — לא מוצג/מושמע כברירת-מחדל.
    function showAmir(tier) {
      var hintData = window.MishmishScaffold && window.MishmishScaffold.amirHint(tier);
      setAmir(tier === 'encourage' ? 'listening' : 'hint');
      if (hintData && hintData.he) els.amirText.textContent = hintData.he;
      els.scaffold.classList.add('show');
    }

    // אריחי-השיפוט
    els.tSame.addEventListener('click', function () { if (cur) onTile('same', els.tSame); });
    els.tDiff.addEventListener('click', function () { if (cur) onTile('different', els.tDiff); });
    // כפתורי ההשמעה (נגיעה = האזנה חוזרת; לא נמדדת)
    els.snd1.addEventListener('click', function () { if (cur) playOne(cur.a, false, els.snd1); });
    els.snd2.addEventListener('click', function () { if (cur) playOne(cur.b, false, els.snd2); });

    // שורת שפת-הישרדות (מקור-אמת יחיד; מזריק+מחווט לפי ה-API הפעיל)
    if (window.MishmishScaffold) {
      window.MishmishScaffold.bind('#survival', function () {
        return cur ? { replay: function (slow) { playSequence(!!slow); }, hint: hint } : null;
      });
    }

    function finale() {
      paintProgress();
      setMood('celebrate');
      q('#doneOverlay').classList.remove('hidden');
      if (flag('peek')) showPeek();
    }
    function showPeek() {
      var box = document.createElement('pre'); box.className = 'peek';
      var acc = BKT.pbAccuracy();
      box.textContent = 'מבט-מבוגר · הבחנת-צליל (BKT):\n' + JSON.stringify(BKT.snapshot(), null, 2) +
        '\n\nדיוק פּ/בּ: ' + (acc == null ? '—' : Math.round(acc * 100) + '%');
      document.body.appendChild(box);
    }

    // ── פתיחה: overlay משחרר אודיו (unlock ל-Web Speech / autoplay) ──
    q('#startBtn').addEventListener('click', function () {
      q('#introOverlay').classList.add('hidden'); mount();
    });
    if (flag('open')) { q('#introOverlay').classList.add('hidden'); mount(); }
    q('#againBtn').addEventListener('click', function () {
      idx = 0; firstItem = true;
      trials = buildTrials(active);
      els.progress.innerHTML = '';
      trials.forEach(function () { var s = document.createElement('span'); s.className = 'dot'; els.progress.appendChild(s); });
      q('#doneOverlay').classList.add('hidden');
      var pk = document.querySelector('.peek'); if (pk) pk.remove();
      mount();
    });
  }

  return { start: start };
})();
