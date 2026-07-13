// ============================================================================
// templates/mechanic-star-journey.js — משחקון-סיכום "מְסַע הַכּוֹכָב-יָם" (POC)
// 13.7.2026 · cumulative review לסוף פרק — רה-סקין של מכניקת "שרשרת הפנינים".
//
// ⚠️ מודל-מדידה = זהה ל-mechanic-cv-summary (נעול פדגוגית ע"י מיטל 3.7):
//   • הסט נגזר מ-per_cv של החמישייה (buildSummarySet)
//   • לוח סבבים משוקלל-לחלשים + interleaving + ערבוב listen/read (buildTrialSchedule)
//   • two-tap במצב read · phoneme-group-accept · "האם החמישייה יושבת?" (evaluateSummary)
//   הקובץ הזה מייבא את הלוגיקה מ-AvneiMechanics['cv-summary']._logic — מקור-אמת יחיד.
//   ⇒ תיקון לרעיון של GPT: לא "צליל-פתיחה של אות אחת", אלא הצירופים שנלמדו.
//
// ההבדל היחיד מ-cv-summary = הצגה: במקום פנינה-בשרשרת → כוכב-ים נדלק במסלול
// לעבר "רֶשֶׁת הָאוֹצָר", ונוני מתקדם צעד. כל בחירה נכונה = אבן-כוכב במסלול.
//
// חשיפה לבדיקות: window.AvneiMechanics['star-journey']._logic (מוצבע ל-cv-summary).
// ============================================================================

(function () {
  'use strict';

  function getVA() {
    if (typeof window !== 'undefined' && window.AvneiVowelAdapter) return window.AvneiVowelAdapter;
    if (typeof global !== 'undefined' && global.AvneiVowelAdapter) return global.AvneiVowelAdapter;
    return null;
  }
  // מקור-האמת: הלוגיקה הנעולה של שרשרת-הפנינים.
  function getLogic() {
    var M = (typeof window !== 'undefined' && window.AvneiMechanics) ? window.AvneiMechanics : null;
    return (M && M['cv-summary'] && M['cv-summary']._logic) ? M['cv-summary']._logic : null;
  }

  var FALLBACK_GROUP = 'a';

  function canonicalVowelForGroup(VA, group) {
    if (!VA || typeof VA.getVowelsInGroup !== 'function') return null;
    var vs = VA.getVowelsInGroup(group);
    return (vs && vs.length) ? vs[0].id : null;
  }
  function playKey(key) {
    if (typeof window !== 'undefined' && window.AvneiAudio &&
        typeof window.AvneiAudio.play === 'function' && key) {
      window.AvneiAudio.play(key);
    }
  }
  function shuffle(arr, rand) {
    var r = (typeof rand === 'function') ? rand : Math.random;
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  // מסיחים: צירופים אחרים מהסט, מעדיף קבוצת-צליל שונה (אחרת שני כוכבים נשמעים זהה).
  function pickDistractors(set, target, count, rand) {
    var others = set.filter(function (it) { return it.key !== target.key && it.group !== target.group; });
    var pool = others.length >= count ? others : set.filter(function (it) { return it.key !== target.key; });
    return shuffle(pool, rand).slice(0, count);
  }

  // כוכב-ים SVG (אבן-מסלול). state: '' | 'lit'
  function starSVG() {
    return '<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">' +
      '<path class="star-path" d="M50 6 L61 38 L95 38 L67 58 L78 92 L50 71 L22 92 L33 58 L5 38 L39 38 Z" ' +
      'stroke-linejoin="round" stroke-width="4"/></svg>';
  }

  // --------------------------------------------------------------------------
  // mount — opts: { letters, studentId, numTrials, onStar, onComplete }
  // --------------------------------------------------------------------------
  function mount(root, opts) {
    var options = opts || {};
    var VA = getVA();
    var LOGIC = getLogic();
    if (!VA || !LOGIC) {
      console.error('[star-journey] חסר VowelAdapter או cv-summary._logic (טען קודם את mechanic-cv-summary.js)');
      return { unmount: function () {} };
    }
    var sid = options.studentId || 'local';
    var letters = (Array.isArray(options.letters) && options.letters.length)
      ? options.letters : ['ת', 'מ', 'ר', 'ב', 'ק'];

    var set = LOGIC.buildSummarySet(sid, letters);
    var numTrials = (options.numTrials && options.numTrials > 0)
      ? options.numTrials : Math.max(6, Math.min(12, set.length * 2));
    var schedule = LOGIC.buildTrialSchedule(set, numTrials);

    // --- DOM scaffold ---
    root.innerHTML = '';
    root.classList.add('star-journey');

    // מסלול הכוכבים: N אבני-כוכב + נוני שמתקדם + רשת האוצר בקצה.
    var trail = document.createElement('div');
    trail.className = 'sj-trail';
    trail.setAttribute('aria-label', 'מסלול הכוכבים לרשת האוצר');
    var trailInner = '<div class="sj-trail-track">';
    for (var i = 0; i < numTrials; i++) {
      trailInner += '<span class="sj-step" data-idx="' + i + '">' + starSVG() + '</span>';
      if (i < numTrials - 1) trailInner += '<span class="sj-link" data-link="' + i + '"></span>';
    }
    trailInner += '<span class="sj-net" aria-label="רשת האוצר">🪺</span></div>';
    trail.innerHTML = trailInner;
    root.appendChild(trail);

    var prompt = document.createElement('div');
    prompt.className = 'sj-prompt';
    prompt.innerHTML =
      '<button class="sj-target" id="sjTarget" type="button" aria-label="הקישו לשמוע"></button>' +
      '<div class="sj-hint" id="sjHint"></div>';
    root.appendChild(prompt);

    var board = document.createElement('div');
    board.className = 'sj-board';
    board.id = 'sjBoard';
    root.appendChild(board);

    var state = { trial: 0, locked: false, correctCount: 0 };

    function currentTrial() { return schedule[state.trial]; }
    function targetCV(tr) {
      var vid = canonicalVowelForGroup(VA, tr.group);
      return { cv: VA.buildCV(tr.letter, vid), audioKey: VA.cvAudioKey(tr.letter, vid), vid: vid };
    }
    function isCorrectChoice(chosen, tr) {
      // phoneme-group-accept — זהה ל-cv-summary.
      return chosen.letter === tr.letter && chosen.group === tr.group;
    }

    function renderTrial() {
      var tr = currentTrial();
      if (!tr) return;
      state.locked = false;
      var t = targetCV(tr);
      var targetEl = document.getElementById('sjTarget');
      var hintEl = document.getElementById('sjHint');
      board.innerHTML = '';

      var distractors = pickDistractors(set, tr, 3);
      var optionItems = shuffle([tr].concat(distractors));

      if (tr.mode === 'listen') {
        // זיהוי: 🔊 → געו בכוכב עם הצירוף הנכון.
        targetEl.className = 'sj-target audio-only';
        targetEl.innerHTML = '<span class="sj-audio-icon">🔊</span>';
        hintEl.textContent = 'הַקְשִׁיבוּ — וְגַעוּ בַּכּוֹכָב שֶׁל הַצֵּרוּף';
        optionItems.forEach(function (it) {
          var vid = canonicalVowelForGroup(VA, it.group);
          var cv = VA.buildCV(it.letter, vid);
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'sj-star sj-star--cv';
          btn.innerHTML = starSVG() + '<span class="sj-star-label">' + cv + '</span>';
          btn.setAttribute('aria-label', 'כוכב ' + cv);
          if (isCorrectChoice(it, tr)) btn.dataset.correct = '1';  // hook לבדיקות/E2E
          btn.addEventListener('click', function () { onChoose(it, btn); });
          board.appendChild(btn);
        });
        setTimeout(function () { playKey(t.audioKey); }, 350);
      } else {
        // קריאה: מציג צירוף → בוחרים את הצליל (כוכב-רמקול), two-tap.
        targetEl.className = 'sj-target glyph';
        targetEl.innerHTML = t.cv;
        hintEl.textContent = 'גַּעוּ בַּכּוֹכָבִים לִשְׁמֹעַ — וְגַעוּ שׁוּב לִבְחֹר';
        optionItems.forEach(function (it) {
          var vid = canonicalVowelForGroup(VA, it.group);
          var audioKey = VA.cvAudioKey(it.letter, vid);
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'sj-star sj-star--sound';
          btn.innerHTML = starSVG() + '<span class="sj-star-label"><span class="sj-audio-icon">🔊</span></span>';
          btn.setAttribute('aria-label', 'כוכב-צליל — געו לשמוע, געו שוב לבחור');
          if (isCorrectChoice(it, tr)) btn.dataset.correct = '1';  // hook לבדיקות/E2E
          btn.addEventListener('click', function () {
            if (state.locked) return;
            playKey(audioKey);            // תמיד משמיע (האזנה + בחירה)
            if (btn.classList.contains('previewed')) {
              onChoose(it, btn);          // נגיעה שנייה — בחירה
            } else {
              board.querySelectorAll('.sj-star').forEach(function (b) { b.classList.remove('previewed'); });
              btn.classList.add('previewed');
            }
          });
          board.appendChild(btn);
        });
      }
    }

    function logTrial(tr, correct) {
      if (typeof window === 'undefined' || !window.AvneiEventLogger ||
          typeof window.AvneiEventLogger.logActivityResult !== 'function') return;
      try {
        window.AvneiEventLogger.logActivityResult({
          activity_type: 'star-journey',
          mode: tr.mode,
          target_letter: tr.letter,
          target_phoneme_group: tr.group,
          target_cv: targetCV(tr).cv,
          item_id: 'star-trial-' + (state.trial + 1),
          is_correct: correct,
          response_time_ms: null,
          primary_island_id: 4,
          secondary_island_ids: [3],
        });
      } catch (e) {}
    }

    function onChoose(chosen, btn) {
      if (state.locked) return;
      var tr = currentTrial();
      var correct = isCorrectChoice(chosen, tr);
      logTrial(tr, correct);

      if (!correct) {
        btn.classList.add('wrong');
        setTimeout(function () { btn.classList.remove('wrong'); }, 500);
        board.querySelectorAll('.sj-star.previewed').forEach(function (b) { b.classList.remove('previewed'); });
        if (tr.mode === 'listen') setTimeout(function () { playKey(targetCV(tr).audioKey); }, 400);
        return;
      }

      // נכון — כוכב במסלול נדלק, החוליה מתמלאת, נוני מתקדם.
      state.locked = true;
      btn.classList.add('correct');
      var step = trail.querySelector('.sj-step[data-idx="' + state.trial + '"]');
      if (step) step.classList.add('lit', 'just-lit');
      var link = trail.querySelector('.sj-link[data-link="' + (state.trial - 1) + '"]');
      if (link) link.classList.add('lit');
      advanceNoni(state.trial);
      state.correctCount++;
      if (typeof options.onStar === 'function') options.onStar(state.trial, state.correctCount);

      state.trial++;
      if (state.trial >= schedule.length) {
        var netEl = trail.querySelector('.sj-net');
        if (netEl) netEl.classList.add('full');
        setTimeout(function () {
          var result = LOGIC.evaluateSummary(sid, letters);
          if (typeof options.onComplete === 'function') options.onComplete(result);
        }, 950);
        return;
      }
      setTimeout(function () {
        var s = trail.querySelector('.sj-step.just-lit');
        if (s) s.classList.remove('just-lit');
        renderTrial();
      }, 950);
    }

    // נוני-סמן שקופץ מכוכב לכוכב (מיקום יחסי לאורך המסלול).
    function advanceNoni(idx) {
      var marker = trail.querySelector('.sj-noni');
      if (!marker) {
        marker = document.createElement('span');
        marker.className = 'sj-noni';
        marker.textContent = '🐙';
        trail.querySelector('.sj-trail-track').appendChild(marker);
      }
      var stepEl = trail.querySelector('.sj-step[data-idx="' + idx + '"]');
      if (stepEl) {
        var trackRect = trail.querySelector('.sj-trail-track').getBoundingClientRect();
        var stepRect = stepEl.getBoundingClientRect();
        var x = stepRect.left - trackRect.left + stepRect.width / 2;
        marker.style.insetInlineStart = x + 'px';
        marker.classList.add('hop');
        setTimeout(function () { marker.classList.remove('hop'); }, 500);
      }
    }

    renderTrial();
    return {
      unmount: function () { root.innerHTML = ''; root.classList.remove('star-journey'); },
    };
  }

  if (typeof window !== 'undefined') {
    window.AvneiMechanics = window.AvneiMechanics || {};
    // _logic מוצבע ללוגיקה הנעולה — לבדיקות שיתייחסו לאותו מקור-אמת.
    window.AvneiMechanics['star-journey'] = {
      mount: mount,
      get _logic() { return getLogic(); },
    };
  }
})();
