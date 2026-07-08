// ============================================================================
// templates/mechanic-cv-build.js — Build-CV mechanic (אי 4, standalone, TASK)
// סוכן Fix · 30.5.2026 · v2 (אחרי feedback מיטל מ-screenshot)
//
// משימה (TASK MODE — לא exploration):
//   המערכת מציגה target CV: "בְּנוּ אֶת מַ" + השמע את הצליל.
//   הילדה בוחרת אות + ניקוד מ-2 העמודות → המערכת מרכיבה.
//   אם הבנייה תואמת ל-target → fish sings, ✓ counter, advance ל-next.
//   אם לא תואם → soft feedback (build נראה אבל בלי חגיגה, יכולה לנסות שוב).
//
// chalupa B: target kamatz → גם patach מתקבל כנכון (sister vowels).
//   target /a/ → מַ או מָ שניהם passing.
//
// אדפטיביות: getTopWeakCVs(sid, n=5) פר תלמיד.ה (sub-BKT פר אות).
//   אם אין דאטה — pilot pack default: מַ · בַּ · רַ · קַ · תַּ.
//
// UI: vowel tiles עם ◌ (dotted circle U+25CC) במקום בּ — placeholder ניטרלי.
// ============================================================================

(function () {
  'use strict';

  function playKey(key) {
    if (window.AvneiAudio && typeof window.AvneiAudio.play === 'function' && key) {
      window.AvneiAudio.play(key);
    }
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Pilot pack: 5 אותיות × תנועות **מגוונות**.
  // החלטת מיטל 30.5.2026: ילדה צריכה לחוות variety של ניקוד, לא רק קמץ-פתח.
  // עדכון 29.6.2026 (feedback מיטל): רק אותיות עם **צליל ייחודי** —
  //   נמנעים מ-ת (/t/ ↔ ט) ומ-ק (/k/ ↔ כּ), כי שם הילד.ה יכול.ה לבנות
  //   צירוף שנשמע זהה (טִ במקום תִּ, כַּ במקום קַ) ולהיפסל בטעות.
  //   מ (/m/) · ב (/b/) · ל (/l/) — אין להן "תאומה" שמבלבלת.
  //   כל target עם anchor word ב-vowel-adapter.ANCHOR_WORDS (לא ממציאים).
  // התנועות canonical (פתח מייצג /a/ = פתח+קמץ · צירי מייצג /e/ = צירי+סגול).
  const PILOT_TARGETS = [
    { letter: 'מ', vowelId: 'patach' },   // מַ (/ma/) · anchor: מַטֶּה
    { letter: 'ב', vowelId: 'shva'   },   // בְּ (/bə/) · anchor: בְּרֵכָה
    { letter: 'מ', vowelId: 'hiriq'  },   // מִ (/mi/) · anchor: מִכְנָסַיִם
    { letter: 'ל', vowelId: 'tzere'  },   // לֵ (/le/) · anchor: לֵב (אות הדמו)
    { letter: 'ב', vowelId: 'patach' },   // בַּ (/ba/) · anchor: בַּת
  ];

  function buildTargetList(sid, numTrials) {
    const VA = window.AvneiVowelAdapter;
    // נסה לקבל top weak CVs (אם BKT יש)
    if (sid && VA && typeof VA.getTopWeakCVs === 'function') {
      try {
        const weak = VA.getTopWeakCVs(sid, numTrials);
        if (Array.isArray(weak) && weak.length >= numTrials) {
          return weak.slice(0, numTrials).map(function (w) {
            return { letter: w.letter, vowelId: w.vowelId };
          });
        }
      } catch (e) {}
    }
    // fallback — pilot pack מעורבב
    const pack = shuffle(PILOT_TARGETS);
    const out = [];
    for (let i = 0; i < numTrials; i++) {
      out.push(pack[i % pack.length]);
    }
    return out;
  }

  function mount(root, opts) {
    const VA = window.AvneiVowelAdapter;
    if (!VA) {
      console.error('[mechanic-cv-build] AvneiVowelAdapter חסר');
      return { unmount: function () {} };
    }

    const options = opts || {};
    const numTrials = (options.numTrials && options.numTrials > 0) ? options.numTrials : 5;
    const sid = options.studentId || 'local';
    const targets = buildTargetList(sid, numTrials);

    const letters = VA.ALL_HEBREW_LETTERS_22.slice();

    // אריחי הניקוד לתצוגה. id = התנועה ה-canonical שמשמשת לבנייה/בדיקה.
    // תנועות שנשמעות זהה מאוחדות לאריח אחד (החלטת מיטל 29.6.2026):
    //   /a/ = פתח + קמץ  ·  /e/ = צירי + סגול.
    // isCorrectBuild בלאו הכי מקבל sister-vowels (phoneme group), אז canonical מספיק.
    function vsym(id) { const v = VA.getVowelById(id); return v ? v.symbol : ''; }
    const VOWEL_TILES = [
      { id: 'patach', label: 'פתח · קמץ',  forms: [vsym('patach'), vsym('kamatz')] },
      { id: 'shva',   label: 'שווא',        forms: [vsym('shva')] },
      { id: 'hiriq',  label: 'חיריק',       forms: [vsym('hiriq')] },
      { id: 'holam',  label: 'חולם',        forms: [vsym('holam')] },
      { id: 'tzere',  label: 'צירי · סגול', forms: [vsym('tzere'), vsym('segol')] },
      // /u/ — canonical=kubutz. שורוק (וּ) אינו combining mark — ה-form מוצג כ-X+וּ.
      { id: 'kubutz', label: 'קובוץ · שורוק', forms: [vsym('kubutz'), vsym('shuruk')] },
    ];

    // --- DOM ---
    root.innerHTML = '';
    root.classList.add('mechanic-cv-build');

    // Target prompt + counter
    // Tier 0 (default): target מראה רק 🔊 — audio בלבד, החקירה האמיתית
    // Tier 1 (after wrong 2): מראה את האות (50% חשיפה — היא יודעת איזה עיצור)
    // Tier 2 (after wrong 3+): מראה את ה-CV המלא — היא יכולה להעתיק
    // הקלקה על ה-target בכל מצב = השמע את הצליל
    const prompt = document.createElement('div');
    prompt.className = 'cv-build-prompt';
    prompt.innerHTML =
      '<div class="cv-build-prompt__label">בְּנוּ אֶת הַצְּלִיל:</div>' +
      '<button class="cv-build-prompt__target" id="cvBuildTarget" type="button" aria-label="הקישו לשמוע">🔊</button>' +
      '<div class="cv-build-prompt__counter" id="cvBuildCounter">0/' + numTrials + '</div>';
    root.appendChild(prompt);

    // Display (fish + built CV)
    const stage = document.createElement('div');
    stage.className = 'cv-build-stage';
    stage.innerHTML =
      '<div class="cv-build-display" id="cvBuildDisplay" aria-live="polite">' +
        '<div class="cv-build-fish" aria-hidden="true">' +
          '<svg viewBox="0 0 100 70"><use href="#fishIcon"/></svg>' +
        '</div>' +
        '<div class="cv-build-result" id="cvBuildResult">— —</div>' +
        '<div class="cv-build-anchor" id="cvBuildAnchor"></div>' +
      '</div>';
    root.appendChild(stage);

    // Choosers
    const choosers = document.createElement('div');
    choosers.className = 'cv-build-choosers';

    const lettersCol = document.createElement('div');
    lettersCol.className = 'cv-build-col cv-build-col--letters';
    lettersCol.innerHTML = '<div class="cv-build-col__label">אוֹת</div>';
    const lettersGrid = document.createElement('div');
    lettersGrid.className = 'cv-build-grid';
    letters.forEach(function (letter) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cv-build-tile cv-build-tile--letter';
      btn.dataset.letter = letter;
      btn.setAttribute('aria-label', 'אות ' + letter);
      btn.textContent = letter;
      lettersGrid.appendChild(btn);
    });
    lettersCol.appendChild(lettersGrid);

    const vowelsCol = document.createElement('div');
    vowelsCol.className = 'cv-build-col cv-build-col--vowels';
    vowelsCol.innerHTML = '<div class="cv-build-col__label">נִקּוּד</div>';
    const vowelsGrid = document.createElement('div');
    vowelsGrid.className = 'cv-build-grid cv-build-grid--vowels';
    VOWEL_TILES.forEach(function (tile) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cv-build-tile cv-build-tile--vowel' + (tile.forms.length > 1 ? ' cv-build-tile--vowel-merged' : '');
      btn.dataset.vowel = tile.id;
      btn.setAttribute('aria-label', 'ניקוד ' + tile.label);
      // X = base ניטרלי שמבליט את הניקוד (feedback מיטל 29.6.2026 — ◌ היה חיוור מדי).
      // משתמשים ב-X לטיני (לא ✕ U+2715 — חסר בפונט Heebo ומופיע כריבוע).
      const formsHtml = tile.forms.map(function (sym) {
        return '<span class="cv-build-tile__vowel-form">X' + sym + '</span>';
      }).join('<span class="cv-build-tile__vowel-sep">·</span>');
      btn.innerHTML = '<span class="cv-build-tile__vowel-frame">' + formsHtml + '</span>' +
                      '<span class="cv-build-tile__vowel-name">' + tile.label + '</span>';
      vowelsGrid.appendChild(btn);
    });
    vowelsCol.appendChild(vowelsGrid);

    choosers.appendChild(vowelsCol);
    choosers.appendChild(lettersCol);
    root.appendChild(choosers);

    // --- State ---
    const state = {
      trial: 0,
      selectedLetter: null,
      selectedVowel: null,
      lastBuiltCV: null,
      attempts: 0,
      scaffoldLevel: 0,   // 0=audio-only · 1=letter shown · 2=full CV shown
      locked: false,
    };

    function currentTarget() {
      return targets[state.trial];
    }

    // chalupa B: phoneme group accept
    function isCorrectBuild(letter, vowelId) {
      const t = currentTarget();
      if (!t) return false;
      if (letter !== t.letter) return false;
      // אם vowel ID תואם בדיוק — תקין
      if (vowelId === t.vowelId) return true;
      // אם sister vowel (אותו phoneme group) — גם תקין
      const targetGroup = VA.getPhonemeGroup(t.vowelId);
      const builtGroup = VA.getPhonemeGroup(vowelId);
      return targetGroup && builtGroup && targetGroup === builtGroup;
    }

    // helper — מעדכן את ה-visual של ה-target בלבד, בלי להשמיע audio
    // (משמש אחרי wrong attempt כדי לחשוף scaffolding)
    function renderTargetVisualOnly() {
      const t = currentTarget();
      if (!t) return;
      const cv = VA.buildCV(t.letter, t.vowelId);
      const targetEl = document.getElementById('cvBuildTarget');
      if (state.scaffoldLevel >= 2) {
        targetEl.innerHTML = cv;
        targetEl.classList.remove('audio-only', 'partial-hint');
        targetEl.classList.add('full-hint');
      } else if (state.scaffoldLevel === 1) {
        targetEl.innerHTML = t.letter + '<span class="cv-build-prompt__placeholder">?</span>';
        targetEl.classList.remove('audio-only', 'full-hint');
        targetEl.classList.add('partial-hint');
      }
    }

    function renderTarget() {
      const t = currentTarget();
      if (!t) return;
      const cv = VA.buildCV(t.letter, t.vowelId);
      const targetEl = document.getElementById('cvBuildTarget');

      // 3-tier scaffolding (מיטל אישרה 30.5.2026):
      // Tier 0: רק 🔊 — audio-only. הילדה צריכה לפרק את הצליל.
      // Tier 1: האות בלבד + ? לניקוד. 50% חשיפה.
      // Tier 2: ה-CV המלא. הילדה מעתיקה.
      if (state.scaffoldLevel >= 2) {
        targetEl.innerHTML = cv;
        targetEl.classList.remove('audio-only', 'partial-hint');
        targetEl.classList.add('full-hint');
      } else if (state.scaffoldLevel === 1) {
        targetEl.innerHTML = t.letter + '<span class="cv-build-prompt__placeholder">?</span>';
        targetEl.classList.remove('audio-only', 'full-hint');
        targetEl.classList.add('partial-hint');
      } else {
        targetEl.innerHTML = '<span class="cv-build-prompt__audio-icon">🔊</span>';
        targetEl.classList.remove('partial-hint', 'full-hint');
        targetEl.classList.add('audio-only');
      }

      document.getElementById('cvBuildCounter').textContent = state.trial + '/' + numTrials;
      // השמע את ה-target audio (פעם אחת בתחילת trial)
      setTimeout(function () {
        const k = VA.cvAudioKey(t.letter, t.vowelId);
        if (k) playKey(k);
      }, 350);
    }

    function clearSelection() {
      state.selectedLetter = null;
      state.selectedVowel = null;
      lettersGrid.querySelectorAll('.cv-build-tile').forEach(function (b) { b.classList.remove('selected'); });
      vowelsGrid.querySelectorAll('.cv-build-tile').forEach(function (b) { b.classList.remove('selected'); });
      document.getElementById('cvBuildResult').textContent = '— —';
      document.getElementById('cvBuildAnchor').textContent = '';
      document.getElementById('cvBuildDisplay').classList.remove('built');
    }

    function setSelectedLetter(letter, btn) {
      if (state.locked) return;
      state.selectedLetter = letter;
      lettersGrid.querySelectorAll('.cv-build-tile').forEach(function (b) {
        b.classList.toggle('selected', b === btn);
      });
      tryBuild();
    }
    function setSelectedVowel(vid, btn) {
      if (state.locked) return;
      state.selectedVowel = vid;
      vowelsGrid.querySelectorAll('.cv-build-tile').forEach(function (b) {
        b.classList.toggle('selected', b === btn);
      });
      tryBuild();
    }

    function tryBuild() {
      const display = document.getElementById('cvBuildDisplay');
      const result = document.getElementById('cvBuildResult');
      const anchor = document.getElementById('cvBuildAnchor');

      if (!state.selectedLetter && !state.selectedVowel) {
        result.textContent = '— —';
        anchor.textContent = '';
        display.classList.remove('built');
        return;
      }
      if (!state.selectedLetter) {
        const v = VA.getVowelById(state.selectedVowel);
        result.innerHTML = '<span class="cv-build-result__placeholder">?</span>' + (v ? v.symbol : '');
        anchor.textContent = 'בַּחֲרוּ אוֹת';
        display.classList.remove('built');
        return;
      }
      if (!state.selectedVowel) {
        result.innerHTML = state.selectedLetter + '<span class="cv-build-result__placeholder">?</span>';
        anchor.textContent = 'בַּחֲרוּ נִיקּוּד';
        display.classList.remove('built');
        return;
      }

      // בנוי במלואו — בדוק עם target
      const cv = VA.buildCV(state.selectedLetter, state.selectedVowel);
      result.textContent = cv;
      state.lastBuiltCV = cv;
      state.attempts++;

      const correct = isCorrectBuild(state.selectedLetter, state.selectedVowel);
      const t = currentTarget();

      // log event
      if (window.AvneiEventLogger && typeof window.AvneiEventLogger.logActivityResult === 'function') {
        try {
          window.AvneiEventLogger.logActivityResult({
            activity_type: 'cv-build-task',
            target_letter: t.letter,
            target_vowel: t.vowelId,
            target_cv: VA.buildCV(t.letter, t.vowelId),
            target_phoneme_group: VA.getPhonemeGroup(t.vowelId),
            tapped_vowel: state.selectedVowel,
            tapped_cv: cv,
            built_letter: state.selectedLetter,
            item_id: 'isl04-build-trial-' + (state.trial + 1),
            supportLevel: 1,
            is_correct: correct,
            attempts: state.attempts,
            response_time_ms: null,
            hint_used: state.attempts >= 2,
            primary_island_id: 4,
            secondary_island_ids: [3],
          });
        } catch (e) {}
      }

      if (correct) {
        // celebration: fish sings + anchor word + audio + advance
        display.classList.add('built');
        const audioKey = VA.cvAudioKey(state.selectedLetter, state.selectedVowel);
        if (audioKey) playKey(audioKey);
        const anchorWord = VA.getAnchorWord(state.selectedLetter, state.selectedVowel);
        if (anchorWord) {
          anchor.innerHTML = cv + ' = <strong>' + anchorWord + '</strong> ✓';
        } else {
          anchor.innerHTML = '<strong>כל הכבוד!</strong> ✓';
        }

        state.locked = true;
        if (typeof opts.onUnitWon === 'function') opts.onUnitWon(state.trial);
        state.trial++;

        if (state.trial >= numTrials) {
          // סיום — completion
          setTimeout(function () {
            if (typeof opts.onComplete === 'function') opts.onComplete();
          }, 1500);
          return;
        }

        // המשך ל-trial הבא אחרי 1500ms
        setTimeout(function () {
          state.locked = false;
          state.attempts = 0;
          state.scaffoldLevel = 0;   // reset ל-Tier 0 (audio-only) בכל trial חדש
          clearSelection();
          renderTarget();
        }, 1500);
      } else {
        // wrong build — soft feedback (no harsh red).
        // 3-tier scaffolding לפי attempt count:
        //   attempt 1: רק "נסי שוב" + השמע target. אין שינוי visual.
        //   attempt 2: עלייה ל-Tier 1 — חשיפת האות בלבד. השמע target.
        //   attempt 3+: עלייה ל-Tier 2 — חשיפת ה-CV המלא. השמע target.
        display.classList.remove('built');

        if (state.attempts >= 3 && state.scaffoldLevel < 2) {
          state.scaffoldLevel = 2;
          anchor.innerHTML = '<strong>הִנֵּה הַצֵּרוּף — הַעְתִּיקוּ</strong>';
        } else if (state.attempts >= 2 && state.scaffoldLevel < 1) {
          state.scaffoldLevel = 1;
          anchor.innerHTML = '<strong>הָאוֹת הִיא ' + t.letter + '</strong> — בַּחֲרוּ נִיקּוּד';
        } else {
          anchor.textContent = 'לֹא בְּדִיּוּק — נַסּוּ שׁוּב';
        }

        // re-render target visual לפי scaffold level חדש
        if (state.scaffoldLevel > 0) {
          renderTargetVisualOnly();
        }
        // השמע את ה-target שוב כעזר אחרי 500ms
        setTimeout(function () {
          const k = VA.cvAudioKey(t.letter, t.vowelId);
          if (k) playKey(k);
        }, 500);
      }
    }

    // Wire events
    lettersGrid.querySelectorAll('.cv-build-tile').forEach(function (btn) {
      btn.addEventListener('click', function () { setSelectedLetter(btn.dataset.letter, btn); });
    });
    vowelsGrid.querySelectorAll('.cv-build-tile').forEach(function (btn) {
      btn.addEventListener('click', function () { setSelectedVowel(btn.dataset.vowel, btn); });
    });
    // הקלקה על ה-target (🔊 או אות או CV) משמיעה את הצליל שוב
    document.getElementById('cvBuildTarget').addEventListener('click', function () {
      const t = currentTarget();
      if (!t) return;
      const k = VA.cvAudioKey(t.letter, t.vowelId);
      if (k) playKey(k);
    });

    // Start first trial
    renderTarget();

    return {
      unmount: function () {
        root.innerHTML = '';
        root.classList.remove('mechanic-cv-build');
      },
    };
  }

  window.AvneiMechanics = window.AvneiMechanics || {};
  window.AvneiMechanics['cv-build'] = { mount: mount };
})();
