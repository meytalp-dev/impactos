#!/usr/bin/env node
/**
 * בודק סדר יצירה במיגרציה: פונקציית LANGUAGE sql שקוראת מטבלה
 * חייבת להיווצר *אחרי* שהטבלה קיימת.
 *
 * נולד מבאג אמיתי (29.8.2026, נתפס בהרצה של מיטל מול Supabase):
 *   ERROR 42P01: relation "public.granta_users" does not exist
 * granta_my_org_ids() נוצרה בשורה 67 וקראה מטבלה שנוצרת בשורה 167.
 *
 * 🔴 למה שני סוכנים פספסו את זה: Postgres מאמת את גוף הפונקציה כבר ב-CREATE
 * FUNCTION (ל-LANGUAGE sql, לא ל-plpgsql). פרסר בודק תחביר והפניות — הוא לא
 * בודק סדר. רק הרצה אמיתית מול מסד נתונים בודקת סדר. הבדיקה הזו סוגרת את הפער.
 *
 * הרצה:  node granta/_orchestra/check-sql-order.mjs [קובץ.sql ...]
 * ברירת מחדל: כל supabase/migrations/0100*.sql
 * יציאה: 0 = נקי · 1 = נמצא פער
 */
import fs from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync('supabase/migrations')
      .filter((f) => f.startsWith('0100') && f.endsWith('.sql'))
      .map((f) => path.join('supabase/migrations', f));

let bad = 0;

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const sql = raw.replace(/--[^\n]*/g, '');          // הערות לא סופרות כהפניה
  const lineAt = (i) => sql.slice(0, i).split('\n').length;

  const created = {};
  for (const m of sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+public\.(\w+)/g)) created[m[1]] = m.index;

  console.log(`\n${file}`);

  for (const m of sql.matchAll(/CREATE OR REPLACE FUNCTION\s+public\.(\w+)\s*\([^)]*\)([\s\S]*?)\$\$;/g)) {
    const [, name, body] = m;
    const isSql = /LANGUAGE\s+sql/i.test(body);
    const refs = new Set([...body.matchAll(/public\.(\w+)/g)].map((x) => x[1]));
    const tables = [...refs].filter((r) => r in created);
    const late = tables.filter((t) => created[t] > m.index).sort();

    if (isSql && late.length) {
      bad++;
      console.log(`  FAIL  ${name}  (שורה ${lineAt(m.index)}, LANGUAGE sql)`);
      console.log(`        מפנה לטבלה שנוצרת אחריו: ${late.join(', ')}  → ERROR 42P01 בהרצה`);
    } else {
      const note = tables.length ? `קורא מ-${tables.sort().join(', ')}` : 'לא נוגע בטבלאות';
      console.log(`  OK    ${name.padEnd(34)} ${(isSql ? 'sql' : 'plpgsql').padEnd(8)} ${note}`);
    }
  }
}

console.log(bad
  ? `\n${bad} פונקציות ייכשלו בהרצה.`
  : '\nנקי — כל פונקציית LANGUAGE sql נוצרת אחרי הטבלאות שהיא קוראת מהן.');
process.exit(bad ? 1 : 0);
