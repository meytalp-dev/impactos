/**
 * אבני יסוד — Item Schema (גרסה 1.0)
 *
 * מקור: _handoff/2026-05-25-architecture-tasks.md · משימה A0.2
 * תאריך: 2026-05-26
 *
 * מטרת המודול:
 *   הגדרה רשמית של 2 שדות התיוג החדשים — `rama_task_alignment` ו-`peima_target` —
 *   שמתווספים לכל פריט תרגול במערכת, ומאפשרים:
 *     1. בדיקת קריטריון Mastery משולש (משימה A0.3) — האם הילדה עברה את רף ראמ"ה?
 *     2. דשבורד מורה בשפת ראמ"ה (משימה 21A) — חיתוך לפי 10 משימות + 3 פעימות.
 *
 * מבוסס על: 10 משימות ראמ"ה (מבדק 2014) + 3 פעימות (ספט-אוק, ינו-פבר, מאי-יוני).
 */

/**
 * 10 משימות ראמ"ה — Single source of truth.
 * @typedef {1|2|3|4|5|6|7|8|9|10} RamaTaskId
 */
export const RAMA_TASKS = Object.freeze({
  1:  { id: 1,  name_he: 'קריאת שמות אותיות',           strand: 'phonology',   peima: 1, threshold: '18+/22' },
  2:  { id: 2,  name_he: 'מודעות פונולוגית',            strand: 'phonology',   peima: 1, threshold: '5+/6 פותח · 4+/6 סוגר' },
  3:  { id: 3,  name_he: 'הבנת טקסט מושמע',             strand: 'comprehension', peima: 2, threshold: '7+/10' },
  4:  { id: 4,  name_he: 'מודעות לשונית',                strand: 'morphology',  peima: 2, threshold: '16+/22' },
  5:  { id: 5,  name_he: 'קריאת 45 צירופים מנוקדים',    strand: 'reading',     peima: 3, threshold: '38+/45 · ≤90שנ' },
  6:  { id: 6,  name_he: 'קריאת 20 מילים מוכרות',       strand: 'reading',     peima: 3, threshold: '18+/20 · ≤70שנ' },
  7:  { id: 7,  name_he: 'קריאת 20 מילים לא-מוכרות',    strand: 'reading',     peima: 3, threshold: '14+/20 · ≤100שנ' },
  8:  { id: 8,  name_he: 'קריאת סיפור "השבלול"',         strand: 'reading',     peima: 3, threshold: '69+/77 · ≤195שנ' },
  9:  { id: 9,  name_he: 'הכתבת 10 מילים',               strand: 'writing',     peima: 3, threshold: '21+/30' },
  10: { id: 10, name_he: 'הבנת הנקרא',                   strand: 'comprehension', peima: 3, threshold: '10+/12 · 5+/8' },
});

/**
 * 3 פעימות ראמ"ה.
 * @typedef {1|2|3} PeimaId
 */
export const PEIMAS = Object.freeze({
  1: { id: 1, name_he: 'פעימה ראשונה',  months_he: 'ספטמבר–אוקטובר', tasks: [1, 2] },
  2: { id: 2, name_he: 'פעימה שניה',    months_he: 'ינואר–פברואר',   tasks: [3, 4] },
  3: { id: 3, name_he: 'פעימה שלישית',  months_he: 'מאי–יוני',       tasks: [5, 6, 7, 8, 9, 10] },
});

/**
 * מפת ברירת מחדל: לכל משימת ראמ"ה — איזו פעימה היא נופלת בה.
 * שימושי כאשר רוצים לאמת ש-rama_task_alignment ו-peima_target עקביים.
 */
export const TASK_TO_PEIMA = Object.freeze({
  1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3,
});

/**
 * Schema של פריט תרגול — minimal contract.
 * שדות נוספים (id, level, type, prompt, וכו') תלויים בסוג המשחקון.
 *
 * @typedef {Object} ItemTaggingContract
 * @property {RamaTaskId} rama_task_alignment - איזו מ-10 משימות ראמ"ה הפריט תורם.
 * @property {PeimaId}    peima_target        - באיזו פעימה הפריט רלוונטי.
 */

/**
 * בודק אם פריט עומד בחוזה התיוג של ראמ"ה.
 * מחזיר { valid: boolean, errors: string[] }.
 *
 * @param {Object} item
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRamaTagging(item) {
  const errors = [];
  const task = item.rama_task_alignment;
  const peima = item.peima_target;

  if (task === undefined || task === null) {
    errors.push('חסר rama_task_alignment');
  } else if (!Number.isInteger(task) || task < 1 || task > 10) {
    errors.push(`rama_task_alignment חייב להיות int 1-10, התקבל: ${task}`);
  }

  if (peima === undefined || peima === null) {
    errors.push('חסר peima_target');
  } else if (!Number.isInteger(peima) || peima < 1 || peima > 3) {
    errors.push(`peima_target חייב להיות int 1-3, התקבל: ${peima}`);
  }

  if (errors.length === 0 && TASK_TO_PEIMA[task] !== peima) {
    errors.push(
      `אי-עקביות: rama_task_alignment=${task} נופל בפעימה ${TASK_TO_PEIMA[task]}, ` +
      `אבל peima_target=${peima}. אם זו כוונה (פריט המקדים משימה עתידית) — להסיר את הבדיקה.`
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * מחזיר מטה-דאטה של משימת ראמ"ה לפי id.
 */
export function getRamaTaskInfo(taskId) {
  return RAMA_TASKS[taskId] || null;
}

/**
 * מחזיר מטה-דאטה של פעימה לפי id.
 */
export function getPeimaInfo(peimaId) {
  return PEIMAS[peimaId] || null;
}

/**
 * מסנן רשימת פריטים לפי משימת ראמ"ה.
 * שימוש בדשבורד המורה — להציג רק פריטים שתורמים למשימה X.
 */
export function filterByRamaTask(items, taskId) {
  return items.filter(it => it.rama_task_alignment === taskId);
}

/**
 * מסנן רשימת פריטים לפי פעימה.
 * שימוש בדשבורד — "מה רלוונטי בפעימה הנוכחית?"
 */
export function filterByPeima(items, peimaId) {
  return items.filter(it => it.peima_target === peimaId);
}
