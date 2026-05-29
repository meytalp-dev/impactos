# curriculum/_schema/

**מקור-אמת התוכן** של english-chativa. כל פריט תרגול, pack, ו-intervention מתבסס על הקבצים פה.

## קבצים

| קובץ | תפקיד | סטטוס |
|---|---|---|
| `curriculum-2020-master.md` | מסמך-אם פדגוגי · 3 רכיבי Curriculum + 5 domains + LSRW mapping | ✓ approved |
| `item-schema.json` | JSON Schema של פריט תרגול בודד · 3-layer (content + measurement + organization) | ✓ approved |
| `extracted/sight-words-bridge.json` | 50 sight words ל-Bridge + phonics addons | ⚠ draft · 33 sight words TBD |
| `extracted/vocab-band-1-grade7.json` | Vocab clusters פר Unit (~80 chunks) | ⚠ draft · pending Meytal review |
| `extracted/grammar-structures-grade7.json` | 14 grammar structures פר Unit | ⚠ draft · pending Meytal review |
| `extracted/can-do-statements-grade7.json` | 36 CEFR can-dos · 8 Units · Pre-A1 → A1+ | ⚠ draft · pending Meytal review |

## עקרונות

1. **3-layer separation מקודש** — content / measurement / organization נשמרים בנפרד. ראה `curriculum-2020-master.md` §7.
2. **כל id stable** — `vb-*` (vocab), `gr-*` (grammar), `cd-*` (can-do), `sw-*` (sight word), `phon-*` (phonics). ids אלה הם API פר items.
3. **BKT axes = 5 בלבד** (LSRW + Language) — לא לבנות BKT פר can-do / vocab / grammar (Q-matrix collapse).
4. **Sub-BKT אופציונלי** — vocab clusters (לא מילים בודדות) · grammar structures (14 פר ילדה).
5. **EPA תיאורי בלבד** — failure_type + context + task. לא Bayesian.

## כללי עריכה

- אסור לערוך `curriculum-2020-master.md` בלי אישור מיטל (מסמך-אם פדגוגי).
- מותר לערוך `extracted/*.json` רק אם:
  - הוספה: id חדש שעקבי עם הקיים
  - עדכון: שינוי בהגדרה — חובה לעדכן גם את הקבצים שמתבססים על ה-id (packs, items)
- ids existing לא משתנים — לעולם. אם צריך לשנות, deprecate ולהוסיף id חדש.

## הצעדים הבאים (Phase 2-3)

1. Meytal לאשר את כל קבצי `extracted/*.json` (draft → approved)
2. בניית `curriculum/packs/october-2026-bridge-and-aboutme.json` — pack ראשון שמשתמש ב-ids מ-extracted/
3. בניית `curriculum/packs/november-2026-family.json` ועוד 6 packs

## Sources

ראה `curriculum-2020-master.md` §8 לרשימה מלאה. עיקרי:
- [Curriculum 2020 PDF · משה"ח](https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/Curriculum2020.pdf)
- [Bulletin המפמ"ר 2021](https://sites.google.com/view/bulletin2021english/curriculum/2020-revised-curriculum)
- [Tnufa Grade 9 · רמ"ה](https://rama.gov.il/assessments/tnufa-eng-9-2026)
- `../tnufa-plans/english-tnufa-grade7.json` — מקור החילוץ
