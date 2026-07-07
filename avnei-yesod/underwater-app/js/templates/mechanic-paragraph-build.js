// ============================================================================
// templates/mechanic-paragraph-build.js — "שַׁרְשֶׁרֶת הָאַלְמוֹגִים" (אי 16)
// לוח בניית האיים · N16 · 7.7.2026
//
// תפקיד: הילד.ה קורא.ת 3 משפטים קצרים מְנֻקָּדִים (בְּעַצְמֵנוּ — אֵין הַקְרָאָה)
//        וּמְסַדֵּר.ת אוֹתָם לְפִי הַסֵּדֶר הַהֶגְיוֹנִי → פִּסְקָה. tap-to-place:
//        לחיצה על משפט → נכנס למקום הבא בשרשרת.
//
// 🔴 ההיפוך מול mechanic-story-sequence (אי 14): שם ילדה *מקשיבה* לסיפור
//    ואז מסדרת; כאן המשפטים כתובים והילד.ה *קורא.ת* אותם לבד — אֵין אוֹדִיוֹ
//    לַסִּפּוּר עַצְמוֹ (זו כל הפואנטה). לכן זהו קובץ עצמאי (אח של story-sequence)
//    ולא config — כדי לא לגעת במנוע אי 14 החי, ולתעד ל-primary_island_id=16
//    ישירות דרך event-logger (ולא דרך oral-skill-adapter המקושח לאי 14).
//
// קלט (init opts):
//   studentId · items · mountRoot · primary_island_id · onProgress · onComplete
//   items = [{ item_id, characteristic_id, title, sentences:[s1,s2,s3] }]
//           (sentences בַּסֵּדֶר הַנָּכוֹן; המכניקה מערבבת אותם לתצוגה)
//
// חוקי מדידה (checklist §7-§8):
//   primary_island_id=16 מפורש בכל result (resolveIslandId מכבד אותו → BKT אי 16).
//   characteristic_id פר-סט (EPA G4). is_correct + failure_type על טעות.
//   האינטראקציה = סידור-משפטים (לא אפשרויות-שמע) → אין two-tap.
//   פידבק ויזואלי בלבד אחרי בדיקה — אין השמעת-שבח חוזרת.
//
// API (window.AvneiMechanicParagraphBuild):
//   init(opts) · start() · stop() · _shuffle(arr)
// ============================================================================

(function () {
  'use strict';

  var FEEDBACK_DELAY_MS = 1600;
  var PRIMARY_ISLAND_DEFAULT = 16;
  var STRAND_READING = 4;

  var _state = null;

  // --------------------------------------------------------------------------
  // Utils
  // --------------------------------------------------------------------------
  function shuffle(arr) {
    var out = arr.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = out[i]; out[i] = out[j]; out[j] = t;
    }
    // הגנה: אם יצא בדיוק הסדר המקורי — סובב פעם אחת (מבטיח ערבוב אמיתי)
    if (out.length > 1 && arr.every(function (v, k) { return v === out[k]; })) {
      out.push(out.shift());
    }
    return out;
  }

  // --------------------------------------------------------------------------
  // DOM
  // --------------------------------------------------------------------------
  function buildDOM(root) {
    root.innerHTML = '';
    root.classList.add('mechanic-paragraph-build');
    var wrap = document.createElement('div');
    wrap.className = 'mpb-wrap';
    wrap.innerHTML =
      '<div class="mpb-progress" id="mpbProgress" aria-live="polite"></div>' +
      '<section class="mpb-order-card">' +
        '<h2 class="mpb-instruction" id="mpbInstruction">' +
          'קִרְאוּ אֶת הַמִּשְׁפָּטִים, וְסַדְּרוּ אוֹתָם לְפִי הַסֵּדֶר הַהֶגְיוֹנִי.' +
        '</h2>' +
        '<h3 class="mpb-section-title">הַשַּׁרְשֶׁרֶת שֶׁלָּכֶם:</h3>' +
        '<ol class="mpb-answer-slots" id="mpbAnswerSlots" aria-label="הסדר שבחרתם"></ol>' +
        '<h3 class="mpb-section-title">לִחֲצוּ עַל הַמִּשְׁפָּטִים בַּסֵּדֶר הַנָּכוֹן:</h3>' +
        '<div class="mpb-choices" id="mpbChoices"></div>' +
        '<div class="mpb-feedback" id="mpbFeedback" aria-live="polite"></div>' +
        '<div class="mpb-actions">' +
          '<button class="mpb-btn mpb-btn--ghost" id="mpbResetBtn" type="button">לְאַפֵּס</button>' +
          '<button class="mpb-btn" id="mpbCheckBtn" type="button" disabled>לִבְדֹּק</button>' +
        '</div>' +
      '</section>';
    root.appendChild(wrap);
  }

  function renderProgress() {
    var el = document.getElementById('mpbProgress');
    if (!el || !_state) return;
    el.textContent = (_state.idx + 1) + ' / ' + _state.items.length;
  }

  // --------------------------------------------------------------------------
  // Item lifecycle
  // --------------------------------------------------------------------------
  function loadItem() {
    if (!_state) return false;
    if (_state.idx >= _state.items.length) return false;
    var it = _state.items[_state.idx];
    var sentences = (it.sentences || []).map(function (s) { return String(s).trim(); })
                                        .filter(function (s) { return s.length > 0; });
    _state.currentSentences = sentences;                 // הסדר הנכון
    _state.currentShuffled = shuffle(sentences);
    _state.currentItem = it;
    _state.currentAnswer = [];
    _state.currentItemStartedAt = Date.now();
    _state.answered = false;
    return sentences.length > 0;
  }

  function renderItem() {
    var slotsEl = document.getElementById('mpbAnswerSlots');
    var choicesEl = document.getElementById('mpbChoices');
    var feedbackEl = document.getElementById('mpbFeedback');
    var checkBtn = document.getElementById('mpbCheckBtn');
    if (!slotsEl || !choicesEl) return;

    slotsEl.innerHTML = '';
    _state.currentSentences.forEach(function (_, i) {
      var li = document.createElement('li');
      li.className = 'mpb-slot mpb-slot--empty';
      li.dataset.slotIdx = String(i);
      li.textContent = '—';
      slotsEl.appendChild(li);
    });

    choicesEl.innerHTML = '';
    _state.currentShuffled.forEach(function (sentence, idx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mpb-choice';
      btn.dataset.sentence = sentence;
      btn.dataset.choiceIdx = String(idx);
      btn.lang = 'he';
      btn.textContent = sentence;
      btn.addEventListener('click', function () { onChoiceClick(btn, sentence); });
      choicesEl.appendChild(btn);
    });

    if (feedbackEl) { feedbackEl.textContent = ''; feedbackEl.className = 'mpb-feedback'; }
    if (checkBtn) { checkBtn.disabled = true; }
    renderProgress();
  }

  function onChoiceClick(btn, sentence) {
    if (!_state || _state.answered || btn.disabled) return;
    var nextIdx = _state.currentAnswer.length;
    if (nextIdx >= _state.currentSentences.length) return;

    _state.currentAnswer.push(sentence);
    btn.disabled = true;
    btn.classList.add('mpb-choice--used');

    var slot = document.querySelector('.mpb-slot[data-slot-idx="' + nextIdx + '"]');
    if (slot) {
      slot.textContent = sentence;
      slot.classList.remove('mpb-slot--empty');
      slot.classList.add('mpb-slot--filled');
    }

    var checkBtn = document.getElementById('mpbCheckBtn');
    if (checkBtn) {
      checkBtn.disabled = (_state.currentAnswer.length !== _state.currentSentences.length);
    }
  }

  function onResetClick() {
    if (!_state || _state.answered) return;
    _state.currentAnswer = [];
    document.querySelectorAll('.mpb-choice').forEach(function (btn) {
      btn.disabled = false;
      btn.classList.remove('mpb-choice--used');
    });
    document.querySelectorAll('.mpb-slot').forEach(function (slot) {
      slot.textContent = '—';
      slot.classList.remove('mpb-slot--filled');
      slot.classList.add('mpb-slot--empty');
    });
    var feedbackEl = document.getElementById('mpbFeedback');
    if (feedbackEl) { feedbackEl.textContent = ''; feedbackEl.className = 'mpb-feedback'; }
    var checkBtn = document.getElementById('mpbCheckBtn');
    if (checkBtn) checkBtn.disabled = true;
  }

  // תיעוד — ישירות דרך event-logger עם primary_island_id מפורש (checklist §8).
  function logResult(it, isCorrect, elapsedMs) {
    if (typeof window === 'undefined' || !window.AvneiEventLogger) return;
    try {
      window.AvneiEventLogger.logActivityResult({
        activity_type: 'paragraph-build',
        activity_variant: 'sentence-order',
        item_id: it.item_id || null,
        characteristic_id: it.characteristic_id || null,
        primary_island_id: _state.primaryIsland,
        strand_id: STRAND_READING,
        is_correct: isCorrect,
        response_time_ms: elapsedMs,
        // EPA (רק על טעות): הבנת-רצף → Comprehension, משימת-סידור.
        failure_type: isCorrect ? null : 'Comprehension',
        task_type: isCorrect ? null : 'sequence',
      });
    } catch (e) { console.warn('mechanic-paragraph-build: log failed', e); }
  }

  function onCheckClick() {
    if (!_state || _state.answered) return;
    if (_state.currentAnswer.length !== _state.currentSentences.length) return;
    _state.answered = true;

    var expected = _state.currentSentences;
    var actual = _state.currentAnswer;
    var isCorrect = expected.every(function (s, i) { return s === actual[i]; });
    var elapsedMs = Date.now() - (_state.currentItemStartedAt || Date.now());

    logResult(_state.currentItem, isCorrect, elapsedMs);
    _state.results.push({ item_id: _state.currentItem.item_id, is_correct: isCorrect, response_time_ms: elapsedMs });

    // פידבק ויזואלי בלבד (checklist §5) — אין אודיו.
    document.querySelectorAll('.mpb-slot').forEach(function (slot, i) {
      slot.classList.remove('mpb-slot--empty', 'mpb-slot--filled');
      slot.classList.add(actual[i] === expected[i] ? 'mpb-slot--correct' : 'mpb-slot--wrong');
    });

    var feedbackEl = document.getElementById('mpbFeedback');
    if (feedbackEl) {
      feedbackEl.textContent = isCorrect
        ? 'מְצֻיָּן! בְּדִיּוּק הַסֵּדֶר הַנָּכוֹן.'
        : 'כִּמְעַט! הַסֵּדֶר הַנָּכוֹן: ' + expected.join(' ');
      feedbackEl.className = 'mpb-feedback ' + (isCorrect ? 'mpb-feedback--ok' : 'mpb-feedback--miss');
    }

    if (typeof _state.onProgress === 'function') {
      try { _state.onProgress({ idx: _state.idx, total: _state.items.length, isCorrect: isCorrect }); } catch (e) {}
    }

    setTimeout(advance, FEEDBACK_DELAY_MS + (isCorrect ? 300 : 900));
  }

  function advance() {
    if (!_state) return;
    _state.idx++;
    if (loadItem()) {
      renderItem();
    } else {
      complete();
    }
  }

  function complete() {
    if (!_state) return;
    var correct = _state.results.filter(function (r) { return r.is_correct; }).length;
    var payload = {
      studentId: _state.studentId,
      total: _state.results.length,
      correct: correct,
      accuracy: _state.results.length > 0 ? correct / _state.results.length : 0,
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
      primaryIsland: (typeof opts.primary_island_id === 'number') ? opts.primary_island_id : PRIMARY_ISLAND_DEFAULT,
      onComplete: opts.onComplete || null,
      onProgress: opts.onProgress || null,
      mountRoot: opts.mountRoot,
      items: Array.isArray(opts.items) ? opts.items.slice() : [],
      idx: 0,
      results: [],
    };
    buildDOM(_state.mountRoot);
    var resetBtn = document.getElementById('mpbResetBtn');
    var checkBtn = document.getElementById('mpbCheckBtn');
    if (resetBtn) resetBtn.addEventListener('click', onResetClick);
    if (checkBtn) checkBtn.addEventListener('click', onCheckClick);
  }

  function start() {
    if (!_state) return;
    if (!_state.items.length) {
      if (_state.mountRoot) {
        _state.mountRoot.innerHTML =
          '<div class="mpb-error" lang="he">אוֹפְּס, אֵין כָּרֶגַע פִּסְקָאוֹת לְסַדֵּר. נַסּוּ שׁוּב מְאֻחָר יוֹתֵר.</div>';
      }
      return;
    }
    if (!loadItem()) { complete(); return; }
    renderItem();
  }

  function stop() { _state = null; }

  var API = { init: init, start: start, stop: stop, _shuffle: shuffle };
  if (typeof window !== 'undefined') window.AvneiMechanicParagraphBuild = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
