// ============================================================================
// templates/mechanic-word-merge.js — Word-merge mechanic (אי 5 — מיזוג צירופים)
// סוכן 30 · 30.5.2026
//
// המכניקה הליבתית של אי 5: ילדה רואה מילה-יעד מנוקדת, ולמטה אריחים של החלקים
// (אותיות עם ניקוד). היא מקישה על האריחים *בסדר* כדי לבנות את המילה.
//
// תבנית: בהשראת mechanic-tap-cv.js (סוכן 29) — אבל במקום בחירת tile יחיד,
// כאן יש בנייה מסודרת. אחרי הקשה נכונה — האריח עובר לאזור-הבנייה.
//
// פדגוגי:
//   • מציג מילה-יעד למעלה (זה ה-prompt — לא לכסות).
//   • אזור-בנייה ריק שמתמלא בלחיצה.
//   • אריחים בסדר רנדומלי + 2-3 distractors (אותיות שלא במילה הזו).
//   • Sub-BKT event: target_word_length = '2cv'/'3cv'/'4cv'.
//   • אודיו: AvneiAudio.play('word-<key>') בתחילה ובסיום. cv-* על Tile click.
//
// HARD: לוקח opts.word — אובייקט מילה מ-WordAdapter.getWords(level).
//
// API event-logger (event.target_word_length = bucket; event.target_letter = first):
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

  function getWA() {
    if (typeof window !== 'undefined' && window.AvneiWordAdapter) return window.AvneiWordAdapter;
    return null;
  }
  function getVA() {
    if (typeof window !== 'undefined' && window.AvneiVowelAdapter) return window.AvneiVowelAdapter;
    return null;
  }

  // --------------------------------------------------------------------------
  // Build tile for one letter (with niqud + dagesh restored).
  // mode: 'inline-niqud' = letter+niqud (e.g. 'בַּ'). 'bare' = letter only (final use).
  // --------------------------------------------------------------------------
  function tileText(part) {
    if (!part) return '';
    let s = part.letter || '';
    if (part.niqud) s += part.niqud;
    if (part.dagesh) s += 'ּ';   // DAGESH
    return s;
  }

  // Distractor pool — אותיות אחרות עם ניקוד מקובל (ב-MVP: אותו ניקוד של המילה
  // המקורית, אבל אות אחרת מ-22). מונע "להוסיף שגיאה פדגוגית" של ניקוד שונה.
  function buildDistractors(targetParts, n) {
    const WA = getWA();
    if (!WA) return [];
    const targetLetters = new Set(targetParts.map(function (p) { return p.letter; }));
    const allLetters = WA.ALL_HEBREW_LETTERS_22;
    const pool = [];
    // לדוגמה: אם המילה כוללת patach על כל האותיות, distractor יהיה אות אחרת
    // עם patach. שומר distractor pedagogical (אותו vowel = אותו צליל אם רוצים
    // לבלבל את הילדה לעומק).
    const baseNiqud = (targetParts[0] && targetParts[0].niqud) || 'ַ'; // patach default
    for (let i = 0; i < allLetters.length && pool.length < n; i++) {
      const L = allLetters[i];
      if (targetLetters.has(L)) continue;
      const isBKP = WA.BKP_LETTERS.indexOf(L) >= 0;
      pool.push({
        letter: L,
        niqud: baseNiqud,
        dagesh: isBKP,         // ב/כ/פ דגש קל גם ב-distractor (כלל קבוע)
        isFinal: false,
      });
    }
    return shuffle(pool).slice(0, n);
  }

  function playWordAudio(word) {
    if (typeof window === 'undefined' || !window.AvneiAudio) return;
    const WA = getWA();
    const key = (WA && WA.wordAudioKey) ? WA.wordAudioKey(word.text || word) : null;
    if (key) {
      try { window.AvneiAudio.play(key); } catch (e) {}
    }
  }

  function playCV(part) {
    if (typeof window === 'undefined' || !window.AvneiAudio) return;
    const VA = getVA();
    if (!VA) return;
    // נבחר vowelId לפי הניקוד. ב-MVP, מיפוי פשוט unicode → vowel id.
    const niqud = part.niqud || '';
    let vowelId = null;
    switch (niqud) {
      case 'ַ': vowelId = 'patach'; break;
      case 'ָ': vowelId = 'kamatz'; break;
      case 'ְ': vowelId = 'shva'; break;
      case 'ִ': vowelId = 'hiriq'; break;
      case 'ֹ': vowelId = 'holam'; break;
      case 'ֵ': vowelId = 'tzere'; break;
      case 'ֶ': vowelId = 'segol'; break;
      case 'ֻ': vowelId = 'kamatz'; break;   // qubutz approximated to /u/; fallback to existing audio
      default: vowelId = null;
    }
    if (!vowelId) return;
    const audioKey = VA.cvAudioKey(part.letter, vowelId);
    if (audioKey) {
      try { window.AvneiAudio.play(audioKey); } catch (e) {}
    }
  }

  // --------------------------------------------------------------------------
  // mount(root, opts)
  // opts:
  //   word            — אובייקט מילה (text, key, level, first_letter)
  //   questId         — מזהה לאירועי event-logger
  //   onUnitWon(idx)  — callback אחרי כל אריח נכון
  //   onComplete()    — callback בסיום המילה
  // --------------------------------------------------------------------------
  function mount(root, opts) {
    const WA = getWA();
    if (!WA) {
      console.error('[mechanic-word-merge] AvneiWordAdapter חסר');
      return { unmount: function () {} };
    }
    const word = opts.word;
    if (!word || !word.text) {
      console.error('[mechanic-word-merge] opts.word חסר');
      return { unmount: function () {} };
    }

    const parts = WA.decomposeWord(word.text);
    if (parts.length < 2) {
      console.error('[mechanic-word-merge] מילה קצרה מדי: ' + word.text);
      return { unmount: function () {} };
    }

    const wordLevel = word.level || WA.classifyWordLevel(word.text);
    const firstLetter = word.first_letter || (parts[0] && parts[0].letter);
    const questId = opts.questId || ('isl05-word-merge-' + (word.key || WA.wordKey(word.text)));

    // Validate ב/כ/פ דגש (אזהרה ב-console; UI יציג טקסט נכון מ-data)
    try {
      const v = WA.validateBgdkptDagesh(word.text);
      if (!v.ok) console.warn('[mechanic-word-merge] ב/כ/פ validation:', v.errors);
    } catch (e) {}

    // --- Build DOM ---
    root.innerHTML = '';
    root.classList.add('mechanic-word-merge');

    const prompt = document.createElement('div');
    prompt.className = 'word-merge-prompt';
    prompt.innerHTML =
      '<span class="word-merge-prompt__label">בִּנּוּ אֶת הַמִּילָּה</span>' +
      '<button type="button" class="word-merge-prompt__word" aria-label="הקש לשמוע">' + word.text + '</button>';
    root.appendChild(prompt);

    const buildArea = document.createElement('div');
    buildArea.className = 'word-merge-build';
    buildArea.setAttribute('aria-label', 'מקום בנייה');
    root.appendChild(buildArea);

    // Slots representing each expected part — placeholders that fill as the child taps.
    const slots = [];
    parts.forEach(function (p, idx) {
      const slot = document.createElement('span');
      slot.className = 'word-merge-slot';
      slot.dataset.idx = String(idx);
      slot.textContent = '·';
      buildArea.appendChild(slot);
      slots.push(slot);
    });

    const field = document.createElement('div');
    field.className = 'word-merge-field';
    root.appendChild(field);

    // Pool = correct parts (each as a tile) + 2 distractors.
    const distractorCount = Math.min(2, Math.max(0, 4 - parts.length));
    const pool = shuffle(parts.concat(buildDistractors(parts, distractorCount)));

    // Build tiles
    const tiles = [];
    const state = {
      nextIdx: 0,
      attempts: 0,
      locked: false,
      hintTimer: null,
      startTime: Date.now(),
    };

    pool.forEach(function (part, poolIdx) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'word-merge-tile';
      tile.dataset.letter = part.letter;
      tile.dataset.niqud = part.niqud || '';
      tile.dataset.dagesh = part.dagesh ? '1' : '0';
      tile.dataset.poolIdx = String(poolIdx);
      tile.textContent = tileText(part);
      tile.setAttribute('aria-label', 'אריח ' + tile.textContent);
      tile.addEventListener('click', function () { handleTap(tile, part); });
      field.appendChild(tile);
      tiles.push(tile);
    });

    // השמע את המילה פעם אחת בתחילת הסבב.
    setTimeout(function () { playWordAudio(word); }, 350);

    function partMatchesExpected(tilePart, expected) {
      if (!tilePart || !expected) return false;
      if (tilePart.letter !== expected.letter) return false;
      if ((tilePart.niqud || '') !== (expected.niqud || '')) return false;
      if (!!tilePart.dagesh !== !!expected.dagesh) return false;
      return true;
    }

    function handleTap(tile, part) {
      if (state.locked) return;
      if (tile.classList.contains('lit')) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }

      const expected = parts[state.nextIdx];
      const isCorrect = partMatchesExpected(part, expected);
      const responseTime = Date.now() - state.startTime;

      // Log event — Sub-BKT פר אורך-מילה (target_word_length).
      if (window.AvneiEventLogger && typeof window.AvneiEventLogger.logActivityResult === 'function') {
        try {
          window.AvneiEventLogger.logActivityResult({
            activity_type: 'word-merge',
            target_word_length: wordLevel,
            target_letter: firstLetter,
            target_word: word.text,
            item_id: questId + '-tile-' + (state.nextIdx + 1),
            supportLevel: 1,
            is_correct: isCorrect,
            attempts: state.attempts + 1,
            response_time_ms: isCorrect ? responseTime : null,
            hint_used: state.attempts >= 1,
            primary_island_id: 5,
            secondary_island_ids: [4],
          });
        } catch (e) { /* swallow */ }
      }

      if (isCorrect) onRightHit(tile, part);
      else onWrongHit(tile);
    }

    function onRightHit(tile, part) {
      tile.classList.remove('hint-glow');
      tile.classList.add('lit');
      tile.disabled = true;

      const slot = slots[state.nextIdx];
      if (slot) {
        slot.textContent = tileText(part);
        slot.classList.add('filled');
      }
      playCV(part);

      state.nextIdx++;
      state.attempts = 0;
      state.startTime = Date.now();

      if (typeof opts.onUnitWon === 'function') opts.onUnitWon(state.nextIdx - 1);

      if (state.nextIdx >= parts.length) {
        // Complete — השמע את המילה שלמה ותסיים אחרי המתנה.
        state.locked = true;
        if (state.hintTimer) clearTimeout(state.hintTimer);
        setTimeout(function () { playWordAudio(word); }, 250);
        setTimeout(function () {
          if (typeof opts.onComplete === 'function') opts.onComplete();
        }, 1100);
        return;
      }
      scheduleAutoHint();
    }

    function onWrongHit(tile) {
      state.attempts++;
      tile.classList.add('wrong-sway');
      setTimeout(function () { tile.classList.remove('wrong-sway'); }, 700);

      if (state.attempts >= 2) {
        // Hint — מאיר את האריח הנכון הבא.
        const expected = parts[state.nextIdx];
        const hintTile = tiles.find(function (t) {
          return !t.classList.contains('lit') &&
                 t.dataset.letter === expected.letter &&
                 (t.dataset.niqud || '') === (expected.niqud || '') &&
                 (t.dataset.dagesh === '1') === !!expected.dagesh;
        });
        if (hintTile) hintTile.classList.add('hint-glow');
        if (window.AvneiNoni) try { window.AvneiNoni.setState('hint'); } catch (e) {}
      }
    }

    function scheduleAutoHint() {
      if (state.hintTimer) clearTimeout(state.hintTimer);
      state.hintTimer = setTimeout(function () {
        if (state.locked) return;
        const expected = parts[state.nextIdx];
        const hintTile = tiles.find(function (t) {
          return !t.classList.contains('lit') &&
                 t.dataset.letter === expected.letter &&
                 (t.dataset.niqud || '') === (expected.niqud || '') &&
                 (t.dataset.dagesh === '1') === !!expected.dagesh;
        });
        if (hintTile) {
          hintTile.classList.add('hint-glow');
          playWordAudio(word);
        }
        if (window.AvneiNoni) try { window.AvneiNoni.setState('hint'); } catch (e) {}
      }, 9000);
    }

    // Prompt click → replay
    prompt.querySelector('.word-merge-prompt__word').addEventListener('click', function () {
      playWordAudio(word);
    });

    scheduleAutoHint();

    return {
      unmount: function () {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
        root.innerHTML = '';
        root.classList.remove('mechanic-word-merge');
      },
    };
  }

  window.AvneiMechanics = window.AvneiMechanics || {};
  window.AvneiMechanics['word-merge'] = { mount: mount };
})();
