// ============================================================================
// build-embedded-data.js — צריבת קבצי התוכן לקובץ JS אחד לפתיחה מ-file://
//
// למה: בפתיחה ישירה של משחקון מהקובץ (file://, בלי שרת) הדפדפן חוסם כל
// fetch/XHR של JSON מקומי → "שגיאה בטעינת המשחקון". הסקריפט הזה צורב את כל
// קבצי התוכן ל-js/shared/embedded-data.js, ו-file-protocol-shim.js מגיש מהם
// כשהדף נפתח מ-file:// (ב-http הכל נשאר כרגיל — ה-JSON הוא המקור).
//
// הרצה: node scripts/build-embedded-data.js   (מתוך underwater-app/)
// 🔴 אחרי כל עריכה של קובץ JSON תוכן — להריץ מחדש ולקמט את שני הקבצים יחד.
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');

const APP = path.resolve(__dirname, '..');          // underwater-app/
const OUT = path.join(APP, 'js', 'shared', 'embedded-data.js');

// מפתחות = הנתיב היחסי המדויק שבו הדפים/המודולים קוראים fetch/XHR
// (יחסית ל-underwater-app/, כולל '../curriculum/...').
const GLOBS = [
  { dir: 'data', recurse: true, prefix: 'data/' },
  { dir: 'interventions', recurse: false, prefix: 'interventions/' },
];
const SINGLES = [
  'assets/vocab/_manifest.json',
  '../curriculum/questions-grade1.json',
  '../curriculum/yearly-plan/grade1-daily-tashpaz.json',
];
const PACK_DIR = '../curriculum/packs/grade1-tashpaz';

function listJson(absDir, recurse) {
  if (!fs.existsSync(absDir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
    const full = path.join(absDir, ent.name);
    if (ent.isDirectory() && recurse) out.push(...listJson(full, true));
    else if (ent.isFile() && ent.name.endsWith('.json')) out.push(full);
  }
  return out;
}

const entries = {};
let bytes = 0, failed = [];

function add(key, absFile) {
  try {
    const raw = fs.readFileSync(absFile, 'utf8');
    entries[key] = JSON.parse(raw);   // גם מאמת שה-JSON תקין
    bytes += raw.length;
  } catch (e) {
    failed.push(key + ' — ' + e.message);
  }
}

for (const g of GLOBS) {
  const absDir = path.join(APP, g.dir);
  for (const f of listJson(absDir, g.recurse)) {
    const rel = path.relative(absDir, f).split(path.sep).join('/');
    add(g.prefix + rel, f);
  }
}
for (const s of SINGLES) add(s, path.join(APP, s));
for (const f of listJson(path.join(APP, PACK_DIR), false)) {
  add(PACK_DIR + '/' + path.basename(f), f);
}

if (failed.length) {
  console.error('קבצים שנכשלו (לא נצרבו):');
  failed.forEach(f => console.error('  ✗ ' + f));
}

const header =
  '// AUTO-GENERATED — נוצר ע"י scripts/build-embedded-data.js. לא לערוך ידנית!\n' +
  '// המקור = קבצי ה-JSON עצמם; אחרי עריכת תוכן להריץ: node scripts/build-embedded-data.js\n' +
  '// משמש את file-protocol-shim.js לפתיחת משחקונים ישירות מ-file:// (בלי שרת).\n';
fs.writeFileSync(OUT, header + 'window.AVNEI_EMBEDDED = ' + JSON.stringify(entries) + ';\n', 'utf8');

console.log('נצרבו ' + Object.keys(entries).length + ' קבצי תוכן (' +
  Math.round(bytes / 1024) + 'KB מקור) → ' + path.relative(APP, OUT));
