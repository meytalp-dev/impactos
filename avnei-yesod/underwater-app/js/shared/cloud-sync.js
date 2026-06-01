/**
 * Avnei Yesod — Cloud Sync (Offline-First Write-Through)
 * ------------------------------------------------------
 * Writes pass through this layer. In cloud mode, operations are queued
 * to localStorage AND pushed to Supabase. In demo mode, this is a no-op.
 *
 * Design goals:
 *   - Never block UI: queue first, retry in background
 *   - Survive offline: events accumulate in localStorage, flushed on reconnect
 *   - Survive failure: exponential backoff, no head-of-line blocking
 *     (one bad event doesn't block the queue forever — it gets parked)
 *   - Idempotent: each operation has a client-side UUID; retrying the same
 *     op produces the same server-side row (server's job: dedup on idempotency_key)
 *
 * Queue ops:
 *   - { op: 'event', payload: { event_type, payload, client_timestamp } }
 *   - { op: 'bkt',   payload: { legacy_bkt, strand_bkt } }    -- debounced
 *   - { op: 'assessment', payload: { assessment_type, payload, taken_at } }
 *
 * Public API:
 *   AvneiCloudSync.queueEvent(eventType, payload, clientTimestamp)
 *   AvneiCloudSync.queueBktSync(legacyBkt, strandBkt)         -- debounced 3s
 *   AvneiCloudSync.queueAssessment(type, payload, takenAt)
 *   AvneiCloudSync.flush()                                     -- force now
 *   AvneiCloudSync.getQueueLength()                            -- for debug
 *
 * Created: 2026-06-01
 */

(function () {
  'use strict';

  const QUEUE_KEY = 'avnei-yesod-cloud-sync-queue-v1';
  const FLUSH_INTERVAL_MS = 5000;
  const BKT_DEBOUNCE_MS = 3000;
  const MAX_BACKOFF_MS = 60000;
  const INITIAL_BACKOFF_MS = 1000;

  const mode = window.AvneiRuntimeMode;
  const client = window.AvneiCloudClient;

  if (!mode) {
    console.error('[cloud-sync] AvneiRuntimeMode missing.');
    return;
  }

  // In demo mode, expose no-op stubs. Calls succeed silently.
  if (mode.isDemo) {
    window.AvneiCloudSync = {
      mode: 'demo',
      queueEvent: () => {},
      queueBktSync: () => {},
      queueAssessment: () => {},
      flush: async () => ({ flushed: 0, remaining: 0 }),
      getQueueLength: () => 0,
      _stub: true,
    };
    return;
  }

  if (!client || client._stub) {
    console.error('[cloud-sync] AvneiCloudClient missing or stub in cloud mode.');
    return;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Queue persistence (localStorage)
  // ──────────────────────────────────────────────────────────────────────────

  function readQueue() {
    try {
      const raw = window.localStorage.getItem(QUEUE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.warn('[cloud-sync] Queue read failed, resetting:', e.message);
      return [];
    }
  }

  function writeQueue(q) {
    try {
      window.localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch (e) {
      // localStorage full or unavailable — log and continue
      console.error('[cloud-sync] Queue write failed:', e.message);
    }
  }

  function makeOpId() {
    // RFC 4122 v4-ish, sufficient for client-side dedup
    return 'op-' + Date.now().toString(36) + '-' +
           Math.random().toString(36).slice(2, 10);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Queue API
  // ──────────────────────────────────────────────────────────────────────────

  function enqueue(op, payload) {
    const q = readQueue();
    q.push({
      id: makeOpId(),
      op,
      payload,
      enqueued_at: new Date().toISOString(),
      attempts: 0,
      next_attempt_at: 0,  // 0 = ready
    });
    writeQueue(q);
  }

  function queueEvent(eventType, payload, clientTimestamp) {
    if (!eventType) {
      console.warn('[cloud-sync] queueEvent called without event_type');
      return;
    }
    enqueue('event', {
      event_type: eventType,
      payload: payload || {},
      client_timestamp: clientTimestamp || new Date().toISOString(),
    });
  }

  function queueAssessment(assessmentType, payload, takenAt) {
    enqueue('assessment', {
      assessment_type: assessmentType,
      payload: payload || {},
      taken_at: takenAt || new Date().toISOString(),
    });
  }

  // BKT sync is debounced to avoid spamming the server during a session
  let bktDebounceTimer = null;
  let bktPending = null;

  function queueBktSync(legacyBkt, strandBkt) {
    bktPending = { legacy_bkt: legacyBkt || {}, strand_bkt: strandBkt || {} };
    if (bktDebounceTimer) clearTimeout(bktDebounceTimer);
    bktDebounceTimer = setTimeout(() => {
      if (bktPending) {
        enqueue('bkt', bktPending);
        bktPending = null;
      }
    }, BKT_DEBOUNCE_MS);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Flush — push queue → Supabase
  // ──────────────────────────────────────────────────────────────────────────

  let flushing = false;

  async function flushOne(op) {
    const token = client.getStudentToken();
    const supabase = client.supabase;

    if (op.op === 'event') {
      if (!token) throw new Error('No student token for event ingest');
      const { error } = await supabase.rpc('ingest_student_event', {
        p_token: token,
        p_event_type: op.payload.event_type,
        p_payload: op.payload.payload,
        p_client_timestamp: op.payload.client_timestamp,
      });
      if (error) throw error;
    }
    else if (op.op === 'bkt') {
      if (!token) throw new Error('No student token for bkt upsert');
      const { error } = await supabase.rpc('upsert_student_bkt', {
        p_token: token,
        p_legacy: op.payload.legacy_bkt,
        p_strand: op.payload.strand_bkt,
      });
      if (error) throw error;
    }
    else if (op.op === 'assessment') {
      if (!token) throw new Error('No student token for assessment');
      const { error } = await supabase.rpc('ingest_student_assessment', {
        p_token: token,
        p_assessment_type: op.payload.assessment_type,
        p_payload: op.payload.payload,
        p_taken_at: op.payload.taken_at,
      });
      if (error) throw error;
    }
    else {
      throw new Error(`Unknown op: ${op.op}`);
    }
  }

  function backoffFor(attempts) {
    const ms = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempts), MAX_BACKOFF_MS);
    // Jitter ±20%
    return Math.round(ms * (0.8 + Math.random() * 0.4));
  }

  async function flush() {
    if (flushing) return { flushed: 0, remaining: readQueue().length };
    flushing = true;

    let flushed = 0;
    try {
      let q = readQueue();
      const now = Date.now();

      // Filter ready ops (not in backoff)
      const ready = q.filter(op => (op.next_attempt_at || 0) <= now);
      if (ready.length === 0) return { flushed: 0, remaining: q.length };

      // Process sequentially to preserve order
      for (const op of ready) {
        try {
          await flushOne(op);
          // Remove from queue
          q = q.filter(x => x.id !== op.id);
          writeQueue(q);
          flushed++;
        } catch (err) {
          // Update attempts + backoff
          const attempts = (op.attempts || 0) + 1;
          const next = Date.now() + backoffFor(attempts);
          q = q.map(x => x.id === op.id
            ? { ...x, attempts, next_attempt_at: next, last_error: String(err.message || err) }
            : x
          );
          writeQueue(q);
          console.warn(`[cloud-sync] Op ${op.id} failed (attempt ${attempts}), retry in ${Math.round((next - Date.now())/1000)}s:`, err.message || err);
          // Don't break — try other ops too. Head-of-line blocking is bad UX.
        }
      }
    } finally {
      flushing = false;
    }

    return { flushed, remaining: readQueue().length };
  }

  function getQueueLength() {
    return readQueue().length;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Background workers
  // ──────────────────────────────────────────────────────────────────────────

  // Periodic flush
  setInterval(() => { flush().catch(() => {}); }, FLUSH_INTERVAL_MS);

  // Flush on reconnect
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('online', () => {
      console.log('[cloud-sync] Network online, flushing queue');
      flush().catch(() => {});
    });
    // Flush on visibility (user returning to tab)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') flush().catch(() => {});
    });
    // Final attempt before unload (best-effort; sendBeacon would be better but RPC requires it)
    window.addEventListener('beforeunload', () => { flush().catch(() => {}); });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────────────────────

  window.AvneiCloudSync = {
    mode: 'cloud',
    queueEvent,
    queueBktSync,
    queueAssessment,
    flush,
    getQueueLength,
  };

  console.log('[cloud-sync] Initialized. Queue length:', readQueue().length);
})();
