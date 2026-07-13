// gen-t12.js — generates lumi/items/t12-family.json (🖼️ The Family Photo · Family).
// Mirrors the animals.json schema: meet(unmeasured) → recognize(core, 3/word) →
// discriminate(1/word, confusable family pair) → produce(unmeasured) → comprehend
// (scene-hide chunk, feeds chunk_comprehension). Oral-first, no_read throughout.
// Run:  node lumi/scratchpad/gen-t12.js   then  node lumi/app/js/_build-data.js
const fs = require('fs');
const path = require('path');

const TOPIC = 'family', SUB = 'people';
const WORDS = ['mum', 'dad', 'baby', 'brother', 'sister', 'grandma', 'grandpa'];

// Hebrew help lines (🆘) — procedural Hebrew is allowed (not shown as content text).
const HE = {
  mum: 'אִמָּא', dad: 'אַבָּא', baby: 'תִּינוֹק', brother: 'אָח',
  sister: 'אָחוֹת', grandma: 'סַבְתָּא', grandpa: 'סַבָּא',
};
// primary visual near-pair (kept OUT of recognize distractors; drives discriminate).
const CONFUSE = {
  mum: 'grandma', grandma: 'grandpa', grandpa: 'grandma',
  dad: 'brother', brother: 'dad', baby: 'sister', sister: 'mum',
};
// discriminate partner per word — honors the brief (mum↔grandma, brother↔dad) and
// pairs the rest by their strongest shared visual cue (glasses elders / bow females / young).
const DISC = {
  mum: 'grandma',   // brief: bow-female vs elder-female
  dad: 'brother',   // brief: adult male vs young male
  grandma: 'grandpa', // both wear round glasses
  grandpa: 'grandma',
  brother: 'dad',
  sister: 'mum',    // both wear a bloom/bow
  baby: 'brother',  // both the youngest
};
// scene-hide chunk (what Lumi asks). "baby" takes "the"; the rest take "my".
const WHERE = {
  mum: 'Where is my mum?', dad: 'Where is my dad?', baby: 'Where is the baby?',
  brother: 'Where is my brother?', sister: 'Where is my sister?',
  grandma: 'Where is my grandma?', grandpa: 'Where is my grandpa?',
};
// warm "This is my ___" naming spoken when found.
const THIS = {
  mum: 'This is my mum!', dad: 'This is my dad!', baby: 'This is the baby!',
  brother: 'This is my brother!', sister: 'This is my sister!',
  grandma: 'This is my grandma!', grandpa: 'This is my grandpa!',
};

function shuffleSeeded(arr, seed) {           // deterministic shuffle (no Math.random → stable output)
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function placeCorrect(word, distractors, pos) {  // put the correct option at index `pos`
  const opts = distractors.map((d) => ({ img: d, correct: false }));
  opts.splice(pos, 0, { img: word, correct: true });
  return opts;
}

const items = [];
WORDS.forEach((word, wi) => {
  // ---- meet (unmeasured) ----
  items.push({
    id: `${TOPIC}.${SUB}.meet.${word}.01`, topic: TOPIC, subtopic: SUB, no_read: true,
    dimension: 'meet', target: [word], measured: false,
    media: { img: word, animation: `lumi meets ${word}`, audio_en: [word, word, THIS[word]] },
    interaction: 'none',
  });

  // ---- recognize ×3 (core, measured) — distractors = non-confusable family, correct rotates ----
  const pool = WORDS.filter((w) => w !== word && w !== CONFUSE[word]);
  for (let n = 0; n < 3; n++) {
    const others = shuffleSeeded(pool, wi * 31 + n * 7 + 1).slice(0, 2);
    items.push({
      id: `${TOPIC}.${SUB}.recognize.${word}.0${n + 1}`, topic: TOPIC, subtopic: SUB, no_read: true,
      dimension: 'recognize', target: [word], measured: true,
      prompt: { audio_en: word, gesture: 'lumi listens', instruction_key: 'listen_and_choose' },
      options: placeCorrect(word, others, n % 3),
      distractor_rationale: 'within-topic; non-confusable family, easy (near-pair reserved for discriminate)',
      help_he: `לוּמִי מְחַפֵּשׂ אֶת ${HE[word]}`,
    });
  }

  // ---- discriminate ×1 (measured) — the confusable family near-pair ----
  const partner = DISC[word];
  const third = WORDS.filter((w) => w !== word && w !== partner)[wi % 5];
  items.push({
    id: `${TOPIC}.${SUB}.discriminate.${word}.01`, topic: TOPIC, subtopic: SUB, no_read: true,
    dimension: 'discriminate', target: [word], measured: true, confusable_with: partner,
    prompt: { audio_en: word, gesture: 'lumi listens carefully', instruction_key: 'listen_and_choose' },
    options: placeCorrect(word, [partner, third], wi % 3),
    distractor_rationale: `within-family; ${word}/${partner} share a visual cue (glasses/bow/age)`,
    help_he: `לוּמִי מְחַפֵּשׂ אֶת ${HE[word]}`,
  });

  // ---- produce (unmeasured, self-listen) ----
  items.push({
    id: `${TOPIC}.${SUB}.produce.${word}.01`, topic: TOPIC, subtopic: SUB, no_read: true,
    dimension: 'produce', target: [word], measured: false,
    prompt: { audio_en: `Can you say… ${word}?`, gesture: 'lumi leans in, excited' },
    record: true, scored: false, feedback_en: 'Lumi heard you!',
  });
});

// ---- comprehend ×7 (scene-hide chunk, measured → chunk_comprehension) ----
WORDS.forEach((word, wi) => {
  const others = shuffleSeeded(WORDS.filter((w) => w !== word), wi * 13 + 3).slice(0, 2);
  items.push({
    id: `${TOPIC}.${SUB}.comprehend.${word}.01`, topic: TOPIC, subtopic: SUB, no_read: true,
    dimension: 'comprehend', target: [word], measured: true, kc_comprehension: true,
    prompt: { audio_en: WHERE[word], gesture: 'lumi points and asks', instruction_key: 'find_it' },
    options: placeCorrect(word, others, wi % 3),
    distractor_rationale: 'within-topic; the chunk carries the instruction (scene-hide)',
    help_he: `לוּמִי מְחַפֵּשׂ אֶת ${HE[word]}`,
  });
});

const out = path.join(__dirname, '..', 'items', 't12-family.json');
fs.writeFileSync(out, JSON.stringify(items, null, 1) + '\n');
console.log('t12-family.json written:', items.length, 'items,', WORDS.length, 'words');
