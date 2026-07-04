// ============================================================
// templates/mechanic-memory-pair.js — Memory pair matching
//
// D.15 v2 שלב B-revised (27.5.2026):
// 6 קלפים הפוכים (3 זוגות) על השולחן. כל זוג = אות הלמטרה + SVG
// אסוציאטיבי אותה (מ-letter-anims.js). הילד מקיש על קלף → נחשף,
// מקיש על קלף שני → אם תואם נשאר פתוח + שבח, אם לא חוזר הפוך.
// אחרי 3/3 זוגות → onComplete (בשלב האחרון: רק צליל-אות, לפני
// playLetterAnimThenFinale + סיום רגיל).
//
// למה 3 זוגות (ולא 4)?
//   - 6 קלפים מתאימים ל-mobile 480px (grid 3×2 או 2×3 בקלאמפ).
//   - הילד אורח 1 דקה בכל סיבוב — לא ייכשל ב-cognitive load.
//   - 3 זוגות = 3 הקשות נכונות (counter יראה 0/3 → 3/3).
//
// כל זוג מכיל את אותה אות (האות המטרה) — 3 העתקים פר משחק. ה-SVG
// האסוציאטיבי מגיע מ-letter-anims.js (אם נטען). אם אין SVG —
// fallback ל-תווית טקסט של המילה.
//
// Support model:
//   wrong-1: visual sway קל
//   wrong-2: hint-glow על זוג חשוף + playLetterSound
// ============================================================

window.AvneiMechanics = window.AvneiMechanics || {};

window.AvneiMechanics['memory-pair'] = (function () {

  const FLIP_BACK_DELAY_MS = 1100; // זמן הקלף השני להישאר חשוף לפני שחוזר הפוך
  const PRAISE_POOL = ['praise-metzuyan', 'praise-mealeh']; // יופי הוסר — הגייה לא טובה ב-eleven_v3 (מיטל 4.7.2026)

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
    const totalPairs  = opts.total || 3;
    const inGamePromptKey = opts.inGamePromptAudioKey || null;

    // F1+ (28.5) — תמיכה ב-imagePool. אם letter-anims מספק imagePool של
    // 3+ תמונות (אות ח: חתול/חלב/חום) — לכל זוג ניתנת תמונה שונה.
    // אם אין imagePool — fallback לתמונה היחידה (svg + wordKey).
    let imagePool = null;   // רשימה של {svg, wordKey} - אחד פר זוג
    let assocSvg = null, assocWordKey = null;
    if (window.AvneiLetterAnims) {
      const anim = AvneiLetterAnims.getAnimForLetter(letter);
      if (anim) {
        assocSvg = anim.svg;
        assocWordKey = anim.wordKey;
        if (Array.isArray(anim.imagePool) && anim.imagePool.length >= 1) {
          imagePool = anim.imagePool;
        }
      }
    }

    function playPromptOrLetterSound() {
      if (!window.AvneiAudio) return;
      if (inGamePromptKey) {
        AvneiAudio.play(inGamePromptKey);
      } else {
        AvneiAudio.playLetterSound(letter);
      }
    }

    root.innerHTML = '';
    root.classList.add('mechanic-memory-pair');
    if (opts.theme) root.classList.add('theme-' + opts.theme);

    const board = document.createElement('div');
    board.className = 'memory-board';
    root.appendChild(board);

    // בניית הקלפים: totalPairs זוגות × 2 = totalPairs*2 קלפים.
    // אות = זהה בכל זוג. תמונה = ייחודית פר זוג אם imagePool קיים.
    const cards = [];
    for (let i = 0; i < totalPairs; i++) {
      cards.push({ type: 'letter', pairId: i });
      const imgIdx = imagePool ? (i % imagePool.length) : 0;
      const img = imagePool ? imagePool[imgIdx] : { svg: assocSvg, wordKey: assocWordKey };
      cards.push({ type: 'image', pairId: i, svg: img.svg, wordKey: img.wordKey });
    }
    const arranged = shuffle(cards);

    const state = {
      cardEls: [],
      first: null,   // הקלף הראשון שנחשף בסבב הנוכחי
      pairsFound: 0,
      attempts: 0,
      locked: false,
      hintTimer: null,
      lastShownAt: Date.now(),
      availablePraises: PRAISE_POOL.slice(),
      praiseTimer: null,
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

    function playRightHitAudio(isLastPair) {
      if (!window.AvneiAudio) return;
      cancelPendingPraise();

      const letterKey = (AvneiAudio.LETTER_TO_SOUND_FILE || {})[letter];

      if (isLastPair) {
        if (letterKey) AvneiAudio.play(letterKey);
        return;
      }

      if (!letterKey) {
        AvneiAudio.play(pickNextPraise());
        return;
      }

      AvneiAudio.play(letterKey);
      const letterAudio = AvneiAudio.preload(letterKey);
      const praise = pickNextPraise();
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

    function buildCards() {
      board.innerHTML = '';
      state.cardEls = [];

      arranged.forEach((card, idx) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'memory-card';
        el.dataset.pairId = String(card.pairId);
        el.dataset.cardType = card.type;
        el.dataset.matched = 'false';
        el.dataset.idx = String(idx);
        // wordKey פר תמונה — מאוחסן ב-dataset לשליפה ב-handleTap
        if (card.type === 'image' && card.wordKey) {
          el.dataset.wordKey = card.wordKey;
        }
        el.setAttribute('aria-label', card.type === 'letter'
          ? 'קלף עם האות ' + letter
          : 'קלף עם תמונה');

        // צד-אחורי (גנרי) + צד-קדמי (תוכן)
        const imgSvg = card.svg || assocSvg;
        el.innerHTML = `
          <div class="memory-card__inner">
            <div class="memory-card__back">
              <svg viewBox="0 0 60 60" aria-hidden="true">
                <circle cx="30" cy="30" r="20" fill="#FFFFFF" opacity="0.6"/>
                <text x="30" y="40" text-anchor="middle" font-size="28" fill="#5C9DBA">?</text>
              </svg>
            </div>
            <div class="memory-card__front">
              ${card.type === 'letter'
                ? `<span class="memory-card__letter">${letter}</span>`
                : (imgSvg
                    ? `<div class="memory-card__svg">${imgSvg}</div>`
                    : `<span class="memory-card__fallback">★</span>`)
              }
            </div>
          </div>`;
        el.addEventListener('click', () => handleTap(el));
        board.appendChild(el);
        state.cardEls.push(el);
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
        // רמז — להאיר כרטיס סגור אקראי
        const closed = state.cardEls.filter(el =>
          el.dataset.matched === 'false' && !el.classList.contains('flipped')
        );
        if (closed.length === 0) return;
        const pick = closed[Math.floor(Math.random() * closed.length)];
        pick.classList.add('hint-glow');
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        if (window.AvneiAudio) AvneiAudio.playLetterSound(letter);
        setTimeout(() => pick.classList.remove('hint-glow'), 1400);
      }, 9000);
    }

    function handleTap(el) {
      if (state.locked) return;
      if (el.classList.contains('flipped')) return;
      if (el.dataset.matched === 'true') return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      cancelPendingPraise();

      el.classList.add('flipped');
      el.classList.remove('hint-glow');

      // F1.4 + 28.5 — קליק על קלף: אות → sound-letter · תמונה → word-X
      // (פר-תמונה, מ-dataset.wordKey שמוגדר בעת הבנייה לפי imagePool).
      if (window.AvneiAudio) {
        if (el.dataset.cardType === 'image') {
          const wk = el.dataset.wordKey || assocWordKey;
          if (wk) AvneiAudio.play(wk);
          else AvneiAudio.playLetterSound(letter);
        } else {
          AvneiAudio.playLetterSound(letter);
        }
      }

      if (state.first === null) {
        state.first = el;
        scheduleAutoHint();
        return;
      }

      // F1.4 — שינוי לוגיקת match. הזוגות בעיצוב הזה זהים ויזואלית (כל
      // letter-cards = אותה אות, כל image-cards = אותו SVG). לכן ה-match
      // הוא לא לפי pairId אלא לפי "שני סוגי קלפים שונים" — letter + image.
      // התוצאה הפדגוגית: הילד צריך להפוך אות+תמונה (בכל סדר) = זוג. גם
      // אם לא זוכר איפה — שתי הפיכות = זוג בערך תמיד אחרי 1-2 ניסיונות.
      const isMatch = (state.first.dataset.cardType !== el.dataset.cardType);
      const responseTime = Date.now() - state.lastShownAt;

      if (window.AvneiEventLogger) {
        AvneiEventLogger.logActivityResult({
          activity_type: 'memory-pair',
          target_letter: letter,
          item_id: opts.questId + '-pair-' + (state.pairsFound + 1),
          supportLevel: 1,
          is_correct: isMatch,
          attempts: state.attempts + 1,
          response_time_ms: isMatch ? responseTime : null,
          hint_used: false,
          rama_task_alignment: opts.rama_task_alignment,
          peima_target:        opts.peima_target,
        });
      }

      if (isMatch) {
        onMatch(state.first, el);
      } else {
        onMiss(state.first, el);
      }
    }

    function onMatch(first, second) {
      state.locked = true;
      first.dataset.matched = 'true';
      second.dataset.matched = 'true';
      first.classList.add('matched');
      second.classList.add('matched');

      state.attempts = 0;
      state.first = null;
      state.pairsFound++;

      const isLastPair = state.pairsFound >= totalPairs;

      if (isLastPair) {
        cancelPendingPraise();
        if (window.AvneiAudio) {
          const letterKey = (AvneiAudio.LETTER_TO_SOUND_FILE || {})[letter];
          if (letterKey) AvneiAudio.play(letterKey);
        }
      } else {
        playRightHitAudio(false);
      }

      if (window.AvneiNoni) {
        AvneiNoni.setState('cheer');
        setTimeout(() => AvneiNoni.setState('idle'), 1200);
      }

      opts.onUnitWon && opts.onUnitWon(state.pairsFound - 1);

      if (isLastPair) {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        setTimeout(() => opts.onComplete && opts.onComplete(), 1200);
      } else {
        setTimeout(() => {
          state.locked = false;
          scheduleAutoHint();
        }, 700);
      }
    }

    function onMiss(first, second) {
      state.locked = true;
      state.attempts++;
      state.lastShownAt = Date.now();

      first.classList.add('wrong-sway');
      second.classList.add('wrong-sway');
      setTimeout(() => {
        first.classList.remove('wrong-sway');
        second.classList.remove('wrong-sway');
      }, 600);

      // רמז על attempts=2 — להאיר אחד מהקלפים הסגורים שמתאים
      if (state.attempts >= 2 && window.AvneiNoni) {
        AvneiNoni.setState('hint');
        if (window.AvneiAudio) {
          setTimeout(() => AvneiAudio.playLetterSound(letter), 400);
        }
      }

      // אחרי FLIP_BACK_DELAY — מחזיר את שני הקלפים הפוכים
      setTimeout(() => {
        first.classList.remove('flipped');
        second.classList.remove('flipped');
        state.first = null;
        state.locked = false;
        scheduleAutoHint();
      }, FLIP_BACK_DELAY_MS);
    }

    buildCards();

    return {
      unmount() {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        cancelPendingPraise();
        root.innerHTML = '';
        root.classList.remove('mechanic-memory-pair');
      },
    };
  }

  return { mount };
})();
