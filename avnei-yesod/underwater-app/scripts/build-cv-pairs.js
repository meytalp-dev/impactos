#!/usr/bin/env node
// ============================================================================
// build-cv-pairs.js — בונה את data/island-04-cv/cv-pairs.json
// סוכן 29 · 29.5.2026 · אי 4 (CV)
//
// קוראים מ-vowel-adapter (single source of truth) ויוצרים JSON שטוח של 154
// CV pairs. המאגר הוא הנכס היחיד שמהווה "מי לעבוד עליו" באי 4.
//
// הרצה ידנית: node scripts/build-cv-pairs.js
// (לא מורץ אוטומטית — מיטל מאשרת חידוש כשמוסיפים anchor words חדשים).
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');

const VA = require(path.resolve(__dirname, '..', 'js', 'shared', 'vowel-adapter.js'));

// LETTER_KEY map — תואם sound-<key>.mp3 באי 3 (data/island-03-letters/_schema.md).
const LETTER_KEY = {
  'א': 'alef',  'ב': 'bet',   'ג': 'gimel', 'ד': 'dalet', 'ה': 'hey',
  'ו': 'vav',   'ז': 'zayin', 'ח': 'het',   'ט': 'tet',   'י': 'yud',
  'כ': 'kaf',   'ל': 'lamed', 'מ': 'mem',   'נ': 'nun',   'ס': 'samekh',
  'ע': 'ayin',  'פ': 'pey',   'צ': 'tzadi', 'ק': 'qof',   'ר': 'resh',
  'ש': 'shin',  'ת': 'tav',
};

// PHONEME_PREFIX — IPA-לייט פר vowel. למבוגרים בלבד; לא מוצג לילדה.
const VOWEL_PHONEME = {
  kamatz: 'a', patach: 'a', shva: 'ə', hiriq: 'i', holam: 'o', tzere: 'e', segol: 'e',
};

// LETTER_PHONEME_INIT — מה האות בתחילת CV נשמעת.
// פישוט: ב=b, ד=d, ה=h, ו=v, ז=z, ח=ħ, ט=t, י=y, כ=k, ל=l, מ=m, נ=n, ס=s, פ=p, צ=ts, ק=k, ר=r, ש=ʃ, ת=t
// אלף+עין = פתוח (אפס עיצור).
const LETTER_PHONEME = {
  'א': '', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
  'ח': 'ħ', 'ט': 't', 'י': 'y', 'כ': 'k', 'ל': 'l', 'מ': 'm', 'נ': 'n',
  'ס': 's', 'ע': '', 'פ': 'p', 'צ': 'ts', 'ק': 'k', 'ר': 'r', 'ש': 'ʃ', 'ת': 't',
};

// ANCHOR_SOURCE_HINT — איפה ה-seed הגיע מ-vocab-bank.json (לדיאגנוסטיקה בלבד).
// המקור האמיתי חי ב-vowel-adapter.ANCHOR_WORDS — כאן רק הקשר.
const ANCHOR_SOURCES = {
  'מ:kamatz':  'vocab-bank/book_2_station_6 (מָחָר)',
  'מ:patach':  'vocab-bank/book_2_station_1 (מַטֶּה)',
  'מ:hiriq':   'vocab-bank/book_3_station_1 (מִכְנָסַיִם)',
  'מ:segol':   'standard (מֶלֶךְ)',
  'ב:kamatz':  'vocab-bank/book_2_station_2 (בָּרָק)',
  'ב:patach':  'vocab-bank/book_2_station_9 (בַּת)',
  'ב:shva':    'vocab-bank/book_2_station_10 (בְּרֵכָה)',
  'ב:tzere':   'vocab-bank/book_2_station_10 (בֵּיצָה)',
  'ר:patach':  'vocab-bank/book_2_station_2 (רַק)',
  'ק:patach':  'vocab-bank/book_2_station_2 (קַר)',
  'ק:shva':    'vocab-bank/book_2_station_10 (קְפִיץ)',
  'ת:kamatz':  'vocab-bank/book_2_station_2 (תָּמָר)',
  'ת:patach':  'vocab-bank/book_2_station_1 (תַּפּוּז)',
  'ת:shva':    'vocab-bank/book_2_station_10 (תְּרוּפָה)',
  'ת:hiriq':   'vocab-bank/book_3_station_1 (תִּיק)',
};

function buildPhoneme(letter, vowelId) {
  const lp = LETTER_PHONEME[letter];
  const vp = VOWEL_PHONEME[vowelId];
  if (lp === undefined || vp === undefined) return null;
  // shva בראש הברה: לעיתים שווא נע (/ə/) ולעיתים שתיקה. ב-CV של פתיחה נציג /ə/.
  return '/' + (lp || '') + (vp || '') + '/';
}

const all = VA.getAllCVPairs();
const vowels = VA.getVowels().map(function (v) {
  return {
    id: v.id, symbol: v.symbol, he: v.displayHe,
    phoneme: v.phoneme, book: v.book,
  };
});

const pairs = all.map(function (entry) {
  const key = entry.key;
  return {
    letter: entry.letter,
    letter_key: LETTER_KEY[entry.letter] || null,
    vowel_id: entry.vowelId,
    cv: entry.cv,
    key: key,
    phoneme: buildPhoneme(entry.letter, entry.vowelId),
    anchor_word: entry.anchor_word,
    anchor_source: entry.anchor_word ? (ANCHOR_SOURCES[key] || 'manual-seed') : 'ASK_MEYTAL',
  };
});

const output = {
  $schema_version: '1.0',
  created: '2026-05-29',
  agent: 'סוכן 29 · אי 4',
  _meta: {
    letters_count: 22,
    vowels_count: 7,
    total_pairs: pairs.length,
    audio_strategy: 'web-speech-he-il (post-pilot: AvriNeural MP3)',
    anchor_word_source: 'vocab-bank.json — seeded ב-vowel-adapter.ANCHOR_WORDS; חסרים = ASK_MEYTAL',
    anchor_filled_count: pairs.filter(function (p) { return p.anchor_word; }).length,
    anchor_missing_count: pairs.filter(function (p) { return !p.anchor_word; }).length,
  },
  vowels: vowels,
  pairs: pairs,
};

const outPath = path.resolve(__dirname, '..', 'data', 'island-04-cv', 'cv-pairs.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf-8');
console.log('✓ wrote ' + outPath);
console.log('  total pairs: ' + pairs.length);
console.log('  anchor words filled: ' + output._meta.anchor_filled_count);
console.log('  anchor words missing (ASK Meytal): ' + output._meta.anchor_missing_count);
