/* ============================================================
   מישמיש — templates/mechanic-roleplay.js  →  window.MishmishRoleplay
   ------------------------------------------------------------
   מכניקת "שִׂיחָה עִם אָמִיר" (roleplay) — turn דו-כיווני.
   🔴 M6 היחידה בלי קונכיית-מקור באבני-יסוד — נטו-חדש; שומרת בדיוק
      על חוזה-המדידה של M2/M3/M4 (measured.js).

   הרעיון: אָמִיר (העמית) *מבקש* בתבנית, וְהילד *מפיק* את התבנית בחזרה.
   שני סוגי-turn נגזרים data-driven מ-pack.patterns:

     (א) תשובה  — אמיר שואל "מַה זֶּה?" (pattern what_is) ומצביע על חפץ;
                  הילד מפיק את תבנית-התשובה "זֶה ___ / זֹאת ___"
                  (pattern this_that) ע"י בחירת המשפט-המופק המתאים לחפץ.
     (ב) בקשה   — אמיר "המוכר" שואל מָה אַתֶּם רוֹצִים? והילד מפיק
                  "תֵּן לִי ___" (pattern give_me) עבור הפריט שהוא צריך.

   🔴 מודל-הפקה = בחירה-בין-2 מדידה (pack-schema §4), *לא מיקרופון*.
      כל "אריח" = משפט-מופק מלא ומנוקד; הילד בוחר את זה שמשלים נכון
      את ה-turn מול אמיר. הרמז החזותי הלא-טקסטואלי הוא תמונת-החפץ/היעד
      (referent), כך שאין ניחוש-קריאה עיוור.

   🔴 חוק מבני: קוד data-driven בלבד. אין תוכן קשיח —
      התבניות/המילים נקראות מ-pack.patterns + pack.lexicon (pack-schema §2)
      דרך MishmishData.pick({pack,mechanic:'roleplay'}). עד שסוכן ה-pack
      יזרים אותן נופלים ל-fixture window.MISHMISH_ROLEPLAY_DEMO (מוגדר בדף,
      לא כאן ולא ב-pack) כדי שהמסך יהיה נגיש/בדיק standalone.

   🔴 אמיר-כדמות: he = יעד (מוצג/מושמע · עברית) · עאמייה מגודרת
      (ar_verified:false — נכתבת ל-DOM לבודק/ת, מוסתרת ב-CSS, לא מושמעת).
      מדרג-רמז נעול: השמעה-חוזרת (אמיר שואל שוב) → הצבעה חזותית →
      פיגום-עאמייה (אמיר לוחש). זהה בדיוק ל-M2/M3/M4.

   חוזה נמדד (זהה ל-measured.js / M2 / M3 / M4 — לא משנים):
     · שמיעתי-קודם — האריחים נעולים עד סוף השמעת-אמיר.
     · רק הניסיון הראשון נמדד; אחרי טעות = מצב-למידה (לא נמדד).
     · בלי אדום/ירוק — טעות = הזמנה להאזין שוב (retry=צהוב, selected=כחול).

   מדידה (bkt.js F6): KC = תבנית-השדרה שהילד *מפיק* (this_that / give_me).
     evt.pattern = producePattern.id · evt.intent = intent-השדרה
     (identify / request_object) · evt.target = מזהה-המילה (סף ≥2-מילים
     שונות מוכיח שליטה-בתבנית) · dimension = 'produce_supported' (רמה 2 —
     מפיק-בתמיכה) · pb_context = 'sentence' (הפקה בתוך משפט).

   מבוסס על mechanic-grammar-toggle.js (M4) + measured.js (החוזה).
   ============================================================ */
window.MishmishRoleplay = (function () {
  var BKT = window.MishmishBKT, A = window.MishmishAudio;

  function q(sel) { return document.querySelector(sel); }
  function flag(name) { try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }

  var MOODS = ['idle', 'speaking', 'listening', 'thinking', 'hint', 'confused-soft', 'happy', 'celebrate'];
  function preload() {
    MOODS.forEach(function (m) { var im = new Image(); im.src = '../assets/characters/mishmish/mishmish-' + m + '.png'; });
    ['idle', 'hint', 'listening', 'happy'].forEach(function (m) { var im = new Image(); im.src = '../assets/characters/peers/amir-' + m + '.png'; });
  }

  // ── resolver: מזהה-lexeme → אובייקט-שם-עצם (id → {he,img,gender,pb_focus}) ──
  // נשען על pack.lexicon בדיוק כמו §2. פריט יכול לספק שדות מוטבעים (fixture)
  // או להיפתר מול ה-lexicon. img של lexeme כבר כולל תת-תיקייה+.png.
  function buildLexIndex(lexicon) {
    var idx = {};
    (lexicon || []).forEach(function (lx) { if (lx && lx.id) idx[lx.id] = lx; });
    return idx;
  }
  // pb_focus נגזר מ-sound_tags: בּ/פּ בראש-הברה (onset) → true; b_p_free/*_medial → false.
  // 🔴 לא ממציאים שדה חדש — קוראים sound_tags הקיים (זהה ל-M3).
  function pbFocusFromTags(tags) {
    if (!tags || !tags.length) return false;
    return tags.some(function (t) {
      t = String(t).toLowerCase();
      return t === 'b_initial' || t === 'p_initial' || t === 'b_onset' || t === 'p_onset';
    });
  }
  function resolveNoun(ref, lexIdx) {
    // תאימות: ref שהוא אובייקט מלא (fixture) → כמו-שהוא, עם נירמול img.
    var lex = (ref && typeof ref === 'object') ? ref : (lexIdx[ref] || null);
    if (!lex || !lex.he) return null;
    return {
      id: lex.id, he: lex.he,
      img: lex.img ? ('../assets/items/' + lex.img) : null,
      emoji: lex.emoji || null,
      gender: lex.gender || 'm',
      pb_focus: pbFocusFromTags(lex.sound_tags)
    };
  }

  // ── בחירת פריטי-פאטרן מה-pack ─────────────────────────────────
  function findPattern(patterns, id) {
    return (patterns || []).filter(function (p) { return p && p.id === id; })[0] || null;
  }
  // תבנית-השאלה של אמיר עבור תבנית-הפקה P: הפאטרן ש-answer_pattern שלו = P.id
  // (למשל what_is.answer_pattern === 'this_that'), אחרת שדה amir_ask על P עצמה.
  function askForProduce(patterns, produce) {
    var linked = (patterns || []).filter(function (p) {
      return p && p.answer_pattern === produce.id;
    })[0];
    if (linked) return { he: linked.frame, audioKey: linked.audio_frame || null };
    if (produce.amir_ask) return { he: produce.amir_ask, audioKey: produce.audio_ask || null };
    return null;
  }

  // מילוי תבנית-מופקת עבור שם-עצם. this_that ממוגדר (זֶה/זֹאת); אחרת frame ישיר.
  function fillFrame(produce, noun) {
    var frame = (produce.gendered && produce.frame_f && noun.gender === 'f') ? produce.frame_f : produce.frame;
    return String(frame).replace('___', noun.he);
  }

  // ── בניית turns לתבנית-הפקה נתונה ────────────────────────────
  // לכל שם-עצם (יעד) בונים turn: אמיר שואל, הילד מפיק. 2 אריחים = משפט-היעד
  // + משפט-מסיח (שם-עצם אחר). סדר קבוע (דטרמיניסטי) — עקבי ל-QA ולמדידה.
  function buildTurnsFor(produce, ask, kind, lexIdx) {
    if (!produce || !ask) return [];
    var nouns = (produce.slots || [])
      .map(function (s) { return resolveNoun(s, lexIdx); })
      .filter(function (n) { return n && n.img; });          // צריך תמונת-referent (רמז לא-טקסטואלי)
    if (nouns.length < 2) return [];

    var meta = (BKT && BKT.spine) ? null : null;             // intent נקבע מ-KC_META ב-bkt.js
    var turns = [];
    nouns.forEach(function (target, ti) {
      var distractor = nouns[(ti + 1) % nouns.length];
      if (distractor.id === target.id) distractor = nouns[(ti + 2) % nouns.length];
      // סדר-אריחים קבוע: יעד ראשון בסבב-זוגי, מסיח ראשון באי-זוגי → הנכון לא תמיד ראשון.
      var pair = (ti % 2 === 0) ? [target, distractor] : [distractor, target];
      var options = pair.map(function (n) {
        return { id: n.id, he: fillFrame(produce, n), correct: n.id === target.id, pb_focus: n.pb_focus };
      });
      turns.push({
        kind: kind,                                          // 'answer' | 'request'
        id: produce.id + '::' + target.id,
        producePattern: produce.id,                          // KC נמדד (תבנית-השדרה שהילד מפיק)
        intent: produce.intent || undefined,                 // אחרת נגזר מ-KC_META ב-bkt.js
        amirAsk: ask,                                        // { he, audioKey } — השמעת-אמיר (יעד)
        askAr: produce.amir_ask_ar || ask.ar || null,        // עאמייה מגודרת (אופציונלי)
        referent: { id: target.id, he: target.he, img: target.img, emoji: target.emoji },
        targetId: target.id,
        pb_focus: target.pb_focus,
        options: options,
        instruction: produce.instruction ||
          (kind === 'request' ? 'הַקְשִׁיבוּ לְאָמִיר וּבַחֲרוּ מָה לְבַקֵּשׁ' : 'הַקְשִׁיבוּ לְאָמִיר וְעֲנוּ לוֹ')
      });
    });
    return turns;
  }

  // בונה את כל ה-turns: תשובה (this_that) + בקשה (give_me), משורגים.
  function buildTurns(patterns, lexIdx) {
    var thisThat = findPattern(patterns, 'this_that');
    var giveMe = findPattern(patterns, 'give_me');
    var answerTurns = thisThat ? buildTurnsFor(thisThat, askForProduce(patterns, thisThat), 'answer', lexIdx) : [];
    var requestTurns = giveMe ? buildTurnsFor(giveMe, askForProduce(patterns, giveMe), 'request', lexIdx) : [];

    // שרגור תשובה↔בקשה כדי ששני ה-KC ייצברו ראיות במקביל (זהה למ-M4).
    var out = [], i = 0, j = 0;
    while (i < answerTurns.length || j < requestTurns.length) {
      if (i < answerTurns.length) out.push(answerTurns[i++]);
      if (j < requestTurns.length) out.push(requestTurns[j++]);
    }
    return out;
  }

  function start() {
    if (flag('reset') && BKT.reset) BKT.reset();
    if (BKT.beginSession) BKT.beginSession();
    preload();

    // בחירת-pack בזמן-ריצה דרך ה-loader (?pack=/?mechanic=). ברירת-מחדל = class
    // (נושא 1 — 'אני והכיתה'; patterns what_is+this_that מזינים turn-תשובה).
    var sel = window.MishmishData &&
      window.MishmishData.pick({ pack: 'class', mechanic: 'roleplay' });
    var pack = sel && sel.pack;

    // מקור-התוכן: pack.patterns + pack.lexicon (§2). fallback ל-fixture-הדף. אין תוכן קשיח.
    var demo = window.MISHMISH_ROLEPLAY_DEMO || {};
    var rawPatterns = (pack && pack.patterns) || demo.patterns || [];
    var lexicon = (pack && pack.lexicon) || demo.lexicon || [];
    var lexIdx = buildLexIndex(lexicon);
    var turns = buildTurns(rawPatterns, lexIdx);

    var usingFallback = !(pack && pack.patterns && pack.patterns.length);
    console.log('[roleplay] pack=' + (pack && pack.pack) + ' turns=' + turns.length +
      (usingFallback ? ' (FALLBACK — טיוטה, ממתין ל-pack.patterns)' : ''));

    var scene = demo.scene || (pack && pack.scene) ||
      { bg: (pack && pack.meta && pack.meta.bg && pack.meta.bg.replace(/\.png$/, '')) || 'bg-hara-courtyard' };

    var els = {
      sceneBg: q('#scene-bg'), progress: q('#progress'),
      placeHe: q('#place-he'), placeAr: q('#place-ar'),
      amirFace: q('#amir-face'), amirHe: q('#amir-he'), amirAr: q('#amir-ar'),
      referent: q('#referent'), refImg: q('#ref-img'), refBadge: q('#ref-badge'),
      listen: q('#listen'), tiles: q('#tiles'),
      mishmish: q('#mishmish'),
      instr: q('#instr'),
      introOverlay: q('#introOverlay'), startBtn: q('#startBtn'),
      doneOverlay: q('#doneOverlay'), againBtn: q('#againBtn')
    };

    // רקע-הסצנה + שם-המקום (מסגור-גשר: המרחב של הילד; ערבית מגודרת)
    if (scene.bg && els.sceneBg) els.sceneBg.src = '../assets/backgrounds/' +
      (String(scene.bg).indexOf('bg-') === 0 ? scene.bg : 'bg-' + scene.bg) + '.png';
    if (scene.place_he && els.placeHe) els.placeHe.textContent = scene.place_he;
    if (scene.place_ar && els.placeAr) els.placeAr.textContent = scene.place_ar;

    // שורת-התקדמות (נקודה פר-turn)
    els.progress.innerHTML = '';
    turns.forEach(function () { var p = document.createElement('span'); p.className = 'paw'; els.progress.appendChild(p); });

    var idx = 0, active = null;

    function paintProgress() {
      Array.prototype.forEach.call(els.progress.children, function (p, i) {
        p.classList.toggle('done', i < idx);
        p.classList.toggle('current', i === idx);
      });
    }

    function setMishmish(mood) {
      els.mishmish.src = '../assets/characters/mishmish/mishmish-' + mood + '.png';
      els.mishmish.classList.toggle('celebrate', mood === 'celebrate');
    }
    // אמיר = הדמות-שֶׁמּוּלָהּ (יעד עברית). מנוהל ישירות (כמו setAmir ב-M4).
    function setAmir(mood) {
      if (els.amirFace) els.amirFace.src = '../assets/characters/peers/amir-' + (mood || 'idle') + '.png';
    }

    // ── דרייבר-turn יחיד: מכונת-מצבים תואמת-חוזה measured.js ──────
    function mountTurn() {
      if (idx >= turns.length) return finale();
      paintProgress();
      var turn = turns[idx];
      var st = { phase: 'loading', measuredDone: false, done: false, hintStep: 0 };

      // תמונת-היעד (referent): מה שאמיר מצביע עליו (תשובה) / הפריט שהילד צריך (בקשה).
      function renderReferent() {
        els.referent.setAttribute('data-kind', turn.kind);
        if (els.refBadge) els.refBadge.textContent = turn.kind === 'request' ? 'אַתֶּם צְרִיכִים' : '?';
        if (!els.refImg) return;
        if (turn.referent.img) {
          els.refImg.src = turn.referent.img;
          els.refImg.alt = turn.referent.he;
          els.refImg.style.visibility = '';
          els.refImg.onerror = function () { this.style.visibility = 'hidden'; };
        } else {
          els.refImg.removeAttribute('src');
          els.refImg.style.visibility = 'hidden';
        }
      }

      // אריחי-משפט-מופק: משפט מלא ומנוקד (הילד בוחר את ההפקה הנכונה). ≥56px.
      function renderTiles() {
        els.tiles.innerHTML = '';
        turn.options.forEach(function (opt) {
          var b = document.createElement('button');
          b.className = 'tile';
          b.type = 'button';
          b.setAttribute('aria-disabled', 'true');           // נעול עד סוף ההשמעה
          b.innerHTML = '<span class="cap">' + opt.he + '</span>';
          b.addEventListener('click', function () { onTile(b, opt); });
          els.tiles.appendChild(b);
        });
      }
      function enableTiles(on) {
        Array.prototype.forEach.call(els.tiles.children, function (b) {
          b.setAttribute('aria-disabled', on ? 'false' : 'true');
        });
      }
      function tileForCorrect() {
        return Array.prototype.filter.call(els.tiles.children, function (b, i) {
          return turn.options[i] && turn.options[i].correct;
        })[0];
      }
      function clearMarks() {
        Array.prototype.forEach.call(els.tiles.children, function (b) { b.classList.remove('retry', 'selected'); });
      }

      // ── אודיו-אמיר (עברית=יעד) — קליפ מוקלט אם קיים (seam), אחרת TTS-fallback ──
      function playAsk(slow) {
        setAmir('speaking');
        return A.hebrew(turn.amirAsk.he, { key: turn.amirAsk.audioKey || ('rp:ask:' + turn.producePattern), slow: slow, statusEl: els.listen })
          .then(function () { els.listen.setAttribute('data-audio', 'idle'); },
                function () { els.listen.setAttribute('data-audio', 'idle'); });
      }
      // אמיר מהדהד את המשפט-המופק הנכון = מודל-הגייה אחרי-הצלחה (יעד).
      function playEcho() {
        var correct = turn.options.filter(function (o) { return o.correct; })[0];
        if (!correct) return Promise.resolve();
        return A.hebrew(correct.he, { key: 'rp:echo:' + turn.targetId }).then(function () {}, function () {});
      }

      // ── מצבים ──
      function introPlaying() {
        st.phase = 'introPlaying';
        setAmir('speaking');
        setMishmish('listening');
        if (els.amirHe) els.amirHe.textContent = turn.amirAsk.he;   // בועת-אמיר = שאלתו (יעד, מנוקד)
        clearAmirAr();
        enableTiles(false);
        playAsk(false).then(awaitingAnswer, awaitingAnswer);        // גם בשגיאת-אודיו — פותחים
      }
      function awaitingAnswer() {
        st.phase = 'awaitingAnswer';
        setAmir('listening');                                       // אמיר מקשיב לתשובת-הילד
        setMishmish('idle');
        enableTiles(true);
      }

      function onTile(btn, opt) {
        if (btn.getAttribute('aria-disabled') === 'true') return;

        if (!st.measuredDone) {                                     // מדידה — ניסיון ראשון בלבד
          st.measuredDone = true;
          BKT.ingest && BKT.ingest({
            pattern: turn.producePattern,                           // this_that / give_me (תבנית-שדרה)
            intent: turn.intent,                                    // identify / request_object
            target: turn.targetId,                                  // מילה → סף ≥2-מילים-שונות
            dimension: 'produce_supported',                         // רמה 2 — מפיק-בתמיכה
            firstTry: true,
            correct: !!opt.correct,
            pb_focus: !!turn.pb_focus,
            pb_context: 'sentence'                                  // הפקה בתוך משפט
          });
          if (opt.correct) return commitCorrect(btn);
          return enterLearning(btn);
        }
        if (opt.correct) return commitCorrect(btn);                 // אחרי מצב-למידה: לא נמדד
        return nudgeRetry(btn);
      }

      function commitCorrect(btn) {
        st.phase = 'correct';
        enableTiles(false);
        clearMarks();
        btn.classList.add('selected');                             // כחול-זהות, לא ירוק
        setAmir('happy');                                          // ה-turn "הצליח" — אמיר שמח
        setMishmish('celebrate');
        clearAmirAr();
        playEcho();                                                // אמיר מהדהד את ההפקה הנכונה
        // שבח קולי מוקלט (מצוין/מעולה) יגיע דרך clipMap. אסור "יופי".
        window.setTimeout(function () { setMishmish('happy'); complete(); }, 1050);
      }

      function enterLearning(btn) {                                 // טעות ראשונה → מצב-למידה
        st.phase = 'incorrect';
        btn.classList.add('retry');                                // צהוב חם, לא אדום
        setMishmish('confused-soft');
        window.setTimeout(hint, 700);
      }
      function nudgeRetry(btn) {
        btn.classList.add('retry');
        window.setTimeout(function () { btn.classList.remove('retry'); }, 900);
        hint();
      }

      // מדרג-רמז נעול: השמעה-חוזרת (אמיר שואל שוב) → הצבעה חזותית → פיגום-עאמייה.
      function hint() {
        st.phase = 'hint';
        st.hintStep++;
        setAmir('hint');
        showAmiya(st.hintStep >= 3 ? 'amiya' : (st.hintStep >= 2 ? 'point' : 'encourage'));
        playAsk(true).then(function () {
          if (st.hintStep >= 2) {                                   // שלב 2: הצבעה חזותית על הנכון
            var t = tileForCorrect();
            if (t) t.classList.add('selected');
          }
          setAmir('listening');
        }, function () { setAmir('listening'); });
      }

      // עאמייה מגודרת: רק בשלב 3. he = מדרג מ-scaffold.json (טיוטת-מיטל, מוצג);
      // ar = עאמייה (ar_verified:false) — נכתבת ל-DOM אך מוסתרת ב-CSS ולא מושמעת.
      // זהה בדיוק לחוזה-הגידור של M4 (grammar-toggle) + amir.js.
      function showAmiya(tier) {
        if (tier !== 'amiya') { clearAmirAr(); return; }
        var hintData = window.MishmishScaffold && window.MishmishScaffold.amirHint('amiya');
        var arText = (hintData && hintData.ar) || turn.askAr || '';
        if (hintData && hintData.he && els.amirHe) els.amirHe.textContent = hintData.he;
        if (els.amirAr) {
          els.amirAr.textContent = arText;                          // מגודר ע"י CSS [data-arabic-verified="false"]
          els.amirAr.setAttribute('data-arabic-verified', 'false');
        }
        // 🔴 לא מושמע: A.arabic מגודר בעצמו (ARABIC_VERIFIED=false) — אין קריאה כאן.
      }
      function clearAmirAr() { if (els.amirAr) els.amirAr.textContent = ''; }

      function complete() {
        if (st.done) return;
        st.done = true; st.phase = 'complete';
        idx++;
        window.setTimeout(mountTurn, 500);
      }

      // ── אתחול ה-turn ──
      renderReferent();
      renderTiles();
      setAmir('idle');
      setMishmish('idle');
      if (els.amirHe) els.amirHe.textContent = turn.amirAsk.he;
      clearAmirAr();
      if (turn.instruction && els.instr) els.instr.textContent = turn.instruction;
      window.setTimeout(introPlaying, 250);

      // בקר חיצוני לשורת שפת-הישרדות + כפתור-האזנה
      active = {
        replay: function (slow) { playAsk(slow).then(awaitingAnswer, awaitingAnswer); },
        hint: function () { hint(); },
        phase: function () { return st.phase; }
      };
    }

    // כפתור-האזנה + שורת שפת-הישרדות (ה-#sv-* מוזרקים מ-scaffold.json דרך MishmishScaffold)
    if (els.listen) els.listen.addEventListener('click', function () { if (active) active.replay(false); });
    if (window.MishmishScaffold) {
      window.MishmishScaffold.bind('#survival', function () {
        return active ? { replay: active.replay, hint: active.hint } : null;
      });
    }

    function finale() {
      paintProgress();
      active = null;
      if (els.doneOverlay) els.doneOverlay.classList.remove('hidden');
      setMishmish('celebrate');
      setAmir('happy');
      if (flag('peek')) showPeek();
    }

    function showPeek() {
      if (!BKT.snapshot) return;
      var box = document.createElement('pre');
      box.className = 'peek';
      box.textContent = 'מבט-מבוגר · שִׂיחָה עִם אָמִיר (BKT):\n' + JSON.stringify(BKT.snapshot(), null, 2);
      document.body.appendChild(box);
    }

    // overlay-פתיחה: מתחילים רק אחרי נגיעת-ילד (מדיניות autoplay)
    function begin() {
      if (els.introOverlay) els.introOverlay.classList.add('hidden');
      mountTurn();
    }
    if (els.startBtn) els.startBtn.addEventListener('click', begin);
    if (flag('open')) begin();
    if (els.againBtn) els.againBtn.addEventListener('click', function () { location.reload(); });

    // אם אין turns כלל (אין patterns מתאימים ואין fixture) — הודעה שקטה במקום מסך ריק
    if (!turns.length && els.introOverlay) {
      var h = els.introOverlay.querySelector('h2');
      if (h) h.textContent = 'אֵין עֲדַיִן שִׂיחָה';
    }
  }

  return { start: start };
})();
