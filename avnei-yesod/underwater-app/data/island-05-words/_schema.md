# `data/island-05-words/` — Schema

**אי 5: מיזוג צירופים למילים** · סוכן 30 · 30.5.2026

מקור-האמת לתוכן של אי 5. **סנכרון: כל מילה חייבת להיות זהה ל-`WORDS_2CV` / `WORDS_3CV` / `WORDS_4CV` ב-`js/shared/word-adapter.js`** (test-word-adapter.js בודק).

## קבצים

- `words-level-1.json` — 2-letter words (sub-BKT bucket `'2cv'`)
- `words-level-2.json` — 3-letter words (sub-BKT bucket `'3cv'`)
- `words-level-3.json` — 4-letter words (sub-BKT bucket `'4cv'`)

## Schema פר מילה

```json
{
  "text":         "בַּת",                                   // מנוקדת מלאה, ב/כ/פ דגש בתחילה חובה
  "key":          "bet-tav-bat",                           // ASCII slug — יציב, לאודיו ול-localStorage
  "level":        "2cv",                                   // '2cv' | '3cv' | '4cv'
  "letter_count": 2,                                       // מספר אותיות בסיס (ללא ניקוד)
  "first_letter": "ב",                                     // האות הראשונה — לחיבור ל-BKT sub-letter
  "meaning_he":   "בת",                                    // תרגום פנימי קצר (לדשבורד מורה — לא לתלמיד)
  "source":       "vocab-bank.book_2_station_8",           // איזה station ב-vocab-bank
  "anchor_image": null                                     // null אם לא קיים — match-word-to-image ייפול ל-MCQ טקסטואלי
}
```

## כללים מחייבים

### 🔴 ב/כ/פ דגש קל בתחילת הברה

כל מילה שמתחילה ב-ב/כ/פ — **חובה** דגש קל (U+05BC) אחרי הניקוד הראשון. בלי דגש,
AvriNeural מבטא /v·x·f/ במקום /b·k·p/.

- ✓ `בַּת` (/bat/) — נכון
- ✗ `בַת` (/vat/) — bug

ראה: `reference-hebrew-bgd-kpt-dagesh-rule`.

המקור: `vocab-bank.json` כבר כתוב נכון (`בָּרָק`, `בַּת`, `בָּלוֹן`). אסור לערוך כתב יד.

### Vocab-bank only

**אסור להמציא מילים** (החלטת תזמורת מיטל #1, 30.5.2026). כל מילה חייבת להיות מאומתת
מ-`curriculum/vocab-bank.json`. אם חסר vocab למילה מתאימה פדגוגית — לתעד ב-`_handoff/2026-05-30-island-05-vocab-gaps.md` ולא להוסיף.

### Niqud מלא

כל המילים מנוקדות מלא — תלמידה כיתה א' לא קוראת שוטף. ראה
`feedback-avnei-yesod-niqud-on-student-screens`.

## איך לעדכן

1. ערכי את ה-JSON המתאים.
2. **עדכן בו-זמנית** את `js/shared/word-adapter.js` (WORDS_2CV / WORDS_3CV / WORDS_4CV).
3. הריצי `node scripts/test-word-adapter.js` — סנכרון JSON ↔ adapter נבדק.
4. אם יש חוסר → לתעד ב-`_handoff/2026-05-30-island-05-vocab-gaps.md` ולשאול את מיטל.

## אומדן MVP (אחרי עדכון 30.5.2026 — אופציה A)

- Level 1 (2cv): **19 מילים** (יעד bootstrap: 20). פער: -1.
- Level 2 (3cv): **30 מילים** ✓ (יעד: 30).
- Level 3 (4cv): **11 מילים** (יעד: 15). פער: -4 (שאלה פתוחה על צִינוֹר).
- **סה"כ MVP: 60 מילים מאומתות** (מתוך יעד 65).

הפער הסופי = -5 מילים (1 ב-Level 1 · 4 ב-Level 3). מספיק לפיילוט פיילוט-פיילוט-פיילוט.
ראה `_handoff/2026-05-30-island-05-vocab-gaps.md` להיסטוריה ולשאלה הפתוחה.
