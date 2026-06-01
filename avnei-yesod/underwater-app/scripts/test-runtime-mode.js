// ============================================================
// test-runtime-mode.js — Cloud/Demo mode detection (1.6.2026)
//
// מאמת:
//   1. ללא URL params → 'cloud' (production default)
//   2. ?presentation=1 → 'demo' (PIN bypass / client demos)
//   3. ?guest=1        → 'demo' (no-account access)
//   4. ?skip-picker=1  → 'demo' (pilot direct access)
//   5. params אחרים (?foo=1) → 'cloud' (לא ה-trigger)
//   6. שילוב params (?presentation=1&foo=1) → 'demo'
//   7. redetect() אחרי שינוי URL
//
// הרצה:
//   node avnei-yesod/underwater-app/scripts/test-runtime-mode.js
// ============================================================

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.log(`  ✗ ${message}`);
  }
}

function test(name, fn) {
  console.log(`\n=== ${name} ===`);
  try {
    fn();
  } catch (e) {
    failed++;
    console.log(`  ✗ EXCEPTION: ${e.message}`);
  }
}

// Stub minimal window for the script
function setupWindow(searchString) {
  global.window = {
    location: { search: searchString },
    AvneiRuntimeMode: undefined,
  };
}

// Load runtime-mode.js as a script in our stubbed window
function loadRuntimeMode() {
  delete require.cache[require.resolve('../js/shared/runtime-mode.js')];
  // The script uses an IIFE that reads window.location and writes window.AvneiRuntimeMode
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'js', 'shared', 'runtime-mode.js'),
    'utf8'
  );
  // The IIFE references URLSearchParams (Node 18+ has it as global)
  const fn = new Function('window', 'URLSearchParams', 'module', src);
  fn(global.window, URLSearchParams, undefined);
  return global.window.AvneiRuntimeMode;
}

test('no params → cloud', () => {
  setupWindow('');
  const rm = loadRuntimeMode();
  assert(rm.current === 'cloud', `mode is 'cloud' (got '${rm.current}')`);
  assert(rm.isCloud === true, 'isCloud === true');
  assert(rm.isDemo === false, 'isDemo === false');
});

test('?presentation=1 → demo', () => {
  setupWindow('?presentation=1');
  const rm = loadRuntimeMode();
  assert(rm.current === 'demo', `mode is 'demo' (got '${rm.current}')`);
  assert(rm.isDemo === true, 'isDemo === true');
  assert(rm.isCloud === false, 'isCloud === false');
});

test('?guest=1 → demo', () => {
  setupWindow('?guest=1');
  const rm = loadRuntimeMode();
  assert(rm.current === 'demo', `mode is 'demo'`);
});

test('?skip-picker=1 → demo', () => {
  setupWindow('?skip-picker=1');
  const rm = loadRuntimeMode();
  assert(rm.current === 'demo', `mode is 'demo'`);
});

test('?foo=1 (unrelated) → cloud', () => {
  setupWindow('?foo=1');
  const rm = loadRuntimeMode();
  assert(rm.current === 'cloud', `mode is 'cloud' for unknown param`);
});

test('?presentation=1&foo=1 (combined) → demo', () => {
  setupWindow('?presentation=1&foo=1');
  const rm = loadRuntimeMode();
  assert(rm.current === 'demo', `demo takes precedence`);
});

test('?presentation=0 → demo (presence, not truthiness)', () => {
  setupWindow('?presentation=0');
  const rm = loadRuntimeMode();
  assert(rm.current === 'demo', `params.has() checks presence only`);
});

test('redetect after URL change', () => {
  setupWindow('');
  const rm = loadRuntimeMode();
  assert(rm.current === 'cloud', 'initially cloud');

  // Mutate location, redetect
  global.window.location.search = '?guest=1';
  const mode = rm.redetect();
  assert(mode === 'demo', `redetect returns 'demo'`);
  assert(rm.current === 'demo', `current updated to 'demo'`);
  assert(rm.isDemo === true, 'isDemo flipped to true');
});

console.log('\n' + '='.repeat(60));
console.log(`סיכום: ${passed} עברו · ${failed} נכשלו`);
console.log('='.repeat(60));
if (failed > 0) process.exit(1);
