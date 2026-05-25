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

// ════════════════════════════════════════════════════════════════
// suggestFromBKT — הצעה אוטומטית לרכיב 2 בלבד (גישה היברידית)
// ════════════════════════════════════════════════════════════════
//
// קולן ממליצה על 3 כלי הערכה: שיח דבור, מבדק ראמ"ה (משימות 1-2), קריאה דיאלוגית.
// מתוכם — רק "משימות 1-2 ממבדק ראמ"ה" (אותיות + פונולוגיה) ניתנות לדגימה אוטומטית
// דרך משחקוני אי 2 + אי 3. שיח דבור וקריאה דיאלוגית דורשים תצפית של המורה.
//
// לכן: המערכת מציעה רק לרכיב 2 (ידע אלפביתי). רכיבים 1 (תקשורתית) ו-3 (ספר)
// תמיד נשארים למילוי ידני של המורה.
//
// סף הצעה: 10+ אירועי תרגול באי 2 או אי 3 (תואם ל-Confidence Yellow ב-architecture-mvp).
//
// הערה אופרציונלית: ה-event-logger כותב כרגע כל אירוע ל-student_id קבוע = 'local'.
// בעתיד (משימה E.18 — sync ל-Sheet) ייווצר קישור בין StudentsStore ל-events.
// בינתיים — אם studentId מועבר אבל אין לו state ב-BKT, מנסה fallback ל-'local'.

/**
 * מציע סימונים אוטומטיים לרכיב 2 (ידע אלפביתי) על-סמך נתוני BKT + sub-BKT.
 *
 * @param {string} studentId - id התלמידה ב-StudentsStore (או 'local' לדמו)
 * @returns {{
 *   available: boolean,
 *   suggestions?: Object<string, 1|2|3|4>,  // observation_id → profile_id
 *   evidence?: Object<string, string>,       // observation_id → הסבר טקסטואלי
 *   event_count?: number,
 *   reason?: string,  // אם !available — למה
 *   source_student_id?: string,
 *   note?: string,
 * }}
 */
export function suggestFromBKT(studentId) {
  if (typeof window === 'undefined' || !window.AvneiBKT) {
    return { available: false, reason: 'מנוע BKT לא נטען (יזמין בעתיד).' };
  }

  // קוראים רק את ה-state האישי של התלמידה.
  // (לאחר A0.1 — event-logger כותב לפי avnei-yesod-current-student, אז אם יש דאטה היא אישית).
  // 'local' = רק למצב דמו/אורחת כשאין picker.
  const sourceId = studentId;
  const state = window.AvneiBKT.getStudentState(sourceId);
  const hasData = state && (state[2] || state[3]);
  if (!hasData) {
    return {
      available: false,
      reason: 'התלמידה עוד לא תרגלה במערכת (אין נתוני BKT אישיים).',
      event_count: 0,
      source_student_id: sourceId,
    };
  }

  const i2 = state && state[2];
  const i3 = state && state[3];
  const i2Attempts = (i2 && i2.attempts) || 0;
  const i3Attempts = (i3 && i3.total_attempts) || 0;

  // אי 1 שומר ב-mastery.js נפרד (gloal, לא פר תלמידה כיום — מגבלה לפיילוט).
  const i1Mastery = readJson('avnei-yesod-island1-mastery', {});
  const i1Words = Object.entries(i1Mastery);
  const i1AttemptedCount = i1Words.length;
  const i1MasteredCount = i1Words.filter(([, games]) => Object.values(games).includes('mastered')).length;

  const totalAttempts = i2Attempts + i3Attempts + i1AttemptedCount;

  if (totalAttempts < 10) {
    return {
      available: false,
      reason: `נאספו ${totalAttempts} אירועי תרגול עד כה (נדרשים 10+ כדי להציע).`,
      event_count: totalAttempts,
      source_student_id: sourceId,
    };
  }

  const suggestions = {};
  const evidence = {};

  // alpha_1 — מודעות פונולוגית. שילוב אי 1 (הברות) ואי 2 (פונמות) לפי קולן:
  //   "מבצעים מניפולציות פונולוגיות ברמת הצירוף והפונמה" → טובה/מצוינת (מאי 2)
  //   "מבצעים מניפולציות פונולוגיות בסיסיות ברמת ההברה והצירוף" → חלקית (אי 1 בלבד)
  if (i2 && i2.attempts >= 5) {
    // יש דאטה מאי 2 — רמת פונמה. יכול להגיע ל"מצוינת".
    const p = i2.pKnown;
    if (p >= 0.85) suggestions.alpha_1 = 1;
    else if (p >= 0.65) suggestions.alpha_1 = 2;
    else if (p >= 0.40) suggestions.alpha_1 = 3;
    if (suggestions.alpha_1) {
      evidence.alpha_1 = `BKT אי 2 (פונמות) = ${p.toFixed(2)} (${i2.attempts} ניסיונות)`;
    }
  } else if (i1AttemptedCount >= 5) {
    // אין אי 2 אבל יש אי 1 — תקרה "חלקית" לפי קולן (הברה בלבד = לא הגיעה לפונמה).
    const i1Ratio = i1MasteredCount / i1AttemptedCount;
    suggestions.alpha_1 = i1Ratio >= 0.5 ? 3 : 4;
    evidence.alpha_1 = `אי 1 (הברות) = ${i1MasteredCount}/${i1AttemptedCount} מילים נרכשו. אין דאטה מאי 2 (פונמות) — לפי קולן, מודעות פונולוגית ברמת הברה בלבד = "שליטה חלקית" לכל היותר.`;
  }

  // alpha_2 — ידע אותיות מ-Sub-BKT פר אות באי 3
  if (i3 && i3.per_letter) {
    const letters = Object.entries(i3.per_letter);
    const practiced = letters.filter(([, st]) => st.attempts >= 3);
    if (practiced.length >= 3) {
      const known = practiced.filter(([, st]) => st.pKnown >= 0.70);
      const ratio = known.length / practiced.length;
      if (ratio >= 0.90) suggestions.alpha_2 = 1;
      else if (ratio >= 0.65) suggestions.alpha_2 = 2;
      else if (ratio >= 0.30) suggestions.alpha_2 = 3;
      else suggestions.alpha_2 = 4;
      evidence.alpha_2 = `${known.length}/${practiced.length} אותיות מתורגלות שולטת (BKT ≥ 0.70). הערה: רק 5 אותיות פעילות באי 3 כיום (מ/ק/ב/ר/ת) — היחס מתבסס עליהן בלבד עד שתבנה תבנית גנרית.`;
    }
  }

  // alpha_3 — קשרי אות-צליל מ-aggregate אי 3
  if (i3 && i3.total_attempts >= 5) {
    const p = i3.aggregate_pKnown;
    if (p >= 0.85) suggestions.alpha_3 = 1;
    else if (p >= 0.55) suggestions.alpha_3 = 2;
    // p < 0.55 → לא מציעים (טווח לא ברור בין 2 ל-3 במקור)
    if (suggestions.alpha_3) {
      evidence.alpha_3 = `BKT אי 3 (aggregate) = ${p.toFixed(2)} (${i3.total_attempts} ניסיונות)`;
    }
  }

  // alpha_4 (ניצני קריאה) ו-alpha_5 (כתיב פונטי) לא ניתנים למדידה ממשחקוני אי 1-3 בלבד.
  // נשארים תמיד למילוי ידני.

  return {
    available: true,
    suggestions,
    evidence,
    event_count: totalAttempts,
    source_student_id: sourceId,
    note: 'המערכת מציעה רק לרכיב "ידע אלפביתי". רכיבי שיח דבור ומפגש עם ספר דורשים תצפית של המורה.',
    i1_attempted: i1AttemptedCount,
    i1_mastered: i1MasteredCount,
    i1_is_global: i1AttemptedCount > 0,  // אי 1 mastery.js שומר גלובלית — בעיה ידועה
  };
}

// Window-attached for non-module consumers (consistency with event-logger.js style)
if (typeof window !== 'undefined') {
  window.AvneiProfileClassifier = {
    PROFILES, COMPONENTS, OBSERVATIONS,
    classifyProfile, suggestFromBKT, StudentsStore, AssessmentsStore,
  };
}
