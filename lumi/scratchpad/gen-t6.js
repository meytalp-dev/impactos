// gen-t6.js — item bank for T6 · 🚦 Lumi Says (Action & Instruction / TPR).
// Mirrors the animals.json schema so the same engine + path-choice consume it.
// Run:  node lumi/scratchpad/gen-t6.js   → writes lumi/items/t6-actioninstruction.json
//
// Pedagogy (locked sources: 2026-07-13 v2-redirect + learning-model):
//  • MEASURED core = receptive recognition of a COMMAND → pick the Lumi POSE that
//    matches it (clean single decision; physical "TPR jumping" stays UNMEASURED in
//    meet/produce so no motor/dexterity load pollutes the score — v2 §3).
//  • First-tap-selects + central target button + first-attempt-only are enforced by
//    _measured-core.js; this file only supplies items.
//  • go / stop / come / jump  → measured (recognize ×3 + discriminate ×1) = word_receptive.
//  • look / listen / point / say → function words, MEET/function only (unmeasured).
//  • find / touch → MEET only, connect to the body topic (T11) — not measured here.
//  • chunk "Find the ___" → one comprehend item = chunk_comprehension.
const fs = require('fs');
const path = require('path');

const TOPIC = 'actioninstruction';
// 🆘 help (Hebrew, procedural — spoken by the SOS button only, never shown to child as content)
const HELP = {
  go: 'לוּמִי צָרִיךְ לָלֶכֶת', stop: 'לוּמִי צָרִיךְ לַעֲצֹר',
  come: 'לוּמִי צָרִיךְ לָבוֹא', jump: 'לוּמִי צָרִיךְ לִקְפֹּץ',
};
const items = [];
const id = (sub, dim, w, n) => `${TOPIC}.${sub}.${dim}.${w}.0${n}`;

// ---- MEASURED action words: response is a Lumi pose ---------------------------
const ACTIONS = ['go', 'stop', 'come', 'jump'];       // sub = 'move'
const CMD = { go: 'Go!', stop: 'Stop!', come: 'Come!', jump: 'Jump!' };

// recognize distractor plan (balanced correct-position across the 3 reps) + a
// discriminate confusable (the TPR contrast that matters: halt/move/direction).
const RECOG = {
  go:   [ {pos:0, d:['stop','jump']}, {pos:1, d:['come','stop']}, {pos:2, d:['jump','come']} ],
  stop: [ {pos:0, d:['go','come']},   {pos:1, d:['jump','go']},   {pos:2, d:['come','jump']} ],
  come: [ {pos:0, d:['go','jump']},   {pos:1, d:['stop','go']},   {pos:2, d:['jump','stop']} ],
  jump: [ {pos:0, d:['come','stop']}, {pos:1, d:['go','come']},   {pos:2, d:['stop','go']} ],
};
const DISCR = {
  go:   { pos:1, conf:'stop', opts:['stop','go','come'],  why:'halt↔move motion contrast' },
  stop: { pos:2, conf:'go',   opts:['go','jump','stop'],  why:'move↔halt motion contrast' },
  come: { pos:0, conf:'go',   opts:['come','go','stop'],  why:'toward↔away direction contrast' },
  jump: { pos:1, conf:'go',   opts:['go','jump','stop'],  why:'up↔forward motion contrast' },
};

function optsFor(word, positions, why) {
  // positions: array of 3 img names with `word` placed at its slot
  return positions.map((img) => ({ img, correct: img === word }));
}

ACTIONS.forEach((w) => {
  // MEET — Lumi demonstrates the action; child is invited to do it (unmeasured).
  items.push({
    id: id('move', 'meet', w, 1), topic: TOPIC, subtopic: 'move', no_read: true,
    dimension: 'meet', target: [w], measured: false,
    media: { img: w, animation: `lumi does: ${w}`, audio_en: [CMD[w], CMD[w]] },
    interaction: 'none',
  });
  // RECOGNIZE ×3 (measured) — hear the command, lead Lumi to the matching pose.
  RECOG[w].forEach((r, i) => {
    const slots = [r.d[0], r.d[1]];
    slots.splice(r.pos, 0, w);                     // put target at its balanced slot
    items.push({
      id: id('move', 'recognize', w, i + 1), topic: TOPIC, subtopic: 'move', no_read: true,
      dimension: 'recognize', target: [w], measured: true,
      prompt: { audio_en: CMD[w], gesture: 'lumi listens', instruction_key: 'listen_and_do' },
      options: optsFor(w, slots),
      distractor_rationale: 'within action-set; distractor actions laterally MET (meet)',
      help_he: HELP[w],
    });
  });
  // DISCRIMINATE ×1 (measured) — the confusable TPR contrast.
  const dc = DISCR[w];
  items.push({
    id: id('move', 'discriminate', w, 1), topic: TOPIC, subtopic: 'move', no_read: true,
    dimension: 'discriminate', target: [w], measured: true, confusable_with: dc.conf,
    prompt: { audio_en: CMD[w], gesture: 'lumi listens carefully', instruction_key: 'listen_and_do' },
    options: optsFor(w, dc.opts),
    distractor_rationale: `${dc.why}; confusable command`,
    help_he: HELP[w],
  });
  // PRODUCE (unmeasured self-listen).
  items.push({
    id: id('move', 'produce', w, 1), topic: TOPIC, subtopic: 'move', no_read: true,
    dimension: 'produce', target: [w], measured: false,
    prompt: { audio_en: `Can you say… ${w}?`, gesture: 'lumi leans in, excited' },
    record: true, scored: false, feedback_en: 'Lumi heard you!',
  });
});

// ---- FUNCTION / instruction words: MEET + light function (unmeasured) ---------
// look/listen/point/say — the classroom-instruction verbs. Familiar to a 6yo.
const FUNCS = [
  { w: 'look',   cmd: 'Look!',   gest: 'lumi looks',      demo: 'lumi looks at something' },
  { w: 'listen', cmd: 'Listen!', gest: 'lumi cups an ear', demo: 'lumi listens' },
  { w: 'point',  cmd: 'Point!',  gest: 'lumi points',     demo: 'lumi points' },
  { w: 'say',    cmd: 'Say it!',  gest: 'lumi opens mouth', demo: 'lumi says something' },
];
FUNCS.forEach((f) => {
  items.push({
    id: id('instruct', 'meet', f.w, 1), topic: TOPIC, subtopic: 'instruct', no_read: true,
    dimension: 'meet', target: [f.w], measured: false,
    media: { img: f.w, animation: f.demo, audio_en: [f.cmd, f.cmd] },
    interaction: 'none',
    note: 'function word — comprehended in routine, not receptively measured in T6',
  });
});

// ---- BODY-linked instruction verbs: MEET only, hand off to T11 ----------------
const BODY = [
  { w: 'find',  cmd: 'Find it!',  demo: 'lumi finds something' },
  { w: 'touch', cmd: 'Touch it!', demo: 'lumi touches something' },
];
BODY.forEach((b) => {
  items.push({
    id: id('instruct', 'meet', b.w, 1), topic: TOPIC, subtopic: 'instruct', no_read: true,
    dimension: 'meet', target: [b.w], measured: false,
    media: { img: b.w, animation: b.demo, audio_en: [b.cmd, b.cmd] },
    interaction: 'none',
    connects_to: 'body_t11',
    note: 'find/touch anchor the body topic (T11); measured there, met here',
  });
});

// ---- CHUNK comprehension: "Find the ___" (instruction + noun) -----------------
// Uses already-MET object placeholders (ball/star/cup) so the chunk carries meaning.
items.push({
  id: id('instruct', 'comprehend', 'find-ball', 1), topic: TOPIC, subtopic: 'instruct', no_read: true,
  dimension: 'comprehend', target: ['find'], measured: true, kc_comprehension: true,
  prompt: { audio_en: 'Find the ball.', gesture: 'lumi points and asks', instruction_key: 'find_it' },
  options: [ { img: 'ball', correct: true }, { img: 'star', correct: false }, { img: 'cup', correct: false } ],
  distractor_rationale: 'chunk carries the instruction (find + noun); objects laterally MET',
});

fs.writeFileSync(
  path.join(__dirname, '..', 'items', 't6-actioninstruction.json'),
  JSON.stringify(items, null, 1) + '\n'
);
console.log('t6-actioninstruction.json written:', items.length, 'items');
