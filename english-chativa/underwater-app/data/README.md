# underwater-app/data/

מאגרי פריטים פר-Unit של תוכנית תנופה. נמחק בכוונה תוכן עברי משכפול אבני יסוד.

## מבנה (TODO)

לפי תוכנית תנופה ז':

| Unit | קובץ מתוכנן |
|---|---|
| Unit 0 — Bridge | `unit-0-bridge.json` |
| Unit 1 — About Me | `unit-1-aboutme.json` |
| Unit 2 — Family & Home | `unit-2-family.json` |
| Unit 3 — School Life | `unit-3-school.json` |
| Unit 4 — Daily Routine | `unit-4-routine.json` |
| Unit 5 — Food & Drink | `unit-5-food.json` |
| Unit 6 — My City | `unit-6-city.json` |
| Unit 7-8 (TBD) | … |

## תוכנית שנתית מקור

`curriculum/tnufa-plans/english-tnufa-grade7.json` — 32 שבועות · 128 שעות · 8 units · CEFR Pre-A1 → A1.

## item schema (TBD)

מבוסס על schema של אבני יסוד (ראה `_reference/avnei-yesod-architecture-mvp.md` §6.3) עם התאמות לאנגלית:

- `strand_id` (1-5) — נדרש מיפוי מחדש לפדגוגיה של אנגלית
- `cefr_level` (Pre-A1, A1, A2, B1) — חדש
- `track_id` (1-4) — 4 רמות הצבע מ-demo: בסיסי / בינוני / מתקדם / העמקה
- `unit_id` — מקושר ליחידה תמטית
- `envelope` — מעטפת משחק (חופף לאבני יסוד)
