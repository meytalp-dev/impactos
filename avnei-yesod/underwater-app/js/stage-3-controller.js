// ============================================================
// stage-3-controller.js — תזמורת הזרימה באי 3
// אות → רצף פעילויות זמינות → bloom → אות הבאה → סיום אי
//
// MVP (23.5.2026):
//   אות מ: letterShapeA → letterShapeB → soundMatch → findLetter (3 פעילויות = 75% צמיחה)
//   אותיות ת/ר/ב/ק: soundMatch בלבד (100% צמיחה כי זו הפעילות היחידה הזמינה)
//   trace-path: דחוי עד אימות פדגוגי לכיווניות
//
// תלויות גלובליות (טעינה ב-stage-3.html לפי סדר):
//   state.js · audio · noni · feedback · scaffolding · event-logger · activities/*
// ============================================================

window.AvneiStage3 = (function() {

  const LETTER_SEQUENCE = ['ת', 'מ', 'ר', 'ב', 'ק'];
  const ISLAND_ID = 3;

  let _gameRoot = null;
  let _itemsByActivity = {
    soundMatch: null,
    letterShape: null,
    findLetter: null,
    tracePaths: null,
  };
  let _currentLetterIdx = 0;

  // ============================================================
  // טעינת data
  // ============================================================
  async function loadAllData() {
    const [items03, letterShape, findLetter, tracePaths] = await Promise.all([
      fetch('data/island-03-items.json').then(r => r.json()),
      fetch('data/island-03-letter-shape.json').then(r => r.json()).catch(() => ({ items: [] })),
      fetch('data/island-03-find-letter.json').then(r => r.json()).catch(() => ({ items: [] })),
      fetch('data/island-03-trace-paths.json').then(r => r.json()).catch(() => ({ letters: {} })),
    ]);
    _itemsByActivity.soundMatch  = items03.items || [];
    _itemsByActivity.letterShape = letterShape.items || [];
    _itemsByActivity.findLetter  = findLetter.items || [];
    _itemsByActivity.tracePaths  = tracePaths.letters || {};
  }

  // ============================================================
  // סינון פריטים לפי אות + פעילות
  // ============================================================
  function getItemsFor(activity, letter) {
    if (activity === 'soundMatch') {
      return (_itemsByActivity.soundMatch || []).filter(it => it.letter_in_focus === letter);
    }
    if (activity === 'letterShapeA') {
      return (_itemsByActivity.letterShape || []).filter(it =>
        it.letter === letter && it.variant === 'A'
      );
    }
    if (activity === 'letterShapeB') {
      return (_itemsByActivity.letterShape || []).filter(it =>
        it.letter === letter && it.variant === 'B'
      );
    }
    if (activity === 'findLetter') {
      return (_itemsByActivity.findLetter || []).filter(it => it.target_letter === letter);
    }
    if (activity === 'tracePath') {
      const td = (_itemsByActivity.tracePaths || {})[letter];
      // מחזיר רק אם יש paths תקפים — אחרת array ריק והפעילות תידלג
      if (!td || !Array.isArray(td.strokes) || td.strokes.length === 0) return [];
      const allValid = td.strokes.every(s =>
        typeof s.path_d === 'string' && s.path_d.trim().length > 0 && !s.path_d.includes('TBD')
      );
      return allValid ? [td] : [];
    }
    return [];
  }

  // ============================================================
  // הפעלת activity יחיד — עטיפת Promise
  // ============================================================
  function runActivity(letter, activityName, supportLevel) {
    return new Promise((resolve) => {
      let activity;
      let variant = null;

      if (activityName === 'soundMatch') {
        activity = window.AvneiSoundMatch;
      } else if (activityName === 'letterShapeA') {
        activity = window.AvneiLetterShape;
        variant = 'A';
      } else if (activityName === 'letterShapeB') {
        activity = window.AvneiLetterShape;
        variant = 'B';
      } else if (activityName === 'findLetter') {
        activity = window.AvneiFindLetter;
      } else if (activityName === 'tracePath') {
        activity = window.AvneiTracePath;
      }

      if (!activity) {
        console.warn('Activity not found:', activityName);
        return resolve({ skipped: true });
      }

      const items = getItemsFor(activityName, letter);
      if (items.length === 0) {
        console.warn(`No items for ${activityName} · letter ${letter} — skipping`);
        return resolve({ skipped: true });
      }

      activity.mount(_gameRoot, {
        letter,
        supportLevel,
        variant,
        items,
        onItemComplete: (result) => {
          // event log כבר מטופל ב-activity. כאן רק לקיים progress hook.
        },
        onActivityComplete: (summary) => {
          // רישום ב-state (מה שמשפיע על bloom)
          recordActivityComplete(letter, activityName, summary);
          activity.unmount();
          resolve(summary);
        },
      });
    });
  }

  // ============================================================
  // הצגת bloom של האות (אות פרחה)
  // יוצר overlay זמני עם האות הגדולה — לא תלוי במה ש-activity הותיר ב-DOM
  // ============================================================
  function showBloom(letter) {
    return new Promise((resolve) => {
      AvneiFeedback.show(`האות ${letter} פרחה`);
      AvneiNoni.setState('cheer');
      AvneiAudio.play('stage-done');

      const overlay = document.createElement('div');
      overlay.className = 'bloom-overlay';
      overlay.innerHTML = `
        <div class="bloom-letter">${letter}</div>
      `;
      document.body.appendChild(overlay);

      // קיק-אוף האנימציה
      requestAnimationFrame(() => overlay.classList.add('show'));

      setTimeout(() => {
        AvneiFeedback.hide();
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 400);
        resolve();
      }, 2200);
    });
  }

  // ============================================================
  // הרצת אות מלאה
  // ============================================================
  async function runLetter(letter) {
    let available = getAvailableActivities(letter);
    if (available.length === 0) {
      console.warn(`No available activities for letter ${letter}`);
      return;
    }

    // URL param ?activity=tracePath — להריץ רק פעילות אחת (לבדיקה)
    const params = new URLSearchParams(window.location.search);
    const onlyActivity = params.get('activity');
    if (onlyActivity && available.includes(onlyActivity)) {
      available = [onlyActivity];
    }

    const supportLevel = getCurrentSupportLevel(letter) || 1;

    for (const activityName of available) {
      // אם הפעילות כבר הושלמה — לדלג (אלא אם ?activity מצביע עליה ספציפית)
      if (!onlyActivity) {
        const prog = getLetterProgress(letter);
        if (prog.completedActivities.includes(activityName)) continue;
      }

      await runActivity(letter, activityName, supportLevel);
    }

    // בדיקה אם האות פרחה
    if (isLetterBloomed(letter)) {
      // teacher flags scan לסוף אות
      AvneiEventLogger.detectAndRecordFlags(letter);
      await showBloom(letter);
    }
  }

  // ============================================================
  // השלמת האי כולה
  // ============================================================
  function showCompletion() {
    completeStage(ISLAND_ID);
    addSouvenir('אלמוג אות זוהר');
    if (typeof addAquariumItem === 'function') {
      addAquariumItem(ISLAND_ID, 'letter-coral');
    }
    const completionEl = document.getElementById('completion');
    if (completionEl) {
      completionEl.classList.add('show');
      const msgEl = document.getElementById('completionMsg');
      if (msgEl) {
        msgEl.textContent = 'גן האותיות התמלא אור. נוני אסף עבורך אלמוג אות זוהר.';
      }
    }
    AvneiAudio.play(['all-done', 'all-done-2', 'all-done-3'][Math.floor(Math.random() * 3)]);
  }

  // ============================================================
  // הרצה ראשית
  // תומך ב-URL params לבדיקה:
  //   ?letter=מ        — מתחיל ישר מהאות הזו (משאיר אותיות קודמות ללא שינוי)
  //   ?only=מ          — רץ רק על האות הזו, מציג completion בסוף
  //   ?reset=1         — מאפס localStorage לפני הרצה (משלב נקי)
  // ============================================================
  async function run() {
    _gameRoot = document.getElementById('gameRoot');
    if (!_gameRoot) {
      console.error('gameRoot element not found');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === '1') {
      localStorage.removeItem('underwater-app:v1');
      console.log('localStorage reset.');
    }

    const startLetter = params.get('letter');
    const onlyLetter  = params.get('only');

    try {
      await loadAllData();
    } catch (e) {
      console.error('Failed to load data:', e);
      return;
    }

    AvneiNoni.ready();

    let sequence = LETTER_SEQUENCE;
    if (onlyLetter && LETTER_SEQUENCE.includes(onlyLetter)) {
      sequence = [onlyLetter];
    } else if (startLetter && LETTER_SEQUENCE.includes(startLetter)) {
      const startIdx = LETTER_SEQUENCE.indexOf(startLetter);
      sequence = LETTER_SEQUENCE.slice(startIdx);
    }

    for (let i = 0; i < sequence.length; i++) {
      _currentLetterIdx = i;
      const letter = sequence[i];
      updateProgressPill(letter, i + 1, sequence.length);
      await runLetter(letter);
    }

    showCompletion();
  }

  function updateProgressPill(letter, current, total) {
    const letterEl = document.getElementById('progressLetter');
    const countEl  = document.getElementById('progressCount');
    if (letterEl) letterEl.textContent = letter;
    if (countEl)  countEl.textContent  = current + '/' + total;
  }

  return { run };
})();
