// ============================================================
// shared/pack-loader.js — fetch + index practice packs
// English Chativa · grade 7
// ============================================================
//
// Pack JSON lives at:
//   english-chativa/curriculum/packs/{pack_id}.json
//
// student.html is at english-chativa/underwater-app/student.html,
// so the relative path from the page to a pack is:
//   ../curriculum/packs/{pack_id}.json
//
// Public API:
//   PackLoader.loadPack(pack_id)        → Promise<{ meta, items }>
//   PackLoader.getItemsForTrack(track)  → array (last-loaded pack)
//   PackLoader.getNextItem(opts)        → { item, index, total } | null
//   PackLoader.getLoaded()              → last-loaded { meta, items }
//   PackLoader.validateItem(item)       → { ok, errors[] }
// ============================================================

window.PackLoader = (function() {

  const PACK_BASE_PATH = '../curriculum/packs/';

  const VALID_ENVELOPES = new Set([
    'tap-match', 'drag-build', 'mcq', 'listen-mcq',
    'listen-then-tap', 'open-input', 'story-sequence',
    'fill-blank', 'pair-interview',
  ]);

  const VALID_TRACKS = new Set([1, 2, 3, 4]);

  const VALID_LSRW = new Set([
    'Listening', 'Speaking', 'Reading', 'Writing', 'Language',
  ]);

  let loaded = null;   // { meta, items }
  let cursor = {};     // { [pack_id]: { [track]: index } }

  // ---- validation (matches _schema/item-schema.json) ------------

  function validateItem(item) {
    const errors = [];
    if (!item || typeof item !== 'object') {
      return { ok: false, errors: ['item is not an object'] };
    }
    if (!item.item_id || typeof item.item_id !== 'string') {
      errors.push('missing item_id');
    }
    const org = item.organization_layer;
    if (!org) {
      errors.push('missing organization_layer');
    } else {
      if (!VALID_TRACKS.has(org.track)) errors.push(`bad track: ${org.track}`);
      if (!VALID_ENVELOPES.has(org.envelope)) errors.push(`bad envelope: ${org.envelope}`);
      if (!org.unit_id) errors.push('missing unit_id');
    }
    const meas = item.measurement_layer;
    if (!meas) {
      errors.push('missing measurement_layer');
    } else if (!VALID_LSRW.has(meas.lsrw_primary)) {
      errors.push(`bad lsrw_primary: ${meas.lsrw_primary}`);
    }
    if (!item.content || typeof item.content !== 'object') {
      errors.push('missing content');
    }
    return { ok: errors.length === 0, errors };
  }

  // ---- loading ----------------------------------------------------

  function loadPack(pack_id) {
    if (!pack_id || typeof pack_id !== 'string') {
      return Promise.reject(new Error('pack_id required'));
    }
    const url = PACK_BASE_PATH + encodeURIComponent(pack_id) + '.json';
    return fetch(url, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error(`pack fetch failed: ${res.status} ${url}`);
        return res.json();
      })
      .then(json => {
        if (!json || !Array.isArray(json.items)) {
          throw new Error('pack JSON missing items array');
        }
        // Drop schema-invalid items rather than crash the run.
        const cleanItems = [];
        json.items.forEach(it => {
          const v = validateItem(it);
          if (v.ok) {
            cleanItems.push(it);
          } else {
            console.warn(
              '[pack-loader] skipping invalid item',
              it && it.item_id,
              v.errors
            );
          }
        });
        loaded = { meta: json.meta || {}, items: cleanItems };
        cursor[pack_id] = cursor[pack_id] || {};
        return loaded;
      });
  }

  function getLoaded() { return loaded; }

  // ---- selection --------------------------------------------------

  function getItemsForTrack(track) {
    if (!loaded) return [];
    return loaded.items.filter(it =>
      it.organization_layer && it.organization_layer.track === track
    );
  }

  // Sequential getter: returns the next not-yet-served item for the
  // active pack + track, then advances the cursor. Returns null when
  // the track is exhausted. BKT-aware selection is a Phase 4 concern;
  // for the MVP a deterministic order is exactly what we want.
  function getNextItem(opts) {
    opts = opts || {};
    if (!loaded) return null;
    const pack_id = (loaded.meta && loaded.meta.pack_id) || 'default';
    const track = opts.track || 2;
    const items = getItemsForTrack(track);
    if (!items.length) return null;
    cursor[pack_id] = cursor[pack_id] || {};
    const i = cursor[pack_id][track] || 0;
    if (i >= items.length) return null;
    cursor[pack_id][track] = i + 1;
    return { item: items[i], index: i, total: items.length };
  }

  function resetCursor(pack_id, track) {
    if (!cursor[pack_id]) return;
    if (typeof track === 'number') {
      cursor[pack_id][track] = 0;
    } else {
      cursor[pack_id] = {};
    }
  }

  // ---- public surface --------------------------------------------

  return {
    loadPack,
    getLoaded,
    getItemsForTrack,
    getNextItem,
    resetCursor,
    validateItem,
    VALID_ENVELOPES,
    VALID_TRACKS,
  };
})();
