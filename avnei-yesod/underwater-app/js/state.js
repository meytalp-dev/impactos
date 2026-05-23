// ============================================================
// state.js — ניהול מצב מתמשך ב-localStorage
// פנינים · מזכרות · שלבים · אותיות · אקווריום · אירועים · דגלי מורה
// מסמך-אם: ../narrative-spec.md + spec של אי 3 (23.5.2026)
// ============================================================

const STATE_KEY = 'underwater-app:v1';

// סדר פעילויות חדש (23.5.2026, אי 3):
// 1=letter-shape · 2=sound-match · 3=find-letter · 4=trace-path
// השמות הישנים (BLOOM/TAP_MATCH/TRACE/FIND) נשמרים כ-deprecated alias.
const LETTER_STAGES = {
  LETTER_SHAPE: 1,
  SOUND_MATCH:  2,
  FIND_LETTER:  3,
  TRACE_PATH:   4,
  // deprecated aliases (לא להשתמש בקוד חדש)
  BLOOM: 1, TAP_MATCH: 2, TRACE: 3, FIND: 4,
};

// אילו פעילויות זמינות פר-אות באי 3 (MVP — trace-path דחוי עד אימות פדגוגי).
// כשיתווסף trace, פשוט להוסיף 'tracePath' לרשימה של אות מ.
const LETTER_AVAILABLE_ACTIVITIES = {
  'ת': ['soundMatch'],
  'מ': ['letterShapeA', 'letterShapeB', 'soundMatch', 'findLetter'],
  'ר': ['soundMatch'],
  'ב': ['soundMatch'],
  'ק': ['soundMatch'],
};

const DEFAULT_STATE = {
  // ===== נכסי ליבה (קיים מ-v1) =====
  pearls: 0,
  completedStages: [],
  souvenirs: [],
  currentStageId: 1,
  attempts: {},
  audioOn: true,

  // ===== Phase B · narrative-spec v1.0 (23.5.2026) =====
  // מבנה חדש לכל אות:
  // {
  //   stage: 2,                              // deprecated — נשמר ל-backward compat
  //   completed: false,                      // deprecated
  //   completedActivities: ['soundMatch'],   // חדש — מקור-אמת
  //   perActivityStats: {
  //     'soundMatch': { attempts: [0,1], responseTimes: [3200, 4100], hintUsed: [false, true] }
  //   },
  //   currentSupportLevel: 1,                // חדש — 1-4
  //   bloomed: false                         // חדש — true כשהושלמו כל availableActivities של האות
  // }
  letterProgress: {},

  // פריטים בחלון בית נוני — אקווריום זיכרונות
  aquarium: [],

  // טריגרי מעבר שכבר התרחשו
  phaseTransitionsSeen: [],

  // ===== חדש 23.5.2026 — event log + teacher flags =====
  // events מוגבל ל-1000 אחרונים (FIFO) כדי לא לתפוח ב-localStorage.
  events: [],
  teacherFlags: [],
};

const EVENTS_MAX = 1000;

function freshDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return freshDefaults();
    return { ...freshDefaults(), ...JSON.parse(raw) };
  } catch {
    return freshDefaults();
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
    let next = 1;
    while (s.completedStages.includes(next) && next <= 22) next++;
    s.currentStageId = next;
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

function getMapState(islandId) {
  const s = loadState();
  if (s.completedStages.includes(islandId)) return 'completed';
  if (islandId === s.currentStageId) return 'current';

  const delta = islandId - s.currentStageId;
  if (delta >= 1 && delta <= 2) return 'next-near';
  if (delta >= 3 && delta <= 4) return 'next-distant';
  return 'horizon';
}

function isIslandVisible(islandId) {
  return getMapState(islandId) !== 'horizon';
}

// ============================================================
// צמיחת אותיות באי 3 — סכמה חדשה (23.5.2026)
// ============================================================

function getLetterProgress(letter) {
  const lp = loadState().letterProgress;
  return lp[letter] || {
    stage: 0,
    completed: false,
    completedActivities: [],
    perActivityStats: {},
    currentSupportLevel: 1,
    bloomed: false,
  };
}

function getAvailableActivities(letter) {
  return LETTER_AVAILABLE_ACTIVITIES[letter] || [];
}

// קוראים אחרי השלמת פעילות. מעדכן completedActivities + perActivityStats.
// stats = { attempts, response_time_ms, hint_used, auto_hint_triggered, noni_guidance_used }
function recordActivityComplete(letter, activity, stats) {
  const s = loadState();
  const current = s.letterProgress[letter] || {
    stage: 0, completed: false,
    completedActivities: [], perActivityStats: {},
    currentSupportLevel: 1, bloomed: false,
  };

  // הוספה ל-completedActivities (אם לא קיים)
  if (!current.completedActivities.includes(activity)) {
    current.completedActivities.push(activity);
  }

  // צבירת stats פר-activity
  if (!current.perActivityStats[activity]) {
    current.perActivityStats[activity] = {
      attempts: [], responseTimes: [], hintUsed: [],
    };
  }
  const pa = current.perActivityStats[activity];
  if (stats) {
    if (typeof stats.attempts === 'number') pa.attempts.push(stats.attempts);
    if (typeof stats.response_time_ms === 'number') pa.responseTimes.push(stats.response_time_ms);
    if (typeof stats.hint_used === 'boolean') pa.hintUsed.push(stats.hint_used);
  }

  // backward compat — לעדכן את stage הישן לפי הסדר החדש
  const STAGE_BY_ACTIVITY = {
    'letterShapeA': 1, 'letterShapeB': 1,
    'soundMatch':   2,
    'findLetter':   3,
    'tracePath':    4,
  };
  const stageForActivity = STAGE_BY_ACTIVITY[activity] || 0;
  if (stageForActivity > current.stage) current.stage = stageForActivity;

  // bloomed = כל הפעילויות הזמינות הושלמו
  const available = getAvailableActivities(letter);
  const allDone = available.length > 0 &&
                  available.every(a => current.completedActivities.includes(a));
  current.bloomed = allDone;
  current.completed = allDone;  // backward compat

  s.letterProgress[letter] = current;
  saveState(s);
}

function isLetterCompleted(letter) {
  return getLetterProgress(letter).completed === true;
}

function isLetterBloomed(letter) {
  return getLetterProgress(letter).bloomed === true;
}

function getMasteredLetters() {
  const lp = loadState().letterProgress;
  return Object.keys(lp).filter(letter => lp[letter].completed || lp[letter].bloomed);
}

// אחוז צמיחה ויזואלי — יחסי ל-availableActivities של האות (לא 25% קבוע).
// אם לאות יש 1 פעילות זמינה והיא הושלמה — 100%.
// אם לאות מ יש 4 והושלמו 3 — 75%.
// לא חשוף לילד.ה כמספר — רק לרינדור ויזואלי.
function getLetterGrowthPercent(letter) {
  const prog = getLetterProgress(letter);
  const available = getAvailableActivities(letter);
  if (available.length === 0) return 0;
  const done = available.filter(a => prog.completedActivities.includes(a)).length;
  return Math.round((done / available.length) * 100);
}

// Deprecated — נשאר ל-backward compat של קריאות ישנות שעדיין משתמשות בו.
function setLetterStage(letter, stage) {
  if (stage < 1 || stage > 4) return;
  const s = loadState();
  const current = s.letterProgress[letter] || {
    stage: 0, completed: false,
    completedActivities: [], perActivityStats: {},
    currentSupportLevel: 1, bloomed: false,
  };
  if (stage <= current.stage) return;
  current.stage = stage;
  current.completed = current.completed || (stage === 4);
  s.letterProgress[letter] = current;
  saveState(s);
}

function getCurrentSupportLevel(letter) {
  return getLetterProgress(letter).currentSupportLevel || 1;
}

function setCurrentSupportLevel(letter, level) {
  if (level < 1 || level > 4) return;
  const s = loadState();
  const current = s.letterProgress[letter] || {
    stage: 0, completed: false,
    completedActivities: [], perActivityStats: {},
    currentSupportLevel: 1, bloomed: false,
  };
  current.currentSupportLevel = level;
  s.letterProgress[letter] = current;
  saveState(s);
}

// ============================================================
// Environmental print — בקרת הצגה (narrative-spec §7)
// ============================================================

function canShowLetterInWorld(letter) {
  return isLetterBloomed(letter);
}

function canShowWordInWorld(word) {
  if (!isStageCompleted(5)) return false;
  const mastered = getMasteredLetters();
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

function getPhaseForIsland(islandId) {
  if (islandId >= 1 && islandId <= 9)   return 1;
  if (islandId >= 10 && islandId <= 14) return 2;
  if (islandId >= 15 && islandId <= 18) return 3;
  if (islandId >= 19 && islandId <= 22) return 4;
  return 0;
}

// ============================================================
// Event log + teacher flags (חדש 23.5.2026)
// ============================================================

// מוסיף event יחיד ל-buffer. ה-buffer נחתך ל-EVENTS_MAX אחרונים.
function appendEvent(evt) {
  const s = loadState();
  if (!Array.isArray(s.events)) s.events = [];
  s.events.push(evt);
  if (s.events.length > EVENTS_MAX) {
    s.events = s.events.slice(-EVENTS_MAX);
  }
  saveState(s);
}

function getEvents() {
  return loadState().events || [];
}

function clearEvents() {
  const s = loadState();
  s.events = [];
  saveState(s);
}

function appendTeacherFlag(flag) {
  const s = loadState();
  if (!Array.isArray(s.teacherFlags)) s.teacherFlags = [];
  s.teacherFlags.push({ ...flag, recordedAt: Date.now() });
  saveState(s);
}

function getTeacherFlags() {
  return loadState().teacherFlags || [];
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
// Debug helpers
// ============================================================

window.__avneiYesod = {
  state: loadState,
  reset: () => { localStorage.removeItem(STATE_KEY); location.reload(); },
  setLetter: setLetterStage,
  completeIsland: completeStage,
  addAquarium: addAquariumItem,
  mapState: getMapState,
  // חדש
  events: getEvents,
  flags: getTeacherFlags,
  growth: getLetterGrowthPercent,
  available: getAvailableActivities,
  recordActivity: recordActivityComplete,
  dumpEvents: () => console.table(getEvents()),
};
