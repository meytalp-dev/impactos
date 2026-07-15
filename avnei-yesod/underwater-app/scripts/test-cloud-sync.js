// ============================================================
// test-cloud-sync.js — Cloud Sync Queue (1.6.2026)
//
// מאמת:
//   1. Demo mode → no-op stubs
//   2. Cloud mode + queueEvent → operation added to queue
//   3. Persistence — queue survives "reload"
//   4. queueAssessment → adds correct op type
//   5. flush() with successful RPC → queue drained
//   6. flush() with failing RPC → op stays, attempts++, backoff scheduled
//   7. flush() respects backoff (op with future next_attempt_at skipped)
//   8. queueEvent without student token → fails on flush
//   9. flush() doesn't block on one failing op
//  10. queueBktSync debounce — multiple calls → 1 op
//
// הרצה:
//   node avnei-yesod/underwater-app/scripts/test-cloud-sync.js
// ============================================================

const fs = require('fs');
const path = require('path');

// Capture original timer functions BEFORE any stubbing
const REAL_SET_TIMEOUT = global.setTimeout;
const REAL_CLEAR_TIMEOUT = global.clearTimeout;

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

async function test(name, fn) {
  console.log(`\n=== ${name} ===`);
  try {
    await fn();
  } catch (e) {
    failed++;
    console.log(`  ✗ EXCEPTION: ${e.message}`);
  }
}

const CLOUD_SYNC_SRC = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'shared', 'cloud-sync.js'),
  'utf8'
);

function makeLocalStorage() {
  const data = {};
  return {
    getItem: (k) => k in data ? data[k] : null,
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    _data: data,
  };
}

function setupCloud(opts = {}) {
  const ls = makeLocalStorage();
  const listeners = {};
  global.localStorage = ls;
  global.document = { visibilityState: 'visible', addEventListener: () => {} };
  global.window = {
    location: { search: '' },
    localStorage: ls,
    AvneiRuntimeMode: { current: 'cloud', isCloud: true, isDemo: false },
    AvneiCloudClient: {
      mode: 'cloud',
      supabase: {
        rpc: opts.rpc || (async () => ({ error: null, data: 'ok' })),
      },
      getStudentToken: opts.getToken || (() => 'test-token-abc'),
    },
    addEventListener: (name, fn) => { listeners[name] = fn; },
  };
  global.window._listeners = listeners;
}

function setupDemo() {
  const ls = makeLocalStorage();
  global.localStorage = ls;
  global.document = { visibilityState: 'visible', addEventListener: () => {} };
  global.window = {
    location: { search: '?guest=1' },
    localStorage: ls,
    AvneiRuntimeMode: { current: 'demo', isCloud: false, isDemo: true },
    AvneiCloudClient: { mode: 'demo', _stub: true },
    addEventListener: () => {},
  };
}

function loadCloudSync() {
  // Stub setInterval to a no-op so the background worker doesn't fire during tests.
  // Do NOT stub setTimeout — debounce needs the real one.
  const realSetInterval = global.setInterval;
  global.setInterval = () => 0;
  try {
    const fn = new Function('window', 'document', CLOUD_SYNC_SRC);
    fn(global.window, global.document);
    return global.window.AvneiCloudSync;
  } finally {
    global.setInterval = realSetInterval;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Tests — run sequentially in an async IIFE
// ──────────────────────────────────────────────────────────────────────────

(async () => {

  await test('Demo mode → stubs (no-op)', () => {
    setupDemo();
    const sync = loadCloudSync();
    assert(sync.mode === 'demo', 'mode is demo');
    assert(sync._stub === true, 'is stub');
    sync.queueEvent('item_answered', { x: 1 }, '2026-06-01T00:00:00Z');
    assert(sync.getQueueLength() === 0, 'queue unchanged in demo');
  });

  await test('Cloud mode + queueEvent → queue grows', () => {
    setupCloud();
    const sync = loadCloudSync();
    assert(sync.mode === 'cloud', 'mode is cloud');
    sync.queueEvent('item_answered', { correct: true }, '2026-06-01T10:00:00Z');
    assert(sync.getQueueLength() === 1, `queue has 1 op (got ${sync.getQueueLength()})`);
    sync.queueEvent('item_answered', { correct: false }, '2026-06-01T10:00:05Z');
    assert(sync.getQueueLength() === 2, `queue has 2 ops`);
  });

  await test('Persistence — queue survives "reload"', () => {
    setupCloud();
    let sync = loadCloudSync();
    sync.queueEvent('test_event', { a: 1 }, '2026-06-01T11:00:00Z');
    assert(sync.getQueueLength() === 1, 'queued 1 op');

    const stored = global.localStorage.getItem('avnei-yesod-cloud-sync-queue-v1');
    assert(stored !== null, 'queue persisted to localStorage');

    // Simulate reload: new window, new localStorage with same data
    const oldData = stored;
    setupCloud();
    global.localStorage.setItem('avnei-yesod-cloud-sync-queue-v1', oldData);
    sync = loadCloudSync();
    assert(sync.getQueueLength() === 1, 'queue restored after reload');
  });

  await test('queueAssessment → adds correct op type', () => {
    setupCloud();
    const sync = loadCloudSync();
    sync.queueAssessment('MOY', { score: 80 }, '2026-06-01T12:00:00Z');
    const q = JSON.parse(global.localStorage.getItem('avnei-yesod-cloud-sync-queue-v1'));
    assert(q.length === 1, 'one op in queue');
    assert(q[0].op === 'assessment', `op type is 'assessment' (got '${q[0].op}')`);
    assert(q[0].payload.assessment_type === 'MOY', 'assessment_type passed through');
  });

  await test('flush() with successful RPC → queue drained', async () => {
    let rpcCalls = 0;
    setupCloud({
      rpc: async () => { rpcCalls++; return { error: null, data: 'id' + rpcCalls }; },
    });
    const sync = loadCloudSync();
    sync.queueEvent('e1', {}, '2026-06-01T13:00:00Z');
    sync.queueEvent('e2', {}, '2026-06-01T13:00:01Z');
    assert(sync.getQueueLength() === 2, 'queued 2 ops');

    const result = await sync.flush();
    assert(result.flushed === 2, `flushed 2 (got ${result.flushed})`);
    assert(result.remaining === 0, `remaining 0 (got ${result.remaining})`);
    assert(rpcCalls === 2, `RPC called twice (got ${rpcCalls})`);
  });

  await test('flush() preserves ops enqueued while an RPC is in flight', async () => {
    let sync = null;
    let callCount = 0;
    setupCloud({
      rpc: async () => {
        callCount++;
        if (callCount === 1) {
          sync.queueEvent('during_flush', { marker: 'new' }, '2026-06-01T13:00:02Z');
        }
        return { error: null, data: 'ok' };
      },
    });
    sync = loadCloudSync();
    sync.queueEvent('before_flush', { marker: 'old' }, '2026-06-01T13:00:00Z');

    const result = await sync.flush();
    const q = JSON.parse(global.localStorage.getItem('avnei-yesod-cloud-sync-queue-v1'));
    assert(result.flushed === 1, `only original ready op flushed (got ${result.flushed})`);
    assert(q.length === 1, `new op survived in live queue (got ${q.length})`);
    assert(q[0].payload.event_type === 'during_flush', 'surviving op is the one enqueued during flush');
  });

  await test('queued ops are not sent under a different student token', async () => {
    let token = 'student-a';
    const rpcCalls = [];
    setupCloud({
      getToken: () => token,
      rpc: async (name, params) => {
        rpcCalls.push({ name, params });
        return { error: null, data: 'ok' };
      },
    });
    const sync = loadCloudSync();
    sync.queueEvent('student_a_event', { a: 1 }, '2026-06-01T13:10:00Z');
    token = 'student-b';

    const result = await sync.flush();
    const q = JSON.parse(global.localStorage.getItem('avnei-yesod-cloud-sync-queue-v1'));
    assert(result.flushed === 0, `nothing flushed after token switch (got ${result.flushed})`);
    assert(rpcCalls.length === 0, `RPC not called under wrong token (got ${rpcCalls.length})`);
    assert(q.length === 1, 'op remains queued for the original student');
    assert(q[0].studentToken === 'student-a', `op captured original token (got ${q[0].studentToken})`);
  });

  await test('flush() with failing RPC → op stays, attempts++', async () => {
    setupCloud({
      rpc: async () => ({ error: { message: 'simulated failure' }, data: null }),
    });
    const sync = loadCloudSync();
    sync.queueEvent('e1', {}, '2026-06-01T14:00:00Z');

    const result = await sync.flush();
    assert(result.flushed === 0, 'nothing flushed');
    assert(result.remaining === 1, 'op still in queue');

    const q = JSON.parse(global.localStorage.getItem('avnei-yesod-cloud-sync-queue-v1'));
    assert(q[0].attempts === 1, `attempts === 1 (got ${q[0].attempts})`);
    assert(q[0].next_attempt_at > Date.now(), 'next_attempt_at scheduled in future');
  });

  await test('flush() does not block on one failing op', async () => {
    let callCount = 0;
    setupCloud({
      rpc: async () => {
        callCount++;
        if (callCount === 1) return { error: { message: 'fail' }, data: null };
        return { error: null, data: 'ok' };
      },
    });
    const sync = loadCloudSync();
    sync.queueEvent('bad', {}, '2026-06-01T15:00:00Z');
    sync.queueEvent('good', {}, '2026-06-01T15:00:01Z');

    const result = await sync.flush();
    assert(result.flushed === 1, `flushed 1 (got ${result.flushed})`);
    assert(result.remaining === 1, `remaining 1 (the bad one, got ${result.remaining})`);

    const q = JSON.parse(global.localStorage.getItem('avnei-yesod-cloud-sync-queue-v1'));
    assert(q.length === 1, 'one op left');
    assert(q[0].payload.event_type === 'bad', 'the failing op stayed');
  });

  await test('flush() respects backoff (skips future next_attempt_at)', async () => {
    setupCloud();
    const sync = loadCloudSync();
    sync.queueEvent('e1', {}, '2026-06-01T16:00:00Z');

    // Manually set next_attempt_at in future
    const q = JSON.parse(global.localStorage.getItem('avnei-yesod-cloud-sync-queue-v1'));
    q[0].next_attempt_at = Date.now() + 60000;
    global.localStorage.setItem('avnei-yesod-cloud-sync-queue-v1', JSON.stringify(q));

    const result = await sync.flush();
    assert(result.flushed === 0, `skipped due to backoff (got flushed=${result.flushed})`);
    assert(result.remaining === 1, 'op still queued');
  });

  await test('queueEvent without student token → fails on flush', async () => {
    setupCloud({ getToken: () => null });
    const sync = loadCloudSync();
    sync.queueEvent('e1', {}, '2026-06-01T17:00:00Z');

    const result = await sync.flush();
    assert(result.flushed === 0, 'nothing flushed without token');
    assert(result.remaining === 1, 'op remains (will retry once token bound)');
  });

  await test('queueBktSync debounce — multiple calls → 1 coalesced upsert', async () => {
    // Spy on the bkt RPC. Eager flush (post-enqueue) drains the queue, so we
    // assert coalescing via the RPC spy rather than a lingering queue entry.
    const bktCalls = [];
    setupCloud({
      rpc: async (name, params) => {
        if (name === 'upsert_student_bkt') bktCalls.push(params);
        return { error: null, data: 'ok' };
      },
    });
    const sync = loadCloudSync();
    sync.queueBktSync({ a: 1 }, { x: 1 });
    sync.queueBktSync({ a: 2 }, { x: 2 });
    sync.queueBktSync({ a: 3 }, { x: 3 });
    assert(sync.getQueueLength() === 0, 'nothing queued yet (still in debounce)');

    // Wait past debounce (1500) + eager flush (1000) with margin.
    await new Promise(r => REAL_SET_TIMEOUT(r, 3200));

    assert(bktCalls.length === 1, `exactly 1 bkt upsert (got ${bktCalls.length})`);
    assert(bktCalls[0] && bktCalls[0].p_legacy.a === 3, 'last value wins (a=3)');
    assert(sync.getQueueLength() === 0, 'queue drained after flush');
  });

  await test('pagehide promotes pending BKT to queue before final flush', async () => {
    let releaseRpc;
    const rpcStarted = new Promise(resolve => { releaseRpc = resolve; });
    setupCloud({
      rpc: async () => {
        await rpcStarted;
        return { error: null, data: 'ok' };
      },
    });
    const sync = loadCloudSync();
    sync.queueBktSync({ a: 1 }, { x: 1 });
    global.window._listeners.pagehide();

    const q = JSON.parse(global.localStorage.getItem('avnei-yesod-cloud-sync-queue-v1'));
    assert(q && q.length === 1, `pending BKT was queued synchronously (got ${q && q.length})`);
    assert(q[0] && q[0].op === 'bkt', `queued op is bkt (got ${q[0] && q[0].op})`);
    releaseRpc();
  });

  console.log('\n' + '='.repeat(60));
  console.log(`סיכום: ${passed} עברו · ${failed} נכשלו`);
  console.log('='.repeat(60));
  process.exit(failed > 0 ? 1 : 0);

})();
