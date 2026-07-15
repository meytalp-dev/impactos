#!/usr/bin/env node
// Regression: navigation and accessibility policies for Wave 4.

'use strict';
const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..');
const files = fs.readdirSync(appDir).filter(f => f.endsWith('.html'));
let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log('  ✓ ' + msg); }
  else { fail++; console.error('  ✗ FAIL: ' + msg); process.exitCode = 1; }
}

files.forEach(file => {
  const src = fs.readFileSync(path.join(appDir, file), 'utf8');
  assert(!/maximum-scale\s*=\s*1/i.test(src), file + ' does not block pinch zoom with maximum-scale');
  assert(!/user-scalable\s*=\s*no/i.test(src), file + ' does not block pinch zoom with user-scalable=no');
});

const rama = fs.readFileSync(path.join(appDir, 'teacher-rama.html'), 'utf8');
assert(rama.includes('history.back()'), 'teacher-rama exit uses history.back() when possible');
assert(!/location\.href\s*=\s*['"]map\.html['"]/.test(rama), 'teacher-rama exit does not force map.html');
assert(rama.includes('teacher-dashboard.html'), 'teacher-rama exit fallback returns to teacher dashboard');

const curriculum = fs.readFileSync(path.join(appDir, 'teacher-curriculum.html'), 'utf8');
assert(/<button[^>]+class="rm"/.test(curriculum), 'teacher-curriculum topic remove control is a button');
assert(/aria-label="[^"]*"/.test(curriculum), 'teacher-curriculum remove button has aria-label');
assert(!/<span class="rm"/.test(curriculum), 'teacher-curriculum no longer uses span.rm as clickable remove');

console.log('\nTotal: ' + (pass + fail) + ' · pass=' + pass + ' · fail=' + fail);
process.exit(fail > 0 ? 1 : 0);
