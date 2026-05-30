// ============================================================================
// templates/mechanic-tap-cv.js — Tap-CV-pair mechanic (אי 4 — אות-ניקוד-צליל)
// סוכן 29 · 29.5.2026
//
// תבנית בהשראת mechanic-tap-all.js (אי 3) — שדה של N tiles, T מהם תואמים את
// ה-target. הילדה מקישה על כל ה-T בכל סדר. אחרי T הקשות נכונות → onComplete.
//
// עדכוני 29.5.2026 ערב (החלטות מיטל):
//   1. אודיו = AvneiAudio MP3 (cv-<letter_key>-<vowel_id>.mp3 שהופקו ב-
//      generate-island-04-cv-audio.py · AvriNeural). Web Speech = fallback.
//      [שינוי מההוראת תזמורת המקורית — Web Speech לא עובד ב-Windows ללא קול
//      עברי, ובמשחקונים הקיימים כולם משתמשים ב-MP3.]
//   2. **חלופה ב' פדגוגית:** טייל עם sister vowel (אותה phoneme group) נחשב
//      נכון. דוגמה: target='מ:patach' → גם 'מַ' וגם 'מָ' מתקבלים כנכונים,
//      כי שניהם /ma/. distractors מסוננים — לא כוללים sister vowels.
//
// Sub-BKT — לפי הוראת תזמורת: target_letter ב-event = letter בלבד (לא ה-CV).
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

  // --------------------------------------------------------------------------
  // Audio strategy
  //   1. AvneiAudio.play('cv-<letter_key>-<vowel_id>') — אם קיים MP3 (preferred)
  //   2. Web Speech he-IL — fallback (יעבוד רק אם יש קול עברי)
  // --------------------------------------------------------------------------
  function playCV(letter, vowelId) {
    const VA = (typeof window !== 'undefined') ? window.AvneiVowelAdapter : null;
    const AvneiAudio = (typeof window !== 'undefined') ? window.AvneiAudio : null;
    if (VA && AvneiAudio && typeof AvneiAudio.play === 'function') {
      const audioKey = VA.cvAudioKey(letter, vowelId);
      if (audioKey) {
        AvneiAudio.play(audioKey);
        return;
      }
    }
    // Fallback — Web Speech
    if (VA) {
      const cv = VA.buildCV(letter, vowelId);
      if (cv) speakHe(cv);
    }
  }

  function speakHe(text, opts) {
    if (typeof window === 'undefined') return;
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    try {
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = 'he-IL';
      utter.rate = (opts && opts.rate) || 0.85;
      utter.pitch = (opts && opts.pitch) || 1.0;
      utter.volume = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) { /* swallow */ }
  }

  // --------------------------------------------------------------------------
  // CV pair generation
  //
  // Acceptable tiles (chalupa B): כל ה-vowels באותה phoneme group כמו ה-target.
  //   target='מ:patach' (group='a') → acceptable={patach, kamatz}
  //   target='מ:hiriq'  (group='i') → acceptable={hiriq בלבד}
  //
  // Distractor pool: same letter + vowels מ-phoneme groups *שונות*.
  // --------------------------------------------------------------------------
  function getVowelAdapter() {
    if (typeof window !== 'undefined' && window.AvneiVowelAdapter) return window.AvneiVowelAdapter;
    return null;
  }

  function buildAcceptableVowels(targetVowel) {
    const VA = getVowelAdapter();
    if (!VA) return [targetVowel];
    const group = VA.getPhonemeGroup(targetVowel);
    if (!group) return [targetVowel];
    return VA.getVowelsInGroup(group).map(function (v) { return v.id; });
  }

  function buildDistractorPool(targetLetter, targetVowel) {
    const VA = getVowelAdapter();
    if (!VA) return [];
    const acceptableSet = new Set(buildAcceptableVowels(targetVowel));
    const out = [];
    VA.getVowels().forEach(function (v) {
      if (acceptableSet.has(v.id)) return;          // לא distractor — זה accepted
      out.push({ letter: targetLetter, vowelId: v.id, cv: VA.buildCV(targetLetter, v.id) });
    });
    return out.filter(function (d) { return d.cv; });
  }

  function buildTargetTiles(targetLetter, targetVowel, numTargets) {
    const VA = getVowelAdapter();
    if (!VA) return [];
    const acceptable = buildAcceptableVowels(targetVowel);
    const targets = [];
    // אם 2+ vowels acceptable → לחלק בערך שווה ביניהם.
    // לדוגמה: numTargets=5, acceptable=[patach,kamatz] → 3 patach + 2 kamatz.
    for (let i = 0; i < numTargets; i++) {
      const vid = acceptable[i % acceptable.length];
      targets.push({
        letter: targetLetter,
        vowelId: vid,
        cv: VA.buildCV(targetLetter, vid),
        isTargetForm: vid === targetVowel,        // האם זה הצורה המקורית של ה-prompt
      });
    }
    return shuffle(targets);
  }

  // --------------------------------------------------------------------------
  // mount(root, opts)
  // opts:
  //   letter             — האות (תו עברי בודד, חובה)
  //   vowelId            — vowel id (חובה — קובע את phoneme group)
  //   totalTiles         — סה"כ tiles בשדה (default 12)
  //   numTargets         — כמה tiles עם CV accepted (default 5)
  //   onUnitWon          — callback(idx)
  //   onComplete         — callback()
  //   questId            — מזהה לאירועי event-logger
  // --------------------------------------------------------------------------
  function mount(root, opts) {
    const VA = getVowelAdapter();
    if (!VA) {
      console.error('[mechanic-tap-cv] AvneiVowelAdapter חסר');
      return { unmount: function () {} };
    }

    const letter = opts.letter;
    const vowelId = opts.vowelId;
    const targetCV = VA.buildCV(letter, vowelId);
    if (!targetCV) {
      console.error('[mechanic-tap-cv] CV pair לא חוקי: ' + letter + ':' + vowelId);
      return { unmount: function () {} };
    }
    const totalTiles = (opts.totalTiles && opts.totalTiles > 0) ? opts.totalTiles : 12;
    const numTargets = (opts.numTargets && opts.numTargets > 0) ? opts.numTargets : 5;
    const questId = opts.questId || ('isl04-cv-' + letter + '-' + vowelId);

    const acceptableVowels = buildAcceptableVowels(vowelId);
    const acceptableSet = new Set(acceptableVowels);
    const distractorPool = buildDistractorPool(letter, vowelId);
    if (distractorPool.length === 0) {
      console.error('[mechanic-tap-cv] distractor pool ריק');
      return { unmount: function () {} };
    }
    const phonemeGroup = VA.getPhonemeGroup(vowelId);
    const sisterVowels = VA.getSisterVowels(vowelId);
    const hasSisters = sisterVowels.length > 0;

    // --- Build DOM ---
    root.innerHTML = '';
    root.classList.add('mechanic-tap-cv');

    const promptBar = document.createElement('div');
    promptBar.className = 'tap-cv-prompt';
    if (hasSisters) {
      // chalupa B: מציג את שתי הצורות. "מצאי את מַ או מָ — שניהם /ma/".
      const sister = sisterVowels[0];
      const sisterCV = VA.buildCV(letter, sister.id);
      promptBar.innerHTML =
        '<span class="tap-cv-prompt__label">מצאי את </span>' +
        '<button type="button" class="tap-cv-prompt__cv" aria-label="הקש לשמוע">' + targetCV + '</button>' +
        '<span class="tap-cv-prompt__label tap-cv-prompt__or">או</span>' +
        '<button type="button" class="tap-cv-prompt__cv tap-cv-prompt__cv--sister" aria-label="הקש לשמוע">' + sisterCV + '</button>';
    } else {
      promptBar.innerHTML =
        '<span class="tap-cv-prompt__label">מצאי את </span>' +
        '<button type="button" class="tap-cv-prompt__cv" aria-label="הקש לשמוע">' + targetCV + '</button>';
    }
    root.appendChild(promptBar);

    if (hasSisters) {
      const subtitle = document.createElement('div');
      subtitle.className = 'tap-cv-subtitle';
      subtitle.textContent = 'שניהם נשמעים אותו דבר!';
      root.appendChild(subtitle);
    }

    const field = document.createElement('div');
    field.className = 'tap-cv-field';
    root.appendChild(field);

    const state = {
      tiles: [],
      hits: 0,
      attempts: 0,
      locked: false,
      hintTimer: null,
      lastShownAt: Date.now(),
    };

    function pickTilesPayload() {
      const distCount = totalTiles - numTargets;
      const pool = shuffle(distractorPool);
      const dList = [];
      for (let i = 0; i < distCount; i++) {
        dList.push(pool[i % pool.length]);
      }
      const targets = buildTargetTiles(letter, vowelId, numTargets);
      return shuffle(targets.concat(dList));
    }

    function buildTiles() {
      const tilesData = pickTilesPayload();
      field.innerHTML = '';
      state.tiles = [];
      tilesData.forEach(function (data, idx) {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'tap-cv-tile';
        tile.dataset.cv = data.cv;
        tile.dataset.vowel = data.vowelId;
        tile.dataset.target = acceptableSet.has(data.vowelId) ? 'true' : 'false';
        tile.dataset.i = String(idx);
        tile.setAttribute('aria-label', 'הברה ' + data.cv);
        const span = document.createElement('span');
        span.className = 'tap-cv-tile__cv';
        span.textContent = data.cv;
        tile.appendChild(span);
        tile.addEventListener('click', function () { handleTap(tile, data); });
        field.appendChild(tile);
        state.tiles.push(tile);
      });
      state.lastShownAt = Date.now();
      // השמע את ה-CV אחרי mount
      setTimeout(function () { playCV(letter, vowelId); }, 300);
      scheduleAutoHint();
    }

    function scheduleAutoHint() {
      if (state.hintTimer) clearTimeout(state.hintTimer);
      state.hintTimer = setTimeout(function () {
        if (state.locked) return;
        triggerHint();
      }, 9000);
    }

    function triggerHint() {
      if (window.AvneiNoni) try { window.AvneiNoni.setState('hint'); } catch (e) {}
      const remaining = state.tiles.filter(function (t) {
        return t.dataset.target === 'true' && !t.classList.contains('lit');
      });
      if (remaining.length === 0) return;
      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      pick.classList.add('hint-glow');
      // השמע את הצורה של ה-tile הספציפי שזוהר (לא ה-target המקורי) — כדי
      // שהילדה תקשר בין הסימן הויזואלי לצליל.
      playCV(letter, pick.dataset.vowel);
    }

    function handleTap(tile, data) {
      if (state.locked) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      if (tile.classList.contains('lit')) return;

      const isCorrect = (tile.dataset.target === 'true');
      const responseTime = Date.now() - state.lastShownAt;

      // Log to event-logger — Sub-BKT פר אות (לפי הוראת תזמורת).
      // target_letter = letter בלבד (לא ה-CV).
      if (window.AvneiEventLogger && typeof window.AvneiEventLogger.logActivityResult === 'function') {
        try {
          window.AvneiEventLogger.logActivityResult({
            activity_type: 'cv-tap',
            target_letter: letter,
            target_vowel: vowelId,
            target_cv: targetCV,
            target_phoneme_group: phonemeGroup,          // chalupa B — מה הקבוצה
            tapped_vowel: data.vowelId,                  // מה בפועל הילדה הקישה
            tapped_cv: data.cv,
            item_id: questId + '-tile-' + (state.hits + 1),
            supportLevel: 1,
            is_correct: isCorrect,
            attempts: state.attempts + 1,
            response_time_ms: isCorrect ? responseTime : null,
            hint_used: state.attempts >= 1,
            primary_island_id: 4,
            secondary_island_ids: [3],
          });
        } catch (e) { /* swallow */ }
      }

      if (isCorrect) onRightHit(tile, data);
      else onWrongHit(tile);
    }

    function onRightHit(tile, data) {
      tile.classList.remove('hint-glow');
      tile.classList.add('lit');
      state.hits++;
      state.attempts = 0;
      state.lastShownAt = Date.now();

      const isLastHit = state.hits >= numTargets;
      // אין השמעת CV חוזרת בכל הקשה נכונה (החלטת מיטל 30.5.2026):
      // הילדה שמעה את ה-CV פעם אחת בתחילת הסבב — feedback ויזואלי בלבד
      // (lit + pop). אם רוצים sister vowel learning — דרך match-cv-to-word
      // ולא דרך repetition של אותו צליל.

      if (typeof opts.onUnitWon === 'function') opts.onUnitWon(state.hits - 1);

      if (isLastHit) {
        state.locked = true;
        if (state.hintTimer) clearTimeout(state.hintTimer);
        setTimeout(function () {
          if (typeof opts.onComplete === 'function') opts.onComplete();
        }, 800);
        return;
      }
      scheduleAutoHint();
    }

    function onWrongHit(tile) {
      state.attempts++;
      tile.classList.add('wrong-sway');
      setTimeout(function () { tile.classList.remove('wrong-sway'); }, 700);

      if (state.attempts === 2) {
        if (window.AvneiNoni) try { window.AvneiNoni.setState('hint'); } catch (e) {}
        const target = state.tiles.find(function (t) {
          return t.dataset.target === 'true' && !t.classList.contains('lit');
        });
        if (target) target.classList.add('hint-glow');
        setTimeout(function () { playCV(letter, vowelId); }, 400);
      } else if (state.attempts >= 3) {
        if (window.AvneiNoni) try { window.AvneiNoni.setState('hint'); } catch (e) {}
        const target = state.tiles.find(function (t) {
          return t.dataset.target === 'true' && !t.classList.contains('lit');
        });
        if (target) {
          target.classList.add('hint-glow');
          setTimeout(function () { playCV(letter, target.dataset.vowel); }, 400);
        }
      }
    }

    // Tap on prompt CV (or sister) → replay speech of that form
    const promptBtns = promptBar.querySelectorAll('.tap-cv-prompt__cv');
    promptBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        // Match to vowel: first button = vowelId, second (if sister) = sister
        if (i === 0) playCV(letter, vowelId);
        else if (sisterVowels[0]) playCV(letter, sisterVowels[0].id);
      });
    });

    buildTiles();

    return {
      unmount: function () {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
        root.innerHTML = '';
        root.classList.remove('mechanic-tap-cv');
      },
    };
  }

  // --------------------------------------------------------------------------
  // Export
  // --------------------------------------------------------------------------
  window.AvneiMechanics = window.AvneiMechanics || {};
  window.AvneiMechanics['tap-cv'] = { mount: mount };
})();
