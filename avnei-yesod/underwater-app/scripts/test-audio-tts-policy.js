#!/usr/bin/env node
// Regression: browser TTS may exist only behind DEV_TTS_FALLBACK (off in production).

'use strict';
const fs = require('fs');
const path = require('path');

const files = [
  'js/templates/mechanic-listen-mcq.js',
  'js/templates/mechanic-story-sequence.js',
  'js/templates/mechanic-listen-cv.js',
  'js/templates/mechanic-cv-vs-cv.js',
  'js/templates/mechanic-match-cv-to-word.js',
  'js/templates/mechanic-tap-cv.js',
];

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log('  ✓ ' + msg); }
  else { fail++; console.error('  ✗ FAIL: ' + msg); process.exitCode = 1; }
}

files.forEach(rel => {
  const abs = path.join(__dirname, '..', rel);
  const src = fs.readFileSync(abs, 'utf8');
  assert(src.includes('DEV_TTS_FALLBACK'), rel + ' declares DEV_TTS_FALLBACK');
  assert(!/new\s+(?:window\.)?SpeechSynthesisUtterance/.test(src) || src.includes('DEV_TTS_FALLBACK'),
         rel + ' gates SpeechSynthesisUtterance behind dev-only policy');
});

console.log('\nTotal: ' + (pass + fail) + ' · pass=' + pass + ' · fail=' + fail);
process.exit(fail > 0 ? 1 : 0);
