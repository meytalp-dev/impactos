// ============================================================================
// templates/mechanic-word-spell.js — Word-spell mechanic (אי 20 — שונית בוני המילים)
// לוח בניית האיים · N20 · 7.7.2026
//
// ההיפוך של אי 5 (mechanic-word-merge): שם המילה *מוצגת* מנוקדת והילד.ה ממלא.ת
// את חלקיה. כאן המילה **נשמעת ולא נראית** — איות פונולוגי-אותי אמיתי מהכתבה:
//   1. הילד.ה שומע.ת מילה (word-<key>.mp3 — אותו מאגר של אי 5, word-adapter).
//   2. מאגר-בחירה מציג את הצירופים המנוקדים הנכונים + 2 מסיחים (vowel-swap על
//      צירוף נכון + אות-אחרת באותה תנועה) — נגזרי-EPA (בלבול תנועה + בלבול אות).
//   3. הקשה על הצירוף הנכון *בסדר* → עף למשבצת + מתנגן; מסיים = המילה מתגלה
//      ומתנגנת שלמה.
//
// עקרונות עולם:
//   • טעות = הצירוף רוטט ונשאר במאגר (בהקשה — הצירוף לא "עוזב" עד שהוא נכון,
//     כך "חוזר בעדינות"); נוני מהנהנת "נסו שוב". אחרי 2 טעויות באותה משבצת —
//     רמז: הצירוף הנכון הבא מהבהב.
//   • כל צירוף במאגר ניתן להשמעה בלחיצה ארוכה (500ms) — לא נמדד (כמו two-tap:
//     האזנה ≠ בחירה). ההקשה הרגילה = הבחירה הנמדדת.
//   • אודיו-הנחיה פעם אחת ב-mount; אחרי הקשה נכונה — פידבק ויזואלי + צליל-צירוף.
//   • ב/כ/פ דגש קל בתחילת הברה — buildCV/decomposeWord של word-adapter כבר יודעים.
//
// logging (event-logger.logActivityResult, דפוס mechanic-word-merge):
//   primary_island_id = opts.islandId (default 20 → BKT אי 20; לא sub-BKT).
//   activity_type='word-spell' · target_word=word.text · target_letter=firstLetter.
//   is_correct/attempts/hint_used פר-הקשה (הקשה נכונה וגם שגויה מדווחות).
//   הקשה-ארוכה (האזנה) אינה מדווחת.
//
// HARD: לוקח opts.word — אובייקט מילה מ-AvneiWordAdapter (text, key, first_letter).
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
    return (typeof window !== 'undefined' && window.AvneiWordAdapter) ? window.AvneiWordAdapter : null;
  }
  function getVA() {
    return (typeof window !== 'undefined' && window.AvneiVowelAdapter) ? window.AvneiVowelAdapter : null;
  }

  const DAGESH = 'ּ'; // U+05BC

  function tileText(part) {
    if (!part) return '';
    let s = part.letter || '';
    if (part.niqud) s += part.niqud;
    if (part.dagesh) s += DAGESH;
    return s;
  }

  // ניקוד → vowelId (תואם vowel-adapter). qubutz/shuruk לא מופיעים במילים דו-צירופיות
  // של הפיילוט — נשמרים fallback.
  const NIQUD_TO_VOWEL = {
    'ַ': 'patach', 'ָ': 'kamatz', 'ְ': 'shva', 'ִ': 'hiriq',
    'ֹ': 'holam', 'ֵ': 'tzere', 'ֶ': 'segol', 'ֻ': 'kubutz',
  };
  const VOWEL_TO_NIQUD = (function () {
    const m = {};
    Object.keys(NIQUD_TO_VOWEL).forEach(function (sym) { m[NIQUD_TO_VOWEL[sym]] = sym; });
    return m;
  })();

  // vowel-swap למסיח: תנועה קרובה שמבחן דיוק תנועתי (patach↔segol/kamatz וכו').
  // התנועות שנבחרו קיימות כ-cv-<letter>-<vowel>.mp3 לכל אות (אומת).
  const VOWEL_SWAP = {
    patach: 'segol', kamatz: 'patach', segol: 'patach',
    hiriq: 'tzere', tzere: 'hiriq', holam: 'kamatz',
    shva: 'patach', kubutz: 'holam',
  };

  function partVowelId(part) {
    return part && part.niqud ? (NIQUD_TO_VOWEL[part.niqud] || null) : null;
  }

  // השמעת צליל-צירוף (בלחיצה ארוכה או אחרי הקשה נכונה). צירוף בלי תנועה (אות
  // סופית ערומה) → צליל-האות (sound-<letter>).
  function playPartSound(part) {
    if (typeof window === 'undefined' || !window.AvneiAudio) return;
    const vid = partVowelId(part);
    const VA = getVA();
    if (vid && VA && VA.cvAudioKey) {
      const key = VA.cvAudioKey(part.letter, vid);
      if (key) { try { window.AvneiAudio.play(key); } catch (e) {} return; }
    }
    // ערום → צליל האות
    try { window.AvneiAudio.playLetterSound(part.letter); } catch (e) {}
  }

  function playWordAudio(word) {
    if (typeof window === 'undefined' || !window.AvneiAudio) return;
    const WA = getWA();
    const key = (WA && WA.wordAudioKey) ? WA.wordAudioKey(word.text || word) : null;
    if (key) { try { window.AvneiAudio.play(key); } catch (e) {} }
  }

  // שליטת-נוני עוברת לדף דרך opts.onNoni(state) (הדף ממפה state→PNG של noniImg).
  // state ∈ 'idle'|'happy'|'thinking'|'surprised'. אין callback → no-op בטוח.
  function makeNoni(opts) {
    return function (state) {
      if (typeof opts.onNoni === 'function') { try { opts.onNoni(state); } catch (e) {} }
    };
  }

  // --------------------------------------------------------------------------
  // מסיחים נגזרי-EPA: (1) vowel-swap על צירוף נכון (בלבול תנועה — הליבה
  // הפונולוגית של אי 20); (2) אות-אחרת באותה תנועה של הצירוף הראשון (בלבול אות).
  // שניהם CV מנוקדים עם אודיו מובטח (לחיצה-ארוכה תעבוד).
  // --------------------------------------------------------------------------
  function buildDistractors(parts, n) {
    const WA = getWA();
    if (!WA) return [];
    const usedDisplays = {};
    parts.forEach(function (p) { usedDisplays[tileText(p)] = true; });
    const out = [];

    function tryPush(letter, vowelId) {
      if (!vowelId) return;
      const niqud = VOWEL_TO_NIQUD[vowelId];
      if (!niqud) return;
      const isBKP = WA.BKP_LETTERS.indexOf(letter) >= 0;
      const cand = { letter: letter, niqud: niqud, dagesh: isBKP, isFinal: false };
      const disp = tileText(cand);
      if (usedDisplays[disp]) return;
      usedDisplays[disp] = true;
      out.push(cand);
    }

    // (1) vowel-swap על הצירוף הראשון בעל תנועה
    const vowelPart = parts.filter(function (p) { return partVowelId(p); })[0];
    if (vowelPart) {
      const vid = partVowelId(vowelPart);
      tryPush(vowelPart.letter, VOWEL_SWAP[vid] || null);
    }

    // (2) אות-אחרת באותה תנועה של הצירוף הראשון בעל תנועה
    if (vowelPart && out.length < n) {
      const vid = partVowelId(vowelPart);
      const wordLetters = {};
      parts.forEach(function (p) { wordLetters[p.letter] = true; });
      const pool = shuffle(WA.ALL_HEBREW_LETTERS_22.filter(function (L) { return !wordLetters[L]; }));
      for (let i = 0; i < pool.length && out.length < n; i++) {
        tryPush(pool[i], vid);
      }
    }

    // מילוי אחרון (אם צריך) — תנועה חלופית על אות אקראית
    if (out.length < n) {
      const pool = shuffle(WA.ALL_HEBREW_LETTERS_22);
      for (let i = 0; i < pool.length && out.length < n; i++) {
        tryPush(pool[i], 'kamatz');
      }
    }
    return out.slice(0, n);
  }

  // --------------------------------------------------------------------------
  // mount(root, opts)
  //   opts.word          — {text, key, first_letter, level}
  //   opts.questId       — מזהה אירוע
  //   opts.islandId      — default 20
  //   opts.distractors   — כמות מסיחים (default 2)
  //   opts.onUnitWon(i)  — אחרי כל צירוף נכון
  //   opts.onComplete()  — בסיום המילה
  // --------------------------------------------------------------------------
  function mount(root, opts) {
    const WA = getWA();
    if (!WA) {
      console.error('[mechanic-word-spell] AvneiWordAdapter חסר');
      return { unmount: function () {} };
    }
    const word = opts.word;
    if (!word || !word.text) {
      console.error('[mechanic-word-spell] opts.word חסר');
      return { unmount: function () {} };
    }

    const parts = WA.decomposeWord(word.text);
    if (parts.length < 2) {
      console.error('[mechanic-word-spell] מילה קצרה מדי: ' + word.text);
      return { unmount: function () {} };
    }

    const islandId = (typeof opts.islandId === 'number') ? opts.islandId : 20;
    const setNoni = makeNoni(opts);
    const firstLetter = word.first_letter || (parts[0] && parts[0].letter);
    const questId = opts.questId || ('isl20-word-spell-' + (word.key || WA.wordKey(word.text)));
    const distractorCount = (opts.distractors == null) ? 2 : opts.distractors;

    root.innerHTML = '';
    root.classList.add('mechanic-word-spell');

    // Prompt — בלי טקסט-המילה! רק הנחיה + כפתור השמעה חוזרת.
    const prompt = document.createElement('div');
    prompt.className = 'word-spell-prompt';
    const hearBtn = document.createElement('button');
    hearBtn.type = 'button';
    hearBtn.className = 'word-spell-hear';
    hearBtn.setAttribute('aria-label', 'הקשיבו למילה שוב');
    hearBtn.innerHTML = '<span class="ws-hear-ico" aria-hidden="true">🔊</span>' +
      '<span class="ws-hear-label">הַקְשִׁיבוּ לַמִּלָּה</span>';
    prompt.appendChild(hearBtn);
    root.appendChild(prompt);

    // Build area — משבצות ריקות (·) שמתמלאות. המילה מתגלה רק בסיום.
    const buildArea = document.createElement('div');
    buildArea.className = 'word-spell-build';
    buildArea.setAttribute('aria-label', 'שורת הבנייה');
    root.appendChild(buildArea);
    const slots = [];
    parts.forEach(function (p, idx) {
      const slot = document.createElement('span');
      slot.className = 'word-spell-slot';
      slot.dataset.idx = String(idx);
      slot.textContent = '·';
      buildArea.appendChild(slot);
      slots.push(slot);
    });

    // Pool
    const field = document.createElement('div');
    field.className = 'word-spell-field';
    root.appendChild(field);

    const pool = shuffle(parts.map(function (p) { return { letter: p.letter, niqud: p.niqud, dagesh: p.dagesh, isFinal: p.isFinal }; })
      .concat(buildDistractors(parts, distractorCount)));

    const state = { nextIdx: 0, attempts: 0, locked: false, startTime: Date.now() };
    const tiles = [];

    pool.forEach(function (part) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'word-spell-tile';
      tile.dataset.letter = part.letter;
      tile.dataset.niqud = part.niqud || '';
      tile.dataset.dagesh = part.dagesh ? '1' : '0';
      tile.textContent = tileText(part);
      tile.setAttribute('aria-label', 'צירוף ' + tile.textContent);
      attachTile(tile, part);
      field.appendChild(tile);
      tiles.push(tile);
    });

    hearBtn.addEventListener('click', function () {
      if (state.locked) return;
      playWordAudio(word);
    });

    // הנחיה קולית פעם אחת ב-mount: המילה מושמעת (זו ההכתבה).
    setTimeout(function () { playWordAudio(word); }, 350);

    function partMatches(a, b) {
      if (!a || !b) return false;
      return a.letter === b.letter &&
             (a.niqud || '') === (b.niqud || '') &&
             !!a.dagesh === !!b.dagesh;
    }

    // long-press = האזנה (לא נמדד); tap = בחירה (נמדד).
    function attachTile(tile, part) {
      let pressTimer = null;
      let longPressed = false;

      function startPress() {
        longPressed = false;
        if (pressTimer) clearTimeout(pressTimer);
        pressTimer = setTimeout(function () {
          longPressed = true;
          tile.classList.add('listening');
          playPartSound(part);
          setTimeout(function () { tile.classList.remove('listening'); }, 500);
        }, 500);
      }
      function cancelPress() {
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      }

      tile.addEventListener('pointerdown', startPress);
      tile.addEventListener('pointerup', cancelPress);
      tile.addEventListener('pointercancel', cancelPress);
      tile.addEventListener('pointerleave', cancelPress);

      tile.addEventListener('click', function () {
        if (longPressed) { longPressed = false; return; } // האזנה, לא בחירה
        handleTap(tile, part);
      });
    }

    function handleTap(tile, part) {
      if (state.locked) return;
      if (tile.classList.contains('placed')) return;

      const expected = parts[state.nextIdx];
      const isCorrect = partMatches(part, expected);
      const responseTime = Date.now() - state.startTime;

      if (window.AvneiEventLogger && typeof window.AvneiEventLogger.logActivityResult === 'function') {
        try {
          window.AvneiEventLogger.logActivityResult({
            activity_type: 'word-spell',
            target_word: word.text,
            target_letter: firstLetter,
            item_id: questId + '-slot-' + (state.nextIdx + 1),
            supportLevel: 1,
            is_correct: isCorrect,
            attempts: state.attempts + 1,
            response_time_ms: isCorrect ? responseTime : null,
            hint_used: state.attempts >= 2,
            primary_island_id: islandId,
            secondary_island_ids: [5],
          });
        } catch (e) { /* swallow */ }
      }

      if (isCorrect) onRight(tile, part);
      else onWrong(tile);
    }

    function onRight(tile, part) {
      tile.classList.remove('hint-glow');
      tile.classList.add('placed');
      tile.disabled = true;

      const slot = slots[state.nextIdx];
      if (slot) {
        slot.textContent = tileText(part);
        slot.classList.add('filled');
      }
      playPartSound(part);
      setNoni('happy');

      state.nextIdx++;
      state.attempts = 0;
      state.startTime = Date.now();

      if (typeof opts.onUnitWon === 'function') try { opts.onUnitWon(state.nextIdx - 1); } catch (e) {}

      if (state.nextIdx >= parts.length) {
        state.locked = true;
        // המילה מתגלה שלמה בסוף (closure) + מתנגנת בשלמותה.
        buildArea.classList.add('complete');
        setTimeout(function () { playWordAudio(word); }, 300);
        setTimeout(function () {
          if (typeof opts.onComplete === 'function') try { opts.onComplete(); } catch (e) {}
        }, 1300);
      }
    }

    function onWrong(tile) {
      state.attempts++;
      // הצירוף לא עוזב את המאגר — רק רוטט ("חוזר בעדינות").
      tile.classList.remove('wrong-sway');
      void tile.offsetWidth;
      tile.classList.add('wrong-sway');
      setTimeout(function () { tile.classList.remove('wrong-sway'); }, 650);
      setNoni('thinking');

      if (state.attempts >= 2) {
        const expected = parts[state.nextIdx];
        const hintTile = tiles.find(function (t) {
          return !t.classList.contains('placed') &&
                 t.dataset.letter === expected.letter &&
                 (t.dataset.niqud || '') === (expected.niqud || '') &&
                 (t.dataset.dagesh === '1') === !!expected.dagesh;
        });
        if (hintTile) {
          hintTile.classList.add('hint-glow');
          setNoni('surprised');
        }
      }
    }

    return {
      unmount: function () {
        root.innerHTML = '';
        root.classList.remove('mechanic-word-spell');
      },
    };
  }

  window.AvneiMechanics = window.AvneiMechanics || {};
  window.AvneiMechanics['word-spell'] = { mount: mount };
})();
