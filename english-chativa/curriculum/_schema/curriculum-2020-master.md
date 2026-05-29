# Curriculum 2020 Master Schema — English Chativa

> **מקור-אמת פדגוגי** של english-chativa. כל פריט תרגול, pack, intervention, ו-can-do — מתבסס על המסמך הזה. עודכן: 29.5.2026.
>
> **מאומת מול:** [English Curriculum 2020 · משה"ח](https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/Curriculum2020.pdf) · [Bulletin המפמ"ר 2021](https://sites.google.com/view/bulletin2021english/curriculum/2020-revised-curriculum) · [תנופה אנגלית ט' · רמ"ה תשפ"ו](https://rama.gov.il/assessments/tnufa-eng-9-2026).

## 1. 3 הרכיבים המבניים של ה-Curriculum

לפי הציטוט הרשמי מה-Bulletin:

> "There are three main components in the aligned Curriculum: the **can-do statements**, the **vocabulary (lexical bands)** and the **grammar**."

| רכיב | תפקיד | איפה במנוע |
|---|---|---|
| **A. Can-do statements** | מה הילד.ה צריך.ה לדעת לעשות (CEFR descriptors) | יעדי mastery + EPA tracking |
| **B. Vocabulary** | רשימות מילים פר Band (Band 1 = Pre-A1/A1) | Sub-BKT פר vocab cluster + content |
| **C. Grammar** | structures פר רמה | Sub-BKT פר grammar pattern + content |

---

## 2. 5 ה-Domains התוכניים של ה-Curriculum

לפי Revised English Curriculum 2020:

| # | Domain | תיאור | מתבטא ב-units (ז') |
|---|---|---|---|
| 1 | **Social Interaction** | תקשורת בין אנשים — dialogues, conversation, social messaging | About Me (פנייה אישית) · Family · School (small talk) |
| 2 | **Access to Information** | קריאה והבנה של טקסטים אינפורמטיביים | Reading: notice · flyer · timetable · advertisement · map |
| 3 | **Presentation** | הפקה והצגה של מידע (oral או written) | About Me poster · Family tree · Day-in-my-life · Class poll · Mini-magazine |
| 4 | **Appreciation of Literature & Culture** | חשיפה לתרבות אנגלוסקסית + תוכן ספרותי | (פחות דומיננטי בז' · יותר בח'-ט' · ב-tnufa ז' = מינימלי) |
| 5 | **Language** | Grammar, vocabulary, phonics, mechanics | משתלב בכל ה-domains כתשתית |

**עיקרון:** Domains מצביעים על **שימוש** (use case). הילד.ה לא רואה.ת "domain 2" — היא רואה "today I'll read a school timetable in English". Domains הם **תיוג למורה ולמפקח**, לא ל-UI התלמיד.ה.

---

## 3. CEFR Mapping — Pre-A1 → A1 (כיתה ז')

תנופה ז' מגדיר את ה-trackLabel כ-**"Foundation · CEFR Pre-A1 → A1"**.

### 4 Tracks בתוך טווח הזה

| Track | שם בעברית | CEFR sub-level | מי | התאמת פיגום |
|---|---|---|---|---|
| **1** | בסיסי (אדום) | Pre-A1 | תלמיד.ה שעדיין לא יודע.ת אלפבית · ביטחון נמוך · רמזים תמיד | נמוך · TPR · sight-words בלבד |
| **2** | בינוני (כתום) | Pre-A1+ → A1- | רוב הכיתה · יודע.ת sight-words · מתחיל.ה לקרוא | רמז אופציונלי · 1 ניחוש |
| **3** | מתקדם (צהוב) | A1 | בטוח.ה ב-vocab בסיסי · grammar simple | בלי רמזים · 1 ניסיון |
| **4** | העמקה (ירוק) | A1+ → A2- | מצטיין.ת · יכול.ה לבטא רעיון בכמה מילים | open input · יצירת תוכן |

**עיקרון "Tier 4 כולל תוכן מ-Tracks קודמים"** (יורש מאבני יסוד §3.4): תלמיד.ה ב-Track 4 של Unit 3 עדיין יכול.ה לקבל פריט מ-Track 2 של Unit 2 אם יש פער מזוהה ב-EPA.

---

## 4. 5 BKTs Primary — LSRW + Language

מנוע BKT (יורש מאבני יסוד §4.2) ירוץ על 5 axes לכל תלמיד.ה:

| BKT # | Axis | מקור | תנופה ט' בודק? |
|---|---|---|---|
| 1 | **Listening** | Curriculum + classic ELT | ❌ לא נמדד בתנופה |
| 2 | **Speaking** | Curriculum + classic ELT | ❌ לא נמדד בתנופה |
| 3 | **Reading** (comprehension) | Curriculum 2020 | ✓ נמדד בתנופה |
| 4 | **Writing** | Curriculum 2020 | ✓ נמדד בתנופה (40-50 מילים פסקה) |
| 5 | **Language** (Grammar + Vocab integrated) | Curriculum 2020 | ✓ נמדד בתנופה |

**Sub-BKTs (מקבילים ל-sub-BKT פר אות באבני יסוד):**

- ב-Reading + Listening: sub-BKT פר **text type** (notice / flyer / dialogue / story) ופר **vocab cluster**
- ב-Writing + Speaking: sub-BKT פר **can-do statement** (e.g. "self-introduction" / "describe family")
- ב-Language: sub-BKT פר **grammar structure** (`to be` / Present Simple / possessive 's / frequency adverbs / ...)

---

## 5. ההיררכיה הסופית של תיוג פריט תרגול

```
Item
├── Curriculum 2020 master tags (חובה)
│   ├── can_do_id           ← "self-introduce-3-sentences"
│   ├── vocab_ids[]         ← ["name", "from", "live-in"]
│   ├── grammar_id          ← "to-be-affirmative"
│   └── domain              ← "social_interaction" (1 of 5)
│
├── Measurement tags (חובה)
│   ├── lsrw_primary        ← "Listening" | "Speaking" | "Reading" | "Writing" | "Language"
│   ├── lsrw_secondary[]    ← אם משולב (e.g. Listen-then-Speak)
│   └── expected_failure_axes  ← EPA: failure_types · contexts · tasks
│
└── Organization tags (חובה)
    ├── unit_id             ← "u1-aboutme"
    ├── track               ← 1 | 2 | 3 | 4
    ├── cefr_level          ← "Pre-A1" | "A1-" | "A1" | "A1+"
    └── envelope            ← "tap-match" | "drag-build" | "open-input" | "listen-mcq" | ...
```

---

## 6. החריגים — Listening + Speaking

תנופה ט' (המבחן הרשמי) **לא מודד** Listening ו-Speaking. למרות זאת, Curriculum 2020 **מחייב** את שניהם.

**ההשלכה ל-MVP:**

- **mandatory coverage** (יש מבחן בעתיד): Reading · Writing · Language
- **enrichment coverage** (פדגוגי בלבד): Listening · Speaking
- ה-Listening + Speaking יקבלו פחות items ב-MVP (~15% מהסיומל) אבל לא 0
- Pre-built Pair Interview templates ב-Speaking + Listening-with-MCQ ב-Listening — מספיק לעיקרון

---

## 7. שמירת ה-3-Layer separation

**אסור** לערבב את 3 השכבות במנוע:

| שכבה | יחידת מדידה | סוג |
|---|---|---|
| **תוכן** (can-do · vocab · grammar) | מצרף · אגרגציה תיאורית | metadata + content |
| **מדידה** (LSRW + L) | **BKT** (5 פר ילדה) | סטטיסטי-Bayesian |
| **ארגון** (Units · Tracks) | פילטר + Pack selector | מנהל תוכן |

זה תואם את ה-Q-matrix theory (ראה `_reference/avnei-yesod-architecture-mvp.md` §4.3.5b). **לא לבנות BKT פר can-do · פר vocab · פר grammar · פר domain — קריסה סטטיסטית.**

---

## 8. Sources

- [English Curriculum 2020 (PDF) · משה"ח](https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/Curriculum2020.pdf)
- [Bulletin for the Chief Inspector of English · 2020 revised curriculum](https://sites.google.com/view/bulletin2021english/curriculum/2020-revised-curriculum)
- [תנופה אנגלית ט' · רמ"ה תשפ"ו](https://rama.gov.il/assessments/tnufa-eng-9-2026)
- [Bulletin 2021 — Introduction](https://sites.google.com/view/bulletin2021/general-information/introduction)
- תוכניות תנופה ז' / ח' / ט' (קיימים ב-`curriculum/tnufa-plans/`)
- ארכיטקטורת מנוע אבני יסוד: `_reference/avnei-yesod-architecture-mvp.md`
