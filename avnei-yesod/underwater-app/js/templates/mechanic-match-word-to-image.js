// ============================================================================
// templates/mechanic-match-word-to-image.js — Word → Image mechanic (אי 5)
// סוכן 30 · 30.5.2026
//
// ילדה רואה מילה מנוקדת + 3 תמונות (אם קיימות) או 3 גלוסים בעברית. בוחרת
// את התמונה/הגלוס המתאים.
//
// MVP fallback: כל המילים ב-data/island-05-words/*.json עם anchor_image=null.
// לכן ב-MVP זה משחק "מילה ↔ גלוס" טקסטואלי — הילדה רואה את המילה ובוחרת בין
// 3 תרגומים פשוטים (meaning_he). זה לא אידיאלי אבל מאפשר לתרגל הבנת אוצר.
// כשמיטל תוסיף תמונות, ה-mechanic ישתמש בהן אוטומטית דרך anchor_image.
// ============================================================================

(function () {
  'use strict';

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function getWA() {
    return (typeof window !== 'undefined') ? window.AvneiWordAdapter : null;
  }

  function playWord(text) {
    if (typeof window === 'undefined' || !window.AvneiAudio) return;
    const WA = getWA();
    const key = WA ? WA.wordAudioKey(text) : null;
    if (key) {
      try { window.AvneiAudio.play(key); } catch (e) {}
    }
  }

  // ==========================================================================
  // ADAPT-7 / ADAPT-9 (minigame-fit T3, 30.6.2026) — מסלול מונחה-config:
  //   אם opts.options קיים → בונים בדיוק את 3 האופציות של השאלה (לא מ-WA),
  //   ומדווחים את ה-EPA הספציפי של המסיח שנלחץ. תומך בשני כיוונים:
  //     direction='word_to_image' (ברירת-מחדל): stem=מילה מנוקדת, options=תמונות
  //     direction='image_to_word':              stem=תמונה,        options=מילים מנוקדות
  //   המסלול הישן (WA.getWords) נשמר במלואו למטה לתאימות אי 5.
  // ==========================================================================
  function mountFromOptions(root, opts) {
    const direction = opts.direction || 'word_to_image';
    const stem = opts.stem || {};
    const options = opts.options.slice();
    const questId = opts.questId || ('isl05-match-cfg-' + Date.now());

    function playKey(key) {
      if (key && typeof window !== 'undefined' && window.AvneiAudio) {
        try { window.AvneiAudio.play(key); } catch (e) {}
      }
    }
    function playStem() {
      if (stem.audio_key) playKey(stem.audio_key);
    }

    root.innerHTML = '';
    root.classList.add('mechanic-match-word-to-image');
    if (opts.theme) root.classList.add('theme-' + opts.theme);

    // ----- stem -----
    const prompt = document.createElement('div');
    prompt.className = 'match-image-prompt';
    if (direction === 'image_to_word') {
      const img = document.createElement('img');
      img.className = 'match-image-stem-img';
      img.src = stem.image_src || stem.anchor_image || '';
      img.alt = stem.image_alt || stem.text_he || '';
      prompt.appendChild(img);
    } else {
      const label = document.createElement('span');
      label.className = 'match-image-label';
      label.textContent = 'מָה הַמִּילָּה';
      const wbtn = document.createElement('button');
      wbtn.type = 'button'; wbtn.className = 'match-image-word'; wbtn.lang = 'he';
      wbtn.setAttribute('aria-label', 'הַקֵּשׁ לִשְׁמוֹעַ');
      wbtn.textContent = stem.text_he || '';
      wbtn.addEventListener('click', playStem);
      prompt.appendChild(label);
      prompt.appendChild(wbtn);
    }
    root.appendChild(prompt);

    const field = document.createElement('div');
    field.className = 'match-image-field';
    root.appendChild(field);

    const state = { attempts: 0, locked: false, startTime: Date.now(), hintTimer: null };
    const tiles = [];

    function logResult(opt, isCorrect) {
      if (typeof window === 'undefined' || !window.AvneiEventLogger) return;
      const epa = (!isCorrect && opt.epa) ? opt.epa : null;
      try {
        window.AvneiEventLogger.logActivityResult({
          activity_type: 'mcq',
          activity_variant: direction,   // 'word_to_image' | 'image_to_word'
          item_id: questId,
          target_letter: opts.target_letter || null,
          is_correct: isCorrect,
          failure_type:    epa ? (epa.what || null)  : null,
          letter_position: epa ? (epa.where || null) : null,
          task_type:       epa ? (epa.task || null)  : null,
          primary_island_id:    (typeof opts.primary_island_id === 'number') ? opts.primary_island_id : 5,
          secondary_island_ids: Array.isArray(opts.secondary_island_ids) ? opts.secondary_island_ids : [4],
          rama_task_alignment:  (typeof opts.rama_task_alignment === 'number') ? opts.rama_task_alignment : undefined,
          peima_target:         (typeof opts.peima_target === 'number') ? opts.peima_target : undefined,
          supportLevel: 1,
          attempts: state.attempts,
          response_time_ms: isCorrect ? (Date.now() - state.startTime) : null,
          hint_used: state.attempts > 1,
        });
      } catch (e) {}
    }

    function targetTile() { return tiles.find(function (t) { return t.dataset.correct === '1'; }); }

    function handleTap(tile, opt) {
      if (state.locked || tile.classList.contains('lit')) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      const isCorrect = !!opt.is_correct;
      state.attempts++;
      logResult(opt, isCorrect);

      if (isCorrect) {
        tile.classList.add('lit');
        state.locked = true;
        if (opt.audio_key) playKey(opt.audio_key); else playStem();
        if (typeof opts.onUnitWon === 'function') try { opts.onUnitWon(0); } catch (e) {}
        setTimeout(function () {
          if (typeof opts.onComplete === 'function') try { opts.onComplete(); } catch (e) {}
        }, 1100);
      } else {
        tile.classList.add('wrong-sway');
        setTimeout(function () { tile.classList.remove('wrong-sway'); }, 700);
        if (state.attempts >= 2) {
          const tg = targetTile();
          if (tg) tg.classList.add('hint-glow');
          if (window.AvneiNoni) try { window.AvneiNoni.setState('hint'); } catch (e) {}
        }
      }
    }

    shuffle(options).forEach(function (opt) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'match-image-tile';
      tile.dataset.correct = opt.is_correct ? '1' : '0';
      const optMode = opt.mode || (direction === 'image_to_word' ? 'text' : 'image');
      if (optMode === 'image' && (opt.image_src || opt.anchor_image)) {
        const img = document.createElement('img');
        img.src = opt.image_src || opt.anchor_image;
        img.alt = opt.image_alt || opt.label_he || '';
        img.className = 'match-image-img';
        tile.appendChild(img);
        tile.setAttribute('aria-label', img.alt || 'תְּמוּנָה');
      } else {
        const span = document.createElement('span');
        span.className = (optMode === 'text') ? 'match-image-word-opt' : 'match-image-gloss';
        span.lang = 'he';
        span.textContent = opt.label_he || opt.text || '';
        tile.appendChild(span);
        tile.setAttribute('aria-label', span.textContent);
      }
      tile.addEventListener('click', function () { handleTap(tile, opt); });
      field.appendChild(tile);
      tiles.push(tile);
    });

    if (direction !== 'image_to_word' && stem.audio_key) setTimeout(playStem, 350);

    state.hintTimer = setTimeout(function () {
      if (state.locked) return;
      const tg = targetTile();
      if (tg) tg.classList.add('hint-glow');
    }, 9000);

    return {
      unmount: function () {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        root.innerHTML = '';
        root.classList.remove('mechanic-match-word-to-image');
        if (opts.theme) root.classList.remove('theme-' + opts.theme);
      },
    };
  }

  function mount(root, opts) {
    // מסלול חדש מונחה-config (ADAPT-7/9) — מקבל את 3 האופציות של השאלה + EPA.
    if (opts && Array.isArray(opts.options) && opts.options.length) {
      return mountFromOptions(root, opts);
    }
    // ----- מסלול legacy (אי 5, WA.getWords) — ללא שינוי -----
    const WA = getWA();
    if (!WA) return { unmount: function () {} };
    const word = opts.word;
    if (!word || !word.text) return { unmount: function () {} };

    const wordLevel = word.level || WA.classifyWordLevel(word.text);
    const firstLetter = word.first_letter;
    const questId = opts.questId || ('isl05-match-image-' + (word.key || WA.wordKey(word.text)));

    // Distractors: 2 מילים אחרות מאותו level עם meaning_he שונה.
    const samePool = WA.getWords(wordLevel)
      .filter(function (w) { return w.text !== word.text && w.meaning_he !== word.meaning_he; });
    const distractors = shuffle(samePool).slice(0, 2);
    const choices = shuffle([word].concat(distractors));

    const hasImages = !!word.anchor_image && distractors.every(function (d) { return !!d.anchor_image; });

    root.innerHTML = '';
    root.classList.add('mechanic-match-word-to-image');

    const prompt = document.createElement('div');
    prompt.className = 'match-image-prompt';
    prompt.innerHTML =
      '<span class="match-image-label">מָה הַמִּילָּה</span>' +
      '<button type="button" class="match-image-word" aria-label="הקש לשמוע">' + word.text + '</button>';
    root.appendChild(prompt);

    const field = document.createElement('div');
    field.className = 'match-image-field';
    root.appendChild(field);

    const state = { attempts: 0, locked: false, startTime: Date.now(), hintTimer: null };
    const tiles = [];
    choices.forEach(function (w) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'match-image-tile';
      tile.dataset.text = w.text;
      tile.dataset.isTarget = (w.text === word.text) ? '1' : '0';
      if (hasImages) {
        const img = document.createElement('img');
        img.src = w.anchor_image;
        img.alt = w.meaning_he || '';
        img.className = 'match-image-img';
        tile.appendChild(img);
      } else {
        const span = document.createElement('span');
        span.className = 'match-image-gloss';
        span.textContent = w.meaning_he || w.text;
        tile.appendChild(span);
      }
      tile.addEventListener('click', function () { handleTap(tile, w); });
      field.appendChild(tile);
      tiles.push(tile);
    });

    setTimeout(function () { playWord(word.text); }, 350);

    function handleTap(tile, w) {
      if (state.locked) return;
      if (tile.classList.contains('lit')) return;
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      const isCorrect = (w.text === word.text);
      const rt = Date.now() - state.startTime;

      if (window.AvneiEventLogger) {
        try {
          window.AvneiEventLogger.logActivityResult({
            activity_type: 'word-to-image',
            target_word_length: wordLevel,
            target_letter: firstLetter,
            target_word: word.text,
            tapped_meaning: w.meaning_he,
            item_id: questId + '-trial-1',
            supportLevel: 1,
            is_correct: isCorrect,
            attempts: state.attempts + 1,
            response_time_ms: isCorrect ? rt : null,
            hint_used: state.attempts >= 1,
            primary_island_id: 5,
            secondary_island_ids: [4],
          });
        } catch (e) {}
      }

      if (isCorrect) {
        tile.classList.add('lit');
        state.locked = true;
        playWord(word.text);
        if (typeof opts.onUnitWon === 'function') opts.onUnitWon(0);
        setTimeout(function () {
          if (typeof opts.onComplete === 'function') opts.onComplete();
        }, 1100);
      } else {
        state.attempts++;
        tile.classList.add('wrong-sway');
        setTimeout(function () { tile.classList.remove('wrong-sway'); }, 700);
        if (state.attempts >= 2) {
          const target = tiles.find(function (t) { return t.dataset.isTarget === '1'; });
          if (target) target.classList.add('hint-glow');
          if (window.AvneiNoni) try { window.AvneiNoni.setState('hint'); } catch (e) {}
        }
      }
    }

    prompt.querySelector('.match-image-word').addEventListener('click', function () {
      playWord(word.text);
    });

    state.hintTimer = setTimeout(function () {
      if (state.locked) return;
      const target = tiles.find(function (t) { return t.dataset.isTarget === '1'; });
      if (target) target.classList.add('hint-glow');
    }, 9000);

    return {
      unmount: function () {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
        root.innerHTML = '';
        root.classList.remove('mechanic-match-word-to-image');
      },
    };
  }

  window.AvneiMechanics = window.AvneiMechanics || {};
  window.AvneiMechanics['match-word-to-image'] = { mount: mount };
})();
