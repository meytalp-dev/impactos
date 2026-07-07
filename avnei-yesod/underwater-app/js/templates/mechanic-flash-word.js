// ============================================================================
// templates/mechanic-flash-word.js — ליבת "שטף מילה" (אי 6 · אוטומטיזציה)
// לוח בניית האיים N6 · 7.7.2026
//
// טריאל בודד: מילה מוכרת מופיעה על דג לזמן קצר (flash) ואז נעלמת — הילד.ה
// בוחר.ת אותה מבין 3 מילים כתובות. המדידה = זמן-תגובה לְמַגָּע (response_time_ms),
// לא הקראה קולית (לקח 3.7: דיוק קולי לא אמין ל-BKT). אין טיימר גלוי ואין
// "נכשלת בגלל זמן": חלון ה-flash שולט רק בזמן התצוגה של המילה — הבחירה עצמה
// פתוחה עד לתשובה נכונה.
//
// 🔴 עקרון-מדידה: response_time_ms נמדד מרגע שהאופציות נעשות לחיצות ועד ההקשה.
//   נשמר ל-BKT רק על תשובה נכונה (fluency = מהירות זיהוי נכון). טעות → sway +
//   הצגה-מחדש איטית יותר (הזדמנות נוספת), response_time_ms=null.
//
// דפוס-הדגש (ב/כ/פ) והמילים — מגיעים מ-word-adapter (anchor words שכבר נלמדו +
// אודיו word-<key>.mp3 קיים). אין המצאת מילים.
//
// חוזה config:
//   mount(root, {
//     target:  { text_he, audio_key },          // המילה שמהבזיקה על הדג
//     options: [ { text_he, is_correct:bool } ], // 3 מילים כתובות (fish tiles)
//     flashMs: number|null,                      // חלון תצוגת המילה; null = נשארת גלויה (repeat mode)
//     variant,                                   // 'flash' | 'repeat'  (activity_variant)
//     item_id, target_letter, target_word,       // logging (target_word רוכב על item_id — ראו הערה)
//     primary_island_id,                         // = 6
//     promptLine,                                // בועת-נוני (מוצג ע"י ה-host)
//     onResult(ctx),  // {correct, response_time_ms, attempts, slow}  — ה-host מכוונן flashMs הבא
//     onComplete()
//   })
//
// הערת-logging: לסכמת-האירועים אין שדה target_word (event-logger נעול — אסור לגעת).
//   לכן המילה המדויקת רוכבת ב-item_id ('isl6-flash-<key>' / 'isl6-repeat-<key>-rN'),
//   וה-target_letter נושא את האות הראשונה (ערך למורה; EPA אי-6 מבודד, לא מזהם איים).
// ============================================================================

(function () {
  'use strict';

  var INTER_ITEM_DELAY_MS = 1050;
  var SWAY_MS = 650;
  var SLOW_MS = 4000;           // מעל זה = "איטי" → ה-host מאריך את ה-flash הבא
  var REFLASH_FACTOR = 1.7;     // הצגה-מחדש אחרי טעות = ארוכה יותר
  var IDLE_HINT_MS = 9000;

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function noni(state) {
    if (typeof window !== 'undefined' && window.AvneiNoni) {
      try { window.AvneiNoni.setState(state); } catch (e) {}
    }
  }

  function playKey(key) {
    if (key && typeof window !== 'undefined' && window.AvneiAudio) {
      try { return window.AvneiAudio.play(key); } catch (e) {}
    }
    return null;
  }

  // ----------------------------------------------------------------------------
  // payload ל-logActivityResult — פונקציה טהורה (חשופה לבדיקות).
  // ----------------------------------------------------------------------------
  function buildLogPayload(opts, isCorrect, ctx) {
    return {
      activity_type:     'flash-word',
      activity_variant:  opts.variant || (opts.flashMs ? 'flash' : 'repeat'),
      item_id:           opts.item_id || null,     // נושא את מפתח-המילה (target_word)
      target_letter:     opts.target_letter || null,
      is_correct:        !!isCorrect,
      primary_island_id: (typeof opts.primary_island_id === 'number') ? opts.primary_island_id : 6,
      supportLevel:      1,
      attempts:          (ctx && typeof ctx.attempts === 'number') ? ctx.attempts : 1,
      // 🔴 שטף — RT נשמר רק על תשובה נכונה.
      response_time_ms:  isCorrect ? ((ctx && ctx.response_time_ms) || null) : null,
      hint_used:         !!(ctx && ctx.hint_used),
    };
  }

  function logResult(opts, isCorrect, ctx) {
    if (typeof window === 'undefined' || !window.AvneiEventLogger) return null;
    try {
      return window.AvneiEventLogger.logActivityResult(buildLogPayload(opts, isCorrect, ctx));
    } catch (e) { return null; }
  }

  // ----------------------------------------------------------------------------
  // mount
  // ----------------------------------------------------------------------------
  function mount(root, opts) {
    opts = opts || {};
    var target = opts.target || { text_he: '', audio_key: null };
    var options = Array.isArray(opts.options) ? opts.options.slice() : [];
    if (!options.length) return { unmount: function () {} };

    var flashMs = (typeof opts.flashMs === 'number' && opts.flashMs > 0) ? opts.flashMs : null;

    var state = {
      attempts: 0,
      locked: false,
      revealed: false,          // האם האופציות כבר לחיצות
      startTime: 0,             // מתי האופציות נעשו לחיצות
      hideTimer: null,
      hintTimer: null,
      slow: false,
    };

    root.innerHTML = '';
    root.classList.add('mechanic-flash-word');
    if (opts.theme) root.classList.add('theme-' + opts.theme);

    // אזור-ההבזק: דג שנושא את המילה.
    var stage = document.createElement('div');
    stage.className = 'fw-stage';
    var fish = document.createElement('div');
    fish.className = 'fw-fish';
    var wordEl = document.createElement('span');
    wordEl.className = 'fw-word'; wordEl.lang = 'he';
    wordEl.textContent = target.text_he || '';
    fish.appendChild(wordEl);
    // כפתור-האזנה חוזרת (לא נמדד) — עוזר לילד.ה בלי לחשוף את התשובה בכתב.
    var replay = document.createElement('button');
    replay.type = 'button'; replay.className = 'fw-replay';
    replay.setAttribute('aria-label', 'לְהַאֲזִין שׁוּב');
    replay.innerHTML = '<span aria-hidden="true">🔊</span>';
    replay.addEventListener('click', function () { playKey(target.audio_key); });
    stage.appendChild(fish);
    stage.appendChild(replay);
    root.appendChild(stage);

    // שדה-האופציות (דגי-מילים).
    var field = document.createElement('div');
    field.className = 'fw-options';
    field.setAttribute('role', 'radiogroup');
    if (opts.promptLine) field.setAttribute('aria-label', opts.promptLine);
    root.appendChild(field);

    var feedback = document.createElement('div');
    feedback.className = 'fw-feedback'; feedback.setAttribute('aria-live', 'polite');
    root.appendChild(feedback);

    var tiles = [];
    shuffle(options).forEach(function (opt) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'fw-option';
      tile.setAttribute('role', 'radio');
      tile.setAttribute('aria-checked', 'false');
      tile.dataset.correct = opt.is_correct ? '1' : '0';
      var span = document.createElement('span');
      span.className = 'fw-option__label'; span.lang = 'he';
      span.textContent = opt.text_he || '';
      tile.appendChild(span);
      tile.setAttribute('aria-label', opt.text_he || '');
      tile.addEventListener('click', function () { handleTap(tile, opt); });
      field.appendChild(tile);
      tiles.push(tile);
    });

    function targetTiles() {
      return tiles.filter(function (t) { return t.dataset.correct === '1'; });
    }

    // חושף את האופציות ומתחיל את מדידת הזמן.
    function revealOptions() {
      if (state.revealed) return;
      state.revealed = true;
      state.startTime = Date.now();
      field.classList.add('is-revealed');
      state.hintTimer = setTimeout(triggerHint, IDLE_HINT_MS);
    }

    // מציג את המילה על הדג למשך ms ואז מסתיר (דג צולל) — ואז חושף אופציות.
    function flashWord(ms, opts2) {
      opts2 = opts2 || {};
      if (state.hideTimer) { clearTimeout(state.hideTimer); state.hideTimer = null; }
      fish.classList.remove('is-hidden', 'is-diving');
      wordEl.style.visibility = 'visible';
      state.hideTimer = setTimeout(function () {
        fish.classList.add('is-diving');
        setTimeout(function () {
          wordEl.style.visibility = 'hidden';
          fish.classList.add('is-hidden');
          if (!opts2.noReveal) revealOptions();
        }, 420);   // משך אנימציית-הצלילה
      }, ms);
    }

    // הצגה-מחדש אחרי טעות/רמז — ארוכה יותר, ואז חוזרים לאופציות בלי לאפס מדידה.
    function reflash() {
      var ms = flashMs ? Math.round(flashMs * REFLASH_FACTOR) : 900;
      fish.classList.remove('is-hidden', 'is-diving');
      wordEl.style.visibility = 'visible';
      playKey(target.audio_key);
      if (state.hideTimer) { clearTimeout(state.hideTimer); state.hideTimer = null; }
      state.hideTimer = setTimeout(function () {
        fish.classList.add('is-diving');
        setTimeout(function () { wordEl.style.visibility = 'hidden'; fish.classList.add('is-hidden'); }, 420);
      }, ms);
    }

    function triggerHint() {
      state.hintTimer = null;
      if (state.locked) return;
      noni('hint');
      targetTiles().forEach(function (t) { t.classList.add('hint-glow'); });
      reflash();
    }

    function handleTap(tile, opt) {
      if (state.locked || !state.revealed) return;
      if (tile.classList.contains('picked')) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }

      var isCorrect = !!opt.is_correct;
      var rt = Date.now() - state.startTime;
      state.attempts++;
      if (isCorrect && rt > SLOW_MS) state.slow = true;

      logResult(opts, isCorrect, {
        attempts: state.attempts,
        response_time_ms: rt,
        hint_used: state.attempts > 1,
      });

      tile.setAttribute('aria-checked', 'true');
      if (isCorrect) { state.locked = true; onCorrect(tile, rt); }
      else onWrong(tile);
    }

    function onCorrect(tile, rt) {
      tile.classList.add('picked');
      noni('cheer');
      feedback.textContent = 'יֵשׁ!';
      feedback.className = 'fw-feedback fw-feedback--ok';
      // דג-המילה חוזר לשחות עם המילה — פידבק ויזואלי בלבד (בלי חזרת-אודיו).
      fish.classList.remove('is-hidden', 'is-diving');
      wordEl.style.visibility = 'visible';
      fish.classList.add('is-won');
      if (typeof opts.onResult === 'function') {
        try { opts.onResult({ correct: true, response_time_ms: rt, attempts: state.attempts, slow: state.slow }); } catch (e) {}
      }
      setTimeout(function () {
        if (typeof opts.onComplete === 'function') { try { opts.onComplete(); } catch (e) {} }
      }, INTER_ITEM_DELAY_MS);
    }

    function onWrong(tile) {
      tile.setAttribute('aria-checked', 'false');
      tile.classList.add('wrong-sway');
      setTimeout(function () { tile.classList.remove('wrong-sway'); }, SWAY_MS);
      noni('hint');
      // אף פעם לא "נכשלת" — מציגים שוב את המילה איטי יותר ונותנים הזדמנות נוספת.
      targetTiles().forEach(function (t) { t.classList.add('hint-glow'); });
      setTimeout(reflash, 380);
    }

    // --- הפעלה ---
    playKey(target.audio_key);           // הנחיה שמיעתית פעם אחת ב-mount
    noni('idle');
    if (flashMs) {
      // מצב הבזק: המילה מוצגת flashMs ואז צוללת → אופציות.
      setTimeout(function () { flashWord(flashMs); }, 500);
    } else {
      // מצב חוזר (repeated reading): המילה נשארת גלויה, אופציות מיד.
      setTimeout(revealOptions, 500);
    }

    return {
      unmount: function () {
        if (state.hideTimer) clearTimeout(state.hideTimer);
        if (state.hintTimer) clearTimeout(state.hintTimer);
        root.innerHTML = '';
        root.classList.remove('mechanic-flash-word');
        if (opts.theme) root.classList.remove('theme-' + opts.theme);
      },
    };
  }

  if (typeof window !== 'undefined') {
    window.AvneiMechanics = window.AvneiMechanics || {};
    window.AvneiMechanics['flash-word'] = { mount: mount, _buildLogPayload: buildLogPayload };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mount: mount, buildLogPayload: buildLogPayload };
  }
})();
