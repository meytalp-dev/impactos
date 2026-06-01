/**
 * Studio · Local Store
 * localStorage CRUD + Supabase-ready adapter hook.
 *
 * Schema (key='studio-items-v1'):
 *   { drafts: { [item_id]: { ...item, status, teacher_id, created_at, updated_at, version } },
 *     published: { [item_id]: { ...item, status, published_at, version: N } } }
 *
 * Public:
 *   saveDraft(item) → Promise<{ id }>
 *   publishItem(id) → Promise<void>      ← מאמת לפני publish; זורק אם errors='error'
 *   listMyItems() → Promise<Array>
 *   deleteDraft(id) → Promise<void>
 *
 * Cloud hook:
 *   אם window.AvneiCloudSync זמין ו-runtimeMode()==='cloud' → להעביר אליו.
 *   עד שהוא נבנה (cloud-agent בסשן נפרד) — passthrough ל-localStorage.
 */
(function (global) {
  'use strict';

  const KEY = 'studio-items-v1';

  // ============================================================
  // storage primitives — localStorage או in-memory shim ל-node
  // ============================================================

  let memShim = null;
  function _storage() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (_) {}
    if (!memShim) {
      const map = new Map();
      memShim = {
        getItem: (k) => (map.has(k) ? map.get(k) : null),
        setItem: (k, v) => { map.set(k, String(v)); },
        removeItem: (k) => { map.delete(k); },
        clear: () => { map.clear(); }
      };
    }
    return memShim;
  }

  function readStore() {
    try {
      const raw = _storage().getItem(KEY);
      if (!raw) return { drafts: {}, published: {} };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return { drafts: {}, published: {} };
      if (!parsed.drafts)    parsed.drafts = {};
      if (!parsed.published) parsed.published = {};
      return parsed;
    } catch (_e) {
      return { drafts: {}, published: {} };
    }
  }

  function writeStore(store) {
    try {
      _storage().setItem(KEY, JSON.stringify(store));
    } catch (_e) {
      // quota / private mode — לא לזרוק; שמרנו ל-mem shim במקרה הגרוע.
    }
  }

  // ============================================================
  // helpers
  // ============================================================

  function nowIso() { return new Date().toISOString(); }
  function rand4() {
    let s = '';
    for (let i = 0; i < 4; i++) s += Math.floor(Math.random() * 36).toString(36);
    return s;
  }

  function _getTeacherId() {
    // 1) auto-tagger יחשוף את getTeacherId אם נטען לפניו
    try {
      if (global._StudioAutoTagger && typeof global._StudioAutoTagger.getTeacherId === 'function') {
        return global._StudioAutoTagger.getTeacherId();
      }
    } catch (_) {}
    try {
      if (typeof sessionStorage !== 'undefined') {
        return sessionStorage.getItem('studio-teacher-id') || 'guest';
      }
    } catch (_) {}
    return 'guest';
  }

  function _validator() {
    // הזרק את ה-validator מבחוץ אם זמין, אחרת ננסה globals
    if (typeof module !== 'undefined' && module.exports && _validator._injected) {
      return _validator._injected;
    }
    if (global._StudioValidatorPipeline) return global._StudioValidatorPipeline;
    return null;
  }

  function _cloudAvailable() {
    return typeof global.AvneiCloudSync !== 'undefined'
      && typeof global.runtimeMode === 'function'
      && global.runtimeMode() === 'cloud';
  }

  // ============================================================
  // public API
  // ============================================================

  async function saveDraft(item) {
    if (!item || typeof item !== 'object') {
      throw new Error('saveDraft: item required');
    }

    const teacherId = item.teacher_id || _getTeacherId();
    const id = item.item_id || `studio-${teacherId}-${Date.now()}-${rand4()}`;

    const store = readStore();
    const existing = store.drafts[id];

    const draft = Object.assign({}, item, {
      item_id: id,
      status: 'draft',
      teacher_id: teacherId,
      created_at: existing ? existing.created_at : nowIso(),
      updated_at: nowIso(),
      version: existing ? existing.version : 1
    });

    store.drafts[id] = draft;
    writeStore(store);

    // cloud passthrough (אם זמין)
    if (_cloudAvailable()) {
      try {
        await global.AvneiCloudSync.saveTeacherItem(draft);
      } catch (_e) {
        // offline-first — נשמר כבר ב-localStorage; ה-cloud-sync queue יטפל
      }
    }

    return { id };
  }

  async function publishItem(id) {
    if (!id) throw new Error('publishItem: id required');

    const store = readStore();
    const draft = store.drafts[id];
    if (!draft) {
      // אולי כבר published — אז נדרוס גרסה חדשה? לא: publishItem רק מ-draft.
      throw new Error(`publishItem: draft not found — ${id}`);
    }

    // validate
    const v = _validator();
    if (v && typeof v.validateContent === 'function') {
      const result = v.validateContent(draft);
      if (!result.valid) {
        const blockers = result.errors.filter(e => e.severity === 'error');
        if (blockers.length > 0) {
          const codes = blockers.map(e => e.code).join(', ');
          const err = new Error(`publishItem: validation errors — ${codes}`);
          err.validation = result;
          throw err;
        }
      }
    }

    const prevPublished = store.published[id];
    const nextVersion = prevPublished ? (prevPublished.version || 0) + 1 : 1;

    const published = Object.assign({}, draft, {
      status: 'published',
      published_at: nowIso(),
      version: nextVersion
    });
    delete published.updated_at; // מוסר; published_at הוא הסמן

    store.published[id] = published;
    delete store.drafts[id];
    writeStore(store);

    if (_cloudAvailable()) {
      try {
        await global.AvneiCloudSync.publishTeacherItem(published);
      } catch (_e) {}
    }
  }

  async function listMyItems() {
    const teacherId = _getTeacherId();
    const store = readStore();
    const mine = [];

    for (const it of Object.values(store.drafts)) {
      if (it.teacher_id === teacherId) mine.push(it);
    }
    for (const it of Object.values(store.published)) {
      if (it.teacher_id === teacherId) mine.push(it);
    }

    mine.sort((a, b) => {
      const aT = a.updated_at || a.published_at || '';
      const bT = b.updated_at || b.published_at || '';
      return bT.localeCompare(aT);
    });
    return mine;
  }

  async function deleteDraft(id) {
    if (!id) return;
    const store = readStore();
    if (store.drafts[id]) {
      delete store.drafts[id];
      writeStore(store);
    }
    if (_cloudAvailable()) {
      try {
        await global.AvneiCloudSync.deleteTeacherDraft(id);
      } catch (_e) {}
    }
  }

  // Test hook: inject validator (used by node tests)
  function _injectValidator(v) { _validator._injected = v; }

  // Test hook: clear all state (used by node tests)
  function _clearAll() {
    writeStore({ drafts: {}, published: {} });
  }

  const api = {
    saveDraft,
    publishItem,
    listMyItems,
    deleteDraft,
    _injectValidator,
    _clearAll,
    _readStore: readStore,
    KEY
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global._StudioLocalStore = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
