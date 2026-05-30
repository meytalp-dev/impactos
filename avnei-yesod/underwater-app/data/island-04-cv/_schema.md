# Island 4 — אות-ניקוד-צליל (CV) · data schema

**מקום:** `underwater-app/data/island-04-cv/`
**שימוש:** מאגר 154 CV pairs (22 אותיות × 7 vowels). מוזן ל-`vowel-adapter.js`
ול-`stage-4-cv-tap.html` כדי לבנות סבבי tap-cv.
**גרסה:** v1 · 29.5.2026 · סוכן 29 · אי 4 (CV)

---

## הוראת תזמורת — חובה לקרוא לפני שינוי

1. **Sub-BKT = פר אות בלבד** (לא פר CV pair, לא פר vowel). 22 BKT states. נקודה.
   מקור: זיכרון `feedback-orchestrator-multi-vscode-parallel-pattern` + bootstrap.
   → אסור להוסיף שכבת BKT חדשה לקובץ הזה.

2. **אודיו = Web Speech he-IL בלבד.** לא להפיק MP3 ל-CV pairs בשלב זה.
   → `mechanic-tap-cv.js` קורא `SpeechSynthesisUtterance(cv, 'he-IL')`.

3. **Vocab חסר?** לבקש ממיטל. לא להמציא. שדה `anchor_word: null` מסומן בכוונה.

---

## קבצים

| קובץ | תיאור |
|---|---|
| `cv-pairs.json` | מאגר הראשי. 154 ערכים (22 × 7). |
| `_schema.md` | המסמך הזה. |

**אין** קבצי MP3 ב-MVP. כשתתווסף AvriNeural post-pilot — תיווצר תיקיית `audio/`
בהיררכיה מקבילה (ראה `data/island-03-letters` לתבנית).

---

## סכמת cv-pairs.json

```jsonc
{
  "$schema_version": "1.0",
  "created": "2026-05-29",
  "agent": "סוכן 29 · אי 4",

  "_meta": {
    "letters_count": 22,
    "vowels_count": 7,
    "total_pairs": 154,
    "audio_strategy": "web-speech-he-il (post-pilot: AvriNeural MP3)",
    "anchor_word_source": "vocab-bank.json — seeded manually, nulls = ASK Meytal"
  },

  "vowels": [
    { "id": "kamatz", "symbol": "ָ", "he": "קמץ", "phoneme": "/a/", "book": 2 },
    { "id": "patach", "symbol": "ַ", "he": "פתח", "phoneme": "/a/", "book": 2 },
    { "id": "shva",   "symbol": "ְ", "he": "שווא", "phoneme": "/ə/ או שתיקה", "book": 2 },
    { "id": "hiriq",  "symbol": "ִ", "he": "חיריק", "phoneme": "/i/", "book": 3 },
    { "id": "holam",  "symbol": "ֹ", "he": "חולם", "phoneme": "/o/", "book": 4 },
    { "id": "tzere",  "symbol": "ֵ", "he": "צירי", "phoneme": "/e/", "book": 4 },
    { "id": "segol",  "symbol": "ֶ", "he": "סגול", "phoneme": "/e/", "book": 4 }
  ],

  "pairs": [
    {
      "letter": "מ",           // תו עברי בודד (תואם ALL_HEBREW_LETTERS_22 ב-bkt.js)
      "letter_key": "mem",     // מפתח לטיני (תואם sound-mem.mp3 באי 3)
      "vowel_id": "patach",    // תואם vowel-adapter.VOWELS[*].id
      "cv": "מַ",              // letter + combining niqud
      "key": "מ:patach",       // canonical pair key (תואם cvKey(letter, vowel_id))
      "phoneme": "/ma/",       // הגייה למבוגרים — לא להציג לילדה
      "anchor_word": "מַטֶּה", // מילה שמתחילה ב-CV (מקור: vocab-bank). null אם חסר.
      "anchor_source": "book_2_station_1"  // שדה דיאגנוסטי — מאיפה נשלפה
    }
    // ... 153 נוספים
  ]
}
```

---

## כללי anchor_word (מקור pedagogi)

- **חייב להתחיל ב-CV עצמו.** "מַ" → המילה חייבת להתחיל "מַ..."
- **מנוקד מלא** (לפי `feedback-avnei-yesod-niqud-on-student-screens` — מסכי תלמיד.ה).
- **מאוצר vocab-bank** (לפי הוראת תזמורת — לא להמציא).
- **אם חסר**: `anchor_word: null` + `anchor_source: "ASK_MEYTAL"`.

---

## רצף הצגה מומלץ (לפי vocab-bank.complete_niqqud_sequence)

חוברת 2 (חודשים נוב-דצמ): קמץ + פתח (= /a/) → שווא
חוברת 3 (חודש ינואר): חיריק
חוברת 4 (פב-מר): חולם → צירי + סגול
חוברת 5 (אפר-מאי): קובוץ + שורוק (= /u/) — **לא במאגר!** post-pilot.

**הערה:** קובוץ + שורוק לא ב-VOWELS של MVP. הם מבטאים /u/ אבל מטח מציגים
אותם בחוברת 5. ייכנסו ל-vowel-adapter רק אחרי מאי 2027 (סוף שנה ראשונה).

---

## API לקריאה

ה-data מוזן רק דרך `js/shared/vowel-adapter.js`:

```js
const VA = window.AvneiVowelAdapter;
VA.getAllCVPairs();                          // 154
VA.getAllCVPairs({ books: [2] });            // 66 (קמץ + פתח + שווא)
VA.getAllCVPairs({ letters: ['מ'] });        // 7 (כל ה-vowels על מ)
VA.buildCV('מ', 'patach');                   // "מַ"
VA.getAnchorWord('מ', 'patach');             // "מַטֶּה" או null
VA.getTopWeakCVs('s1', 3);                   // נגזר מ-AvneiBKT.getWeakestLetters
```

`stage-4-cv-tap.html` קורא רק דרך ה-API — לא ישירות מ-cv-pairs.json.
