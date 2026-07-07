#!/usr/bin/env node
/**
 * build-audio-manifest.js — משחזר את "מה כל קליפ אמור לומר" עבור קליפי-הליבה
 * הפונטיים (אותיות + CV), מתוך הדיקטים הסטטיים של סקריפטי ה-generate.
 * זו אמת-המידה שמולה משווים את תמלול-ה-Whisper (qa-pronunciation-sweep).
 *
 * הרצה: node admin/build-audio-manifest.js   →  admin/audio-manifest.json
 *
 * מכסה: name-X · sound-X · find-X · find-sound-X · find-letter-in-word-X ·
 *        which-bubble-X · cv-X-<vowel> (22 אותיות × 9 תנועות, עם דגש ב/כ/פ).
 * קליפים אחרים (מילים/נרטיב) — אין להם טקסט-יעד; הסריקה מציגה רק את הנשמע.
 */
const fs = require('fs');
const path = require('path');

// מ-generate-letter-audio.py
const FILENAMES = { 'א': 'alef', 'ב': 'bet', 'ג': 'gimel', 'ד': 'dalet', 'ה': 'hey', 'ו': 'vav', 'ז': 'zayin', 'ח': 'het', 'ט': 'tet', 'י': 'yud', 'כ': 'kaf', 'ל': 'lamed', 'מ': 'mem', 'נ': 'nun', 'ס': 'samekh', 'ע': 'ayin', 'פ': 'pey', 'צ': 'tzadi', 'ק': 'qof', 'ר': 'resh', 'ש': 'shin', 'ת': 'tav' };
const NAMES = { 'א': 'אָלֶף', 'ב': 'בֵּית', 'ג': 'גִּימֶל', 'ד': 'דָּלֶת', 'ה': 'הֵא', 'ו': 'וָו', 'ז': 'זַיִן', 'ח': 'חֵית', 'ט': 'טֵית', 'י': 'יוֹד', 'כ': 'כָּף', 'ל': 'לָמֶד', 'מ': 'מֵם', 'נ': 'נוּן', 'ס': 'סָמֶךְ', 'ע': 'עַיִן', 'פ': 'פֵּא', 'צ': 'צָדִי', 'ק': 'קוֹף', 'ר': 'רֵישׁ', 'ש': 'שִׁין', 'ת': 'תָּו' };
const SOUNDS = { 'א': 'אְ', 'ב': 'בְּ', 'ג': 'גְּ', 'ד': 'דְּ', 'ה': 'הְ', 'ו': 'וְ', 'ז': 'זְ', 'ח': 'חְ', 'ט': 'טְ', 'י': 'יְ', 'כ': 'כְּ', 'ל': 'לְ', 'מ': 'מְ', 'נ': 'נְ', 'ס': 'סְ', 'ע': 'עְ', 'פ': 'פְּ', 'צ': 'צְ', 'ק': 'קְ', 'ר': 'רְ', 'ש': 'שְׁ', 'ת': 'תְ' };

// מ-generate-island-04-cv-audio.py
const VOWELS = [
  { id: 'kamatz', s: 'ָ' }, { id: 'patach', s: 'ַ' }, { id: 'shva', s: 'ְ' },
  { id: 'hiriq', s: 'ִ' }, { id: 'holam', s: 'ֹ' }, { id: 'tzere', s: 'ֵ' },
  { id: 'segol', s: 'ֶ' }, { id: 'kubutz', s: 'ֻ' }, { id: 'shuruk', s: 'וּ' },
];
const BKP = new Set(['ב', 'כ', 'פ']);
const DAGESH = 'ּ';
function cvText(letter, vowelId, sym) {
  if (vowelId === 'shuruk') return (BKP.has(letter) ? letter + DAGESH : letter) + sym;
  if (BKP.has(letter)) return letter + sym + DAGESH;
  return letter + sym;
}

const manifest = {};
for (const [he, en] of Object.entries(FILENAMES)) {
  manifest[`name-${en}`] = NAMES[he];
  manifest[`sound-${en}`] = SOUNDS[he];
  manifest[`find-${en}`] = `מָצָא אֶת הָאוֹת ${he}`;
  manifest[`find-sound-${en}`] = `מָצָא אֶת הַצְּלִיל ${SOUNDS[he]}`;
  manifest[`find-letter-in-word-${en}`] = `בְּאֵיזוֹ מִלָּה מוֹפִיעָה הָאוֹת ${he}?`;
  manifest[`which-bubble-${en}`] = `בְּאֵיזוֹ בּוּעָה הָאוֹת ${he}?`;
  for (const v of VOWELS) manifest[`cv-${en}-${v.id}`] = cvText(he, v.id, v.s);
}

const out = path.join(__dirname, 'audio-manifest.json');
fs.writeFileSync(out, JSON.stringify(manifest, null, 1), 'utf8');
console.log(`✓ audio-manifest.json — ${Object.keys(manifest).length} קליפי-ליבה (אותיות + CV)`);
