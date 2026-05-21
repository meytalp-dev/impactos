// ============================================================
// 22 איים — סדר פדגוגי לכיתות א'-ב'
// סדר: מוחשי → תארים → התאמה → ה' הידיעה → כינויי גוף → מילות יחס →
//       שורש (ייחודי) → פעלים → תחביר → מבני משפט מתקדמים
// ============================================================

window.AVNEI_ISLANDS = [
  {
    id: 'nouns', n: 1,
    name: 'שמות עצם',
    short: 'דברים שאני רואה',
    icon: '🟢',  // placeholder — we render SVG, not emoji
    status: 'active',
    color: '#e84a8a',  // pink — same as accent
    envelopes: ['tap', 'drag', 'shared-reading']
  },
  { id: 'adjectives',          n:2,  name: 'תארים',                  short: 'איך זה נראה',           status: 'locked', color: '#d4a341' },
  { id: 'agreement',           n:3,  name: 'התאמה — מין ומספר',      short: 'אדום או אדומה',         status: 'locked', color: '#6b5cff' },
  { id: 'definite-article',    n:4,  name: 'הַ הידיעה',              short: 'הכלב מול כלב',          status: 'locked', color: '#2e8b6e' },
  { id: 'pronouns',            n:5,  name: 'כינויי גוף',             short: 'אני, את, הוא',          status: 'locked', color: '#e84a8a' },
  { id: 'prepositions-place',  n:6,  name: 'מילות יחס — מקום',       short: 'על, ליד, ב',            status: 'locked', color: '#d4a341' },
  { id: 'prepositions-time',   n:7,  name: 'מילות יחס — זמן',        short: 'בבוקר, אחר כך',         status: 'locked', color: '#6b5cff' },
  { id: 'roots',               n:8,  name: 'שורש ומשפחת מילים ★',    short: 'כתב, כותב, מכתב',       status: 'locked', color: '#e84a8a', star: true },
  { id: 'verbs-present',       n:9,  name: 'פעלים בהווה',            short: 'הולך, רץ, אוכל',        status: 'locked', color: '#2e8b6e' },
  { id: 'verbs-past',          n:10, name: 'פעלים בעבר',             short: 'הלך, רץ, אכל',          status: 'locked', color: '#d4a341' },
  { id: 'verbs-future',        n:11, name: 'פעלים בעתיד',            short: 'אלך, ארוץ, אוכל',       status: 'locked', color: '#6b5cff' },
  { id: 'verb-conjugation',    n:12, name: 'נטיית פעלים',            short: 'אני / את / הוא',        status: 'locked', color: '#2e8b6e' },
  { id: 'preposition-inflect', n:13, name: 'נטיית מילות יחס',        short: 'לי, לך, לו',            status: 'locked', color: '#e84a8a' },
  { id: 'interrogatives',      n:14, name: 'שאלות',                  short: 'מי, מה, איפה',          status: 'locked', color: '#d4a341' },
  { id: 'yesh-ein',            n:15, name: 'יש ואין',                short: 'יש לי / אין לי',        status: 'locked', color: '#6b5cff' },
  { id: 'aval-contrast',       n:16, name: 'ניגוד — אבל',            short: 'אוהב אבל לא',           status: 'locked', color: '#2e8b6e' },
  { id: 'shel-possession',     n:17, name: 'שייכות — של',            short: 'הספר של דנה',           status: 'locked', color: '#e84a8a' },
  { id: 'smikhut',             n:18, name: 'סמיכות',                 short: 'בית הספר',              status: 'locked', color: '#d4a341' },
  { id: 'infinitive',          n:19, name: 'אינפיניטיב',             short: 'אוהב לקרוא',            status: 'locked', color: '#6b5cff' },
  { id: 'kmo-simile',          n:20, name: 'דימוי — כמו',            short: 'מהיר כמו רוח',          status: 'locked', color: '#2e8b6e' },
  { id: 'direct-quote',        n:21, name: 'ציטוט ישיר',             short: '"שלום", אמרה',          status: 'locked', color: '#e84a8a' },
  { id: 'sentence-structures', n:22, name: 'מבני משפט',              short: 'משפטים שלמים',          status: 'locked', color: '#d4a341' }
];

window.AVNEI_NOUNS_BANK = [
  // 20 שמות עצם מנוקדים שיש להם אודיו ב-engine/audio/he/
  { he: 'אַבָּא',      audio: 'aba.mp3',      gender: 'm', category: 'family' },
  { he: 'אִמָּא',      audio: 'ima.mp3',      gender: 'f', category: 'family' },
  { he: 'יֶלֶד',       audio: 'yeled.mp3',    gender: 'm', category: 'family' },
  { he: 'יַלְדָּה',    audio: 'yalda.mp3',    gender: 'f', category: 'family' },
  { he: 'כֶּלֶב',      audio: 'kelev.mp3',    gender: 'm', category: 'animals' },
  { he: 'חָתוּל',      audio: 'chatul.mp3',   gender: 'm', category: 'animals' },
  { he: 'דָּג',        audio: 'dag.mp3',      gender: 'm', category: 'animals' },
  { he: 'בַּיִת',      audio: 'bayit.mp3',    gender: 'm', category: 'places' },
  { he: 'גַּן',        audio: 'gan.mp3',      gender: 'm', category: 'places' },
  { he: 'עִיר',        audio: 'ir.mp3',       gender: 'f', category: 'places' },
  { he: 'עֵץ',         audio: 'etz.mp3',      gender: 'm', category: 'nature' },
  { he: 'פֶּרַח',      audio: 'perach.mp3',   gender: 'm', category: 'nature' },
  { he: 'שֶׁמֶשׁ',     audio: 'shemesh.mp3',  gender: 'f', category: 'nature' },
  { he: 'יָרֵחַ',      audio: 'yareach.mp3',  gender: 'm', category: 'nature' },
  { he: 'מַיִם',       audio: 'mayim.mp3',    gender: 'm', category: 'nature' },
  { he: 'כִּסֵּא',     audio: 'kise.mp3',     gender: 'm', category: 'objects' },
  { he: 'שֻׁלְחָן',    audio: 'shulchan.mp3', gender: 'm', category: 'objects' },
  { he: 'סֵפֶר',       audio: 'sefer.mp3',    gender: 'm', category: 'objects' },
  { he: 'דֶּלֶת',      audio: 'delet.mp3',    gender: 'f', category: 'objects' },
  { he: 'תַּפּוּחַ',   audio: 'tapuach.mp3',  gender: 'm', category: 'food' },
  { he: 'זַיִת',       audio: 'zait.mp3',     gender: 'm', category: 'food' },
  { he: 'יָד',         audio: 'yad.mp3',      gender: 'f', category: 'body' },
  { he: 'רֶגֶל',       audio: 'regel.mp3',    gender: 'f', category: 'body' },
  { he: 'אֹזֶן',       audio: 'ozen.mp3',     gender: 'f', category: 'body' }
];

// Helper — get N random distractors that are NOT the target
window.pickDistractors = function(target, n) {
  const pool = window.AVNEI_NOUNS_BANK.filter(w => w.he !== target.he);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

// Helper — shuffle array
window.shuffle = function(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
};
