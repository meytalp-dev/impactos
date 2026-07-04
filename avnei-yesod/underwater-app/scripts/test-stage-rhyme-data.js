// ============================================================================
// test-stage-rhyme-data.js — אימות data/rhyme-rounds.json (משחקון החריזה · M4)
//
// מריץ: node test-stage-rhyme-data.js
// בודק: מבנה הסבבים · בדיוק תשובה נכונה אחת · EPA על כל מסיח · ניקוד מלא ·
//   חרוז = אותה אות-בסיס סופית (מנורמלת סופיות) · מסיח-פתיחה = אותה אות פותחת ·
//   מסיח-רחוק לא מסתיים כמו היעד · קבצי MP3 קיימים · המפתחות מכוסים בסקריפט ההפקה.
// ============================================================================
'use strict';

const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(APP, 'data', 'rhyme-rounds.json'), 'utf8'));
const genPy = fs.readFileSync(path.join(__dirname, 'generate-rhyme-audio.py'), 'utf8');
const stageHtml = fs.readFileSync(path.join(APP, 'stage-rhyme.html'), 'utf8');

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  ✅ ' + msg); }
  else { fail++; console.log('  ❌ ' + msg); }
}

const FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
const baseLetters = (w) => [...w].filter(c => c >= 'א' && c <= 'ת').map(c => FINALS[c] || c);
const hasNiqud = (w) => /[ְ-ּׁׂ]/.test(w);

console.log('============================================================');
console.log('בדיקה 1 — מבנה כללי');
console.log('============================================================');
ok(Array.isArray(data.rounds) && data.rounds.length === 8, '8 סבבים');
ok(new Set(data.rounds.map(r => r.id)).size === data.rounds.length, 'מזהי סבבים ייחודיים');
ok(typeof data.default_characteristic_id === 'string' && data.default_characteristic_id.length > 0,
   'default_characteristic_id קיים (' + data.default_characteristic_id + ')');

console.log('============================================================');
console.log('בדיקה 2 — כל סבב: 3 אפשרויות · נכונה אחת · EPA על מסיחים · ניקוד');
console.log('============================================================');
data.rounds.forEach(r => {
  const correct = r.options.filter(o => o.is_correct);
  const wrong = r.options.filter(o => !o.is_correct);
  ok(r.options.length === 3, r.id + ': 3 אפשרויות');
  ok(correct.length === 1, r.id + ': בדיוק תשובה נכונה אחת');
  ok(wrong.every(o => o.epa && o.epa.what === 'Sound' && o.epa.task === 'find' &&
       ['initial', 'final'].includes(o.epa.where)),
     r.id + ': לכל מסיח EPA תקין (Sound·initial/final·find)');
  ok(correct.every(o => !o.epa), r.id + ': לתשובה הנכונה אין EPA');
  const words = [r.target.word].concat(r.options.map(o => o.word));
  ok(words.every(hasNiqud), r.id + ': כל המילים מנוקדות');
  ok(new Set(r.options.map(o => o.word)).size === 3 && !r.options.some(o => o.word === r.target.word),
     r.id + ': אין כפילות מילים בסבב');
});

console.log('============================================================');
console.log('בדיקה 3 — פדגוגיית חריזה: סיומת · מסיח-פתיחה · מסיח-רחוק');
console.log('============================================================');
data.rounds.forEach(r => {
  const t = baseLetters(r.target.word);
  const rhyme = r.options.find(o => o.is_correct);
  const rl = baseLetters(rhyme.word);
  ok(rl[rl.length - 1] === t[t.length - 1],
     r.id + ': החרוז מסתיים באותה אות-בסיס (' + r.target.word + '–' + rhyme.word + ')');
  const onset = r.options.find(o => o.lure === 'onset');
  ok(!!onset && baseLetters(onset.word)[0] === t[0],
     r.id + ': מסיח-פתיחה מתחיל כמו היעד (' + (onset ? onset.word : '—') + ')');
  r.options.filter(o => !o.is_correct).forEach(o => {
    const ol = baseLetters(o.word);
    ok(ol[ol.length - 1] !== t[t.length - 1],
       r.id + ': מסיח «' + o.word + '» לא מסתיים כמו היעד');
  });
});

console.log('============================================================');
console.log('בדיקה 4 — נכסי אודיו: MP3 קיימים · מפתחות מכוסים בסקריפט ההפקה');
console.log('============================================================');
const keys = new Set(['rhyme-intro']);
data.rounds.forEach(r => {
  keys.add(r.target.audio_key);
  r.options.forEach(o => keys.add(o.audio_key));
});
let missingMp3 = [], missingGen = [];
keys.forEach(k => {
  ok(/^rhyme-(intro|w-[a-z]+)$/.test(k), 'מפתח תקני: ' + k);
  const f = path.join(APP, 'assets', 'audio', k + '.mp3');
  if (!(fs.existsSync(f) && fs.statSync(f).size > 0)) missingMp3.push(k);
  if (!genPy.includes('"' + k + '"')) missingGen.push(k);
});
ok(missingMp3.length === 0, 'כל ' + keys.size + ' קבצי MP3 קיימים ולא-ריקים' +
   (missingMp3.length ? ' — חסרים: ' + missingMp3.join(', ') : ''));
ok(missingGen.length === 0, 'כל המפתחות מכוסים ב-generate-rhyme-audio.py' +
   (missingGen.length ? ' — חסרים: ' + missingGen.join(', ') : ''));

console.log('============================================================');
console.log('בדיקה 5 — stage-rhyme.html מחווט נכון');
console.log('============================================================');
ok(stageHtml.includes('data/rhyme-rounds.json'), 'טוען את data/rhyme-rounds.json');
ok(stageHtml.includes('mechanic-mcq.js'), 'משתמש בליבת mechanic-mcq (two-tap מובנה)');
ok(stageHtml.includes("mode: 'audio'") || stageHtml.includes('mode: \'audio\''),
   'אפשרויות במצב audio (רמקולים זהים-מראה)');
ok(stageHtml.includes('scene-stage-3-bg.png'), 'scene-bg PNG (חוקי העולם)');
ok(stageHtml.includes('event-logger.js'), 'event-logger טעון');
ok(/ISLAND_PA\s*=\s*1/.test(stageHtml), 'primary_island_id = 1 (מודעות פונולוגית)');

console.log('============================================================');
console.log('סיכום: ' + pass + ' עברו · ' + fail + ' נכשלו');
console.log('============================================================');
process.exit(fail ? 1 : 0);
