#!/usr/bin/env node
/**
 * שומר על קובץ הקונפיג הציבורי של גרנטה.
 *
 * granta/assets/granta-config.js **כן** נמצא בריפו, בכוונה: האתר סטטי,
 * והדפדפן חייב לטעון אותו. המפתח הפומבי (anon / sb_publishable_) מופיע
 * ממילא בקוד המקור של כל דף שנפרס — הסתרתו מהריפו לא מוסיפה הגנה, היא רק
 * שוברת את הפריסה. ההגנה האמיתית היא RLS, ואומתה חי: אנונימי לא קורא לידים
 * ולא כותב פסיקה.
 *
 * 🔴 מה שכן חייב להיחסם: מפתח סודי שנכנס לשם בטעות. service_role עוקף RLS
 * לחלוטין; אם הוא יגיע לקובץ הזה, כל תיק של כל עמותה חשוף לכל אדם באינטרנט.
 *
 * הרצה:  node granta/_orchestra/check-public-config.mjs
 * יציאה: 0 = בטוח · 1 = נמצא סוד
 */
import fs from 'node:fs';

const FILE = 'granta/assets/granta-config.js';

if (!fs.existsSync(FILE)) {
  console.log(`${FILE} לא קיים — אין מה לבדוק.`);
  process.exit(0);
}

const src = fs.readFileSync(FILE, 'utf8');
const problems = [];

// 1. הפורמט החדש — מפתח סודי מזוהה בקידומת.
if (/sb_secret_/i.test(src)) problems.push('נמצא מפתח בפורמט sb_secret_ — זה מפתח סודי.');

// 2. הפורמט הישן — JWT שה-payload שלו נושא role סודי.
for (const m of src.matchAll(/eyJ[A-Za-z0-9_-]{10,}\.([A-Za-z0-9_-]{10,})\./g)) {
  try {
    const part = m[1];
    const pad = part.length % 4 ? '='.repeat(4 - (part.length % 4)) : '';
    const claims = JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString());
    if (claims?.role && claims.role !== 'anon') {
      problems.push(`נמצא JWT עם role="${claims.role}" — רק anon מותר.`);
    }
  } catch { /* לא JWT קריא — לא מסיקים ממנו כלום */ }
}

// 3. סודות של ספקים אחרים שאין להם מה לחפש בקובץ שנטען בדפדפן.
for (const [re, what] of [
  [/GOCSPX-[A-Za-z0-9_-]{6,}/, 'Google OAuth client secret'],
  [/sk-ant-[A-Za-z0-9_-]{10,}/, 'Anthropic API key'],
  [/\bAIza[0-9A-Za-z_-]{30,}/, 'Google API key'],
  [/\b1\/\/0[A-Za-z0-9_-]{20,}/, 'Google refresh token'],
]) if (re.test(src)) problems.push(`נמצא ${what}.`);

// 4. ודא שיש בכלל מפתח פומבי — קונפיג ריק שובר את כל המסכים בשקט.
const key = (src.match(/SUPABASE_ANON_KEY:\s*'([^']*)'/) || [])[1] || '';
if (!key || /YOUR-|HERE/.test(key)) problems.push('SUPABASE_ANON_KEY עדיין מציין — האתר החי לא יעבוד.');
else if (!/^(sb_publishable_|eyJ)/.test(key)) problems.push('SUPABASE_ANON_KEY אינו בפורמט מוכר.');

if (problems.length) {
  console.log(`🔴 ${FILE}\n`);
  problems.forEach((p) => console.log('  ' + p));
  console.log('\nאל תדחפי. החליפי את המפתח ב-Supabase — מחיקה מהקוד לבדה לא מספיקה.');
  process.exit(1);
}

console.log(`${FILE} — מפתח פומבי בלבד, בטוח לפרסום.`);
process.exit(0);
