#!/usr/bin/env node
/**
 * בודק חוזה: מה granta.js כותב  ↔  מה המיגרציה באמת מתירה.
 *
 * נולד מפספוס אמיתי של התזמורת (29.8.2026). ההצלבה הראשונה שלי בדקה רק
 * "האם שם השדה קיים כעמודה", ולכן החמיצה שני באגים שהיו מפילים כל הגשה:
 *   1. `utm` נשלח כאובייקט — אין עמודה כזו (הסכימה שטוחה: utm_source, ...).
 *   2. `status` קיים כעמודה — אבל אינו ב-GRANT ברמת-העמודה ל-anon.
 *      קיום עמודה ≠ הרשאת כתיבה עליה.
 *
 * הרצה:  node granta/_orchestra/check-schema-contract.mjs
 * יציאה: 0 = נקי · 1 = נמצא פער
 */
import fs from 'node:fs';

const SQL = 'supabase/migrations/0100_granta_core.sql';
const JS  = 'granta/assets/granta.js';

const stripComments = (s) => s.replace(/--[^\n]*/g, '');
const sql = stripComments(fs.readFileSync(SQL, 'utf8'));
const js  = fs.readFileSync(JS, 'utf8');

/* ---- 1. עמודות פר טבלה ---- */
const columns = {};
for (const m of sql.matchAll(/create\s+table\s+if\s+not\s+exists\s+public\.(\w+)\s*\(([\s\S]*?)\n\s*\);/gi)) {
  const [, table, body] = m;
  columns[table] = body
    .split('\n')
    .map((l) => l.match(/^\s{2,}([a-z_][a-z0-9_]*)\s+[A-Za-z]/))
    .filter(Boolean)
    .map((x) => x[1])
    .filter((c) => !['constraint', 'primary', 'unique', 'foreign', 'check'].includes(c));
}

/* ---- 2. GRANT ברמת-עמודה פר תפקיד ---- */
const grants = {}; // grants[table][role] = Set(columns)
for (const m of sql.matchAll(/GRANT\s+INSERT\s*\(([^)]*)\)\s*ON\s+public\.(\w+)\s+TO\s+([\w\s,]+?);/gi)) {
  const [, colList, table, roleList] = m;
  const cols = colList.split(',').map((c) => c.trim()).filter(Boolean);
  for (const role of roleList.split(',').map((r) => r.trim())) {
    grants[table] ??= {};
    grants[table][role] = new Set(cols);
  }
}

/* ---- 3. מפתחות ה-payload ב-granta.js, מוצמדים לטבלה ---- */
const TABLES = {};
for (const m of js.matchAll(/(\w+):\s*'(granta_\w+)'/g)) TABLES[m[1]] = m[2];

const payloads = [];
for (const m of js.matchAll(/const\s+row\s*=\s*\{([\s\S]*?)\n\s*\};/g)) {
  const keys = [...m[1].matchAll(/^\s+([a-z_][a-z0-9_]*)\s*:/gm)].map((x) => x[1]);
  const after = js.slice(m.index, m.index + 1400);
  const t = after.match(/\.from\(TABLES\.(\w+)\)/);
  if (t && TABLES[t[1]]) payloads.push({ table: TABLES[t[1]], keys });
}

/* ---- 4. הצלבה ---- */
let bad = 0;
console.log(`חוזה סכימה ↔ קוד   (${payloads.length} payloads)\n`);

for (const { table, keys } of payloads) {
  const cols = columns[table] || [];
  const anon = grants[table]?.anon;

  const notAColumn = keys.filter((k) => !cols.includes(k));
  // הרשאת anon נבדקת רק היכן שהוגדר GRANT ברמת-עמודה — שם היא ההגבלה האמיתית.
  const notGranted = anon ? keys.filter((k) => cols.includes(k) && !anon.has(k)) : [];

  const ok = !notAColumn.length && !notGranted.length;
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${table}  (${keys.length} שדות)`);
  if (notAColumn.length) { bad++; console.log(`      אינם עמודה:        ${notAColumn.join(', ')}`); }
  if (notGranted.length) { bad++; console.log(`      אסורים ל-anon:     ${notGranted.join(', ')}`); }
  if (anon && ok) console.log(`      תואם ל-GRANT של anon (${anon.size} עמודות מותרות)`);
}

console.log(bad ? `\n${bad} פערים — ההגשה תיפול בייצור.` : '\nנקי.');
process.exit(bad ? 1 : 0);
