// ============================================================
// activities/letter-shape.js — הכרת צורת אות דפוס
//
// Variant A (רצפטיבי): שומע "מצאי את מ" → בוחר אות מ-3 אפשרויות
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
    _root.innerHTML = `
      <section class="ls-prompt-row">
        <button class="audio-btn-large" id="lsAudioBtn" aria-label="השמע שוב">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M5 9v6h4l5 4V5L9 9H5z" fill="currentColor"/>
            <path d="M16 8a4 4 0 010 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
          </svg>
        </button>
      </section>
      <section class="options-grid letter-options" id="lsOptionsGrid"></section>
    `;

    document.getElementById('lsAudioBtn').addEventListener('click', () => {
      _hintUsed = true;
      AvneiAudio.play(item.prompt_audio_key);
    });

    // קצירת options לפי supportLevel
    const opts = AvneiScaffolding.trimOptions(item.options, cfg.optionsCount);

    const grid = document.getElementById('lsOptionsGrid');
    grid.innerHTML = '';
    opts.forEach((opt) => {
      const card = document.createElement('button');
      card.className = 'option-card letter-card';
      card.dataset.correct = opt.correct === true ? 'true' : 'false';
      card.dataset.letter = opt.letter;
      card.setAttribute('aria-label', 'אות ' + opt.letter);

      const letterEl = document.createElement('div');
      letterEl.className = 'option-letter';
      letterEl.textContent = opt.letter;
      card.appendChild(letterEl);

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
    _root.innerHTML = `
      <section class="letter-stage">
        <div class="letter-pedestal big">
          <div class="letter-display">${item.letter}</div>
        </div>
      </section>
      <section class="bubble-grid" id="lsBubbleGrid"></section>
    `;

    const opts = AvneiScaffolding.trimOptions(item.options, cfg.optionsCount);

    const grid = document.getElementById('lsBubbleGrid');
    grid.innerHTML = '';
    opts.forEach((opt, i) => {
      const bubble = document.createElement('button');
      bubble.className = 'bubble-option';
      bubble.dataset.correct = opt.correct === true ? 'true' : 'false';
      bubble.dataset.letter = opt.letter;
      bubble.setAttribute('aria-label', 'בועה ' + (i + 1));

      // אייקון קול קטן בתוך הבועה — לרמוז שהיא ניתנת ללחיצה לשמיעה
      bubble.innerHTML = `
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M5 9v6h4l5 4V5L9 9H5z" fill="currentColor"/>
          <path d="M16 8a4 4 0 010 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        </svg>
      `;

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
      AvneiFeedback.show('בואי ננסה יחד');
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
      AvneiFeedback.show('זאת התשובה — הקש/י עליה');
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
      g.querySelectorAll('.option-card, .bubble-option').forEach(c => {
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
      { text: 'יופי', audio: 'right' },
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
