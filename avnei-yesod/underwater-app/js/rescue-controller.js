// ============================================================
// rescue-controller.js — הצלת הדגים (אי 3, אות מ׳)
// 5 סיבובים · בכל סיבוב 4 אצות · הילד לוחץ על האצה עם מ׳ →
// אצה נפתחת, דגיג טס למעלה ומצטרף ללהקה. 5/5 → חגיגת סיום.
//
// לקחים מ-[[project-avnei-yesod-island3-mem-lessons]] שהוטמעו כאן:
//   #6,#18  feedback רק מ-exactly/great/right (AvriNeural מאומת ב-"יופי גדול")
//   #8      המתנה 2400ms+ בין שלבים אחרי playSequence
//   #9      לא משתמש ב-sound-match.js → אין בעיית "בננה→מ׳"
//   #10     רמקול בכל overlay (intro-speaker, mission-speaker)
//   #12     wrong = gentle-sway רך, לא שייק חזק
//   #13     finale דרמטי: נוני רוקד + להקה שוחה + קונפטי + נשיקות
//   #19     נוני 5 הבעות (idle/help/hint/cheer/dance) דרך src swap ב-HTML
// ============================================================

(function () {
  const ISLAND_ID = 3;
  const LETTER = 'ק';
  const TOTAL_FISH = 5;
  const PODS_PER_ROUND = 4;

  // Distractor letters — fill the 3 non-correct pods per round.
  // Limited to letters with existing sound-XXX.mp3 audio (AvriNeural verified).
  // Note: 'ק' is the target — it's excluded here so it appears exactly once per round.
  const DISTRACTOR_LETTERS = ['ר', 'ב', 'מ', 'ת', 'ל', 'נ', 'ש', 'ד', 'ה', 'ע'];

  // Feedback audio pool — lesson #6, #18: only AvriNeural-verified files.
  // 'good.mp3' deliberately excluded — not confirmed as AvriNeural recording.
  const FEEDBACK_AUDIO = ['exactly', 'great', 'right'];

  // Lesson #8: minimum gap between rounds so success audio finishes
  const INTER_ROUND_DELAY_MS = 2400;

  const state = {
    roundIdx: 0,
    fishRescued: 0,
    locked: false, // prevents double-taps mid-animation
    hintTimer: null,
    attempts: 0, // wrong taps in current round — drives progressive scaffold
  };

  const elSeaweedArea = document.getElementById('seaweedArea');
  const elNoni = document.getElementById('noniImg');
  const elRescueCount = document.getElementById('rescueCountDisplay');
  const elTapToStart = document.getElementById('tapToStart');
  const elCompletion = document.getElementById('completion');
  const elStartBtn = document.getElementById('startBtn');
  const elIntroSpeaker = document.getElementById('introSpeaker');
  const elMissionSpeaker = document.getElementById('missionSpeaker');

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickDistractors(n) {
    return shuffle(DISTRACTOR_LETTERS).slice(0, n);
  }

  function pickFeedbackAudio() {
    return FEEDBACK_AUDIO[Math.floor(Math.random() * FEEDBACK_AUDIO.length)];
  }

  function updateRescueCounter() {
    if (elRescueCount) {
      elRescueCount.textContent = state.fishRescued + '/' + TOTAL_FISH + ' דגים';
    }
    document.querySelectorAll('.fish-slot').forEach((slot, idx) => {
      if (idx < state.fishRescued) slot.classList.add('filled');
    });
  }

  function updatePearlDisplay() {
    if (typeof getPearls === 'function') {
      const el = document.getElementById('pearlCount');
      if (el) el.textContent = getPearls();
    }
  }

  // ============================================================
  // Build one round — 4 pods, one correct (מ׳), 3 distractors
  // ============================================================
  function buildRound() {
    if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
    elSeaweedArea.innerHTML = '';
    state.locked = false;
    state.attempts = 0; // reset wrong-tap counter for new round

    const distractors = pickDistractors(PODS_PER_ROUND - 1);
    const allLetters = shuffle([LETTER, ...distractors]);

    allLetters.forEach((letter) => {
      const pod = document.createElement('div');
      pod.className = 'seaweed-pod';
      pod.dataset.letter = letter;
      pod.dataset.correct = (letter === LETTER) ? 'true' : 'false';

      const img = document.createElement('img');
      img.className = 'seaweed-pod__img';
      img.src = 'assets/island-03/rescue-game/seaweed-closed.png';
      img.alt = '';
      img.onerror = function() {
        // Fallback if PNG missing — show a soft pastel pod via CSS
        img.style.display = 'none';
        pod.style.background =
          'linear-gradient(180deg, #A8E8FF 0%, #73D9D1 50%, #FFA98D 100%)';
        pod.style.borderRadius = '50% 50% 45% 45% / 60% 60% 40% 40%';
        pod.style.boxShadow = 'inset 0 -10px 20px rgba(255, 169, 141, 0.3)';
      };

      const letterEl = document.createElement('span');
      letterEl.className = 'seaweed-pod__letter';
      letterEl.textContent = letter;

      pod.appendChild(img);
      pod.appendChild(letterEl);
      pod.addEventListener('click', () => handlePodTap(pod));
      elSeaweedArea.appendChild(pod);
    });

    if (window.AvneiNoni) AvneiNoni.setState('idle');

    // Auto-play the target letter sound so non-readers know what to find
    if (window.AvneiAudio && AvneiAudio.isUnlocked && AvneiAudio.isUnlocked()) {
      setTimeout(() => AvneiAudio.playLetterSound(LETTER), 300);
    }

    // Auto-hint after 9 seconds of inactivity
    state.hintTimer = setTimeout(triggerHint, 9000);
  }

  function triggerHint() {
    state.hintTimer = null;
    if (state.locked) return;
    if (window.AvneiNoni) AvneiNoni.setState('hint');
    document.querySelectorAll('.seaweed-pod[data-correct="true"]').forEach(p => {
      p.classList.add('hint-glow');
    });
    if (window.AvneiAudio) AvneiAudio.playLetterSound(LETTER);
  }

  // ============================================================
  // Handle a pod tap
  // ============================================================
  function handlePodTap(pod) {
    if (state.locked) return;
    if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }

    const isCorrect = pod.dataset.correct === 'true';

    // לוגינג לתובנות מורה (23.5.2026)
    if (window.AvneiEventLogger) {
      AvneiEventLogger.logActivityResult({
        activity_type: 'rescue',
        target_letter: LETTER,
        item_id: 'rescue-fish-' + (state.fishRescued + 1),
        supportLevel: 1,
        is_correct: isCorrect,
        attempts: isCorrect ? (state.attempts + 1) : (state.attempts + 1),
        response_time_ms: null,
        hint_used: state.attempts >= 1,
      });
    }

    if (isCorrect) {
      state.locked = true;
      doRescue(pod);
    } else {
      doWrong(pod);
    }
  }

  // Support model — per [[feedback-avnei-yesod-support-levels]] (Meytal 23.5.2026):
  //   attempt 1 — VISUAL ONLY (gentle-sway). NO noni-help. NO audio. Let kid retry alone.
  //   attempt 2 — hint-glow on correct pod + play letter SOUND. Noni 'hint'.
  //   attempt 3+ — keep hint-glow + play 'press-here.mp3'. Direct nudge to correct pod.
  function doWrong(pod) {
    state.attempts++;
    pod.classList.add('wrong-sway');

    if (state.attempts === 1) {
      // No verbal/audio support — visual sway is enough on attempt 1
    } else if (state.attempts === 2) {
      if (window.AvneiNoni) AvneiNoni.setState('hint');
      document.querySelectorAll('.seaweed-pod[data-correct="true"]').forEach(p => {
        p.classList.add('hint-glow');
      });
      if (window.AvneiAudio) {
        setTimeout(() => AvneiAudio.playLetterSound(LETTER), 400);
      }
    } else if (state.attempts >= 3) {
      if (window.AvneiNoni) AvneiNoni.setState('hint');
      document.querySelectorAll('.seaweed-pod[data-correct="true"]').forEach(p => {
        p.classList.add('hint-glow');
      });
      if (window.AvneiAudio) {
        setTimeout(() => AvneiAudio.play('press-here'), 400);
      }
    }

    setTimeout(() => {
      pod.classList.remove('wrong-sway');
    }, 700);
  }

  function doRescue(pod) {
    pod.classList.add('opening', 'opened');

    // Swap image to open variant (gracefully degrades if missing)
    const img = pod.querySelector('.seaweed-pod__img');
    if (img) {
      const openSrc = 'assets/island-03/rescue-game/seaweed-open.png';
      const tester = new Image();
      tester.onload = () => { img.src = openSrc; };
      tester.src = openSrc;
    }

    if (window.AvneiNoni) AvneiNoni.setState('cheer');
    if (window.AvneiAudio) AvneiAudio.play(pickFeedbackAudio());

    flyFishToSlot(pod, state.fishRescued);

    if (typeof addPearl === 'function') {
      addPearl(1);
      updatePearlDisplay();
    }

    // Advance after the fish has landed + audio room (lesson #8: 2400ms min)
    setTimeout(() => {
      state.fishRescued++;
      updateRescueCounter();

      if (state.fishRescued >= TOTAL_FISH) {
        setTimeout(startFinale, 700);
      } else {
        state.roundIdx++;
        setTimeout(buildRound, INTER_ROUND_DELAY_MS);
      }
    }, 1100);
  }

  // ============================================================
  // Fly a fish element from the opened pod up to the next school slot
  // ============================================================
  function flyFishToSlot(pod, slotIdx) {
    const slot = document.querySelector(`.fish-slot[data-i="${slotIdx}"]`);
    if (!slot) return;

    const podRect = pod.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();

    const sx = podRect.left + podRect.width / 2 - 28;
    const sy = podRect.top + podRect.height / 2 - 20;

    const fly = document.createElement('div');
    fly.className = 'flying-fish';
    fly.style.left = sx + 'px';
    fly.style.top = sy + 'px';

    const useImage = document.createElement('img');
    useImage.src = 'assets/island-03/rescue-game/fish-single.png';
    useImage.alt = '';
    useImage.style.width = '100%';
    useImage.style.height = '100%';
    useImage.onerror = () => {
      useImage.remove();
      fly.innerHTML = `<svg viewBox="0 0 64 40"><use href="#fishSymbol"/></svg>`;
    };
    fly.appendChild(useImage);
    document.body.appendChild(fly);

    requestAnimationFrame(() => {
      const dx = (slotRect.left + slotRect.width / 2) - (sx + 28);
      const dy = (slotRect.top + slotRect.height / 2) - (sy + 20);
      fly.style.transform = `translate(${dx}px, ${dy}px) scale(0.55)`;
    });

    setTimeout(() => slot.classList.add('filled'), 900);
    setTimeout(() => {
      fly.style.opacity = '0';
      setTimeout(() => fly.remove(), 300);
    }, 1000);
  }

  // ============================================================
  // Finale — lesson #13: dramatic celebration
  // Noni dances + fish school swims across + confetti + kisses
  // ============================================================
  function startFinale() {
    if (window.AvneiNoni) AvneiNoni.setState('dance');
    elNoni.classList.add('dancing');

    spawnSwimmingSchool();
    spawnConfetti(80);
    spawnKisses(8);

    if (window.AvneiAudio) {
      // Dedicated finale MP3 — "הצלתם את כל הדגים! יופי גדול!" (AvriNeural)
      AvneiAudio.play('finale-rescue-saved');
    }

    setTimeout(showCompletion, 2400);
  }

  function spawnSwimmingSchool() {
    const school = document.createElement('img');
    school.className = 'swimming-school';
    school.src = 'assets/island-03/rescue-game/fish-school.png';
    school.alt = '';
    school.onerror = function() {
      // Fallback: show 5 SVG fish in a row
      school.remove();
      const wrap = document.createElement('div');
      wrap.className = 'swimming-school';
      wrap.style.cssText = wrap.style.cssText +
        ';display:flex;justify-content:center;align-items:center;background:none';
      for (let i = 0; i < 5; i++) {
        const s = document.createElement('span');
        s.style.cssText = 'display:inline-block;width:48px;height:32px;margin:0 4px';
        s.innerHTML = '<svg viewBox="0 0 64 40" style="width:100%;height:100%"><use href="#fishSymbol"/></svg>';
        wrap.appendChild(s);
      }
      document.body.appendChild(wrap);
      setTimeout(() => wrap.remove(), 5500);
      return;
    };
    document.body.appendChild(school);
    setTimeout(() => school.remove && school.remove(), 5500);
  }

  function spawnConfetti(count) {
    const container = document.getElementById('confettiLayer') || (() => {
      const c = document.createElement('div');
      c.id = 'confettiLayer';
      c.className = 'confetti-layer';
      document.body.appendChild(c);
      return c;
    })();
    const colors = ['#FFE7A8', '#FFA98D', '#B8F2CF', '#A8E8FF', '#D9D2FF', '#FFD3D8'];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = (Math.random() * 0.8) + 's';
      piece.style.animationDuration = (2.4 + Math.random() * 2.2) + 's';
      piece.style.width = (6 + Math.random() * 8) + 'px';
      piece.style.height = (10 + Math.random() * 14) + 'px';
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      container.appendChild(piece);
      setTimeout(() => piece.remove(), 5000);
    }
  }

  function spawnKisses(count) {
    const container = document.getElementById('kissesLayer') || (() => {
      const c = document.createElement('div');
      c.id = 'kissesLayer';
      c.className = 'kisses-layer';
      document.body.appendChild(c);
      return c;
    })();
    for (let i = 0; i < count; i++) {
      const k = document.createElement('span');
      k.className = 'kiss-heart';
      k.style.left = (8 + Math.random() * 18) + 'vw';
      k.style.bottom = (4 + Math.random() * 6) + 'vh';
      k.style.animationDelay = (Math.random() * 1.2) + 's';
      k.innerHTML = `
        <svg viewBox="0 0 32 32">
          <path d="M16 28 C 6 20, 2 14, 6 9 C 10 4, 14 8, 16 12 C 18 8, 22 4, 26 9 C 30 14, 26 20, 16 28 Z"
                fill="#FF6B9D" stroke="#FFFFFF" stroke-width="1.5"/>
        </svg>
      `;
      container.appendChild(k);
      setTimeout(() => k.remove(), 5000);
    }
  }

  function showCompletion() {
    if (typeof completeStage === 'function') completeStage(ISLAND_ID);
    if (typeof addSouvenir === 'function') addSouvenir('להקת דגים זוהרת');
    elCompletion.classList.add('show');
    spawnConfetti(40);
  }

  // ============================================================
  // Intro speaker (lesson #10) — placeholder until intro-rescue MP3s recorded
  // ============================================================
  if (elIntroSpeaker) {
    elIntroSpeaker.addEventListener('click', () => {
      if (window.AvneiAudio) AvneiAudio.unlock();
      elIntroSpeaker.classList.add('playing');
      // Real intro narration (AvriNeural) — generated by generate-rescue-audio.py
      if (window.AvneiAudio) {
        AvneiAudio.playSequence(
          ['intro-rescue-quest-qof', 'intro-rescue-mission-qof'],
          700
        );
      }
      setTimeout(() => elIntroSpeaker.classList.remove('playing'), 12000);
    });
  }

  if (elMissionSpeaker) {
    elMissionSpeaker.addEventListener('click', () => {
      if (window.AvneiAudio) {
        AvneiAudio.unlock();
        AvneiAudio.playLetterSound(LETTER);
      }
    });
  }

  // ============================================================
  // Bootstrap
  // ============================================================
  if (elStartBtn) {
    elStartBtn.addEventListener('click', () => {
      if (window.AvneiAudio) AvneiAudio.unlock();
      elTapToStart.classList.add('hidden');
      if (window.AvneiNoni) AvneiNoni.ready();
      updateRescueCounter();
      updatePearlDisplay();
      buildRound();
    });
  }

  // Dev shortcuts
  const params = new URLSearchParams(window.location.search);
  if (params.get('reset') === '1') {
    localStorage.removeItem('underwater-app:v1');
    console.log('localStorage reset.');
  }
  if (params.get('skip') === '1') {
    setTimeout(() => {
      elTapToStart && elTapToStart.classList.add('hidden');
      state.fishRescued = TOTAL_FISH;
      updateRescueCounter();
      startFinale();
    }, 500);
  }
})();
