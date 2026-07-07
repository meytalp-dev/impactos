// ============================================================================
// templates/mechanic-sentence-build.js — Sentence-build mechanic
// אי 21 · לגונת הבקבוקים · "דיקטה בבנייה" · H21 · 7.7.2026
//
// אחות ברמה גבוהה יותר של mechanic-word-spell (אי 20): שם בונים *מילה* מצירופי-CV;
// כאן בונים *משפט* ממילים שלמות. נוני משמיעה משפט קצר (2–4 מילים) — הילד.ה לא רואה
// אותו — ומרכיב.ה אותו מאריחי-המילים לפי הסדר, מימין לשמאל.
//
// עקרונות עולם (זהים לאי 20 — עקביות ויזואלית):
//   • טעות = האריח רוטט ונשאר במאגר ("חוזר בעדינות"); נוני מהנהנת. אחרי 2 טעויות
//     על אותה משבצת → רמז: האריח הנכון מהבהב.
//   • כל אריח ניתן להשמעה בלחיצה ארוכה (500ms) — האזנה, לא נמדדת (כמו two-tap).
//     ההקשה הרגילה = הבחירה הנמדדת.
//   • אודיו-הנחיה (המשפט) פעם אחת ב-mount; אחרי הקשה נכונה — פידבק ויזואלי +
//     צליל-המילה שהונחה. בסיום — המשפט מתגלה ומתנגן שלם.
//
// 🔴 שני צירי-כישלון מובחנים (בקשת המשימה):
//   • word-choice — הוקש אריח-מסיח שאינו במשפט כלל.
//   • word-order  — הוקש אריח שכן במשפט אך לא במיקום הנוכחי.
//   שניהם מדווחים ב-activity_variant (המבנה מאפשר — שדה חופשי ב-event schema);
//   ל-EPA (failure_type ∈ ערכים נעולים) שניהם ממופים ל-'Comprehension' (בניית-
//   המשמעת של מה שנשמע). לא הומצא ערך-EPA חדש (epa.js נעול).
//
// logging (event-logger.logActivityResult):
//   primary_island_id = opts.islandId (default 21 → BKT אי 21) · strand_id=4.
//   activity_type='sentence-build' · characteristic_id=opts.sentence.id (יחידת-EPA).
//   activity_variant = 'placed' | 'word-order-error' | 'word-choice-error'.
//   target_letter = אות ראשונה של המילה הראשונה (ערך משני למורה).
//   is_correct/attempts/hint_used פר-הקשה. הקשה-ארוכה (האזנה) אינה מדווחת.
// ============================================================================

(function () {
  'use strict';

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function playAudio(key) {
    if (typeof window === 'undefined' || !window.AvneiAudio || !key) return;
    try { window.AvneiAudio.play(key); } catch (e) {}
  }

  // שליטת-נוני עוברת לדף דרך opts.onNoni(state) → PNG.
  function makeNoni(opts) {
    return function (state) {
      if (typeof opts.onNoni === 'function') { try { opts.onNoni(state); } catch (e) {} }
    };
  }

  function firstBaseLetter(text) {
    if (!text) return null;
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      if (code >= 0x05D0 && code <= 0x05EA) return text[i];
    }
    return null;
  }

  // --------------------------------------------------------------------------
  // mount(root, opts)
  //   opts.sentence    — {id, text, audio, words:[{text, slug}, ...]}
  //   opts.questId     — מזהה אירוע
  //   opts.islandId    — default 21
  //   opts.distractors — כמות מסיחות (default: 1 ל-2 מילים, 2 ל-3+)
  //   opts.onNoni(state)
  //   opts.onUnitWon(i)
  //   opts.onComplete({clean}) — clean=true אם אף הקשה שגויה לא קרתה
  // --------------------------------------------------------------------------
  function mount(root, opts) {
    var SB = (typeof window !== 'undefined') ? window.AvneiIsland21Sentences : null;
    var sentence = opts.sentence;
    if (!sentence || !Array.isArray(sentence.words) || sentence.words.length < 2) {
      console.error('[mechanic-sentence-build] opts.sentence לא תקין');
      return { unmount: function () {} };
    }

    var words = sentence.words;
    var islandId = (typeof opts.islandId === 'number') ? opts.islandId : 21;
    var setNoni = makeNoni(opts);
    var questId = opts.questId || ('isl21-sentence-' + sentence.id);
    var nDistract = (opts.distractors == null)
      ? (words.length <= 2 ? 1 : 2)
      : opts.distractors;

    // מסיחים (מילים שאינן במשפט)
    var distractors = (SB && SB.distractorsFor) ? SB.distractorsFor(sentence, nDistract) : [];

    root.innerHTML = '';
    root.classList.add('mechanic-sentence-build');

    // Prompt — בלי טקסט-המשפט! רק הנחיה + כפתור השמעה חוזרת של המשפט.
    var prompt = document.createElement('div');
    prompt.className = 'sb-prompt';
    var hearBtn = document.createElement('button');
    hearBtn.type = 'button';
    hearBtn.className = 'sb-hear';
    hearBtn.setAttribute('aria-label', 'הקשיבו למשפט שוב');
    hearBtn.innerHTML = '<span class="sb-hear-ico" aria-hidden="true">🔊</span>' +
      '<span class="sb-hear-label">הַקְשִׁיבוּ לַמִּשְׁפָּט</span>';
    prompt.appendChild(hearBtn);
    root.appendChild(prompt);

    // Build area — משבצות ריקות שמתמלאות מילים. המשפט מתגלה שלם בסוף.
    var buildArea = document.createElement('div');
    buildArea.className = 'sb-build';
    buildArea.setAttribute('aria-label', 'שורת בניית המשפט');
    root.appendChild(buildArea);
    var slots = [];
    words.forEach(function (w, i) {
      var slot = document.createElement('span');
      slot.className = 'sb-slot';
      slot.dataset.idx = String(i);
      slot.textContent = '·';
      buildArea.appendChild(slot);
      slots.push(slot);
    });

    // Field — אריחי-מילים (מילות המשפט + מסיחים), מעורבב.
    var field = document.createElement('div');
    field.className = 'sb-field';
    root.appendChild(field);

    var poolItems = shuffle(
      words.map(function (w) { return { text: w.text, slug: w.slug, isDistractor: false }; })
        .concat(distractors.map(function (w) { return { text: w.text, slug: w.slug, isDistractor: true }; }))
    );

    var state = { nextIdx: 0, attempts: 0, wrongTotal: 0, locked: false, startTime: Date.now() };
    var tiles = [];

    poolItems.forEach(function (item) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'sb-tile';
      tile.dataset.slug = item.slug;
      tile.dataset.distractor = item.isDistractor ? '1' : '0';
      tile.lang = 'he';
      tile.textContent = item.text;
      tile.setAttribute('aria-label', 'מילה ' + item.text);
      attachTile(tile, item);
      field.appendChild(tile);
      tiles.push(tile);
    });

    hearBtn.addEventListener('click', function () {
      if (state.locked) return;
      playAudio(sentence.audio);
    });

    // הנחיה קולית פעם אחת ב-mount: המשפט מושמע (זו ההכתבה).
    setTimeout(function () { playAudio(sentence.audio); }, 350);

    // long-press = האזנה למילה (לא נמדד); tap = בחירה (נמדד).
    function attachTile(tile, item) {
      var pressTimer = null;
      var longPressed = false;
      function startPress() {
        longPressed = false;
        if (pressTimer) clearTimeout(pressTimer);
        pressTimer = setTimeout(function () {
          longPressed = true;
          tile.classList.add('listening');
          playAudio('isl21-word-' + item.slug);
          setTimeout(function () { tile.classList.remove('listening'); }, 500);
        }, 500);
      }
      function cancelPress() { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } }
      tile.addEventListener('pointerdown', startPress);
      tile.addEventListener('pointerup', cancelPress);
      tile.addEventListener('pointercancel', cancelPress);
      tile.addEventListener('pointerleave', cancelPress);
      tile.addEventListener('click', function () {
        if (longPressed) { longPressed = false; return; } // האזנה, לא בחירה
        handleTap(tile, item);
      });
    }

    function isInSentence(slug) {
      return words.some(function (w) { return w.slug === slug; });
    }

    function log(variant, isCorrect, responseTime) {
      if (!window.AvneiEventLogger || typeof window.AvneiEventLogger.logActivityResult !== 'function') return;
      try {
        window.AvneiEventLogger.logActivityResult({
          activity_type: 'sentence-build',
          activity_variant: variant,
          characteristic_id: sentence.id,
          target_letter: firstBaseLetter(words[0] && words[0].text),
          item_id: questId + '-slot-' + (state.nextIdx + 1),
          supportLevel: 1,
          is_correct: isCorrect,
          attempts: state.attempts + 1,
          response_time_ms: isCorrect ? responseTime : null,
          hint_used: state.attempts >= 2,
          // word-choice/word-order → EPA 'Comprehension' (בניית-משמעות הנשמע);
          // ההבחנה הדקה חיה ב-activity_variant. correct → null.
          failure_type: isCorrect ? null : 'Comprehension',
          primary_island_id: islandId,
          strand_id: 4,
          secondary_island_ids: [14],
        });
      } catch (e) { /* swallow */ }
    }

    function handleTap(tile, item) {
      if (state.locked || tile.classList.contains('placed')) return;
      var expected = words[state.nextIdx];
      var isCorrect = (item.slug === expected.slug);
      var responseTime = Date.now() - state.startTime;

      if (isCorrect) {
        log('placed', true, responseTime);
        onRight(tile, item);
      } else {
        var variant = item.isDistractor || !isInSentence(item.slug)
          ? 'word-choice-error'   // מסיח — מילה שאינה במשפט
          : 'word-order-error';   // מילה נכונה, מיקום שגוי
        log(variant, false, null);
        onWrong(tile, variant);
      }
    }

    function onRight(tile, item) {
      tile.classList.remove('hint-glow');
      tile.classList.add('placed');
      tile.disabled = true;

      var slot = slots[state.nextIdx];
      if (slot) { slot.textContent = item.text; slot.classList.add('filled'); }
      playAudio('isl21-word-' + item.slug);
      setNoni('happy');

      state.nextIdx++;
      state.attempts = 0;
      state.startTime = Date.now();

      if (typeof opts.onUnitWon === 'function') { try { opts.onUnitWon(state.nextIdx - 1); } catch (e) {} }

      if (state.nextIdx >= words.length) {
        state.locked = true;
        buildArea.classList.add('complete');
        setTimeout(function () { playAudio(sentence.audio); }, 300);
        setTimeout(function () {
          if (typeof opts.onComplete === 'function') {
            try { opts.onComplete({ clean: state.wrongTotal === 0 }); } catch (e) {}
          }
        }, 1400);
      }
    }

    function onWrong(tile, variant) {
      state.attempts++;
      state.wrongTotal++;
      tile.classList.remove('sb-sway', 'sb-sway-order');
      void tile.offsetWidth;
      // ציר שונה = פידבק ויזואלי שונה (סדר=נדנוד ענבר, מילה=נדנוד רגיל).
      tile.classList.add(variant === 'word-order-error' ? 'sb-sway-order' : 'sb-sway');
      setTimeout(function () { tile.classList.remove('sb-sway', 'sb-sway-order'); }, 650);
      setNoni('thinking');

      if (state.attempts >= 2) {
        var expected = words[state.nextIdx];
        var hintTile = tiles.find(function (t) {
          return !t.classList.contains('placed') && t.dataset.slug === expected.slug;
        });
        if (hintTile) { hintTile.classList.add('hint-glow'); setNoni('surprised'); }
      }
    }

    return {
      unmount: function () {
        root.innerHTML = '';
        root.classList.remove('mechanic-sentence-build');
      },
    };
  }

  window.AvneiMechanics = window.AvneiMechanics || {};
  window.AvneiMechanics['sentence-build'] = { mount: mount };
})();
