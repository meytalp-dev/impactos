// ============================================================
// templates/mechanic-cv-build-drag.js — בנייה בגרירה: אות + ניקוד = צירוף
// אי ב (הבית של הדג הקטן) · 4.7.2026
//
// התאמה של mechanic-cv-build.js (אי 4, בחירה בהקשה) לגרירה — לא מנוע
// מאפס: אותם phoneme-group accept, scaffolding, ודפוס logging. ההבדלים:
//   1. round-based מהקונפיג (pack mode — יעד שונה פר סבב), לא adaptive.
//   2. האינטראקציה: גוררים אֶבֶן-ניקוד אל האות בּ → הצירוף "נדבק" ומתנגן.
//   3. שלושה סוגי סבבים:
//        { "type": "letter" }                       — זיהוי בּ בין מסיחים (pick פשוט)
//        { "type": "build",      "vowelId": "..." } — בניית צירוף לפי צליל
//        { "type": "build-word", "vowelId": "...",  — בניית הצירוף שמשלים מילה
//          "wordRest": "יִת", "word": "בַּיִת",
//          "wordAudioKey": "...", "audioKey": "..." }
//
// לקחי אי 4 (reference-avnei-yesod-island-build-checklist):
//   - phoneme group accept: יעד patach → גם קמץ נכון (שניהם /a/).
//   - אודיו היעד מתנגן פעם אחת ב-mount של סבב; רמקול = האזנה חופשית
//     (לא נמדדת); אחרי נכון — פידבק ויזואלי + שבח בלבד, בלי לחזור על ההוראה.
//   - ב/כ/פ: VA.buildCV מוסיף דגש קל אוטומטית (בַּ=/ba/ לא /va/).
//   - יעדי מגע ≥56px: אבני ניקוד 76px, פודים של game-shell.css.
//
// גרירה: Pointer Events + setPointerCapture. snap נדיב — הצלחת עגינה אם
// מרכז האבן בתוך רדיוס SNAP_RADIUS מהחריץ שמתחת לאות (לא pixel-perfect).
//
// Logging (זהה ל-cv-build/pick-cv — עובר את הרשימה הלבנה של event-logger):
//   סבב letter     → activity 'rescue' (אי 3), target_letter חובה.
//   סבבי build     → activity 'cv-build-task', primary_island_id 4,
//                    target_phoneme_group חובה ל-BKT פר-צירוף (bkt.js per_cv).
// ============================================================

window.AvneiMechanics = window.AvneiMechanics || {};

window.AvneiMechanics['cv-build-drag'] = (function () {
  'use strict';

  const PRAISE_POOL = ['praise-metzuyan', 'praise-mealeh']; // בלי 'יופי' (הגייה רעה ב-eleven_v3)
  const SNAP_RADIUS = 120;          // px — רדיוס קליטה נדיב סביב החריץ
  const INTER_ROUND_DELAY_MS = 1900;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getVA() {
    return (typeof window !== 'undefined' && window.AvneiVowelAdapter) || null;
  }

  function playKey(key) {
    if (window.AvneiAudio && key) return AvneiAudio.play(key);
    return Promise.resolve();
  }

  function mount(root, opts) {
    const VA = getVA();
    if (!VA) {
      console.error('[mechanic-cv-build-drag] AvneiVowelAdapter חסר — יש לטעון js/shared/vowel-adapter.js');
      return { unmount() {} };
    }

    const letter      = opts.letter;
    const distractors = (opts.distractors || []).filter(d => d !== letter);
    const cfg         = opts.mechanicConfig || {};
    const rounds      = Array.isArray(cfg.rounds) && cfg.rounds.length
      ? cfg.rounds
      : [{ type: 'letter' }];
    const total       = rounds.length;
    // אבני הניקוד בתצלוֹבת (tray) — קבועות לכל הסבבים; היעד משתנה (pack mode).
    const trayVowelIds = Array.isArray(cfg.trayVowels) && cfg.trayVowels.length
      ? cfg.trayVowels
      : ['patach', 'kamatz', 'hiriq', 'holam'];
    const letterLabel = cfg.letterPromptLabel || 'מִצְאוּ אֶת הָאוֹת!';
    const buildLabel  = cfg.buildPromptLabel  || 'הַקְשִׁיבוּ — וּבְנוּ אֶת הַצְּלִיל!';
    const wordLabel   = cfg.wordPromptLabel   || 'הַשְׁלִימוּ אֶת הַמִּלָּה!';
    const inGamePromptKey = opts.inGamePromptAudioKey || null;

    // תצוגת האות בעמדת הבנייה: ב/כ/פ עם דגש קל (מה שנבנה זה מה שרואים).
    const letterDisplay = VA.BKP_LETTERS.includes(letter) ? (letter + VA.DAGESH) : letter;

    // Preload — אודיו של כל הסבבים ברגע ה-mount (דפוס pick-cv/game-shell).
    if (window.AvneiAudio) {
      rounds.forEach(r => {
        if ((r.type === 'build' || r.type === 'build-word') && r.vowelId) {
          const k = VA.cvAudioKey(letter, r.vowelId);
          if (k) AvneiAudio.preload(k);
        }
        if (r.audioKey) AvneiAudio.preload(r.audioKey);
        if (r.wordAudioKey) AvneiAudio.preload(r.wordAudioKey);
      });
      AvneiAudio.preload('press-here');
      PRAISE_POOL.forEach(k => AvneiAudio.preload(k));
    }

    root.innerHTML = '';
    root.classList.add('mechanic-cv-build-drag');
    if (opts.theme) root.classList.add('theme-' + opts.theme);

    const promptBar = document.createElement('div');
    promptBar.className = 'bdrag-prompt';
    root.appendChild(promptBar);

    const area = document.createElement('div');
    area.className = 'bdrag-area';
    root.appendChild(area);

    const state = {
      roundIdx: 0,
      wins: 0,
      attempts: 0,
      locked: false,
      hintTimer: null,
      praiseTimer: null,
      lastShownAt: Date.now(),
      availablePraises: PRAISE_POOL.slice(),
      dragCleanups: [],
    };

    function currentRound() { return rounds[state.roundIdx] || rounds[0]; }

    function roundAudioKey(round) {
      if (round.audioKey) return round.audioKey;              // הסבר ייעודי לסבב
      if ((round.type === 'build' || round.type === 'build-word') && round.vowelId) {
        return VA.cvAudioKey(letter, round.vowelId);          // הצליל שבונים
      }
      return inGamePromptKey;                                 // סבב אות
    }

    function playRoundAudio() {
      const key = roundAudioKey(currentRound());
      if (key) playKey(key);
      else if (window.AvneiAudio) AvneiAudio.playLetterSound(letter);
    }

    function pickNextPraise() {
      if (state.availablePraises.length === 0) state.availablePraises = PRAISE_POOL.slice();
      const idx = Math.floor(Math.random() * state.availablePraises.length);
      return state.availablePraises.splice(idx, 1)[0];
    }

    // --- Logging (דפוס pick-cv / cv-build — 1:1) -----------------------
    function logResult(round, chosenVowelId, isCorrect, responseTime) {
      if (!window.AvneiEventLogger) return;
      try {
        if (round.type === 'letter') {
          AvneiEventLogger.logActivityResult({
            activity_type: 'rescue',
            target_letter: letter,
            item_id: opts.questId + '-round-' + (state.wins + 1),
            supportLevel: 1,
            is_correct: isCorrect,
            attempts: state.attempts + 1,
            response_time_ms: isCorrect ? responseTime : null,
            hint_used: state.attempts >= 1,
            rama_task_alignment: opts.rama_task_alignment,
            peima_target:        opts.peima_target,
          });
        } else {
          AvneiEventLogger.logActivityResult({
            activity_type: 'cv-build-task',
            target_letter: letter,
            target_vowel: round.vowelId,
            target_cv: VA.buildCV(letter, round.vowelId),
            target_phoneme_group: VA.getPhonemeGroup(round.vowelId),
            tapped_vowel: chosenVowelId || null,
            tapped_cv: chosenVowelId ? VA.buildCV(letter, chosenVowelId) : null,
            built_letter: letter,
            item_id: opts.questId + '-round-' + (state.wins + 1),
            supportLevel: 1,
            is_correct: isCorrect,
            attempts: state.attempts + 1,
            response_time_ms: isCorrect ? responseTime : null,
            hint_used: state.attempts >= 1,
            primary_island_id: 4,
            secondary_island_ids: [3],
            rama_task_alignment: opts.rama_task_alignment,
            peima_target:        opts.peima_target,
          });
        }
      } catch (e) { /* swallow */ }
    }

    // phoneme group accept (chalupa B): יעד patach → גם kamatz נכון.
    function isCorrectVowel(round, vowelId) {
      if (vowelId === round.vowelId) return true;
      const tg = VA.getPhonemeGroup(round.vowelId);
      const bg = VA.getPhonemeGroup(vowelId);
      return !!(tg && bg && tg === bg);
    }

    // --- סבב אות: pick פשוט (משתמש ב-.pick-area/.pick-pod של game-shell.css)
    function buildLetterRound(round) {
      promptBar.innerHTML =
        '<span class="bdrag-prompt__letter" aria-hidden="true">' + letter + '</span>' +
        '<span class="bdrag-prompt__label">' + letterLabel + '</span>';

      const grid = document.createElement('div');
      grid.className = 'pick-area';
      area.appendChild(grid);

      const pool = shuffle(distractors);
      const pods = shuffle(
        [{ label: letter, isTarget: true }].concat(
          [0, 1, 2].map(i => ({ label: pool[i % pool.length] || 'ש', isTarget: false }))
        )
      );

      pods.forEach(p => {
        const pod = document.createElement('button');
        pod.type = 'button';
        pod.className = 'pick-pod';
        pod.dataset.target = p.isTarget ? 'true' : 'false';
        pod.setAttribute('aria-label', 'אוֹת ' + p.label);
        const span = document.createElement('span');
        span.className = 'pick-pod__letter';
        span.textContent = p.label;
        pod.appendChild(span);
        pod.addEventListener('click', () => {
          if (state.locked) return;
          const isCorrect = pod.dataset.target === 'true';
          logResult(round, null, isCorrect, Date.now() - state.lastShownAt);
          if (isCorrect) {
            state.locked = true;
            pod.classList.add('picked');
            winRound();
          } else {
            wrongAttempt(() => {
              grid.querySelectorAll('.pick-pod[data-target="true"]')
                  .forEach(el => el.classList.add('hint-glow'));
            });
            pod.classList.add('wrong-sway');
            setTimeout(() => pod.classList.remove('wrong-sway'), 700);
          }
        });
        grid.appendChild(pod);
      });
    }

    // --- סבבי בנייה: גרירת אבן-ניקוד אל האות ---------------------------
    function buildBuildRound(round) {
      const isWord = round.type === 'build-word';
      promptBar.innerHTML =
        '<button type="button" class="bdrag-speaker" aria-label="הַקְשִׁיבוּ לַצְּלִיל">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
            '<path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor"/>' +
            '<path d="M15.5 8.5a4 4 0 0 1 0 7M18 6a7 7 0 0 1 0 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>' +
          '</svg>' +
        '</button>' +
        '<span class="bdrag-prompt__label">' + (isWord ? wordLabel : buildLabel) + '</span>';
      promptBar.querySelector('.bdrag-speaker').addEventListener('click', playRoundAudio);

      // עמדת הבנייה: האות בּ + חריץ ניקוד מתחתיה (+ שאר המילה בסבב word)
      const stage = document.createElement('div');
      stage.className = 'bdrag-stage';
      stage.innerHTML =
        '<div class="bdrag-word" dir="rtl">' +
          '<div class="bdrag-anvil" id="bdragAnvil">' +
            '<span class="bdrag-anvil__letter">' + letterDisplay + '</span>' +
            '<span class="bdrag-anvil__slot" id="bdragSlot" aria-hidden="true"></span>' +
          '</div>' +
          (isWord ? '<span class="bdrag-word__rest">' + (round.wordRest || '') + '</span>' : '') +
        '</div>' +
        '<div class="bdrag-built" id="bdragBuilt" aria-live="polite"></div>';
      area.appendChild(stage);

      // מגש אבני הניקוד
      const tray = document.createElement('div');
      tray.className = 'bdrag-tray';
      shuffle(trayVowelIds).forEach(vid => {
        const v = VA.getVowelById(vid);
        if (!v) return;
        const stone = document.createElement('button');
        stone.type = 'button';
        stone.className = 'bdrag-stone';
        stone.dataset.vowel = vid;
        stone.setAttribute('aria-label', 'נִקּוּד ' + v.displayHe);
        // X לטיני = נושא ניטרלי שמבליט את הניקוד (החלטת מיטל 29.6.2026 —
        // ◌ dotted-circle היה חיוור מדי; ✕ U+2715 חסר ב-Heebo).
        stone.innerHTML = '<span class="bdrag-stone__mark">X' + v.symbol + '</span>';
        tray.appendChild(stone);
        makeDraggable(stone, round);
      });
      area.appendChild(tray);
    }

    // גרירה — Pointer Events, snap נדיב לחריץ.
    function makeDraggable(stone, round) {
      let startX = 0, startY = 0, curX = 0, curY = 0, dragging = false;

      function onDown(e) {
        if (state.locked || stone.classList.contains('locked-in')) return;
        dragging = true;
        startX = e.clientX; startY = e.clientY;
        curX = 0; curY = 0;
        stone.classList.add('dragging');
        stone.setPointerCapture(e.pointerId);
        e.preventDefault();
      }
      function onMove(e) {
        if (!dragging) return;
        curX = e.clientX - startX;
        curY = e.clientY - startY;
        stone.style.transform = 'translate(' + curX + 'px,' + curY + 'px) scale(1.15)';
      }
      function onUp(e) {
        if (!dragging) return;
        dragging = false;
        stone.classList.remove('dragging');
        const slot = document.getElementById('bdragSlot');
        let snapped = false;
        if (slot) {
          const sr = stone.getBoundingClientRect();
          const tr = slot.getBoundingClientRect();
          const dx = (sr.left + sr.width / 2) - (tr.left + tr.width / 2);
          const dy = (sr.top + sr.height / 2) - (tr.top + tr.height / 2);
          snapped = Math.hypot(dx, dy) <= SNAP_RADIUS;
        }
        if (snapped && !state.locked) {
          onDrop(stone, round);
        } else {
          stone.style.transform = '';   // חזרה למגש
        }
      }

      stone.addEventListener('pointerdown', onDown);
      stone.addEventListener('pointermove', onMove);
      stone.addEventListener('pointerup', onUp);
      stone.addEventListener('pointercancel', onUp);
      state.dragCleanups.push(() => {
        stone.removeEventListener('pointerdown', onDown);
        stone.removeEventListener('pointermove', onMove);
        stone.removeEventListener('pointerup', onUp);
        stone.removeEventListener('pointercancel', onUp);
      });
    }

    function onDrop(stone, round) {
      const vid = stone.dataset.vowel;
      const isCorrect = isCorrectVowel(round, vid);
      const cv = VA.buildCV(letter, vid);
      logResult(round, vid, isCorrect, Date.now() - state.lastShownAt);

      if (isCorrect) {
        state.locked = true;
        // הצירוף "נדבק": האבן ננעלת בחריץ, הצירוף המורכב מוצג ומתנגן.
        stone.classList.add('locked-in');
        stone.style.transform = '';
        stone.style.visibility = 'hidden';
        const anvil = document.getElementById('bdragAnvil');
        if (anvil) {
          anvil.classList.add('built');
          anvil.querySelector('.bdrag-anvil__letter').textContent = cv;
          const slot = document.getElementById('bdragSlot');
          if (slot) slot.style.display = 'none';
        }
        const builtEl = document.getElementById('bdragBuilt');
        const isWord = round.type === 'build-word';

        // הצלחה = הצירוף המורכב מתנגן (הצורה שהילד.ה בנה.תה בפועל).
        const builtKey = VA.cvAudioKey(letter, vid);
        playKey(builtKey);

        if (isWord && builtEl && round.word) {
          builtEl.innerHTML = '<strong>' + round.word + '</strong>';
          // אחרי הצירוף — המילה השלמה (מוקלט קיים, לא TTS בדפדפן).
          if (round.wordAudioKey && window.AvneiAudio) {
            const a = AvneiAudio.preload(builtKey);
            a.addEventListener('ended', () => playKey(round.wordAudioKey), { once: true });
          }
        }
        winRound();
      } else {
        wrongAttempt(() => {
          // hint: הדגשת האבנים הנכונות (יעד + אחות-צליל)
          area.querySelectorAll('.bdrag-stone').forEach(s => {
            if (isCorrectVowel(round, s.dataset.vowel)) s.classList.add('hint-glow');
          });
        });
        stone.classList.add('wrong-sway');
        stone.style.transform = '';
        setTimeout(() => stone.classList.remove('wrong-sway'), 700);
      }
    }

    // --- זרימת נכון/טעות משותפת -----------------------------------------
    function winRound() {
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      if (window.AvneiNoni) AvneiNoni.setState('cheer');

      // פידבק אחרי נכון: ויזואלי + שבח מגוון בלבד — בלי לחזור על אודיו ההוראה
      // (לקח אי 4). בסבב האחרון game-shell מנגן praise+finale בעצמו.
      const isLastRound = (state.wins + 1) >= total;
      if (!isLastRound && window.AvneiAudio) {
        if (state.praiseTimer) clearTimeout(state.praiseTimer);
        state.praiseTimer = setTimeout(() => {
          AvneiAudio.play(pickNextPraise());
          state.praiseTimer = null;
        }, 900);
      }

      if (typeof addPearl === 'function') addPearl(1);
      opts.onUnitWon && opts.onUnitWon(state.wins);
      state.wins++;

      setTimeout(() => {
        if (state.wins >= total) {
          opts.onComplete && opts.onComplete();
        } else {
          state.roundIdx++;
          buildRound();
        }
      }, INTER_ROUND_DELAY_MS);
    }

    function wrongAttempt(applyHintGlow) {
      state.attempts++;
      if (state.attempts === 2) {
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        applyHintGlow();
        if (window.AvneiAudio) setTimeout(playRoundAudio, 500);
      } else if (state.attempts >= 3) {
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        applyHintGlow();
        if (window.AvneiAudio) setTimeout(() => AvneiAudio.play('press-here'), 500);
      }
    }

    function triggerHint() {
      state.hintTimer = null;
      if (state.locked) return;
      if (window.AvneiNoni) AvneiNoni.setState('hint');
      const round = currentRound();
      if (round.type === 'letter') {
        area.querySelectorAll('.pick-pod[data-target="true"]').forEach(p => p.classList.add('hint-glow'));
      } else {
        area.querySelectorAll('.bdrag-stone').forEach(s => {
          if (isCorrectVowel(round, s.dataset.vowel)) s.classList.add('hint-glow');
        });
      }
      playRoundAudio();
    }

    function buildRound() {
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      state.dragCleanups.forEach(fn => fn());
      state.dragCleanups = [];
      area.innerHTML = '';
      state.locked = false;
      state.attempts = 0;

      const round = currentRound();
      if (round.type === 'letter') buildLetterRound(round);
      else buildBuildRound(round);

      state.lastShownAt = Date.now();
      if (window.AvneiNoni) AvneiNoni.setState('idle');
      // אודיו הסבב — פעם אחת ב-mount של כל סבב (היעד משתנה בין סבבים).
      if (window.AvneiAudio && AvneiAudio.isUnlocked && AvneiAudio.isUnlocked()) {
        setTimeout(playRoundAudio, 300);
      }
      state.hintTimer = setTimeout(triggerHint, 10000);
    }

    buildRound();

    return {
      unmount() {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        if (state.praiseTimer) clearTimeout(state.praiseTimer);
        state.dragCleanups.forEach(fn => fn());
        root.innerHTML = '';
        root.classList.remove('mechanic-cv-build-drag');
      },
    };
  }

  return { mount };
})();
