# Handoff — סוכן פדגוגי 21: העמקת 5 scripts אינטרבנציה B.7

> **מיטל:** זה bootstrap **לסוכן פדגוגי** (Claude/ChatGPT) — לא לסוכן קוד. את מפעילה אותו בשיחה חיצונית (לא ב-VS Code). הוא ממיר 5 קבצי JSON קיימים מ-`PARTIAL` → `FULL` בעומק הוראתי.
>
> **את הסוכן הקוד אחרי אישור פדגוגי שלך:** סוכן קוד נפרד יקבל את ה-5 קבצים המעודכנים ויחבר אותם פנימה (לעדכן `_meta.version` + לוודא placeholders עובדים עם `interpolateScript`).

---

# העמקת 5 scripts אינטרבנציה — מ-PARTIAL ל-FULL

## משימה

ב-`underwater-app/interventions/` קיימים **5 קבצי JSON** פדגוגיים — אחד פר pattern: `phonological` · `letter_knowledge` · `decoding` · `fluency` · `letter_cluster`. כל קובץ מכיל 5 stages (Hook → Model → Guided → Independent → Success Check) לפי Rosenshine 2012 + IES Foorman 2016 (Tier-2 RTI · 10-15 דקות · 4-5 ימים שבועיים · 3-4 ילדות).

**מצב היום:** כל הקבצים `PARTIAL` (700-1000 chars). יש teacher_say + teacher_do + notes בסיסיים, אבל **חסרים פרטים מעמיקים**: דוגמאות נוספות, materials מפורטים פר רמה, scaffolding לתלמידות מתקשות, troubleshooting פר טעות נפוצה, differentiation tips.

**יעד:** לעבור ל-`FULL` (1500-2500 chars פר קובץ) — script שמורה יכולה להפעיל בלי הכשרה נוספת.

## הקשר

"אבני יסוד" = מערכת תרגול אדפטיבית לכיתה א'. B.7 = הלב הפדגוגי של "פתחי קבוצת תמיכה" — כשהמערכת מזהה דפוס משותף לקבוצה (B.8 + B.9) ומציעה למורה script מובנה. **5 ה-scripts צריכים לעמוד פדגוגית מול ראמ"ה ומפקחות.**

## קבצי-מקור — חובה לקרוא לפני עבודה

1. **5 הקבצים הנוכחיים:** `avnei-yesod/underwater-app/interventions/{phonological,letter-knowledge,decoding,fluency,letter-cluster}.json` — `PARTIAL`. **לשמור 100% מהמבנה הקיים** (id, duration_minutes, success_criterion וכו') — רק להעמיק תוכן.
2. **Spec B.7:** `avnei-yesod/_handoff/2026-05-28-B7-interventions-spec.md` — מסמך-האם הפדגוגי. 5 patterns, 5 stages, evidence-base, placeholders. **מקור-האמת.**
3. **מסגרת פדגוגית:** `avnei-yesod/curriculum/pedagogy-integration-framework.md` — 5 סטרנדים + 3 רכיבי משה"ח + 6 שלבי תוכנית הלימודים תשפ"ו.
4. **אזהרות:** `avnei-yesod/curriculum/llm-pitfalls.md` — מה לא לצטט. **חובה לזכור:**
   - Share & Bar-On 2018 = **3 פאזות Triplex** (לא 6 שלבים)
   - Shatil & Share 2003 = modularity hypothesis (לא שלבים)
   - 6 שלבים = משה"ח תשפ"ו (סינתזה של 4 מקורות)
5. **CONFUSED_PAIRS** (ל-letter-knowledge): `avnei-yesod/underwater-app/js/shared/interventions.js` שורות 70-90 — 5 זוגות אותיות מתבלבלות (מ↔ם · נ↔ן · כ↔ך · פ↔ף · צ↔ץ). אסור לסטות.
6. **Memory feedback:**
   - שפת מורה פשוטה, לא טכנית
   - דוגמאות בעברית מנוקדת (כי המורה תקריא)

## דוגמה לפני/אחרי — מתוך phonological.json שלב HOOK

### לפני (PARTIAL):
```json
{
  "id": "hook",
  "title": "HOOK — חימום",
  "duration_minutes": 1,
  "teacher_say": "בנות, מה אם נגיד מילה רק בקולות? נשמע ש-ֶ-מ-ֶ-ש... ניחשו מה זה?",
  "teacher_do": "השמיעי קולות בנפרד (פונמה-פונמה), בלי הקראת המילה השלמה. תני 2-3 שניות לכל ילדה לנחש.",
  "notes": null
}
```

### אחרי (FULL — מטרת היעד):
```json
{
  "id": "hook",
  "title": "HOOK — חימום",
  "duration_minutes": 1,
  "teacher_say": "בנות, נשחק משחק — אני אגיד מילה רק בקולות. אם אתן מנחשות נכון — אנחנו ממשיכות. נשמע: ש... ֶ... מ... ֶ... ש. ניחשו מה זה?",
  "teacher_do": "השמיעי 4 פונמות בנפרד עם הפסקה של חצי שנייה בין כל אחת. אסור לחבר אותן — כל אחת לחוד. תני 2-3 שניות לכל ילדה לנחש בקול.",
  "examples_to_use": [
    {"word": "שֶׁמֶש", "phonemes": ["ש", "ֶ", "מ", "ֶ", "ש"], "hint": "5 צלילים — אבל המילה קצרה"},
    {"word": "סוּס", "phonemes": ["ס", "וּ", "ס"], "hint": "3 צלילים — חיה ש-ילדות אוהבות"},
    {"word": "יָד", "phonemes": ["י", "ָ", "ד"], "hint": "3 צלילים — חלק מהגוף"}
  ],
  "differentiation": {
    "struggling": "אם תלמידה לא מנחשת — תני רמז נוסף: 'זה משהו שאנחנו רואות בבוקר ברקיע'. אם עדיין לא — הראי תמונה.",
    "advanced": "אם תלמידה מנחשת מהר — תני לה אחריות: 'את תוציאי את המילה הבאה'."
  },
  "notes": "הקצב חשוב — לא מהר מדי. ילדה צריכה לעבד כל פונמה לפני שהבאה מגיעה."
}
```

**העיקרון:** לא להחליף את הקיים — להוסיף שכבות (examples_to_use · differentiation · troubleshooting · materials_detail).

## שדות חדשים מוצעים פר stage

לכל stage להוסיף כשרלוונטי:

| שדה | מה זה | חובה? |
|---|---|---|
| `examples_to_use` | 3-5 דוגמאות קונקרטיות (עם ניקוד מלא · עם hint למורה) | חובה ל-Hook + Model + Guided + Independent |
| `differentiation` | `{struggling, advanced}` — איך להתאים | חובה כשרלוונטי (לא ב-Hook קצר) |
| `troubleshooting` | רשימת טעויות נפוצות + תגובה | מומלץ ל-Guided + Independent |
| `materials_detail` | פירוט materials (לא רק "10 כרטיסי תמונה") — איזה תמונות בדיוק | רק ברמת הקובץ (לא בstage) |
| `pacing_notes` | "מהר עם נועה, איטי עם מאיה" — הערות קצב | אופציונלי |

## משימות (להריץ ברצף · אישור פר קובץ ממיטל)

1. ☐ קרא את כל 6 קבצי המקור.
2. ☐ **שמור את 5 הקבצים הקיימים** — הם הבסיס. כל שדה existing נשאר.
3. ☐ עבוד פר קובץ — לפי הסדר:
   - `phonological.json` (1) — הקל ביותר, התחלה טובה
   - `letter-knowledge.json` (2) — דורש דוגמאות מ-CONFUSED_PAIRS
   - `decoding.json` (3) — context-based, ידרוש המצאת dummy passages
   - `fluency.json` (4) — דורש "stories ידוע" שעדיין לא קיים
   - `letter-cluster.json` (5) — מותאם אישית פר ילדה (placeholders משתנים)
4. ☐ **לכל קובץ — אישור פר-קובץ ממיטל לפני שעוברים לבא.**
5. ☐ בסיום 5 הקבצים — דווח: chars-before/chars-after פר קובץ + tests שעדיין צריך לבדוק (ה-interpolateScript של interventions.js).

## Acceptance Criteria

- [ ] כל 5 הקבצים מגיעים ל-1500+ chars.
- [ ] כל stage עם examples_to_use (≥3 דוגמאות).
- [ ] כל stage עם differentiation (struggling + advanced).
- [ ] ניקוד מלא בכל דוגמא (כי המורה תקריא).
- [ ] **אפס** שינוי במבנה ה-JSON הקיים (id, duration_minutes, success_criterion).
- [ ] **אפס** שינוי ב-evidence list — אם רוצים להוסיף מקור, רק עם אישור פדגוגי.
- [ ] **אפס** המצאה אקדמית — אם אין מקור מאומת, **לא להוסיף**. (זוהי הזיית LLM קלאסית.)
- [ ] שפה ניטרלית — "תלמידות" / "ילדות" / "בנות" (לא רק בנות — גם בנים — אבל בשיחה, מורה תאמר "בנות" כשרובן בנות).

## אסור לך

- ❌ לערוך שום קובץ JS / HTML / קוד.
- ❌ לשנות את ה-placeholders ש-`interpolateScript` מצפה להם: `{personalized_letters}`, `{personalized_first_letter}`, `{class_name}`, `{teacher_name}`.
- ❌ לשנות את `pattern_id` או `pattern_name_he`.
- ❌ להוסיף "תכונות חכמות" כמו `audio_url` או `video_url` — לא בסקופ.
- ❌ להוסיף scripts ל-tier-3 (סלקטיביים) או tier-1 (פרונטליות) — רק Tier-2 RTI.
- ❌ **להמציא מקורות אקדמיים.** אם מצב חורק — לכתוב `[verification-pending]`.
- ❌ לדחוף ל-git. רק מיטל דוחפת.

## בספק

שאלי את מיטל. במיוחד אם:
- חסרה לך דוגמה ספציפית (לדוגמה: "אילו מילים בעברית הן 3 פונמות בלבד?").
- את חוששת שדוגמה לא מתאימה ל-Triplex Phase 1.
- את לא בטוחה אם תלמידה בכיתה א' תוכל לעקוב אחרי המכניקה.

---

*Bootstrap זה הוא pedagogical companion ל-B.7 spec. אחרי שמיטל מאשרת את 5 הקבצים → סוכן קוד נפרד (זריז · 1-2h) יעדכן `_meta` ויריץ test-interventions.js.*
