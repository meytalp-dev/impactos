# B.7 — Targeted Reading Interventions
## Spec רשמי · 28.5.2026 · שלב א' (לפני קוד)

> **מה זה המסמך:** spec שמוביל את בניית B.7 — 5 scripts פדגוגיים שמורה מקבלת כשהמערכת מזהה דפוס שגיאה בקבוצה של 3-4 ילדות. **התערבות פדגוגית-אנושית בכיתה**, לא תרגול דיגיטלי. מבוסס Tier-2 evidence-based (IES Foorman 2016 · Rosenshine 2012 · Wanzek 2003).
>
> **למה צריך:** F.21A מציע "פתחי קבוצת תמיכה" כשמתגלה דפוס EPA — **אבל אין מה לפתוח**. B.7 מספק את ה-scripts. בלי B.7, F.21A מציע אינטרבנציה גנרית.
>
> **תלויות שנסגרו:** A.3 (EPA) ✓ · A.4 (Sub-BKT 22 אותיות) ✓ · F.21A ✓ — כולן ב-origin.

---

## §1 — הקשר: איפה B.7 יושב

| שאלה | תשובה |
|---|---|
| מי קורא ל-B.7? | המורה — כשהיא לוחצת ב-`teacher-rama.html` על "פתחי קבוצת תמיכה" |
| מי הקבוצה? | 3-4 תלמידות עם **דפוס שגיאה דומה** (מזוהה אוטומטית מ-EPA או sub-BKT) |
| מתי? | בכיתה — לאחר שהילדות תרגלו, מורה מזהה דפוס, אוספת 3-4, יושבת איתן בפינה |
| כמה זמן? | **10-15 דק' × 4-5 ימים שבועיים** (Tier-2 evidence-based, IES Foorman 2016) |
| מה היא רואה? | Modal עם preview של ה-script + כפתור "📥 הורד PDF" להדפסה |

**עקרון מנחה:** B.7 הוא **Tier 2 RTI** — לא תוסף, התערבות אמיתית.

---

## §2 — 5 ההחלטות שנסגרו (מבוססות מחקר B.7 28.5)

| # | פריט | תשובה | מקור / נימוק |
|---|---|---|---|
| 1 | 5 הדפוסים | **Phonological / Letter Knowledge / Decoding / Fluency / Letter-cluster** | IES Foorman 2016 + NRP 2000 (במקום הצעה מקורית של Shape/Sound/Context — sub-cases של Decoding) |
| 2 | גודל קבוצה | **3-4 ילדות** | Vaughn et al. 2003 (3 ≈ 1:1) · Elbaum 2000 meta-analysis · IES "3-5 students" |
| 3 | משך | **10-15 דק' × 4-5 ימים בשבוע** = 40-60 דק' שבועיים | פשרה מאומתת בין הסטנדרט (20-40 דק') לבין המציאות הכיתתית. **לא 7 דק' חד-פעמי** — אין לזה בסיס מחקרי. |
| 4 | מבנה script | **5 שלבים: Hook → Model (I do) → Guided (We do) → Independent (You do) → Success Check** | Rosenshine 2012 + Gersten 2009 IES + Pearson & Gallagher 1983 (I do/We do/You do) |
| 5 | פורמט תצוגה | **Hybrid — Preview Modal ב-teacher-rama + כפתור "📥 הורד PDF"** | Riverside [verified] + סיכון מוכר "מורה buried in tablet" |

---

## §3 — 5 הדפוסים המעודכנים

### 1. **Phonological Awareness** (חדש!)
- **מה:** קושי ב-blending / segmenting / deletion של פונמות
- **EPA trigger:** `failure='Sound'` + `attempts_count >= 10` + `error_rate >= 30%`
- **קהל יעד:** ילדות שמתקשות ב"מה השמיע ל-בּ?" / "תגידי שמ-ש ש-בלי ש-"
- **למה זה חשוב:** פונולוגיה = יסוד לקריאה. NRP 2000 — predictor #1.

### 2. **Letter Knowledge** (Shape + Sound במאוחד)
- **מה:** בלבול חזותי (מ↔ם) או קולי (ב↔פ) בין אותיות
- **EPA trigger:** confusion matrix של 2+ אותיות עם sub-BKT < 0.40
- **קהל יעד:** ילדות שמחליפות אותיות דומות
- **למה זה חשוב:** IES Foorman recommendation #2 — letter knowledge קודם

### 3. **Decoding by Context** (Context axis)
- **מה:** קושי בזיהוי אות **במיקום ספציפי** במילה (initial/medial/final)
- **EPA trigger:** `context_pattern >= 65%` (לפי `getDominantPattern(student, 'context')`)
- **קהל יעד:** ילדות שיודעות אות בנפרד אבל לא במילה
- **למה זה חשוב:** מעבר מ-"לזהות אות" ל"לקרוא מילה" — Triplex Phase 1

### 4. **Fluency** (= Velocity, אבל יותר רחב)
- **מה:** קצב נמוך + intonation שטוחה
- **Trigger:** `median(response_time_ms) > P75_class` + accuracy >= 70%
- **קהל יעד:** ילדות שיודעות אבל איטיות
- **למה זה חשוב:** רף ראמ"ה במשימות 5-8 כולל זמן. שטף = יעד משה"ח תשפ"ו

### 5. **Letter-cluster Weakness** (sub-BKT)
- **מה:** 3+ אותיות עם sub-BKT < 0.40
- **Trigger:** `getLetterMasteryDistribution()` → 3+ אותיות במצב cold/fail
- **קהל יעד:** ילדות עם פערים נקודתיים
- **למה זה חשוב:** ליבת Tier-2 ב-IES + Reading Mastery

---

## §4 — מבנה ה-script (5 שלבים, מאומת Rosenshine 2012)

כל אינטרבנציה היא **מסמך 1 עמוד** עם המבנה:

```
┌────────────────────────────────────────────────────────────┐
│ 📋 [שם האינטרבנציה]                                          │
│ זמן: 10-15 דק' · קבוצה: 3-4 ילדות                          │
│ דפוס מזוהה: [Phonological / Letter Knowledge / ...]         │
│                                                              │
│ 🎯 מטרה: [משפט אחד]                                          │
│ 📦 חומרים: [רשימה]                                           │
│                                                              │
│ ──────────────────────────────────────────────              │
│                                                              │
│ 1. HOOK (1 דק') — חימום                                     │
│    "[משפט פתיחה לילדות]"                                    │
│    [פעולה: מה המורה עושה]                                   │
│                                                              │
│ 2. MODEL — "I DO" (3 דק') — המורה מדגימה                    │
│    "[המורה אומרת:] ..."                                     │
│    [פעולה: דוגמה ברורה]                                     │
│                                                              │
│ 3. GUIDED — "WE DO" (4 דק') — תרגול ביחד                    │
│    [3-4 דוגמאות בליווי]                                     │
│    "אם תלמידה טועה — חזרי על Model"                         │
│                                                              │
│ 4. INDEPENDENT — "YOU DO" (4 דק') — תרגול עצמאי              │
│    [5 פריטים — כל ילדה לבד עם הכרטיסיות]                    │
│                                                              │
│ 5. SUCCESS CHECK (1 דק') — מדידה                            │
│    "[קריטריון מדיד: כמה זיהו נכון מתוך 5?]"                 │
│    אם 4/5+ → רישום ✓ ב-teacher-rama                         │
│    אם פחות → לחזור עוד פעם השבוע                            │
│                                                              │
│ ──────────────────────────────────────────────              │
│ 📊 תזכורת: 4-5 ימים השבוע. רישום ב-teacher-rama.            │
└────────────────────────────────────────────────────────────┘
```

---

## §5 — תוכן 5 ה-scripts (templates)

### 5.1 — Phonological Awareness

```
🎯 מטרה: ילדות מצליחות לפרק מילה לפונמות (segmenting) + להרכיב מפונמות למילה (blending)
📦 חומרים: 10 כרטיסי תמונה (מילים פשוטות: שֶׁמֶש, סוּס, כֶּלֶב, אַרְיֵה, אוֹר, ...)

1. HOOK: "בנות, מה אם נגיד מילה רק בקולות? נשמע ש-ֶ-מ-ֶ-ש... ניחשו מה זה?"
2. MODEL: המורה אומרת "אומרים שֶׁמֶש. אבל אם אני מפרקת — ש... ֶ... מ... ֶ... ש. שמעתן? ארבעה צלילים."
3. GUIDED: 3 מילים יחד — סוּס, אוֹר, יָד. כל אחת מהילדות אומרת את הפונמות.
4. INDEPENDENT: 5 כרטיסי תמונה. כל אחת מקבלת — אומרת את הפונמות בקול.
5. CHECK: 4/5 צלילים נכון = ✓. פחות = חזרה השבוע.
```

### 5.2 — Letter Knowledge (Shape+Sound)

```
🎯 מטרה: הבחנה ויזואלית + קולית בין שתי אותיות מתבלבלות (לדוגמה מ↔ם)
📦 חומרים: כרטיסיות עם מ ועם ם, מילים שבהן 2 האותיות

1. HOOK: "בנות, יש שתי אותיות שמתבלבלות. בואו נראה. הציצו — מ ו-ם. רואות הבדל?"
2. MODEL: "מ פותחת למטה — אֵם, מַיִם. ם סגורה — תָּמִיד באה בסוף — לֶחֶם, יָם."
3. GUIDED: 4 מילים יחד. כל אחת קולעת — איפה מ, איפה ם?
4. INDEPENDENT: 5 מילים על כרטיסיות. כל אחת מסמנת מ-ם.
5. CHECK: 4/5 נכון = ✓.
```

### 5.3 — Decoding by Context

```
🎯 מטרה: זיהוי אות במיקום [initial/medial/final] בתוך מילה
📦 חומרים: 6 מילים שבהן האות הקשה מופיעה במיקום שונה

1. HOOK: "ילדה אחרת רואה את האות מ בתחילת המילה — מה קל לה. אבל כשהיא באמצע — קשה. נראה אם נצליח."
2. MODEL: "המילה כֶּלֶב. ל באמצע. שמעתן — כֶּ... ל... ֶב? ל באמצע."
3. GUIDED: 3 מילים — כל אחת מסמנת איפה האות (תחילה/אמצע/סוף).
4. INDEPENDENT: 5 מילים. כל אחת לבד.
5. CHECK: 4/5 נכון = ✓.
```

### 5.4 — Fluency

```
🎯 מטרה: זרימה — קריאה רצופה בלי עצירה בין אותיות/מילים
📦 חומרים: רשימת 10 מילים מוכרות לכל ילדה, סטופר

1. HOOK: "בנות, היום נראה מי קוראת מהר וברור — לא צריך לרוץ, רק לזרום."
2. MODEL: המורה קוראת 5 מילים בקצב טבעי. "שמעתן? בלי לעצור."
3. GUIDED: כל אחת קוראת 3 מילים יחד עם המורה.
4. INDEPENDENT: כל אחת קוראת 10 מילים לבד. המורה מודדת זמן.
5. CHECK: יעד = ≤ 25 שניות ל-10 מילים. רושמת בטבלה.
```

### 5.5 — Letter-cluster

```
🎯 מטרה: חיזוק 3 אותיות ספציפיות חלשות (פר ילדה — מותאם!)
📦 חומרים: כרטיסיות פר אות + 5 מילים פר אות

1. HOOK: "אנחנו הולכות לחזור על 3 אותיות שעוד לא הספקנו. מי זוכרת — [3 האותיות]?"
2. MODEL: לכל אות — המורה אומרת + מצביעה + נותנת מילה. "ר — רֹאשׁ — רגל — רֵיחַ."
3. GUIDED: כל ילדה אומרת את האות + מילה איתה.
4. INDEPENDENT: כרטיסיות מעורבבות. כל אחת מזהה.
5. CHECK: 4/5 זיהויים נכונים = ✓.
```

> **⚠️ הערה ל-5.5:** האותיות הספציפיות **משתנות פר ילדה** — סוכן הקוד צריך להזריק אותן אוטומטית מ-`getLetterMasteryDistribution()`.

---

## §6 — UI Integration

### 6.1 — Trigger מ-F.21A

ב-`teacher-rama.html` Class View — כשמתגלה דפוס שמשפיע על 3+ ילדות:

```
┌──────────────────────────────────────────────────────────┐
│ 🟡 דפוס Letter Knowledge — 3 ילדות (מאיה, נועה, רותם)    │
│    מבלבלות מ↔ם · רמת ביטחון: גבוהה                       │
│    [📋 פתחי קבוצת תמיכה]                                  │
└──────────────────────────────────────────────────────────┘
```

### 6.2 — Modal Preview

לחיצה → modal עם preview של ה-script + כפתורים:

```
┌──────────────────────────────────────────────────────────┐
│ × [סגירה]                                                 │
│                                                            │
│ 📋 Letter Knowledge — מ↔ם                                 │
│ 3 ילדות · 12 דק' · יעד: 4 ימים השבוע                      │
│                                                            │
│ [Preview של ה-5 שלבים — scrollable]                       │
│                                                            │
│ ──────────────────────────────────────────              │
│ [📥 הורד PDF להדפסה]  [💾 שמרי לתיעוד]                    │
│ [✓ סמני שביצעתי היום]                                     │
└──────────────────────────────────────────────────────────┘
```

### 6.3 — תיעוד ביצוע

לחיצה "✓ סמני שביצעתי" → שורה ב-`state.interventions`:

```js
state.interventions[studentId] = [
  {
    date: 1738368000000,
    pattern: 'letter_knowledge',
    pattern_details: { confused_pair: ['מ', 'ם'] },
    group_size: 3,
    duration_minutes: 12,
    success_check: '4/5',
    teacher_note: 'נועה התקדמה'
  }
];
```

---

## §7 — Acceptance Criteria

- [ ] `js/shared/interventions.js` — API עם 5 functions
- [ ] `interventions/` תיקייה — 5 JSON files (אחד פר דפוס)
- [ ] 5 ה-scripts מומשים לפי §5 (template + content)
- [ ] EPA + sub-BKT triggers עובדים — F.21A מזהה דפוס ומציע
- [ ] Modal preview ב-teacher-rama Class View
- [ ] PDF export עובד (jsPDF או בדומה)
- [ ] חתימת PDF בעברית קריאה (RTL)
- [ ] תיעוד ב-`state.interventions` — קריא, ניתן לחיתוך פר תלמידה
- [ ] integration עם B.8 (Intervention matcher) — ראה §9
- [ ] בדיקה ידנית: 3 דפוסים (Letter Knowledge / Fluency / Letter-cluster) — preview + PDF + sav

---

## §8 — מה לא בסקופ

| משימה | למה לא | תלות |
|---|---|---|
| B.8 — Intervention matcher | משימה נפרדת — מי לקבוצה איתה. נסגר אחרי B.7. | B.8 |
| B.9 — Group Suggestion Engine | אינטליגנציה רחבה יותר | B.9 |
| תוכן מלא של 5 scripts (פדגוגית עמוקה) | מיטל / צוות פדגוגי כותבים | מיטל |
| AI-generated scripts | החלטה: scripts ידניים | post-pilot |
| Audio recording של הוראות | post-pilot | post-pilot |

---

## §9 — תלויות + סדר עבודה

**תלויות:** A.3 (EPA) ✓ · A.4 (Sub-BKT) ✓ · F.21A ✓ — כולן ב-origin.

**סדר ביצוע מומלץ לסוכן 9:**
1. `interventions/` infrastructure (5 JSON files מ-§5 templates)
2. `js/shared/interventions.js` API
3. Trigger detection — חיבור ל-EPA / getLetterMasteryDistribution
4. Modal ב-teacher-rama Class View
5. PDF export (jsPDF + עברית RTL)
6. תיעוד `state.interventions`
7. בדיקה ידנית — 3 דפוסים

**אומדן:** 8-12 שעות (סוכן אחד)

---

## §10 — מקורות מאומתים (מ-B.7 research 28.5)

- **IES Practice Guide:** Foundational Skills to Support Reading Through Grade 3 (Foorman et al. 2016)
- **NRP 2000:** National Reading Panel — Targeted Interventions
- **Rosenshine 2012:** Principles of Instruction
- **Pearson & Gallagher 1983:** I do / We do / You do framework
- **Vaughn et al. 2003:** Group size in Tier-2 interventions
- **Elbaum 2000:** Meta-analysis — small group ≈ 1:1
- **Gersten et al. 2009 IES:** Assisting Students Struggling with Reading
- **קולן (משה"ח תשפ"ו):** Mafmar עברית · 4 פרופילי כניסה · `moe-curriculum-tashpav-2026.json:20`

**🟡 אזהרה:** 4 פרופילי הכניסה של קולן — מקור מאומת רק חלקית (השם והאישיות ב-משה"ח, אבל המסמך הספציפי של 4 הפרופילים דורש אימות נוסף).

---

*— סוף spec. סוכן 9 יבנה לפי המסמך הזה. שאלות → מיטל.*

**גרסה:** 1.0 · **כתב:** סוכן תזמורת (Claude Opus 4.7) · **תאריך:** 28.5.2026 · **אישרה:** מיטל (5 החלטות + מחקר B.7 מאומת מ-8 מקורות)
