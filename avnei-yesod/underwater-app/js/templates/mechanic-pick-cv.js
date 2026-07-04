// ============================================================
// templates/mechanic-pick-cv.js — Round-based pick: אות + צירופי CV
// אי ת (תיבת האוצר) · 4.7.2026
//
// וריאנט של mechanic-pick.js: במקום אותה אות-יעד בכל הסבבים, כל סבב
// מוגדר ב-mechanicConfig.rounds — סבב זיהוי-אות או סבב CV (צליל→צירוף).
//
//   mechanic_config: {
//     podsPerRound: 4,
//     rounds: [
//       { "type": "letter" },                 // מצאו את האות עצמה
//       { "type": "cv", "vowelId": "kamatz" } // שמעו /ta/ → געו בצירוף
//     ]
//   }
//
// לקחי אי 4 (reference-avnei-yesod-island-build-checklist):
//   - phoneme group accept: target 'kamatz' → גם תָ וגם תַ פודים נכונים
//     (שניהם /a/). כששניהם בשדה — הקשה על כל אחד מהם נחשבת נכונה.
//     distractors נבחרים רק מקבוצות-צליל אחרות.
//   - pack mode: צירוף שונה בכל סבב (rounds מהקונפיג) — לא אותו צירוף ×5.
//   - אודיו הסבב מתנגן פעם אחת ב-mount (+ speaker לחזרה חופשית + hints).
//     אחרי תשובה נכונה — שבח מגוון בלבד, בלי לחזור על אודיו ההוראה.
//
// Support model — זהה ל-mechanic-pick:
//   wrong-1: visual sway only
//   wrong-2: hint-glow על פוד נכון + השמעת צליל היעד
//   wrong-3+: hint-glow + 'press-here'
//
// Logging:
//   סבב אות  — כמו mechanic-pick (activity_type 'rescue' → אי 3).
//   סבב CV   — כמו mechanic-tap-cv (activity_type 'cv-tap', primary_island_id 4,
//              target_phoneme_group — חובה ל-BKT פר-צירוף, ראו bkt.js
//              ingestIsland4Event).
// ============================================================

window.AvneiMechanics = window.AvneiMechanics || {};

window.AvneiMechanics['pick-cv'] = (function () {

  const INTER_ROUND_DELAY_MS = 2800;
  const PRAISE_POOL = ['praise-metzuyan', 'praise-mealeh']; // יופי הוסר — הגייה לא טובה ב-eleven_v3 (מיטל 4.7.2026)

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

  function mount(root, opts) {
    const VA = getVA();
    if (!VA) {
      console.error('[mechanic-pick-cv] AvneiVowelAdapter חסר — יש לטעון js/shared/vowel-adapter.js');
      return { unmount() {} };
    }

    const letter        = opts.letter;
    const distractors   = (opts.distractors || []).filter(d => d !== letter);
    const cfg           = opts.mechanicConfig || {};
    const podsPerRound  = cfg.podsPerRound || 4;
    const rounds        = Array.isArray(cfg.rounds) && cfg.rounds.length
      ? cfg.rounds
      : [{ type: 'letter' }];
    const total         = rounds.length;
    const inGamePromptKey = opts.inGamePromptAudioKey || null;
    // תוויות פרומפט — ניתנות להתאמה לנושא האי מה-JSON (טקסט ילד.ה: מנוקד, רבים)
    const cvLabel     = cfg.cvPromptLabel     || 'הַקְשִׁיבוּ — וּמִצְאוּ אֶת הַצְּלִיל!';
    const letterLabel = cfg.letterPromptLabel || 'מִצְאוּ אֶת אוֹתָהּ הָאוֹת!';

    // Preload אודיו של כל הסבבים ברגע ה-mount (אותו רציונל כמו game-shell).
    if (window.AvneiAudio) {
      rounds.forEach(r => {
        if (r.type === 'cv' && r.vowelId) {
          const k = VA.cvAudioKey(letter, r.vowelId);
          if (k) AvneiAudio.preload(k);
        }
      });
      AvneiAudio.preload('press-here');
    }

    root.innerHTML = '';
    root.classList.add('mechanic-pick', 'mechanic-pick-cv');
    if (opts.theme) root.classList.add('theme-' + opts.theme);

    // prompt bar — בסבב אות: האות הגדולה (אפס ידע קודם — רואים את הצורה).
    // בסבבי CV: כפתור רמקול בלבד (צליל→צירוף = כיוון הקריאה; two-tap:
    // האזנה חוזרת חופשית ולא נמדדת).
    const promptBar = document.createElement('div');
    promptBar.className = 'pick-cv-prompt';
    root.appendChild(promptBar);

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
      availablePraises: PRAISE_POOL.slice(),
      praiseTimer: null,
    };

    function currentRound() { return rounds[state.roundIdx] || rounds[0]; }

    function roundAudioKey(round) {
      if (round.type === 'cv' && round.vowelId) {
        return VA.cvAudioKey(letter, round.vowelId);
      }
      return inGamePromptKey; // סבב אות — הוראת המשחק (find-tav-treasure)
    }

    function playRoundAudio() {
      if (!window.AvneiAudio) return;
      const key = roundAudioKey(currentRound());
      if (key) AvneiAudio.play(key);
      else AvneiAudio.playLetterSound(letter);
    }

    function pickNextPraise() {
      if (state.availablePraises.length === 0) {
        state.availablePraises = PRAISE_POOL.slice();
      }
      const idx = Math.floor(Math.random() * state.availablePraises.length);
      return state.availablePraises.splice(idx, 1)[0];
    }

    // --- בניית פודים לסבב ---------------------------------------------
    function buildLetterPods() {
      const pool = shuffle(distractors);
      const dList = [];
      for (let i = 0; i < podsPerRound - 1; i++) {
        dList.push({ label: pool[i % pool.length] || 'ש', isTarget: false });
      }
      return shuffle([{ label: letter, isTarget: true }].concat(dList));
    }

    function buildCVPods(vowelId) {
      const group = VA.getPhonemeGroup(vowelId);
      const acceptable = group
        ? VA.getVowelsInGroup(group).map(v => v.id)
        : [vowelId];
      const acceptableSet = new Set(acceptable);

      // פודים נכונים: הצורה של ה-prompt + אחות (אם קיימת ויש מקום) —
      // תַ וגם תָ בשדה, שניהם תשובה נכונה.
      const targets = acceptable
        .slice(0, Math.max(1, podsPerRound - 2))
        .map(vid => ({
          label: VA.buildCV(letter, vid),
          isTarget: true,
          vowelId: vid,
        }));

      // distractors: אותה אות עם תנועות מקבוצות-צליל אחרות בלבד.
      const dPool = shuffle(
        VA.getVowels()
          .filter(v => !acceptableSet.has(v.id))
          .map(v => ({ label: VA.buildCV(letter, v.id), isTarget: false, vowelId: v.id }))
      );
      const dList = [];
      for (let i = 0; i < podsPerRound - targets.length; i++) {
        dList.push(dPool[i % dPool.length]);
      }
      return shuffle(targets.concat(dList));
    }

    function renderPrompt(round) {
      if (round.type === 'cv') {
        promptBar.innerHTML =
          '<button type="button" class="pick-cv-speaker" aria-label="הַקְשִׁיבוּ לַצְּלִיל">' +
            '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
              '<path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor"/>' +
              '<path d="M15.5 8.5a4 4 0 0 1 0 7M18 6a7 7 0 0 1 0 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>' +
            '</svg>' +
          '</button>' +
          '<span class="pick-cv-prompt__label">' + cvLabel + '</span>';
      } else {
        promptBar.innerHTML =
          '<span class="pick-cv-prompt__letter" aria-hidden="true">' + letter + '</span>' +
          '<span class="pick-cv-prompt__label">' + letterLabel + '</span>';
      }
      const spk = promptBar.querySelector('.pick-cv-speaker');
      if (spk) spk.addEventListener('click', playRoundAudio);
    }

    function buildRound() {
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      area.innerHTML = '';
      state.locked = false;
      state.attempts = 0;

      const round = currentRound();
      renderPrompt(round);

      const pods = (round.type === 'cv')
        ? buildCVPods(round.vowelId)
        : buildLetterPods();

      pods.forEach((p) => {
        const pod = document.createElement('button');
        pod.type = 'button';
        pod.className = 'pick-pod';
        pod.dataset.target = p.isTarget ? 'true' : 'false';
        if (p.vowelId) pod.dataset.vowel = p.vowelId;
        pod.setAttribute('aria-label', (round.type === 'cv' ? 'צֵרוּף ' : 'אוֹת ') + p.label);
        const span = document.createElement('span');
        span.className = 'pick-pod__letter';
        span.textContent = p.label;
        pod.appendChild(span);
        pod.addEventListener('click', () => handleTap(pod, round, p));
        area.appendChild(pod);
      });

      state.lastShownAt = Date.now();
      if (window.AvneiNoni) AvneiNoni.setState('idle');
      // אודיו הסבב — פעם אחת ב-mount של כל סבב (היעד משתנה בין סבבים,
      // בשונה מ-mechanic-pick שבו רק סבב 0 מקבל הוראה).
      if (window.AvneiAudio && AvneiAudio.isUnlocked && AvneiAudio.isUnlocked()) {
        setTimeout(playRoundAudio, 300);
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
      playRoundAudio();
    }

    // --- Logging ---------------------------------------------------------
    function logResult(round, pod, isCorrect, responseTime) {
      if (!window.AvneiEventLogger) return;
      try {
        if (round.type === 'cv') {
          // דפוס mechanic-tap-cv — target_phoneme_group חובה ל-BKT פר-צירוף.
          AvneiEventLogger.logActivityResult({
            activity_type: 'cv-tap',
            target_letter: letter,
            target_vowel: round.vowelId,
            target_cv: VA.buildCV(letter, round.vowelId),
            target_phoneme_group: VA.getPhonemeGroup(round.vowelId),
            tapped_vowel: pod.dataset.vowel || null,
            tapped_cv: pod.querySelector('.pick-pod__letter').textContent,
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
        } else {
          // דפוס mechanic-pick (stage-3-lamed) — אחד-לאחד.
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
        }
      } catch (e) { /* swallow */ }
    }

    function handleTap(pod, round, podData) {
      if (state.locked) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }

      const isCorrect = (pod.dataset.target === 'true');
      const responseTime = Date.now() - state.lastShownAt;
      logResult(round, pod, isCorrect, responseTime);

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

      // פידבק אחרי correct: ויזואלי + שבח מגוון בלבד. לא חוזרים על אודיו
      // ההוראה/הצליל של הסבב (לקח אי 4). בסבב האחרון — בלי שבח (ה-finale
      // של game-shell מנגן praise+finale בעצמו).
      const isLastRound = (state.wins + 1) >= total;
      if (!isLastRound && window.AvneiAudio) {
        if (state.praiseTimer) clearTimeout(state.praiseTimer);
        state.praiseTimer = setTimeout(() => {
          AvneiAudio.play(pickNextPraise());
          state.praiseTimer = null;
        }, 250);
      }

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
        if (window.AvneiAudio) setTimeout(playRoundAudio, 400);
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
        if (state.praiseTimer) clearTimeout(state.praiseTimer);
        root.innerHTML = '';
        root.classList.remove('mechanic-pick', 'mechanic-pick-cv');
      },
    };
  }

  return { mount };
})();
