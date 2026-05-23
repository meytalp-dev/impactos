// ============================================================
// activities/sound-match.js — חיבור אות לצליל פותח
// "בְּאֵיזוֹ תְּמוּנָה שׁוֹמְעִים אֶת הַצְּלִיל בְּהַתְחָלָה?"
// חולץ מ-stage-3.html v0.1 (23.5.2026)
//
// פדגוגיה (לפי 22-islands-validated + pedagogy-verification):
//   primary_island_id: 3 (זיהוי אותיות — צליל מרכזי של האות)
//   secondary_island_ids: [2] (מודעות פונולוגית פונמית — צליל ראשון)
//
// חוזה:
//   mount(rootEl, { letter, supportLevel, items, onItemComplete, onActivityComplete })
//   unmount()
// ============================================================

window.AvneiSoundMatch = (function() {

  const ACTIVITY_TYPE = 'soundMatch';
  let _root = null;
  let _items = [];
  let _letter = null;
  let _supportLevel = 1;
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

  function imgPath(jsonUrl) {
    if (!jsonUrl) return null;
    return jsonUrl.replace(/^images\//, 'assets/');
  }

  function mount(rootEl, opts) {
    _root = rootEl;
    _items = opts.items || [];
    _letter = opts.letter;
    _supportLevel = opts.supportLevel || 1;
    _onItemComplete = opts.onItemComplete || (() => {});
    _onActivityComplete = opts.onActivityComplete || (() => {});
    _idx = 0;
    _correctCount = 0;

    // בנייה ראשונית של ה-DOM פעם אחת
    _root.innerHTML = `
      <section class="letter-stage">
        <div class="letter-pedestal">
          <div class="letter-display" id="smLetterDisplay">${_letter}</div>
          <button class="audio-btn" id="smAudioBtn" aria-label="השמע שוב">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 9v6h4l5 4V5L9 9H5z" fill="currentColor"/>
              <path d="M16 8a4 4 0 010 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
            </svg>
          </button>
        </div>
        <div class="prompt-text" id="smPromptText">איזו תמונה מתחילה בצליל הזה?</div>
      </section>
      <section class="options-grid" id="smOptionsGrid"></section>
    `;

    document.getElementById('smAudioBtn').addEventListener('click', () => {
      AvneiAudio.playLetterSound(_letter);
      _hintUsed = true;
      const btn = document.getElementById('smAudioBtn');
      btn.classList.add('playing');
      setTimeout(() => btn.classList.remove('playing'), 600);
    });

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

    const cfg = AvneiScaffolding.configFor(_supportLevel, 'soundMatch');

    document.getElementById('smLetterDisplay').textContent = item.letter_in_focus || _letter;
    document.getElementById('smPromptText').textContent =
      item.prompt || 'איזו תמונה מתחילה בצליל הזה?';

    AvneiFeedback.hide();

    // קצירת options לפי supportLevel
    const options = AvneiScaffolding.trimOptions(item.options || [], cfg.optionsCount);

    const grid = document.getElementById('smOptionsGrid');
    grid.innerHTML = '';
    options.forEach((opt) => {
      const card = document.createElement('button');
      card.className = 'option-card';
      card.dataset.correct = opt.correct === true ? 'true' : 'false';
      card.dataset.word = opt.word || opt.concept || '';
      card.dataset.concept = opt.concept || '';
      card.setAttribute('aria-label', opt.concept || 'תמונה');

      const pic = document.createElement('div');
      pic.className = 'pic';
      const path = imgPath(opt.image_url);
      if (path) {
        const img = document.createElement('img');
        img.src = path;
        img.alt = opt.concept || '';
        img.onerror = () => {
          pic.innerHTML = '';
          pic.textContent = opt.emoji_suggestion || '?';
          pic.style.fontSize = 'clamp(54px, 11vw, 88px)';
        };
        pic.appendChild(img);
      } else {
        pic.textContent = opt.emoji_suggestion || '?';
        pic.style.fontSize = 'clamp(54px, 11vw, 88px)';
      }

      card.appendChild(pic);
      card.addEventListener('click', () => handleTap(card, opt));
      grid.appendChild(card);
    });

    AvneiNoni.setState('idle');

    // השמעת הצליל אוטומטית (כשאודיו unlocked)
    if (AvneiAudio.isUnlocked()) {
      // pre-audio ב-L4 (הקראה לפני אינטראקציה)
      if (cfg.preAudio) {
        setTimeout(() => AvneiAudio.playLetterSound(item.letter_in_focus || _letter), 200);
      } else {
        setTimeout(() => AvneiAudio.playLetterSound(item.letter_in_focus || _letter), 350);
      }
    }

    // רמז אוטומטי לפי supportLevel
    if (cfg.autoHintDelayMs !== null) {
      _autoHintTimer = setTimeout(() => {
        triggerAutoHint();
      }, cfg.autoHintDelayMs);
    }
  }

  function triggerAutoHint() {
    _autoHintTriggered = true;
    AvneiNoni.setState('hint');
    // הדגשה רכה של התשובה הנכונה
    document.querySelectorAll('#smOptionsGrid .option-card').forEach(c => {
      if (c.dataset.correct === 'true') c.classList.add('hint-glow');
    });
    AvneiAudio.playLetterSound(_letter);
  }

  function handleTap(card, opt) {
    if (_autoHintTimer) { clearTimeout(_autoHintTimer); _autoHintTimer = null; }

    if (opt.correct === true) {
      return correct(card, opt);
    }

    // טעות
    _attempts++;
    card.classList.add('wrong');
    setTimeout(() => card.classList.add('dimmed'), 500);

    const wrongConcept = card.dataset.concept;

    if (_attempts === 1) {
      AvneiNoni.setState('help');
      AvneiFeedback.show('בוא/י ננסה יחד');
      AvneiAudio.playSequence([wrongConcept, 'trywithme'], 600);
    } else if (_attempts === 2) {
      AvneiNoni.setState('hint');
      AvneiFeedback.show('נוני מצביע על התשובה');
      _hintUsed = true;
      _noniGuidanceUsed = true;
      document.querySelectorAll('#smOptionsGrid .option-card').forEach(c => {
        if (c.dataset.correct === 'true') c.classList.add('hint-glow');
      });
      const item = _items[_idx];
      setTimeout(() => AvneiAudio.playLetterSound(item.letter_in_focus || _letter), 300);
    } else if (_attempts >= 3) {
      AvneiNoni.setState('hint');
      AvneiFeedback.show('זאת התשובה — הקש/י עליה');
      _noniGuidanceUsed = true;
      document.querySelectorAll('#smOptionsGrid .option-card').forEach(c => {
        if (c.dataset.correct === 'true') {
          c.classList.remove('hint-glow', 'dimmed');
          c.classList.add('hint-glow');
          c.style.outline = '4px solid #FFE7A8';
          c.style.outlineOffset = '2px';
        }
      });
      AvneiAudio.play('press-here');
    }
  }

  function correct(card, opt) {
    document.querySelectorAll('#smOptionsGrid .option-card').forEach(c => {
      c.classList.remove('hint-glow', 'wrong', 'dimmed');
      c.style.outline = '';
      c.style.pointerEvents = 'none';
    });
    card.classList.add('correct');
    AvneiNoni.setState('cheer');

    const feedbackOptions = [
      { text: 'מצאנו יחד!', audio: 'great' },
      { text: 'בדיוק!', audio: 'exactly' },
      { text: 'יופי, האות מתחילה לזהור', audio: 'right' },
    ];
    const fb = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
    AvneiFeedback.show(fb.text);

    const correctConcept = opt.concept || '';
    AvneiAudio.playSequence([correctConcept, fb.audio], 700);

    // פנינה רק על טעות אפס
    if (_attempts === 0) {
      addPearl(1);
      renderPearlCounter();
    }

    AvneiFeedback.successBurst(card);
    _correctCount++;

    // דיווח event לפריט
    const item = _items[_idx];
    const result = {
      activity_type: ACTIVITY_TYPE,
      activity_variant: null,
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

  return { mount, unmount, ACTIVITY_TYPE };
})();
