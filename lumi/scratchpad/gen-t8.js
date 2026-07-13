// gen-t8.js — item bank for T8 · 🧺 The Fruit Basket (Fruits / light-beam).
// Mirrors the animals.json schema so the same engine + light-beam consume it.
// Run:  node lumi/scratchpad/gen-t8.js   → writes lumi/items/t8-fruits.json
//
// Pedagogy (locked sources: 2026-07-13 v2-redirect + learning-model):
//  • Words: apple, banana, orange — all familiar to an Israeli 6yo (תפוח/בננה/תפוז);
//    no age_flag needed.
//  • MEASURED core = receptive recognition: hear the word → pick the fruit picture
//    (recognize ×3, balanced correct-position) + one discriminate (confusable FRUIT,
//    ≥1/word). recognize+discriminate → word_receptive per word (bkt.js maps by dim).
//  • DISCRIMINATE confusables: apple↔orange are round-similar (brief); banana pairs
//    against a fruit co-hyponym so the contrast is "which fruit", not "fruit vs toy".
//  • recognize distractors are CROSS-TOPIC, already-MET (animals/objects) so the
//    child keys on the fruit meaning, not novelty.
//  • MEET + PRODUCE are UNMEASURED. PRODUCE self-listens the desire-function chunk
//    "I want a/an ___." — the communicative backbone that recurs across groves.
//  • First-tap-selects + central target button + first-attempt-only are enforced by
//    _measured-core.js; this file only supplies items.
const fs = require('fs');
const path = require('path');

const TOPIC = 'fruits';
const SUB = 'fruits';
const WORDS = ['apple', 'banana', 'orange'];
const HE = { apple: 'תַּפּוּחַ', banana: 'בָּנָנָה', orange: 'תַּפּוּז' };
const ART = { apple: 'an apple', banana: 'a banana', orange: 'an orange' };   // a/an for the chunk
const help = (w) => `לוּמִי מְחַפֵּשׂ ${HE[w]}`;

// cross-topic, already-MET distractors (animals T1/T2, objects) — never a fruit,
// so recognize stays an easy cross-category pick (the fruit-vs-fruit contrast is
// reserved for the discriminate item).
const RECOG = {
  apple:  [ { pos: 0, d: ['dog', 'ball'] }, { pos: 1, d: ['cat', 'car'] },   { pos: 2, d: ['bird', 'cup'] } ],
  banana: [ { pos: 0, d: ['cow', 'shoe'] }, { pos: 1, d: ['duck', 'book'] }, { pos: 2, d: ['dog', 'star'] } ],
  orange: [ { pos: 0, d: ['cat', 'bus'] },  { pos: 1, d: ['pig', 'hat'] },   { pos: 2, d: ['horse', 'tree'] } ],
};
// discriminate: the confusable is another FRUIT (co-hyponym) + a met distractor.
const DISCR = {
  apple:  { pos: 1, conf: 'orange', opts: ['orange', 'apple', 'cup'],  why: 'apple↔orange: both round fruit — visual+category confusable' },
  banana: { pos: 2, conf: 'orange', opts: ['apple', 'orange', 'banana'], why: 'banana↔orange: fruit co-hyponym contrast' },
  orange: { pos: 0, conf: 'apple', opts: ['orange', 'apple', 'ball'],  why: 'orange↔apple: both round fruit — visual+category confusable' },
};

const items = [];
const id = (dim, w, n) => `${TOPIC}.${SUB}.${dim}.${w}.0${n}`;
const optsFor = (word, slots) => slots.map((img) => ({ img, correct: img === word }));

WORDS.forEach((w) => {
  // MEET — Lumi meets the fruit; child is invited to look/say (unmeasured).
  items.push({
    id: id('meet', w, 1), topic: TOPIC, subtopic: SUB, no_read: true,
    dimension: 'meet', target: [w], measured: false,
    media: { img: w, animation: `lumi meets ${ART[w]}`, audio_en: [w, w, `${w.charAt(0).toUpperCase() + w.slice(1)}!`] },
    interaction: 'none',
  });
  // RECOGNIZE ×3 (measured) — hear the fruit word, light up the matching fruit.
  RECOG[w].forEach((r, i) => {
    const slots = [r.d[0], r.d[1]];
    slots.splice(r.pos, 0, w);
    items.push({
      id: id('recognize', w, i + 1), topic: TOPIC, subtopic: SUB, no_read: true,
      dimension: 'recognize', target: [w], measured: true,
      prompt: { audio_en: w, gesture: 'lumi listens', instruction_key: 'listen_and_choose' },
      options: optsFor(w, slots),
      distractor_rationale: 'cross-topic, easy; distractors are already-MET animals/objects (never a fruit)',
      help_he: help(w),
    });
  });
  // DISCRIMINATE ×1 (measured) — the confusable FRUIT contrast.
  const dc = DISCR[w];
  items.push({
    id: id('discriminate', w, 1), topic: TOPIC, subtopic: SUB, no_read: true,
    dimension: 'discriminate', target: [w], measured: true, confusable_with: dc.conf,
    prompt: { audio_en: w, gesture: 'lumi listens carefully', instruction_key: 'listen_and_choose' },
    options: optsFor(w, dc.opts),
    distractor_rationale: `${dc.why}`,
    help_he: help(w),
  });
  // PRODUCE (unmeasured self-listen) — the desire-function chunk "I want a/an ___."
  items.push({
    id: id('produce', w, 1), topic: TOPIC, subtopic: SUB, no_read: true,
    dimension: 'produce', target: [w], measured: false,
    prompt: { audio_en: `I want ${ART[w]}.`, gesture: 'lumi leans in, wanting the fruit' },
    record: true, scored: false, feedback_en: 'Lumi heard you!',
    note: 'connects to the "I want ___" desire-function backbone (recurs across groves)',
  });
});

fs.writeFileSync(
  path.join(__dirname, '..', 'items', 't8-fruits.json'),
  JSON.stringify(items, null, 1) + '\n'
);
console.log('t8-fruits.json written:', items.length, 'items');
