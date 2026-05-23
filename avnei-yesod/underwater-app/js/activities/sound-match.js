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
    _root.innerHTML = '';
    AvneiInstruction.mount(_root, {
      text: `איזו תמונה מתחילה בצליל ${_letter}?`,
      onAudio: () => {
        // מקריא את השאלה המלאה (לא רק את הצליל)
        AvneiAudio.playFindSoundPrompt(_letter);
        _hintUsed = true;
      },
    });

    const stage = document.createElement('section');
    stage.className = 'letter-stage';
    stage.innerHTML = `
      <div class="letter-pedestal">
        <div class="letter-display" id="smLetterDisplay">${_letter}</div>
      </div>
    `;
    _root.appendChild(stage);

    const grid = document.createElement('section');
    grid.className = 'shell-grid';
    grid.id = 'smOptionsGrid';
    _root.appendChild(grid);

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

    const cfg = AvneiScaffolding.configFor(_supportLevel, 'soundMatch');

    document.getElementById('smLetterDisplay').textContent = item.letter_in_focus || _letter;
    // עדכון טקסט בועת ההוראה לפי האות הנוכחית (אם יש שונה ברמת ה-item)
    AvneiInstruction.setText(`איזו תמונה מתחילה בצליל ${item.letter_in_focus || _letter}?`);

    AvneiFeedback.hide();

    // קצירת options לפי supportLevel
    const options = AvneiScaffolding.trimOptions(item.options || [], cfg.optionsCount);

    const grid = document.getElementById('smOptionsGrid');
    grid.innerHTML = '';
    options.forEach((opt, i) => {
      const path = imgPath(opt.image_url);
      let card;
      if (path) {
        card = AvneiShell.withImage({
          src: path,
          alt: opt.concept || '',
          fallback: opt.emoji_suggestion || '?',
          index: i,
          ariaLabel: opt.concept || 'תמונה',
          dataset: {
            correct: opt.correct === true ? 'true' : 'false',
            word: opt.word || opt.concept || '',
            concept: opt.concept || '',
          },
        });
      } else {
        card = AvneiShell.create({
          index: i,
          ariaLabel: opt.concept || 'תמונה',
          dataset: {
            correct: opt.correct === true ? 'true' : 'false',
            word: opt.word || opt.concept || '',
            concept: opt.concept || '',
          },
        });
        AvneiShell.setContent(card, `<span class="shell-fallback">${opt.emoji_suggestion || '?'}</span>`);
      }
      card.addEventListener('click', () => handleTap(card, opt));
      grid.appendChild(card);
    });

    AvneiNoni.setState('idle');

    // השמעת השאלה המלאה אוטומטית (כשאודיו unlocked)
    // ("איזו תמונה מתחילה בצליל מ?") במקום רק את הצליל
    if (AvneiAudio.isUnlocked()) {
      const delay = cfg.preAudio ? 200 : 350;
      setTimeout(() => AvneiAudio.playFindSoundPrompt(item.letter_in_focus || _letter), delay);
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
    document.querySelectorAll('#smOptionsGrid .shell-option').forEach(c => {
      if (c.dataset.correct === 'true') c.classList.add('hint-glow');
    });
    AvneiAudio.playLetterSound(_letter);
  }

  function handleTap(card, opt) {
    if (_autoHintTimer) { clearTimeout(_autoHintTimer); _autoHintTimer = null; }

    if (opt.correct === true) {
      return correct(card, opt);
    }

    // טעות — מודל תמיכות לפי feedback_avnei_yesod_support_levels:
    // טעות 1 = אין תמיכה (הילד מנסה שוב), טעות 2 = רמז, טעות 3+ = הקש פה
    _attempts++;
    card.classList.add('wrong');
    setTimeout(() => card.classList.add('dimmed'), 500);

    if (_attempts === 1) {
      // אין תמיכה מילולית. רק טעות-עדינה ויזואלית. הילד מנסה שוב.
      return;
    } else if (_attempts === 2) {
      AvneiNoni.setState('hint');
      AvneiFeedback.show('נוני מצביע על התשובה');
      _hintUsed = true;
      _noniGuidanceUsed = true;
      document.querySelectorAll('#smOptionsGrid .shell-option').forEach(c => {
        if (c.dataset.correct === 'true') c.classList.add('hint-glow');
      });
      const item = _items[_idx];
      setTimeout(() => AvneiAudio.playLetterSound(item.letter_in_focus || _letter), 300);
    } else if (_attempts >= 3) {
      AvneiNoni.setState('hint');
      AvneiFeedback.show('זאת התשובה — הקש/י עליה');
      _noniGuidanceUsed = true;
      document.querySelectorAll('#smOptionsGrid .shell-option').forEach(c => {
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
    document.querySelectorAll('#smOptionsGrid .shell-option').forEach(c => {
      c.classList.remove('hint-glow', 'wrong', 'dimmed');
      c.style.outline = '';
      c.style.pointerEvents = 'none';
    });
    card.classList.add('correct');
    AvneiNoni.setState('cheer');

    const feedbackOptions = [
      { text: 'מצאנו יחד!', audio: 'great' },
      { text: 'יופי גדול!', audio: 'exactly' },
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
