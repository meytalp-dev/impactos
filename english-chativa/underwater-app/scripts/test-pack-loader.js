#!/usr/bin/env node
// ============================================================
// test-pack-loader.js — validate october-2026-bridge.json
// Run: node english-chativa/underwater-app/scripts/test-pack-loader.js
// ============================================================

const fs = require('fs');
const path = require('path');

const PACK_PATH = path.resolve(
  __dirname, '..', '..', 'curriculum', 'packs', 'october-2026-bridge.json'
);

const VALID_ENVELOPES = new Set([
  'tap-match', 'drag-build', 'mcq', 'listen-mcq',
  'listen-then-tap', 'open-input', 'story-sequence',
  'fill-blank', 'pair-interview',
]);
const VALID_TRACKS = new Set([1, 2, 3, 4]);
const VALID_LSRW = new Set([
  'Listening', 'Speaking', 'Reading', 'Writing', 'Language',
]);

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, msg: e.message });
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
function eq(a, b, msg) { if (a !== b) throw new Error(`${msg} · got ${a}, expected ${b}`); }

const pack = JSON.parse(fs.readFileSync(PACK_PATH, 'utf8'));

test('pack file loads', () => {
  assert(pack && typeof pack === 'object', 'pack is object');
  assert(Array.isArray(pack.items), 'items is array');
});

test('meta.pack_id === october-2026-bridge', () => {
  eq(pack.meta.pack_id, 'october-2026-bridge', 'pack_id');
});

test('pack has 40 items total', () => {
  eq(pack.items.length, 40, 'item count');
});

test('every item has unique item_id', () => {
  const seen = new Set();
  pack.items.forEach(it => {
    assert(it.item_id, `missing item_id on item ${JSON.stringify(it).slice(0, 80)}`);
    assert(!seen.has(it.item_id), `duplicate item_id: ${it.item_id}`);
    seen.add(it.item_id);
  });
});

test('every item has 3-layer structure', () => {
  pack.items.forEach(it => {
    assert(it.content_layer, `${it.item_id} missing content_layer`);
    assert(it.measurement_layer, `${it.item_id} missing measurement_layer`);
    assert(it.organization_layer, `${it.item_id} missing organization_layer`);
    assert(it.content, `${it.item_id} missing content`);
  });
});

test('every track value is valid (1-4)', () => {
  pack.items.forEach(it => {
    assert(
      VALID_TRACKS.has(it.organization_layer.track),
      `${it.item_id} bad track: ${it.organization_layer.track}`
    );
  });
});

test('every envelope is recognized', () => {
  pack.items.forEach(it => {
    const e = it.organization_layer.envelope;
    assert(VALID_ENVELOPES.has(e), `${it.item_id} bad envelope: ${e}`);
  });
});

test('every lsrw_primary is valid', () => {
  pack.items.forEach(it => {
    const ls = it.measurement_layer.lsrw_primary;
    assert(VALID_LSRW.has(ls), `${it.item_id} bad lsrw_primary: ${ls}`);
  });
});

test('exactly 10 items per track', () => {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  pack.items.forEach(it => counts[it.organization_layer.track] += 1);
  eq(counts[1], 10, 'Track 1 count');
  eq(counts[2], 10, 'Track 2 count');
  eq(counts[3], 10, 'Track 3 count');
  eq(counts[4], 10, 'Track 4 count');
});

test('Track 1 items are audio + 2 options (tap-match / listen-mcq)', () => {
  const t1 = pack.items.filter(it => it.organization_layer.track === 1);
  t1.forEach(it => {
    const env = it.organization_layer.envelope;
    assert(
      env === 'tap-match' || env === 'listen-mcq' || env === 'listen-then-tap',
      `${it.item_id} Track 1 envelope should be tap-match/listen-mcq, got ${env}`
    );
    assert(it.content.audio_text, `${it.item_id} Track 1 missing audio_text`);
    assert(Array.isArray(it.content.options), `${it.item_id} missing options`);
    eq(it.content.options.length, 2, `${it.item_id} Track 1 should have 2 options`);
  });
});

test('Track 4 items are open-input with validation', () => {
  const t4 = pack.items.filter(it => it.organization_layer.track === 4);
  t4.forEach(it => {
    eq(it.organization_layer.envelope, 'open-input',
       `${it.item_id} Track 4 should be open-input`);
    assert(it.content.validation, `${it.item_id} Track 4 missing validation`);
  });
});

test('options items have exactly one correct=true (single_select) or ≥1 (multi_select)', () => {
  pack.items.forEach(it => {
    const opts = it.content.options;
    if (!Array.isArray(opts)) return;
    const correctCount = opts.filter(o => o.correct === true).length;
    if (it.content.multi_select) {
      assert(correctCount >= 1, `${it.item_id} multi_select needs ≥1 correct`);
    } else {
      eq(correctCount, 1, `${it.item_id} single_select needs exactly 1 correct`);
    }
  });
});

test('drag-build items have words_to_arrange + correct_order of equal length', () => {
  const db = pack.items.filter(it => it.organization_layer.envelope === 'drag-build');
  assert(db.length > 0, 'expected at least one drag-build item');
  db.forEach(it => {
    const w = it.content.words_to_arrange;
    const c = it.content.correct_order;
    assert(Array.isArray(w) && Array.isArray(c),
      `${it.item_id} drag-build needs both arrays`);
    eq(w.length, c.length, `${it.item_id} arrays must match length`);
    // correct_order should be a permutation of words_to_arrange
    const ws = [...w].sort();
    const cs = [...c].sort();
    assert(ws.join('|') === cs.join('|'),
      `${it.item_id} correct_order must be a permutation of words_to_arrange`);
  });
});

test('fill-blank items have ___ marker in prompt_text', () => {
  const fb = pack.items.filter(it => it.organization_layer.envelope === 'fill-blank');
  assert(fb.length > 0, 'expected at least one fill-blank item');
  fb.forEach(it => {
    assert(/_{2,}/.test(it.content.prompt_text || ''),
      `${it.item_id} fill-blank missing ___ marker`);
  });
});

test('narrative_context references the Sarah/8-locations arc', () => {
  const VALID_LOCATIONS = new Set([
    'tel-aviv', 'london', 'mumbai', 'tokyo',
    'barcelona', 'mexico-city', 'new-york',
  ]);
  let withNarrative = 0;
  pack.items.forEach(it => {
    if (!it.narrative_context) return;
    withNarrative += 1;
    eq(it.narrative_context.character_id, 'sarah',
       `${it.item_id} narrative character should be sarah`);
    assert(VALID_LOCATIONS.has(it.narrative_context.location_id),
      `${it.item_id} unknown location: ${it.narrative_context.location_id}`);
  });
  assert(withNarrative >= 10,
    `expected ≥10 items with narrative_context, got ${withNarrative}`);
});

// ---- report ------------------------------------------------------

const pass = results.filter(r => r.ok).length;
const fail = results.filter(r => !r.ok);
console.log(`\n[test-pack-loader] ${pass}/${results.length} passed\n`);
results.forEach(r => {
  if (r.ok) console.log(`  ✓ ${r.name}`);
  else      console.log(`  ✗ ${r.name}\n      ${r.msg}`);
});
if (fail.length) {
  console.log(`\n${fail.length} failures.\n`);
  process.exit(1);
}
console.log('\nAll pack-loader content tests passed.\n');
