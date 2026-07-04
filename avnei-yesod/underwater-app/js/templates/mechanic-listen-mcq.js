// ============================================================================
// templates/mechanic-listen-mcq.js — Listen & MCQ mechanic (אי 14 הבנת הנשמע)
// סוכן 31 · 29.5.2026
//
// תפקיד: ילדה מקשיבה ל-passage_text (Web Speech he-IL), שומעת question_text,
//        בוחרת מתוך 3 אפשרויות. תרגול (לא assessment) — יש פידבק, יש retry.
//
// קלט (init opts):
//   studentId    — string · מ-current-student
//   level        — 1/2/3 · נקבע ב-querystring (?level=1)
//   batchSize    — int · default=5 · כמה items בפעימה
//   onComplete   — function({results}) · נקרא בסוף הפעימה
//   onProgress   — function({idx, total}) · נקרא אחרי כל answer
//   mountRoot    — element · אליו mount-ה-DOM
//
// תלות:
//   AvneiOralSkillAdapter — getRandomBatch · recordAttempt
//   speechSynthesis (Web Speech API he-IL) — חובה
//
// אסטרטגיית אודיו: Web Speech he-IL בלבד (החלטת מיטל 29.5).
//   אין MP3 lookup, אין AvriNeural. רק SpeechSynthesisUtterance.
//
// API חיצוני (window.AvneiMechanicListenMCQ):
//   init(opts)
//   start()
//   stop()
//   _shuffleOptions(item)  — חשוף לטסטים
// ============================================================================

(function () {
  'use strict';

  const SPEECH_RATE = 0.85;       // איטי לכיתה א'
  const SPEECH_PITCH = 1.0;
  const FEEDBACK_DELAY_MS = 1200; // זמן הצגת ✓/✗ לפני המעבר

  let _state = null;

  // --------------------------------------------------------------------------
  // Audio (Web Speech he-IL בלבד · החלטת מיטל 29.5.2026)
  // --------------------------------------------------------------------------
  function stopAudio() {
    if (typeof speechSynthesis !== 'undefined') {
      try { speechSynthesis.cancel(); } catch (e) {}
    }
  }

  // ADAPT-8 (minigame-fit T3, 30.6.2026) — העדפת ElevenLabs MP3 על-פני Web Speech.
  // מנגן את audioKey דרך AvneiAudio אם קיים; אחרת — נופל ל-Web Speech רק כשלא במצב
  // קריאה (read). במצב read הילד.ה קורא.ת בעצמו.ה ואין הקראה אוטומטית.
  // force=true (M2, 4.7.2026) — עוקף את חסימת ה-readMode עבור לחיצה מפורשת על
  // כפתור הרמקול של השאלה (הנגשה); הקטע עצמו לעולם לא מוקרא במצב read.
  // ⚠️ להסרה מלאה של Web Speech (DNA אודיו) — דרושה הפקת MP3 לפריטי אי 14 (§7.3).
  function playText(audioKey, text, force) {
    if (audioKey && typeof window !== 'undefined' && window.AvneiAudio) {
      try { window.AvneiAudio.play(audioKey); return Promise.resolve(true); } catch (e) {}
    }
    if (_state && _state.readMode && !force) return Promise.resolve(false);
    return speakHebrew(text);
  }

  function speakHebrew(text) {
    return new Promise(resolve => {
      if (!text || typeof speechSynthesis === 'undefined') { resolve(false); return; }
      try {
        stopAudio();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'he-IL';
        u.rate = SPEECH_RATE;
        u.pitch = SPEECH_PITCH;
        u.onend = () => resolve(true);
        u.onerror = () => resolve(false);
        speechSynthesis.speak(u);
      } catch (e) {
        resolve(false);
      }
    });
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------
  function shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  function shuffleOptions(item) {
    return Object.assign({}, item, { options: shuffle(item.options || []) });
  }

  // --------------------------------------------------------------------------
  // DOM
  // --------------------------------------------------------------------------
  function buildDOM(root) {
    root.innerHTML = '';
    root.classList.add('mechanic-listen-mcq');

    const wrap = document.createElement('div');
    wrap.className = 'mlmcq-wrap';
    wrap.innerHTML = `
      <div class="mlmcq-progress" id="mlmcqProgress" aria-live="polite"></div>

      <section class="mlmcq-passage-card">
        <div class="mlmcq-passage-text" id="mlmcqPassageText" lang="he"></div>
        <button class="mlmcq-audio-btn mlmcq-passage-btn" id="mlmcqPlayPassage" type="button">
          <span class="mlmcq-icon" aria-hidden="true">▶</span>
          <span class="mlmcq-label">להאזין שוב לסיפור</span>
        </button>
      </section>

      <section class="mlmcq-question-card">
        <div class="mlmcq-question-text" id="mlmcqQuestionText" lang="he"></div>
        <button class="mlmcq-audio-btn mlmcq-question-btn" id="mlmcqPlayQuestion" type="button">
          <span class="mlmcq-icon" aria-hidden="true">▶</span>
          <span class="mlmcq-label">להאזין לשאלה</span>
        </button>
        <div class="mlmcq-options" id="mlmcqOptions" role="radiogroup"></div>
        <div class="mlmcq-feedback" id="mlmcqFeedback" aria-live="polite"></div>
      </section>
    `;
    root.appendChild(wrap);
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  function renderProgress() {
    const el = document.getElementById('mlmcqProgress');
    if (!el || !_state) return;
    el.textContent = (_state.idx + 1) + ' / ' + _state.items.length;
  }

  function renderItem() {
    if (!_state || _state.idx >= _state.items.length) return null;
    const raw = _state.items[_state.idx];
    const item = shuffleOptions(raw);
    _state.currentItem = item;
    _state.currentItemStartedAt = Date.now();
    _state.answered = false;

    const passageEl  = document.getElementById('mlmcqPassageText');
    const questionEl = document.getElementById('mlmcqQuestionText');
    const optionsEl  = document.getElementById('mlmcqOptions');
    const feedbackEl = document.getElementById('mlmcqFeedback');

    if (passageEl)  passageEl.textContent  = item.passage_text || '';
    if (questionEl) questionEl.textContent = item.question_text || '';
    if (feedbackEl) { feedbackEl.textContent = ''; feedbackEl.className = 'mlmcq-feedback'; }

    if (optionsEl) {
      optionsEl.innerHTML = '';
      (item.options || []).forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mlmcq-option';
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', 'false');
        btn.dataset.optionIdx = String(idx);
        btn.lang = 'he';
        btn.textContent = opt.text || '';
        btn.addEventListener('click', () => onAnswer(idx));
        optionsEl.appendChild(btn);
      });
    }

    renderProgress();
    return item;
  }

  // --------------------------------------------------------------------------
  // Flow: speak passage → speak question (auto on first render)
  // --------------------------------------------------------------------------
  async function presentCurrent() {
    if (!_state || !_state.currentItem) return;
    // מצב קריאה (read_comprehension_pick) — אין הקראה אוטומטית; הילד.ה קורא.ת.
    if (_state.readMode) return;
    const item = _state.currentItem;
    await playText(item.passage_audio_key, item.passage_text || '');
    await new Promise(r => setTimeout(r, 350));
    await playText(item.question_audio_key, item.question_text || '');
  }

  function onPlayPassage() {
    if (!_state || !_state.currentItem) return;
    playText(_state.currentItem.passage_audio_key, _state.currentItem.passage_text || '');
  }

  function onPlayQuestion() {
    if (!_state || !_state.currentItem) return;
    // force — במצב read מותרת הקראת השאלה בלבד, ורק בלחיצה מפורשת (הנגשה).
    playText(_state.currentItem.question_audio_key, _state.currentItem.question_text || '', true);
  }

  // --------------------------------------------------------------------------
  // Answer handling
  // --------------------------------------------------------------------------
  async function onAnswer(optionIdx) {
    if (!_state || _state.answered || !_state.currentItem) return;
    _state.answered = true;

    const item = _state.currentItem;
    const chosen = (item.options || [])[optionIdx];
    const isCorrect = !!(chosen && chosen.correct);
    const elapsedMs = Date.now() - (_state.currentItemStartedAt || Date.now());

    // BKT event via adapter
    if (window.AvneiOralSkillAdapter && typeof window.AvneiOralSkillAdapter.recordAttempt === 'function') {
      try {
        window.AvneiOralSkillAdapter.recordAttempt(_state.studentId, {
          item_id: item.item_id,
          q_id: item.q_id,
          skill: item.skill,
          level: item.level,
          is_correct: isCorrect,
          response_time_ms: elapsedMs,
          session_id: _state.sessionId,
        });
      } catch (e) { console.warn('mechanic-listen-mcq: recordAttempt failed', e); }
    }

    // ADAPT-8 — דיווח EPA פר-מסיח (מקביל ל-recordAttempt). חוזה זהה ל-mcq:
    // טעות → failure_type/letter_position/task_type מתוך chosen.epa. נכון → ללא EPA.
    // ⚠️ EPA נרשם רק אם לפריט יש target_letter (G4 פתוח להבנה ללא אות-יעד).
    if (window.AvneiEventLogger) {
      const epa = (!isCorrect && chosen && chosen.epa) ? chosen.epa : null;
      try {
        window.AvneiEventLogger.logActivityResult({
          activity_type: 'mcq',
          activity_variant: 'read_comprehension_pick',
          item_id: item.q_id || item.item_id || null,
          target_letter: item.target_letter || null,
          is_correct: isCorrect,
          failure_type:    epa ? (epa.what || null)  : null,
          letter_position: epa ? (epa.where || null) : null,
          task_type:       epa ? (epa.task || null)  : null,
          primary_island_id:    (typeof item.primary_island_id === 'number') ? item.primary_island_id
                                  : (typeof _state.primaryIslandId === 'number' ? _state.primaryIslandId : undefined),
          secondary_island_ids: Array.isArray(item.secondary_island_ids) ? item.secondary_island_ids : undefined,
          rama_task_alignment:  (typeof item.rama_task_alignment === 'number') ? item.rama_task_alignment : undefined,
          peima_target:         (typeof item.peima_target === 'number') ? item.peima_target : undefined,
          supportLevel: 1,
          attempts: 1,
          response_time_ms: isCorrect ? elapsedMs : null,
        });
      } catch (e) {}
    }

    _state.results.push({
      item_id: item.item_id,
      q_id: item.q_id,
      skill: item.skill,
      is_correct: isCorrect,
      response_time_ms: elapsedMs,
    });

    // Visual feedback
    const optionsEl = document.getElementById('mlmcqOptions');
    const feedbackEl = document.getElementById('mlmcqFeedback');
    if (optionsEl) {
      Array.from(optionsEl.children).forEach((btn, idx) => {
        btn.disabled = true;
        btn.setAttribute('aria-checked', idx === optionIdx ? 'true' : 'false');
        const opt = (item.options || [])[idx];
        if (opt && opt.correct) btn.classList.add('mlmcq-option--correct');
        if (idx === optionIdx && !isCorrect) btn.classList.add('mlmcq-option--wrong');
      });
    }
    if (feedbackEl) {
      feedbackEl.textContent = isCorrect ? 'יופי!' : 'התשובה הנכונה מודגשת. ננסה את הבאה.';
      feedbackEl.className = 'mlmcq-feedback ' + (isCorrect ? 'mlmcq-feedback--ok' : 'mlmcq-feedback--miss');
    }

    if (typeof _state.onProgress === 'function') {
      try { _state.onProgress({ idx: _state.idx, total: _state.items.length, isCorrect }); } catch (e) {}
    }

    setTimeout(advance, FEEDBACK_DELAY_MS);
  }

  // --------------------------------------------------------------------------
  // Advance / Complete
  // --------------------------------------------------------------------------
  function advance() {
    if (!_state) return;
    _state.idx++;
    if (_state.idx >= _state.items.length) {
      complete();
      return;
    }
    renderItem();
    presentCurrent();
  }

  function complete() {
    if (!_state) return;
    stopAudio();
    const correctCount = _state.results.filter(r => r.is_correct).length;
    const total = _state.results.length;
    const accuracy = total > 0 ? correctCount / total : 0;
    const payload = {
      studentId: _state.studentId,
      level: _state.level,
      total,
      correct: correctCount,
      accuracy,
      results: _state.results,
      session_id: _state.sessionId,
    };
    if (typeof _state.onComplete === 'function') {
      try { _state.onComplete(payload); } catch (e) {}
    }
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------
  function init(opts) {
    if (!opts || !opts.mountRoot) {
      console.warn('mechanic-listen-mcq: init requires {mountRoot, studentId, level}');
      return;
    }
    _state = {
      studentId: opts.studentId || 'local',
      level: opts.level || 1,
      // ADAPT-8 — מצב 'read' (הבנת הנקרא): מציג passage כטקסט מנוקד, בלי הקראה אוטומטית.
      readMode: opts.mode === 'read' || opts.readMode === true,
      primaryIslandId: (typeof opts.primary_island_id === 'number') ? opts.primary_island_id : null,
      batchSize: opts.batchSize || 5,
      onComplete: opts.onComplete || null,
      onProgress: opts.onProgress || null,
      mountRoot: opts.mountRoot,
      items: Array.isArray(opts.items) ? opts.items : null, // אם הוזרק במפורש (לטסטים)
      idx: 0,
      currentItem: null,
      currentItemStartedAt: null,
      answered: false,
      results: [],
      sessionId: 'isle14-listen-' + Date.now(),
    };
    buildDOM(_state.mountRoot);

    const playP = document.getElementById('mlmcqPlayPassage');
    const playQ = document.getElementById('mlmcqPlayQuestion');
    if (playP) playP.addEventListener('click', onPlayPassage);
    if (playQ) playQ.addEventListener('click', onPlayQuestion);
  }

  function start() {
    if (!_state) { console.warn('mechanic-listen-mcq: call init first'); return; }
    // אם items הוזרק → דלג על fetch.
    const loader = _state.items
      ? Promise.resolve(_state.items)
      : (window.AvneiOralSkillAdapter
          ? window.AvneiOralSkillAdapter.getRandomBatch(_state.level, _state.batchSize)
          : Promise.reject(new Error('AvneiOralSkillAdapter not loaded')));
    loader
      .then(items => {
        if (!Array.isArray(items) || items.length === 0) {
          throw new Error('no items for level ' + _state.level);
        }
        _state.items = items;
        renderItem();
        return presentCurrent();
      })
      .catch(err => {
        console.error('mechanic-listen-mcq start failed:', err);
        const root = _state && _state.mountRoot;
        if (root) {
          root.innerHTML = '<div class="mlmcq-error" lang="he">אופס, לא הצלחנו לטעון סיפורים. נסי שוב מאוחר יותר.</div>';
        }
      });
  }

  function stop() {
    stopAudio();
    _state = null;
  }

  const API = {
    init,
    start,
    stop,
    _shuffleOptions: shuffleOptions,
    _speakHebrew: speakHebrew,
    SPEECH_RATE,
    FEEDBACK_DELAY_MS,
  };

  if (typeof window !== 'undefined') window.AvneiMechanicListenMCQ = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
