// ============================================================
// shared/audio.js — English TTS via Web Speech API (en-US)
// Replaces the Hebrew MP3-cache engine from avnei-yesod.
// Exposed as window.AvneiAudio for backwards compatibility with
// any legacy stage-*.html files; new student.html should call
// the same API.
// ============================================================

window.AvneiAudio = (function() {

  const LANG = 'en-US';
  const DEFAULT_RATE = 0.9;   // slightly slow for A1 learners
  const DEFAULT_PITCH = 1.0;
  const DEFAULT_VOLUME = 1.0;

  let preferredVoice = null;
  let voicesReady = false;
  let unlocked = false;

  const synth = (typeof window !== 'undefined' && window.speechSynthesis) || null;

  function pickVoice(voices) {
    if (!voices || !voices.length) return null;
    const en = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
    if (!en.length) return null;

    const preferredNames = [
      // Modern, natural-sounding voices in major browsers
      'Google US English',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Samantha',
      'Karen',
    ];
    for (const name of preferredNames) {
      const found = en.find(v => v.name === name);
      if (found) return found;
    }
    const usFemale = en.find(v => v.lang === 'en-US' && /female|aria|jenny|samantha/i.test(v.name));
    if (usFemale) return usFemale;
    const us = en.find(v => v.lang === 'en-US');
    return us || en[0];
  }

  function refreshVoices() {
    if (!synth) return;
    const voices = synth.getVoices();
    if (voices && voices.length) {
      preferredVoice = pickVoice(voices);
      voicesReady = true;
      if (!window.__avneiAudioLogged) {
        const englishVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
        console.log('[audio]', voices.length, 'voices total ·', englishVoices.length, 'English ·',
                    'picked:', preferredVoice ? `${preferredVoice.name} (${preferredVoice.lang})` : 'NONE (browser default)');
        if (englishVoices.length === 0) {
          console.warn('[audio] No English voices installed on this system. Speech may use a non-English voice or be silent.');
        }
        window.__avneiAudioLogged = true;
      }
    }
  }

  if (synth) {
    refreshVoices();
    if (typeof synth.onvoiceschanged !== 'undefined') {
      synth.onvoiceschanged = refreshVoices;
    }
  }

  function ensureVoiceThen(fn) {
    if (voicesReady || !synth) return fn();
    refreshVoices();
    if (voicesReady) return fn();
    // Some browsers populate asynchronously; wait briefly.
    setTimeout(() => { refreshVoices(); fn(); }, 100);
  }

  function makeUtterance(text, opts) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = (opts && opts.lang) || LANG;
    u.rate = (opts && typeof opts.rate === 'number') ? opts.rate : DEFAULT_RATE;
    u.pitch = (opts && typeof opts.pitch === 'number') ? opts.pitch : DEFAULT_PITCH;
    u.volume = (opts && typeof opts.volume === 'number') ? opts.volume : DEFAULT_VOLUME;
    if (preferredVoice) u.voice = preferredVoice;
    return u;
  }

  // Main entry: speak arbitrary English text.
  // Returns a Promise resolved when speech ends (or rejected on error).
  function speak(text, opts) {
    if (!synth || !text) return Promise.resolve();
    return new Promise((resolve) => {
      ensureVoiceThen(() => {
        try {
          synth.cancel();
          const u = makeUtterance(text, opts);
          u.onend = () => resolve();
          u.onerror = (e) => { console.warn('TTS error:', e); resolve(); };
          synth.speak(u);
        } catch (e) {
          console.warn('TTS exception:', e);
          resolve();
        }
      });
    });
  }

  // Legacy alias kept for stage-*.html files. `key` is treated as
  // English text to speak (the old Hebrew letter→MP3 map is dropped).
  function play(key) {
    return speak(key);
  }

  // Sequence: speak each text item, waiting between each.
  function playSequence(items, delay = 400) {
    if (!Array.isArray(items) || !items.length) return Promise.resolve();
    return items.reduce((p, txt) => {
      return p.then(() => speak(txt))
              .then(() => new Promise(r => setTimeout(r, delay)));
    }, Promise.resolve());
  }

  // No-op compatibility shims for the old Hebrew helpers.
  // Keep the same signature so legacy code does not throw,
  // but route to speak() with the raw argument if present.
  function playLetterSound(letter)       { return speak(letter); }
  function playLetterName(letter)        { return speak(letter); }
  function playFindSoundPrompt(letter)   { return speak(letter); }

  // Unlock: prime the synth on first user gesture (iOS Safari requires
  // a user-initiated speak() before later programmatic calls work).
  function unlock() {
    if (!synth) return;
    try {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      synth.speak(u);
    } catch (e) {}
    unlocked = true;
  }

  function isUnlocked() { return unlocked; }
  function stop() { if (synth) synth.cancel(); }
  function setRate(r) { /* applied per-call via opts; kept as no-op for API parity */ }

  // Empty maps kept on the public surface so legacy code that
  // checks `AvneiAudio.LETTER_TO_SOUND_FILE[x]` does not crash.
  const LETTER_TO_SOUND_FILE = {};
  const LETTER_TO_NAME_FILE = {};
  const LETTER_TO_FIND_SOUND_PROMPT = {};

  return {
    // English-native API (preferred for new code)
    speak,
    stop,
    setRate,

    // Legacy-shape API (for backwards compatibility)
    play,
    playSequence,
    playLetterSound,
    playLetterName,
    playFindSoundPrompt,
    preload: () => null,
    unlock,
    isUnlocked,
    LETTER_TO_SOUND_FILE,
    LETTER_TO_NAME_FILE,
    LETTER_TO_FIND_SOUND_PROMPT,
  };
})();
