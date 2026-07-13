// gen-t10.js — item bank for T10 · 👀 Light Up the Face (sub-topic "Face").
// Mirrors animals.json schema so the same engine + light-beam consume it.
// Run:  node lumi/scratchpad/gen-t10.js   → writes lumi/items/t10-face.json
//
// Pedagogy (locked sources: 2026-07-13 v2-redirect + learning-model; CLAUDE.md brief):
//  • no_read — meaning via recorded EN audio + Lumi's face + gesture. Zero shown text.
//  • MEASURED core = receptive recognition of a FACE-PART word → light up that part on
//    Lumi's face (clean single decision). First-tap-selects + central target button +
//    first-attempt-only are enforced by _measured-core.js; this file only supplies items.
//  • eyes / nose / mouth / ears → recognize ×3 + discriminate ×1  = word_receptive.
//  • confusable pairs: eyes↔ears (paired side/front features), nose↔mouth (central lower face).
//  • comprehend ×1 per word — the TPR chunk "Touch your ___." = chunk_comprehension.
//  • produce ×1 — unmeasured self-listen ("Can you say… nose?").
// hotspots (not cards): the option "img" IS the face part; the HTML places each at its
//  anatomical position on Lumi's face and reveals it with the light beam.
const fs = require('fs');
const path = require('path');

const TOPIC = 'face';
const SUB = 'face';
const WORDS = ['eyes', 'nose', 'mouth', 'ears'];

// 🆘 help (Hebrew, procedural — spoken by the SOS button only, never shown as content)
const HELP = {
  eyes:  'לומי מחפש את העיניים',
  nose:  'לומי מחפש את האף',
  mouth: 'לומי מחפש את הפה',
  ears:  'לומי מחפש את האוזניים',
};
// confusable partner (kept OUT of recognize distractors; IS the discriminate contrast)
const CONFUSE = { eyes: 'ears', ears: 'eyes', nose: 'mouth', mouth: 'nose' };
// the TPR comprehension chunk (measured) — "Touch your ___."
const TOUCH = { eyes: 'Touch your eyes.', nose: 'Touch your nose.', mouth: 'Touch your mouth.', ears: 'Touch your ears.' };

const items = [];
const id = (dim, w, n) => `${TOPIC}.${SUB}.${dim}.${w}.0${n}`;

// place `word` at slot `pos` among the 2 non-confusable parts (balanced correct-position)
function recogOpts(word, pos) {
  const distractors = WORDS.filter((w) => w !== word && w !== CONFUSE[word]); // exactly 2
  const slots = distractors.slice();
  slots.splice(pos, 0, word);
  return slots.map((img) => ({ img, correct: img === word }));
}

WORDS.forEach((w) => {
  // MEET — Lumi points to the part on its own face (unmeasured).
  items.push({
    id: id('meet', w, 1), topic: TOPIC, subtopic: SUB, no_read: true,
    dimension: 'meet', target: [w], measured: false,
    media: { img: w, animation: `lumi points to its ${w}`, audio_en: [w, w, `My ${w}!`] },
    interaction: 'none',
  });

  // RECOGNIZE ×3 (measured) — hear the part, light it up on Lumi's face.
  [0, 1, 2].forEach((pos, i) => {
    items.push({
      id: id('recognize', w, i + 1), topic: TOPIC, subtopic: SUB, no_read: true,
      dimension: 'recognize', target: [w], measured: true,
      prompt: { audio_en: w, gesture: 'lumi listens', instruction_key: 'listen_and_choose' },
      options: recogOpts(w, pos),
      distractor_rationale: 'within face-parts; confusable partner excluded (lives in discriminate)',
      help_he: HELP[w],
    });
  });

  // DISCRIMINATE ×1 (measured) — the confusable face-part contrast.
  const partner = CONFUSE[w];
  const third = WORDS.filter((x) => x !== w && x !== partner)[0];
  const dOpts = [w, partner, third];          // target first; positions vary enough across words
  items.push({
    id: id('discriminate', w, 1), topic: TOPIC, subtopic: SUB, no_read: true,
    dimension: 'discriminate', target: [w], measured: true, confusable_with: partner,
    prompt: { audio_en: w, gesture: 'lumi listens carefully', instruction_key: 'listen_and_choose' },
    options: dOpts.map((img) => ({ img, correct: img === w })),
    distractor_rationale: `within-topic; ${w}↔${partner} face-part confusion`,
    help_he: HELP[w],
  });

  // COMPREHEND ×1 (measured) — the "Touch your ___." TPR chunk carries the instruction.
  const cThird = WORDS.filter((x) => x !== w && x !== partner)[0];
  const cOpts = [partner, cThird, w];         // target last here for position balance
  items.push({
    id: id('comprehend', w, 1), topic: TOPIC, subtopic: SUB, no_read: true,
    dimension: 'comprehend', target: [w], measured: true, kc_comprehension: true,
    prompt: { audio_en: TOUCH[w], gesture: 'lumi points and asks', instruction_key: 'find_it' },
    options: cOpts.map((img) => ({ img, correct: img === w })),
    distractor_rationale: 'within-topic; chunk carries the instruction (TPR: touch your ___)',
  });

  // PRODUCE (unmeasured self-listen).
  items.push({
    id: id('produce', w, 1), topic: TOPIC, subtopic: SUB, no_read: true,
    dimension: 'produce', target: [w], measured: false,
    prompt: { audio_en: `Can you say… ${w}?`, gesture: 'lumi leans in, excited' },
    record: true, scored: false, feedback_en: 'Lumi heard you!',
  });
});

fs.writeFileSync(
  path.join(__dirname, '..', 'items', 't10-face.json'),
  JSON.stringify(items, null, 1) + '\n'
);
console.log('t10-face.json written:', items.length, 'items');
