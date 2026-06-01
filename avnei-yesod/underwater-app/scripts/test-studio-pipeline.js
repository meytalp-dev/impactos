#!/usr/bin/env node
/**
 * test-studio-pipeline.js — node test suite ל-Studio pipeline (Phase A-F).
 *
 * Usage:
 *   node avnei-yesod/underwater-app/scripts/test-studio-pipeline.js
 *
 * Exit codes:
 *   0 — all green
 *   1 — failures
 *
 * Tests:
 *   AT-* — auto-tagger (Phase A)
 *   NQ-* — niqud-client post-processor (Phase B) — לא רץ network call
 *   TT-* — tts fallback (Phase C)
 *   VL-* — validator-pipeline (Phase D)
 *   LS-* — local-store CRUD + versioning (Phase E)
 *   E2E-* — full draft → publish flow (Phase F)
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'js', 'studio');
const autoTagger = require(path.join(ROOT, 'auto-tagger.js'));
const niqudClient = require(path.join(ROOT, 'niqud-client.js'));
const ttsBatch = require(path.join(ROOT, 'tts-batch.js'));
const validator = require(path.join(ROOT, 'validator-pipeline.js'));
const localStore = require(path.join(ROOT, 'local-store.js'));
const metadata = require(path.join(ROOT, 'metadata.js'));

const { autoTag, extractLettersInvolved, deriveRamaTask, stripNiqud } = autoTagger;
const { ensureBgdKptDagesh } = niqudClient;
const { generateTTS, estimateDurationMs } = ttsBatch;
const { validateContent, findBgdKptViolations, findYofiViolations,
        findKolViolations, distractorsHaveConfusion } = validator;
const { saveDraft, publishItem, listMyItems, deleteDraft,
        _clearAll, _injectValidator, _readStore } = localStore;
const { getAvailableIslands, getMechanicLabel, getTierLabel } = metadata;

// wire validator into local-store for tests (browser does this via globals)
_injectValidator(validator);

// ============================================================
// Minimal test harness
// ============================================================
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      return res.then(
        () => { passed++; process.stdout.write('.'); },
        (e) => { failed++; failures.push({ name, error: e }); process.stdout.write('F'); }
      );
    }
    passed++;
    process.stdout.write('.');
  } catch (e) {
    failed++;
    failures.push({ name, error: e });
    process.stdout.write('F');
  }
}

async function runAll() {
  // ========================================================
  // AUTO-TAGGER (Phase A)
  // ========================================================
  test('AT-1: autoTag fills required fields for tap-all on island 3', () => {
    const r = autoTag({ island_id: 3, mechanic: 'tap-all', letter: 'מ',
                        distractors: ['ב','ר'] });
    assert.equal(r.tier, 2);
    assert.equal(r.type, 'new');
    assert.equal(r.mechanic, 'tap-all');
    assert.equal(r.rama_task_alignment, 1);
    assert.equal(r.peima_target, 1);
    assert.deepEqual([...r.letters_involved].sort(), ['ב','מ','ר']);
    assert.ok(/^studio-/.test(r.item_id));
    assert.equal(r.letter, 'מ');
  });

  test('AT-2: final letter ם normalizes to מ in letters_involved', () => {
    const r = autoTag({ island_id: 5, mechanic: 'memory-pair',
                        custom_words: ['בָּאִים'] });
    assert.ok(r.letters_involved.includes('מ'));
    assert.ok(!r.letters_involved.includes('ם'));
  });

  test('AT-3: niqud stripped from letters_involved (single chars only)', () => {
    const r = autoTag({ island_id: 3, mechanic: 'pick', letter: 'מ',
                        custom_words: ['אִמָּא'] });
    for (const l of r.letters_involved) assert.equal(l.length, 1);
    assert.ok(r.letters_involved.includes('א'));
    assert.ok(r.letters_involved.includes('מ'));
  });

  test('AT-4: invalid mechanic throws', () => {
    assert.throws(() => autoTag({ island_id: 3, mechanic: 'invalid' }));
  });

  test('AT-5: deriveRamaTask returns null for unknown (island, mechanic) pair', () => {
    assert.equal(deriveRamaTask(1, 'tap-all'), null);
    assert.equal(deriveRamaTask(999, 'pick'), null);
    assert.equal(deriveRamaTask(3, 'tap-all'), 1);
    assert.equal(deriveRamaTask(4, 'pick'), 5);
  });

  test('AT-6: tier defaults to 2; can be overridden', () => {
    const r1 = autoTag({ island_id: 3, mechanic: 'tap-all', letter: 'מ' });
    assert.equal(r1.tier, 2);
    const r2 = autoTag({ island_id: 3, mechanic: 'tap-all', letter: 'מ', tier: 3 });
    assert.equal(r2.tier, 3);
  });

  test('AT-7: rama_task_alignment may be null if pair unsupported (validator catches)', () => {
    const r = autoTag({ island_id: 1, mechanic: 'tap-all', letter: 'מ' });
    assert.equal(r.rama_task_alignment, null);
    assert.equal(r.peima_target, null);
  });

  // ========================================================
  // NIQUD post-processor (Phase B)
  // ========================================================
  test('NQ-1: stripNiqud removes all niqud marks', () => {
    assert.equal(stripNiqud('בָּאָה'), 'באה');
    assert.equal(stripNiqud('אִמָּא'), 'אמא');
  });

  test('NQ-2: ensureBgdKptDagesh — בָּ already with dagesh stays unchanged', () => {
    const inp = 'בָּ';
    const out = ensureBgdKptDagesh(inp);
    // both should NFC to same form
    assert.equal(out.normalize('NFC'), inp.normalize('NFC'));
  });

  test('NQ-3: ensureBgdKptDagesh — בַ (no dagesh) gets dagesh added', () => {
    const inp = 'בַ';
    const out = ensureBgdKptDagesh(inp);
    assert.ok(out.includes('ּ'), `expected dagesh added, got ${JSON.stringify(out)}`);
    // verify NFC canonical form: ב + patah (U+05B7) + dagesh (U+05BC)
    assert.equal(out.normalize('NFC'), 'בַּ'.normalize('NFC'));
  });

  test('NQ-4: ensureBgdKptDagesh — כ at start of word gets dagesh', () => {
    const inp = 'כְפָר';
    const out = ensureBgdKptDagesh(inp);
    assert.ok(out.charAt(0) === 'כ');
    assert.ok(out.includes('ּ'));
  });

  test('NQ-5: ensureBgdKptDagesh — כ NOT at start (mid-word) stays unchanged', () => {
    const inp = 'הַכֹּל';
    const out = ensureBgdKptDagesh(inp);
    assert.equal(out.normalize('NFC'), inp.normalize('NFC'));
  });

  test('NQ-6: ensureBgdKptDagesh — un-niqud word skipped (no marks)', () => {
    const inp = 'בית';
    const out = ensureBgdKptDagesh(inp);
    assert.equal(out, 'בית');
  });

  test('NQ-7: ensureBgdKptDagesh — multi-word handles each independently', () => {
    const inp = 'בַּת כְפָר';
    const out = ensureBgdKptDagesh(inp);
    // both ב and כ should have dagesh
    assert.ok(out.split(' ')[0].normalize('NFC') === 'בַּת'.normalize('NFC'));
    assert.ok(out.split(' ')[1].includes('ּ'));
  });

  test('NQ-8: ensureBgdKptDagesh — פ at start of word gets dagesh', () => {
    const inp = 'פִתְחִי';
    const out = ensureBgdKptDagesh(inp);
    assert.ok(out.charAt(0) === 'פ');
    assert.ok(out.includes('ּ'));
  });

  // ========================================================
  // VALIDATOR (Phase D)
  // ========================================================
  test('VL-1: valid item passes', () => {
    const tagged = autoTag({
      island_id: 3, mechanic: 'tap-all', letter: 'מ',
      distractors: ['בַּ', 'נָ', 'רָ']  // includes confusing letters
    });
    const r = validateContent(tagged);
    if (!r.valid) {
      // for debug
      console.error('\nVL-1 errors:', r.errors);
    }
    assert.ok(r.valid, `expected valid, got errors: ${JSON.stringify(r.errors)}`);
  });

  test('VL-2: missing letter → error (for letter-focused)', () => {
    const item = autoTag({ island_id: 3, mechanic: 'tap-all', letter: 'מ' });
    delete item.letter;
    const r = validateContent(item);
    assert.ok(!r.valid);
    assert.ok(r.errors.some(e => e.code === 'missing_letter'));
  });

  test('VL-3: invalid mechanic → error', () => {
    const item = autoTag({ island_id: 3, mechanic: 'tap-all', letter: 'מ' });
    item.mechanic = 'bogus';
    const r = validateContent(item);
    assert.ok(!r.valid);
    assert.ok(r.errors.some(e => e.code === 'invalid_mechanic'));
  });

  test('VL-4: missing rama_task (unsupported island/mech pair) → error', () => {
    const item = autoTag({ island_id: 1, mechanic: 'tap-all', letter: 'מ' });
    const r = validateContent(item);
    assert.ok(!r.valid);
    assert.ok(r.errors.some(e => e.code === 'missing_rama_task'));
  });

  test('VL-5: niqud_missing — Hebrew word without any niqud → error', () => {
    const item = autoTag({
      island_id: 3, mechanic: 'tap-all', letter: 'מ',
      custom_words: ['אמא'],  // bare, no niqud
      distractors: ['בַּ','נָ','רָ']
    });
    const r = validateContent(item);
    assert.ok(r.errors.some(e => e.code === 'niqud_missing'));
  });

  test('VL-6: niqud_violation_bgd_kpt — בַ at start without dagesh → error', () => {
    const item = autoTag({
      island_id: 3, mechanic: 'tap-all', letter: 'ב',
      custom_words: ['בַיִת']  // missing dagesh on ב
    });
    const r = validateContent(item);
    assert.ok(r.errors.some(e => e.code === 'niqud_violation_bgd_kpt'),
      `expected bgd_kpt violation, got ${JSON.stringify(r.errors)}`);
  });

  test('VL-7: distractors_too_few — pick with <3 distractors → error', () => {
    const item = autoTag({
      island_id: 3, mechanic: 'pick', letter: 'מ',
      distractors: ['בַּ', 'נָ']  // only 2
    });
    const r = validateContent(item);
    assert.ok(r.errors.some(e => e.code === 'distractors_too_few'));
  });

  test('VL-8: distractors_too_similar — pick with no confusing letter → warning', () => {
    const item = autoTag({
      island_id: 3, mechanic: 'pick', letter: 'מ',
      distractors: ['שָׁ', 'תָ', 'יָ']  // none confusing to מ
    });
    const r = validateContent(item);
    const warn = r.errors.find(e => e.code === 'distractors_too_similar');
    assert.ok(warn);
    assert.equal(warn.severity, 'warning');
  });

  test('VL-9: letters_involved_empty — no Hebrew letters at all → error', () => {
    const item = { item_id: 'x', tier: 2, mechanic: 'tap-all',
                   rama_task_alignment: 1, peima_target: 1,
                   letter: 'מ', letters_involved: [] };
    const r = validateContent(item);
    assert.ok(r.errors.some(e => e.code === 'letters_involved_empty'));
  });

  test('VL-10: letter_not_in_22 — final letter ם directly → error', () => {
    const item = autoTag({ island_id: 3, mechanic: 'tap-all', letter: 'מ' });
    item.letter = 'ם';  // final form not allowed
    item.letters_involved = ['ם'];  // also invalid
    const r = validateContent(item);
    assert.ok(r.errors.some(e => e.code === 'letter_not_in_22'));
  });

  test('VL-11: tts_pending generates warning, not error', () => {
    const item = autoTag({
      island_id: 3, mechanic: 'tap-all', letter: 'מ',
      distractors: ['בַּ','נָ','רָ']
    });
    item.tts_pending = true;
    const r = validateContent(item);
    assert.ok(r.valid);  // tts_pending is warning only
    assert.ok(r.errors.some(e => e.code === 'tts_pending' && e.severity === 'warning'));
  });

  test('VL-12: findYofiViolations — bare יפי is flagged', () => {
    const v = findYofiViolations('הילדה אמרה יפי גָּדוֹל');
    assert.ok(v.length > 0);
  });

  test('VL-13: distractorsHaveConfusion — ב vs ו/כ are confusing', () => {
    assert.ok(distractorsHaveConfusion('ב', ['וָ']));
    assert.ok(distractorsHaveConfusion('ב', ['כָ']));
    assert.ok(!distractorsHaveConfusion('ב', ['שָ']));
  });

  // ========================================================
  // TTS (Phase C)
  // ========================================================
  test('TT-1: generateTTS falls back to web-speech in node', async () => {
    const r = await generateTTS('בָּאָה');
    assert.equal(r.fallback, 'web-speech');
    assert.equal(r.ttsPending, true);
    assert.equal(r.audioUrl, null);
    assert.ok(r.durationMs > 0);
  });

  test('TT-2: estimateDurationMs scales with character count', () => {
    const short = estimateDurationMs('בָּא');
    const long  = estimateDurationMs('בָּאָה הָאִמָּא מֵהַבַּיִת');
    assert.ok(long > short);
    assert.ok(short >= 300);  // minimum
  });

  test('TT-3: empty input returns pending marker', async () => {
    const r = await generateTTS('');
    assert.equal(r.fallback, 'web-speech');
    assert.equal(r.ttsPending, true);
  });

  // ========================================================
  // LOCAL STORE (Phase E)
  // ========================================================
  test('LS-1: saveDraft + listMyItems roundtrip', async () => {
    _clearAll();
    const item = autoTag({
      island_id: 3, mechanic: 'tap-all', letter: 'מ',
      distractors: ['בַּ','נָ','רָ']
    });
    const { id } = await saveDraft(item);
    assert.ok(id);
    const list = await listMyItems();
    assert.ok(list.some(x => x.item_id === id));
    const found = list.find(x => x.item_id === id);
    assert.equal(found.status, 'draft');
    assert.equal(found.version, 1);
  });

  test('LS-2: publishItem requires validation (bad item rejected)', async () => {
    _clearAll();
    const bad = { item_id: 'bad-1', tier: 2 };  // missing fields
    await saveDraft(bad);
    await assert.rejects(() => publishItem('bad-1'));
  });

  test('LS-3: publishItem on valid item moves draft → published', async () => {
    _clearAll();
    const item = autoTag({
      island_id: 3, mechanic: 'tap-all', letter: 'מ',
      distractors: ['בַּ','נָ','רָ']
    });
    item.item_id = 'good-1';
    await saveDraft(item);
    await publishItem('good-1');
    const list = await listMyItems();
    const found = list.find(x => x.item_id === 'good-1');
    assert.equal(found.status, 'published');
    assert.equal(found.version, 1);
    assert.ok(found.published_at);
    // draft should be gone
    const store = _readStore();
    assert.equal(store.drafts['good-1'], undefined);
  });

  test('LS-4: versioning increments on republish', async () => {
    _clearAll();
    const item = autoTag({
      island_id: 3, mechanic: 'tap-all', letter: 'מ',
      distractors: ['בַּ','נָ','רָ']
    });
    item.item_id = 'ver-1';
    await saveDraft(item);
    await publishItem('ver-1');

    // Re-save as draft + publish again
    await saveDraft(item);
    await publishItem('ver-1');

    const list = await listMyItems();
    const found = list.find(x => x.item_id === 'ver-1');
    assert.equal(found.version, 2);
  });

  test('LS-5: deleteDraft removes from drafts', async () => {
    _clearAll();
    const item = autoTag({
      island_id: 3, mechanic: 'tap-all', letter: 'מ',
      distractors: ['בַּ','נָ','רָ']
    });
    item.item_id = 'del-1';
    await saveDraft(item);
    await deleteDraft('del-1');
    const list = await listMyItems();
    assert.equal(list.find(x => x.item_id === 'del-1'), undefined);
  });

  test('LS-6: listMyItems filters by teacher_id', async () => {
    _clearAll();
    const a = autoTag({
      island_id: 3, mechanic: 'tap-all', letter: 'מ',
      distractors: ['בַּ','נָ','רָ']
    });
    a.teacher_id = 'teacher-a';
    a.item_id = 'a-1';
    const b = autoTag({
      island_id: 3, mechanic: 'tap-all', letter: 'ש',
      distractors: ['בַּ','נָ','רָ']
    });
    b.teacher_id = 'teacher-b';
    b.item_id = 'b-1';
    await saveDraft(a);
    await saveDraft(b);

    // current teacher in node = 'guest', should see neither
    const list = await listMyItems();
    assert.equal(list.length, 0,
      'guest should see no items belonging to teacher-a/teacher-b');
  });

  // ========================================================
  // METADATA helpers
  // ========================================================
  test('MD-1: getAvailableIslands returns 6 islands with mechanics', () => {
    const islands = getAvailableIslands();
    assert.ok(Array.isArray(islands));
    assert.ok(islands.length >= 6);
    for (const isl of islands) {
      assert.ok(typeof isl.id === 'number');
      assert.ok(typeof isl.name_he === 'string');
      assert.ok(Array.isArray(isl.mechanics_supported));
    }
  });

  test('MD-2: getMechanicLabel returns Hebrew', () => {
    assert.equal(getMechanicLabel('tap-all'), 'הקש על כל ה...');
    assert.equal(getMechanicLabel('pick'), 'בחרי אופציה אחת');
  });

  test('MD-3: getTierLabel returns pedagogical Hebrew', () => {
    assert.ok(getTierLabel(1).includes('בסיסי'));
    assert.ok(getTierLabel(2).includes('ליבה'));
    assert.ok(getTierLabel(4).includes('מאסטר'));
  });

  // ========================================================
  // E2E (Phase F.2)
  // ========================================================
  test('E2E-1: draft → autoTag → validate → publish flow', async () => {
    _clearAll();
    const draft = {
      island_id: 3, mechanic: 'tap-all', letter: 'מ',
      distractors: ['בַּ','נָ','רָ']  // includes confusing ב
    };
    const tagged = autoTag(draft);
    const v = validateContent(tagged);
    assert.ok(v.valid, `expected valid, got ${JSON.stringify(v.errors)}`);
    const { id } = await saveDraft(tagged);
    await publishItem(id);
    const list = await listMyItems();
    const found = list.find(x => x.item_id === id);
    assert.ok(found);
    assert.equal(found.status, 'published');
  });

  test('E2E-2: ב item with bad niqud blocked at publish', async () => {
    _clearAll();
    const tagged = autoTag({
      island_id: 3, mechanic: 'tap-all', letter: 'ב',
      custom_words: ['בַיִת']  // missing dagesh on ב
    });
    await saveDraft(tagged);
    await assert.rejects(() => publishItem(tagged.item_id),
      /validation/);
  });

  // ============================================================
  // Done
  // ============================================================
  process.stdout.write('\n\n');
  if (failed === 0) {
    console.log(`✅ ALL GREEN — ${passed} tests passed`);
    process.exit(0);
  } else {
    console.log(`❌ ${failed} failed / ${passed} passed`);
    for (const f of failures) {
      console.log(`\n--- ${f.name} ---`);
      console.log(f.error.stack || f.error.message || String(f.error));
    }
    process.exit(1);
  }
}

runAll().catch(e => {
  console.error('Fatal:', e);
  process.exit(2);
});
