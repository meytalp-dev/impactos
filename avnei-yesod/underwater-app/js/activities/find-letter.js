// ============================================================
// activities/find-letter.js — זיהוי האות בתוך מילה קצרה
// "אֵיפֹה הָאוֹת מֵם בְּמִלָּה?"
//
// פדגוגיה: primary_island_id=3, secondary=[5]
// הילד.ה לא קורא.ת את המילה — רק מאתר.ת את האות.
// תמונה תומכת + הקראת המילה עוזרים בלי לדרוש פענוח.
// ============================================================

window.AvneiFindLetter = (function() {

  const ACTIVITY_TYPE = 'findLetter';
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

  function mount(rootEl, opts) {
    _root = rootEl;
    _items = opts.items || [];
    _letter = opts.letter;
    _supportLevel = opts.supportLevel || 1;
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

    const cfg = AvneiScaffolding.configFor(_supportLevel, 'find-letter');

    // ניקוי + בועת הוראה
    _root.innerHTML = '';
    AvneiInstruction.mount(_root, {
      text: `מצאי את ${_letter} בתוך המילה`,
      onAudio: () => {
        _hintUsed = true;
        AvneiAudio.playSequence([item.prompt_audio_key, item.word_audio_key], 600);
      },
    });

    // אזור המסגרת — תמונה משמאל + מילה מימין
    const stage = document.createElement('section');
    stage.className = 'fl-stage';
    stage.innerHTML = `
      <div class="word-frame">
        <img class="word-frame__image" src="${item.image_url}" alt=""
             onerror="this.style.display='none'">
        <div class="word-frame__letters" id="flWord"></div>
      </div>
    `;
    _root.appendChild(stage);

    const wordEl = document.getElementById('flWord');
    item.letters.forEach((letter, i) => {
      const btn = document.createElement('button');
      btn.className = 'word-frame__letter';
      btn.dataset.index = i;
      btn.dataset.correct = (i === item.target_index) ? 'true' : 'false';
      btn.textContent = letter;
      btn.setAttribute('aria-label', 'אות ' + letter);
      btn.addEventListener('click', () => handleTap(btn, i, item));
      wordEl.appendChild(btn);
    });

    AvneiNoni.setState('idle');
    AvneiFeedback.hide();

    if (AvneiAudio.isUnlocked()) {
      const delay = cfg.preAudio ? 200 : 400;
      // נוני אומר.ת prompt, ואז שומעים את המילה
      setTimeout(() => {
        AvneiAudio.playSequence([item.prompt_audio_key, item.word_audio_key], 700);
      }, delay);
    }

    if (cfg.autoHintDelayMs !== null) {
      _autoHintTimer = setTimeout(() => triggerAutoHint(item), cfg.autoHintDelayMs);
    }
  }

  function triggerAutoHint(item) {
    _autoHintTriggered = true;
    AvneiNoni.setState('hint');
    document.querySelectorAll('#flWord .word-frame__letter').forEach(c => {
      if (c.dataset.correct === 'true') c.classList.add('hint-glow');
    });
    AvneiAudio.play(item.letter_name_audio_key || ('name-' + letterEnNameMap(_letter)));
  }

  function letterEnNameMap(l) {
    const m = { 'ת': 'tav', 'מ': 'mem', 'ר': 'resh', 'ב': 'bet', 'ק': 'qof' };
    return m[l] || 'mem';
  }

  function handleTap(btn, index, item) {
    if (_autoHintTimer) { clearTimeout(_autoHintTimer); _autoHintTimer = null; }

    if (index === item.target_index) {
      return correct(btn, item);
    }

    _attempts++;
    btn.classList.add('wrong');
    setTimeout(() => btn.classList.add('dimmed'), 500);

    if (_attempts === 1) {
      AvneiNoni.setState('help');
      AvneiFeedback.show('בואי נחפש את הצורה של מ');
      AvneiAudio.playSequence([item.prompt_audio_key, 'trywithme'], 600);
    } else if (_attempts === 2) {
      AvneiNoni.setState('hint');
      AvneiFeedback.show('הנה הצורה שלה');
      _hintUsed = true;
      _noniGuidanceUsed = true;
      // הצגת האות הגדולה כצף
      showFloatingLetter(_letter);
      setTimeout(() => AvneiAudio.play('name-' + letterEnNameMap(_letter)), 300);
    } else if (_attempts >= 3) {
      AvneiNoni.setState('hint');
      AvneiFeedback.show('זאת היא — הקש/י עליה');
      _noniGuidanceUsed = true;
      document.querySelectorAll('#flWord .word-frame__letter').forEach(c => {
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

  function showFloatingLetter(letter) {
    let el = document.getElementById('flFloatingLetter');
    if (!el) {
      el = document.createElement('div');
      el.id = 'flFloatingLetter';
      el.className = 'fl-floating-letter';
      _root.appendChild(el);
    }
    el.textContent = letter;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2400);
  }

  function correct(btn, item) {
    document.querySelectorAll('#flWord .word-frame__letter').forEach(c => {
      c.classList.remove('hint-glow', 'wrong', 'dimmed');
      c.style.outline = '';
      c.style.pointerEvents = 'none';
    });
    btn.classList.add('correct');
    AvneiNoni.setState('cheer');

    const feedbackOptions = [
      { text: 'מצאת את מ ב' + item.word + '!', audio: 'great' },
      { text: 'יופי! מצאנו יחד', audio: 'exactly' },
      { text: 'בדיוק', audio: 'right' },
    ];
    const fb = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
    AvneiFeedback.show(fb.text);
    AvneiAudio.playSequence([item.word_audio_key, fb.audio], 700);

    if (_attempts === 0) {
      addPearl(1);
      renderPearlCounter();
    }

    AvneiFeedback.successBurst(btn);
    _correctCount++;

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
