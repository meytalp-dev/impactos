// ============================================================
// audio-clips.js — registers RECORDED clips (ElevenLabs, voice "Jessica" —
// warm/bright/playful young-American) into LumiAudio's clip seam, so the child
// hears a real voice instead of the browser's robotic TTS. Keyed by the exact
// text the mechanics pass to LumiAudio.english(...). Anything unmapped falls
// back to TTS automatically (see audio.js).
// ============================================================
(function () {
  'use strict';
  if (!window.LumiAudio || !LumiAudio.clipMap) return;
  var base = 'assets/audio/words/';
  var clips = {
    'dog': 'dog', 'cat': 'cat', 'fish': 'fish', 'bird': 'bird', 'rabbit': 'rabbit',
    'cow': 'cow', 'horse': 'horse', 'duck': 'duck', 'pig': 'pig', 'sheep': 'sheep',   // farm (T1)
    'lion': 'lion', 'elephant': 'elephant', 'monkey': 'monkey', 'bear': 'bear',   // wild (T2 · Safari Beam)
    'happy': 'happy', 'sad': 'sad', 'hungry': 'hungry',
    'tired': 'tired', 'scared': 'scared', 'okay': 'okay',   // emotions (T3 · Find the Feeling)
    'I\'m happy!': 'im-happy', 'I\'m sad!': 'im-sad', 'I\'m hungry!': 'im-hungry',
    'I\'m tired!': 'im-tired', 'I\'m scared!': 'im-scared', 'I\'m okay!': 'im-okay',   // "I'm ___" chunk
    'red': 'red', 'blue': 'blue', 'yellow': 'yellow', 'green': 'green', 'orange': 'orange',
    'purple': 'purple', 'pink': 'pink', 'black': 'black', 'white': 'white', 'brown': 'brown',   // colors (T4 · Color the Grove)
    'You found it!': 'praise',
    'Let’s listen again': 'listen-again',   // curly apostrophe — matches _measured-core
    'Let\'s listen again': 'listen-again',        // straight apostrophe fallback
  };
  Object.keys(clips).forEach(function (text) {
    LumiAudio.clipMap[text] = base + clips[text] + '.mp3';
  });
})();
