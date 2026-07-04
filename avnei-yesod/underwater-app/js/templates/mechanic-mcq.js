// ============================================================================
// templates/mechanic-mcq.js — ליבת "בחר 1 מ-N" מונחית-config + דיווח EPA פר-מסיח
// minigame-fit T1 · 30.6.2026 · נכתב לפי _handoff/2026-06-29-minigame-fit-report.md §5 NEW-CORE
//
// מנוע מדידה אחד שמכסה 5 אינטראקציות (607 שאלות / 71%) שנבדלות זו מזו רק
// ב-stem.mode וב-option.mode:
//   audio_to_written · listen_first_sound  → stem=audio,  options=text   (grid)
//   written_to_audio                       → stem=text,   options=audio  (grid)
//   true_false_image                       → stem=image,  options=text 2 (grid)
//   fill_missing                           → stem=fill,   options=text   (grid)
//
// 🔴 הלינצ'פין — בכל לחיצה שגויה מדווח את ה-EPA הספציפי של המסיח שנלחץ
//   (failure_type / task_type / letter_position) דרך AvneiEventLogger →
//   epa.js deriveFailure/deriveContext/deriveTask. לחיצה נכונה → is_correct:true בלי EPA.
//   ✅ G4 סגור (30.6.2026) — epa.js ממפתח פר unitKey: target_letter כשיש, אחרת
//   characteristic_id. לשאלות-אות/CV להעביר opts.target_letter; למורפולוגיה/הבנה
//   להעביר opts.characteristic_id (הבנק נושא אותו פר שאלה). הטעות נשמרת בשני המקרים.
//
// חוזה config (נגזר משדות השאלה ב-questions-grade1.json):
//   mount(root, {
//     stem:    { mode:'audio'|'text'|'image'|'fill',
//                text_he, audio_key, image_src, image_alt,
//                fill:{before, after},            // mode='fill' — מילה עם חריץ
//                passage_he, passage_audio_key }, // layout='passage'
//     options: [ { label_he, mode:'text'|'audio'|'image',
//                  letter, vowelId,               // חלופה ל-label_he: בניית CV עם דגש
//                  audio_key, image_src, image_alt,
//                  is_correct:bool, epa:{what,where,task}|null } ],   // 2–3
//     layout:  'grid'|'passage',
//     interaction,                                // activity_variant (למשל 'audio_to_written')
//     questId, item_id, target_letter,
//     primary_island_id, secondary_island_ids, rama_task_alignment, peima_target,
//     theme,                                      // skin: shells/fish/bubbles/...
//     promptLine,                                 // טקסט בועת-נוני (אופציונלי)
//     onUnitWon, onComplete
//   })
//
// מטפל בפריט אחד פר mount (paradigm פריט-קבוע); ה-host מרצף פריטים דרך onComplete.
// ============================================================================

(function () {
  'use strict';

  var INTER_ITEM_DELAY_MS = 1100;
  var SWAY_MS = 700;

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function VA() { return (typeof window !== 'undefined') ? window.AvneiVowelAdapter : null; }

  // טקסט תווית האופציה — מעדיף label_he; אחרת בונה CV עם דגש קל (ב/כ/פ) דרך vowel-adapter.
  function optionLabel(opt) {
    if (opt.label_he != null && opt.label_he !== '') return opt.label_he;
    if (opt.letter && opt.vowelId) {
      var va = VA();
      if (va && typeof va.buildCV === 'function') {
        var cv = va.buildCV(opt.letter, opt.vowelId);
        if (cv) return cv;
      }
      return opt.letter;
    }
    return '';
  }

  function noni(state) {
    if (typeof window !== 'undefined' && window.AvneiNoni) {
      try { window.AvneiNoni.setState(state); } catch (e) {}
    }
  }

  function playKey(key) {
    if (key && typeof window !== 'undefined' && window.AvneiAudio) {
      try { return window.AvneiAudio.play(key); } catch (e) {}
    }
    return null;
  }

  // ----------------------------------------------------------------------------
  // 🔴 בונה את ה-payload ל-logActivityResult — פונקציה טהורה, חשופה לבדיקות
  //    (test-mechanic-mcq.js מאמת את המיפוי epa{what,where,task} → השדות שהמנוע קורא).
  // ----------------------------------------------------------------------------
  function buildLogPayload(opts, chosen, ctx) {
    var isCorrect = !!(chosen && chosen.is_correct);
    var epa = (!isCorrect && chosen && chosen.epa) ? chosen.epa : null;
    return {
      activity_type:        'mcq',
      activity_variant:     opts.interaction || (opts.stem && opts.stem.mode) || null,
      item_id:              opts.item_id || opts.questId || null,
      target_letter:        opts.target_letter || null,
      // G4 (30.6.2026) — מפתח-יחידה למורפולוגיה/הבנה (בלי אות-יעד). הבנק נושא
      // characteristic_id פר שאלה; epa.js ממפתח תחתיו כש-target_letter ריק.
      characteristic_id:    opts.characteristic_id || null,
      is_correct:           isCorrect,
      // חוזה ה-EPA — רק על טעות, מתוך ה-epa של המסיח שנלחץ:
      failure_type:         epa ? (epa.what || null)  : null,   // → evt.failure_type → deriveFailure
      letter_position:      epa ? (epa.where || null) : null,   // → evt.letter_position → deriveContext
      task_type:            epa ? (epa.task || null)  : null,   // → evt.task_type → deriveTask
      primary_island_id:    (typeof opts.primary_island_id === 'number') ? opts.primary_island_id : undefined,
      secondary_island_ids: Array.isArray(opts.secondary_island_ids) ? opts.secondary_island_ids : undefined,
      rama_task_alignment:  (typeof opts.rama_task_alignment === 'number') ? opts.rama_task_alignment : undefined,
      peima_target:         (typeof opts.peima_target === 'number') ? opts.peima_target : undefined,
      supportLevel:         1,
      attempts:             (ctx && typeof ctx.attempts === 'number') ? ctx.attempts : 1,
      response_time_ms:     isCorrect ? ((ctx && ctx.response_time_ms) || null) : null,
      hint_used:            !!(ctx && ctx.hint_used),
    };
  }

  function logResult(opts, chosen, ctx) {
    if (typeof window === 'undefined' || !window.AvneiEventLogger) return null;
    try {
      return window.AvneiEventLogger.logActivityResult(buildLogPayload(opts, chosen, ctx));
    } catch (e) { return null; }
  }

  // ----------------------------------------------------------------------------
  // רינדור ה-stem לפי mode
  // ----------------------------------------------------------------------------
  function renderStem(stem, playStem) {
    var wrap = document.createElement('div');
    wrap.className = 'mcq-stem mcq-stem--' + (stem.mode || 'text');

    if (stem.mode === 'audio') {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mcq-audio-btn mcq-stem-audio';
      btn.setAttribute('aria-label', 'הַקְשִׁיבוּ שׁוּב');
      btn.innerHTML = '<span class="mcq-spk" aria-hidden="true">🔊</span>' +
                      '<span class="mcq-audio-label">הַקְשִׁיבוּ</span>';
      btn.addEventListener('click', playStem);
      wrap.appendChild(btn);
    } else if (stem.mode === 'image') {
      var card = document.createElement('div');
      card.className = 'mcq-stem-card mcq-stem-card--image';
      if (stem.image_src) {           // src ריק → בלי <img> שבור; הכיתוב עדיין מוצג
        var img = document.createElement('img');
        img.className = 'mcq-stem-img';
        img.src = stem.image_src;
        img.alt = stem.image_alt || '';
        img.onerror = function () { img.style.display = 'none'; };
        card.appendChild(img);
      }
      if (stem.text_he) {
        var cap = document.createElement('div');
        cap.className = 'mcq-stem-caption';
        cap.lang = 'he';
        cap.textContent = stem.text_he;     // משפט מתחת לתמונה (true_false_image)
        card.appendChild(cap);
      }
      wrap.appendChild(card);
    } else if (stem.mode === 'fill') {
      var fcard = document.createElement('div');
      fcard.className = 'mcq-stem-card mcq-stem-card--fill';
      fcard.lang = 'he';
      var f = stem.fill || {};
      var before = document.createElement('span'); before.textContent = f.before || stem.text_he || '';
      var slot = document.createElement('span'); slot.className = 'mcq-slot'; slot.setAttribute('aria-label', 'מָקוֹם לְהַשְׁלָמָה');
      var after = document.createElement('span'); after.textContent = f.after || '';
      fcard.appendChild(before); fcard.appendChild(slot); fcard.appendChild(after);
      wrap.appendChild(fcard);
    } else { // text
      var tcard = document.createElement('div');
      tcard.className = 'mcq-stem-card mcq-stem-card--text';
      tcard.lang = 'he';
      tcard.textContent = stem.text_he || '';
      wrap.appendChild(tcard);
    }
    return wrap;
  }

  // ----------------------------------------------------------------------------
  // mount
  // ----------------------------------------------------------------------------
  function mount(root, opts) {
    opts = opts || {};
    var stem = opts.stem || { mode: 'text', text_he: '' };
    var options = Array.isArray(opts.options) ? opts.options.slice() : [];
    if (!options.length) return { unmount: function () {} };

    var state = {
      attempts: 0,
      locked: false,
      hintTimer: null,
      startTime: Date.now(),
      audioActiveTile: null,   // למצב audio-options (tap-to-hear, tap-again-to-choose)
    };

    function playStem() {
      if (stem.mode === 'audio') playKey(stem.audio_key);
      else if (stem.passage_audio_key) playKey(stem.passage_audio_key);
      else if (stem.audio_key) playKey(stem.audio_key);
    }

    root.innerHTML = '';
    root.classList.add('mechanic-mcq');
    if (opts.layout === 'passage') root.classList.add('mcq-layout-passage');
    if (opts.theme) root.classList.add('theme-' + opts.theme);

    // passage card (layout='passage') — כרטיס-טקסט מנוקד מעל השאלה
    if (opts.layout === 'passage' && stem.passage_he) {
      var pcard = document.createElement('section');
      pcard.className = 'mcq-passage-card';
      var ptext = document.createElement('div');
      ptext.className = 'mcq-passage-text'; ptext.lang = 'he';
      ptext.textContent = stem.passage_he;
      pcard.appendChild(ptext);
      if (stem.passage_audio_key) {
        var pbtn = document.createElement('button');
        pbtn.type = 'button'; pbtn.className = 'mcq-audio-btn mcq-passage-btn';
        pbtn.setAttribute('aria-label', 'לְהַאֲזִין שׁוּב');
        pbtn.innerHTML = '<span class="mcq-spk" aria-hidden="true">🔊</span>' +
                         '<span class="mcq-audio-label">לְהַאֲזִין שׁוּב</span>';
        pbtn.addEventListener('click', function () { playKey(stem.passage_audio_key); });
        pcard.appendChild(pbtn);
      }
      root.appendChild(pcard);
    }

    root.appendChild(renderStem(stem, playStem));

    var field = document.createElement('div');
    field.className = 'mcq-options';
    field.setAttribute('role', 'radiogroup');
    if (opts.promptLine) field.setAttribute('aria-label', opts.promptLine);
    root.appendChild(field);

    var feedback = document.createElement('div');
    feedback.className = 'mcq-feedback'; feedback.setAttribute('aria-live', 'polite');
    root.appendChild(feedback);

    var tiles = [];
    shuffle(options).forEach(function (opt) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'mcq-option mcq-option--' + (opt.mode || 'text');
      tile.setAttribute('role', 'radio');
      tile.setAttribute('aria-checked', 'false');
      tile.dataset.correct = opt.is_correct ? '1' : '0';

      if (opt.mode === 'image') {
        var imgAlt = opt.image_alt || optionLabel(opt) || '';
        // src ריק / 404 → נפילה חיננית לתווית טקסט במקום <img> שבור
        var imgFallback = function () {
          var fspan = document.createElement('span');
          fspan.className = 'mcq-option__label'; fspan.lang = 'he';
          fspan.textContent = imgAlt;
          tile.innerHTML = '';
          tile.appendChild(fspan);
        };
        if (opt.image_src) {
          var oimg = document.createElement('img');
          oimg.className = 'mcq-option__img';
          oimg.src = opt.image_src;
          oimg.alt = imgAlt;
          oimg.onerror = imgFallback;
          tile.appendChild(oimg);
        } else {
          imgFallback();
        }
        tile.setAttribute('aria-label', imgAlt || 'תְּמוּנָה');
      } else if (opt.mode === 'audio') {
        var spk = document.createElement('span');
        spk.className = 'mcq-option__spk'; spk.setAttribute('aria-hidden', 'true');
        spk.textContent = '🔊';
        tile.appendChild(spk);
        tile.setAttribute('aria-label', 'אֶפְשָׁרוּת לְהַאֲזָנָה');
      } else { // text
        var span = document.createElement('span');
        span.className = 'mcq-option__label'; span.lang = 'he';
        span.textContent = optionLabel(opt);
        tile.appendChild(span);
        tile.setAttribute('aria-label', optionLabel(opt));
      }

      tile.addEventListener('click', function () { handleTap(tile, opt); });
      field.appendChild(tile);
      tiles.push(tile);
    });

    // auto-play ה-stem פעם אחת ב-mount (אם אודיו זמין)
    if (stem.mode === 'audio' || stem.passage_audio_key || stem.audio_key) {
      var canPlay = (typeof window !== 'undefined' && window.AvneiAudio &&
                     (!window.AvneiAudio.isUnlocked || window.AvneiAudio.isUnlocked()));
      if (canPlay) setTimeout(playStem, 350);
    }
    noni('idle');
    state.hintTimer = setTimeout(triggerHint, 9000);

    function targetTiles() {
      return tiles.filter(function (t) { return t.dataset.correct === '1'; });
    }

    function triggerHint() {
      state.hintTimer = null;
      if (state.locked) return;
      noni('hint');
      targetTiles().forEach(function (t) { t.classList.add('hint-glow'); });
      playStem();
    }

    function handleTap(tile, opt) {
      if (state.locked) return;
      if (tile.classList.contains('picked')) return;

      // מצב audio-options: הקשה ראשונה על אריח = השמעה (preview); הקשה שנייה
      // על אותו אריח = בחירה. הקשה על אריח אחר = preview שלו.
      if (opt.mode === 'audio' && state.audioActiveTile !== tile) {
        if (state.audioActiveTile) state.audioActiveTile.classList.remove('mcq-option--listening');
        state.audioActiveTile = tile;
        tile.classList.add('mcq-option--listening');
        playKey(opt.audio_key);
        return;
      }

      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }

      var isCorrect = !!opt.is_correct;
      var rt = Date.now() - state.startTime;
      state.attempts++;

      logResult(opts, opt, {
        attempts: state.attempts,
        response_time_ms: rt,
        hint_used: state.attempts > 1,
      });

      tile.setAttribute('aria-checked', 'true');

      if (isCorrect) {
        state.locked = true;
        onCorrect(tile);
      } else {
        onWrong(tile);
      }
    }

    function onCorrect(tile) {
      tile.classList.add('picked');
      tile.classList.remove('mcq-option--listening');
      noni('cheer');
      feedback.textContent = 'יֵשׁ!';
      feedback.className = 'mcq-feedback mcq-feedback--ok';
      if (typeof opts.onUnitWon === 'function') { try { opts.onUnitWon(0); } catch (e) {} }
      setTimeout(function () {
        if (typeof opts.onComplete === 'function') { try { opts.onComplete(); } catch (e) {} }
      }, INTER_ITEM_DELAY_MS);
    }

    function onWrong(tile) {
      tile.setAttribute('aria-checked', 'false');
      tile.classList.add('wrong-sway');
      setTimeout(function () { tile.classList.remove('wrong-sway'); }, SWAY_MS);

      // two-tap (אפשרויות-שמע): אחרי טעות מנקים את סימון ההאזנה — חייבים
      // להקשיב שוב לפני בחירה חוזרת (מונע ספאם בחירות שמזהם את המדידה).
      if (state.audioActiveTile) {
        state.audioActiveTile.classList.remove('mcq-option--listening');
        state.audioActiveTile = null;
      }

      if (state.attempts === 2) {
        noni('hint');
        targetTiles().forEach(function (t) { t.classList.add('hint-glow'); });
        setTimeout(playStem, 400);   // השמעת ה-stem שוב (לא צליל-שבח חוזר)
      } else if (state.attempts >= 3) {
        noni('hint');
        targetTiles().forEach(function (t) { t.classList.add('hint-glow'); });
        setTimeout(function () { playKey('press-here'); }, 400);
      }
    }

    return {
      unmount: function () {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        root.innerHTML = '';
        root.classList.remove('mechanic-mcq', 'mcq-layout-passage');
        if (opts.theme) root.classList.remove('theme-' + opts.theme);
      },
    };
  }

  if (typeof window !== 'undefined') {
    window.AvneiMechanics = window.AvneiMechanics || {};
    window.AvneiMechanics['mcq'] = { mount: mount, _buildLogPayload: buildLogPayload, _optionLabel: optionLabel };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mount: mount, buildLogPayload: buildLogPayload, optionLabel: optionLabel };
  }
})();
