/* ============================================================
   מישמיש — audio.js  →  window.MishmishAudio
   ------------------------------------------------------------
   שכבת-אודיו. יעד = עברית (he-IL). פיגום/עמית = ערבית — מגודר
   עד אימות בודק ילידי (MishmishAudio.arabic לא מנגן כברירת-מחדל).
   סדר-עדיפות לכל השמעה:
     1. קליפ מוקלט (clipMap → assets/audio/<key>.mp3)  [ElevenLabs בעתיד]
     2. Web Speech API (he-IL)                          [גיבוי חי]
     3. no-op שקט + אירוע 'error'                        [ללא TTS]
   מבוסס על lumi/app/js/audio.js (seam של clipMap).
   ============================================================ */
window.MishmishAudio = (function () {
  var ARABIC_VERIFIED = false;              // 🔴 נעול עד בודק ילידי
  var AUDIO_BASE = '../assets/audio/';       // קליפים מוקלטים (עתידי)
  var clipMap = {};                          // key → filename.mp3 (יתמלא כשיוקלט)
  var current = null;

  var synth = (typeof window !== 'undefined' && window.speechSynthesis) || null;

  function stop() {
    if (current && current.pause) { try { current.pause(); } catch (e) {} }
    current = null;
    if (synth) { try { synth.cancel(); } catch (e) {} }
  }

  function emit(el, name) {
    if (el) el.dispatchEvent(new CustomEvent('mishmish-audio-' + name));
  }

  // ניגון קליפ מוקלט אם קיים במפה
  function playClip(key) {
    var file = clipMap[key];
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

  // הפעלה כללית: clip → TTS → error
  function play(opts) {
    stop();
    var key = opts.key, text = opts.text, lang = opts.lang, rate = opts.rate, statusEl = opts.statusEl;
    if (statusEl) statusEl.setAttribute('data-audio', 'playing');

    function done() { if (statusEl) statusEl.setAttribute('data-audio', 'idle'); }
    function fail() { if (statusEl) statusEl.setAttribute('data-audio', 'error'); }

    var clip = key && playClip(key);
    if (clip) { return clip.then(done).catch(function () { return speak(text, lang, rate).then(done).catch(fail); }); }
    return speak(text, lang, rate).then(done).catch(fail);
  }

  return {
    ARABIC_VERIFIED: ARABIC_VERIFIED,
    setClipMap: function (m) { clipMap = m || {}; },
    stop: stop,

    /* יעד — עברית. text = הטקסט המנוקד (או ללא ניקוד ל-TTS). */
    hebrew: function (text, opts) {
      opts = opts || {};
      return play({ key: opts.key, text: text, lang: 'he-IL', rate: opts.slow ? 0.62 : 0.9, statusEl: opts.statusEl });
    },

    /* פיגום/עמית — ערבית. מגודר: לא מנגן עד ARABIC_VERIFIED === true. */
    arabic: function (text, opts) {
      if (!ARABIC_VERIFIED) { return Promise.resolve('gated'); }
      opts = opts || {};
      return play({ key: opts.key, text: text, lang: 'ar', rate: opts.slow ? 0.6 : 0.85, statusEl: opts.statusEl });
    }
  };
})();
