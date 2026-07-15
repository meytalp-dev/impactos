#!/usr/bin/env node
// Regression: dashboard cloud loaders must not use a global events limit.

'use strict';
const fs = require('fs');
const path = require('path');

const files = [
  'js/shared/teacher-cloud.js',
  'js/shared/principal-cloud.js',
];

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log('  ✓ ' + msg); }
  else { fail++; console.error('  ✗ FAIL: ' + msg); process.exitCode = 1; }
}

files.forEach(rel => {
  const src = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  assert(!/\.limit\((3000|6000)\)/.test(src), rel + ' has no global events limit');
  assert(/\.range\(/.test(src), rel + ' paginates event reads with range()');
});

const teacher = fs.readFileSync(path.join(__dirname, '..', 'js/shared/teacher-cloud.js'), 'utf8');
assert(/evt\.client_timestamp\s*>=\s*weekAgo/.test(teacher),
       'teacher realtime weekCount checks client_timestamp against weekAgo');
assert(!/\n\s*p\.weekCount\+\+;/.test(teacher),
       'teacher realtime does not increment weekCount unconditionally');

console.log('\nTotal: ' + (pass + fail) + ' · pass=' + pass + ' · fail=' + fail);
process.exit(fail > 0 ? 1 : 0);
