// ============================================================
// templates/mechanic-tap-all.js — Tap-all-targets mechanic
//
// Extracted from stage-3-storm.html (אות ת) and stage-3-trail-resh.html
// (אות ר). A field of N tiles is laid out; T of them carry the target
// letter and the rest carry distractors. The child taps each target in
// any order. After T correct taps → onComplete.
//
// Support model — per feedback_avnei_yesod_support_levels (23.5.2026):
//   wrong-1: visual sway only (no audio)
//   wrong-2: hint-glow on a random target + play letter sound
//   wrong-3+: keep hint-glow + play 'press-here.mp3'
//
// Auto-hint after 9s of inactivity (matches rescue/storm).
// Auto-play target letter sound on mount so non-readers know the goal.
// ============================================================

window.AvneiMechanics = window.AvneiMechanics || {};

window.AvneiMechanics['tap-all'] = (function () {

  // משוב מגוון — מחליף את great.mp3 הישן (שכלל "כָּל הכבוד" עם קמץ-קטן
  // שש-AvriNeural קורא "kal"). מיטל אישרה 27.5: יופי/מצוין/מעולה ברנדום.
  const PRAISE_POOL = ['praise-yofi', 'praise-metzuyan', 'praise-mealeh'];

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

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
    const totalTiles  = cfg.totalTiles || 12;
    const numTargets  = cfg.numTargets || total;
    const inGamePromptKey = opts.inGamePromptAudioKey || null;
    // הערה: word_pool מתעלם כאן בכוונה — מכניקה של אותיות (דפוס B ב-
    // [[feedback-avnei-yesod-correct-answer-audio-pattern]]) משמיעה רק
    // צליל-אות + שבח. word_pool שייך למכניקות עם תמונות (sound-match).

    function playPromptOrLetterSound() {
      if (!window.AvneiAudio) return;
      if (inGamePromptKey) {
        AvneiAudio.play(inGamePromptKey);
      } else {
        AvneiAudio.playLetterSound(letter);
      }
    }

    root.innerHTML = '';
    root.classList.add('mechanic-tap-all');
    // D.15 v2 F1.1 — theme class (bubbles/stars/shells/fish) — CSS עוטף את
    // הצורה הויזואלית של ה-tile בהתאם.
    if (opts.theme) root.classList.add('theme-' + opts.theme);

    const field = document.createElement('div');
    field.className = 'tap-field';
    root.appendChild(field);

    const state = {
      tiles: [],
      hits: 0,
      attempts: 0,
      locked: false,
      hintTimer: null,
      lastShownAt: Date.now(),
      // pick-without-replacement של שבחים — מתחדש כשמתרוקן
      availablePraises: PRAISE_POOL.slice(),
      // timeout של פלייבק שבח — מבוטל בכל הקשה חדשה לחסום overlap
      praiseTimer: null,
      // cleanup של listener על onended — מבוטל בהקשה חדשה
      praiseCleanup: null,
    };

    function pickNextPraise() {
      if (state.availablePraises.length === 0) {
        state.availablePraises = PRAISE_POOL.slice();
      }
      const idx = Math.floor(Math.random() * state.availablePraises.length);
      return state.availablePraises.splice(idx, 1)[0];
    }

    function cancelPendingPraise() {
      if (state.praiseTimer) { clearTimeout(state.praiseTimer); state.praiseTimer = null; }
      if (state.praiseCleanup) { state.praiseCleanup(); state.praiseCleanup = null; }
    }

    function playRightHitAudio() {
      if (!window.AvneiAudio) return;

      // ביטול פלייבק שבח-קודם (גם timer וגם listener)
      cancelPendingPraise();

      const letterKey = (AvneiAudio.LETTER_TO_SOUND_FILE || {})[letter];
      const praise = pickNextPraise();

      if (!letterKey) {
        AvneiAudio.play(praise);
        return;
      }

      // צליל אות
      AvneiAudio.play(letterKey);
      const letterAudio = AvneiAudio.preload(letterKey);

      // המתנה ל-onended (לא טיימר קבוע) — כך אנחנו ממש מחכים שצליל-אות
      // יסיים בפועל, גם אם יש latency במובייל. אז עוד 220ms דממה לפני
      // שהשבח מתחיל = הפרדה ברורה אבל "השהייה קצרה" כמו שמיטל ביקשה.
      const onLetterEnded = () => {
        if (state.praiseCleanup) state.praiseCleanup();
        state.praiseCleanup = null;
        state.praiseTimer = setTimeout(() => {
          AvneiAudio.play(praise);
          state.praiseTimer = null;
        }, 220);
      };
      letterAudio.addEventListener('ended', onLetterEnded, { once: true });
      state.praiseCleanup = () => letterAudio.removeEventListener('ended', onLetterEnded);
    }

    function pickLetters() {
      const distCount = totalTiles - numTargets;
      const pool = shuffle(distractors);
      const dList = [];
      for (let i = 0; i < distCount; i++) {
        dList.push(pool[i % pool.length] || 'ש');
      }
      return shuffle([...Array(numTargets).fill(letter), ...dList]);
    }

    function buildTiles() {
      const letters = pickLetters();
      field.innerHTML = '';
      state.tiles = [];
      letters.forEach((ltr, idx) => {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'tap-tile';
        tile.dataset.letter = ltr;
        tile.dataset.target = (ltr === letter) ? 'true' : 'false';
        tile.dataset.i = String(idx);
        tile.setAttribute('aria-label', 'אות ' + ltr);
        const span = document.createElement('span');
        span.className = 'tap-tile__letter';
        span.textContent = ltr;
        tile.appendChild(span);
        tile.addEventListener('click', () => handleTap(tile));
        field.appendChild(tile);
        state.tiles.push(tile);
      });
      state.lastShownAt = Date.now();
      if (window.AvneiAudio && AvneiAudio.isUnlocked && AvneiAudio.isUnlocked()) {
        setTimeout(playPromptOrLetterSound, 300);
      }
      scheduleAutoHint();
    }

    function scheduleAutoHint() {
      if (state.hintTimer) clearTimeout(state.hintTimer);
      state.hintTimer = setTimeout(() => {
        if (state.locked) return;
        triggerHint();
      }, 9000);
    }

    function triggerHint() {
      if (window.AvneiNoni) AvneiNoni.setState('hint');
      const remaining = state.tiles.filter(t =>
        t.dataset.target === 'true' && !t.classList.contains('lit')
      );
      if (remaining.length === 0) return;
      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      pick.classList.add('hint-glow');
      playPromptOrLetterSound();
    }

    function handleTap(tile) {
      if (state.locked) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      if (tile.classList.contains('lit')) return;

      // ביטול שבח-בהמתנה מהקשה קודמת — מונע מצב שבו לחיצה על תיל שגוי
      // עדיין משמיעה "מעולה" כי השבח מהקשה נכונה קודמת היה במצב pending
      cancelPendingPraise();

      const isCorrect = (tile.dataset.target === 'true');
      const responseTime = Date.now() - state.lastShownAt;

      if (window.AvneiEventLogger) {
        AvneiEventLogger.logActivityResult({
          activity_type: 'storm-quest',
          target_letter: letter,
          item_id: opts.questId + '-tile-' + (state.hits + 1),
          supportLevel: 1,
          is_correct: isCorrect,
          attempts: state.attempts + 1,
          response_time_ms: isCorrect ? responseTime : null,
          hint_used: state.attempts >= 1,
          rama_task_alignment: opts.rama_task_alignment,
          peima_target:        opts.peima_target,
        });
      }

      if (isCorrect) {
        onRightHit(tile);
      } else {
        onWrongHit(tile);
      }
    }

    function onRightHit(tile) {
      tile.classList.remove('hint-glow');
      tile.classList.add('lit');
      state.hits++;
      state.attempts = 0;
      state.lastShownAt = Date.now();

      const isLastHit = state.hits >= numTargets;

      // הקשה אחרונה: רק צליל-אות, בלי שבח (ה-finale ינגן שבח + הודעת-סיום
      // בעצמו, כדי למנוע חפיפה ולוודא שהילדה שומעת "יופי, מצאתם את כל הבועות").
      if (isLastHit) {
        cancelPendingPraise();
        if (window.AvneiAudio) AvneiAudio.playLetterSound(letter);
      } else {
        // הקשה רגילה: צליל-אות → onended → השהייה 220ms → שבח. ראה
        // [[feedback-avnei-yesod-correct-answer-audio-pattern]].
        playRightHitAudio();
      }

      if (window.AvneiGameShell) AvneiGameShell.cheerNoni();
      opts.onUnitWon && opts.onUnitWon(state.hits - 1);

      if (isLastHit) {
        state.locked = true;
        if (state.hintTimer) clearTimeout(state.hintTimer);
        // 1200ms — מספיק לצליל-האות להישמע במלואו לפני שה-finale מתחיל
        setTimeout(() => opts.onComplete && opts.onComplete(), 1200);
        return;
      }
      scheduleAutoHint();
    }

    function onWrongHit(tile) {
      state.attempts++;
      tile.classList.add('wrong-sway');
      setTimeout(() => tile.classList.remove('wrong-sway'), 700);

      if (state.attempts === 2) {
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        const target = state.tiles.find(t =>
          t.dataset.target === 'true' && !t.classList.contains('lit')
        );
        if (target) target.classList.add('hint-glow');
        if (window.AvneiAudio) setTimeout(() => AvneiAudio.playLetterSound(letter), 400);
      } else if (state.attempts >= 3) {
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        const target = state.tiles.find(t =>
          t.dataset.target === 'true' && !t.classList.contains('lit')
        );
        if (target) target.classList.add('hint-glow');
        if (window.AvneiAudio) setTimeout(() => AvneiAudio.play('press-here'), 400);
      }
    }

    buildTiles();

    return {
      unmount() {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        cancelPendingPraise();
        root.innerHTML = '';
        root.classList.remove('mechanic-tap-all');
      },
    };
  }

  return { mount };
})();
