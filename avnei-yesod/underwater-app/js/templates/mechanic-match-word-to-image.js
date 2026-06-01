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

  function mount(root, opts) {
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
