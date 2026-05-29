/**
 * mastery.js — מערכת רכישת מילים לאי 1 (אבני יסוד)
 *
 * עוקבת אילו מילים הילדה רכשה (= הצליחה בלי טעויות) בכל משחקון,
 * ובוחרת את המילה הבאה לפי 4 דרגות עדיפות:
 *
 *   1. attempted-elsewhere — נוסתה במשחקון אחר אבל לא נרכשה → לחזק
 *   2. brand-new           — מילה חדשה שטרם נראתה בשום משחקון
 *   3. mastered-elsewhere  — נרכשה במשחקון אחר אבל לא בזה → לאתגר
 *   4. mastered-here       — נרכשה כאן (רק אם נגמרו כל האחרות)
 *
 * אחסון: localStorage תחת 'avnei-yesod-island1-mastery'
 *
 * שימוש במשחקון:
 *   // בהתחלה:
 *   const word = window.AvneiMastery.pickWord('bubbleRise', WORDS);
 *
 *   // בסוף מילה:
 *   window.AvneiMastery.recordResult(currentWord.id, 'bubbleRise', wordMistakeTotal);
 *
 *   // למורה (בעתיד):
 *   const data = window.AvneiMastery.getMastery();
 */
(function () {
  const MASTERY_KEY = 'avnei-yesod-island1-mastery';

  function getMastery() {
    try {
      return JSON.parse(localStorage.getItem(MASTERY_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveMastery(data) {
    try {
      localStorage.setItem(MASTERY_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('mastery save failed:', e);
    }
  }

  /**
   * Records the result of a word attempt.
   * mistakes === 0 → 'mastered', else 'attempted'.
   * Once 'mastered', never downgrades back to 'attempted'.
   */
  function recordResult(wordId, gameId, mistakes) {
    const mastery = getMastery();
    if (!mastery[wordId]) mastery[wordId] = {};
    const newStatus = mistakes === 0 ? 'mastered' : 'attempted';
    const currentStatus = mastery[wordId][gameId];
    if (currentStatus === 'mastered') return; // don't downgrade
    mastery[wordId][gameId] = newStatus;
    saveMastery(mastery);
  }

  /**
   * Picks the next word for `gameId` from `words`, using mastery priorities.
   * Returns one word object (random within the highest-priority non-empty bucket).
   */
  function pickWord(gameId, words) {
    if (!words || words.length === 0) return null;
    const mastery = getMastery();

    const attemptedElsewhere = []; // tried in OTHER games, not all mastered
    const brandNew = [];           // never seen anywhere
    const masteredElsewhere = [];  // mastered in OTHER games but not in THIS
    const masteredHere = [];       // already mastered in THIS game

    for (const word of words) {
      const wm = mastery[word.id] || {};
      const thisStatus = wm[gameId];

      if (thisStatus === 'mastered') {
        masteredHere.push(word);
        continue;
      }

      const otherGameStatuses = Object.entries(wm)
        .filter(([g]) => g !== gameId)
        .map(([, s]) => s);

      if (otherGameStatuses.length === 0) {
        brandNew.push(word);
        continue;
      }

      const allOtherMastered = otherGameStatuses.every(s => s === 'mastered');
      if (allOtherMastered) {
        masteredElsewhere.push(word);
      } else {
        attemptedElsewhere.push(word);
      }
    }

    const priorityBuckets = [
      { name: 'attempted-elsewhere', items: attemptedElsewhere },
      { name: 'brand-new',           items: brandNew },
      { name: 'mastered-elsewhere',  items: masteredElsewhere },
      { name: 'mastered-here',       items: masteredHere },
    ];

    for (const bucket of priorityBuckets) {
      if (bucket.items.length > 0) {
        const w = bucket.items[Math.floor(Math.random() * bucket.items.length)];
        console.log(`[mastery] picked "${w.id}" from bucket "${bucket.name}" (${bucket.items.length} candidates)`);
        return w;
      }
    }

    // fallback (shouldn't reach here)
    return words[Math.floor(Math.random() * words.length)];
  }

  /** Clears all mastery — for testing or "reset progress" button */
  function resetMastery() {
    try {
      localStorage.removeItem(MASTERY_KEY);
    } catch (e) {}
  }

  window.AvneiMastery = { getMastery, recordResult, pickWord, resetMastery };
})();
