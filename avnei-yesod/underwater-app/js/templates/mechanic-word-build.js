// ============================================================================
// templates/mechanic-word-build.js — Standalone Word-Build mechanic (אי 5)
// סוכן 30 · 30.5.2026
//
// מצב exploration pure: ילדה בוחרת CV pairs (מ-vowel-adapter) ובונה מילה.
// אחרי כל בחירה — השמע. אין correct/wrong, אין logger — חופש לחקור.
//
// משמש את stage-5-word-build.html (CTA משני). תבנית: mechanic-cv-build של
// אי 4 — אבל עם word-level build instead of CV-level.
//
// פדגוגי: ילדה לומדת לבנות מילים מתוך CV pairs שהיא כבר מכירה (מאי 4).
// המכניקה לא דורשת "המילה הזו קיימת" — כל צירוף הוא לגיטימי לחקירה.
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
  function getVA() {
    return (typeof window !== 'undefined') ? window.AvneiVowelAdapter : null;
  }

  function tileText(part) {
    let s = part.letter || '';
    if (part.niqud) s += part.niqud;
    if (part.dagesh) s += 'ּ';
    return s;
  }

  function playCV(letter, vowelId) {
    if (typeof window === 'undefined' || !window.AvneiAudio) return;
    const VA = getVA();
    if (!VA) return;
    const key = VA.cvAudioKey(letter, vowelId);
    if (key) {
      try { window.AvneiAudio.play(key); } catch (e) {}
    }
  }

  function playWord(text) {
    if (typeof window === 'undefined' || !window.AvneiAudio) return;
    const WA = getWA();
    if (!WA) return;
    const key = WA.wordAudioKey(text);
    if (key) {
      try { window.AvneiAudio.play(key); } catch (e) {}
    }
  }

  // מיפוי vowelId → niqud symbol (תואם vowel-adapter VOWELS).
  const VOWEL_SYMBOLS = {
    kamatz: 'ָ', patach: 'ַ', shva: 'ְ',
    hiriq: 'ִ', holam: 'ֹ', tzere: 'ֵ', segol: 'ֶ',
  };

  function buildCVForTile(letter, vowelId) {
    const sym = VOWEL_SYMBOLS[vowelId] || '';
    let s = letter + sym;
    if (['ב','כ','פ'].indexOf(letter) >= 0) s += 'ּ';
    return s;
  }

  // --------------------------------------------------------------------------
  // mount(root, opts)
  // opts:
  //   letters       — אילו אותיות להציע (default: 5 פיילוט מ-vowel-adapter)
  //   vowels        — אילו vowels להציע (default: ['patach','kamatz'])
  //   maxParts      — אורך מילה מקסימלי לבנייה (default 4)
  //   onComplete    — לא חייב, exploration pure
  // --------------------------------------------------------------------------
  function mount(root, opts) {
    const VA = getVA();
    if (!VA) {
      console.error('[mechanic-word-build] AvneiVowelAdapter חסר');
      return { unmount: function () {} };
    }
    const letters = (opts && opts.letters) || ['מ', 'ב', 'ר', 'ק', 'ת'];
    const vowels = (opts && opts.vowels) || ['patach', 'kamatz', 'hiriq'];
    const maxParts = (opts && opts.maxParts) || 4;

    root.innerHTML = '';
    root.classList.add('mechanic-word-build');

    const prompt = document.createElement('div');
    prompt.className = 'word-build-prompt';
    prompt.textContent = 'הַרְכִּיבוּ מִילָּה — כֹל צֵרוּף לְגִיטִימִי!';
    root.appendChild(prompt);

    const buildArea = document.createElement('div');
    buildArea.className = 'word-build-area';
    buildArea.setAttribute('aria-label', 'אזור בנייה');
    root.appendChild(buildArea);

    const controlsBar = document.createElement('div');
    controlsBar.className = 'word-build-controls';
    const undoBtn = document.createElement('button');
    undoBtn.type = 'button';
    undoBtn.className = 'word-build-undo';
    undoBtn.textContent = '↶ בָּטֵל';
    undoBtn.addEventListener('click', undoLast);
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'word-build-play';
    playBtn.textContent = '🔊 הַשְׁמִיעוּ';
    playBtn.addEventListener('click', playCurrent);
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'word-build-clear';
    clearBtn.textContent = '✕ נַקּוּ';
    clearBtn.addEventListener('click', clearAll);
    controlsBar.appendChild(undoBtn);
    controlsBar.appendChild(playBtn);
    controlsBar.appendChild(clearBtn);
    root.appendChild(controlsBar);

    // Vowel selector + letter grid
    const vowelBar = document.createElement('div');
    vowelBar.className = 'word-build-vowel-bar';
    let currentVowel = vowels[0];
    vowels.forEach(function (vid) {
      const v = VA.getVowelById(vid);
      if (!v) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'word-build-vowel-btn' + (vid === currentVowel ? ' active' : '');
      btn.dataset.vowel = vid;
      btn.textContent = v.displayHe;
      btn.addEventListener('click', function () {
        currentVowel = vid;
        Array.prototype.forEach.call(vowelBar.children, function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        rebuildLetterGrid();
      });
      vowelBar.appendChild(btn);
    });
    root.appendChild(vowelBar);

    const letterGrid = document.createElement('div');
    letterGrid.className = 'word-build-letter-grid';
    root.appendChild(letterGrid);

    const built = [];

    function renderBuild() {
      buildArea.innerHTML = '';
      if (built.length === 0) {
        const ph = document.createElement('span');
        ph.className = 'word-build-placeholder';
        ph.textContent = 'בָּחֲרוּ אוֹת';
        buildArea.appendChild(ph);
        return;
      }
      built.forEach(function (b) {
        const part = document.createElement('span');
        part.className = 'word-build-part';
        part.textContent = b.cv;
        buildArea.appendChild(part);
      });
    }

    function rebuildLetterGrid() {
      letterGrid.innerHTML = '';
      letters.forEach(function (L) {
        const cv = buildCVForTile(L, currentVowel);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'word-build-letter-btn';
        btn.dataset.letter = L;
        btn.dataset.vowel = currentVowel;
        btn.textContent = cv;
        btn.addEventListener('click', function () {
          if (built.length >= maxParts) return;
          built.push({ letter: L, vowelId: currentVowel, cv: cv });
          renderBuild();
          playCV(L, currentVowel);
        });
        letterGrid.appendChild(btn);
      });
    }

    function undoLast() {
      built.pop();
      renderBuild();
    }
    function clearAll() {
      built.length = 0;
      renderBuild();
    }
    function playCurrent() {
      if (built.length === 0) return;
      // נסה לזהות מילה רשומה (אם המילה שבנינו זהה לאחת מ-WORDS_*).
      const WA = getWA();
      if (WA) {
        const text = built.map(function (b) { return b.cv; }).join('');
        const word = WA.getWordByText(text);
        if (word) { playWord(text); return; }
      }
      // אחרת — נגן רצף CV-by-CV (אקספלורציה).
      let i = 0;
      function step() {
        if (i >= built.length) return;
        playCV(built[i].letter, built[i].vowelId);
        i++;
        setTimeout(step, 700);
      }
      step();
    }

    renderBuild();
    rebuildLetterGrid();

    return {
      unmount: function () {
        try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
        root.innerHTML = '';
        root.classList.remove('mechanic-word-build');
      },
    };
  }

  window.AvneiMechanics = window.AvneiMechanics || {};
  window.AvneiMechanics['word-build'] = { mount: mount };
})();
