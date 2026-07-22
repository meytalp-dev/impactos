// ============================================================================
// templates/mechanic-word-build.js — Standalone Word-Build mechanic (אי 5)
// סוכן 30 · 30.5.2026
//
// שני מצבים:
//   • mount() — exploration pure: ילדה בוחרת CV pairs ובונה מילה חופשית.
//     אין correct/wrong, אין logger — חופש לחקור (נשאר לא-מדיד במכוון).
//   • mountTarget() — מצב מטרה: מילה גלויה, מקישים על חלקיה לפי הסדר. יש
//     correct/wrong → מתעד ל-event-logger (island 5 · strand 1) בכל הקשה,
//     כדי שהמורה תראה את ההתקדמות בדשבורד (22.7.2026).
//
// משמש את stage-5-word-build.html (mountTarget). תבנית: mechanic-cv-build של
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
  // parseWordToParts(text) — פירוק מילה מנוקדת לחלקי CV.
  // כל חלק: { letter, vowelId|null, display }. אות אחרונה בלי ניקוד = חלק bare.
  // --------------------------------------------------------------------------
  const SYMBOL_TO_VOWEL = (function () {
    const m = {};
    Object.keys(VOWEL_SYMBOLS).forEach(function (vid) { m[VOWEL_SYMBOLS[vid]] = vid; });
    return m;
  })();
  const DAGESH = 'ּ';

  function nfc(s) {
    return (s && s.normalize) ? s.normalize('NFC') : s;
  }

  function parseWordToParts(text) {
    const parts = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch < 'א' || ch > 'ת') continue; // רק אותיות פותחות חלק
      let display = ch;
      let vowelId = null;
      let j = i + 1;
      while (j < text.length && text[j] >= '֑' && text[j] <= 'ׇ') {
        display += text[j];
        if (SYMBOL_TO_VOWEL[text[j]]) vowelId = SYMBOL_TO_VOWEL[text[j]];
        j++;
      }
      parts.push({ letter: ch, vowelId: vowelId, display: display });
      i = j - 1;
    }
    return parts;
  }

  // --------------------------------------------------------------------------
  // mountTarget(root, opts) — מצב מטרה (פישוט 6.7.2026, ביקשה מיטל):
  // המילה מוצגת גלויה למעלה; הילד.ה מקיש.ה על החלקים לפי הסדר ובונה אותה.
  // opts:
  //   targetWords — מערך מילים מנוקדות (חובה)
  //   distractors — כמה חלקי-הסחה להוסיף לרשת (default 2)
  //   letters/vowels — מאגר להסחות (default כמו exploration)
  // --------------------------------------------------------------------------
  function mountTarget(root, opts) {
    const words = opts.targetWords.slice();
    const distractorCount = (opts.distractors == null) ? 2 : opts.distractors;
    const poolLetters = (opts && opts.letters) || ['מ', 'ב', 'ר', 'ק', 'ת'];
    const poolVowels = (opts && opts.vowels) || ['patach', 'kamatz', 'hiriq'];
    // אי 5 = סטרנד 1 (פונולוגיה/דקודינג). ניתן override דרך opts.islandId (דפוס
    // mechanic-word-spell). מתעד ל-BKT פר-אי + strand 1 per_letter — מה שהמורה קוראת.
    const islandId = (typeof opts.islandId === 'number') ? opts.islandId : 5;

    // תיעוד פר-הקשה (דפוס mechanic-word-spell.handleTap): כל הקשה על אריח היא
    // ראיה — נכונה (החלק הבא) או שגויה (מסיח/חלק לא-בסדר). target_letter חובה
    // אחרת event-logger.ingestEvent מדלג (מפתח-יחידה ריק). exploration pure לא מתעד.
    const VA_LOG = getVA();
    function phonemeGroupOf(vid) {
      return (VA_LOG && VA_LOG.getPhonemeGroup) ? VA_LOG.getPhonemeGroup(vid) : null;
    }
    let partAttempts = 0;
    let partStartTime = Date.now();
    // אי 5 = sub-BKT פר אורך-מילה (2cv/3cv/4cv, כמו tap-word/word-merge). כל חלקי
    // המילה חולקים את הבאקט של המילה הנוכחית = מספר חלקי-ה-CV, clamp ל-2..4.
    function wordLengthBucket() {
      const n = Math.max(2, Math.min(4, (parts && parts.length) || 2));
      return n + 'cv';
    }
    function logPartResult(expected, isCorrect) {
      if (!expected) return;
      if (!window.AvneiEventLogger ||
          typeof window.AvneiEventLogger.logActivityResult !== 'function') return;
      try {
        window.AvneiEventLogger.logActivityResult({
          activity_type: 'word-build',
          activity_variant: 'target',
          target_word: words[wordIdx],
          target_letter: expected.letter,
          target_phoneme_group: phonemeGroupOf(expected.vowelId),
          target_word_length: wordLengthBucket(),
          item_id: 'wb-' + (wordIdx + 1) + '-part-' + (nextIdx + 1),
          supportLevel: 1,
          is_correct: isCorrect,
          attempts: partAttempts + 1,
          response_time_ms: isCorrect ? (Date.now() - partStartTime) : null,
          primary_island_id: islandId,
        });
      } catch (e) { /* swallow — תיעוד לא יפיל את המשחקון */ }
    }

    root.innerHTML = '';
    root.classList.add('mechanic-word-build');

    const prompt = document.createElement('div');
    prompt.className = 'word-build-prompt';
    prompt.textContent = 'הַרְכִּיבוּ אֶת הַמִּלָּה:';
    root.appendChild(prompt);

    const targetEl = document.createElement('div');
    targetEl.className = 'word-build-target';
    root.appendChild(targetEl);

    const hearBtn = document.createElement('button');
    hearBtn.type = 'button';
    hearBtn.className = 'word-build-play word-build-hear';
    hearBtn.textContent = '🔊 הַקְשִׁיבוּ לַמִּלָּה';
    root.appendChild(hearBtn);

    const buildArea = document.createElement('div');
    buildArea.className = 'word-build-area';
    buildArea.setAttribute('aria-label', 'אזור בנייה');
    root.appendChild(buildArea);

    const letterGrid = document.createElement('div');
    letterGrid.className = 'word-build-letter-grid word-build-letter-grid--target';
    root.appendChild(letterGrid);

    const progressEl = document.createElement('div');
    progressEl.className = 'word-build-progress';
    root.appendChild(progressEl);

    let wordIdx = 0;
    let parts = [];
    let nextIdx = 0;
    let done = false;

    hearBtn.addEventListener('click', function () {
      if (done) return;
      playWord(words[wordIdx]);
    });

    function renderBuild() {
      buildArea.innerHTML = '';
      parts.forEach(function (p, i) {
        const span = document.createElement('span');
        span.className = i < nextIdx ? 'word-build-part' : 'word-build-slot';
        span.textContent = i < nextIdx ? p.display : '·';
        buildArea.appendChild(span);
      });
    }

    function makeTiles() {
      const tiles = parts.map(function (p, i) {
        return { display: p.display, letter: p.letter, vowelId: p.vowelId, orderIdx: i };
      });
      // הסחות — צירופים שאינם חלק מהמילה. השוואה ב-NFC: סדר סימני הניקוד
      // (דגש/תנועה) משתנה בין מקורות ושתי מחרוזות זהות-מראה לא ישתוו בלעדיו.
      const used = {};
      // חתימת אות+קבוצת-צליל: אסור מסיח שנשמע זהה לחלק במילה (בָּ מול בַּ) —
      // פתח וקמץ = אותו צליל (מיטל 8.7.2026).
      const VA = getVA();
      function grp(vid) { return (VA && VA.getPhonemeGroup) ? VA.getPhonemeGroup(vid) : vid; }
      const partSig = {};
      parts.forEach(function (p) {
        used[nfc(p.display)] = true;
        partSig[p.letter + '|' + (grp(p.vowelId) || '')] = true;
      });
      const candidates = [];
      poolLetters.forEach(function (L) {
        poolVowels.forEach(function (vid) {
          if (partSig[L + '|' + (grp(vid) || '')]) return; // אחות-צליל של חלק במילה
          const cv = buildCVForTile(L, vid);
          if (!used[nfc(cv)]) candidates.push({ display: cv, letter: L, vowelId: vid, orderIdx: -1 });
        });
      });
      shuffle(candidates).slice(0, distractorCount).forEach(function (d) { tiles.push(d); });
      return shuffle(tiles);
    }

    function renderGrid() {
      letterGrid.innerHTML = '';
      makeTiles().forEach(function (t) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'word-build-letter-btn';
        btn.textContent = t.display;
        btn.addEventListener('click', function () {
          if (done || btn.disabled) return;
          const expected = parts[nextIdx];
          const isCorrect = !!(expected && nfc(t.display) === nfc(expected.display));
          logPartResult(expected, isCorrect);
          if (isCorrect) {
            btn.disabled = true;
            btn.classList.add('used');
            nextIdx++;
            partAttempts = 0;
            partStartTime = Date.now();
            renderBuild();
            if (expected.vowelId) playCV(expected.letter, expected.vowelId);
            if (nextIdx >= parts.length) wordComplete();
          } else {
            partAttempts++;
            btn.classList.remove('shake');
            void btn.offsetWidth;
            btn.classList.add('shake');
          }
        });
        letterGrid.appendChild(btn);
      });
    }

    function wordComplete() {
      // המילה השלמה נשמעת פעם אחת — זה הפרס; ואז ממשיכים
      setTimeout(function () { playWord(words[wordIdx]); }, 500);
      targetEl.classList.add('celebrate');
      setTimeout(function () {
        targetEl.classList.remove('celebrate');
        wordIdx++;
        if (wordIdx >= words.length) {
          done = true;
          prompt.textContent = 'כֹּל הַמִּלִּים הֻרְכְּבוּ — כֹּל הַכָּבוֹד!';
          targetEl.textContent = '🎉';
          buildArea.innerHTML = '';
          letterGrid.innerHTML = '';
          hearBtn.style.display = 'none';
          const again = document.createElement('button');
          again.type = 'button';
          again.className = 'word-build-play';
          again.textContent = '↻ עוֹד פַּעַם';
          again.addEventListener('click', function () { location.reload(); });
          letterGrid.appendChild(again);
          if (typeof opts.onComplete === 'function') try { opts.onComplete(); } catch (e) {}
        } else {
          startWord();
        }
      }, 2400);
    }

    function startWord() {
      parts = parseWordToParts(words[wordIdx]);
      nextIdx = 0;
      partAttempts = 0;
      partStartTime = Date.now();
      targetEl.textContent = words[wordIdx];
      progressEl.textContent = 'מִלָּה ' + (wordIdx + 1) + ' מִתּוֹךְ ' + words.length;
      renderBuild();
      renderGrid();
      // במילה הראשונה: הנחיה קולית ואז המילה (playSequence לא נקטע ע"י play)
      const WA = getWA();
      const wKey = WA ? WA.wordAudioKey(words[wordIdx]) : null;
      if (wordIdx === 0 && opts.introKey && window.AvneiAudio && window.AvneiAudio.playSequence) {
        window.AvneiAudio.playSequence([opts.introKey, wKey], 600);
      } else {
        playWord(words[wordIdx]);
      }
    }

    startWord();

    return {
      unmount: function () {
        root.innerHTML = '';
        root.classList.remove('mechanic-word-build');
      },
    };
  }

  // --------------------------------------------------------------------------
  // mount(root, opts)
  // opts:
  //   letters       — אילו אותיות להציע (default: 5 פיילוט מ-vowel-adapter)
  //   vowels        — אילו vowels להציע (default: ['patach','kamatz'])
  //   maxParts      — אורך מילה מקסימלי לבנייה (default 4)
  //   targetWords   — אם קיים → מצב מטרה (mountTarget) במקום exploration
  //   onComplete    — לא חייב, exploration pure
  // --------------------------------------------------------------------------
  function mount(root, opts) {
    if (opts && opts.targetWords && opts.targetWords.length) {
      return mountTarget(root, opts);
    }
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
