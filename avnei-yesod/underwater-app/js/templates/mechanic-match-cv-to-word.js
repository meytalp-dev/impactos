// ============================================================================
// templates/mechanic-match-cv-to-word.js — Match CV to word (אי 4)
// סוכן 29 · 29.5.2026 ערב
//
// משימה: ה-CV מוצג בראש המסך. 3 כפתורי מילים בעברית מנוקדת. הילדה בוחרת
// את המילה שמתחילה ב-CV.
//
// Audio:
//   • Auto-play של ה-CV אחרי mount (cv-<letter_key>-<vowel_id>.mp3).
//   • Tap על כפתור מילה → השמע את המילה (word-<letter_key>-<vowel_id>.mp3) + check.
//
// chalupa B: גם sister vowel של ה-CV נחשב נכון (כי שניהם /a/). הלוגיקה:
//   target words = anchor words על letter X + vowel ב-phonemeGroup של ה-target.
//   distractor words = anchor words מ-phonemeGroups *שונים* (משלוף 2 רנדומלי).
//
// אם אין anchor words ל-target — דלג (mechanic מחזיר {unmount} ריק וקורא ל-onComplete).
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

  function playKey(key) {
    if (window.AvneiAudio && typeof window.AvneiAudio.play === 'function' && key) {
      window.AvneiAudio.play(key);
    }
  }

  function playCV(letter, vowelId) {
    const VA = window.AvneiVowelAdapter;
    if (!VA) return;
    const key = VA.cvAudioKey(letter, vowelId);
    if (key && window.AvneiAudio) { window.AvneiAudio.play(key); return; }
    // fallback Web Speech
    if ('speechSynthesis' in window) {
      try {
        const u = new SpeechSynthesisUtterance(VA.buildCV(letter, vowelId));
        u.lang = 'he-IL'; u.rate = 0.85;
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
      } catch (e) {}
    }
  }

  function playWord(audioKey, fallbackText) {
    if (window.AvneiAudio && audioKey) { window.AvneiAudio.play(audioKey); return; }
    if ('speechSynthesis' in window && fallbackText) {
      try {
        const u = new SpeechSynthesisUtterance(fallbackText);
        u.lang = 'he-IL'; u.rate = 0.85;
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
      } catch (e) {}
    }
  }

  function mount(root, opts) {
    const VA = window.AvneiVowelAdapter;
    if (!VA) return { unmount: function () {} };

    const letter = opts.letter;
    const vowelId = opts.vowelId;
    const numTrials = (opts.numTrials && opts.numTrials > 0) ? opts.numTrials : 3;
    const questId = opts.questId || ('isl04-wordmatch-' + letter + '-' + vowelId);

    const phonemeGroup = VA.getPhonemeGroup(vowelId);
    const targetWords = VA.getAnchorWordsForPhonemeGroup(letter, phonemeGroup);
    if (targetWords.length === 0) {
      // אין anchor words לקבוצה הזו — דלג ל-onComplete מיידית
      console.warn('[match-cv-to-word] no anchor words for ' + letter + ' group=' + phonemeGroup +
                   ' — skipping round');
      setTimeout(function () {
        if (typeof opts.onComplete === 'function') opts.onComplete();
      }, 50);
      return { unmount: function () {} };
    }

    const allAnchors = VA.getAllAnchorWords();
    const distractorPool = allAnchors.filter(function (w) {
      // distractor = phoneme group שונה לחלוטין (לא אותה kelter group)
      return w.phonemeGroup !== phonemeGroup;
    });
    if (distractorPool.length < 2) {
      console.warn('[match-cv-to-word] distractor pool too small — skipping round');
      setTimeout(function () {
        if (typeof opts.onComplete === 'function') opts.onComplete();
      }, 50);
      return { unmount: function () {} };
    }

    root.innerHTML = '';
    root.classList.add('mechanic-match-cv-to-word');

    const targetCV = VA.buildCV(letter, vowelId);

    const promptBar = document.createElement('div');
    promptBar.className = 'tap-cv-prompt';
    promptBar.innerHTML =
      '<span class="tap-cv-prompt__label">איזו מילה מתחילה ב-</span>' +
      '<button type="button" class="tap-cv-prompt__cv" aria-label="הקישו לשמוע">' + targetCV + '</button>' +
      '<span class="tap-cv-prompt__label">?</span>';
    root.appendChild(promptBar);

    const subtitle = document.createElement('div');
    subtitle.className = 'tap-cv-subtitle';
    subtitle.textContent = 'הקישו על כל מילה כדי לשמוע אותה';
    root.appendChild(subtitle);

    const field = document.createElement('div');
    field.className = 'word-match-field';
    field.style.display = 'grid';
    field.style.gridTemplateColumns = '1fr';
    field.style.gap = '14px';
    field.style.maxWidth = '480px';
    field.style.margin = '0 auto';
    root.appendChild(field);

    const state = {
      trial: 0, attempts: 0, locked: false, hintTimer: null,
      lastShownAt: Date.now(), currentTargetWord: null,
    };

    function pickTrialPayload() {
      // 1 target (random מ-targetWords) + 2 distractors (random מ-distractorPool)
      const target = targetWords[Math.floor(Math.random() * targetWords.length)];
      state.currentTargetWord = target;
      const dists = shuffle(distractorPool).slice(0, 2);
      return shuffle([target, dists[0], dists[1]]);
    }

    function buildTrial() {
      state.attempts = 0;
      state.lastShownAt = Date.now();
      const tiles = pickTrialPayload();
      field.innerHTML = '';
      tiles.forEach(function (data) {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'word-match-tile';
        tile.dataset.word = data.word;
        tile.dataset.target = (data === state.currentTargetWord) ? 'true' : 'false';
        // Layout: speaker icon + word text
        tile.innerHTML =
          '<span class="word-match-speaker">🔊</span>' +
          '<span class="word-match-word">' + data.word + '</span>';
        tile.addEventListener('click', function () { handleTap(tile, data); });
        field.appendChild(tile);
      });
      // Auto play CV
      setTimeout(function () { playCV(letter, vowelId); }, 350);
      if (state.hintTimer) clearTimeout(state.hintTimer);
      state.hintTimer = setTimeout(function () {
        if (!state.locked) playCV(letter, vowelId);
      }, 9000);
    }

    function handleTap(tile, data) {
      if (state.locked) return;
      if (tile.classList.contains('lit')) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }

      // Always play the word first
      playWord(data.audioKey, data.word);

      const isCorrect = (tile.dataset.target === 'true');
      const responseTime = Date.now() - state.lastShownAt;

      if (window.AvneiEventLogger && typeof window.AvneiEventLogger.logActivityResult === 'function') {
        try {
          window.AvneiEventLogger.logActivityResult({
            activity_type: 'cv-word-match',
            target_letter: letter,
            target_vowel: vowelId,
            target_cv: targetCV,
            target_phoneme_group: phonemeGroup,
            target_word: state.currentTargetWord ? state.currentTargetWord.word : null,
            tapped_word: data.word,
            item_id: questId + '-trial-' + (state.trial + 1),
            supportLevel: 1,
            is_correct: isCorrect,
            attempts: state.attempts + 1,
            response_time_ms: isCorrect ? responseTime : null,
            hint_used: state.attempts >= 1,
            primary_island_id: 4,
            secondary_island_ids: [3],
          });
        } catch (e) {}
      }

      if (isCorrect) onRightHit(tile);
      else onWrongHit(tile);
    }

    function onRightHit(tile) {
      tile.classList.add('lit');
      state.trial++;
      if (typeof opts.onUnitWon === 'function') opts.onUnitWon(state.trial - 1);
      if (state.trial >= numTrials) {
        state.locked = true;
        setTimeout(function () { if (typeof opts.onComplete === 'function') opts.onComplete(); }, 1200);
        return;
      }
      setTimeout(buildTrial, 1100);
    }

    function onWrongHit(tile) {
      state.attempts++;
      tile.classList.add('wrong-sway');
      setTimeout(function () { tile.classList.remove('wrong-sway'); }, 700);
      if (state.attempts >= 2) {
        const correct = field.querySelector('.word-match-tile[data-target="true"]');
        if (correct) correct.classList.add('hint-glow');
        setTimeout(function () { playCV(letter, vowelId); }, 400);
      }
    }

    promptBar.querySelector('.tap-cv-prompt__cv').addEventListener('click', function () {
      playCV(letter, vowelId);
    });

    buildTrial();

    return {
      unmount: function () {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
        root.innerHTML = '';
        root.classList.remove('mechanic-match-cv-to-word');
      },
    };
  }

  window.AvneiMechanics = window.AvneiMechanics || {};
  window.AvneiMechanics['match-cv-to-word'] = { mount: mount };
})();
