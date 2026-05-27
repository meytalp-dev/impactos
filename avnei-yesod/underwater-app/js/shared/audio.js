// ============================================================
// shared/audio.js — מודול שמע מרכזי
// MP3 cache · single playback · sequence playback
// חולץ מ-stage-3.html v0.1 (23.5.2026)
// ============================================================

window.AvneiAudio = (function() {

  let currentAudio = null;
  const audioCache = new Map();
  let unlocked = false;

  // מיפוי אות → שם קובץ צליל (לא שם אות)
  // הורחב 27.5.2026 ל-22 אותיות כדי לתמוך בתבנית D.14 (כל קבצי sound-X.mp3
  // קיימים ב-AvriNeural מעוצמת המאגר הקיים — לא נוצרו קבצים חדשים כאן)
  const LETTER_TO_SOUND_FILE = {
    'א': 'sound-alef',  'ב': 'sound-bet',   'ג': 'sound-gimel', 'ד': 'sound-dalet',
    'ה': 'sound-hey',   'ו': 'sound-vav',   'ז': 'sound-zayin', 'ח': 'sound-het',
    'ט': 'sound-tet',   'י': 'sound-yud',   'כ': 'sound-kaf',   'ל': 'sound-lamed',
    'מ': 'sound-mem',   'נ': 'sound-nun',   'ס': 'sound-samekh','ע': 'sound-ayin',
    'פ': 'sound-pey',   'צ': 'sound-tzadi', 'ק': 'sound-qof',   'ר': 'sound-resh',
    'ש': 'sound-shin',  'ת': 'sound-tav'
  };

  // מיפוי אות → שם קובץ שם-אות (לוריאציה B של letter-shape)
  const LETTER_TO_NAME_FILE = {
    'ת': 'name-tav', 'מ': 'name-mem', 'ר': 'name-resh',
    'ב': 'name-bet', 'ק': 'name-qof'
  };

  // מיפוי אות → שאלת sound-match המלאה ("איזו תמונה מתחילה בצליל...")
  const LETTER_TO_FIND_SOUND_PROMPT = {
    'ת': 'find-sound-tav', 'מ': 'find-sound-mem', 'ר': 'find-sound-resh',
    'ב': 'find-sound-bet', 'ק': 'find-sound-qof'
  };

  function preload(key) {
    if (audioCache.has(key)) return audioCache.get(key);
    const a = new Audio();
    a.preload = 'auto';
    a.src = 'assets/audio/' + encodeURIComponent(key) + '.mp3';
    audioCache.set(key, a);
    return a;
  }

  function play(key) {
    if (!key) return Promise.resolve();
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      const a = preload(key);
      currentAudio = a;
      a.currentTime = 0;
      return a.play().catch(err => {
        console.warn('Audio fail:', key, err);
      });
    } catch (e) {
      console.warn('playAudio error:', e);
      return Promise.resolve();
    }
  }

  function playSequence(keys, delay = 800) {
    let i = 0;
    const next = () => {
      if (i >= keys.length) return;
      const k = keys[i++];
      if (!k) return next();
      const a = preload(k);
      a.currentTime = 0;
      a.onended = () => setTimeout(next, delay);
      a.onerror = () => setTimeout(next, delay);
      a.play().catch(() => setTimeout(next, delay));
      currentAudio = a;
    };
    next();
  }

  // מקריא את הצליל (לא שם) של האות
  function playLetterSound(letter) {
    const fn = LETTER_TO_SOUND_FILE[letter];
    if (fn) return play(fn);
    return Promise.resolve();
  }

  // מקריא את שם האות (לוריאציה B)
  function playLetterName(letter) {
    const fn = LETTER_TO_NAME_FILE[letter];
    if (fn) return play(fn);
    return Promise.resolve();
  }

  // מקריא את שאלת sound-match המלאה
  // ("איזו תמונה מתחילה בצליל מ?") במקום רק את הצליל
  function playFindSoundPrompt(letter) {
    const fn = LETTER_TO_FIND_SOUND_PROMPT[letter];
    if (fn) return play(fn);
    return Promise.resolve();
  }

  // משחרר אודיו על iOS/Safari ע"י השמעת קובץ WAV שקט (ללא נתונים)
  // (במקום sound-tav עם volume=0 שהיה זולג לאוזניים — באג שזוהה 23.5.2026)
  const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  function unlock() {
    try {
      const u = new Audio(SILENT_WAV);
      u.play().catch(() => {});
    } catch (e) {}
    unlocked = true;
  }

  function isUnlocked() { return unlocked; }

  return {
    preload, play, playSequence,
    playLetterSound, playLetterName, playFindSoundPrompt,
    unlock, isUnlocked,
    LETTER_TO_SOUND_FILE, LETTER_TO_NAME_FILE, LETTER_TO_FIND_SOUND_PROMPT,
  };
})();
