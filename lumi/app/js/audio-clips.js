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
    'happy': 'happy', 'sad': 'sad', 'scared': 'scared',
    'tired': 'tired', 'surprised': 'surprised', 'okay': 'okay',   // emotions (T3 · Find the Feeling)
    'I\'m happy!': 'im-happy', 'I\'m sad!': 'im-sad', 'I\'m scared!': 'im-scared',
    'I\'m tired!': 'im-tired', 'I\'m surprised!': 'im-surprised', 'I\'m okay!': 'im-okay',   // "I'm ___" chunk
    'red': 'red', 'blue': 'blue', 'yellow': 'yellow', 'green': 'green', 'orange': 'orange',
    'purple': 'purple', 'pink': 'pink', 'black': 'black', 'white': 'white', 'brown': 'brown',   // colors (T4 · Color the Grove)
    'one': 'one', 'two': 'two', 'three': 'three', 'four': 'four', 'five': 'five',
    'six': 'six', 'seven': 'seven', 'eight': 'eight', 'nine': 'nine', 'ten': 'ten',   // numbers (T5 · Count the Lanterns)
    'Go!': 'go', 'Stop!': 'stop', 'Come!': 'come', 'Jump!': 'jump',
    'Look!': 'look', 'Listen!': 'listen', 'Point!': 'point',
    'Say it!': 'say-it', 'Find it!': 'find-it', 'Touch it!': 'touch-it',   // action & instruction (T6 · Lumi Says)
    'You did it!': 'you-did-it',
    'You found it!': 'praise',
    'Let’s listen again': 'listen-again',   // curly apostrophe — matches _measured-core
    'Let\'s listen again': 'listen-again',        // straight apostrophe fallback
    // greetings & friends (T7 · Lantern of Hello) — keyed to the exact strings the
    // meet/produce mechanics speak. Both the display phrase ("Hello!") and the bare
    // target word ("hello", used by produce/recognize) map to the same recorded clip.
    'Hello!': 'hello', 'hello': 'hello',
    'Hi!': 'hi', 'hi': 'hi',
    'Bye!': 'bye', 'bye': 'bye',
    'Please!': 'please', 'please': 'please',
    'Thank you!': 'thankyou', 'thank you': 'thankyou',
    'Yes!': 'yes', 'yes': 'yes',
    'No!': 'no', 'no': 'no',
    'Sorry!': 'sorry', 'sorry': 'sorry',
    'Hi there!': 'hi-there',
    'Bye-bye!': 'bye-bye',
    'Yes, please!': 'yes-please',
    'Thank you so much!': 'thankyou-much',
    'No, thank you.': 'no-thankyou',
    'I\'m sorry.': 'greet-im-sorry',
    'my name is': 'greet-myname', 'Hello! My name is…': 'greet-myname', 'Hello! My name is...': 'greet-myname',
    'Nice!': 'nice',
    'Nice to meet you!': 'nice-meet',
    // face (T10 · Light Up the Face) — bare part word (recognize/discriminate),
    // the "Touch your ___." TPR chunk (comprehend), and the "This is my ___" mirror chunk.
    'eyes': 'eyes', 'nose': 'nose', 'mouth': 'mouth', 'ears': 'ears',
    'Touch your eyes.': 'touch-eyes', 'Touch your nose.': 'touch-nose',
    'Touch your mouth.': 'touch-mouth', 'Touch your ears.': 'touch-ears',
    'These are my eyes!': 'chunk-eyes', 'This is my nose!': 'chunk-nose',
    'This is my mouth!': 'chunk-mouth', 'These are my ears!': 'chunk-ears',
    // fruits (T8 · The Fruit Basket) — 'orange' already mapped above (shared w/ T4).
    'apple': 'apple', 'banana': 'banana',
    'I want an apple.': 'iwant-apple', 'I want a banana.': 'iwant-banana', 'I want an orange.': 'iwant-orange',
  };
  Object.keys(clips).forEach(function (text) {
    LumiAudio.clipMap[text] = base + clips[text] + '.mp3';
  });
})();
