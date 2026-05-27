// ============================================================
// templates/game-shell.js — shared shell for island-3 letter mini-games
//
// Owns everything that is identical across the 5 existing mini-games
// (shell/house/rescue/trail-resh/storm):
//   - Noni 5-expression swap (idle / help / hint / cheer / dance)
//   - Hidden feedback-bubble (kids age 6 don't read)
//   - Top-bar counter (X/N <unit>) + pearl counter
//   - Tap-to-start overlay + intro-speaker (AvriNeural)
//   - Completion overlay + souvenir + mastery hook + quest tracking
//   - Confetti + flying kisses finale animations
//
// Mechanic plug-ins (mechanic-tap-all / mechanic-pick / mechanic-quest)
// call AvneiGameShell.unitWon(idx) on each correct unit and
// AvneiGameShell.complete() when the round is done.
//
// Required DOM stubs in the host HTML (template-demo.html shows them):
//   #noniImg, #feedbackBubble, #tapToStart, #completion, #gameRoot,
//   #startBtn, #introSpeaker, #unitCountDisplay, #pearlCount
//
// Audio: relies on AvneiAudio. Letter sounds (sound-X.mp3) exist for all
// 22 Hebrew letters; per-quest intro and finale clips are optional.
// ============================================================

window.AvneiGameShell = (function () {

  const NONI_EXPRESSIONS = {
    idle:  'assets/noni-idle.png',
    help:  'assets/noni-thinking.png',
    hint:  'assets/noni-surprised.png',
    cheer: 'assets/noni-happy.png',
    dance: 'assets/noni-kiss.png',
  };

  const CONFETTI_COLORS = [
    '#FFE7A8', '#FFA98D', '#B8F2CF', '#A8E8FF', '#D9D2FF', '#FFD3D8'
  ];

  // משוב מגוון — מחליף את great.mp3 הישן (kal hakavod). מיטל 27.5.
  const PRAISE_POOL = ['praise-yofi', 'praise-metzuyan', 'praise-mealeh'];
  function pickRandomPraise() {
    return PRAISE_POOL[Math.floor(Math.random() * PRAISE_POOL.length)];
  }

  let activeConfig = null;
  let unitsWon = 0;

  // --- Noni expression override (matches the 5 existing games) ----------
  function installNoniExpressions() {
    Object.values(NONI_EXPRESSIONS).forEach(src => { new Image().src = src; });
    if (!window.AvneiNoni) return;
    const orig = AvneiNoni.setState;
    AvneiNoni.setState = function (state) {
      orig.call(this, state);
      const img = document.getElementById('noniImg');
      if (!img) return;
      const src = NONI_EXPRESSIONS[state] || NONI_EXPRESSIONS.idle;
      if (img.src.indexOf(src.split('/').pop()) === -1) img.src = src;
    };
    const img = document.getElementById('noniImg');
    if (img) img.src = NONI_EXPRESSIONS.idle;
  }

  // --- Feedback bubble suppression (lesson #15) -------------------------
  function suppressFeedbackBubble() {
    if (!window.AvneiFeedback) return;
    AvneiFeedback.show = function () {
      const fb = document.getElementById('feedbackBubble');
      if (fb) fb.style.display = 'none';
    };
    const origHide = AvneiFeedback.hide;
    AvneiFeedback.hide = function () {
      origHide.call(this);
      const fb = document.getElementById('feedbackBubble');
      if (fb) fb.style.display = 'none';
    };
  }

  // --- Counter widget ---------------------------------------------------
  function updateUnitCounter() {
    const el = document.getElementById('unitCountDisplay');
    if (!el || !activeConfig) return;
    el.textContent = unitsWon + '/' + activeConfig.counter.total + ' ' + activeConfig.counter.unit;
  }

  function updatePearlDisplay() {
    if (typeof getPearls !== 'function') return;
    const el = document.getElementById('pearlCount');
    if (el) el.textContent = getPearls();
  }

  // --- Finale + completion ---------------------------------------------
  function cheerNoni(ms = 1500) {
    if (window.AvneiNoni) AvneiNoni.setState('cheer');
    setTimeout(() => { if (window.AvneiNoni) AvneiNoni.setState('idle'); }, ms);
  }

  function spawnConfetti(count) {
    let container = document.getElementById('confettiLayer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'confettiLayer';
      container.className = 'confetti-layer';
      document.body.appendChild(container);
    }
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
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
    let container = document.getElementById('kissesLayer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'kissesLayer';
      container.className = 'kisses-layer';
      document.body.appendChild(container);
    }
    for (let i = 0; i < count; i++) {
      const k = document.createElement('span');
      k.className = 'kiss-heart';
      k.style.left = (8 + Math.random() * 18) + 'vw';
      k.style.bottom = (4 + Math.random() * 6) + 'vh';
      k.style.animationDelay = (Math.random() * 1.2) + 's';
      k.innerHTML = `<svg viewBox="0 0 32 32">
        <path d="M16 28 C 6 20, 2 14, 6 9 C 10 4, 14 8, 16 12 C 18 8, 22 4, 26 9 C 30 14, 26 20, 16 28 Z"
              fill="#FF6B9D" stroke="#FFFFFF" stroke-width="1.5"/>
      </svg>`;
      container.appendChild(k);
      setTimeout(() => k.remove(), 5000);
    }
  }

  // ה-finale המקורי — confetti + kisses + praise → finale audio → completion.
  // ב-D.15 v2 התווסף runLetterAnim *לפני* הפונקציה הזו (אם letter-anims.js נטען
  // ויש מיפוי לאות). הוא משחק word-X.mp3 + מציג SVG אסוציאטיבי ~2.2 שניות,
  // ואז קורא ל-startFinale הזה.
  function startFinale() {
    const elNoni = document.getElementById('noniImg');
    if (elNoni) {
      elNoni.classList.add('dancing');
      elNoni.src = NONI_EXPRESSIONS.dance;
    }
    spawnConfetti(80);
    spawnKisses(8);

    // אודיו סיום — שבח רנדומלי → onended → finale ייעודי לנושא.
    // AvneiAudio.play שורף את ה-currentAudio הקודם (אם מהמכניקה נשאר משהו).
    // playSequence המקורי לא עושה pause — לכן בנינו רצף ידני עם onended.
    const finaleKey = activeConfig.finale && activeConfig.finale.audioKey;
    if (window.AvneiAudio) {
      const praise = pickRandomPraise();
      AvneiAudio.play(praise);
      if (finaleKey) {
        const praiseAudio = AvneiAudio.preload(praise);
        const playFinale = () => AvneiAudio.play(finaleKey);
        praiseAudio.addEventListener('ended', playFinale, { once: true });
      }
    }
    // המתנה מספיק זמן לכל הרצף לרוץ (praise ~700ms + finale ~2.5s + רוויה)
    setTimeout(showCompletion, 4000);
  }

  // D.15 v2 wrapper — אם letter-anims.js נטען (window.AvneiLetterAnims),
  // משחקת אנימציה ייחודית פר אות + word-X.mp3, ואז קוראת ל-startFinale.
  // אם לא נטען (תאימות אחורנית) — מדלג ישר ל-startFinale.
  function playLetterAnimThenFinale() {
    if (window.AvneiLetterAnims && activeConfig && activeConfig.letter) {
      const anim = AvneiLetterAnims.getAnimForLetter(activeConfig.letter);
      if (anim) {
        AvneiLetterAnims.runAnimation(activeConfig.letter, startFinale);
        return;
      }
    }
    startFinale();
  }

  function markQuestCompleted(questId) {
    try {
      const key = 'island3-quests:completed';
      const completed = JSON.parse(localStorage.getItem(key) || '[]');
      if (!completed.includes(questId)) {
        completed.push(questId);
        localStorage.setItem(key, JSON.stringify(completed));
      }
    } catch (e) {}
  }

  function showCompletion() {
    if (typeof completeStage === 'function') completeStage(3);
    if (typeof addSouvenir === 'function' && activeConfig.completion.souvenir) {
      addSouvenir(activeConfig.completion.souvenir);
    }
    markQuestCompleted(activeConfig.questId);
    const el = document.getElementById('completion');
    if (el) el.classList.add('show');
    spawnConfetti(40);
    if (window.AvneiMasteryCheck) {
      AvneiMasteryCheck.checkAndShowIslandCelebration(null, 3);
    }
  }

  // --- Visual unit-collected animation (template-only — letters with custom
  // hero PNG can override this) ----------------------------------------
  function defaultUnitWonAnim(idx) {
    const slot = document.querySelector(`[data-shell-slot="${idx}"]`);
    if (!slot) return;
    slot.classList.add('filled');
  }

  // --- Public API ------------------------------------------------------
  function start(config) {
    activeConfig = config;
    unitsWon = 0;

    installNoniExpressions();
    suppressFeedbackBubble();

    // Preload all audio keys — שולח את בקשת ה-fetch של ה-MP3 ברגע שה-demo
    // נטען, כך שכשהילד.ה מקיש.ה על "הקישו לשמוע", הקובץ כבר מוכן. זה מבטל
    // את ה-1 שנייה דיליי שהיה במובייל.
    if (window.AvneiAudio) {
      (config.introAudioKeys || []).forEach(k => { if (k) AvneiAudio.preload(k); });
      if (config.inGamePromptAudioKey) AvneiAudio.preload(config.inGamePromptAudioKey);
      if (config.finale && config.finale.audioKey) AvneiAudio.preload(config.finale.audioKey);
      ['praise-yofi', 'praise-metzuyan', 'praise-mealeh'].forEach(k => AvneiAudio.preload(k));
      const soundFile = (AvneiAudio.LETTER_TO_SOUND_FILE || {})[config.letter];
      if (soundFile) AvneiAudio.preload(soundFile);
      // D.15 v2 — preload של word-X.mp3 לאנימציה האסוציאטיבית פר אות
      if (window.AvneiLetterAnims) {
        const anim = AvneiLetterAnims.getAnimForLetter(config.letter);
        if (anim && anim.wordKey) AvneiAudio.preload(anim.wordKey);
      }
    }

    const titleEl = document.querySelector('#tapToStart h2');
    if (titleEl && config.title) titleEl.textContent = config.title;
    const completionTitleEl = document.querySelector('#completion h2');
    if (completionTitleEl && config.completion.title) {
      completionTitleEl.textContent = config.completion.title;
    }
    const completionMsgEl = document.getElementById('completionMsg');
    if (completionMsgEl && config.completion.message) {
      completionMsgEl.textContent = config.completion.message;
    }

    updateUnitCounter();
    updatePearlDisplay();

    // intro-speaker — מנגן את רצף ה-AvriNeural בעמוד הפתיחה.
    // במקום playSequence (טיימר קבוע + לא עוצר אודיו קודם) — רצף ידני עם
    // onended + 200ms דממה בין החלקים. תוצאה: מעבר חלק ולא תקוע.
    const elIntro = document.getElementById('introSpeaker');
    if (elIntro) {
      elIntro.addEventListener('click', () => {
        if (window.AvneiAudio) AvneiAudio.unlock();
        elIntro.classList.add('playing');
        const keys = (config.introAudioKeys || []).filter(Boolean);
        if (keys.length && window.AvneiAudio) {
          let i = 0;
          const playNext = () => {
            if (i >= keys.length) return;
            const key = keys[i++];
            AvneiAudio.play(key);
            if (i < keys.length) {
              const audio = AvneiAudio.preload(key);
              const onEnd = () => setTimeout(playNext, 200);
              audio.addEventListener('ended', onEnd, { once: true });
            }
          };
          playNext();
        } else if (window.AvneiAudio) {
          AvneiAudio.playLetterSound(config.letter);
        }
        setTimeout(() => elIntro.classList.remove('playing'), 12000);
      });
    }

    // start button — hides overlay and hands off to the mechanic plug-in
    const elStart = document.getElementById('startBtn');
    if (elStart) {
      elStart.addEventListener('click', () => {
        if (window.AvneiAudio) AvneiAudio.unlock();
        const elTap = document.getElementById('tapToStart');
        if (elTap) elTap.classList.add('hidden');
        if (window.AvneiNoni) AvneiNoni.ready();
        runMechanic(config);
      });
    }

    // ?reset=1 — wipe localStorage (dev shortcut, matches the 5 existing games)
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === '1') {
      localStorage.removeItem('underwater-app:v1');
      console.log('localStorage reset.');
    }
  }

  function runMechanic(config) {
    const root = document.getElementById('gameRoot');
    if (!root) {
      console.error('AvneiGameShell: missing #gameRoot');
      return;
    }
    const mechanics = window.AvneiMechanics || {};
    const handler = mechanics[config.mechanic];
    if (!handler) {
      console.error('AvneiGameShell: unknown mechanic', config.mechanic);
      return;
    }
    // D.15 v2 F1.1 — להעביר theme ל-mechanic. ה-mechanic מוסיף
    // theme-X class על ה-root, וה-CSS עוטף את הצורה הויזואלית
    // (bubble/star/shell/fish) בהתאם.
    handler.mount(root, {
      letter:        config.letter,
      questId:       config.questId,
      theme:         config.theme || 'bubbles',
      distractors:   config.distractors || [],
      total:         config.counter.total,
      mechanicConfig: config.mechanicConfig || {},
      inGamePromptAudioKey: config.inGamePromptAudioKey || null,
      // הערה: wordPool לא מועבר ל-tap-all/pick (דפוס B — אותיות בלבד).
      // אם בעתיד נוסיף מכניקה עם תמונות (sound-match וכו') — כאן הוא יחזור.
      onUnitWon: (idx) => {
        unitsWon = idx + 1;
        updateUnitCounter();
        updatePearlDisplay();
        const customAnim = config.onUnitWon || defaultUnitWonAnim;
        customAnim(idx);
      },
      onComplete: () => {
        // D.15 v2: playLetterAnimThenFinale wraps startFinale עם אנימציה
        // ייחודית פר אות (אם letter-anims.js נטען). תאימות-אחור: אם לא נטען
        // — מדלג ישר ל-startFinale (התנהגות זהה ל-D.14).
        setTimeout(playLetterAnimThenFinale, 700);
      },
    });
  }

  return {
    start,
    // exposed for mechanic plug-ins
    spawnConfetti,
    spawnKisses,
    cheerNoni,
    markQuestCompleted,
  };
})();
