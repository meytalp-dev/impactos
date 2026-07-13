/* ============================================================
   מישמיש — templates/mechanic-missing-slot.js  →  window.MishmishMissingSlot
   ------------------------------------------------------------
   התבנית העוצרת — עמוד-השדרה של התבניות הפוֹריות.
   מישמיש אומר בקשה מלאה על-פי תבנית ("אֲנִי רוֹצֶה בָּנָנָה"),
   המסך מציג את המשפט המנוקד עם חלל (אֲנִי רוֹצֶה ___),
   והילד בוחר את המילה שמשלימה את החלל = מה ששמע.

   🔴 חוק מבני: זהו קוד data-driven בלבד. אין כאן תוכן קשיח —
      כל התבניות/המילים נקראות מ-pack.patterns (pack-schema §2).
      עד שסוכן ה-pack יזרים patterns ל-pack, נופלים ל-fixture
      window.MISHMISH_MISSING_SLOT_DEMO (מוגדר בדף missing-slot.html,
      לא כאן ולא ב-pack) כדי שהמסך יהיה נגיש ובדיק standalone.

   חוזה נמדד (זהה ל-measured.js — לא משנים):
     · שמיעתי-קודם — האריחים נעולים עד סוף ההשמעה.
     · רק הניסיון הראשון נמדד; אחרי טעות = מצב-למידה (לא נמדד).
     · בלי אדום/ירוק — טעות = הזמנה להאזין שוב (צהוב + אוזן + מישמיש confused-soft).
     · מדרג-רמז: השמעה חוזרת (frame-עוצר-על-החלל) → הצבעה חזותית → פיגום-אמיר.
     · טקסט עאמייה מגודר עד אימות בודק ילידי.

   מדידה (bkt.js F6): KC = intent+pattern (לא פר-מילה — זו הפואנטה).
     evt.pattern = pattern.id (למשל "want"); evt.target = מזהה-המילה
     (למען סף ה-≥2-מילים-שונות שמוכיח שליטה-בתבנית, לא שינון מילה).
     dimension = "produce_supported" (רמה 2 — מפיק-בתמיכה).
     פּ/בּ בתוך משפט → pb_context:"sentence" (מבחין את ה"בתחילת-מילה מול בתוך-משפט").

   מבוסס על lantern.js (מכניקה מחזיקת-דרייבר משלה) + measured.js (החוזה).
   ============================================================ */
window.MishmishMissingSlot = (function () {
  var BKT = window.MishmishBKT, A = window.MishmishAudio;

  function q(sel) { return document.querySelector(sel); }
  function flag(name) { try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }

  var MOODS = ['idle', 'speaking', 'listening', 'thinking', 'hint', 'confused-soft', 'happy', 'celebrate'];
  function preload() {
    MOODS.forEach(function (m) { var im = new Image(); im.src = '../assets/characters/mishmish/mishmish-' + m + '.png'; });
    ['idle', 'hint', 'listening', 'happy'].forEach(function (m) { var im = new Image(); im.src = '../assets/characters/peers/amir-' + m + '.png'; });
  }

  // ── בניית רצף-הסבבים מהתבניות של ה-pack ──────────────────────
  // לכל pattern יש frame + slots (מילות-היעד האפשריות). כל סבב מכוון
  // למילה אחת; 3 אריחים = היעד + 2 מסיחים מתוך אותן slots. הפריים חוזר,
  // המילה מתחלפת — כך ה-KC (intent+pattern) נמדד על-פני ≥2 מילים שונות.
  function buildRounds(patterns) {
    var rounds = [];
    patterns.forEach(function (pat) {
      var slots = (pat.slots || []).filter(Boolean);
      if (slots.length < 3) return;                       // צריך יעד + 2 מסיחים לפחות
      slots.forEach(function (target, ti) {
        // מסיחים = 2 ה-slots הבאים במחזוריות (סדר קבוע, לא אקראי — עקבי ל-QA)
        var distractors = [slots[(ti + 1) % slots.length], slots[(ti + 2) % slots.length]];
        var options = [target].concat(distractors).map(function (s, oi) {
          return { id: s.id, he: s.he, img: s.img, correct: oi === 0 };
        });
        // סדר-אריחים קבוע פר-סבב: מסובבים לפי מיקום-היעד כדי שהנכון לא תמיד ראשון
        var rot = ti % 3;
        for (var r = 0; r < rot; r++) options.push(options.shift());

        rounds.push({
          id: pat.id + '::' + target.id,
          pattern: pat.id,
          intent: pat.intent || null,
          frame: pat.frame,                                // "אֲנִי רוֹצֶה ___"
          targetId: target.id,
          targetHe: target.he,
          // אודיו-יעד = המשפט המלא (frame + מילה) — שמיעתי-קודם, מודל להפקה.
          // audio_frame (frame שעוצר על ה-___) משמש כמודל-רמז בהשמעה-חוזרת.
          audio_he: (pat.frame_read || pat.frame).replace('___', target.he),
          audio_frame: pat.audio_frame || null,
          audio_full_key: pat.audio_key_prefix ? (pat.audio_key_prefix + target.id) : null,
          options: options,
          pb_focus: !!target.pb_focus,
          instruction: pat.instruction || null
        });
      });
    });
    return rounds;
  }

  function start() {
    if (flag('reset') && BKT.reset) BKT.reset();
    if (BKT.beginSession) BKT.beginSession();
    preload();

    // בחירת-pack בזמן-ריצה דרך ה-loader (?pack=/?mechanic=). ברירת-מחדל = market.
    var sel = window.MishmishData &&
      window.MishmishData.pick({ pack: 'market', mechanic: 'missing-slot' });
    var pack = sel && sel.pack;

    // מקור-התבניות: pack.patterns (pack-schema §2). fallback ל-fixture הדף
    // עד שסוכן ה-pack יזרים אותן. אין תוכן קשיח במכניקה עצמה.
    var demo = window.MISHMISH_MISSING_SLOT_DEMO || {};
    var patterns = (pack && pack.patterns) || demo.patterns || [];
    var rounds = buildRounds(patterns);

    var scene = demo.scene || (pack && pack.scene) || {};
    var els = {
      sceneBg: q('#scene-bg'), progress: q('#progress'),
      placeHe: q('#place-he'), placeAr: q('#place-ar'),
      sentence: q('#sentence'), gap: q('#slot-gap'),
      listen: q('#listen'), tiles: q('#tiles'),
      mishmish: q('#mishmish'), scaffold: q('#scaffold'),
      instr: q('#instr'),
      introOverlay: q('#introOverlay'), startBtn: q('#startBtn'),
      doneOverlay: q('#doneOverlay'), againBtn: q('#againBtn'), doneMsg: q('#doneMsg')
    };

    // רקע-הסצנה + שם-המקום (מסגור-גשר: מרחב מהעולם של הילד; ערבית מגודרת)
    if (scene.bg && els.sceneBg) els.sceneBg.src = '../assets/backgrounds/' + scene.bg + '.png';
    if (scene.place_he && els.placeHe) els.placeHe.textContent = scene.place_he;
    if (scene.place_ar && els.placeAr) els.placeAr.textContent = scene.place_ar;

    // שורת-התקדמות (כף פר-סבב)
    els.progress.innerHTML = '';
    rounds.forEach(function () { var p = document.createElement('span'); p.className = 'paw'; els.progress.appendChild(p); });

    var idx = 0, active = null;

    function paintProgress() {
      Array.prototype.forEach.call(els.progress.children, function (p, i) {
        p.classList.toggle('done', i < idx);
        p.classList.toggle('current', i === idx);
      });
    }

    // ── דרייבר-סבב יחיד: מכונת-מצבים תואמת-חוזה measured.js ──────
    function mountRound() {
      if (idx >= rounds.length) return finale();
      paintProgress();
      var round = rounds[idx];

      var st = { phase: 'loading', measuredDone: false, done: false, hintStep: 0 };

      function setMishmish(mood) {
        els.mishmish.src = '../assets/characters/mishmish/mishmish-' + mood + '.png';
        els.mishmish.classList.toggle('celebrate', mood === 'celebrate');
      }
      function setAmir(mood) {
        var img = els.scaffold && els.scaffold.querySelector('img');
        if (img) img.src = '../assets/characters/peers/amir-' + (mood || 'hint') + '.png';
      }

      // הצגת המשפט המנוקד עם החלל (אֲנִי רוֹצֶה ___)
      function renderSentence(filled) {
        var parts = String(round.frame).split('___');
        els.sentence.innerHTML = '';
        els.sentence.appendChild(document.createTextNode(parts[0] || ''));
        var gap = document.createElement('span');
        gap.id = 'slot-gap';
        gap.className = 'slot-gap';
        if (filled) { gap.textContent = round.targetHe; gap.classList.add('filled'); }
        else { gap.setAttribute('aria-label', 'מִלָּה חֲסֵרָה'); }
        els.sentence.appendChild(gap);
        els.sentence.appendChild(document.createTextNode(parts[1] || ''));
        els.gap = gap;
      }

      // אריחי-מילה: תמונה + מילה מנוקדת (שמיעתי-קודם; כתב = תמיכה). ≥56px.
      function renderTiles() {
        els.tiles.innerHTML = '';
        round.options.forEach(function (opt) {
          var b = document.createElement('button');
          b.className = 'tile';
          b.type = 'button';
          b.setAttribute('aria-disabled', 'true');          // נעול עד סוף ההאזנה
          b.innerHTML =
            '<img src="../assets/items/food/' + opt.img + '.png" alt="" ' +
            'onerror="this.style.visibility=\'hidden\'">' +
            '<span class="cap">' + opt.he + '</span>';
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
          return round.options[i] && round.options[i].correct;
        })[0];
      }
      function clearMarks() {
        Array.prototype.forEach.call(els.tiles.children, function (b) {
          b.classList.remove('retry', 'selected');
        });
      }

      // ── אודיו-יעד (עברית) — קליפ מוקלט אם קיים (seam), אחרת TTS-fallback חי ──
      function playTarget(slow) {
        els.listen.setAttribute('data-audio', 'playing');
        return A.hebrew(round.audio_he, {
          key: round.audio_full_key || round.id, slow: slow, statusEl: els.listen
        }).then(function () { els.listen.setAttribute('data-audio', 'idle'); },
               function () { els.listen.setAttribute('data-audio', 'idle'); });
      }
      // מודל-הרמז: ה-frame שעוצר על ה-___ (אם הוקלט). אחרת חוזרים על המשפט המלא לאט.
      function playFrameModel() {
        if (round.audio_frame) {
          return A.hebrew(round.frame.replace('___', '…'), { key: round.audio_frame, slow: true, statusEl: els.listen })
            .then(function () { els.listen.setAttribute('data-audio', 'idle'); },
                  function () { els.listen.setAttribute('data-audio', 'idle'); });
        }
        return playTarget(true);
      }

      // ── מצבים ──
      function introPlaying() {
        st.phase = 'introPlaying';
        setMishmish('speaking');
        renderSentence(false);
        enableTiles(false);
        playTarget(false).then(awaitingAnswer, awaitingAnswer);   // גם בשגיאת-אודיו — פותחים
      }
      function awaitingAnswer() {
        st.phase = 'awaitingAnswer';
        setMishmish('listening');
        enableTiles(true);
      }

      function onTile(btn, opt) {
        if (btn.getAttribute('aria-disabled') === 'true') return;

        if (!st.measuredDone) {                              // מדידה — ניסיון ראשון בלבד
          st.measuredDone = true;
          BKT.ingest && BKT.ingest({
            pattern: round.pattern,
            intent: round.intent || undefined,
            target: round.targetId,                          // מילה → סף ≥2-מילים-שונות
            dimension: 'produce_supported',                  // רמה 2 — מפיק-בתמיכה
            firstTry: true,
            correct: !!opt.correct,
            pb_focus: !!round.pb_focus,
            pb_context: 'sentence'                           // פּ/בּ בתוך משפט
          });
          if (opt.correct) return commitCorrect(btn);
          return enterLearning(btn);
        }
        if (opt.correct) return commitCorrect(btn);          // אחרי מצב-למידה: לא נמדד
        return nudgeRetry(btn);
      }

      function commitCorrect(btn) {
        st.phase = 'correct';
        enableTiles(false);
        clearMarks();
        btn.classList.add('selected');                       // כחול-זהות, לא ירוק
        renderSentence(true);                                // מילוי החלל = פידבק חזותי
        setMishmish('celebrate');
        if (els.scaffold) els.scaffold.classList.remove('show');
        // שבח קולי יגיע כקליפ מוקלט (מצוין/מעולה) — כרגע חזותי בלבד. אסור "יופי".
        window.setTimeout(function () { setMishmish('happy'); complete(); }, 950);
      }

      function enterLearning(btn) {                           // טעות ראשונה → מצב-למידה
        st.phase = 'incorrect';
        btn.classList.add('retry');                          // צהוב חם, לא אדום
        setMishmish('confused-soft');
        window.setTimeout(hint, 700);
      }
      function nudgeRetry(btn) {
        btn.classList.add('retry');
        window.setTimeout(function () { btn.classList.remove('retry'); }, 900);
        hint();
      }

      // מדרג-רמז: השמעה-חוזרת (frame) → הצבעה חזותית → פיגום-אמיר.
      function hint() {
        st.phase = 'hint';
        st.hintStep++;
        setMishmish('hint');
        if (els.scaffold) { els.scaffold.classList.add('show'); setAmir(st.hintStep >= 3 ? 'happy' : 'hint'); }
        playFrameModel().then(function () {
          if (st.hintStep >= 2) {                             // שלב 2: הצבעה חזותית על הנכון
            var t = tileForCorrect();
            if (t) t.classList.add('selected');
          }
          setMishmish('listening');
        }, function () { setMishmish('listening'); });
      }

      function complete() {
        if (st.done) return;
        st.done = true; st.phase = 'complete';
        idx++;
        window.setTimeout(mountRound, 500);
      }

      // ── אתחול הסבב ──
      renderSentence(false);
      renderTiles();
      setMishmish('idle');
      if (els.scaffold) els.scaffold.classList.remove('show');
      if (round.instruction) els.instr.textContent = round.instruction;
      window.setTimeout(introPlaying, 250);

      // בקר חיצוני לשורת שפת-הישרדות + כפתור-האזנה
      active = {
        replay: function (slow) { setMishmish('speaking'); playTarget(slow).then(awaitingAnswer, awaitingAnswer); },
        hint: function () { hint(); },
        phase: function () { return st.phase; }
      };
    }

    // כפתור-האזנה + שורת שפת-הישרדות (ה-#sv-* מוזרקים מ-scaffold.json דרך MishmishScaffold)
    els.listen.addEventListener('click', function () { if (active) active.replay(false); });
    var svAgain = q('#sv-again'), svSlow = q('#sv-slow'), svHelp = q('#sv-help');
    if (svAgain) svAgain.addEventListener('click', function () { if (active) active.replay(false); });
    if (svSlow) svSlow.addEventListener('click', function () { if (active) active.replay(true); });
    if (svHelp) svHelp.addEventListener('click', function () { if (active) active.hint(); });

    function finale() {
      paintProgress();
      active = null;
      if (els.doneOverlay) els.doneOverlay.classList.remove('hidden');
      els.mishmish.src = '../assets/characters/mishmish/mishmish-celebrate.png';
      els.mishmish.classList.add('celebrate');
      if (flag('peek')) showPeek();
    }

    function showPeek() {
      if (!BKT.snapshot) return;
      var box = document.createElement('pre');
      box.className = 'peek';
      box.textContent = 'מבט-מבוגר (BKT):\n' + JSON.stringify(BKT.snapshot(), null, 2);
      document.body.appendChild(box);
    }

    // overlay-פתיחה: מתחילים רק אחרי נגיעת-ילד (מדיניות autoplay)
    function begin() {
      if (els.introOverlay) els.introOverlay.classList.add('hidden');
      mountRound();
    }
    if (els.startBtn) els.startBtn.addEventListener('click', begin);
    else begin();
    if (els.againBtn) els.againBtn.addEventListener('click', function () { location.reload(); });

    // אם אין תבניות כלל (אין pack.patterns ואין fixture) — הודעה שקטה במקום מסך ריק
    if (!rounds.length) {
      if (els.introOverlay) {
        var h = els.introOverlay.querySelector('h2');
        if (h) h.textContent = 'אֵין עֲדַיִן תַּבְנִיּוֹת';
      }
    }
  }

  return { start: start };
})();
