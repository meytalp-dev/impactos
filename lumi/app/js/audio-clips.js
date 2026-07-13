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
    'You found it!': 'praise',
    'Let’s listen again': 'listen-again',   // curly apostrophe — matches _measured-core
    'Let\'s listen again': 'listen-again',        // straight apostrophe fallback
  };
  Object.keys(clips).forEach(function (text) {
    LumiAudio.clipMap[text] = base + clips[text] + '.mp3';
  });
})();
