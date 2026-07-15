// ============================================================================
// templates/mechanic-listen-cv.js — Listen-CV mechanic (אי 4)
// סוכן 29 · 29.5.2026 ערב
//
// משימה: הילדה _שומעת_ CV (אין prompt ויזואלי), ובוחרת מתוך 3 אריחי CV
// את הצורה הנכונה. הצורה הויזואלית של target נסתרת — היא חייבת להסתמך
// על השמיעה לבד.
//
// chalupa B (phoneme group accept): גם sister vowel נחשב נכון. דוגמה:
//   target='מ:patach' → גם 'מַ' וגם 'מָ' tile-ים נכונים (שניהם /ma/).
//
// 5 trials פר round. כל trial = audio + 3 tiles + 1 choice.
// ============================================================================

(function () {
  'use strict';
  const DEV_TTS_FALLBACK = typeof window !== 'undefined' && window.DEV_TTS_FALLBACK === true;

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
    const AvneiAudio = window.AvneiAudio;
    if (VA && AvneiAudio && typeof AvneiAudio.play === 'function') {
      const key = VA.cvAudioKey(letter, vowelId);
      if (key) { AvneiAudio.play(key); return; }
    }
    if (!DEV_TTS_FALLBACK) {
      console.warn('[audio] Missing recorded MP3 for listen-cv:', letter, vowelId);
      return;
    }
    if (VA && 'speechSynthesis' in window) {
      try {
        const cv = VA.buildCV(letter, vowelId);
        const u = new SpeechSynthesisUtterance(cv);
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
    const questId = opts.questId || ('isl04-listen-' + letter + '-' + vowelId);

    const targetCV = VA.buildCV(letter, vowelId);
    if (!targetCV) return { unmount: function () {} };

    const phonemeGroup = VA.getPhonemeGroup(vowelId);
    const acceptableVowels = VA.getVowelsInGroup(phonemeGroup).map(function (v) { return v.id; });
    const acceptableSet = new Set(acceptableVowels);
    // Distractors: same letter, vowels from OTHER phoneme groups
    const distractorVowels = VA.getVowels()
      .filter(function (v) { return !acceptableSet.has(v.id); })
      .map(function (v) { return v.id; });

    root.innerHTML = '';
    root.classList.add('mechanic-listen-cv');

    const promptBar = document.createElement('div');
    promptBar.className = 'tap-cv-prompt';
    promptBar.innerHTML =
      '<span class="tap-cv-prompt__label">איזה הגיע ללא תמונה? </span>' +
      '<button type="button" class="tap-cv-prompt__cv listen-speaker" aria-label="הקישו לשמוע שוב">' +
      '🔊</button>';
    root.appendChild(promptBar);

    const subtitle = document.createElement('div');
    subtitle.className = 'tap-cv-subtitle';
    subtitle.textContent = 'הקשיבו וגעו בצורה הנכונה';
    root.appendChild(subtitle);

    const field = document.createElement('div');
    field.className = 'tap-cv-field listen-cv-field';
    field.style.gridTemplateColumns = 'repeat(3, 1fr)';
    field.style.maxWidth = '480px';
    field.style.margin = '0 auto';
    root.appendChild(field);

    const state = {
      trial: 0,
      attempts: 0,
      locked: false,
      hintTimer: null,
      lastShownAt: Date.now(),
      currentTargetVowel: vowelId,
    };

    function pickTrialTiles() {
      // 1 correct (random from acceptable) + 2 distractors (different phoneme groups)
      const correctVowel = acceptableVowels[Math.floor(Math.random() * acceptableVowels.length)];
      state.currentTargetVowel = correctVowel;
      const distPool = shuffle(distractorVowels).slice(0, 2);
      const all = [correctVowel].concat(distPool).map(function (vid) {
        return { letter: letter, vowelId: vid, cv: VA.buildCV(letter, vid) };
      });
      return shuffle(all);
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
      // Auto-play the target CV after mount
      setTimeout(function () { playCV(letter, state.currentTargetVowel); }, 350);
      scheduleAutoHint();
    }

    function scheduleAutoHint() {
      if (state.hintTimer) clearTimeout(state.hintTimer);
      state.hintTimer = setTimeout(function () {
        if (state.locked) return;
        playCV(letter, state.currentTargetVowel);
      }, 8000);
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
            activity_type: 'cv-listen',
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

      if (isCorrect) onRightHit(tile, data);
      else onWrongHit(tile);
    }

    function onRightHit(tile, data) {
      tile.classList.add('lit');
      state.trial++;
      // אין play-on-correct (החלטת מיטל 30.5.2026): feedback ויזואלי בלבד.
      // ה-trial הבא ישמיע CV חדש ב-buildTrial.
      if (typeof opts.onUnitWon === 'function') opts.onUnitWon(state.trial - 1);

      if (state.trial >= numTrials) {
        state.locked = true;
        if (state.hintTimer) clearTimeout(state.hintTimer);
        setTimeout(function () { if (typeof opts.onComplete === 'function') opts.onComplete(); }, 800);
        return;
      }
      setTimeout(buildTrial, 900);
    }

    function onWrongHit(tile) {
      state.attempts++;
      tile.classList.add('wrong-sway');
      setTimeout(function () { tile.classList.remove('wrong-sway'); }, 700);
      if (state.attempts >= 2) {
        const correctTile = field.querySelector('.tap-cv-tile[data-target="true"]');
        if (correctTile) correctTile.classList.add('hint-glow');
        setTimeout(function () { playCV(letter, state.currentTargetVowel); }, 400);
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
        root.classList.remove('mechanic-listen-cv');
      },
    };
  }

  window.AvneiMechanics = window.AvneiMechanics || {};
  window.AvneiMechanics['listen-cv'] = { mount: mount };
})();
