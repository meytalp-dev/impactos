#!/usr/bin/env node
// validate-pack.js — C.13 CLI validator לפאק JSON
//
// usage:
//   node validate-pack.js september-2026.json
//   node validate-pack.js  (אם בלי ארגומנט — מאמת את כל הפאקים ב-grade1-tashpaz/)
//
// exit codes:
//   0 — תקין
//   1 — שגיאות validation
//   2 — קובץ לא נמצא / JSON שבור
//
// spec: _handoff/2026-05-28-C11-C12-C13-pack-bkt-spec.md §5.3
// schema: curriculum/packs/_schema.md §6

'use strict';

const fs = require('fs');
const path = require('path');

const VALID_MECHANICS = ['tap-all', 'pick', 'memory-pair', 'sort-by-letter'];
const VALID_FOCUS_MODES = ['letters', 'strand'];
const VALID_TYPES = ['new', 'review'];
const REQUIRED_TIER_KEYS = ['1', '2', '3', '4'];

const PACKS_DIR = path.resolve(__dirname, '..', '..', 'curriculum', 'packs', 'grade1-tashpaz');

// ============================================================================
// validators
// ============================================================================

function validatePack(pack, fileName) {
  const errors = [];
  const warnings = [];

  // ---- pack-level required fields ----
  const requiredTopFields = ['pack_id', 'month_index', 'year', 'focus_mode', 'primary_strand', 'tiers'];
  for (const f of requiredTopFields) {
    if (pack[f] === undefined || pack[f] === null) {
      errors.push(`pack: שדה חובה חסר — ${f}`);
    }
  }

  // ---- focus_mode ----
  if (pack.focus_mode && !VALID_FOCUS_MODES.includes(pack.focus_mode)) {
    errors.push(`pack.focus_mode: ערך לא תקין "${pack.focus_mode}" (צריך: ${VALID_FOCUS_MODES.join(' | ')})`);
  }

  // ---- letters/strand mutual exclusion ----
  if (pack.focus_mode === 'letters') {
    if (!Array.isArray(pack.letters_in_focus) || pack.letters_in_focus.length === 0) {
      errors.push('pack.letters_in_focus: חובה array לא ריק כש-focus_mode=letters');
    }
    if (pack.strand_breakdown !== null && pack.strand_breakdown !== undefined) {
      warnings.push('pack.strand_breakdown: יש לקבע ל-null כש-focus_mode=letters');
    }
  } else if (pack.focus_mode === 'strand') {
    if (!pack.strand_breakdown || typeof pack.strand_breakdown !== 'object') {
      errors.push('pack.strand_breakdown: חובה object כש-focus_mode=strand');
    } else {
      if (!Array.isArray(pack.strand_breakdown.skills) || pack.strand_breakdown.skills.length === 0) {
        errors.push('pack.strand_breakdown.skills: חובה array לא ריק');
      }
      if (!pack.strand_breakdown.weight_per_skill || typeof pack.strand_breakdown.weight_per_skill !== 'object') {
        errors.push('pack.strand_breakdown.weight_per_skill: חובה object');
      } else {
        const sum = Object.values(pack.strand_breakdown.weight_per_skill).reduce((s, v) => s + v, 0);
        if (Math.abs(sum - 1.0) > 0.001) {
          errors.push(`pack.strand_breakdown.weight_per_skill: סכום משקלים = ${sum.toFixed(3)} (צריך 1.0)`);
        }
      }
    }
    if (pack.letters_in_focus !== null && pack.letters_in_focus !== undefined) {
      warnings.push('pack.letters_in_focus: יש לקבע ל-null כש-focus_mode=strand');
    }
  }

  // ---- primary_strand ----
  if (pack.primary_strand !== undefined && (pack.primary_strand < 1 || pack.primary_strand > 5)) {
    errors.push(`pack.primary_strand: ${pack.primary_strand} (צריך 1-5)`);
  }

  // ---- tiers structure ----
  if (pack.tiers && typeof pack.tiers === 'object') {
    for (const key of REQUIRED_TIER_KEYS) {
      if (!pack.tiers[key]) {
        errors.push(`pack.tiers["${key}"]: חסר — חייבים 4 tiers (1-4)`);
      }
    }
    const extraKeys = Object.keys(pack.tiers).filter(k => !REQUIRED_TIER_KEYS.includes(k));
    for (const k of extraKeys) {
      errors.push(`pack.tiers["${k}"]: key לא תקין — מותרים רק "1","2","3","4"`);
    }

    // ---- per-tier validation ----
    for (const tierKey of REQUIRED_TIER_KEYS) {
      const tier = pack.tiers[tierKey];
      if (!tier) continue;

      if (!Array.isArray(tier.items)) {
        errors.push(`tiers["${tierKey}"].items: חובה array`);
        continue;
      }
      if (tier.items.length === 0) {
        warnings.push(`tiers["${tierKey}"].items: ריק (אין פריטים)`);
      }

      // tier 4 items_distribution
      if (tierKey === '4' && tier.items_distribution) {
        const dist = tier.items_distribution;
        const distSum = (dist.new || 0) + (dist.review || 0);
        if (Math.abs(distSum - 1.0) > 0.001) {
          errors.push(`tiers["4"].items_distribution: סכום new+review = ${distSum.toFixed(3)} (צריך 1.0)`);
        }
      }

      // ---- per-item validation ----
      tier.items.forEach((item, idx) => {
        const ctx = `tiers["${tierKey}"].items[${idx}] (${item.item_id || '<no item_id>'})`;
        validateItem(item, tierKey, pack, ctx, errors);
      });
    }
  }

  return { errors, warnings };
}

function validateItem(item, tierKey, pack, ctx, errors) {
  // required fields
  if (!item.item_id) errors.push(`${ctx}: item_id חסר`);
  if (item.tier === undefined) errors.push(`${ctx}: tier חסר`);
  if (item.type === undefined) errors.push(`${ctx}: type חסר`);
  if (!item.mechanic) errors.push(`${ctx}: mechanic חסר`);
  if (item.rama_task_alignment === undefined || item.rama_task_alignment === null) {
    errors.push(`${ctx}: rama_task_alignment חסר (A0.2)`);
  }
  if (item.peima_target === undefined || item.peima_target === null) {
    errors.push(`${ctx}: peima_target חסר (A0.2)`);
  }

  // tier must match parent
  const expectedTier = parseInt(tierKey, 10);
  if (item.tier !== undefined && item.tier !== expectedTier) {
    errors.push(`${ctx}: item.tier=${item.tier} לא תואם ל-parent (${expectedTier})`);
  }

  // type enum
  if (item.type !== undefined && !VALID_TYPES.includes(item.type)) {
    errors.push(`${ctx}: type "${item.type}" לא תקין (${VALID_TYPES.join('|')})`);
  }

  // mechanic enum
  if (item.mechanic && !VALID_MECHANICS.includes(item.mechanic)) {
    errors.push(`${ctx}: mechanic "${item.mechanic}" לא תקין (${VALID_MECHANICS.join('|')})`);
  }

  // rama_task_alignment range
  if (item.rama_task_alignment !== undefined && item.rama_task_alignment !== null) {
    if (item.rama_task_alignment < 1 || item.rama_task_alignment > 10) {
      errors.push(`${ctx}: rama_task_alignment=${item.rama_task_alignment} מחוץ לטווח 1-10`);
    }
  }

  // peima_target range
  if (item.peima_target !== undefined && item.peima_target !== null) {
    if (item.peima_target < 1 || item.peima_target > 3) {
      errors.push(`${ctx}: peima_target=${item.peima_target} מחוץ לטווח 1-3`);
    }
  }

  // focus_mode-conditional fields
  if (pack.focus_mode === 'letters') {
    if (item.type === 'new') {
      if (!item.letter) {
        errors.push(`${ctx}: letter חסר (type=new ב-letters-focused)`);
      } else if (Array.isArray(pack.letters_in_focus) && !pack.letters_in_focus.includes(item.letter)) {
        errors.push(`${ctx}: letter "${item.letter}" לא ב-letters_in_focus (${pack.letters_in_focus.join(',')})`);
      }
    }
    if (item.type === 'review' && !item.source_letter) {
      errors.push(`${ctx}: source_letter חסר (type=review)`);
    }
  } else if (pack.focus_mode === 'strand') {
    if (!item.skill) {
      errors.push(`${ctx}: skill חסר (strand-focused)`);
    } else if (pack.strand_breakdown && Array.isArray(pack.strand_breakdown.skills)
               && !pack.strand_breakdown.skills.includes(item.skill)) {
      errors.push(`${ctx}: skill "${item.skill}" לא ב-strand_breakdown.skills`);
    }
  }
}

// ============================================================================
// CLI entry
// ============================================================================

function runOne(filePath) {
  let pack;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    pack = JSON.parse(raw);
  } catch (e) {
    console.error(`❌ ${path.basename(filePath)} — שגיאה בקריאה: ${e.message}`);
    return 2;
  }
  const { errors, warnings } = validatePack(pack, path.basename(filePath));
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`✅ ${path.basename(filePath)} — תקין (pack_id="${pack.pack_id}")`);
    return 0;
  }
  console.log(`${errors.length ? '❌' : '⚠️'} ${path.basename(filePath)} — ${errors.length} שגיאות · ${warnings.length} אזהרות`);
  for (const e of errors) console.log(`   ❌ ${e}`);
  for (const w of warnings) console.log(`   ⚠️  ${w}`);
  return errors.length > 0 ? 1 : 0;
}

function main() {
  const arg = process.argv[2];
  let exitCode = 0;

  if (arg) {
    const filePath = path.isAbsolute(arg)
      ? arg
      : fs.existsSync(arg) ? path.resolve(arg) : path.join(PACKS_DIR, arg);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ קובץ לא נמצא: ${filePath}`);
      process.exit(2);
    }
    exitCode = runOne(filePath);
  } else {
    if (!fs.existsSync(PACKS_DIR)) {
      console.error(`❌ תיקייה לא קיימת: ${PACKS_DIR}`);
      process.exit(2);
    }
    const files = fs.readdirSync(PACKS_DIR)
      .filter(f => f.endsWith('.json') && /-\d{4}\.json$/.test(f))  // רק <month>-<year>.json (execution packs)
      .sort();
    if (files.length === 0) {
      console.error(`⚠️  אין execution packs (תבנית <month>-<year>.json) ב-${PACKS_DIR}`);
      process.exit(0);
    }
    console.log(`📂 בדיקת ${files.length} execution packs ב-${path.basename(PACKS_DIR)}/`);
    let failed = 0;
    for (const f of files) {
      const code = runOne(path.join(PACKS_DIR, f));
      if (code !== 0) failed++;
    }
    console.log(`\n${failed === 0 ? '✅' : '❌'} סיכום: ${files.length - failed}/${files.length} תקפים`);
    exitCode = failed > 0 ? 1 : 0;
  }
  process.exit(exitCode);
}

if (require.main === module) {
  main();
}

module.exports = { validatePack, validateItem };
