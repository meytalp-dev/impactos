/**
 * Studio · TTS Batch
 * AvriNeural / Web-Speech fallback + IndexedDB blob cache.
 *
 * Public:
 *   generateTTS(textNiqud) → Promise<{ audioUrl, durationMs, fallback?, ttsPending? }>
 *   clearTTSCache() → Promise<void>
 *
 * Status (1.6.2026):
 *   AvriNeural רץ build-time בלבד (Python edge-tts) — אין client SDK.
 *   עד שייבנה Supabase Edge Function ל-on-demand TTS:
 *     - אם window.AvneiStudioTTSBackend.synthesize(text) זמין → קרא לו, cache, החזר Blob URL
 *     - אחרת → fallback: 'web-speech' עם marker tts_pending=true
 *       UI agent יבצע speechSynthesis.speak(new SpeechSynthesisUtterance(text, {lang:'he-IL'}))
 *       validator יתן warning ש-"איכות אודיו זמנית, יוחלף לפני פיילוט".
 *
 * ראה memory: reference-avnei-yesod-island-build-checklist §4 (AvriNeural MP3 חובה)
 */
(function (global) {
  'use strict';

  const DB_NAME = 'studio-tts-cache-v1';
  const STORE   = 'audio';
  const DB_VERSION = 1;

  // ============================================================
  // IndexedDB helpers — quiet no-op בסביבת node (no indexedDB)
  // ============================================================

  const HAS_IDB = typeof indexedDB !== 'undefined';

  function openDb() {
    if (!HAS_IDB) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function sha256Hex(str) {
    // Node 18+ has WebCrypto; browsers have it on window.crypto.subtle
    const subtle = (typeof crypto !== 'undefined' && crypto.subtle) || null;
    if (!subtle) {
      // fallback: weak hash (FNV-1a) — enough לקיבוץ פר-טקסט, לא ל-security
      let h = 0x811c9dc5;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = (h * 0x01000193) >>> 0;
      }
      return ('00000000' + h.toString(16)).slice(-8);
    }
    const buf = new TextEncoder().encode(str);
    const digest = await subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function cacheKey(textNiqud) {
    return 'tts-' + (await sha256Hex(textNiqud));
  }

  async function getCachedAudio(textNiqud) {
    if (!HAS_IDB) return null;
    try {
      const db = await openDb();
      if (!db) return null;
      const key = await cacheKey(textNiqud);
      return new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => {
          const entry = req.result; // { blob, durationMs } או undefined
          if (!entry) return resolve(null);
          try {
            const audioUrl = URL.createObjectURL(entry.blob);
            resolve({ audioUrl, durationMs: entry.durationMs || 0 });
          } catch (_e) {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (_e) {
      return null;
    }
  }

  async function setCachedAudio(textNiqud, blob, durationMs) {
    if (!HAS_IDB) return;
    try {
      const db = await openDb();
      if (!db) return;
      const key = await cacheKey(textNiqud);
      await new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put({ blob, durationMs: durationMs || 0 }, key);
        tx.oncomplete = resolve;
        tx.onerror = resolve;  // אל תזרוק על cache failure
      });
    } catch (_e) {
      // ignore — cache הוא best-effort
    }
  }

  async function clearTTSCache() {
    if (!HAS_IDB) return;
    try {
      const db = await openDb();
      if (!db) return;
      await new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete = resolve;
        tx.onerror = resolve;
      });
    } catch (_e) {}
  }

  // ============================================================
  // Backend synthesis (future) + Web Speech fallback marker
  // ============================================================

  function _backend() {
    return typeof global !== 'undefined'
      && global.AvneiStudioTTSBackend
      && typeof global.AvneiStudioTTSBackend.synthesize === 'function'
      ? global.AvneiStudioTTSBackend
      : null;
  }

  async function _measureBlobDuration(blob) {
    if (typeof Audio === 'undefined' || typeof URL === 'undefined') return 0;
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(blob);
        const a = new Audio();
        a.preload = 'metadata';
        a.onloadedmetadata = () => {
          const ms = Math.round((a.duration || 0) * 1000);
          try { URL.revokeObjectURL(url); } catch (_) {}
          resolve(Number.isFinite(ms) ? ms : 0);
        };
        a.onerror = () => {
          try { URL.revokeObjectURL(url); } catch (_) {}
          resolve(0);
        };
        a.src = url;
      } catch (_e) {
        resolve(0);
      }
    });
  }

  /**
   * Estimate duration עבור Web Speech fallback — בערך 90ms per character
   * (Hebrew kindergarten pace, rate=-10%, AvriNeural baseline).
   */
  function estimateDurationMs(text) {
    if (!text) return 0;
    const chars = text.replace(/[֑-ׇ]/g, '').length; // ללא ניקוד
    return Math.max(300, chars * 90);
  }

  /**
   * Public: generateTTS
   * @param {string} textNiqud
   * @returns {Promise<{ audioUrl: string|null, durationMs: number,
   *                    fallback?: 'web-speech', ttsPending?: boolean,
   *                    text?: string }>}
   */
  async function generateTTS(textNiqud) {
    if (typeof textNiqud !== 'string' || !textNiqud.trim()) {
      return { audioUrl: null, durationMs: 0, fallback: 'web-speech',
               ttsPending: true, text: textNiqud || '' };
    }

    // 1) cache hit
    const cached = await getCachedAudio(textNiqud);
    if (cached) return cached;

    // 2) backend זמין (future) → cache + return Blob URL
    const backend = _backend();
    if (backend) {
      try {
        const blob = await backend.synthesize(textNiqud);
        if (blob && typeof URL !== 'undefined') {
          const durationMs = await _measureBlobDuration(blob);
          await setCachedAudio(textNiqud, blob, durationMs);
          const audioUrl = URL.createObjectURL(blob);
          return { audioUrl, durationMs };
        }
      } catch (_e) {
        // נופלים ל-fallback
      }
    }

    // 3) fallback: web-speech marker
    return {
      audioUrl: null,
      durationMs: estimateDurationMs(textNiqud),
      fallback: 'web-speech',
      ttsPending: true,
      text: textNiqud
    };
  }

  const api = {
    generateTTS,
    clearTTSCache,
    estimateDurationMs,
    _getCachedAudio: getCachedAudio,
    _setCachedAudio: setCachedAudio,
    _cacheKey: cacheKey,
    DB_NAME,
    STORE
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global._StudioTTSBatch = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
