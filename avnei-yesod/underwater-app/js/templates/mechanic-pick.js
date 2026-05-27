// ============================================================
// templates/mechanic-pick.js — Round-based pick-correct mechanic
//
// Extracted from stage-3-rescue.html (אות ק). The mechanic runs N rounds.
// In each round M pods are shown, exactly one carries the target letter
// and the rest carry distractors. The child taps the correct one →
// onUnitWon. Wrong taps animate the pod and progress the scaffold.
// After N correct rounds → onComplete.
//
// Support model — same as mechanic-tap-all:
//   wrong-1: visual sway only
//   wrong-2: hint-glow on correct pod + play letter sound
//   wrong-3+: keep hint-glow + play 'press-here.mp3'
// ============================================================

window.AvneiMechanics = window.AvneiMechanics || {};

window.AvneiMechanics['pick'] = (function () {

  const INTER_ROUND_DELAY_MS = 2400;
  const FEEDBACK_AUDIO = ['exactly', 'great', 'right'];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function mount(root, opts) {
    const letter      = opts.letter;
    const total       = opts.total || 5;
    const distractors = (opts.distractors || []).filter(d => d !== letter);
    const cfg         = opts.mechanicConfig || {};
    const podsPerRound = cfg.podsPerRound || 4;

    root.innerHTML = '';
    root.classList.add('mechanic-pick');

    const area = document.createElement('div');
    area.className = 'pick-area';
    root.appendChild(area);

    const state = {
      roundIdx: 0,
      wins: 0,
      attempts: 0,
      locked: false,
      hintTimer: null,
      lastShownAt: Date.now(),
    };

    function pickFeedback() {
      return FEEDBACK_AUDIO[Math.floor(Math.random() * FEEDBACK_AUDIO.length)];
    }

    function buildRound() {
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      area.innerHTML = '';
      state.locked = false;
      state.attempts = 0;

      const distCount = podsPerRound - 1;
      const pool = shuffle(distractors);
      const dList = [];
      for (let i = 0; i < distCount; i++) {
        dList.push(pool[i % pool.length] || 'ש');
      }
      const letters = shuffle([letter, ...dList]);

      letters.forEach((ltr) => {
        const pod = document.createElement('button');
        pod.type = 'button';
        pod.className = 'pick-pod';
        pod.dataset.letter = ltr;
        pod.dataset.target = (ltr === letter) ? 'true' : 'false';
        pod.setAttribute('aria-label', 'אות ' + ltr);
        const span = document.createElement('span');
        span.className = 'pick-pod__letter';
        span.textContent = ltr;
        pod.appendChild(span);
        pod.addEventListener('click', () => handleTap(pod));
        area.appendChild(pod);
      });

      state.lastShownAt = Date.now();
      if (window.AvneiNoni) AvneiNoni.setState('idle');
      if (window.AvneiAudio && AvneiAudio.isUnlocked && AvneiAudio.isUnlocked()) {
        setTimeout(() => AvneiAudio.playLetterSound(letter), 300);
      }
      state.hintTimer = setTimeout(triggerHint, 9000);
    }

    function triggerHint() {
      state.hintTimer = null;
      if (state.locked) return;
      if (window.AvneiNoni) AvneiNoni.setState('hint');
      area.querySelectorAll('.pick-pod[data-target="true"]').forEach(p => {
        p.classList.add('hint-glow');
      });
      if (window.AvneiAudio) AvneiAudio.playLetterSound(letter);
    }

    function handleTap(pod) {
      if (state.locked) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }

      const isCorrect = (pod.dataset.target === 'true');
      const responseTime = Date.now() - state.lastShownAt;

      if (window.AvneiEventLogger) {
        AvneiEventLogger.logActivityResult({
          activity_type: 'rescue',
          target_letter: letter,
          item_id: opts.questId + '-round-' + (state.wins + 1),
          supportLevel: 1,
          is_correct: isCorrect,
          attempts: state.attempts + 1,
          response_time_ms: isCorrect ? responseTime : null,
          hint_used: state.attempts >= 1,
        });
      }

      if (isCorrect) {
        state.locked = true;
        onCorrect(pod);
      } else {
        onWrong(pod);
      }
    }

    function onCorrect(pod) {
      pod.classList.add('picked');
      if (window.AvneiNoni) AvneiNoni.setState('cheer');
      if (window.AvneiAudio) AvneiAudio.play(pickFeedback());
      if (typeof addPearl === 'function') addPearl(1);

      opts.onUnitWon && opts.onUnitWon(state.wins);
      state.wins++;

      setTimeout(() => {
        if (state.wins >= total) {
          opts.onComplete && opts.onComplete();
        } else {
          state.roundIdx++;
          setTimeout(buildRound, INTER_ROUND_DELAY_MS - 1100);
        }
      }, 1100);
    }

    function onWrong(pod) {
      state.attempts++;
      pod.classList.add('wrong-sway');
      setTimeout(() => pod.classList.remove('wrong-sway'), 700);

      if (state.attempts === 2) {
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        area.querySelectorAll('.pick-pod[data-target="true"]').forEach(p => {
          p.classList.add('hint-glow');
        });
        if (window.AvneiAudio) setTimeout(() => AvneiAudio.playLetterSound(letter), 400);
      } else if (state.attempts >= 3) {
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        area.querySelectorAll('.pick-pod[data-target="true"]').forEach(p => {
          p.classList.add('hint-glow');
        });
        if (window.AvneiAudio) setTimeout(() => AvneiAudio.play('press-here'), 400);
      }
    }

    buildRound();

    return {
      unmount() {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        root.innerHTML = '';
        root.classList.remove('mechanic-pick');
      },
    };
  }

  return { mount };
})();
