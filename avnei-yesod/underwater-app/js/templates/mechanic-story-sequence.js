// ============================================================================
// templates/mechanic-story-sequence.js — Story Sequence mechanic (אי 14)
// סוכן 31 · 29.5.2026
//
// תפקיד: ילדה מקשיבה לסיפור, רואה משפטים מעורבבים (4-5), ומסדרת בסדר נכון
//        על-ידי "tap-to-place" (לוחצת על משפט → הולך למקום הבא בסדר התשובה).
//        משימה זו מקדמת skill="sequence" באי 14.
//
// קלט (init opts):
//   studentId · level · batchSize · mountRoot · onComplete · onProgress
//
// תלות:
//   AvneiOralSkillAdapter — getRandomBatch(level) · recordAttempt
//   speechSynthesis — לקרוא passage
//
// אסטרטגיה: passage_text מפוצל ל-sentences (".") — sentences ה-original = הסדר הנכון.
//   רק רמות 2-3 רלוונטיות (≥ 4 משפטים). רמה 1 (3-4 משפטים) — לפעמים גם מתאים.
//
// API (window.AvneiMechanicStorySequence):
//   init(opts) · start() · stop()
//   _splitToSentences(text) — חשוף לטסטים
// ============================================================================

(function () {
  'use strict';

  const SPEECH_RATE = 0.85;
  const FEEDBACK_DELAY_MS = 1400;
  const MIN_SENTENCES = 4;
  const MAX_SENTENCES_DISPLAYED = 5; // אם הסיפור ארוך, ניקח 5 ראשונים. לקטנות לא נעמיס.

  let _state = null;

  // --------------------------------------------------------------------------
  // Audio
  // --------------------------------------------------------------------------
  function stopAudio() {
    if (typeof speechSynthesis !== 'undefined') {
      try { speechSynthesis.cancel(); } catch (e) {}
    }
  }

  function speakHebrew(text) {
    return new Promise(resolve => {
      if (!text || typeof speechSynthesis === 'undefined') { resolve(false); return; }
      try {
        stopAudio();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'he-IL';
        u.rate = SPEECH_RATE;
        u.onend = () => resolve(true);
        u.onerror = () => resolve(false);
        speechSynthesis.speak(u);
      } catch (e) { resolve(false); }
    });
  }

  // --------------------------------------------------------------------------
  // Sentence splitting — חוזק: גם ":", ".", "!", "?" עם מרווח אחריהם.
  // --------------------------------------------------------------------------
  function splitToSentences(text) {
    if (!text || typeof text !== 'string') return [];
    // מפצל על נקודה/קריאה/שאלה ואחריה רווח. שומר על משפטים חתוכים בקצוות.
    const raw = text.split(/(?<=[.!?])\s+/);
    return raw.map(s => s.trim()).filter(s => s.length > 0);
  }

  function shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    // הגנה: אם בטעות החזיר את אותו הסדר — סובב פעם אחת
    if (out.length > 1 && arr.every((v, i) => v === out[i])) {
      out.push(out.shift());
    }
    return out;
  }

  // --------------------------------------------------------------------------
  // DOM
  // --------------------------------------------------------------------------
  function buildDOM(root) {
    root.innerHTML = '';
    root.classList.add('mechanic-story-sequence');
    const wrap = document.createElement('div');
    wrap.className = 'mss-wrap';
    wrap.innerHTML = `
      <div class="mss-progress" id="mssProgress" aria-live="polite"></div>

      <section class="mss-passage-card">
        <h2 class="mss-instruction" id="mssInstruction">הקשיבי לסיפור, ואז סדרי את המשפטים לפי הסדר שקרה.</h2>
        <button class="mss-audio-btn" id="mssPlayPassage" type="button">
          <span class="mss-icon" aria-hidden="true">▶</span>
          <span class="mss-label">להאזין לסיפור</span>
        </button>
      </section>

      <section class="mss-order-card">
        <h3 class="mss-section-title">הסדר שלך:</h3>
        <ol class="mss-answer-slots" id="mssAnswerSlots" aria-label="הסדר שבחרת"></ol>

        <h3 class="mss-section-title">לחצי על המשפטים בסדר שקרו:</h3>
        <div class="mss-choices" id="mssChoices"></div>

        <div class="mss-feedback" id="mssFeedback" aria-live="polite"></div>

        <div class="mss-actions">
          <button class="mss-btn mss-btn--ghost" id="mssResetBtn" type="button">לאפס סדר</button>
          <button class="mss-btn" id="mssCheckBtn" type="button" disabled>בודקת תשובה</button>
        </div>
      </section>
    `;
    root.appendChild(wrap);
  }

  function renderProgress() {
    const el = document.getElementById('mssProgress');
    if (!el || !_state) return;
    el.textContent = (_state.idx + 1) + ' / ' + _state.items.length;
  }

  // --------------------------------------------------------------------------
  // Item lifecycle
  // --------------------------------------------------------------------------
  function loadNextItem() {
    if (!_state) return false;
    while (_state.idx < _state.items.length) {
      const it = _state.items[_state.idx];
      const sentences = splitToSentences(it.passage_text || '');
      if (sentences.length >= MIN_SENTENCES) {
        const truncated = sentences.slice(0, MAX_SENTENCES_DISPLAYED);
        _state.currentSentences = truncated; // הסדר הנכון
        _state.currentShuffled = shuffle(truncated);
        _state.currentItem = it;
        _state.currentAnswer = []; // sentences שנבחרו ע"י הילדה (לפי סדר)
        _state.currentItemStartedAt = Date.now();
        _state.answered = false;
        return true;
      }
      _state.idx++; // skip items קצרים מדי
    }
    return false;
  }

  function renderItem() {
    const slotsEl = document.getElementById('mssAnswerSlots');
    const choicesEl = document.getElementById('mssChoices');
    const feedbackEl = document.getElementById('mssFeedback');
    const checkBtn = document.getElementById('mssCheckBtn');
    if (!slotsEl || !choicesEl) return;

    slotsEl.innerHTML = '';
    _state.currentSentences.forEach((_, i) => {
      const li = document.createElement('li');
      li.className = 'mss-slot mss-slot--empty';
      li.dataset.slotIdx = String(i);
      li.textContent = '—';
      slotsEl.appendChild(li);
    });

    choicesEl.innerHTML = '';
    _state.currentShuffled.forEach((sentence, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mss-choice';
      btn.dataset.sentence = sentence;
      btn.dataset.choiceIdx = String(idx);
      btn.lang = 'he';
      btn.textContent = sentence;
      btn.addEventListener('click', () => onChoiceClick(btn, sentence));
      choicesEl.appendChild(btn);
    });

    if (feedbackEl) { feedbackEl.textContent = ''; feedbackEl.className = 'mss-feedback'; }
    if (checkBtn)   { checkBtn.disabled = true; }

    renderProgress();
  }

  function onChoiceClick(btn, sentence) {
    if (!_state || _state.answered || btn.disabled) return;
    const nextIdx = _state.currentAnswer.length;
    if (nextIdx >= _state.currentSentences.length) return;

    _state.currentAnswer.push(sentence);
    btn.disabled = true;
    btn.classList.add('mss-choice--used');

    const slot = document.querySelector('.mss-slot[data-slot-idx="' + nextIdx + '"]');
    if (slot) {
      slot.textContent = sentence;
      slot.classList.remove('mss-slot--empty');
      slot.classList.add('mss-slot--filled');
    }

    const checkBtn = document.getElementById('mssCheckBtn');
    if (checkBtn) {
      checkBtn.disabled = (_state.currentAnswer.length !== _state.currentSentences.length);
    }
  }

  function onResetClick() {
    if (!_state || _state.answered) return;
    _state.currentAnswer = [];
    document.querySelectorAll('.mss-choice').forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('mss-choice--used');
    });
    document.querySelectorAll('.mss-slot').forEach((slot, i) => {
      slot.textContent = '—';
      slot.classList.remove('mss-slot--filled');
      slot.classList.add('mss-slot--empty');
    });
    const feedbackEl = document.getElementById('mssFeedback');
    if (feedbackEl) { feedbackEl.textContent = ''; feedbackEl.className = 'mss-feedback'; }
    const checkBtn = document.getElementById('mssCheckBtn');
    if (checkBtn) checkBtn.disabled = true;
  }

  function onCheckClick() {
    if (!_state || _state.answered) return;
    if (_state.currentAnswer.length !== _state.currentSentences.length) return;
    _state.answered = true;

    const expected = _state.currentSentences;
    const actual = _state.currentAnswer;
    const isCorrect = expected.every((s, i) => s === actual[i]);
    const elapsedMs = Date.now() - (_state.currentItemStartedAt || Date.now());

    // BKT event — skill=sequence
    if (window.AvneiOralSkillAdapter && typeof window.AvneiOralSkillAdapter.recordAttempt === 'function') {
      try {
        window.AvneiOralSkillAdapter.recordAttempt(_state.studentId, {
          item_id: _state.currentItem.item_id,
          q_id: (_state.currentItem.item_id || 'unknown') + '-seq',
          skill: 'sequence',
          level: _state.currentItem.level,
          is_correct: isCorrect,
          response_time_ms: elapsedMs,
          session_id: _state.sessionId,
        });
      } catch (e) { console.warn('mechanic-story-sequence: recordAttempt failed', e); }
    }

    _state.results.push({
      item_id: _state.currentItem.item_id,
      skill: 'sequence',
      is_correct: isCorrect,
      response_time_ms: elapsedMs,
    });

    // Visual feedback
    document.querySelectorAll('.mss-slot').forEach((slot, i) => {
      const actualSentence = actual[i];
      const correctSentence = expected[i];
      slot.classList.remove('mss-slot--empty');
      if (actualSentence === correctSentence) slot.classList.add('mss-slot--correct');
      else slot.classList.add('mss-slot--wrong');
    });

    const feedbackEl = document.getElementById('mssFeedback');
    if (feedbackEl) {
      feedbackEl.textContent = isCorrect ? 'יופי! בדיוק הסדר הנכון.' : 'התשובה הנכונה: ' + expected.join(' ');
      feedbackEl.className = 'mss-feedback ' + (isCorrect ? 'mss-feedback--ok' : 'mss-feedback--miss');
    }

    if (typeof _state.onProgress === 'function') {
      try { _state.onProgress({ idx: _state.idx, total: _state.items.length, isCorrect }); } catch (e) {}
    }

    setTimeout(advance, FEEDBACK_DELAY_MS + 600);
  }

  function advance() {
    if (!_state) return;
    _state.idx++;
    if (loadNextItem()) {
      renderItem();
      speakHebrew(_state.currentItem.passage_text || '');
    } else {
      complete();
    }
  }

  function complete() {
    if (!_state) return;
    stopAudio();
    const correctCount = _state.results.filter(r => r.is_correct).length;
    const payload = {
      studentId: _state.studentId,
      level: _state.level,
      total: _state.results.length,
      correct: correctCount,
      accuracy: _state.results.length > 0 ? correctCount / _state.results.length : 0,
      results: _state.results,
    };
    if (typeof _state.onComplete === 'function') {
      try { _state.onComplete(payload); } catch (e) {}
    }
  }

  // --------------------------------------------------------------------------
  // API
  // --------------------------------------------------------------------------
  function init(opts) {
    if (!opts || !opts.mountRoot) return;
    _state = {
      studentId: opts.studentId || 'local',
      level: opts.level || 2,
      batchSize: opts.batchSize || 4,
      onComplete: opts.onComplete || null,
      onProgress: opts.onProgress || null,
      mountRoot: opts.mountRoot,
      items: Array.isArray(opts.items) ? opts.items : null,
      idx: 0,
      results: [],
      sessionId: 'isle14-seq-' + Date.now(),
    };
    buildDOM(_state.mountRoot);
    const playBtn  = document.getElementById('mssPlayPassage');
    const resetBtn = document.getElementById('mssResetBtn');
    const checkBtn = document.getElementById('mssCheckBtn');
    if (playBtn)  playBtn.addEventListener('click', () => speakHebrew(_state.currentItem && _state.currentItem.passage_text || ''));
    if (resetBtn) resetBtn.addEventListener('click', onResetClick);
    if (checkBtn) checkBtn.addEventListener('click', onCheckClick);
  }

  function start() {
    if (!_state) return;
    // ניקח items בלי לפתח ל-question-level: נשתמש ב-passages (1 פר item, לא flattened).
    const loader = _state.items
      ? Promise.resolve(_state.items)
      : (window.AvneiOralSkillAdapter
          ? window.AvneiOralSkillAdapter.loadPassages(_state.level).then(d => {
              const ps = Array.isArray(d.passages) ? d.passages.slice() : [];
              for (let i = ps.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const t = ps[i]; ps[i] = ps[j]; ps[j] = t;
              }
              return ps.slice(0, _state.batchSize);
            })
          : Promise.reject(new Error('AvneiOralSkillAdapter not loaded')));
    loader
      .then(items => {
        if (!Array.isArray(items) || items.length === 0) throw new Error('no items');
        _state.items = items;
        if (!loadNextItem()) throw new Error('no items with ≥ ' + MIN_SENTENCES + ' sentences');
        renderItem();
        return speakHebrew(_state.currentItem.passage_text || '');
      })
      .catch(err => {
        console.error('mechanic-story-sequence start failed:', err);
        const root = _state && _state.mountRoot;
        if (root) {
          root.innerHTML = '<div class="mss-error" lang="he">אופס, לא הצלחנו לטעון סיפורים. נסי שוב מאוחר יותר.</div>';
        }
      });
  }

  function stop() {
    stopAudio();
    _state = null;
  }

  const API = {
    init, start, stop,
    _splitToSentences: splitToSentences,
    _shuffle: shuffle,
    MIN_SENTENCES,
    FEEDBACK_DELAY_MS,
  };

  if (typeof window !== 'undefined') window.AvneiMechanicStorySequence = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
