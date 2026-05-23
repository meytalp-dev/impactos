// ============================================================
// state.js — ניהול מצב מתמשך ב-localStorage
// פנינים · מזכרות · שלבים · ניסיונות · אותיות · אקווריום · מפה
// מסמך-אם: ../narrative-spec.md
// ============================================================

const STATE_KEY = 'underwater-app:v1';

const DEFAULT_STATE = {
  // ===== נכסי ליבה (קיים מ-v1) =====
  pearls: 0,
  completedStages: [],
  souvenirs: [],
  currentStageId: 1,
  attempts: {},
  audioOn: true,

  // ===== Phase B · narrative-spec v1.0 (23.5.2026) =====
  // מצב צמיחה לכל אות באי 3 (וגם איים עתידיים עם אותיות)
  // מבנה: { 'ת': { stage: 2, completed: false }, ... }
  // stage: 1=bloom, 2=tap-match, 3=trace, 4=find. completed=true אחרי שלב 4.
  letterProgress: {},

  // פריטים בחלון בית נוני — אקווריום זיכרונות
  // מבנה: [{ islandId: 1, itemKey: 'humming-bubble', addedAt: ts }]
  aquarium: [],

  // טריגרי מעבר שכבר התרחשו (כדי לא להציג פעמיים)
  // 'phase-1-end', 'phase-2-end', 'phase-3-end', 'flow-reversal' (לפני אי 19)
  phaseTransitionsSeen: [],
};

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {}
}

// ============================================================
// פנינים (קיים — לא לשנות API)
// ============================================================

function getPearls() { return loadState().pearls; }

function addPearl(n = 1) {
  const s = loadState();
  s.pearls = (s.pearls || 0) + n;
  saveState(s);
  return s.pearls;
}

// ============================================================
// מזכרות שליטה (קיים — לא לשנות API)
// ============================================================

function hasSouvenir(name) {
  return loadState().souvenirs.includes(name);
}

function addSouvenir(name) {
  const s = loadState();
  if (!s.souvenirs.includes(name)) {
    s.souvenirs.push(name);
    saveState(s);
  }
}

// ============================================================
// שלבים שהושלמו (קיים — לא לשנות API)
// ============================================================

function completeStage(id) {
  const s = loadState();
  if (!s.completedStages.includes(id)) {
    s.completedStages.push(id);
    // קידום currentStageId לאי הגבוה הבא שטרם הושלם
    if (id >= s.currentStageId) s.currentStageId = id + 1;
    saveState(s);
  }
}

function isStageCompleted(id) {
  return loadState().completedStages.includes(id);
}

function getCurrentStageId() {
  return loadState().currentStageId;
}

// ============================================================
// מפה — "אופק קרוב" (narrative-spec §3)
// ============================================================

// מחזיר את המצב הויזואלי של אי במפה
// 'completed' | 'current' | 'next-near' | 'next-distant' | 'horizon'
function getMapState(islandId) {
  const s = loadState();
  if (s.completedStages.includes(islandId)) return 'completed';
  if (islandId === s.currentStageId) return 'current';

  const delta = islandId - s.currentStageId;
  if (delta >= 1 && delta <= 2) return 'next-near';
  if (delta >= 3 && delta <= 4) return 'next-distant';
  return 'horizon';
}

// האם להציג את האי בכלל במפה (לא 'horizon')
function isIslandVisible(islandId) {
  return getMapState(islandId) !== 'horizon';
}

// ============================================================
// צמיחת אותיות באי 3 (narrative-spec §8)
// ============================================================

const LETTER_STAGES = { BLOOM: 1, TAP_MATCH: 2, TRACE: 3, FIND: 4 };

function getLetterProgress(letter) {
  const lp = loadState().letterProgress;
  return lp[letter] || { stage: 0, completed: false };
}

// מקדמים את האות לשלב נתון. stage=4 גם מסמן completed.
function setLetterStage(letter, stage) {
  if (stage < 1 || stage > 4) return;
  const s = loadState();
  const current = s.letterProgress[letter] || { stage: 0, completed: false };
  // אל תוריד שלב — רק עלייה או הישארות
  if (stage <= current.stage) return;
  s.letterProgress[letter] = {
    stage: stage,
    completed: stage === 4,
  };
  saveState(s);
}

function isLetterCompleted(letter) {
  return getLetterProgress(letter).completed === true;
}

// רשימת אותיות שהושלמו (לשרת environmental print)
function getMasteredLetters() {
  const lp = loadState().letterProgress;
  return Object.keys(lp).filter(letter => lp[letter].completed);
}

// אחוז צמיחה ויזואלי (לא חשוף לילד.ה, רק לרינדור)
// 0% / 25% / 50% / 75% / 100%
function getLetterGrowthPercent(letter) {
  const stage = getLetterProgress(letter).stage;
  return stage * 25;
}

// ============================================================
// Environmental print — בקרת הצגה (narrative-spec §7)
// ============================================================

function canShowLetterInWorld(letter) {
  return isLetterCompleted(letter);
}

// מילים מותרות רק אחרי שאי 5 הושלם (מיזוג למילים)
// וכל אות במילה היא אות שנלמדה
function canShowWordInWorld(word) {
  if (!isStageCompleted(5)) return false;
  const mastered = getMasteredLetters();
  // מסירים ניקוד ותווים נוספים — בודקים רק אותיות עיצוריות
  const letters = word.replace(/[^א-ת]/g, '').split('');
  return letters.every(l => mastered.includes(l));
}

// ============================================================
// אקווריום זיכרונות — חלון בית נוני (narrative-spec §6)
// ============================================================

function addAquariumItem(islandId, itemKey) {
  const s = loadState();
  const exists = s.aquarium.some(it => it.islandId === islandId && it.itemKey === itemKey);
  if (!exists) {
    s.aquarium.push({ islandId, itemKey, addedAt: Date.now() });
    saveState(s);
  }
}

function getAquariumItems() {
  return loadState().aquarium;
}

// ============================================================
// מעברי פאזה (narrative-spec §5)
// ============================================================

function hasSeenTransition(name) {
  return loadState().phaseTransitionsSeen.includes(name);
}

function markTransitionSeen(name) {
  const s = loadState();
  if (!s.phaseTransitionsSeen.includes(name)) {
    s.phaseTransitionsSeen.push(name);
    saveState(s);
  }
}

// פאזה לפי מספר אי (לא חשוף לילד.ה — לדשבורד מורה ולטריגרי מעבר)
function getPhaseForIsland(islandId) {
  if (islandId >= 1 && islandId <= 9)   return 1;  // הים מוצא קול
  if (islandId >= 10 && islandId <= 14) return 2;  // הים מוצא קשר
  if (islandId >= 15 && islandId <= 18) return 3;  // הים מספר סיפור
  if (islandId >= 19 && islandId <= 22) return 4;  // הים עונה בקול שלך
  return 0;
}

// ============================================================
// רינדור מונה פנינים (קיים — לא לשנות)
// ============================================================

function renderPearlCounter() {
  const el = document.querySelector('.pearl-counter .count');
  if (el) el.textContent = getPearls();
}

document.addEventListener('DOMContentLoaded', renderPearlCounter);

// ============================================================
// Debug helpers (קונסולה בלבד — לא חשוף ב-UI)
// ============================================================

window.__avneiYesod = {
  state: loadState,
  reset: () => { localStorage.removeItem(STATE_KEY); location.reload(); },
  // לסט מצב בדיקה מהיר
  setLetter: setLetterStage,
  completeIsland: completeStage,
  addAquarium: addAquariumItem,
  mapState: getMapState,
};
