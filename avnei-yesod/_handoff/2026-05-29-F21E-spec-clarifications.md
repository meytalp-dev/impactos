# F.21E Spec v2 — Clarification Request

> **למיטל:** העתיקי את כל מה שמתחת לקו הראשון של `---` בשיחה הקיימת ב-ChatGPT (אותה שיחה שיצרה את ה-v1).
>
> **למה בקובץ נפרד ולא בצ'אט:** כי יכנס ל-_handoff כדי שיהיה reference לוויכוח/תיעוד.

---

# F.21E UX Spec v2 — בקשת חידוד

ה-spec שלך מצוין כבסיס: מבנה, שפה, wireframes, empty states, color palette — כל אלה חזקים. **לפני שאני משגרת סוכן קוד**, יש **5 פערים קריטיים + 4 קטנים** שצריך לסגור.

אנא החזרי **v2 של אותו spec** — עם התיקונים integrated, לא כ-document נפרד. שמרי את כל מה שטוב, ופתרי את הבעיות הבאות.

הקובץ הסופי המבוקש: `_handoff/2026-05-29-F21E-ux-spec-v2.md` (markdown אחד, ~400-500 שורות).

---

## 5 הפערים הקריטיים

### פער 1 — ערכים hardcoded בלי מקור דאטה

**איפה הבעיה:** ב-§3.4 (כרטיס קבוצה) הופיעו השדות:
- "כדאי לעשות: **10 דקות תרגול מודרך**"
- "**אותיות לתרגול: מ · ש · ר**"

**הבעיה:** לא הוגדר מאיפה הערכים האלה נשלפים. ה-B.9 API (`suggestGroups`) מחזיר רק `{pattern_id, students, confidence, evidence}` — **לא** משך זמן ו**לא** אותיות. ה-modal של B.7 כבר מציג את ה-script המלא עם משך הזמן והוראות.

**מה אני צריכה ממך:**
1. **למחוק את שורת "10 דקות תרגול מודרך"** מ-card. ה-script ב-modal של B.7 כבר מציג זאת.
2. **להגדיר את "אותיות לתרגול" בכרטיס** — או למחוק אותה, או להגדיר מקור דאטה ברור (ראה פער 2).
3. בכל מקרה אחר בו רשמת ערך קונקרטי בכרטיס — **לציין את מקור הדאטה במפורש בהערה צמודה** (מי האפי, איזה שדה).

### פער 2 — Weakness Letters Mapping לא הוגדר טכנית

**איפה הבעיה:** §5.6 רשם "sub-BKT 22 letters" כמקור, אבל **אין פונקציה ציבורית** כיום שמחזירה top-N weak letters פר תלמיד.ה. ה-API הקיים: `AvneiPackBridge.getNextPackForStudent(sid)` → pack שלם, לא רשימת אותיות.

**מה אני צריכה ממך:**
1. להגדיר ב-§6 (Data Integration) שדרושה פונקציית עזר חדשה (לא קיימת היום):
   ```
   getTopWeakLetters(sid, n=3) → ['מ', 'ש', 'ר']
   // מבוסס על raw sub-BKT data של 22 האותיות,
   // top-n עם pKnown הנמוך ביותר
   ```
2. **לציין במפורש בסקציית Acceptance** שהפונקציה נכתבת ע"י סוכן הקוד של F.21E כ-helper מקומי (לא לשנות את `bkt.js`).
3. ב-§5.6 — להחליט: האם רשימת האותיות מופיעה **בכרטיס קבוצה** (top-N של ה-overlap בקבוצה) או **רק ב-section נפרדת "אותיות שכדאי לשלב היום"**? המלצתי: רק ב-section נפרדת — בכרטיס קבוצה תופיע רק אם ה-pattern_id הוא `letter_knowledge` או `letter_cluster`.

### פער 3 — Class Selector — אין כיתות במערכת!

**איפה הבעיה:** §2.4 + §10.3 דורשים class selector. **המערכת היום לא מנהלת כיתות.** כל הילדות = רשימה אחת ב-`localStorage['underwater-app:students']`. אין `classId`, אין `class_name`, אין מנגנון multi-class.

**מה אני צריכה ממך:**
1. להבהיר ב-§2.4 + §10.3 ש-**בפיילוט**: class selector = **mockup בלבד** — מציג טקסט קבוע "כיתה א'1" (hardcoded), בלי dropdown אמיתי.
2. להוסיף הערה: "מבנה הקוד צריך לאפשר הרחבה עתידית — `classId` כפרמטר, אבל בפיילוט מועבר value קבוע."
3. **למחוק** את כל ה-`classId` מ-localStorage execution-tracking schema (§6.6). בכיתה אחת = key פשוט יותר.

### פער 4 — "בוצע השבוע" — UI flag בלבד או משפיע על B.9?

**איפה הבעיה:** §6.6 הגדיר schema לסימון "בוצע" אבל **לא הגדיר אם זה משפיע על B.9 next round**. למשל: סימנתי "קבוצה 1 בוצעה היום" — האם מחר B.9 לא ימליץ עליה? תופיע שוב בעוד 4 ימים? Tier-2 evidence-based = 4-5 פעמים בשבוע, אז יש משמעות פדגוגית.

**מה אני צריכה ממך:**
1. להחליט בpilot: **UI flag בלבד** — הסימון רק לצורך תזכורת ויזואלית למורה (badge "בוצע היום"). **לא משפיע** על B.9 next round.
2. לציין במפורש ב-§6.6 ובסעיף Out of Scope (§11): "השפעת ביצוע על suggester = post-pilot. בפיילוט F.21E הוא ויזואלי בלבד."
3. **לפשט את ה-schema** ל-key אחד: `avnei-action-log-v1 = [{type, key, completedAt}]` — בלי `weekStart`, בלי `classId`, בלי `completedBy`. ה-UI יחשב "השבוע" מ-`completedAt`.

### פער 5 — מה קורה ל-B.9 Section ב-teacher-rama כש-F.21E חי?

**איפה הבעיה:** ב-§2.3 בחרת "version עשירה ב-F.21E + שמירת B.9 Section ב-F.21A כ-fallback" — טוב. אבל לא הוגדר:
- האם ה-Section ב-teacher-rama מקבל **לינק "→ עברי לפעולה ב-F.21E"**?
- האם הוא נשאר זהה functionally?

**מה אני צריכה ממך:**
1. להוסיף הוראה ב-§10.11 (ניווט) או §2.3:
   "ב-teacher-rama (F.21A), Section 'קבוצות בוקר מוצעות' נשאר כפי שהוא, אבל בראש ה-Section יתווסף לינק קטן '🌅 עברי לפעולה →' שמוביל ל-F.21E."
2. **לא לבנות מחדש** את `renderMorningGroupSuggestions()` ב-teacher-rama. רק להוסיף לינק.

---

## 4 פערים קטנים

### 6. Hero copy — צריכים rules

ב-§9.4 הופיעו 3 נוסחים בלי לוגיקת בחירה. אנא הוסיפי טבלת rules פשוטה:

| מצב | משפט |
|---|---|
| groups ≥ 1 AND moy_alerts ≤ 1 | "היום כדאי להתחיל מ-{n} קבוצות..." |
| groups = 0 AND no_group ≥ 1 | "אין קבוצות דחופות. כדאי לתת מענה אישי ל-{m}..." |
| groups = 0 AND no_group = 0 AND moy_alerts = 0 | "הכל יציב היום. אפשר לחזק תרגול לפי האותיות." |
| moy_alerts ≥ 2 | "היום יש כמה התראות אמצע שנה — כדאי לסדר לפני השיעור." |

### 7. URL contract של "מבט תלמיד/ה"

ב-§5.7 לא הוגדר ה-URL ל-Student View. הקיים: `teacher-rama.html?student=<sid>` (קוד הזה כבר חי).
אנא הוסיפי ב-§10.11: "לחיצה על שם תלמידה → `teacher-rama.html?student=<sid>`. חזרה דרך `history.back()`."

### 8. ברכה לפי שעת היום

הכותרת "דשבורד פעולת בוקר" קבועה, אבל מורה עשויה לפתוח ב-13:00. הוסיפי ב-§5.2: ברכת ה-Hero מתאימה לזמן —
- 5:00-11:00 → "בוקר טוב"
- 11:00-16:00 → "צהריים טובים"
- 16:00-22:00 → "אחר הצהריים"
- אחרת → "היי"

(הכותרת נשארת "דשבורד פעולת בוקר" כי זו ה-Brand של המסך.)

### 9. Execution tracking schema — לפשט

ה-schema ב-§6.6 (`classId + weekStart + actionType + signature + pattern_id`) **סבוך מדי לפיילוט עם כיתה אחת**.

החליפי ל:
```
key: 'avnei-action-log-v1'
value: [
  {
    type: 'group' | 'individual' | 'moy',
    key: <pattern_id>_<sid_list_hash> | <sid> | <sid>_<task_id>,
    completedAt: <ISO timestamp>
  },
  ...
]
```

"השבוע" = filter `completedAt >= startOfWeek(today)` ב-runtime.

---

## Deliverable מבוקש

קובץ אחד: **`_handoff/2026-05-29-F21E-ux-spec-v2.md`** — markdown.

**שמרי מה שטוב מ-v1:** מבנה 13 הסעיפים, color palette, wireframes, empty states, שפת מורה, microcopy.

**עדכני:**
- §2.3 (B.9 Section) — הוסיפי הוראת הלינק ב-teacher-rama
- §2.4 (Class selector) — הבהירי שזה mockup בפיילוט
- §3.4 (כרטיס קבוצה) — מחקי "10 דקות", הוסיפי הערות source לכל שדה
- §5.6 (Weakness Letters) — הוסיפי `getTopWeakLetters` helper
- §6 (Data integration) — הוסיפי את helper + סעיף ביצוע פשוט
- §6.6 (Execution) — schema פשוט יותר
- §9.4 (Hero copy) — הוסיפי rules table
- §10.11 (ניווט) — URL contract של Student View + לינק לפעולה ב-teacher-rama
- §11 (Out of Scope) — הוסיפי "השפעת execution על B.9 = post-pilot"

**אל תוסיפי תכונות חדשות שלא בקשתי כאן.** אם בכל זאת זיהית פער חשוב — תציעי בסעיף "§14 הצעות נוספות לדיון" בסוף, ואני אחליט.

**אורך יעד:** 400-500 שורות. v1 היה 1334 — הצליחת לכתוב יפה אבל ארוך. ב-v2 תחתכי מהפרק הנעים: §3.2 color palette (לקצר ל-paragraph) · §2 החלטות (כבר נסגרו, לקצר נימוקים) · §5.7 quick actions (הסירי הסבר ארוך).

---

## אסור

- לבנות UI חדש שלא ב-spec.
- לשנות החלטות שכבר אישרתי ב-v1 (URL נפרד · Hero hybrid · Mobile-first · On-focus refresh).
- לחשוף שפה טכנית (BKT/EPA/strands/confidence).
- להוסיף ניקוד.
- להציע למזג F.21A ↔ F.21E.

---

*אם תרצי להבהיר משהו לפני שמתחילה — שאלי. אני קוראת פעיל.*
