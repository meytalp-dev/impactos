// ============================================================
// templates/mechanic-sort-by-letter.js — Drag + sort to bins
//
// D.15 v2 שלב B-revised (27.5.2026):
// במרכז המסך 5 פריטים (bubbles עם אותיות). למטה 2 בינים — שמאלי
// עם האות-יעד (הנכון), ימני עם דיסטרקטור (השגוי). הילד גורר כל
// פריט לבין הנכון. גרירה לבין השגוי — חוזר עם sway. אחרי
// total הפריטים שגוררו לבין הנכון → onComplete.
//
// Drag mechanics: pointer events (תומך mouse + touch בכל הדפדפנים
// המודרניים, כולל iOS Safari 13+). transform translate על הפריט
// תוך כדי גרירה, hit-test ב-pointerup לפי elementFromPoint.
//
// Counter: כל פריט שנגרר נכון מעלה counter ב-1 (תואם game-shell.js
// onUnitWon contract).
//
// Support model:
//   wrong-1: tile-sway קל, חזור לעמדה ההתחלתית
//   wrong-2: hint-glow על הבין הנכון + playLetterSound
//   wrong-3+: hint-glow + 'press-here.mp3'
// ============================================================

window.AvneiMechanics = window.AvneiMechanics || {};

window.AvneiMechanics['sort-by-letter'] = (function () {

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
    const total       = opts.total || 5; // כמה פריטים נכונים נדרשים לסיום
    const distractors = (opts.distractors || []).filter(d => d !== letter);
    const inGamePromptKey = opts.inGamePromptAudioKey || null;

    function playPromptOrLetterSound() {
      if (!window.AvneiAudio) return;
      if (inGamePromptKey) {
        AvneiAudio.play(inGamePromptKey);
      } else {
        AvneiAudio.playLetterSound(letter);
      }
    }

    root.innerHTML = '';
    root.classList.add('mechanic-sort');
    if (opts.theme) root.classList.add('theme-' + opts.theme);

    // === מבנה DOM ===
    // .sort-field שדה צף · .sort-bins למטה (2 רשתות אקווריום)
    const field = document.createElement('div');
    field.className = 'sort-field';
    root.appendChild(field);

    const binsRow = document.createElement('div');
    binsRow.className = 'sort-bins';
    root.appendChild(binsRow);

    // בין נכון (target) — מציג את האות הנכונה
    const dist1 = (distractors[0] || 'ת');
    const targetBin = document.createElement('div');
    targetBin.className = 'sort-bin sort-bin--target';
    targetBin.dataset.target = 'true';
    targetBin.dataset.letter = letter;
    targetBin.innerHTML = `
      <div class="sort-bin__label">
        <span class="sort-bin__letter">${letter}</span>
      </div>
      <div class="sort-bin__net" aria-hidden="true"></div>`;

    // בין דיסטרקטור — מציג אות אחרת
    const distBin = document.createElement('div');
    distBin.className = 'sort-bin sort-bin--distractor';
    distBin.dataset.target = 'false';
    distBin.dataset.letter = dist1;
    distBin.innerHTML = `
      <div class="sort-bin__label">
        <span class="sort-bin__letter">${dist1}</span>
      </div>
      <div class="sort-bin__net" aria-hidden="true"></div>`;

    // RTL: ב-bins-row, ה-target נראה לילדה בצד שמאל פיזית של ה-DOM-row
    // (היא נראית מימין במצב dir=rtl). כדי שהאות הנכונה תוצב במרכז —
    // נסדר: distractor (יופיע מימין), target (יופיע משמאל). אבל
    // יותר נכון פדגוגית שהאות הנכונה תהיה בצד שמאל (כיוון הכתיבה
    // ההפוך לעברית — מקור-טבעי לתנועה). נסדר distractor-target
    // ב-DOM order; ה-flex direction של RTL יישם אותם נכון.
    binsRow.appendChild(distBin);
    binsRow.appendChild(targetBin);

    // === מצב + יצירת פריטים ===
    const state = {
      itemEls: [],
      remaining: 0,        // פריטים שעדיין במגרש
      wins: 0,             // פריטים שנגררו נכון
      misses: 0,
      activeDrag: null,
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

    function playRightHitAudio(isLastItem) {
      if (!window.AvneiAudio) return;
      cancelPendingPraise();
      const letterKey = (AvneiAudio.LETTER_TO_SOUND_FILE || {})[letter];
      if (isLastItem) {
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

    // צריך לפחות `total` פריטים נכונים + מסיחים. סה"כ ~5-6 פריטים.
    function buildItems() {
      field.innerHTML = '';
      state.itemEls = [];

      // total פריטים נכונים + 1-2 דיסטרקטורים שלא נחוצים לסיום אבל מציגים את האתגר
      const numDistractors = Math.min(2, distractors.length);
      const itemLetters = shuffle([
        ...Array(total).fill(letter),
        ...distractors.slice(0, numDistractors),
      ]);

      itemLetters.forEach((ltr, idx) => {
        const item = document.createElement('div');
        item.className = 'sort-item';
        item.dataset.letter = ltr;
        item.dataset.target = (ltr === letter) ? 'true' : 'false';
        item.dataset.idx = String(idx);
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', 'בועה עם האות ' + ltr);
        item.innerHTML = `<span class="sort-item__letter">${ltr}</span>`;

        // פיזור אקראי במגרש (בערך — לפי grid עם variation).
        // ה-x range מצומצם ל-8%-62% כדי שלא יחפוף נוני (יושב ב-right
        // bottom-right, תופס ~25-30% מהמסך בנייד). ה-padding-right של
        // .sort-field ב-CSS גם הוא נוסף ויזואלית.
        const totalItems = itemLetters.length;
        const cols = Math.ceil(totalItems / 2);
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const xPercent = 8 + (col * (54 / Math.max(cols - 1, 1)));
        const yPercent = 18 + (row * 30);
        item.style.left = xPercent + '%';
        item.style.top  = yPercent + '%';

        attachDrag(item);
        field.appendChild(item);
        state.itemEls.push(item);
      });

      state.remaining = state.itemEls.filter(el => el.dataset.target === 'true').length;
      state.lastShownAt = Date.now();
      if (window.AvneiAudio && AvneiAudio.isUnlocked && AvneiAudio.isUnlocked()) {
        setTimeout(playPromptOrLetterSound, 300);
      }
      scheduleAutoHint();
    }

    function scheduleAutoHint() {
      if (state.hintTimer) clearTimeout(state.hintTimer);
      state.hintTimer = setTimeout(triggerHint, 9000);
    }

    function triggerHint() {
      if (window.AvneiNoni) AvneiNoni.setState('hint');
      targetBin.classList.add('hint-glow');
      playPromptOrLetterSound();
      setTimeout(() => targetBin.classList.remove('hint-glow'), 1800);
    }

    // === Pointer events drag ===
    function attachDrag(item) {
      let startX, startY, origLeft, origTop;
      let dragging = false;

      const onPointerDown = (e) => {
        if (item.dataset.placed === 'true') return;
        // 28.5 v2 — מיטל ביקשה: לא להגיד word-X בגרירה ולא sound-X.
        // הילד שמע find-X בהתחלה ויודע מה לחפש. אם תקוע — auto-hint
        // אחרי 9 שניות ינגן את ההוראה שוב.

        item.setPointerCapture(e.pointerId);
        const rect = item.getBoundingClientRect();
        const fieldRect = field.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        origLeft = rect.left - fieldRect.left;
        origTop  = rect.top  - fieldRect.top;
        dragging = true;
        state.activeDrag = item;
        item.classList.add('dragging');
        if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      };

      const onPointerMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        item.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
      };

      const onPointerUp = (e) => {
        if (!dragging) return;
        dragging = false;
        item.classList.remove('dragging');
        item.style.transform = '';

        // hit-test לפי elementFromPoint
        item.style.pointerEvents = 'none';
        const target = document.elementFromPoint(e.clientX, e.clientY);
        item.style.pointerEvents = '';

        const targetBinEl = target && target.closest('.sort-bin');
        if (targetBinEl) {
          handleDrop(item, targetBinEl);
        } else {
          // לא נשמט על בין — הפריט חוזר לאט למקומו (סוויי קל)
          item.classList.add('return-sway');
          setTimeout(() => item.classList.remove('return-sway'), 500);
        }
        state.activeDrag = null;
        scheduleAutoHint();
      };

      item.addEventListener('pointerdown', onPointerDown);
      item.addEventListener('pointermove', onPointerMove);
      item.addEventListener('pointerup',   onPointerUp);
      item.addEventListener('pointercancel', onPointerUp);
    }

    function handleDrop(item, binEl) {
      const isCorrect = (item.dataset.target === 'true') && (binEl.dataset.target === 'true');
      const responseTime = Date.now() - state.lastShownAt;

      if (window.AvneiEventLogger) {
        AvneiEventLogger.logActivityResult({
          activity_type: 'sort-by-letter',
          target_letter: letter,
          item_id: opts.questId + '-item-' + item.dataset.idx,
          supportLevel: 1,
          is_correct: isCorrect,
          attempts: state.misses + 1,
          response_time_ms: isCorrect ? responseTime : null,
          hint_used: state.misses >= 1,
          rama_task_alignment: opts.rama_task_alignment,
          peima_target:        opts.peima_target,
        });
      }

      if (isCorrect) {
        onCorrectDrop(item, binEl);
      } else {
        // 2 מקרים: פריט נכון על בין שגוי, או פריט שגוי על בין נכון
        onWrongDrop(item, binEl);
      }
    }

    function onCorrectDrop(item, binEl) {
      // עיגון הפריט בתוך הבין — אנימציה קצרה אז הסתר
      item.dataset.placed = 'true';
      item.classList.add('placed-correct');
      const binRect = binEl.getBoundingClientRect();
      const fieldRect = field.getBoundingClientRect();
      // העברת הפריט פיזית לבין: מיקום relative ל-field
      const newX = (binRect.left - fieldRect.left) + (binRect.width / 2) - 30;
      const newY = (binRect.top - fieldRect.top)   + (binRect.height / 2) - 30;
      item.style.left = newX + 'px';
      item.style.top  = newY + 'px';

      state.wins++;
      state.misses = 0;
      const isLastItem = state.wins >= total;
      playRightHitAudio(isLastItem);

      if (window.AvneiNoni) {
        AvneiNoni.setState('cheer');
        setTimeout(() => AvneiNoni.setState('idle'), 1000);
      }
      opts.onUnitWon && opts.onUnitWon(state.wins - 1);

      // איסוף ויזואלי — הפריט מתכווץ לתוך הבין
      setTimeout(() => {
        item.classList.add('absorbed');
      }, 400);

      if (isLastItem) {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        setTimeout(() => opts.onComplete && opts.onComplete(), 1200);
      }
    }

    function onWrongDrop(item, binEl) {
      state.misses++;
      // החזרת הפריט לעמדה ההתחלתית עם sway
      item.classList.add('wrong-sway');
      // restore position via reflow
      setTimeout(() => item.classList.remove('wrong-sway'), 700);

      // מתקדם רמזים
      if (state.misses === 2) {
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        targetBin.classList.add('hint-glow');
        if (window.AvneiAudio) setTimeout(() => AvneiAudio.playLetterSound(letter), 400);
        setTimeout(() => targetBin.classList.remove('hint-glow'), 1800);
      } else if (state.misses >= 3) {
        if (window.AvneiNoni) AvneiNoni.setState('hint');
        targetBin.classList.add('hint-glow');
        if (window.AvneiAudio) setTimeout(() => AvneiAudio.play('press-here'), 400);
        setTimeout(() => targetBin.classList.remove('hint-glow'), 2200);
      }
    }

    buildItems();

    return {
      unmount() {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        cancelPendingPraise();
        root.innerHTML = '';
        root.classList.remove('mechanic-sort');
      },
    };
  }

  return { mount };
})();
