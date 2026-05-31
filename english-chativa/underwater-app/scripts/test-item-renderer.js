#!/usr/bin/env node
// ============================================================
// test-item-renderer.js — verify content shape matches what
// each envelope renderer in item-renderer.js expects.
// Run: node english-chativa/underwater-app/scripts/test-item-renderer.js
// ============================================================
//
// This file does NOT execute item-renderer.js directly (it depends
// on `document` + `window`). Instead it asserts that for every item
// in the pack, the `content` object has the fields its envelope's
// renderer reads. If this passes, a real browser render will work
// for that item.

const fs = require('fs');
const path = require('path');

const PACK_PATH = path.resolve(
  __dirname, '..', '..', 'curriculum', 'packs', 'october-2026-bridge.json'
);
const RENDERER_PATH = path.resolve(__dirname, '..', 'js', 'shared', 'item-renderer.js');

const pack = JSON.parse(fs.readFileSync(PACK_PATH, 'utf8'));
const rendererSrc = fs.readFileSync(RENDERER_PATH, 'utf8');

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, msg: e.message }); }
}
function assert(c, msg) { if (!c) throw new Error(msg); }

// Sanity: renderer file exports a render() dispatcher and 6 envelope fns.
test('item-renderer.js exposes window.ItemRenderer with all 6 envelope fns', () => {
  ['render', 'renderTapMatch', 'renderListenMcq', 'renderMcq',
   'renderFillBlank', 'renderDragBuild', 'renderOpenInput'].forEach(fn => {
    assert(rendererSrc.includes(fn), `missing function: ${fn}`);
  });
  assert(/window\.ItemRenderer/.test(rendererSrc), 'missing window.ItemRenderer export');
});

// Per-envelope content-shape checks. The keys read by each renderer
// (taken directly from item-renderer.js):
const REQUIRED_BY_ENVELOPE = {
  'tap-match':   ['prompt_text', 'audio_text', 'options'],
  'listen-mcq':  ['prompt_text', 'audio_text', 'options'],
  'mcq':         ['prompt_text', 'options'],
  'fill-blank':  ['prompt_text', 'options'],
  'drag-build':  ['prompt_text', 'words_to_arrange', 'correct_order'],
  'open-input':  ['prompt_text', 'validation'],
};

Object.keys(REQUIRED_BY_ENVELOPE).forEach(env => {
  test(`every ${env} item has required content fields`, () => {
    const items = pack.items.filter(it => it.organization_layer.envelope === env);
    assert(items.length > 0, `no items with envelope ${env}`);
    items.forEach(it => {
      REQUIRED_BY_ENVELOPE[env].forEach(field => {
        assert(it.content && it.content[field] != null,
          `${it.item_id} (${env}) missing content.${field}`);
      });
    });
  });
});

// Track 1 envelopes auto-play audio (rendered on mount). All Track 1 items
// must therefore include audio_text so the auto-play works.
test('every Track 1 item has audio_text', () => {
  pack.items
    .filter(it => it.organization_layer.track === 1)
    .forEach(it => {
      assert(typeof it.content.audio_text === 'string' && it.content.audio_text.length > 0,
        `${it.item_id} Track 1 audio_text missing or empty`);
    });
});

// open-input validation must be a plain object with at least one rule.
test('every open-input item has at least one validation rule', () => {
  const KNOWN = ['must_include', 'must_start_with', 'min_words',
                 'max_words', 'min_sentences', 'exclude'];
  const oi = pack.items.filter(it => it.organization_layer.envelope === 'open-input');
  oi.forEach(it => {
    const v = it.content.validation || {};
    const has = KNOWN.some(k => v[k] != null);
    assert(has, `${it.item_id} open-input has no recognized validation rules`);
  });
});

// mcq multi_select items expose multi_select=true so the renderer enables
// multi-tap mode. Verify the items that need multi-select declare it.
test('mcq multi_select items expose multi_select=true', () => {
  const mcq = pack.items.filter(it => it.organization_layer.envelope === 'mcq');
  mcq.forEach(it => {
    const correctCount = (it.content.options || []).filter(o => o.correct).length;
    if (correctCount > 1) {
      assert(it.content.multi_select === true,
        `${it.item_id} has ${correctCount} correct options but multi_select !== true`);
    }
  });
});

// ---- report ------------------------------------------------------

const pass = results.filter(r => r.ok).length;
const fail = results.filter(r => !r.ok);
console.log(`\n[test-item-renderer] ${pass}/${results.length} passed\n`);
results.forEach(r => {
  if (r.ok) console.log(`  ✓ ${r.name}`);
  else      console.log(`  ✗ ${r.name}\n      ${r.msg}`);
});
if (fail.length) { console.log(`\n${fail.length} failures.\n`); process.exit(1); }
console.log('\nAll item-renderer shape tests passed.\n');
