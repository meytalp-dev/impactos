// ============================================================
// state.js — ניהול מצב מתמשך ב-localStorage
// פנינים · מזכרות שליטה · שלבים שהושלמו · ניסיונות
// ============================================================

const STATE_KEY = 'underwater-app:v1';

const DEFAULT_STATE = {
  pearls: 0,
  completedStages: [],
  souvenirs: [],
  currentStageId: 1,
  attempts: {},
  audioOn: true,
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

function getPearls() { return loadState().pearls; }

function addPearl(n = 1) {
  const s = loadState();
  s.pearls = (s.pearls || 0) + n;
  saveState(s);
  return s.pearls;
}

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

function completeStage(id) {
  const s = loadState();
  if (!s.completedStages.includes(id)) {
    s.completedStages.push(id);
    saveState(s);
  }
}

function isStageCompleted(id) {
  return loadState().completedStages.includes(id);
}

// מציג מונה פנינים על כל מסך שיש בו .pearl-counter .count
function renderPearlCounter() {
  const el = document.querySelector('.pearl-counter .count');
  if (el) el.textContent = getPearls();
}

// ריצה אוטומטית עם טעינת המסך
document.addEventListener('DOMContentLoaded', renderPearlCounter);
