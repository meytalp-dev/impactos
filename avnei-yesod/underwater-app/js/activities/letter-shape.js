// ============================================================
// activities/letter-shape.js — הכרת צורת אות דפוס
//
// Variant A (רצפטיבי): שומע "מצאו את מ" → בוחר אות מ-3 אפשרויות
// Variant B (פרודוקטיבי): רואה אות → בוחר בועה ששמה מתאים
//
// פדגוגיה: primary_island_id=3, secondary=[]
//
// חוזה זהה ל-AvneiSoundMatch.
// ============================================================

window.AvneiLetterShape = (function() {

  const ACTIVITY_BASE = 'letterShape';
  let _root = null;
  let _items = [];
  let _letter = null;
  let _supportLevel = 1;
  let _variant = 'A';
  let _idx = 0;
  let _attempts = 0;
  let _itemStartTime = 0;
  let _hintUsed = false;
  let _autoHintTriggered = false;
  let _noniGuidanceUsed = false;
  let _autoHintTimer = null;
  let _onItemComplete = null;
  let _onActivityComplete = null;
  let _correctCount = 0;
  let _activityType = 'letterShapeA';

  function mount(rootEl, opts) {
    _root = rootEl;
    _items = opts.items || [];
    _letter = opts.letter;
    _supportLevel = opts.supportLevel || 1;
    _variant = opts.variant || 'A';
    _activityType = _variant === 'B' ? 'letterShapeB' : 'letterShapeA';
    _onItemComplete = opts.onItemComplete || (() => {});
    _onActivityComplete = opts.onActivityComplete || (() => {});
    _idx = 0;
    _correctCount = 0;

    renderItem();
  }

  function unmount() {
    if (_autoHintTimer) { clearTimeout(_autoHintTimer); _autoHintTimer = null; }
    if (window.AvneiInstruction) AvneiInstruction.unmount();
    if (_root) _root.innerHTML = '';
    _root = null;
  }

  function renderItem() {
    const item = _items[_idx];
    if (!item) {
      _onActivityComplete({ correctCount: _correctCount, totalItems: _items.length });
      return;
    }

    _attempts = 0;
    _hintUsed = false;
    _autoHintTriggered = false;
    _noniGuidanceUsed = false;
    _itemStartTime = Date.now();
    if (_autoHintTimer) { clearTimeout(_autoHintTimer); _autoHintTimer = null; }

    const cfg = AvneiScaffolding.configFor(_supportLevel, 'letter-shape');

    if (_variant === 'A') {
      renderVariantA(item, cfg);
    } else {
      renderVariantB(item, cfg);
    }
  }

  // ============================================================
  // Variant A — רצפטיבי
  // ============================================================
  function renderVariantA(item, cfg) {
    _root.innerHTML = '';
    AvneiInstruction.mount(_root, {
      text: `מצאו את ${_letter}`,
      onAudio: () => {
        _hintUsed = true;
        AvneiAudio.play(item.prompt_audio_key);
      },
    });

    const grid = document.createElement('section');
    grid.className = 'shell-grid';
    grid.id = 'lsOptionsGrid';
    _root.appendChild(grid);

    // קצירת options לפי supportLevel
    const opts = AvneiScaffolding.trimOptions(item.options, cfg.optionsCount);

    opts.forEach((opt, i) => {
      const card = AvneiShell.withLetter({
        letter: opt.letter,
        index: i,
        ariaLabel: 'אות ' + opt.letter,
        dataset: {
          correct: opt.correct === true ? 'true' : 'false',
          letter: opt.letter,
        },
      });
      card.addEventListener('click', () => handleTap(card, opt, item));
      grid.appendChild(card);
    });

    AvneiNoni.setState('idle');
    AvneiFeedback.hide();

    // השמעת prompt
    if (AvneiAudio.isUnlocked()) {
      const delay = cfg.preAudio ? 200 : 400;
      setTimeout(() => AvneiAudio.play(item.prompt_audio_key), delay);
    }

    if (cfg.autoHintDelayMs !== null) {
      _autoHintTimer = setTimeout(() => triggerAutoHint('lsOptionsGrid', item), cfg.autoHintDelayMs);
    }
  }

  // ============================================================
  // Variant B — פרודוקטיבי
  // ============================================================
  function renderVariantB(item, cfg) {
    _root.innerHTML = '';
    AvneiInstruction.mount(_root, {
      text: `איזו קונכייה אומרת את הצליל של ${item.letter}?`,
      onAudio: () => {
        _hintUsed = true;
        AvneiAudio.play(item.prompt_audio_key);
      },
    });

    const stage = document.createElement('section');
    stage.className = 'letter-stage';
    stage.innerHTML = `
      <div class="letter-pedestal big">
        <div class="letter-display">${item.letter}</div>
      </div>
    `;
    _root.appendChild(stage);

    const grid = document.createElement('section');
    grid.className = 'shell-grid';
    grid.id = 'lsBubbleGrid';
    _root.appendChild(grid);

    const opts = AvneiScaffolding.trimOptions(item.options, cfg.optionsCount);

    opts.forEach((opt, i) => {
      // קונכייה עם אייקון אודיו (במקום אות) — מסמן "הקש כדי לשמוע"
      const bubble = AvneiShell.create({
        index: i,
        className: 'bubble-option',  // נשמר ליישומי highlight
        ariaLabel: 'קונכייה ' + (i + 1),
        dataset: {
          correct: opt.correct === true ? 'true' : 'false',
          letter: opt.letter,
        },
      });
      // תיקון חוב #2 (23.5.2026): הצגת האות בתוך הקונכייה במקום רמקול אילם.
      // הילדה צריכה לראות איזו אות יושבת בכל קונכייה, אחרת היא מנחשת.
      // רמקול קטן בפינה — מסמן "הקש כדי לשמוע".
      AvneiShell.setContent(bubble, `
        <div class="shell-letter-display" style="font-size: 3.2em; font-weight: 700; color: var(--coral); font-family: 'Frank Ruhl Libre', 'David', serif; line-height: 1;">${opt.letter}</div>
        <svg class="shell-speaker-hint" width="20%" height="20%" viewBox="0 0 24 24" fill="none" style="position:absolute; bottom:8%; left:8%; opacity:0.6;">
          <path d="M5 9v6h4l5 4V5L9 9H5z" fill="var(--coral)"/>
          <path d="M16 8a4 4 0 010 8" stroke="var(--coral)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        </svg>
      `);
      bubble.addEventListener('click', () => handleBubbleTap(bubble, opt, item));
      grid.appendChild(bubble);
    });

    AvneiNoni.setState('idle');
    AvneiFeedback.hide();

    if (AvneiAudio.isUnlocked()) {
      const delay = cfg.preAudio ? 200 : 400;
      setTimeout(() => AvneiAudio.play(item.prompt_audio_key), delay);
    }

    if (cfg.autoHintDelayMs !== null) {
      _autoHintTimer = setTimeout(() => triggerAutoHint('lsBubbleGrid', item), cfg.autoHintDelayMs);
    }
  }

  function handleBubbleTap(bubble, opt, item) {
    // השמע את שם האות שמיוצג ע"י הבועה
    AvneiAudio.play(opt.name_audio_key);
    // המתן רגע לשמיעה, ואז בחירה
    bubble.classList.add('bubble-active');
    setTimeout(() => bubble.classList.remove('bubble-active'), 800);
    handleTap(bubble, opt, item);
  }

  // ============================================================
  // לוגיקת בחירה (משותף לשני הוריאנטים)
  // ============================================================
  function handleTap(el, opt, item) {
    if (_autoHintTimer) { clearTimeout(_autoHintTimer); _autoHintTimer = null; }

    if (opt.correct === true) {
      return correct(el, opt, item);
    }

    _attempts++;
    el.classList.add('wrong');
    setTimeout(() => el.classList.add('dimmed'), 500);

    if (_attempts === 1) {
      AvneiNoni.setState('help');
      AvneiFeedback.show('בואו ננסה יחד');
      AvneiAudio.playSequence([item.prompt_audio_key, 'trywithme'], 600);
    } else if (_attempts === 2) {
      AvneiNoni.setState('hint');
      AvneiFeedback.show('נוני מצביע על האות');
      _hintUsed = true;
      _noniGuidanceUsed = true;
      highlightCorrect();
      setTimeout(() => AvneiAudio.play(item.letter_name_audio_key), 300);
    } else if (_attempts >= 3) {
      AvneiNoni.setState('hint');
      AvneiFeedback.show('זאת התשובה — הקישו עליה');
      _noniGuidanceUsed = true;
      highlightCorrect(true);
      AvneiAudio.play('press-here');
    }
  }

  function highlightCorrect(strong) {
    const grid = document.querySelector('#lsOptionsGrid, #lsBubbleGrid');
    if (!grid) return;
    grid.querySelectorAll('[data-correct="true"]').forEach(c => {
      c.classList.remove('hint-glow', 'dimmed');
      c.classList.add('hint-glow');
      if (strong) {
        c.style.outline = '4px solid #FFE7A8';
        c.style.outlineOffset = '2px';
      }
    });
  }

  function triggerAutoHint(gridId, item) {
    _autoHintTriggered = true;
    AvneiNoni.setState('hint');
    document.querySelectorAll('#' + gridId + ' [data-correct="true"]').forEach(c => {
      c.classList.add('hint-glow');
    });
    AvneiAudio.play(item.letter_name_audio_key);
  }

  function correct(el, opt, item) {
    const gridSel = '#lsOptionsGrid, #lsBubbleGrid';
    document.querySelectorAll(gridSel).forEach(g => {
      g.querySelectorAll('.shell-option, .option-card, .bubble-option').forEach(c => {
        c.classList.remove('hint-glow', 'wrong', 'dimmed');
        c.style.outline = '';
        c.style.pointerEvents = 'none';
      });
    });
    el.classList.add('correct');
    AvneiNoni.setState('cheer');

    const feedbackOptions = [
      { text: 'מצאנו יחד!', audio: 'great' },
      { text: 'האות מתחילה לזהור', audio: 'exactly' },
      { text: 'מצוין', audio: 'right' },
    ];
    const fb = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
    AvneiFeedback.show(fb.text);
    AvneiAudio.playSequence([item.letter_name_audio_key, fb.audio], 700);

    if (_attempts === 0) {
      addPearl(1);
      renderPearlCounter();
    }

    AvneiFeedback.successBurst(el);
    _correctCount++;

    const result = {
      activity_type: _activityType,
      activity_variant: _variant,
      item_id: item.id || null,
      target_letter: _letter,
      supportLevel: _supportLevel,
      is_correct: _attempts === 0,
      attempts: _attempts,
      response_time_ms: Date.now() - _itemStartTime,
      hint_used: _hintUsed,
      auto_hint_triggered: _autoHintTriggered,
      noni_guidance_used: _noniGuidanceUsed,
      // E.17 (28.5) — תיוג ראמ"ה: shell/house = אי 3 = משימה 1 פעימה 1.
      // אם פריט נושא במפורש את השדות (item-schema.js) → לבחור אותם.
      rama_task_alignment: (typeof item.rama_task_alignment === 'number') ? item.rama_task_alignment : 1,
      peima_target:        (typeof item.peima_target === 'number') ? item.peima_target : 1,
    };
    AvneiEventLogger.logActivityResult(result);
    _onItemComplete(result);

    setTimeout(() => {
      _idx++;
      renderItem();
    }, 1800);
  }

  return { mount, unmount };
})();
