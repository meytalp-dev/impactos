# אי 2 — שונית גלי הצליל · דוח מחקר לפירוק פרמטרים

> **גרסה:** 0.1 · 24.5.2026
> **סטטוס:** טיוטה ראשונה לדיון עם מיטל
> **שייך ל:** מעבר מ-BKT פר-אי ל-BKT פר-פרמטר (החלטה ארכיטקטונית 24.5.2026)
> **מקור-אם:** [architecture-mvp.md](../../../architecture-mvp.md) §4 (BKT) + §3 (Sub-BKT באי 3 כתקדים)

---

## 1. למה צריך לפרק את אי 2 לפרמטרים

ב-architecture-mvp הנוכחית, ל-BKT יש `p(שולט)` אחד פר-אי × פר-תלמיד.ה. זה עובד יפה לאיים כמו אי 5 (מיזוג צירופים) שבהם הסקיל יחסית אחיד. **לא עובד לאי 2.** למה:

1. **אי 2 = "מודעות פונמית"** — אבל מודעות פונמית היא **לא מיומנות אחת**. היא משפחה של 5-8 תת-מיומנויות שמתפתחות חלקית בנפרד.
2. **ילדה יכולה לדעת בידוד צליל פותח** (P1) **בלי לדעת לבצע מיזוג של 3 פונמות** (P5). אלה פערים של חודשים-שנה התפתחותית.
3. ה-BKT הנוכחי לא יוכל להבחין בין "ילדה ששולטת בדיסקרימינציה אבל נכשלת במיזוג" לבין "ילדה חלשה ב-PA". שתיהן יוצגו כ-p(אי 2) בינוני.
4. **אי 3 כבר עבר את המעבר הזה** — Sub-BKT פר-אות (architecture-mvp §4.3.5). אי 2 צריך את אותו טיפול עם sub-פרמטרים סמנטיים במקום אותיות.

---

## 2. הגבול הפדגוגי בין אי 1 (פונולוגיה) לאי 2 (פונמיקה) — אומת מחדש

**שאלת המפתח שמיטל ציינה:** איפה עובר הגבול בין אי 1 לאי 2?

### תשובה (אומתה מול Anthony & Francis 2005 + Share & Bar-On 2018 + מסמך 22-islands שלנו):

| ממד | אי 1 (פונולוגיה) | אי 2 (פונמיקה) |
|---|---|---|
| **יחידת הצליל** | הברה (פר-פר = 2 חלקים) | פונמה (פ-ר-פ-ר = 4 צלילים) |
| **גודל היחידה (grain size)** | גדולה (~150 מ"ש כל הברה) | קטנה (~50 מ"ש כל פונמה) |
| **גיל-פתיחה צפוי** | גן חובה (5-6) | סוף גן חובה / תחילת א' |
| **תלות באוריינות** | מתפתח גם בלי קריאה | קופץ עם תחילת הקריאה |
| **ניבוי קריאה** | חלש-בינוני | **חזק** — הניבוי הכי טוב של רכישת קריאה |
| **משימות אופייניות** | ספירת הברות, מיזוג שתי הברות, פיצול | בידוד פונמה, מיזוג פונמות, סגמנטציה |
| **דוגמה מ-spec** | "כמה חלקים בפַּרְפַּר? **2**" | "באיזה צליל מתחילה סוס? **/ס/**" |

**מסמרת הגבול ב-22-islands:** *"בלבול בין הברות לפונמות — אסור להציג 'פ-ר-פ-ר' כארבעה צלילים. זה אי 2. כאן זה 'פר-פר' שתי הברות"* (22-islands.json, אי 1, pedagogical_risks).

**מבחן הבחנה מהיר:**
- אם הילדה צריכה לזהות 2-4 חלקים גדולים שיכולים לעמוד בפני עצמם → אי 1
- אם הילדה צריכה לזהות צליל בודד שלא ניתן להאריך בלעדיו (/ב/, /ק/) או צריך מיומנות שמיעתית עדינה (/ס/ מול /ש/) → אי 2

**הסיכון העיקרי בערבוב:** ילדה כושלת באי 1 ולא ברור אם זה כי היא לא ספרה הברות נכון או כי היא ניסתה לפונמייז.

---

## 3. ממצאי המחקר — היררכיה של מודעות פונמית

### מקור 1: NRP (2000) — Phonemic Awareness chapter (Ch. 2 — מטא-אנליזה)

- PA היא **construct unitary multi-faceted** — לא 12 מיומנויות נפרדות.
- הוראה צריכה להתמקד במספר מצומצם של משימות: **מיזוג, סגמנטציה**, ובמידה פחותה manipulation (deletion/substitution).
- בידוד-פותח-מול-סוגר, מיזוג של 2 מול 3 פונמות — **גרדיאנט קושי בתוך אותה מיומנות**, לא קונסטרקטים נפרדים.

### מקור 2: Anthony & Francis (2005) — Latent Structure of Phonological Awareness

- מבנה לטנטי של PA: **גורם כללי חזק** + שונות task-specific סביב:
  - **Grain size** (מילים → הברות → onset-rime → פונמות) — זה כן מבנה לטנטי נפרד = הסיבה לאי 1 vs אי 2
  - **מורכבות מניפולציה** (זיהוי → מיזוג/סגמנטציה → השמטה/החלפה) — גרדיאנט בתוך פונמיקה
- **בידוד-פותח, בידוד-סוגר, בידוד-אמצעי = רצף קושי**, לא קונסטרקטים נפרדים אחרי שמבקרים על כללי PA.
- **חריג ל-Hebrew:** medial vowel awareness כן צריך מעקב נפרד כי הוא חיוני לקריאה ללא ניקוד והוא הקשה ביותר.

### מקור 3: CTOPP-2 (Wagner, Torgesen, Rashotte) — האבחון הקליני המקובל

תת-מבחני PA בליבה:
- **Elision** (deletion) → המורכב ביותר
- **Blending Words** → ליבה
- **Sound Matching** (זיהוי פותח/סוגר) → ליבה
- **Phoneme Isolation** → סופג ל-Sound Matching ב-CTOPP-2

**מסקנה:** CTOPP-2 מתייחס ל-3-4 קונסטרקטים נפרדים בלבד, לא 12.

### מקור 4: Heggerty curriculum sequence — הסידור הפדגוגי המעשי

רצף הוראה רשמי שמוטמע בבתי-ספר אמריקאיים:
1. **Isolation** (פותח → סוגר → medial vowel)
2. **Blending** (2 → 3 → 4+ עם clusters)
3. **Segmenting** (onset-rime → סגמנטציה מלאה)
4. **Manipulation** (adding → deletion → substitution)

**חשוב:** ההיררכיה הזו מאומתת בקרוב 30 שנות הוראה במאות אלפי ילדים.

### מקור 5: Saiegh-Haddad (2003, 2004, 2007) — אילתאיות ערבית-עברית

ממצא קריטי לישראל:
- ילדים דו-לשוניים (ערבית-עברית, רוסית-עברית) מציגים **רגישות מופחתת** ל-non-native Hebrew phonemes, במיוחד גרוניות (/ח/, /ע/, /א/) ו-vowel contrasts מסוימים.
- **שיטתי + שורשי** ב-phonological grammar של הילד, לא רק בעיית התחלה.
- **ההמלצה לפי Perplexity 24.5.2026:** לעקוב כפרמטר BKT נפרד, **בנוסף** לאילוצי-עיצוב. הסיבה: בלי מעקב נפרד, אין אבחון, אין הוראה מותאמת, ולא יודעים אם הסקיל נרכש.

### מקור 6: Share & Bar-On (2018) — Learning to Read in Hebrew

- PA הוא הניבוי הכי חזק לרכישת קריאה בעברית — גם בנוכחות ניקוד.
- **Body-coda bias** בעברית (Bentin et al. 1990; Share & Blum 2005): סגמנטציה של final consonant **קלה יותר** מסגמנטציה של initial consonant. זה הפוך מאנגלית!
- **השלכה:** הסדר ההתפתחותי בעברית יכול להיות: פותח → **סוגר → אמצעי**, או אפילו **סוגר → פותח → אמצעי**. צריך לבחון בפיילוט.

### מקור 7: 22-islands.json — Perplexity 23.5.2026 (קיים בפרויקט)

אומת ב-23.5.2026 (sonar-pro, 4170 tokens):
- **השמטה והחלפה** = רמה 5 (Wagner & Torgesen), שליטה רחבה בעברית רק מכיתה ב' (Saiegh-Haddad 2003-2004) → **דחוי לפאזה B**.
- **Continuants בלבד בהתחלה** (/מ/ /ס/ /ש/ /ל/ /נ/) — לא גרוניות, לא minimal pairs.
- **2-3 פונמות מקסימום למיזוג** — 4+ פוגע ב-working memory לגיל 6.
- **Replay חובה** — אסור להחזיק בזיכרון עיוור.

---

## 4. גרנולריות אופטימלית ל-BKT — אומת מול Perplexity 24.5.2026

**שאלה:** האם 5, 8, או 12 פרמטרים?

**תשובה (Perplexity sonar-pro, 24.5.2026, saved at `c:/tmp/perplexity-island2-bkt-granularity.json`):**

> *"For first-grade Hebrew readers, the evidence points to a moderate level of granularity: more detailed than a single 'phonemic awareness' parameter, but not as fine-grained as a separate parameter for every micro-skill. A practical, empirically defensible choice for BKT is **about 6-8 sub-skills**, organized by complexity and partly by position (initial/medial/final), rather than 12+ fully independent skills."*

**נגד 12+:**
- מבנה לטנטי לא תומך — over-parameterization
- ב-BKT עם מעט נתונים פר-תלמיד פר-פרמטר → unstable estimates, poor convergence
- רוב ההפרדות בין micro-skills טוב יותר למודל כ-item difficulty

**נגד 3-4 בלבד:**
- מסגרות הוראה (Heggerty, 95% Group) ו-CTOPP-2 כן מבחינים בין blending / segmenting / manipulation
- בעברית, medial vowel awareness דורש מעקב נפרד
- אבחון פר-פרמטר וscheduling אדפטיבי דורש יותר מ-3-4 דגלים

**המסקנה:** **6-8 פרמטרים** הוא ה-sweet spot.

---

## 5. שאלה ייעודית — מחלקות פונמיות מול פרמטרים נפרדים

**שאלה:** האם stops (/פ/ /ב/ /ת/ /ק/) מול continuants (/מ/ /ס/ /ל/ /נ/) מול גרוניות (/ח/ /ע/) צריכות להיות **פרמטרים נפרדים** או **תכונות-קושי בתוך פרמטר אחד**?

**תשובה (Perplexity sonar-pro, 24.5.2026, saved at `c:/tmp/perplexity-island2-phoneme-class.json`):**

> *"Do not create separate BKT skills like 'stop PA' vs 'continuant PA' unless your own data show clearly different learning curves across these classes after controlling for item difficulty and position."*

**ההמלצה הסופית:**
- Stops vs continuants → **תכונות-קושי** (item features) בתוך פרמטר phoneme-identity יחיד.
- Stops קשים יותר → מתחילים בהם רק ברמת תמיכה נמוכה יותר, בלי לפצל את הפרמטר.
- אין ראיה ל-learning curves נפרדים אחרי בקרה על קושי.

**יוצא דופן אחד — non-native phonemes לדו-לשוניים:**

> *"In (2), Saiegh-Haddad (2003, 2004, 2007) shows systematic differences for certain phoneme classes for Arabic-Hebrew (and other) bilinguals... I would track it as a separate BKT skill, in addition to treating it as an item-feature constraint."*

הסיבה להבדל: stops vs continuants הם **גרדיאנט של articulatory salience**, אבל non-native phonemes הם **שורש בfonological grammar** של הילד — לא נרכשים אוטומטית עם הוראה כללית של PA.

---

## 6. סדר-קושי התפתחותי בעברית (להחלטה אדפטיבית של BKT)

מסונתז מ-Heggerty + Anthony & Francis + Share & Bar-On + Saiegh-Haddad:

```
קל ────────────────────────────────────────────► קשה

1. דיסקרימינציה same/different פותח (continuants)
2. בידוד פונמה פותחת (continuants)
3. קטגוריזציה לפי פותח (2 קטגוריות)
   ─── רמה 1-2 BKT עד כאן ───
4. בידוד פונמה סוגרת (Hebrew body-coda bias — לפעמים קל מ-2 או 3)
5. מיזוג 2 פונמות (CV)
6. דיסקרימינציה same/different סוגר
   ─── רמה 2-3 BKT ───
7. מיזוג 3 פונמות (CVC)
8. סגמנטציה CVC לפונמות
9. בידוד פונמה אמצעית (תנועה)
   ─── רמה 3-4 BKT — סוף כיתה א' ───
10. השמטת פונמה פותחת — [DEFERRED PHASE B]
11. השמטת פונמה סוגרת — [DEFERRED]
12. החלפה — [DEFERRED]
```

---

## 7. סינתזה לפרמטרים — איך 6-8 הפרמטרים מתחלקים

(ראה המסמך הנפרד `island-2-parameters-proposal.md` להצעה המפורטת)

עקרון הקיבוץ — אחרי כל המקורות:

| פרמטר | למה לא מאוחד עם השכן | למה לא מפוצל יותר |
|---|---|---|
| P1: דיסקרימינציה+בידוד פותח (אחד) | קונסטרקט יחיד ב-Anthony & Francis | אין ראיה ל-learning curves נפרדים |
| P2: בידוד סוגר | א-סימטריה ידועה (Share & Bar-On) | אותה לוגיקה כמו פותח, רק position |
| P3: בידוד אמצעי (תנועה) | קשה מהותית, חיוני לעברית ללא ניקוד | אין צורך — אין position שלישי |
| P4: מיזוג 2-3 פונמות | NRP construct נפרד מ-isolation | 2 vs 3 = קושי-פריט, לא קונסטרקט |
| P5: סגמנטציה | NRP construct נפרד מ-blending | CVC vs CCV = קושי |
| P6: רגישות לפונמות זרות | Saiegh-Haddad — שורשי, לא נרכש פסיבית | מבט אחד מספיק |
| P7: השמטה (deferred) | רמה 5 ב-Wagner & Torgesen | פאזה B |
| P8: החלפה (deferred) | אותה רמה | פאזה B |

**6 פרמטרים בפאזה A (P1-P6). 2 בפאזה B (P7-P8). סה"כ 8.**

---

## 8. השלכות על משחקונים קיימים

**מפרק קיים = אומת:**
- אצות התאומות → P1 (discrimination)
- להקות הדגיגים → P1 (categorization) — אותו פרמטר! לפי המחקר.

**זאת תגלית להציג למיטל:** 2 משחקונים שכבר חיים = 2 מנגנונים שונים שמתעדים את אותו פרמטר. זה לא בהכרח רע (מגוון מנגנונים מעודד טרנספר), אבל זה אומר ש-mastery של P1 אצל הילדה צריכה לזרום בין שני המשחקונים — וזה כבר קיים במערכת ה-mastery של אי 1 (`shares_audio_with`, mastery cross-game).

**פערים מובנים:**
- אין משחקון שמטרגט P5 (סגמנטציה) — סקיל ניבויי קריטי
- אין משחקון ראשי שמטרגט P2 (סוגר) — רק כווריאציה
- אין משחקון שמטרגט P3 (אמצעי תנועתי) — סקיל קריטי לקריאה ללא ניקוד
- אין משחקון מתוכנן ל-P6 (רגישות לזרות) — חסר אבחוני לדו-לשוניים

---

## 9. מקורות שהשתמשנו בהם

| מקור | מתי | היכן |
|---|---|---|
| NRP (2000) Ch. 2 — Phonemic Awareness Instruction | National Reading Panel report | מצוטט ב-Perplexity #1+#2 |
| Anthony & Francis (2005) — Development of phonological awareness | Current Directions in Psychological Science | מצוטט ב-Perplexity #1+#2 |
| Wagner, Torgesen, Rashotte, Pearson — CTOPP-2 | 2013 | מצוטט ב-Perplexity #1 |
| Heggerty curriculum sequence | Literacy Resources Inc. | מצוטט ב-Perplexity #1 |
| Share & Bar-On (2018) — Learning to read in Hebrew | Scientific Studies of Reading | מצוטט ב-Perplexity #1+#2 + 22-islands.json |
| Saiegh-Haddad (2003, 2004, 2007) — diglossia & PA | מספר פרסומים | מצוטט ב-Perplexity #2 + 22-islands.json |
| Bentin et al. (1990); Ben-Dror et al. (1995); Share & Blum (2005) — body-coda bias בעברית | Hebrew PA studies | מצוטטים ב-Perplexity #2 |
| Shany & Share — Hebrew literacy assessment | ראמ"ה / מטח | מצוטטים ב-22-islands Perplexity 23.5.2026 |
| משה"ח תשפ"ו — תוכנית לימודים בעברית | משרד החינוך | curriculum/knowledge-base/sources/moe-curriculum-tashpav-2026.json |

---

## 10. שאלות פתוחות לפני סגירת הפרמטרים

1. **בעברית: P2 (סוגר) קל יותר מ-P4 (מיזוג 2)?** Share & Blum 2005 רומזים שכן (body-coda bias). אם זה נכון, סדר ההצגה משתנה.
2. **P6 (רגישות לזרות) — מתי להפעיל?** מההתחלה כפרמטר חי, או רק אחרי שהפרופיל מסומן כ-bilingual ב-onboarding?
3. **medial vowel — אכן נדרש כפרמטר בכיתה א'?** Share & Bar-On מדגישים את חשיבותו לקריאה ללא ניקוד, אבל בכיתה א' רוב הטקסט מנוקד. אולי דחוי לתחילת ב'?
4. **האם MVP צריך משחקון לסגמנטציה (P5)?** סקיל הכי ניבויי לקריאה, ואין לו משחקון מתוכנן.

תשובות בסעיף 11 של מסמך ההצעה הנפרד.

---

*נכתב 24.5.2026 לאחר 2 קריאות Perplexity סדרתיות + סקירת קוד קיים של אי 2 + השוואה לאי 1 + ביקורת הקיים ב-22-islands.json.*
