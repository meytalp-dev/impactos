// ============================================================
// templates/mechanic-scene-search.js — חיפוש בסצנה (אי ק · 4.7.2026)
//
// מכניקה שלישית לגיוון בין איי-אות (החלטת 4.7.2026: ת/מ=pick-cv,
// ב=בנייה, ק=חיפוש בסצנה). ברוח mechanic-tap-all, אבל במקום שורת
// אריחי-אותיות — סצנה תת-ימית אחת (scene-bg הקבוע) שעליה מפוזרים
// חפצים מתמונות מאגר האוצר (assets/vocab + _manifest.json), והילד.ה
// מוצא.ת את כל החפצים שמתחילים בצליל היעד.
//
//   mechanic_config: {
//     podsPerRound: 4,                     // לסבב discriminate בלבד
//     searchPromptLabel: "...",            // טקסט ילד.ה: מנוקד, רבים
//     rounds: [
//       { "type": "search",
//         "targets":     [{ "word": "כַּדּוּר", "manifest_word": "כדור", "audio_key": "word-kadur" }],
//         "distractors": [{ "word": "דֹּב",    "manifest_word": "דב" }] },
//       { "type": "discriminate",          // הבחנת ק/כ: אותו צליל, צורה שונה
//         "target": "ק", "distractors": ["כ", "ך", "ר"],
//         "audioKey": "qof-vs-kaf", "promptLabel": "..." }
//     ]
//   }
//
// תמונות: נטענות דרך הצינור הקיים בלבד — המכניקה קוראת את
// assets/vocab/_manifest.json (אותו מקור-אמת של vocab-image-adapter)
// וממפה manifest_word → file בזמן ריצה. מילה שאינה ב-manifest —
// console.warn + החפץ מדולג (לא ממציאים תמונות).
//
// לקחי אי 4 (reference-avnei-yesod-island-build-checklist):
//   - pack mode: הרכב חפצים שונה בכל סבב (מה-rounds בקונפיג).
//   - אודיו הסבב מתנגן פעם אחת ב-mount (+ רמקול לחזרה חופשית — לא
//     נמדדת). אחרי תשובה נכונה — שם החפץ + זוהר בלבד, בלי לחזור על
//     אודיו ההוראה.
//   - יעדי מגע ≥56px: כל חפץ הוא button ברוחב ≥88px (hitbox מרופד
//     סביב התמונה גם כשהיא קטנה).
//
// Support model — זהה ל-mechanic-tap-all:
//   wrong-1: נענוע עדין בלבד (בלי אודיו)
//   wrong-2: hint-glow על חפץ נכון + השמעת הוראת הסבב
//   wrong-3+: hint-glow + 'press-here'
//   auto-hint אחרי 9 שניות של חוסר פעילות.
//
// Logging (verdict → BKT/EPA, דפוס stage-3-lamed):
//   search       — activity_type 'scene-search', target_letter חובה
//                  (בלעדיו EPA מדלג), primary_island_id 3 מפורש +
//                  secondary [2] (מודעות לצליל פותח — כמו rescue).
//   discriminate — activity_type 'rescue' (אות ק באי 3), אחד-לאחד
//                  עם סבב האות של mechanic-pick-cv.
// ============================================================

window.AvneiMechanics = window.AvneiMechanics || {};

window.AvneiMechanics['scene-search'] = (function () {

  const INTER_ROUND_DELAY_MS = 2800;
  const PRAISE_POOL = ['praise-metzuyan', 'praise-mealeh']; // בלי "יופי" — הגייה לא טובה ב-eleven_v3 (מיטל 4.7.2026)

  const VOCAB_MANIFEST_URL = 'assets/vocab/_manifest.json';
  const VOCAB_BASE = 'assets/vocab/';

  // עמדות פיזור (אחוזים מתוך הסצנה) — עד 7 חפצים בלי חפיפה. הפיזור
  // האמיתי בין סבבים = shuffle של השיבוץ עמדה→חפץ.
  const SLOTS = [
    { left: 4,  top: 4  }, { left: 36, top: 0  }, { left: 68, top: 6  },
    { left: 8,  top: 44 }, { left: 40, top: 38 }, { left: 70, top: 46 },
    { left: 24, top: 70 },
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // word → file מתוך ה-manifest (מקור-האמת של צינור תמונות האוצר).
  let manifestWordMap = null;
  function loadManifestWords() {
    if (manifestWordMap) return Promise.resolve(manifestWordMap);
    return fetch(VOCAB_MANIFEST_URL, { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error('manifest ' + r.status); return r.json(); })
      .then(rows => {
        manifestWordMap = {};
        (rows || []).forEach(r => {
          if (r && r.word && r.file && !(r.word in manifestWordMap)) {
            manifestWordMap[r.word] = r.file;
          }
        });
        return manifestWordMap;
      })
      .catch(err => {
        console.warn('[scene-search] טעינת manifest נכשלה:', err && err.message);
        manifestWordMap = {};
        return manifestWordMap;
      });
  }

  function mount(root, opts) {
    const letter       = opts.letter;
    const cfg          = opts.mechanicConfig || {};
    const rounds       = Array.isArray(cfg.rounds) && cfg.rounds.length ? cfg.rounds : [];
    const total        = rounds.length;
    const podsPerRound = cfg.podsPerRound || 4;
    const searchLabel  = cfg.searchPromptLabel ||
      'גְּעוּ בְּכָל הַחֲפָצִים שֶׁמַּתְחִילִים בַּצְּלִיל שֶׁל הָאוֹת!';
    const inGamePromptKey = opts.inGamePromptAudioKey || null;

    root.innerHTML = '';
    root.classList.add('mechanic-scene-search');
    if (opts.theme) root.classList.add('theme-' + opts.theme);

    const promptBar = document.createElement('div');
    promptBar.className = 'pick-cv-prompt';
    root.appendChild(promptBar);

    const scene = document.createElement('div');
    scene.className = 'search-scene';
    root.appendChild(scene);

    const state = {
      roundIdx: 0,
      wins: 0,
      foundInRound: 0,
      attempts: 0,
      locked: false,
      hintTimer: null,
      praiseTimer: null,
      lastShownAt: Date.now(),
      availablePraises: PRAISE_POOL.slice(),
    };

    // Preload — אודיו הסבבים + שמות החפצים + press-here (רציונל game-shell).
    if (window.AvneiAudio) {
      AvneiAudio.preload('press-here');
      rounds.forEach(r => {
        if (r.type === 'discriminate' && r.audioKey) AvneiAudio.preload(r.audioKey);
        (r.targets || []).forEach(t => { if (t.audio_key) AvneiAudio.preload(t.audio_key); });
      });
    }

    function currentRound() { return rounds[state.roundIdx] || rounds[0]; }

    function roundAudioKey(round) {
      if (round.type === 'discriminate' && round.audioKey) return round.audioKey;
      return inGamePromptKey; // סבב חיפוש — הוראת המשחק
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

    // --- רינדור פרומפט --------------------------------------------------
    function renderPrompt(round) {
      if (round.type === 'discriminate') {
        const label = round.promptLabel ||
          'אוֹתוֹ צְלִיל — צוּרָה שׁוֹנָה! גְּעוּ בָּאוֹת הַנְּכוֹנָה.';
        promptBar.innerHTML =
          '<span class="pick-cv-prompt__letter" aria-hidden="true">' + (round.target || letter) + '</span>' +
          '<span class="pick-cv-prompt__label">' + label + '</span>';
      } else {
        promptBar.innerHTML =
          '<button type="button" class="pick-cv-speaker" aria-label="הַקְשִׁיבוּ לַהוֹרָאָה">' +
            '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
              '<path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor"/>' +
              '<path d="M15.5 8.5a4 4 0 0 1 0 7M18 6a7 7 0 0 1 0 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>' +
            '</svg>' +
          '</button>' +
          '<span class="pick-cv-prompt__label">' + (currentRound().promptLabel || searchLabel) + '</span>';
      }
      const spk = promptBar.querySelector('.pick-cv-speaker');
      // האזנה חוזרת חופשית — לא נמדדת (רוח דפוס ה-two-tap).
      if (spk) spk.addEventListener('click', playRoundAudio);
    }

    // --- סבב חיפוש -------------------------------------------------------
    function buildSearchRound(round, wordMap) {
      const items = shuffle(
        (round.targets || []).map(t => Object.assign({}, t, { isTarget: true }))
          .concat((round.distractors || []).map(d => Object.assign({}, d, { isTarget: false })))
      );
      const slots = shuffle(SLOTS).slice(0, items.length);
      let placed = 0;

      items.forEach((it, i) => {
        const file = wordMap[it.manifest_word];
        if (!file) {
          console.warn('[scene-search] אין תמונה ב-manifest עבור:', it.manifest_word);
          return;
        }
        const slot = slots[i];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'search-item';
        btn.dataset.target = it.isTarget ? 'true' : 'false';
        btn.dataset.word = it.manifest_word;
        btn.style.left = slot.left + '%';
        btn.style.top = slot.top + '%';
        btn.setAttribute('aria-label', it.word);
        const img = document.createElement('img');
        img.src = VOCAB_BASE + file;
        img.alt = it.word;
        img.draggable = false;
        btn.appendChild(img);
        btn.addEventListener('click', () => handleSearchTap(btn, it));
        scene.appendChild(btn);
        placed++;
      });

      // חסינות: אם אף יעד לא הוצב (manifest חסר) — לא נתקעים; מדלגים לסבב הבא.
      const targetsPlaced = scene.querySelectorAll('.search-item[data-target="true"]').length;
      if (!targetsPlaced) {
        console.warn('[scene-search] סבב בלי יעדים — מדלג.');
        setTimeout(roundWon, 400);
      }
      return placed;
    }

    // --- סבב הבחנה (ק/כ — אותו צליל, צורה שונה) ---------------------------
    function buildDiscriminateRound(round) {
      const area = document.createElement('div');
      area.className = 'pick-area search-discriminate';
      scene.appendChild(area);

      const target = round.target || letter;
      const pool = shuffle((round.distractors || []).filter(d => d !== target));
      const pods = [{ label: target, isTarget: true }];
      for (let i = 0; i < podsPerRound - 1; i++) {
        pods.push({ label: pool[i % pool.length] || 'כ', isTarget: false });
      }
      shuffle(pods).forEach(p => {
        const pod = document.createElement('button');
        pod.type = 'button';
        pod.className = 'pick-pod';
        pod.dataset.target = p.isTarget ? 'true' : 'false';
        pod.setAttribute('aria-label', 'אוֹת ' + p.label);
        const span = document.createElement('span');
        span.className = 'pick-pod__letter';
        span.textContent = p.label;
        pod.appendChild(span);
        pod.addEventListener('click', () => handleDiscriminateTap(pod));
        area.appendChild(pod);
      });
    }

    function buildRound(wordMap) {
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      scene.innerHTML = '';
      state.locked = false;
      state.attempts = 0;
      state.foundInRound = 0;

      const round = currentRound();
      renderPrompt(round);
      if (round.type === 'discriminate') buildDiscriminateRound(round);
      else buildSearchRound(round, wordMap);

      state.lastShownAt = Date.now();
      if (window.AvneiNoni) AvneiNoni.setState('idle');
      // אודיו הסבב — פעם אחת ב-mount של כל סבב (לקח אי 4).
      if (window.AvneiAudio && AvneiAudio.isUnlocked && AvneiAudio.isUnlocked()) {
        setTimeout(playRoundAudio, 300);
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

    function remainingTargets() {
      return Array.prototype.slice.call(
        scene.querySelectorAll('[data-target="true"]:not(.found):not(.picked)')
      );
    }

    function triggerHint() {
      if (window.AvneiNoni) AvneiNoni.setState('hint');
      const remaining = remainingTargets();
      if (!remaining.length) return;
      remaining[Math.floor(Math.random() * remaining.length)].classList.add('hint-glow');
      playRoundAudio();
    }

    // --- Logging (דפוס stage-3-lamed → BKT/EPA) ---------------------------
    function logResult(round, isCorrect, responseTime, itemSlug) {
      if (!window.AvneiEventLogger) return;
      try {
        if (round.type === 'discriminate') {
          // אחד-לאחד עם סבב האות של mechanic-pick-cv — activity 'rescue' (אות ק, אי 3).
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
          // target_letter חובה — בלעדיו EPA מדלג על הטעות (whitelist event-logger).
          AvneiEventLogger.logActivityResult({
            activity_type: 'scene-search',
            target_letter: letter,
            item_id: opts.questId + '-r' + (state.roundIdx + 1) + '-' + itemSlug,
            supportLevel: 1,
            is_correct: isCorrect,
            attempts: state.attempts + 1,
            response_time_ms: isCorrect ? responseTime : null,
            hint_used: state.attempts >= 1,
            primary_island_id: 3,
            secondary_island_ids: [2],
            rama_task_alignment: opts.rama_task_alignment,
            peima_target:        opts.peima_target,
          });
        }
      } catch (e) { /* swallow */ }
    }

    // --- טיפול בהקשות ------------------------------------------------------
    function handleSearchTap(btn, it) {
      if (state.locked || btn.classList.contains('found')) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }

      const isCorrect = (btn.dataset.target === 'true');
      const responseTime = Date.now() - state.lastShownAt;
      logResult(currentRound(), isCorrect, responseTime, it.manifest_word);

      if (isCorrect) {
        btn.classList.remove('hint-glow');
        btn.classList.add('found');
        state.foundInRound++;
        state.attempts = 0;
        state.lastShownAt = Date.now();
        // פידבק על נכון: זוהר + שם החפץ (מידע חדש — לא חזרה על ההוראה).
        if (window.AvneiAudio && it.audio_key) AvneiAudio.play(it.audio_key);
        if (window.AvneiGameShell) AvneiGameShell.cheerNoni();

        const targetsTotal = scene.querySelectorAll('.search-item[data-target="true"]').length;
        if (state.foundInRound >= targetsTotal) {
          roundWon();
        } else {
          scheduleAutoHint();
        }
      } else {
        onWrong(btn);
      }
    }

    function handleDiscriminateTap(pod) {
      if (state.locked) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }

      const isCorrect = (pod.dataset.target === 'true');
      const responseTime = Date.now() - state.lastShownAt;
      logResult(currentRound(), isCorrect, responseTime, null);

      if (isCorrect) {
        pod.classList.add('picked');
        if (window.AvneiGameShell) AvneiGameShell.cheerNoni();
        roundWon();
      } else {
        onWrong(pod);
      }
    }

    function roundWon() {
      state.locked = true;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      if (typeof addPearl === 'function') addPearl(1);

      const isLastRound = (state.wins + 1) >= total;
      // שבח מגוון בין סבבים; בסבב האחרון בלי שבח — ה-finale של game-shell
      // מנגן praise+finale בעצמו (מניעת חפיפה, דפוס pick-cv).
      if (!isLastRound && window.AvneiAudio) {
        if (state.praiseTimer) clearTimeout(state.praiseTimer);
        state.praiseTimer = setTimeout(() => {
          AvneiAudio.play(pickNextPraise());
          state.praiseTimer = null;
        }, 1100); // אחרי ששם-החפץ סיים להתנגן
      }

      opts.onUnitWon && opts.onUnitWon(state.wins);
      state.wins++;

      setTimeout(() => {
        if (state.wins >= total) {
          opts.onComplete && opts.onComplete();
        } else {
          state.roundIdx++;
          setTimeout(() => buildRound(manifestWordMap || {}), INTER_ROUND_DELAY_MS - 1100);
        }
      }, 1100);
    }

    function onWrong(el) {
      state.attempts++;
      // חפץ שגוי מנענע ראש בעדינות (wrong-1: ויזואלי בלבד).
      el.classList.add('wrong-sway');
      setTimeout(() => el.classList.remove('wrong-sway'), 700);

      if (state.attempts === 2) {
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        const remaining = remainingTargets();
        if (remaining.length) remaining[0].classList.add('hint-glow');
        if (window.AvneiAudio) setTimeout(playRoundAudio, 400);
      } else if (state.attempts >= 3) {
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        const remaining = remainingTargets();
        if (remaining.length) remaining[0].classList.add('hint-glow');
        if (window.AvneiAudio) setTimeout(() => AvneiAudio.play('press-here'), 400);
      }
    }

    // התמונות מגיעות מצינור המאגר — קודם manifest, ואז הסבב הראשון.
    loadManifestWords().then(buildRound);

    return {
      unmount() {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        if (state.praiseTimer) clearTimeout(state.praiseTimer);
        root.innerHTML = '';
        root.classList.remove('mechanic-scene-search');
      },
    };
  }

  return { mount };
})();
