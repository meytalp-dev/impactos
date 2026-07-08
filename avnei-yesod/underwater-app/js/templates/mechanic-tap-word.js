// ============================================================================
// templates/mechanic-tap-word.js — Tap-Word mechanic (אי 5 — אי מיזוג מילים)
// סוכן 30 · 30.5.2026
//
// השמע מילה (target) → ילדה מקישה על המילה הנכונה מתוך 4 אופציות.
// תבנית: מקבילה ל-mechanic-pick של אי 1+2 — אבל עם word target.
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

  function pickDistractors(allCandidates, target, n) {
    const pool = allCandidates.filter(function (w) { return w.text !== target.text; });
    return shuffle(pool).slice(0, n);
  }

  function mount(root, opts) {
    const WA = getWA();
    if (!WA) {
      console.error('[mechanic-tap-word] AvneiWordAdapter חסר');
      return { unmount: function () {} };
    }
    const word = opts.word;
    if (!word || !word.text) {
      console.error('[mechanic-tap-word] opts.word חסר');
      return { unmount: function () {} };
    }
    const numTrials = (opts.numTrials && opts.numTrials > 0) ? opts.numTrials : 1;
    const wordLevel = word.level || WA.classifyWordLevel(word.text);
    const firstLetter = word.first_letter || (WA.decomposeWord(word.text)[0] || {}).letter;
    const questId = opts.questId || ('isl05-tap-word-' + (word.key || WA.wordKey(word.text)));

    // Distractor pool: כל המילים באותו אורך (level) — קשה יותר משונה.
    const sameLevel = WA.getWords(wordLevel);
    const distractors = pickDistractors(sameLevel, word, 3);
    const choices = shuffle([word].concat(distractors));

    root.innerHTML = '';
    root.classList.add('mechanic-tap-word');

    const prompt = document.createElement('div');
    prompt.className = 'tap-word-prompt';
    prompt.innerHTML =
      '<button type="button" class="tap-word-prompt__speaker" aria-label="הקישו לשמוע מילה">🔊</button>' +
      '<span class="tap-word-prompt__label">בְּאֵיזוֹ מִילָּה שָׁמַעְתֶּם?</span>';
    root.appendChild(prompt);

    const field = document.createElement('div');
    field.className = 'tap-word-field';
    root.appendChild(field);

    const state = {
      attempts: 0,
      locked: false,
      hintTimer: null,
      startTime: Date.now(),
    };

    const tiles = [];
    choices.forEach(function (w) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'tap-word-tile';
      tile.dataset.text = w.text;
      tile.dataset.isTarget = (w.text === word.text) ? '1' : '0';
      tile.textContent = w.text;
      tile.setAttribute('aria-label', 'מילה ' + w.text);
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
            activity_type: 'word-tap',
            target_word_length: wordLevel,
            target_letter: firstLetter,
            target_word: word.text,
            tapped_word: w.text,
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

    prompt.querySelector('.tap-word-prompt__speaker').addEventListener('click', function () {
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
        root.classList.remove('mechanic-tap-word');
      },
    };
  }

  window.AvneiMechanics = window.AvneiMechanics || {};
  window.AvneiMechanics['tap-word'] = { mount: mount };
})();
