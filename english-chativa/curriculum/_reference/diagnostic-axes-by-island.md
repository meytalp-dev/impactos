# פרמטרים + צירי EPA פר אי — מסמך מאחד

> **גרסה:** 1.1 · 25.5.2026
> **סטטוס:** טיוטה לאחר אימות פרפלקסיטי sonar-pro לאיים **1**, 2, 4, 5, 9.
> **מקור-אמת:** קבצי `perplexity-island{N}-parameters-validation-2026-05-{XX}.json` ב-`curriculum/knowledge-base/sources/`.

---

## הקדמה ארכיטקטונית

3 רבדים שצריך להבדיל ביניהם:

| רובד | רמה | מה זה | דוגמה |
|---|---|---|---|
| **א. סטרנד** | BKT (5 פר ילדה) | מודל סטטיסטי לטנטי | strand_1_phonology_decoding |
| **ב. פרמטרים פר אי** | תיוג תוכן + Pool descriptor | תת-מיומנויות בתוך אי. **לא BKT.** | island_4 / P2 CV-decoding-known-letter |
| **ג. EPA פר פריט** | ספירה תיאורית | Failure × Context × Task | A1 vowel-shape-confusion × CVC × recognition |

**עיקרון:** ה-BKT נשאר ברמת סטרנד. הפרמטרים משמשים:
- לתיוג מאגר פריטים (לסינון לפי focus_strand_intensity וה-active_parameters בפאק)
- לדיווח גרנולרי בדשבורד למורה (ספירה: "מתוך 12 ניסיונות ב-P4, אחוז הצלחה X")
- **לא** לציון מאסטרי פר-פרמטר

---

## אי 1 — מיפוי צליל-דיבור והברות (Foundational PA, Pre-letter)

**סטרנד:** 1 (פונולוגיה + דקודינג)
**שלב משה"ח תשפ"ו:** 2-3 (טרום-קריאה → ניצני אלפבית) · **Triplex Phase:** 1 (Sublexical, Grade 1). מרכז של גן חובה, ממשיך לתחילת G1.
**רכיב משה"ח:** 1 (תקשורתית) + 2 (רכישה)

### 7 פרמטרים מאומתים (אחרי MERGE של P8→P1)

| ID | שם | קושי | סטטוס | גודל מאגר מוערך |
|---|---|---|---|---|
| **P1** | onset-detection — זיהוי הצליל הפותח במילה ללא טקסט (כולל P8 categorization שמוזג כ-task format) | 🟡 medium | approved-with-conditions (החליטי האם "onset" = CV או רק עיצור — מטח חוברת 1 משתמשת ב-CV) | 50-70 |
| **P2** | rhyme-awareness — זיהוי חריזה (תָּמָר/בָּמָר/חַצָּר — מי שונה?) | 🟢→🟡 easy-medium | approved-with-conditions (פחות מרכזי בעברית מאשר באנגלית — לא להעמיס) | 30-40 |
| **P3** | syllable-counting — ספירת הברות ע"י מחיאת כפיים | 🟢 easy | approved (מגיע ל-ceiling מהר ב-G1) | 30-40 |
| **P4** | syllable-blending-oral — מיזוג הברות נשמעות בנפרד למילה | 🟢→🟡 easy-medium | approved | 50-70 |
| **P5** | syllable-segmentation-oral — פירוק מילה נשמעת להברות (לא רק ספירה — הפקה) | 🟡 medium | approved | 40-60 |
| **P6** | syllable-deletion-oral — השמטת הברה (קָלִיתָה בלי "קָ" = לִיתָה) | 🟡→🔴 medium-hard | approved (חזק מאוד אבחנתית) | 30-50 |
| **P7** | word-boundary-detection — זיהוי גבולות מילים בדיבור רציף | 🟢→🟡 easy-medium | approved-with-conditions (**pre-PA precursor, לא PA-core** — סמני בנפרד) | 20-30 |

**שונה / נדחה:**
- **P8 (sound-pattern-discrimination-categorization) — MERGED** ל-P1 כ-task format (odd-one-out, triad grouping). לא פרמטר נפרד.

### צירי EPA לאי 1

**Failure values (6 קטגוריות מאומתות):**

| קוד | שם | תיאור |
|---|---|---|
| F1-1 | sound-pattern-confusion | בחירת מילה עם צליל אחר (בלבול /s/↔/ʃ/, /k/↔/g/, גרוניים) |
| F1-2 | omission-no-attempt | אין תגובה / תגובה לא-פונולוגית ("אני לא יודע") |
| F1-3 | addition-insertion | הוספת הברה/צליל שלא במקור (סָ+בָּ → סַבָּבָה) |
| F1-4 | position-order-error | יחידות נכונות אבל סדר שגוי (קָלִיתָה → קָתִילָה בסגמנטציה) |
| F1-5 | syllable-miscounting | מחיאות ≠ הברות בפועל (משקף working memory יותר מ-PA) |
| F1-6 | metalinguistic-misinterpretation | תגובה סמנטית/לקסיקלית במקום פונולוגית (חריזה לפי משמעות) |

**Context values:**
- word-length: short (1-2 syll) / long (3+ syll)
- syllable-type: CV / CVC / CCV / CVCC
- morphological-complexity: monomorphemic / inflected / derived
- lexical-familiarity: high-freq / mid-freq / low-freq / pseudoword
- phoneme-status: native / non-native (גרוניים ח/ע — דוברי L1 שונה)
- phoneme-position: initial / medial / final

**Task values:**
- T1 oral-discrimination — same/different, odd-one-out, grouping
- T2 oral-production — segmentation, deletion, blending, word-boundary
- T3 oral-counting-clapping — מיפוי מילה→מחיאה (מבדיל working-memory מ-PA)

**מקורות אקדמיים:** Share & Bar-On 2018 (Triplex model, phase 1) · Shany & Geva 2010 · Saiegh-Haddad 2003-2007 · Weiss et al. 2022 (neuroimaging shallow→deep)

**הערה התפתחותית:**
- **Pre-school dominant (פחות predictive ב-end-of-G1):** P2 rhyme, P3 counting, P7 word-boundary
- **More predictive of end-of-G1:** P1/P8 onset, P4 blending, P5 segmentation, P6 deletion
- אחרי G1: morpho-lexical knowledge מתחיל "להחליף" PA בחיזוי שטף (especially unpointed)

---

## אי 4 — אות + ניקוד + הברה (CV / CVC)

**סטרנד:** 1 (פונולוגיה + דקודינג)
**שלב משה"ח תשפ"ו:** 3 → 4 (תחילת קריאה מנוקדת) · **Triplex Phase:** 1 (Sublexical, Grade 1)
**רכיב משה"ח:** 2. רכישה

### 8 פרמטרים מאומתים

| ID | שם | קושי | סטטוס | גודל מאגר מוערך |
|---|---|---|---|---|
| **P1** | vowel-recognition-isolated — זיהוי הניקוד ליד עיצור | 🟡 medium | approved-with-conditions (פצל P1a חזקות / P1b מבלבלות) | 40-60 |
| **P2** | CV-decoding-known-letter — פענוח CV עם אותיות מוכרות | 🟢 easy→medium | approved | 60-80 |
| **P3** | CV-decoding-novel-letter — פענוח CV עם אות/תנועה חדשה | 🟡 medium | approved | 40-50 |
| **P4** | CVC-decoding-closed-syllable — פענוח CVC סגורה | 🟡→🔴 medium-hard | approved | 50-70 |
| **P5** | syllable-blending-2to3 — מיזוג 2-3 הברות למילה | 🟡 medium | approved (תייג 2-syll vs 3-syll נפרד) | 50-70 |
| **P6** | vowel-discrimination-similar — אבחנה בין סימני ניקוד דומים | 🔴 hard | approved-with-conditions (פצל P6a same-sound / P6b diff-sound) | 30-40 |
| **P7** | orthographic-mapping — אותו שלד עיצורי + תנועות שונות = מילים שונות | 🟡→🔴 medium-hard | approved | 30-40 |
| **P8** | fluency-CV-list — קריאה אוטומטית של 8-12 CV ב-30 שניות | 🟡 medium | approved (כ-benchmark, לא מיומנות) | 20-30 רשימות |

**Stretch / חסר במקור (להוסיף כתגי תוכן בלבד):**
- **M1 — phoneme-awareness on CV/CVC** (בלי דפוס) — מודעות פונולוגית של CV/CVC ללא טקסט מודפס. מקור: NRP 2000 + Saiegh-Haddad 2003-2007. הכרחי כתוויסט תוכן.
- M2 — letter-name vs letter-sound confusion (mater lectionis ו', י') — אופציונלי לתיוג
- M3 — directionality / tracking errors — אבחנתי לתחילת השנה

### צירי EPA לאי 4

**Failure values (8 קטגוריות מאומתות):**

| קוד | שם | תיאור | קונטקסט אופייני |
|---|---|---|---|
| A1 | vowel-shape-same-sound | בלבול בין סימני ניקוד באותו צליל (קמץ↔פתח, צירה↔סגול) | P1, P6 |
| A2 | vowel-shape-different-sound | בלבול בין סימני ניקוד באותו אזור ויזואלי (חולם/שורוק/קובוץ) | P1, P6 |
| A3 | vowel-position-misperception | קישור ניקוד לאות לא נכונה | טקסט צפוף |
| B1 | vowel-omission | הצליל הופך לקריאה רק עיצורית (מ' של "מָה" נקרא "מ") | P2-P5 |
| B2 | vowel-insertion-epenthesis | תוספת תנועה בסוף CVC (כָר → כָרָה) | P4, P5 |
| C1 | wrong-vowel-correct-consonant | החלפת תנועה (בָּ → בִּי) | P2-P5 |
| C2 | default-/a/-strategy | קריאת כל ניקוד כ-/a/ ללא קשר | P8, סוף פסקה |
| D1 | consonant-misidentification-with-correct-vowel | בלבול אות עם תנועה תקינה (בָּ → פָּ) | P2-P4 |
| D2 | CVC-reduction-expansion | השמטה או הוספה של עיצור בסוף (כָר → כָ או טָר) | P4 |
| E1 | syllable-boundary-error | טעות במיזוג הברות (בָּ+רָק → בַּרק) | P5 |
| E2 | syllable-transposition | היפוך סדר הברות (תָּמָר → מָתָר) | P5 |
| F1 | root-default-guess | אותו שורש, ניקוד שגוי (סֵפֶר → סָפַר) | P7 |
| F2 | visual-lexical-neighbor | החלפה למילה דומה ויזואלית | P7, רשימות |
| G1 | non-fluent-accurate-decoding | פענוח נכון אבל איטי | P8, פסקה |
| G2 | guessing-under-speed | מהירות עם שגיאות שלא מופיעות בקצב חופשי | P8 timed |

**Context values:**
- syllable-structure: CV / CVC / CCV
- letter-position: initial / medial / final (בתוך מילה רב-הברתית)
- letter-known-status: known / recently-introduced / novel
- niqqud-type: kamatz / patach / tsere / segol / chirik / cholam / shuruk / kubutz
- word-frequency: high-freq / mid-freq / low-freq / pseudoword
- time-pressure: untimed / timed

**Task values:**
- recognition (זיהוי מהטקסט)
- naming (הקראה רמה)
- discrimination (בחירה מתוך 2-4 אפשרויות)
- blending (מיזוג מהברות)
- segmentation (פירוק להברות)
- production (לא ב-G1 על מסך — לא לאמוד)

**מקורות אקדמיים:** NRP 2000 · Share & Bar-On 2018 · Ravid 2012 · Saiegh-Haddad 2003-2007 · Shany & Share 2011 · Bar-On & Ravid 2011

---

## אי 5 — מיזוג צירופים למילים (Blending to Words)

**סטרנד:** 1 (פונולוגיה + דקודינג)
**שלב התפתחותי:** 4 (קריאה מנוקדת — מעבר ממיזוג להבנה)
**רכיב משה"ח:** 2. רכישה

### פרמטרים סופיים (לאחר verdict)

| ID | שם | קושי | Verdict | גודל מאגר |
|---|---|---|---|---|
| **P1** | two-syllable-CV-CV-real-word — מיזוג 2 הברות פתוחות למילה אמיתית | 🟢 very easy | approved | 50-70 |
| **P2** | two-syllable-CV-CVC-real-word — מיזוג CV+CVC | 🟢→🟡 low-moderate | approved | 50-70 |
| **P3** | three-syllable-real-word — מיזוג 3 הברות (תייג P3a all-CV / P3b mixed / P3c with-cluster) | 🟡→🔴 moderate-challenging | approved-with-conditions | 60-90 |
| **P4** | segment-back-to-syllables — פירוק מילה להברות (PA-heavy) | 🟡 moderate | approved-with-conditions (לא לערב במאסטרי בלי מודל PA) | 40-50 |
| **P5** | pseudo-word-decoding — מיזוג מילות סרק | 🟡→🔴 moderate-high | approved | 40-60 |
| **P7** | word-recognition-after-blending — לקסיקליזציה אחרי מיזוג | משתנה | approved-with-conditions (כקוד אבחנתי, לא טירינג) | n/a — דגל |

**שונו / נדחו:**
- **P6 (context-supported-blending) — SPLIT.** לא פרמטר. לתיוג בציר Context (picture/sentence-cloze/multiple-choice).
- **P8 (omission-error-detection) — MERGE.** תת-קטגוריה ב-Failure (E1+E2), לא פרמטר עצמאי.

**Stretch (תגיות תוכן, לא פרמטרים):**
- onset-clusters (CCV) — קפיצת קושי משמעותית, חוזה ORF
- morpheme-boundary alignment — שורש + תבנית מתחילים להופיע
- stress-pattern — pen-ultimate stress

### צירי EPA לאי 5

**Failure values (8 קטגוריות מאומתות):**

| קוד | שם | תיאור |
|---|---|---|
| F5-1 | syllable-omission | השמטת הברה (מילה תלת-הברתית הופכת לדו-הברתית) |
| F5-2 | syllable-transposition | היפוך סדר הברות (קָלִיתָה → לִיקָתָה) |
| F5-3 | syllable-fusion | מיזוג של 2 הברות לאחת (קָלִיתָה → קָלְתָה) |
| F5-4 | vowel-substitution-in-blending | מסגרת עיצורית תקינה, תנועה שגויה |
| F5-5 | consonant-substitution-in-blending | החלפת עיצור בתוך הברה תקינה |
| F5-6 | over-segmentation | תוספת הברה (קָלִיתָה → קָ-לִי-יָ-תָה) |
| F5-7 | lexicalization-failure | מיזוג פונולוגי תקין אבל אין זיהוי לקסיקלי |
| F5-8 | global-blending-failure | הברות בודדות נקראות, מיזוג לא מתבצע |

**Context values:**
- syllable-count: 2 / 3 / 4+
- structure-profile: all-CV / mixed-CV-CVC / with-CCV-cluster / with-final-cluster
- lexical-familiarity: high-freq-school-vocab / mid-freq / low-freq / pseudoword
- prefix-presence: bare-stem / with-function-prefix (וְ/הַ/בְּ/לְ/מִ)

**Task values:**
- oral-blending — שמיעת הברות, אמירת מילה
- visual-blending — קריאת הברות בכתב
- blending-with-picture — תמיכת תמונה
- blending-with-sentence-cloze — הקשר משפט
- orthographic-multiple-choice — בחירה ויזואלית

**מקורות אקדמיים:** NRP 2000 · Share & Bar-On 2018 · Bar-On & Ravid 2011 · Ravid 2012 · Shany & Share 2011

**שאלה פתוחה:** prevalence מספרי של דפוסי כשל בעברית מנוקדת — Perplexity לא מצא נתונים גרנולריים. ראו `open-questions-for-experts.md`.

---

## אי 9 — שורש + תבנית (מורפולוגיה)

**סטרנד:** 2 (מורפולוגיה + מילות פונקציה)
**שלב התפתחותי:** 4-5 (סוף G1 מינימלי, מרכז ב-G2-G3)
**רכיב משה"ח:** 1 + 2 (תקשורתית + רכישה)

### חלוקה ל-Phase A (G1) vs Phase B (G2+)

**Phase A — Core ל-G1:**

| ID | שם | קושי | Verdict | גודל מאגר |
|---|---|---|---|---|
| **P2** | word-family-detection — זיהוי מילים מאותה משפחה | 🟡 3/5 | approved | 40-60 |
| **P6** | plural-formation-regular — צורת רבים -ים / -ות | 🟢 2-3/5 | approved | 40-60 |
| **P7** | gender-marking — זיהוי זכר/נקבה לפי סופית | 🟢 2/5 | approved | 40-60 |
| **P8** | function-words-vs-content — אבחנה בין מילות שירות (ו/ה/ב/ל/מ) למילות תוכן | 🟢→🟡 2-3/5 | approved | 30-50 |

**Phase A — Stretch (scaffolded):**

| ID | שם | קושי | Verdict |
|---|---|---|---|
| **P1** | root-extraction-from-known-word — חילוץ שורש ממילה מוכרת | 🔴 4/5 | approved-with-conditions (רק במבני נשימה גבוהים, שורשים שקופים, ללא רבי-יו"ד) |
| **P3** | pattern-recognition-mishkal — זיהוי משקל (Tier 1 implicit בלבד ב-G1) | 🔴 4-5/5 | approved-with-conditions (פצל Tier 1 implicit / Tier 2 explicit) |
| **P5** | morphological-construction-fill — בניית מילה משורש+תבנית | 🟡→🔴 3-4/5 | approved-with-conditions (אינפלקטיבי בלבד ב-G1, לא דריבטיבי) |

**Phase B — נדחה ל-G2+:**

| ID | שם | קושי | Verdict |
|---|---|---|---|
| **P4** | verb-pattern-binyan-basic — זיהוי בניין (פעל/פיעל) | 🔴 5/5 | **REJECT for G1** — בניין לא נלמד מפורש ב-G1 לפי משה"ח |

### צירי EPA לאי 9

**Failure values (6 קטגוריות מאומתות):**

| קוד | שם | תיאור | קבוצה |
|---|---|---|---|
| F9-1 | root-substitution | בחירה/יצירה של מילה עם שורש שונה מהמטרה | דריבטיבי |
| F9-2 | root-letter-omission | זיהוי 2 מתוך 3 רדיקלים, או הוספה | דריבטיבי |
| F9-3 | pattern-confusion | שורש נכון, משקל/בניין שגוי | דריבטיבי |
| F9-4 | gender-mismatch | סימון מגדר שגוי על שם/תואר | אינפלקטיבי |
| F9-5 | regular-plural-overgeneralization | שימוש ב-ים/ות במקום בלתי-רגיל (אִישׁ → אִישִׁים) | אינפלקטיבי |
| F9-6 | function-content-misclassification | טיפול במורפם כבול כתוכן ולהפך | פונקציה |

**Context values:**
- within-family / across-families
- root-transparency: transparent / weak (י-ו) / opaque
- regular-form / irregular-form
- bare-stem / with-function-prefix(es)

**Task values:**
- T1 identification — "מה השורש של ילד?"
- T2 production — "ילד אחד → הרבה...?"
- T3 discrimination / matching — "אילו 2 מילים שייכות יחד?"

**מקורות אקדמיים:** Ravid 2012 · Schiff & Ravid 2012 · Vaknin-Nusbaum & Ravid 2018 · משה"ח תוכנית תשפ"ו

---

## טבלת סיכום פר אי

| אי | סטרנד | פרמטרים Core | פרמטרים Stretch | פרמטרים נדחו / מוזגו | צירי EPA |
|---|---|---|---|---|---|
| **1** (foundational PA, oral) | 1 | P1, P4, P5, P6 | P2 (rhyme), P3 (counting) | P7 (pre-PA precursor), P8 (merged→P1) | **6 failure × 6 context × 3 task** |
| **2** (פונולוגיה) | 1 | P1, P2, P4, P5 | P3, P6 | P7, P8 | 5 failure types (raw) |
| **4** (אות+ניקוד+CV/CVC) | 1 | P2, P3, P4, P5, P8 | P1, P6, P7 | — | **8 failure × 6 context × 6 task** |
| **5** (מיזוג למילים) | 1 | P1, P2, P3, P5 | P4, P7 | P6 (split→context), P8 (merge→failure) | **8 failure × 4 context × 5 task** |
| **9** (שורש+תבנית) | 2 | P2, P6, P7, P8 | P1, P3-tier1, P5-inflectional | P4 (binyan) | **6 failure × 4 context × 3 task** |

---

## עקרונות עבודה

1. **פרמטרים ≠ BKT.** הם metadata לתוכן + ספירה בדשבורד מורה.
2. **לא לטרוג ילדה ברמת פרמטר.** הציון הוא ברמת סטרנד.
3. **Tier 4 בכל פאק חודשי כולל לפחות 50% תוכן מאיים קודמים** — לפי architecture-mvp.md ההחלטה ב-23.5.2026.
4. **כל פריט מתויג בלפחות 4 רבדים:** `strand_id` + `island_id` + `parameter_id` + `epa_axes_targeted` (failure/context/task).
5. **פריטים שלא ניתן להעריך על מסך** (production אוראלית, כתב יד פיזי) — לא כלולים במנוע התרגול.

---

*עדכון אחרון: 25.5.2026 · גרסה 1.0 · מאומת מול 3 שאילתות Perplexity sonar-pro · ראו קבצי raw ב-`knowledge-base/sources/`*
