// ============================================================================
// templates/mechanic-cv-vs-cv.js — Binary CV choice (אי 4)
// סוכן 29 · 29.5.2026 ערב
//
// משימה: 2 אריחי CV בלבד (1 נכון + 1 distractor). הילדה שומעת את ה-target
// וצריכה לבחור. גרסה קלה — לחימום ולסבבים פותחים.
//
// 5 trials פר round.
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

  function playCV(letter, vowelId) {
    const VA = window.AvneiVowelAdapter;
    const A = window.AvneiAudio;
    if (VA && A && typeof A.play === 'function') {
      const k = VA.cvAudioKey(letter, vowelId);
      if (k) { A.play(k); return; }
    }
    if (VA && 'speechSynthesis' in window) {
      try {
        const u = new SpeechSynthesisUtterance(VA.buildCV(letter, vowelId));
        u.lang = 'he-IL'; u.rate = 0.85;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch (e) {}
    }
  }

  function mount(root, opts) {
    const VA = window.AvneiVowelAdapter;
    if (!VA) return { unmount: function () {} };

    const letter = opts.letter;
    const vowelId = opts.vowelId;
    const numTrials = (opts.numTrials && opts.numTrials > 0) ? opts.numTrials : 5;
    const questId = opts.questId || ('isl04-cvvscv-' + letter + '-' + vowelId);

    const phonemeGroup = VA.getPhonemeGroup(vowelId);
    const acceptableSet = new Set(VA.getVowelsInGroup(phonemeGroup).map(function (v) { return v.id; }));
    const distractorVowels = VA.getVowels()
      .filter(function (v) { return !acceptableSet.has(v.id); })
      .map(function (v) { return v.id; });

    root.innerHTML = '';
    root.classList.add('mechanic-cv-vs-cv');

    const promptBar = document.createElement('div');
    promptBar.className = 'tap-cv-prompt';
    promptBar.innerHTML =
      '<span class="tap-cv-prompt__label">איזה צליל שמעת? </span>' +
      '<button type="button" class="tap-cv-prompt__cv listen-speaker" aria-label="הקש לשמוע">🔊</button>';
    root.appendChild(promptBar);

    const subtitle = document.createElement('div');
    subtitle.className = 'tap-cv-subtitle';
    subtitle.textContent = 'בחרי בין שתי האפשרויות';
    root.appendChild(subtitle);

    const field = document.createElement('div');
    field.className = 'tap-cv-field cv-vs-cv-field';
    field.style.gridTemplateColumns = 'repeat(2, 1fr)';
    field.style.maxWidth = '420px';
    field.style.margin = '0 auto';
    field.style.gap = '24px';
    root.appendChild(field);

    const state = {
      trial: 0, attempts: 0, locked: false, hintTimer: null,
      lastShownAt: Date.now(), currentTargetVowel: vowelId,
    };

    function pickTrialTiles() {
      // 1 correct from accepted (random) + 1 distractor (random other phoneme group)
      const acceptable = Array.from(acceptableSet);
      const correctVowel = acceptable[Math.floor(Math.random() * acceptable.length)];
      state.currentTargetVowel = correctVowel;
      const distVowel = distractorVowels[Math.floor(Math.random() * distractorVowels.length)];
      return shuffle([
        { letter: letter, vowelId: correctVowel, cv: VA.buildCV(letter, correctVowel) },
        { letter: letter, vowelId: distVowel,    cv: VA.buildCV(letter, distVowel) },
      ]);
    }

    function buildTrial() {
      state.attempts = 0;
      state.lastShownAt = Date.now();
      const tiles = pickTrialTiles();
      field.innerHTML = '';
      tiles.forEach(function (data) {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'tap-cv-tile';
        tile.dataset.vowel = data.vowelId;
        tile.dataset.target = acceptableSet.has(data.vowelId) ? 'true' : 'false';
        const span = document.createElement('span');
        span.className = 'tap-cv-tile__cv';
        span.textContent = data.cv;
        tile.appendChild(span);
        tile.addEventListener('click', function () { handleTap(tile, data); });
        field.appendChild(tile);
      });
      setTimeout(function () { playCV(letter, state.currentTargetVowel); }, 350);
      if (state.hintTimer) clearTimeout(state.hintTimer);
      state.hintTimer = setTimeout(function () {
        if (!state.locked) playCV(letter, state.currentTargetVowel);
      }, 7000);
    }

    function handleTap(tile, data) {
      if (state.locked) return;
      if (tile.classList.contains('lit')) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }

      const isCorrect = (tile.dataset.target === 'true');
      const responseTime = Date.now() - state.lastShownAt;

      if (window.AvneiEventLogger && typeof window.AvneiEventLogger.logActivityResult === 'function') {
        try {
          window.AvneiEventLogger.logActivityResult({
            activity_type: 'cv-vs-cv',
            target_letter: letter,
            target_vowel: state.currentTargetVowel,
            target_cv: VA.buildCV(letter, state.currentTargetVowel),
            target_phoneme_group: phonemeGroup,
            tapped_vowel: data.vowelId,
            tapped_cv: data.cv,
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

      if (isCorrect) {
        tile.classList.add('lit');
        state.trial++;
        // אין play-on-correct (החלטת מיטל 30.5.2026): feedback ויזואלי בלבד.
        // ה-trial הבא ישמיע את ה-CV החדש ב-buildTrial.
        if (typeof opts.onUnitWon === 'function') opts.onUnitWon(state.trial - 1);
        if (state.trial >= numTrials) {
          state.locked = true;
          setTimeout(function () { if (typeof opts.onComplete === 'function') opts.onComplete(); }, 800);
          return;
        }
        setTimeout(buildTrial, 1100);  // 1100ms במקום 800 — מעבר רגוע יותר
      } else {
        state.attempts++;
        tile.classList.add('wrong-sway');
        setTimeout(function () { tile.classList.remove('wrong-sway'); }, 700);
        if (state.attempts >= 2) {
          const correctTile = field.querySelector('.tap-cv-tile[data-target="true"]');
          if (correctTile) correctTile.classList.add('hint-glow');
          setTimeout(function () { playCV(letter, state.currentTargetVowel); }, 400);
        }
      }
    }

    promptBar.querySelector('.listen-speaker').addEventListener('click', function () {
      playCV(letter, state.currentTargetVowel);
    });

    buildTrial();

    return {
      unmount: function () {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
        root.innerHTML = '';
        root.classList.remove('mechanic-cv-vs-cv');
      },
    };
  }

  window.AvneiMechanics = window.AvneiMechanics || {};
  window.AvneiMechanics['cv-vs-cv'] = { mount: mount };
})();
