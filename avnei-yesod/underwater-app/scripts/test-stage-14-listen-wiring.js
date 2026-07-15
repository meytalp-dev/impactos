#!/usr/bin/env node
// Regression: stage-14 listening must report through event-logger/EPA, not only direct BKT.

'use strict';
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'stage-14-listen-and-answer.html'), 'utf8');
let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) { pass++; console.log('  ✓ ' + msg); }
  else { fail++; console.error('  ✗ FAIL: ' + msg); process.exitCode = 1; }
}

function indexOfScript(src) {
  return html.indexOf('src="' + src + '"');
}

const stateIdx = indexOfScript('js/state.js');
const bktIdx = indexOfScript('js/shared/bkt.js');
const epaIdx = indexOfScript('js/shared/epa.js');
const loggerIdx = indexOfScript('js/shared/event-logger.js');
const oralIdx = indexOfScript('js/shared/oral-skill-adapter.js');

assert(stateIdx >= 0, 'loads state.js');
assert(bktIdx >= 0, 'loads bkt.js');
assert(epaIdx >= 0, 'loads epa.js');
assert(loggerIdx >= 0, 'loads event-logger.js');
assert(oralIdx >= 0, 'loads oral-skill-adapter.js');
assert(stateIdx < bktIdx && bktIdx < epaIdx && epaIdx < loggerIdx && loggerIdx < oralIdx,
       'script order is state → bkt → epa → event-logger → oral-skill-adapter');

console.log('\nTotal: ' + (pass + fail) + ' · pass=' + pass + ' · fail=' + fail);
process.exit(fail > 0 ? 1 : 0);
