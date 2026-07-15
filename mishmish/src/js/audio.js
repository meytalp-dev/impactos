/* ============================================================
   מישמיש — audio.js  →  window.MishmishAudio
   ------------------------------------------------------------
   שכבת-אודיו דו-לשונית. יעד = עברית (he-IL, קול-מישמיש). פיגום/עמית =
   ערבית (קול-אמיר) — מגודר עד אימות בודק/ת ילידי/ת (arabic לא מנגן כברירת-מחדל).
   סדר-עדיפות לכל השמעה:
     1. קליפ מוקלט (clipMap → assets/audio/<rel>.mp3)  [ElevenLabs eleven_v3]
     2. Web Speech API (he-IL)                          [גיבוי חי, מותר עד F5]
     3. no-op שקט + אירוע 'error'                        [ללא TTS]

   שני מקורות ל-clipMap, ללא-דריסה הדדית:
     • manifestMap — נטען אוטומטית מ-assets/audio/manifest.json (מיוצר ע"י
       scripts/generate-mishmish-audio.py). http(s) בלבד — ב-file:// מדולג.
     • overrideMap — מ-setClipMap (דף מזין ידנית; קודם ל-manifest).
   הבחירה: overrideMap[key] || manifestMap[key]. כך play.js/admin.html שומרים
   קדימוּת, ודפים שלא קוראים setClipMap מקבלים את ה-manifest אוטומטית.
   מבוסס על lumi/app/js/audio.js (seam של clipMap).
   ============================================================ */
window.MishmishAudio = (function () {
  var ARABIC_VERIFIED = false;              // 🔴 נעול עד בודק/ת ילידי/ת
  var AUDIO_BASE = '../assets/audio/';       // קליפים מוקלטים (יחסי ל-src/*.html)
  // manifestMap — זרוע קודם מהגלובל המוטבע (MISHMISH_AUDIO_MANIFEST ב-data.js,
  // מיוצר ע"י _build-data.js) כדי לעבוד ב-file://. ב-http ה-fetch למטה מרענן.
  var manifestMap = (typeof window !== 'undefined' && window.MISHMISH_AUDIO_MANIFEST) || {};
  var overrideMap = {};                      // key → rel (מ-setClipMap, קודם)
  var current = null;

  var synth = (typeof window !== 'undefined' && window.speechSynthesis) || null;

  // ── טעינת-manifest אוטומטית (פעם אחת). http(s) בלבד — fetch על file:// נכשל
  //    ב-CORS, אז שם נשענים על setClipMap/TTS. play() ממתין ל-promise הזה כדי
  //    שקליפ מוקלט ינוצל ברגע שה-manifest זמין (בלי לשבור את החתימה — עדיין Promise). ──
  var manifestReady = (function () {
    try {
      var proto = (typeof location !== 'undefined' && location.protocol) || '';
      if (proto !== 'http:' && proto !== 'https:') return Promise.resolve();
      if (typeof fetch !== 'function') return Promise.resolve();
      return fetch(AUDIO_BASE + 'manifest.json')
        .then(function (r) { return r.ok ? r.json() : {}; })
        // מרעננים רק אם קיבלנו מפה לא-ריקה — אחרת שומרים על הזרע המוטבע (לא מוחקים אותו)
        .then(function (m) { if (m && typeof m === 'object' && Object.keys(m).length) manifestMap = m; })
        .catch(function () { /* אין manifest טרי → נשארים עם המוטבע/TTS */ });
    } catch (e) { return Promise.resolve(); }
  })();

  function fileFor(key) {
    if (!key) return null;
    return overrideMap[key] || manifestMap[key] || null;
  }

  function stop() {
    if (current && current.pause) { try { current.pause(); } catch (e) {} }
    current = null;
    if (synth) { try { synth.cancel(); } catch (e) {} }
  }

  function emit(el, name) {
    if (el) el.dispatchEvent(new CustomEvent('mishmish-audio-' + name));
  }

  // ניגון קליפ מוקלט אם קיים במפה (override קודם ל-manifest)
  function playClip(key) {
    var file = fileFor(key);
    if (!file) return null;
    var a = new Audio(AUDIO_BASE + file);
    current = a;
    return a.play().then(function () { return a; });
  }

  // TTS חי בשפה נתונה
  function speak(text, lang, rate) {
    return new Promise(function (resolve, reject) {
      if (!synth || typeof SpeechSynthesisUtterance === 'undefined') { reject('no-tts'); return; }
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate || 0.9;
      u.onend = function () { resolve(); };
      u.onerror = function () { reject('tts-error'); };
      synth.speak(u);
    });
  }

  // הפעלה כללית: (המתנה ל-manifest) → clip → TTS → error
  function play(opts) {
    stop();
    var key = opts.key, text = opts.text, lang = opts.lang, rate = opts.rate, statusEl = opts.statusEl;
    if (statusEl) statusEl.setAttribute('data-audio', 'playing');

    function done() { if (statusEl) statusEl.setAttribute('data-audio', 'idle'); }
    function fail() { if (statusEl) statusEl.setAttribute('data-audio', 'error'); }

    return manifestReady.then(function () {
      var clip = key && playClip(key);
      if (clip) { return clip.then(done).catch(function () { return speak(text, lang, rate).then(done).catch(fail); }); }
      return speak(text, lang, rate).then(done).catch(fail);
    });
  }

  return {
    ARABIC_VERIFIED: ARABIC_VERIFIED,
    // setClipMap — override פר-דף (קודם ל-manifest); לא דורס את ה-manifest האוטומטי.
    setClipMap: function (m) { overrideMap = m || {}; },
    // ready — Promise שנפתר כשה-manifest נטען (או דולג). לבדיקות/סנכרון בלבד.
    ready: function () { return manifestReady; },
    stop: stop,

    /* יעד — עברית (קול-מישמיש). text = הטקסט המנוקד (או ללא ניקוד ל-TTS). */
    hebrew: function (text, opts) {
      opts = opts || {};
      return play({ key: opts.key, text: text, lang: 'he-IL', rate: opts.slow ? 0.62 : 0.9, statusEl: opts.statusEl });
    },

    /* פיגום/עמית — ערבית (קול-אמיר). מגודר: לא מנגן עד ARABIC_VERIFIED === true. */
    arabic: function (text, opts) {
      if (!ARABIC_VERIFIED) { return Promise.resolve('gated'); }
      opts = opts || {};
      return play({ key: opts.key, text: text, lang: 'ar', rate: opts.slow ? 0.6 : 0.85, statusEl: opts.statusEl });
    }
  };
})();
