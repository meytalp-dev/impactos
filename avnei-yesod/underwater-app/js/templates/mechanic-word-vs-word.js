// ============================================================================
// templates/mechanic-word-vs-word.js — Word vs Word mechanic (אי 5)
// סוכן 30 · 30.5.2026
//
// השמע מילה (target) → ילדה רואה 2 מילים דומות ובוחרת את הנכונה.
// פדגוגי: אבחנה דקה בין מילים דומות (למשל קַר vs קָם — שתיהן ק+? של 2 אותיות).
// תבנית: בהשראת mechanic-cv-vs-cv של אי 4.
// ============================================================================

(function () {
  'use strict';

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function getWA() {
    return (typeof window !== 'undefined') ? window.AvneiWordAdapter : null;
  }

  function playWord(text) {
    if (typeof window === 'undefined' || !window.AvneiAudio) return;
    const WA = getWA();
    const key = WA ? WA.wordAudioKey(text) : null;
    if (key) {
      try { window.AvneiAudio.play(key); } catch (e) {}
    }
  }

  // Pick the "most similar" distractor — מילה באותה אות-ראש או אורך.
  function pickSimilarDistractor(word) {
    const WA = getWA();
    if (!WA) return null;
    const sameLevel = WA.getWords(word.level || WA.classifyWordLevel(word.text))
      .filter(function (w) { return w.text !== word.text; });
    // עדיפות לאותה אות-ראש (פעם 1).
    const sameFirst = sameLevel.filter(function (w) { return w.first_letter === word.first_letter; });
    const pool = sameFirst.length > 0 ? sameFirst : sameLevel;
    return pool[Math.floor(Math.random() * pool.length)] || null;
  }

  function mount(root, opts) {
    const WA = getWA();
    if (!WA) return { unmount: function () {} };
    const word = opts.word;
    if (!word || !word.text) return { unmount: function () {} };

    const distractor = pickSimilarDistractor(word);
    if (!distractor) {
      console.warn('[mechanic-word-vs-word] לא נמצא distractor — נופל ל-tap-word');
      if (window.AvneiMechanics && window.AvneiMechanics['tap-word']) {
        return window.AvneiMechanics['tap-word'].mount(root, opts);
      }
      return { unmount: function () {} };
    }

    const wordLevel = word.level || WA.classifyWordLevel(word.text);
    const firstLetter = word.first_letter;
    const questId = opts.questId || ('isl05-word-vs-' + (word.key || WA.wordKey(word.text)));
    const choices = shuffle([word, distractor]);

    root.innerHTML = '';
    root.classList.add('mechanic-word-vs-word');

    const prompt = document.createElement('div');
    prompt.className = 'word-vs-prompt';
    prompt.innerHTML =
      '<button type="button" class="word-vs-speaker" aria-label="הקש לשמוע">🔊</button>' +
      '<span class="word-vs-label">בְּאֵיזוֹ מִילָּה שָׁמַעְתֶּם?</span>';
    root.appendChild(prompt);

    const field = document.createElement('div');
    field.className = 'word-vs-field';
    root.appendChild(field);

    const state = { attempts: 0, locked: false, startTime: Date.now(), hintTimer: null };
    const tiles = [];
    choices.forEach(function (w) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'word-vs-tile';
      tile.dataset.text = w.text;
      tile.dataset.isTarget = (w.text === word.text) ? '1' : '0';
      tile.textContent = w.text;
      tile.addEventListener('click', function () { handleTap(tile, w); });
      field.appendChild(tile);
      tiles.push(tile);
    });

    setTimeout(function () { playWord(word.text); }, 350);

    function handleTap(tile, w) {
      if (state.locked) return;
      if (tile.classList.contains('lit')) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      const isCorrect = (w.text === word.text);
      const rt = Date.now() - state.startTime;

      if (window.AvneiEventLogger) {
        try {
          window.AvneiEventLogger.logActivityResult({
            activity_type: 'word-vs-word',
            target_word_length: wordLevel,
            target_letter: firstLetter,
            target_word: word.text,
            tapped_word: w.text,
            distractor_word: distractor.text,
            item_id: questId + '-trial-1',
            supportLevel: 1,
            is_correct: isCorrect,
            attempts: state.attempts + 1,
            response_time_ms: isCorrect ? rt : null,
            hint_used: state.attempts >= 1,
            primary_island_id: 5,
            secondary_island_ids: [4],
          });
        } catch (e) {}
      }

      if (isCorrect) {
        tile.classList.add('lit');
        state.locked = true;
        playWord(word.text);
        if (typeof opts.onUnitWon === 'function') opts.onUnitWon(0);
        setTimeout(function () {
          if (typeof opts.onComplete === 'function') opts.onComplete();
        }, 1100);
      } else {
        state.attempts++;
        tile.classList.add('wrong-sway');
        setTimeout(function () { tile.classList.remove('wrong-sway'); }, 700);
        if (state.attempts >= 2) {
          const target = tiles.find(function (t) { return t.dataset.isTarget === '1'; });
          if (target) target.classList.add('hint-glow');
          if (window.AvneiNoni) try { window.AvneiNoni.setState('hint'); } catch (e) {}
          setTimeout(function () { playWord(word.text); }, 300);
        }
      }
    }

    prompt.querySelector('.word-vs-speaker').addEventListener('click', function () {
      playWord(word.text);
    });

    state.hintTimer = setTimeout(function () {
      if (state.locked) return;
      const target = tiles.find(function (t) { return t.dataset.isTarget === '1'; });
      if (target) target.classList.add('hint-glow');
      playWord(word.text);
    }, 9000);

    return {
      unmount: function () {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
        root.innerHTML = '';
        root.classList.remove('mechanic-word-vs-word');
      },
    };
  }

  window.AvneiMechanics = window.AvneiMechanics || {};
  window.AvneiMechanics['word-vs-word'] = { mount: mount };
})();
