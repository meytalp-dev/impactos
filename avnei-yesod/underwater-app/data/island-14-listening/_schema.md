# Schema — אי 14 הבנת הנשמע

> סוכן 31 · 29.5.2026

## קבצים

- `passages-level-1.json` — 10 סיפורים קצרים (3-4 משפטים), שאלה אחת לכל סיפור
- `passages-level-2.json` — 10 סיפורים בינוניים (5-7 משפטים), 2-3 שאלות לכל סיפור
- `passages-level-3.json` — 5 סיפורים ארוכים (8-10 משפטים), שאלת היסק לכל סיפור

## תוכן הקבצים

### Header `_meta`

```json
{
  "_meta": {
    "level": 1,
    "description": "...",
    "passages_count": 10,
    "questions_count": 10,
    "created": "2026-05-29",
    "source": "...",
    "niqud_policy": "fully voweled per feedback-avnei-yesod-niqud-on-student-screens"
  },
  "passages": [ ... ]
}
```

### Item structure

```json
{
  "item_id": "isle14-l1-001",
  "level": 1,
  "passage_text": "<טקסט מנוקד מלא — 3-10 משפטים>",
  "questions": [
    {
      "q_id": "isle14-l1-001-q1",
      "skill": "identify-hero | sequence | inference",
      "question_text": "<שאלה מנוקדת>",
      "options": [
        { "text": "<אפשרות מנוקדת>", "correct": true },
        { "text": "<אפשרות מנוקדת>", "correct": false },
        { "text": "<אפשרות מנוקדת>", "correct": false }
      ]
    }
  ]
}
```

## תיוג skill

| skill | מה זה | דוגמת שאלה |
|---|---|---|
| `identify-hero` | זיהוי גיבור / פרט מפורש בטקסט | "מי הלך לגן?", "מה דנה אכלה?" |
| `sequence` | סדר אירועים בסיפור | "מה קרה ראשון?", "מה קרה בסוף?" |
| `inference` | היסק — לא מילולי בטקסט אבל מתבקש ממנו | "למה איתי הביא מטרייה?", "איך נעה הרגישה בסוף?" |

## כללי תוכן

- **ניקוד מלא** — passage_text, question_text, options[].text. ראה `reference-hebrew-niqud-rules`.
- **גוון דמויות** — בנים ובנות באותה תדירות, ≥ 8 שמות שונים בקובץ.
- **גוון תוכן** — לא רק חינוך. גם משחק, חברים, ניהול זמן יומיומי, יזמות זעירה (דוכן לימונדה), שיווק קליל. ראה הנחיה גלובלית CLAUDE.md.
- **לא להעתיק מ-MOY** — תוכן שונה לחלוטין מ-30 ה-passages ב-`engine/moy-items.json` task_3. אי 14 = תרגול, MOY = מבחן.

## Validation

טסטים ידאגו:
1. כל קובץ JSON תקין parses.
2. כל item יש `item_id` ייחודי בפורמט `isle14-l{N}-NNN`.
3. כל question יש `q_id`, `skill` חוקי, ≥ 3 options.
4. בדיוק אפשרות אחת `correct: true` בכל שאלה.
5. כל text fields שאינם ריקים.
6. `_meta.passages_count` תואם `passages.length`.

## איך הקבצים נטענים

`js/shared/oral-skill-adapter.js` → `loadPassages(level)` → `fetch('data/island-14-listening/passages-level-' + level + '.json')`.

המכניקה (`mechanic-listen-mcq.js`) קוראת ל-`getRandomBatch(level, n)` שמחזיר items שטוחים (1 passage × 1 question — לא nested), כדי שהמשחקון יוכל לדרוס את ה-flow אחד-אחרי-השני.

## Mastery

- mastery פר skill = 70%+ accuracy עם ≥ 5 ניסיונות (ראה `oral-skill-adapter.js: MASTERY_THRESHOLD`).
- mastery כללי לאי 14 = כל 3 ה-skills mastered.
- ראה `js/shared/mastery-check.js` — אי 14 נקשר ל-RAMA task 3 (הבנת טקסט מושמע).
