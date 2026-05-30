# Build Plan — מערכת 10: פולס לכיתה א׳

> **מטרה:** מסמך בנייה + bootstrap לסוכן קוד. מבוסס על:
> - [`system-10-pulse-spec.md`](system-10-pulse-spec.md) — המקור הפדגוגי-עיצובי (v3)
> - [`system-10-pulse.html`](system-10-pulse.html) — המצגת לטליה
>
> **לפני שמתחילים:** קראי את שני הקבצים. כל מה שכאן נשען עליהם.

---

## 1. מקורות העתקה — מה כבר קיים, איפה, ומה לוקחים

### 1.1 פולס בית הערבה — UX skeleton (כ-50% של המוצר)

מקור: `C:/Users/meyta/Downloads/ort-presentation-builder/docs/management/`

| קובץ מקור | מה לוקחים | יעד חדש |
|---|---|---|
| `pulse-questionnaire.html` (812 שורות) | flow של סטוריז + מנוע אודיו + שלבי שאלון + Google Sheets submit | `inclusion/pulse-questionnaire.html` |
| `pulse-dashboard.html` (696 שורות) | מבנה דשבורד + insight cards + arc score + response rate ring | `inclusion/pulse-dashboard.html` |
| `pulse-links.html` | מחולל קישורי כיתה + העתקה ל-WhatsApp | `inclusion/pulse-links.html` |
| `pulse-builder.html` (262 שורות) | מחולל שאלון מותאם — לפיילוט: לא דרוש (טמפלייט קבוע) | (אופציונלי לעתיד) |
| `pulse-return.html` | מסך מילוי-חוזר אחרי "סיימתי כבר" | `inclusion/pulse-return.html` |
| `pulse-story.html` | מסך תוצאות "מגזיני" | (לא דרוש בפיילוט — הדשבורד מספיק) |
| `pulse-staff.html` | שאלון לצוות | (post-pilot — לא בסקופ ראשון) |

**מה חובה להחליף:**
- צבעים: 5 משתני `--dim-belong/respect/motiv/capable/auto` → 4 משתני `--dim-adjust/friend/emotion/joy` (ערכים ב-`system-10-pulse.html` שורות 16-19)
- כיתות: רשימה של ט-יב → רשימה של **כיתות א׳** של בית הספר בלבד (בפיילוט)
- שאלות: סליידר טקסטואלי → גרירת נוני בין 3 פנים
- שפת התלמיד: **חייב ניקוד מלא**
- אודיו: TTS (אם קיים) → קבצי MP3 אנושיים

### 1.2 עולם נוני (אבני יסוד) — visual identity (כ-30%)

מקור: `c:/Users/meyta/Downloads/impactos/avnei-yesod/underwater-app/`

| קובץ מקור | מה לוקחים |
|---|---|
| `css/noni.css` | סגנון נוני (דמות, צבעים, אנימציות) |
| `css/tokens.css` | משתני עיצוב (צבעים בסיסיים, fonts) |
| `css/ocean.css` | רקע השונית (gradients + bubbles) |
| `css/components.css` | כפתורים, badges, cards |
| תמונות נוני | חיפוש ב-`assets/` או `media/` — נוני (קבוע) + 3 פוזות (שמח/אמצעי/עצוב) |
| הקלטות נוני | אם קיימות — לא חובה, נקליט מחדש |

**אם אין assets:** רישום SVG inline בתוך ה-html (כמו הדמו ב-`system-10-pulse.html` שורות 442-466).

## 2. קבצים חדשים שצריך לכתוב

```
inclusion/
├── pulse-questionnaire.html       ← שאלון תלמיד (יעד עיקרי)
├── pulse-dashboard.html           ← דשבורד 4 פרסונות (role-based)
├── pulse-links.html               ← מחולל קישורים למחנכת
├── pulse-return.html              ← "ענית כבר השבוע" 
├── pulse-config.js                ← קונפיג: 4 מימדים, 8 ניסוחי שאלה, audio paths
├── pulse-data.js                  ← אינטגרציה Google Sheets (קריאה+כתיבה)
├── pulse-pin.js                   ← PIN gate משותף עם 9 המערכות
├── assets/
│   ├── audio/                     ← 40 קבצי mp3 (חיצוני — מועלה ידנית)
│   │   ├── intro.mp3
│   │   ├── outro.mp3
│   │   ├── adjust-v1.mp3 ... adjust-v8.mp3
│   │   ├── friend-v1.mp3 ... friend-v8.mp3
│   │   ├── emotion-v1.mp3 ... emotion-v8.mp3
│   │   └── joy-v1.mp3 ... joy-v8.mp3
│   └── images/
│       └── stickers/              ← ~20 מדבקות נוני לאוסף (אקראי בסיום)
└── _handoff/
    └── pulse-build-agent-prompt.md  ← bootstrap לסוכן הקוד (מוטמע למטה)
```

## 3. סכמת Google Sheets

מסמך חדש: `Pulse · Grade 1 · Pilot 2026-27`

| Tab | עמודות | תפקיד |
|---|---|---|
| `responses` | ts \| school \| class \| sid \| dim \| q_variant_id \| score (1\|2\|3) \| session_id | תשובות גולמיות |
| `aggregates_class` | biweek \| school \| class \| dim \| avg \| response_rate \| red_count \| status \| trend | חישוב אוטומטי דו-שבועי |
| `flags_individual` | biweek \| school \| class \| sid \| dim \| consecutive_low_weeks \| last_action | PIN-gated |
| `actions_log` | ts \| school \| class \| action \| dim \| done | רישום פעולות מורה |
| `audio_files` | dim \| variant_id \| url \| hebrew_niqud \| duration_sec | קונפיג שאלות+אודיו |
| `students_roster` | sid \| school \| class \| name (PIN-gated only) | רשימת תלמידי הפיילוט |

Apps Script: שני triggers — (1) `onFormSubmit` שכותב ל-`responses`, (2) `recompute_aggregates` שרץ פעם ביום ומחשב מ-`responses` ל-`aggregates_class` + `flags_individual`.

## 4. הקלטות אודיו

40 קבצים. אורך ~7 שניות לכל אחד.

| סוג | כמות | תוכן |
|---|---|---|
| פתיח | 1 | "שלום! עזרי לי להבין מה קורה בשונית השבוע!" |
| סיום | 1 | "תודה ששיתפת אותי! קיבלת מדבקה." |
| הסתגלות | 8 ניסוחים | "נוני עוד מחפש איפה לישון..." / "האם נוני מצא את הבית שלו?" / ... |
| חברות | 8 ניסוחים | "עם אילו דגים נוני שוחה השבוע?" / "האם נוני שוחה לבד או עם החבורה?" / ... |
| שפה רגשית | 8 ניסוחים | "איזה רגש מסתובב בשונית?" / "כשנוני היה עצוב — מצא דרך להירגע?" / ... |
| שמחה ללמוד | 8 ניסוחים | "האם נוני רוצה לצלול לחקור?" / "האם היה כיף בשונית היום?" / ... |
| **סה"כ** | **34 + 2 = 36** | (תיקנתי — לא 40. 4 דמיים × 8 ניסוחים = 32 + 2 קצוות = 34) |

**שחקנית:** מי שמדבבת את נוני באבני יסוד. **דורש:** סקריפט סופי עם ניקוד מלא לפני הקלטה.

## 5. סדר בנייה (מתואם לספק §16)

### שלב 1 · Foundation (10 שעות)
- [ ] **1.1** העתקת `pulse-questionnaire.html` של בית הערבה ל-`inclusion/`. הסר את התלות בסקלת 5-טקסטואלית.
- [ ] **1.2** החלפת הצבעים בקובץ — 4 משתני dim חדשים.
- [ ] **1.3** יבוא `noni.css` + `ocean.css` מאבני יסוד. אינטגרציה ל-RTL + נייד.
- [ ] **1.4** בניית רכיב **גרירת נוני** — drag handler על y-axis, time-gate 1.2s, 3 stops עם snap, feedback מיידי על הדמות.
- [ ] **1.5** מנוע אודיו: preload בכניסה, נגן onload, allow re-tap.
- [ ] **1.6** flow של 6 מסכים (פתיח + 4 שאלות + סיום) + progress bar.
- [ ] **1.7** מדבקה רנדומלית בסיום + console.log לאישור שתעובד.
- [ ] **1.8** submit ל-Google Sheet via Apps Script.

### שלב 2 · Content + Dashboards (8 שעות)
- [ ] **2.1** קובץ `pulse-config.js` עם 4 מימדים × 8 ניסוחים = 32 records + ניקוד.
- [ ] **2.2** בניית `pulse-dashboard.html` — בסיס מבית הערבה.
- [ ] **2.3** וריאנט "מחנכת" — Hero פרוזה + 4 פסים + פעולה אחת + מיני-טרנד.
- [ ] **2.4** וריאנט "יועצת" — PIN drill-down לפי `sid`.
- [ ] **2.5** וריאנט "רכזת" — אגרגציה ברמת בי״ס.
- [ ] **2.6** וריאנט "טליה" — ייצוא PDF + אגרגציה רחבית.
- [ ] **2.7** טריגרים פדגוגיים — Apps Script `recompute_aggregates`.
- [ ] **2.8** `pulse-links.html` — מחולל קישורים לכיתות + WhatsApp share.

### שלב 3 · Integration + QA (4 שעות)
- [ ] **3.1** PIN gate משותף — `pulse-pin.js` שיושב על אותו `sessionStorage` כמו 9 המערכות.
- [ ] **3.2** חיבור למערכת 03 (קייס מנג'ר) — כפתור "הוסף לסל מענים" עם `?sid=`.
- [ ] **3.3** דחיפת KPI למערכת 08 (מטה-דשבורד).
- [ ] **3.4** WhatsApp reminder — Apps Script `onMonday7am`.
- [ ] **3.5** אזהרת תוקף — popup ב-onboarding מורה + footer בייצוא PDF.
- [ ] **3.6** QA mobile RTL (Chrome + Safari).
- [ ] **3.7** בדיקת אבטחה: PIN gate, role-based access, anon role separation.

## 6. שאלות פתוחות לפני התחלה

1. **שחקנית נוני** — מי, ומתי אפשר לקבוע הקלטה?
2. **Assets נוני** — איפה תמונות + 3 פוזות (שמח/אמצעי/עצוב)? אם אין, לעצב חדש?
3. **בית ספר פיילוט ראשון** — איזה? כמה כיתות א׳? כמה ילדים?
4. **Google Sheets בעלות** — חשבון מי? מנח״י או אימפקט.OS?
5. **PIN gate משותף** — איפה ה-PIN של 9 המערכות הקיימות יושב?
6. **אישור שמות תוכניות** — האם שפ״ח/שפ״י מאשרים שימוש בשמות "גיבור א׳" + "הכ״חות שבדרך"?

## 7. סיכום מצב

- ✅ Spec מאושר עקרונית (4 מימדים, NUNI, 3 פנים, מזוהה, דו-שבועי)
- ✅ HTML מצגת ניתן לשליחה לטליה (`system-10-pulse.html`)
- ⏳ ממתין לאישור התחלת בנייה
- ⏳ ממתין לתשובות לשאלות §6 (חלקן יכולות להתחיל במקביל)

---

# Bootstrap לסוכן קוד · Claude Code

> **למיטל:** העתיקי את כל מה שמתחת לקו `===` כפרומפט פתיחה לסשן Claude Code חדש בתיקיית `c:/Users/meyta/Downloads/impactos/`.
>
> **לפני הפעלה:** ודא שהקובץ `inclusion/system-10-pulse-spec.md` קיים ומעודכן (v3).

===

## משימה: בניית מערכת 10 — פולס לכיתה א׳ (שלב 1 · Foundation)

אתה סוכן קוד שבונה מערכת חדשה בתיקיית `inclusion/`. אסור לערוך מערכות 01-09 הקיימות. רק לקרוא אותן.

### הקשר
"תוכנית החומש להכלה" = הצעה למנח״י (ירושלים) ל-9 מערכות דיגיטליות לתוכנית הכלה בית-ספרית. מערכת 10 = פולס שבועיים-חודשי לכיתה א׳ בעולם נוני.

### קבצי מקור — חובה לקרוא לפני עבודה

1. **Spec:** [`inclusion/system-10-pulse-spec.md`](inclusion/system-10-pulse-spec.md) — המקור המלא.
2. **מצגת:** [`inclusion/system-10-pulse.html`](inclusion/system-10-pulse.html) — דוגמה ל-UI הסופי.
3. **תוכנית בנייה:** [`inclusion/pulse-build-plan.md`](inclusion/pulse-build-plan.md) — הקובץ הזה.
4. **9 המערכות הקיימות:** `inclusion/proposal.html` — להבנת הקונטקסט.
5. **NUNI assets:** `avnei-yesod/underwater-app/css/{noni,tokens,ocean,components}.css`.
6. **Memory:**
   - [`feedback-avnei-yesod-niqud-on-student-screens`](memory/feedback-avnei-yesod-niqud-on-student-screens.md) — ניקוד חובה בכל מסך תלמיד.
   - [`feedback-avnei-yesod-teacher-language-simplicity`](memory/feedback-avnei-yesod-teacher-language-simplicity.md) — שפת מורה = שורה תחתונה.
   - [`project-inclusion-pulse-grade1-only`](memory/project-inclusion-pulse-grade1-only.md) — context גלובלי.

### מטרת השלב הזה (שלב 1 · Foundation)

לבנות את **שלד השאלון לתלמיד.ה** + flow קצה-לקצה לכיתה א׳ אחת. **לא** דשבורד, **לא** אינטגרציות. רק:

1. `inclusion/pulse-questionnaire.html` — שאלון 6 מסכים (פתיח + 4 שאלות + סיום).
2. `inclusion/pulse-config.js` — קונפיג של 4 מימדים × 1 ניסוח שאלה בלבד לבדיקה (8 ניסוחים ב-Phase 2).
3. Inline SVG של נוני (3 פוזות) — אם אין assets קיימים.
4. גרירת נוני בין 3 פנים — drag handler על y, time-gate 1.2s, snap ל-3 stops.
5. ניקוד מלא בכל טקסט שילד.ה רואה.
6. רכיב אודיו דמה — `console.log("playing: " + audio_url)` במקום נגן אמיתי (אודיו אמיתי = Phase 2).
7. מדבקה רנדומלית בסיום.
8. submit ל-localStorage לבדיקה (Google Sheets = Phase 2).

### החלטות לא לפתוח מחדש

- 4 מימדים (לא 5): הסתגלות, חברות, שפה רגשית, שמחה ללמוד.
- 3 פנים (לא סליידר 5): 😊 / 😐 / 😞.
- גרירה (לא לחיצה).
- ניקוד מלא (חובה).
- מזוהה (לא אנונימי) — בPhase זה: hard-coded `sid=test-001`.
- עולם נוני (לא עולם חדש).

### Acceptance Criteria — שלב 1

- [ ] `inclusion/pulse-questionnaire.html` פותח 6 מסכים ברצף.
- [ ] גרירת נוני עובדת על desktop + mobile (RTL).
- [ ] time-gate 1.2s מונע tap-through.
- [ ] כל טקסט מנוקד מלא.
- [ ] בסיום, התשובות נשמרות ב-`localStorage['pulse-test-responses']` כ-JSON.
- [ ] מדבקה רנדומלית מ-5 דוגמאות (text או emoji לבדיקה).
- [ ] עובד ב-Chrome desktop + iOS Safari.

### אסור לך

- ❌ לערוך קבצים מחוץ ל-`inclusion/`.
- ❌ Google Sheets integration — Phase 2.
- ❌ Dashboards — Phase 2.
- ❌ אודיו אמיתי — Phase 2 (רק console.log).
- ❌ AI / TTS — שום שירות חיצוני.
- ❌ ז'רגון פסיכולוגי (BKT, EPA, sub-BKT) — לא רלוונטי כאן.
- ❌ ניקוד במסכי מורה — Phase 2 ממילא.
- ❌ commit/push — לעצור אחרי build, לדווח, לחכות לאישור.

### דיווח סיום

חזור עם:
1. רשימת קבצים שנכתבו (path מלא).
2. screenshot של מסך 1 (פתיח) ומסך 3 (תחנת חברות).
3. רשימת acceptance criteria + ✅/❌ לכל אחד.
4. כל שאלה פתוחה שעלתה.
5. **בלי commit. בלי push.**

### בספק

שאלי את מיטל. במיוחד אם:
- צריך asset של נוני שאינו ב-css הקיים.
- ההחלטה על "1.2s time-gate" מתנגשת עם UX accessibility.
- מצאת copy חסר ב-spec (לדוגמה, ניסוח שאלה שלא הוגדר).

---

*בנייה בטוחה. סוכן אחר ידחוף ל-git אחרי אישור.*
