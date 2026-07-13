# מישמיש · ריכוז מלא — משימות שנותרו + נכסי GPT (13.7)

> כל 21 המשימות כבר קיימות בלוח `2026-07-13-mishmish-minigames-board.html` עם פרומפט מלא.
> המסמך הזה מרכז במקום אחד את מה שנותר + את כל נכסי-GPT החסרים עם הנחיה מוכנה לכל נכס.
> **done (8):** F1·F2·F4·F6 · M1·M2·M3 · P1  ·  **doing (2):** F5·P5  ·  **todo (11):** F3·M4·M5·M6·B1·P2·P3·P4·P6·P7·P8  ·  **+ תיקון M3-resolver**

---

## חלק א׳ — משימות בנייה שנותרו

| # | משימה | קבצים (בעלוּת) | פרומפט |
|---|---|---|---|
| 🔴 עדיפות | **F5 · אודיו אמיתי** (סגירה) | `scripts/generate-mishmish-audio.py` + clipMap ב-`audio.js` | כרטיס F5 בלוח / למטה |
| 🔴 חוסם P1 | **תיקון M3 · resolver** | `mechanic-missing-slot.js` | ראה למטה (אין כרטיס — משימה חדשה) |
| 1 | **F3 · רכיב-אמיר** | `js/shared/amir.js` | כרטיס F3 |
| 2 | **M4 · grammar-toggle** | `mechanic-grammar-toggle.js` + `.html` | כרטיס M4 |
| 3 | **M5 · follow-instr** | `mechanic-follow-instr.js` + `.html` | כרטיס M5 (צריך נכסי locations) |
| 4 | **M6 · roleplay** | `mechanic-roleplay.js` + `.html` | כרטיס M6 (תלוי F3+F4; ASK מיטל) |
| 5 | **B1 · בוס-מעבר** | `mechanic-passage.js` + `.html` | כרטיס B1 (צריך bg-passage) |
| 6 | **P2 · family** | `data/pack-family.json` | כרטיס P2 (שער-עאמייה) |
| 7 | **P3 · colors** | `data/pack-colors.json` | כרטיס P3 |
| 8 | **P4 · body** | `data/pack-body.json` | כרטיס P4 |
| 9 | **P6 · home** | `data/pack-home.json` | כרטיס P6 |
| 10 | **P7 · nature** | `data/pack-nature.json` | כרטיס P7 |
| 11 | **P8 · hobbies** | `data/pack-hobbies.json` | כרטיס P8 |

> **תיאום:** מכניקה=קוד / pack=דאטה → כל אחד קובץ נפרד = בטוח במקביל. אף סוכן לא מריץ `_build-data.js` — התזמורת בונה באינטגרציה. כל pack עובר שער עברית (מיטל) + שער עאמייה (מגודרת עד בודק/ת ילידי/ת — ראה `PENDING-native-arabic-review.md`).

### פרומפט F5 (סגירת האודיו — עדיפות)
```
אתה סוכן בפרויקט impactos/mishmish. משימה: להקשיח את צינור-האודיו הדו-לשוני.

רקע חובה: src/js/audio.js (clipMap → assets/audio/<key>.mp3, סדר קליפ→WebSpeech→שקט; ARABIC_VERIFIED=false נעול). למד מצינור ההפקה של אבני יסוד (scripts/generate-*.py + _eleven_tts.py, PYTHONIOENCODING=utf-8, QA Whisper) ומ-lumi.

מה לבנות: (א) scripts/generate-mishmish-audio.py — מייצר קליפי-יעד עברית (קול-מישמיש, ElevenLabs) לכל מפתחות-האודיו ב-packs הקיימים: mapping (item.audio_he), market (item.audio_he), class (lexeme.audio_he='lex/*' + pattern.audio_frame='pat/*') + amir_hints.he מ-scaffold.json. clipMap ממפה key→assets/audio/<key>.mp3. (ב) הפרדת-קול: יעד עברית=קול-מישמיש; פיגום עאמייה=קול-אמיר — 🔴 עאמייה נשארת מגודרת (לא מיוצרת/מושמעת) עד אישור רגיסטר+בודק ילידי; הכן hook בלבד. (ג) QA: תמלל כל קליפ ב-Whisper ואמת מול הטקסט (אתה לא שומע). בשבחים אסור "יופי" — מצוין/מעולה.

שמור על החוזה MishmishAudio.hebrew(text,{key,slow,statusEl}) — אל תשבור את measured.js/lantern.js/המכניקות. אל תריץ _build-data.js.

[+ הבלוק המשותף מהלוח: WORLD_RULES + FORBIDDEN + REPORT_PROTOCOL]
```

### פרומפט תיקון-M3 (resolver — משחרר את P1 לשחק)
> ראה גרסה מלאה בהודעת-הצ׳אט הקודמת. תקציר: בקובץ `mechanic-missing-slot.js` — `patterns[].slots` הם מזהי-lexeme (מחרוזות, סכמה §2), לפתור מול `pack.lexicon` (he/img/emoji/audio_he/pb_focus מ-sound_tags), לסנן patterns עם `___` בלבד, frame ממוגדר (frame_f לנקבה), תאימות-לאחור ל-fixture. אימות: `missing-slot.html?pack=class`.

---

## חלק ב׳ — נכסי GPT חסרים (הנחיה מוכנה לכל נכס)

**מה שכבר יש (לא לבקש):** class (6 ✓) · food (3: apple/banana/orange) · רקעים hara/market/park.
**כלל-על לכל הנכסים:** עוגן-סגנון = `item-banana.png` הקיים. אל תשלח לפני שבדקת התאמת-סגנון אליו.

### 1. P5 · מאכלים נוספים (6) → `assets/items/food/`
```
מקבל: item-banana.png הקיים כעוגן-סגנון (התאם אליו בדיוק). צור סט מאכלים נוספים, כל אחד כקובץ PNG שקוף נפרד (alpha), 1500×1500, sRGB, אובייקט אחד מרכזי נקי, בלי רקע, בלי צל-קרקע, בלי מסגרת, בלי טקסט. אותו סגנון-איור בדיוק כמו item-banana (שטוח-רך, קו נקי, פלטה חמה). האובייקטים: item-bread (כיכר לחם) · item-cheese (גבינה צהובה) · item-tomato (עגבנייה) · item-cucumber (מלפפון) · item-grapes (אשכול ענבים) · item-milk (קרטון חלב). שמור על גודל-יחסי עקבי עם הפירות הקיימים. מיפוי-יעד: assets/items/food/
```

### 2. P2 · אווטארי בני-משפחה (6) → `assets/items/family/`
```
מקבל: את גיליון-הדיזיין של מישמיש (סגנון) + item-banana.png לעקביות-קו. צור סט אווטארי בני-משפחה, כל אחד כקובץ PNG שקוף נפרד (alpha), 1500×1500, sRGB, דמות בודדת מרכזית (חצי-גוף/פנים+כתפיים), בלי רקע, בלי צל, בלי מסגרת, בלי טקסט. סגנון-איור שטוח-רך ידידותי לגיל 5-8, פלטה חמה, גיוון-מראה מכבד ומגוון (שיער/גוונים) בלי סטריאוטיפ. הדמויות: fam-mom (אמא) · fam-dad (אבא) · fam-grandma (סבתא) · fam-grandpa (סבא) · fam-sister (אחות ילדה) · fam-brother (אח ילד). אותו מרכוז וגודל-יחסי ב-6. מיפוי-יעד: assets/items/family/
```

### 3. P3 · עצמים צבעוניים (6) → `assets/items/colors/`
```
מקבל: item-banana.png כעוגן-סגנון. צור סט עצמים פשוטים בצבעים שונים, כל אחד PNG שקוף נפרד (alpha), 1500×1500, sRGB, אובייקט מרכזי נקי, בלי רקע/צל/מסגרת/טקסט. סגנון item-banana (שטוח-רך). כל עצם בצבע מובהק כדי ללמד את שם-הצבע: color-ball-red (כדור אדום) · color-ball-blue (כדור כחול) · color-ball-green (כדור ירוק) · color-ball-yellow (כדור צהוב) · color-flower-red (פרח אדום) · color-flower-blue (פרח כחול). הצבעים חייבים להיות רוויים וברורים. מיפוי-יעד: assets/items/colors/
```

### 4. P4 · חלקי-גוף + כרטיסי-רגש (8) → `assets/items/body/`
```
מקבל: item-banana.png כעוגן-סגנון + גיליון-מישמיש לרגשות. צור שני תת-סטים, כל פריט PNG שקוף נפרד (alpha), 1500×1500, sRGB, בלי רקע/צל/מסגרת/טקסט, סגנון שטוח-רך אחיד. (א) חלקי-גוף כאיורים ידידותיים: body-hand (יד) · body-head (ראש) · body-eye (עין) · body-foot (רגל). (ב) כרטיסי-רגש כפרצופים פשוטים וברורים (לא מישמיש — פרצוף גנרי-ידידותי): emo-happy (שמח) · emo-sad (עצוב) · emo-tired (עייף) · emo-scared (מפחד). הבעות מובחנות וברורות לגיל 5-8. מיפוי-יעד: assets/items/body/
```

### 5. P6 · חפצי-בית + מזג-אוויר (8) → `assets/items/home/`
```
מקבל: item-banana.png כעוגן-סגנון. צור שני תת-סטים, כל פריט PNG שקוף נפרד (alpha), 1500×1500, sRGB, בלי רקע/צל/מסגרת/טקסט, סגנון שטוח-רך אחיד עם item-banana. (א) חפצי-בית: home-bed (מיטה) · home-door (דלת) · home-window (חלון) · home-table (שולחן). (ב) מזג-אוויר: weather-sun (שמש) · weather-cloud (ענן) · weather-rain (גשם) · weather-wind (רוח). פלטה חמה, ידידותי לגיל 5-8. מיפוי-יעד: assets/items/home/
```

### 6. P7 · בעלי-חיים + צמחים (8) → `assets/items/nature/`
```
מקבל: item-banana.png כעוגן-סגנון. צור סט בעלי-חיים וצמחים, כל אחד PNG שקוף נפרד (alpha), 1500×1500, sRGB, אובייקט מרכזי נקי, בלי רקע/צל/מסגרת/טקסט. סגנון item-banana (שטוח-רך, ידידותי, פלטה חמה). האובייקטים: animal-cat (חתול — עקבי עם מישמיש בסגנון אך חתול גנרי) · animal-dog (כלב) · animal-bird (ציפור) · animal-fish (דג) · animal-butterfly (פרפר) · plant-tree (עץ) · plant-flower (פרח) · plant-leaf (עלה). גודל-יחסי עקבי. מיפוי-יעד: assets/items/nature/
```

### 7. P8 · תחביבים + מקצועות (8) → `assets/items/hobbies/`
```
מקבל: item-banana.png כעוגן-סגנון. צור סט פריטי-תחביב ומקצוע, כל אחד PNG שקוף נפרד (alpha), 1500×1500, sRGB, אובייקט מרכזי נקי, בלי רקע/צל/מסגרת/טקסט, סגנון item-banana (שטוח-רך, פלטה חמה). האובייקטים: hobby-ball (כדורגל) · hobby-bike (אופניים) · hobby-paint (מכחול+צבעים) · hobby-music (תו/כלי-נגינה) · job-doctor (רופא — דמות עם חלוק) · job-teacher (מורה) · job-cook (טבח) · job-driver (נהג). ידידותי לגיל 5-8, גיוון מכבד בדמויות-המקצוע. מיפוי-יעד: assets/items/hobbies/
```

### 8. M5 · אובייקטי-מיקום (3) → `assets/items/locations/`
```
מקבל: item-banana.png הקיים כעוגן-סגנון. צור סט אובייקטי-מיקום, כל אחד כקובץ PNG שקוף נפרד (alpha), 1500×1500, sRGB, אובייקט אחד מרכזי נקי, בלי רקע, בלי צל-קרקע, בלי מסגרת, בלי טקסט. אותו סגנון-איור בדיוק כמו item-banana (שטוח-רך, קו נקי, פלטה חמה משמש/זית/שמיים). האובייקטים (יעדי-מיקום להנחת פריטים "על / מתחת / ליד"): loc-table (שולחן-עץ פשוט) · loc-basket (סל-קש) · loc-shelf (מדף). שמור על גודל-יחסי עקבי, וקנבס שמאפשר להניח פריט קטן מעליהם/לידם. מיפוי-יעד: assets/items/locations/
```

### 9. B1 · רקע-מעבר (1) → `assets/backgrounds/bg-passage.png`
```
מקבל את גיליון-הדיזיין של מישמיש + bg-hara-courtyard.png כעוגן-סגנון. צור רקע-מעבר אחד: קובץ PNG (או JPG), יחס 16:9 מלא, מינימום 2400×1350, sRGB. בלי דמויות, בלי בני-אדם, בלי טקסט. פלטה חמה משמש/זית/שמיים, איור שטוח-רך ידידותי לגיל 5-8. התוכן: מעבר ויזואלי משמאל-לימין בין "החצר שלי" (צד ימין — חצר שכונתית חמה, שער-עץ) אל "המרחב המשותף" (צד שמאל — פארק/שוק פתוח), עם שער/קשת במרכז שדרכו עוברים. 🔴 השאר את השליש-התחתון והמרכז רגועים/פנויים לשכבת-UI. מיפוי-יעד: assets/backgrounds/bg-passage.png
```

---
*עודכן ע"י סוכן-התזמורת. עאמייה ממתינה → `PENDING-native-arabic-review.md`.*
