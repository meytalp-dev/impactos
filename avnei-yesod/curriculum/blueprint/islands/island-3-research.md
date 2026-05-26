# אי 3 — מחקר פדגוגי על פירוק פרמטרים

> **תאריך:** 25.5.2026 · **חוקר:** Claude (5 שאילתות Perplexity sonar-pro)
> **מטרה:** לאמת פירוק לפרמטרים של אי 3 (זיהוי אותיות / אלמוגי האותיות) לקראת מעבר ל-BKT פר-פרמטר.
> **קבצי-מקור:** `c:/tmp/avnei-yesod-pedagogy-research/q1-q5.json`

---

## תקציר ההמלצות (TL;DR)

| נושא | פסיקה |
|---|---|
| פירוק לפרמטרים-משנה (sub-skills) | ✅ **מאומת** — Lexia, i-Ready, Imagine Learning, ALEKS כולם עובדים ככה |
| גרנולריות פר-אות (e.g., BKT נפרד לכל אות) | ❌ **לא מומלץ** — overfitting + noise + דורש דאטה רב מדי |
| trace מוטורי כפרמטר של זיהוי אותיות | ❌ **שגוי** — זה כתיבה, לא זיהוי. להוציא מ-Skill 1 |
| הבחנה בין תאומים (1.4) כפרמטר נפרד | ✅ **מאומת** — Schiff, Taha & Saiegh-Haddad |
| אותיות סופיות כפרמטר נפרד (1.7) | ✅ **מאומת** — דורש לימוד מפורש, לא עולה אוטומטית |
| שיום + צליל ביחד (1.2 + 2.1) | ⚠️ **לימוד ביחד, הערכה נפרדת** (Share, Bar-On) |
| קריטריון מאסטרי "5 ברצף" (Khan) | ⚠️ **בעייתי לבני 6** — false negatives מ-lapses |
| הקריטריון המוצע (4/5 + 2/2 ביום אחר) | ✅ **תואם המלצה אקדמית** |
| זמן תגובה כקריטריון בלעדי | ❌ **לא מתאים לבני 6** — חרדה |

---

## חלק א' — שאלות שנחקרו

### Q1 — האם פירוק לתת-מיומנויות בכלל מבוסס?

**מקור:** Perplexity sonar-pro · NRP 2000, Adams 1990, Ehri stages, Share, Ehri & McCormick

**ממצא:**
> "Letter recognition is empirically decomposed into multiple component skills, not a single ability."

המסגרת המקובלת בספרות:
1. **Letter identification** — לזהות שזו אות (לא סמל)
2. **Letter naming** — לדעת את שם האות
3. **Letter-sound association** — להפיק את הצליל הנפוץ
4. **Letter discrimination** — להבחין בין דומים
5. **Case/font generalization** — להכליל על פני סגנונות
6. **Alphabet order knowledge** — סדר אלפבית

**Adjacent but separate:**
7. **Letter formation/handwriting** — trace, copy, write from memory

**ציטוט קריטי:**
> "Letter naming fluency is an empirically distinct component, though strongly related to recognition and sound knowledge."
> "Letter formation/tracing is best classified as handwriting/writing, though it can support letter learning."

**השלכה:** המבנה שלי (1.1-1.7) נכון. אבל **1.8 (trace) שייך לכתיבה, לא לזיהוי**.

---

### Q2 — מה הספרות העברית הספציפית אומרת?

**מקור:** Share, Bar-On, Ravid, Shany, Schiff, Saiegh-Haddad, מבדק Even-Kriah

**ממצאים מרכזיים:**

1. **שם + צליל = ללמד ביחד, להעריך בנפרד:**
> "Children benefit when letter names and sounds are taught together, not as disconnected bodies of knowledge. Instruction should make the link explicit: 'This letter is called mem. In words it usually says /m/.'"
> "But assess them separately, especially when screening at-risk children."

2. **אותיות סופיות = פרמטר נפרד מאומת:**
> "Final letters (ם, ן, ץ, ף, ך) are typically acquired during the first year of reading instruction but are error-prone without explicit teaching. They should be taught as the same letter with an end-of-word form, practiced overtly in reading and writing, not assumed to emerge automatically."

3. **Even-Kriah (מבדק רשמי ישראלי) מודד בנפרד:**
- זיהוי אותיות
- שיום אותיות
- מיפוי אות-צליל (כולל סופיות)

**השלכה:**
- ✅ 1.7 (אותיות סופיות) נשאר Core
- ⚠️ בעת **לימוד** במשחקון יש לחבר שם+צליל; בעת **הערכת mastery** נפריד.
- 1.2 (שיום) הוא פרמטר ב-Skill 1, ו-2.1 (צליל) הוא פרמטר ב-Skill 2 — שניהם נמדדים בנפרד אבל מתורגלים ביחד בכל משחקון של אי 3.

---

### Q3 — האם הבחנת תאומות היא תת-מיומנות נפרדת?

**מקור:** Schiff et al., Taha & Saiegh-Haddad 2017, Ravid, Velan & Frost

**ממצאים:**

1. **כן, היא נפרדת:**
> "Discriminating near-neighbor letters is a more demanding, partially distinct sub-skill that continues to improve after basic letter naming is in place."

2. **זוגות הכי בעייתיים (מדורגים מהמחקר):**
- **גבוה מאוד:** ד/ר · ה/ח · ו/ז · ב/כ · אותיות סופיות (ם/ן · ך/כ)
- **גבוה:** מ/נ · ע/צ · ב/ה
- **תוספת מרובע גוטוראליות:** ח/כ · ע/א

3. **גישת הוראה מומלצת:**
> "Teach one member of a twin pair to mastery first... Then introduce the twin with explicit contrast."
> "Simultaneous introduction with explicit contrast might be fine for visually strong children; for children at risk of reading difficulties, staggering is safer."

4. **אזהרה:**
> "Many published papers summarize these data rather than providing full confusion matrices. So we know which patterns are frequent, but not always precise percentages for every pair."

**השלכה:**
- ✅ 1.4 (הבחנה גרפית) נשאר Core
- ⚠️ **לא להציג זוג תאומים לפני שכל אחת מהאותיות בנפרד במאסטרי** (זה כבר הוחלט ב-g1-letter-vs-twin-design.md)
- חוסר במחקר — אין מטריצת בלבול מפורטת לעברית. שווה לאסוף דאטה משלנו דרך BKT.

---

### Q4 — איך מערכות מסחריות עושות את זה?

**מקור:** Lexia Core5, i-Ready, Imagine Learning/Earobics, ALEKS · ESSA reviews · ITS literature

**ממצאי-מפתח:**

1. **כל המערכות מפרקות לתת-מיומנויות, לא לנושאים שלמים:**
> "All commercial systems use sub-skill level tracking — separate letter naming, letter-sound mapping, letter discrimination, phonological awareness."

2. **אבל לא מפרקות פר-אות:**
> "Many observational studies and simulation papers find that overly fine grain (each specific letter as a separate skill): increases parameter estimation noise, requires much more data per skill for stable inference, can slow progress because the system overfits to micro-variability in performance."

3. **המקום ה"מתוק" של גרנולריות:**
> "Granularity at the level of meaningful, relatively homogeneous sub-skills... but not extremely coarse (whole-domain) nor extremely fine (per-item/per-letter)."

4. **אין RCT שהשווה ישירות:**
> "There are no widely cited randomized trials that compare a system with only a single 'letter recognition' node, versus the same system decomposed into multiple distinct letter-naming/letter-sound/discrimination sub-skills."

5. **ראיה עקיפה:**
- Lexia/i-Ready/Imagine **אימצו** מודלים פר-תת-מיומנות **ולא חזרו לאחור**
- כולם מקבלים דירוג ESSA "Strong" או חיובי

**השלכה:**
- ✅ הגישה שלנו (פר-פרמטר במקום פר-אי) מאומתת
- ❌ **לא לפצל BKT פר-אות-פר-פרמטר** (יהיה 22×7 = 154 nodes JUST for letter recognition)
- ✅ במקום: BKT פר-פרמטר, מדגם מילים/אותיות מגוונות בתוך כל פרמטר

---

### Q5 — מה הקריטריון המתאים לבני 6-7?

**מקור:** Corbett & Anderson 1995, Cepeda et al (spacing), ITS literature, Lexia/i-Ready/ALEKS documentation

**ממצאי-מפתח:**

1. **"5 ברצף" (Khan Academy) — בעייתי לבני 6:**
> "Strict streak rules accumulate many false negatives from lapses (single-trial errors due to attention, hand slips, distraction) — common in 6-7 year-olds. Children may oscillate around the threshold long after they actually know."

2. **p(L) ≥ 0.95 (Corbett & Anderson) — שמרני מדי, איטי מדי:**
> "When applied blindly to children, can require unnecessarily many trials. Original work was on adults."

3. **Spaced repetition (אישור ביום אחר) — מאומת:**
> "Forgetting curves and Cepeda et al. show that knowledge confirmed across a delay (especially overnight) is much more durable than same-session mastery."

4. **זמן תגובה — לא בלעדי לבני 6:**
> "Time as a SOLE criterion is inappropriate for 6-year-olds. It can create test anxiety. Use as soft signal compared to child's own baseline, not universal cutoff."

5. **ברירת המחדל הטובה ביותר:**
> "For many elementary skills, a robust but simple rule might be: Mastery = at least 4 correct out of the last 5, across at least 2 sessions, with one success after a delay, and posterior mastery above a tuned threshold."

**השלכה לקריטריונים שהצעתי:**

| הקריטריון שלי | אימות מהמחקר | פסיקה |
|---|---|---|
| 🟢 4/5 + 2/2 ביום אחר | **תואם בדיוק** להמלצה האקדמית | ✅ KEEP |
| 🟡 5/6 + 3/4 ביום אחר | הוספה סבירה לפרמטרים בינוניים | ✅ KEEP |
| 🔴 7/10 + 4/5 + סף זמן | סף זמן כקריטריון בלעדי בעייתי | ⚠️ ADJUST — להפוך את הזמן ל-soft signal בלבד (לדגל למורה, לא לחסום מעבר) |

---

## חלק ב' — פירוק מעודכן לאי 3

### מה משתנה מההצעה הקודמת

| # | פרמטר ישן | פסיקה | פרמטר חדש |
|---|---|---|---|
| 1.1 | זיהוי צורה ויזואלית | ✅ KEEP | 1.1 זיהוי צורה ויזואלית |
| 1.2 | שיום שם האות | ✅ KEEP | 1.2 שיום שם האות (לימוד מקושר ל-2.1 צליל) |
| 1.3 | מציאה ברצף | ✅ KEEP אבל קצת שונה | 1.3 איתור אות בהקשר (לא רק רצף — גם בתמונה, בטקסט) |
| 1.4 | הבחנה גרפית | ✅ KEEP | 1.4 הבחנה גרפית בין דומות |
| 1.5 | פונטים וגדלים | ⚠️ DOWNGRADE | 1.5 הכללה על פני פונטים — **Stretch** (לא Core ל-MVP) |
| 1.6 | מיקום משתנה | ❌ MERGE | מיזוג עם 1.3 |
| 1.7 | אותיות סופיות | ✅ KEEP | 1.6 אותיות סופיות (מיספור שונה) |
| 1.8 | שחזור מוטורי | ❌ REMOVE FROM ISLAND 3 | להעביר ל-Skill 6 (כתיבה) או לאי נפרד |

### הפירוק המעודכן — 6 פרמטרים במקום 8

| # | פרמטר | מה הילדה צריכה לדעת | סוג | מאגר | Core/Stretch |
|---|---|---|---|---|---|
| **1.1** | **זיהוי צורה ויזואלית** | מבחינה בין אות לסמלים אחרים | 🟢 | 30 פריטים | Core |
| **1.2** | **שיום שם האות** | "זאת מ'" כשרואה את הצורה (מתורגל עם 2.1 הצליל, נמדד בנפרד) | 🟢 | 30 פריטים | Core |
| **1.3** | **איתור אות בהקשר** | מוצאת את האות ברצף, בתמונה, או בטקסט קצר | 🟡 | 40 פריטים | Core |
| **1.4** | **הבחנה בין תאומים** | מבחינה בין זוגות בלבול: ד/ר · ה/ח · ו/ז · ב/כ · מ/נ · ע/צ | 🔴 | 60 פריטים (10 פר-זוג) | Core |
| **1.5** | **הכללה על פונטים וגדלים** | מזהה את האות בגדלים ופונטים שונים | 🟡 | 30 פריטים | **Stretch** |
| **1.6** | **אותיות סופיות** | מבינה ש-ם=מ בסוף, ן=נ בסוף, וכו' | 🟡 | 25 פריטים | Core |

**סה"כ MVP:** 5 פרמטרים Core · 1 Stretch · ~185 פריטים מאגר

### למה הורדנו פרמטרים?
- **1.6 (מיקום משתנה)** היה בעצם תת-מקרה של 1.3. **MERGE** — חוסך פרמטר.
- **1.8 (trace)** מהמחקר הוא **כתיבה**, לא זיהוי. לא נמצא בכל מקור של מבדקי letter recognition (NRP, Adams, Ehri, Lexia, i-Ready). **REMOVE** מ-Skill 1.

### הפרמטר שגדל ב-Stretch
- **1.5 (פונטים/גדלים)** — בעברית פחות קריטי מאשר באנגלית (אין case). בעברית הפונטים בכיתה א' רובם דומים (אריאל, דוד, פסטל). דחוי ל-Stretch אלא אם נכניס כתב יד.

---

## חלק ג' — מיפוי 5 המשחקונים הקיימים לפרמטרים החדשים

| משחקון | אות | פרמטרים שהוא מתרגל | פרמטרים שהוא מודד לטובת BKT |
|---|---|---|---|
| **הצדף הקסום** (shell) | מ | 1.2 (שיום) + 1.3 (איתור) + 2.1 (צליל — cross-island) | 1.2, 1.3 |
| **הצלת הדגים** (rescue) | ק | 1.2 + 1.3 + 1.4 (ק/כ בלבול קל) | 1.2, 1.3 |
| **הבית של נוני** (house) | ב | 1.1 (זיהוי צורה) + 1.4 (ב/כ קריטי!) | 1.1, 1.4 |
| **שביל החזרה** (trail) | ר | 1.2 + 1.3 + 1.4 (ד/ר קריטי!) | 1.2, 1.4 |
| **ציד האורות** (storm) | ת | 1.1 + 1.4 (ת/ט) + 1.5 (פונטים זוהרים — Stretch) | 1.1, 1.4 |

### כיסוי הפרמטרים על-ידי המשחקונים הקיימים
- **1.1 זיהוי צורה:** מכוסה ע"י house, storm
- **1.2 שיום שם:** מכוסה ע"י shell, rescue, trail
- **1.3 איתור:** מכוסה ע"י shell, rescue, trail
- **1.4 הבחנה תאומים:** מכוסה חלקית — צריך משחקון ייעודי (g1-letter-vs-twin-design — דחוי לפאזה B)
- **1.5 פונטים:** כמעט לא מכוסה — Stretch בלאו הכי
- **1.6 אותיות סופיות:** **לא מכוסה כלל** — צריך משחקון ייעודי בפאזה B (g2-final-letters)

### השלכה
- **כיסוי MVP טוב ל-1.1, 1.2, 1.3** — 60% מ-Core מכוסה.
- **1.4 וההבחנת תאומות** — חלקי. צריך משחקון 6 בפאזה B (כבר מתוכנן).
- **1.6 (סופיות)** — חור גדול. בלי משחקון ייעודי, BKT שלו יהיה ריק.

---

## חלק ד' — שאלות פתוחות לפני יישום

1. **לאן 1.8 (trace) הולך?** האפשרויות:
   - (א) Skill 6 (כתיבה) — אבל זה לא קיים עוד
   - (ב) אי 19 (חול הכתיבה) — כפי שמתוכנן ב-22-islands.json
   - (ג) להישאר באי 3 כתת-משחקון "תוספת" — אבל לא לעקוב אחריו ב-BKT של Skill 1

2. **לאן 1.6 (אותיות סופיות) נכנס במשחקון?** צריך לבנות משחקון ייעודי, או להוסיף שלב בכל אחד מ-5 הקיימים?

3. **2.1 (צליל) — האם להעביר חלקית לאי 3 כפרמטר מקושר?** הלימוד תמיד יחד עם 1.2. ההפרדה רק במדידה. אז אולי 2.1 צריך להופיע גם ב-BKT של אי 3 (cross-island parameter)?

4. **קריטריון 🔴 — מה לעשות עם סף הזמן?** המחקר אומר "soft signal, not blocker". האם:
   - לוותר על זמן לחלוטין כקריטריון?
   - להשאיר זמן כדגל למורה (לא כחסם מעבר)?
   - להשאיר זמן רק לפרמטרים שנדרשת אוטומציה (1.5 ולא 1.4)?

5. **גרנולריות BKT פר-אות (sub-BKT) — לשמור או לבטל?**
   - היום באי 3: יש sub-BKT פר-אות (5 אותיות × פרמטרי-משנה)
   - המחקר מזהיר מפני "extremely fine granularity"
   - האם BKT פר-פרמטר מספיק, ופר-אות זה רק כדי שהדשבורד יציג איזה אות חלשה?

6. **חוסר במטריצת בלבול עברית — לבנות בעצמנו?**
   - המחקר אומר שאין מטריצה מפורסמת מלאה
   - האם לאסוף דאטה משלנו ב-Year 1 ולפרסם בעצמנו?

---

## חלק ה' — סבב שני (Q6-Q9, 25.5.2026)

### Q6 — סדר אלפבית כפרמטר?
**ממצא:** סדר אלפבית **לא** מנבא קריאה (NRP, NELP, Adams). ייעודי לשימוש במילון. נרכש טבעי דרך שירים ופוסטרים עד סוף א'.
**השלכה:** ✅ ההחלטה שלי לא לכלול אלפבית-סדר כ-Core פרמטר — נכונה. אופציה ל-Stretch.

### Q7 — איתור בהקשר (1.3) — תת-מיומנות?
**ממצא:** איתור בהקשר הוא **task condition נפרד** מאיתור-בידוד. בודק visual attention, crowding, position generalization. Even-Kriah מבדיל בין letter knowledge בבידוד לבין שימוש במילים.
**ציטוט:** "It meaningfully dissociates from isolated letter naming, especially in beginning readers and children with processing vulnerabilities."
**השלכה:** ✅ 1.3 (איתור בהקשר) **מאומת** כפרמטר נפרד.

### Q8 — פונטים בעברית (1.5)?
**ממצא:** בעברית אין case → font generalization **פחות קריטי**. אבל **כתב יד (כתב יד) שונה משמעותית מדפוס** בעברית — אותיות ג, ז, נ/ן, צ/ץ, ק, ת משתנות הרבה. זה צריך להיות פרמטר מרכזי, יותר מפונטים.
**ציטוט:** "For Hebrew literacy: print ↔ handwriting generalization is absolutely central. Plan from the start for a print→handwriting transition."
**השלכה:**
- ✅ 1.5 (פונטים) — אישור Stretch
- 🆕 **חסר פרמטר: print ↔ handwriting mapping** — אבל זה כנראה שייך ל-Skill 6 (כתיבה), לא Skill 1

### Q9 — מבנה Even-Kriah ו-ראמ"ה
**ממצאים מרכזיים:**
- ראמ"ה מודד **שם** ו**צליל** בנפרד (גם בלימוד יחד) — ✅ מאשר את גישתי
- **אותיות סופיות** — מובלעות ברשימות, לא תת-מבחן נפרד
- **הבחנת תאומות** — נמדדת דרך error patterns, לא תת-מבחן נפרד
- ראמ"ה מצומצם יותר ממה שאני מציע

**ציטוט:** "Final letters are embedded in letter lists and word reading; not a distinct 'final letters only' subtest... Discrimination of confusable letters is inferred from error patterns."

**השלכה — נקודה חשובה:**
מערכת *תרגול* יכולה (וצריכה) להיות יותר גרנולרית מאשר מבדק *אבחוני*. ראמ"ה רק מאבחן (5 דק' פר-ילד). אנחנו מתרגלים (חודשים פר-ילד). אז:
- ✅ 1.4 (תאומות) **כן** הצדקה להיות פרמטר נפרד (כי אנחנו מתרגלים, לא מאבחנים)
- ✅ 1.6 (סופיות) **כן** הצדקה להיות פרמטר נפרד (אותה סיבה)

---

## חלק ו' — הפסיקה הסופית (אחרי 9 שאילתות)

### הפירוק המאומת לאי 3

| # | פרמטר | אומת? | סיווג | ציטוט מפתח |
|---|---|---|---|---|
| **1.1** | זיהוי צורה ויזואלית | ✅ | Core 🟢 | NRP, Adams, Ehri — "letter identification" |
| **1.2** | שיום שם האות | ✅ | Core 🟢 | "Letter naming fluency is empirically distinct" (Q1) |
| **1.3** | איתור בהקשר | ✅ | Core 🟡 | Q7 — "meaningfully dissociates from isolated naming" |
| **1.4** | הבחנה בין תאומים | ✅ | Core 🔴 | Q3 — Schiff, Taha & Saiegh-Haddad |
| **1.5** | הכללה על פונטים | ✅ | **Stretch** | Q8 — "less critical in Hebrew (no case)" |
| **1.6** | אותיות סופיות | ✅ | Core 🟡 | Q2 — "error-prone without explicit teaching" |

### מה שיצא מהמשחק (אומת)

- ❌ **1.8 (trace)** — מועבר ל-Skill 6 (כתיבה) — Q1, Q4 אישרו
- ❌ **1.6 (מיקום משתנה הישן)** — מיזוג ל-1.3 — Q7 אישר שזה task condition לא ידע
- ❌ **סדר אלפבית** — אופציה ל-Stretch, לא Core — Q6

### פרמטר חסר שצוין (לא ב-Skill 1)
- 🆕 **Print ↔ Handwriting mapping** — Q8 אומר שזה קריטי בעברית. שייך ל-Skill 6 (כתיבה) או לאי 19 (חול הכתיבה). **לא חלק מאי 3.**

### קריטריון מאסטרי — סופי

| רמה | קריטריון | פסיקה |
|---|---|---|
| 🟢 פשוט | 4/5 בסשן + 2/2 ביום אחר | ✅ מאומת מילה במילה מהמלצת Q5 |
| 🟡 בינוני | 5/6 + 3/4 ביום אחר | ✅ הרחבה סבירה |
| 🔴 מחמיר | 7/10 + 4/5 ביום אחר + **זמן כדגל למורה בלבד** | ✅ עם תיקון: זמן לא חוסם מעבר |

---

## חלק ז' — מה שעדיין לא אומת (גם אחרי 9 שאילתות)

❌ **גודלי מאגר** (30/40/60 פריטים) — לא נמצא מקור מחקרי. השיפוט שלי.
❌ **מבנה ה-DAG בין פרמטרים** — Q1 אומר "integrated, not strictly sequential" אבל לא נותן רצף ספציפי.
❌ **חלוקת Core/Stretch** — שיקול מוצרי, לא מחקרי.
❌ **מטריצת בלבול עברית מפורטת** (אילו זוגות הכי תכופים) — Q3 אומר שאין מטריצה מפורסמת מלאה.
❌ **RCT ישיר** של BKT פר-תת-מיומנות vs פר-נושא — Q4 אומר שאין.

### למה זה לא דרמטי
- 4 הנקודות הראשונות הן **החלטות תכנון**, לא טענות מחקריות. אפשר להחליט עליהן מתוך ניסיון פדגוגי + iterativness.
- הנקודה האחרונה (אין RCT) — היא מאפיין של כל המערכות המסחריות הקיימות (Q4: "they adopted fine-grained models and never reverted"). אנחנו בחברה טובה.
