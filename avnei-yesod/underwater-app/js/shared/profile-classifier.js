/**
 * אבני יסוד — Profile Classifier (פרופיל אורייני)
 *
 * מקור: ד"ר לימור קולן, "הפרופיל האורייני" — כלי להערכת רכיבי האוריינות המוקדמת
 * בתחילת כיתה א'. משה"ח, אגף שפות – הפיקוח על הוראת העברית ביסודי, תשפ"ו.
 * מסמך מקור מאומת: c:/tmp/profile-oryani-1.txt (חולץ מ-PDF רשמי).
 *
 * משימה: A0.1 (P0/M).
 *
 * מטרת המודול:
 *   1. הגדרת 12 שורות התצפית של הכלי הרשמי (3 רכיבים).
 *   2. סיווג אוטומטי ל-4 פרופילים: שליטה מצוינת / טובה / חלקית / פערים משמעותיים.
 *   3. ניהול אחסון תלמידות + הערכות ב-localStorage.
 *
 * עקרון: זה כלי **תצפית למורה**, לא מבדק לילדה. קולן ממליצה במפורש:
 *   "מיפוי התלמידים לפרופילים אוריינים מתבסס על הערכה דינמית ובלתי פורמלית"
 *   "רצוי לאסוף נתונים ממספר אירועי הערכה ולא להתבסס על אירוע הערכה בודד"
 */

// 4 הפרופילים — סדר חשוב: 1 = מצוינת (גבוה), 4 = פערים (נמוך)
export const PROFILES = Object.freeze({
  1: { id: 1, key: 'excellent',   name_he: 'שליטה מצוינת',         color: '#2c7a7b' },
  2: { id: 2, key: 'good',        name_he: 'שליטה טובה',           color: '#3182ce' },
  3: { id: 3, key: 'partial',     name_he: 'שליטה חלקית',          color: '#dd8b1f' },
  4: { id: 4, key: 'significant', name_he: 'פערים משמעותיים',      color: '#c53030' },
});

// 3 רכיבי האוריינות המוקדמת (לפי קולן)
export const COMPONENTS = Object.freeze({
  comm: {
    key: 'comm',
    name_he: 'כשירות תקשורתית',
    description_he: 'כישורי שיח, אוצר מילים, השתתפות בשיח אורייני',
  },
  alpha: {
    key: 'alpha',
    name_he: 'ידע אלפביתי וניצני קריאה וכתיבה',
    description_he: 'מודעות פונולוגית, ידע אותיות, ניצני קריאה וכתיב פונטי',
  },
  book: {
    key: 'book',
    name_he: 'כשירות אוריינית במפגש עם ספר',
    description_he: 'כישורי האזנה, הבנת סיפור, התמצאות בספר',
  },
});

/**
 * שורות התצפית — כל שורה מציעה תיאור-לפרופיל מהמקור הרשמי.
 * `null` = המקור לא תיאר את ההתנהגות הזו לפרופיל הזה — לא להמציא.
 *
 * הניסוחים נלקחו מילולית מטבלת הפרופילים של קולן (עמ' 4).
 */
export const OBSERVATIONS = Object.freeze([
  // ───── רכיב 1: כשירות תקשורתית ─────
  {
    id: 'comm_1',
    component: 'comm',
    label: 'שימוש בשפה ובאינטראקציה תקשורתית',
    descriptions: {
      1: 'שולטים בשפה ומשתמשים בה למגוון מטרות חברתיות-תקשורתיות',
      2: 'משתמשים בשפה למגוון מטרות חברתיות-תקשורתיות',
      3: 'משתמשים בה באופן חלקי למגוון מטרות חברתיות-תקשורתיות',
      4: 'אינם שולטים בשפה. ייתכן בשל רכישת עברית כשפה שנייה, רקע סוציו-אקונומי, לקות נוירו-התפתחותית או חסכים חינוכיים',
    },
  },
  {
    id: 'comm_2',
    component: 'comm',
    label: 'תקינות לשונית ואוצר מילים',
    descriptions: {
      1: 'מתבטאים בשפה תקינה ובאוצר מילים רחב',
      2: 'מתבטאים בשפה תקינה ובאוצר מילים הולם',
      3: 'מתבטאים בשפה תקינה ובאוצר מילים הולם, מגלים חוסרים',
      4: 'חוסרים משמעותיים באוצר המילים או בתקינות הלשונית',
    },
  },
  {
    id: 'comm_3',
    component: 'comm',
    label: 'השתתפות בשיח אורייני',
    descriptions: {
      1: 'משתתפים באופן פעיל בשיח אורייני',
      2: 'משתתפים באופן פעיל בשיח האורייני',
      3: 'ממעטים לקחת חלק פעיל בשיח האורייני',
      4: null,
    },
  },
  // ───── רכיב 2: ידע אלפביתי וניצני קריאה וכתיבה ─────
  {
    id: 'alpha_1',
    component: 'alpha',
    label: 'מודעות פונולוגית',
    descriptions: {
      1: 'מבצעים מגוון מניפולציות פונולוגיות ברמת הצירוף והפונמה',
      2: 'מבצעים מגוון מניפולציות פונולוגיות ברמת הצירוף והפונמה',
      3: 'מבצעים מניפולציות פונולוגיות בסיסיות ברמת ההברה והצירוף',
      4: null,
    },
  },
  {
    id: 'alpha_2',
    component: 'alpha',
    label: 'ידע אותיות',
    descriptions: {
      1: 'מכירים את כל האותיות',
      2: 'מכירים את רוב האותיות',
      3: 'מכירים חלק מהאותיות',
      4: null,
    },
  },
  {
    id: 'alpha_3',
    component: 'alpha',
    label: 'קשרי אות-צליל',
    descriptions: {
      1: 'שולטים בקשרי אות-צליל',
      2: 'מזהים חלק מקשרי אות-צליל',
      3: 'מזהים חלק מקשרי אות-צליל',
      4: null,
    },
  },
  {
    id: 'alpha_4',
    component: 'alpha',
    label: 'ניצני קריאה',
    descriptions: {
      1: 'מתנסים בקריאה מפענחת',
      2: 'מתנסים בקריאה מבוססת ידע אותיות',
      3: 'מזהים מילים שכיחות בסביבה הקרובה',
      4: null,
    },
  },
  {
    id: 'alpha_5',
    component: 'alpha',
    label: 'כתיב פונטי',
    descriptions: {
      1: 'כותבים בכתיב פונטי מלא וחלקי',
      2: 'כותבים בכתיב פונטי חלקי',
      3: 'כותבים בכתיב פונטי חלקי',
      4: null,
    },
  },
  // ───── רכיב 3: כשירות אוריינית במפגש עם ספר ─────
  {
    id: 'book_1',
    component: 'book',
    label: 'הנאה מהאזנה לסיפורים',
    descriptions: {
      1: 'נהנים להאזין לסיפורים מוקראים',
      2: 'נהנים להאזין לסיפורים מוקראים',
      3: 'נהנים להאזין לסיפורים מוקראים',
      4: null,
    },
  },
  {
    id: 'book_2',
    component: 'book',
    label: 'הבנת טקסט מוקרא',
    descriptions: {
      1: 'מבינים היטב טקסטים שמוקראים להם',
      2: 'לרוב מבינים טקסטים המוקראים להם',
      3: 'מבינים באופן חלקי טקסטים המוקראים להם',
      4: null,
    },
  },
  {
    id: 'book_3',
    component: 'book',
    label: 'סקרנות אוריינית',
    descriptions: {
      1: 'מגלים סקרנות אוריינית',
      2: null,
      3: null,
      4: null,
    },
  },
]);

/**
 * סיווג פרופיל לפי תצפיות.
 *
 * @param {Object<string, 1|2|3|4>} observations - מפת observation_id → profile_id
 *   הערה: שורות שלא סומנו (או שערכן null/undefined) לא נכללות בספירה.
 * @returns {{
 *   profile: 1|2|3|4|null,
 *   breakdown: { comm: 1|2|3|4|null, alpha: 1|2|3|4|null, book: 1|2|3|4|null },
 *   counts: { 1: number, 2: number, 3: number, 4: number },
 *   total_observed: number,
 *   explanation: string,
 * }}
 *   profile = null אם המורה לא סימנה אף תצפית.
 */
export function classifyProfile(observations) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const perComponent = { comm: { 1: 0, 2: 0, 3: 0, 4: 0 }, alpha: { 1: 0, 2: 0, 3: 0, 4: 0 }, book: { 1: 0, 2: 0, 3: 0, 4: 0 } };
  let total = 0;

  for (const obs of OBSERVATIONS) {
    const val = observations[obs.id];
    if (val === 1 || val === 2 || val === 3 || val === 4) {
      counts[val] += 1;
      perComponent[obs.component][val] += 1;
      total += 1;
    }
  }

  if (total === 0) {
    return {
      profile: null,
      breakdown: { comm: null, alpha: null, book: null },
      counts,
      total_observed: 0,
      explanation: 'אין תצפיות. סמני לפחות שורה אחת כדי לקבל המלצה.',
    };
  }

  // בחירת הפרופיל הדומיננטי. בתיקו — מעדיפים את הפרופיל הנמוך (זהיר יותר פדגוגית).
  const profile = pickDominant(counts);

  const breakdown = {
    comm: anyMarked(perComponent.comm) ? pickDominant(perComponent.comm) : null,
    alpha: anyMarked(perComponent.alpha) ? pickDominant(perComponent.alpha) : null,
    book: anyMarked(perComponent.book) ? pickDominant(perComponent.book) : null,
  };

  const explanation = buildExplanation(profile, counts[profile], total, breakdown);

  return { profile, breakdown, counts, total_observed: total, explanation };
}

function anyMarked(counts) {
  return counts[1] + counts[2] + counts[3] + counts[4] > 0;
}

/**
 * בוחר את הפרופיל הדומיננטי. בתיקו — הפרופיל הגבוה במספר (= הנמוך פדגוגית).
 * דוגמה: counts = {1: 4, 2: 4, 3: 2, 4: 0} → 2 (שליטה טובה, לא מצוינת).
 */
function pickDominant(counts) {
  let best = 1;
  let bestCount = counts[1];
  for (const p of [2, 3, 4]) {
    if (counts[p] >= bestCount) {
      best = p;
      bestCount = counts[p];
    }
  }
  return best;
}

function buildExplanation(profile, matched, total, breakdown) {
  const profileName = PROFILES[profile].name_he;
  const parts = [`${matched} מתוך ${total} תצפיות תואמות את הפרופיל "${profileName}".`];

  const componentNames = { comm: 'כשירות תקשורתית', alpha: 'ידע אלפביתי', book: 'מפגש עם ספר' };
  const compSummary = [];
  for (const key of ['comm', 'alpha', 'book']) {
    if (breakdown[key]) {
      compSummary.push(`${componentNames[key]} — ${PROFILES[breakdown[key]].name_he}`);
    }
  }
  if (compSummary.length > 0) {
    parts.push('פירוט פר רכיב: ' + compSummary.join(' · '));
  }
  return parts.join(' ');
}

// ════════════════════════════════════════════════════════════════
// אחסון — students + assessments ב-localStorage
// ════════════════════════════════════════════════════════════════

const STUDENTS_KEY = 'avnei-yesod-students';
const ASSESSMENTS_KEY = 'avnei-yesod-literacy-profile';

function uid() {
  return 'stu-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const StudentsStore = {
  list() {
    return readJson(STUDENTS_KEY, []);
  },
  add({ name }) {
    const students = this.list();
    const student = {
      id: uid(),
      name: (name || '').trim(),
      entry_date: new Date().toISOString().slice(0, 10),
      profile: null,
      profile_decided_at: null,
    };
    students.push(student);
    writeJson(STUDENTS_KEY, students);
    return student;
  },
  get(id) {
    return this.list().find(s => s.id === id) || null;
  },
  updateProfile(id, profile) {
    const students = this.list();
    const idx = students.findIndex(s => s.id === id);
    if (idx === -1) return null;
    students[idx].profile = profile;
    students[idx].profile_decided_at = new Date().toISOString();
    writeJson(STUDENTS_KEY, students);
    return students[idx];
  },
};

export const AssessmentsStore = {
  list(studentId) {
    const all = readJson(ASSESSMENTS_KEY, {});
    return all[studentId] || [];
  },
  save(studentId, assessment) {
    const all = readJson(ASSESSMENTS_KEY, {});
    if (!all[studentId]) all[studentId] = [];
    const record = {
      assessment_id: 'asm-' + Date.now().toString(36),
      date: new Date().toISOString(),
      ...assessment,
    };
    all[studentId].push(record);
    writeJson(ASSESSMENTS_KEY, all);
    return record;
  },
  latest(studentId) {
    const list = this.list(studentId);
    return list.length ? list[list.length - 1] : null;
  },
};

// Window-attached for non-module consumers (consistency with event-logger.js style)
if (typeof window !== 'undefined') {
  window.AvneiProfileClassifier = {
    PROFILES, COMPONENTS, OBSERVATIONS,
    classifyProfile, StudentsStore, AssessmentsStore,
  };
}
