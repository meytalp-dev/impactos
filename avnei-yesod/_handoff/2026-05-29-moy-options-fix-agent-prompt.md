# Handoff — סוכן 26: MOY-Lite Options Fix (IPA → עברית + audio per option)

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. תיקון חמור של MOY-Lite — אנגלית IPA במקום עברית + חוסר אודיו על תשובות.

---

## משימה

תיקון 2 bugs חמורים שזיהתה מיטל ב-`engine/moy-screener.html`:

1. **🔴 102 options ב-IPA אנגלי** — `{'text': '/sh/'}`, `{'text': '/m/'}`, `{'text': '/e/'}` במקום עברית. ילדה בכיתה א' לא יודעת IPA → לא יכולה לבחור!
2. **🟠 אין אודיו על כפתורי תשובה** — ילדה שעוד לא קוראת שוטף לא יכולה לקרוא `שׁ` vs `מ` vs `אֶ`.

**ההחלטות הפדגוגיות של מיטל (29.5.2026 ערב):**
- Bug 1 → **אופציה D: אות + ניקוד + 🔊** (לדוגמה: `שׁ` במקום `/sh/`)
- Bug 2 → **אופציה A: 🔊 ליד כל אופציה** (3 כפתורי אודיו פר item, אופציונליים)

**אומדן:** 2-3 שעות (1.5h data fix + 1h UI/audio + 30 דק' tests).

## הקשר

`moy-items.json` מכיל 60 פריטים מאושרים פדגוגית (28.5.2026). 30 פריטים ב-task_3 (תקינים — passage + question + 4 options עבריות). 30 פריטים ב-task_4 (מודעות פונולוגית) — **רבע מהם ב-IPA אנגלי**, מה שהופך אותם לא ניתנים לשימוש.

## קבצי-מקור — חובה לקרוא לפני עבודה

1. **Items file:** `avnei-yesod/engine/moy-items.json` — 60 פריטים.
   - בעיה ספציפית ב-task_4 (`sub_type` של opening_phoneme · closing_phoneme · phoneme_isolation · phoneme_match · phoneme_count) — IPA במקום עברית.
2. **Screener:** `avnei-yesod/engine/moy-screener.html` — ה-UI שמרנדר את ה-options.
3. **MOY spec:** `avnei-yesod/_handoff/2026-05-28-MOY-diagnostic-spec.md` — מקור פדגוגי.
4. **Memory חובה:**
   - `feedback-avnei-yesod-niqud-on-student-screens` — כל טקסט שילדה רואה = מנוקד מלא
   - `reference-hebrew-niqud-rules` — כללי ניקוד שעלו ב-validation
5. **Tests חובה לעבור:** `avnei-yesod/underwater-app/scripts/test-moy-assessments.js` (51/51) + `test-moy-intervention-link.js` (51/51).

## דוגמאות לפני/אחרי

### לפני (Bug · IPA)
```json
{
  "item_id": "moy-4a-001",
  "sub_type": "opening_phoneme",
  "word": "שֶׁמֶשׁ",
  "instruction_text": "מָה הַצְּלִיל הָרִאשׁוֹן בַּמִּילָה שֶׁמֶשׁ?",
  "options": [
    {"text": "/sh/", "correct": true},
    {"text": "/m/",  "correct": false},
    {"text": "/e/",  "correct": false}
  ]
}
```

### אחרי (Fixed · אות + ניקוד)
```json
{
  "item_id": "moy-4a-001",
  "sub_type": "opening_phoneme",
  "word": "שֶׁמֶשׁ",
  "instruction_text": "מָה הַצְּלִיל הָרִאשׁוֹן בַּמִּילָה שֶׁמֶשׁ?",
  "options": [
    {"text": "שׁ", "audio_text": "הַצְּלִיל שׁ", "correct": true},
    {"text": "מ",  "audio_text": "הַצְּלִיל מ",  "correct": false},
    {"text": "אֶ", "audio_text": "הַצְּלִיל אֶ", "correct": false}
  ]
}
```

**הסבר:**
- `text` — מה שילדה רואה בכפתור (אות בודדת עם ניקוד מינימלי)
- `audio_text` — מה ש-Web Speech / AvriNeural יקרא כשלוחצים 🔊 (מילה שלמה מנוקדת)

## מיפוי IPA → עברית — טבלה פדגוגית

| IPA | אות עברית | audio_text | הערה |
|---|---|---|---|
| /sh/ | `שׁ` | הַצְּלִיל שׁ | shin עם נקודת shin |
| /s/  | `ס` | הַצְּלִיל ס | |
| /m/  | `מ` | הַצְּלִיל מ | |
| /n/  | `נ` | הַצְּלִיל נ | |
| /b/  | `בּ` | הַצְּלִיל בּ | bet עם דגש |
| /p/  | `פּ` | הַצְּלִיל פּ | pe עם דגש |
| /k/  | `כּ` | הַצְּלִיל כּ | kaf עם דגש |
| /r/  | `ר` | הַצְּלִיל ר | |
| /l/  | `ל` | הַצְּלִיל ל | |
| /t/  | `ת` | הַצְּלִיל ת | |
| /d/  | `ד` | הַצְּלִיל ד | |
| /g/  | `גּ` | הַצְּלִיל גּ | gimel עם דגש |
| /h/  | `ה` | הַצְּלִיל ה | |
| /y/  | `י` | הַצְּלִיל י | yud |
| /v/  | `ו` | הַצְּלִיל ו | vav |
| /z/  | `ז` | הַצְּלִיל ז | |
| /x/  | `ח` | הַצְּלִיל ח | חית גרונית |
| /a/  | `אַ` | הַתְּנוּעָה אַ | פתח |
| /e/  | `אֶ` | הַתְּנוּעָה אֶ | סגול |
| /i/  | `אִ` | הַתְּנוּעָה אִ | חיריק |
| /o/  | `אוֹ` | הַתְּנוּעָה אוֹ | חולם |
| /u/  | `אוּ` | הַתְּנוּעָה אוּ | שורוק |

⚠️ **אם מצאת IPA שלא בטבלה — לעצור ולשאול את מיטל.** אסור להמציא.

## משימות (להריץ ברצף)

### Phase A — Data Fix (1-1.5 שעות)

1. ☐ קרא את כל קבצי המקור + הטבלה לעיל.
2. ☐ סרוק את `moy-items.json` task_4 — אתר את **כל** ה-options עם IPA (regex `/[a-z]+/`).
3. ☐ **עבד פר sub_type:**
   - opening_phoneme (5 items) — תקן + הצג מיטל את 5 ה-items הראשונים לאישור פר item
   - closing_phoneme (5 items) — אחרי אישור opening, תקן + הצג
   - count_syllables (10 items) — האם options בעברית כבר? בדוק. אם כן — דלג.
   - phoneme_isolation (4 items) — תקן + הצג
   - phoneme_match (3 items) — תקן + הצג
   - phoneme_count (3 items) — האם options מספרים? כן? דלג. אם IPA — תקן.
4. ☐ עדכן `_meta.corrections_applied` ב-`moy-items.json` — להוסיף entry: "29.5.2026 ערב: 102 IPA options → עברית + audio_text (סוכן 26)".
5. ☐ סקירה ידנית של מיטל פר sub_type (5 אישורים).

### Phase B — Test Update (15 דק')

6. ☐ הריצי `test-moy-assessments.js` — אם נשבר → קרא את ה-test וודא ש-`options[0].text` עדיין עובד (זה אמור).
7. ☐ אם ה-test בודק `text === '/sh/'` — עדכן ל-`text === 'שׁ'`.

### Phase C — UI Audio Button (1 שעה)

8. ☐ ב-`engine/moy-screener.html` — מצא את הפונקציה שrender options (`renderOptions` או דומה).
9. ☐ הוסף ליד כל `<button class="option-btn">` כפתור אודיו קטן:
   ```html
   <div class="option-row">
     <button class="option-btn" data-idx="0">שׁ</button>
     <button class="option-audio-btn" data-idx="0" aria-label="הקראת התשובה">🔊</button>
   </div>
   ```
10. ☐ הוסף CSS:
    ```css
    .option-row { display: flex; align-items: center; gap: 8px; }
    .option-row .option-btn { flex: 1; }
    .option-audio-btn {
      background: #fff;
      border: 2px solid var(--violet);
      color: var(--violet-deep);
      width: 48px; height: 48px;
      border-radius: 50%;
      font-size: 20px;
      flex-shrink: 0;
      cursor: pointer;
    }
    .option-audio-btn:hover { background: var(--lavender-light); }
    ```
11. ☐ הוסף JS event handler:
    ```js
    document.querySelectorAll('.option-audio-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();  // לא לבחור את האופציה
        const idx = parseInt(btn.dataset.idx);
        const opt = currentItem.options[idx];
        speakHe(opt.audio_text || opt.text);
      });
    });
    
    function speakHe(text) {
      // עדיף AvriNeural MP3 אם קיים, אחרת Web Speech
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'he-IL';
        u.rate = 0.85;  // איטי יותר לכיתה א'
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      }
    }
    ```
12. ☐ ודא: כפתור-אודיו לא בוחר את האופציה (stopPropagation).

### Phase D — Integration Tests + Manual (30 דק')

13. ☐ הריצי `test-moy-assessments.js` ו-`test-moy-intervention-link.js` — חייבים 51/51 + 51/51.
14. ☐ בדיקה ידנית של מיטל: פתחי `moy-screener.html?student=test&task=4` → לוודא שכל אופציה עברית + 🔊 עובד.
15. ☐ עדכן `agent-completion-log.md` בלוק חדש.
16. ☐ דווחי למיטל: "סוכן 26 סיים · X options תוקנו · audio buttons חיים · 51+51 tests ✓ · ממתין לאישור push".

## Acceptance Criteria

- [ ] אפס `/[a-z]+/` IPA ב-`moy-items.json` task_4 options.
- [ ] כל option עם `text` (עברית) + `audio_text` (משפט מלא להקראה) + `correct` (boolean).
- [ ] `_meta.corrections_applied` עודכן.
- [ ] UI: כפתור 🔊 ליד כל אופציה.
- [ ] Audio: Web Speech he-IL פועל בלחיצה.
- [ ] Audio לא בוחר את האופציה (stopPropagation).
- [ ] **51/51** test-moy-assessments + **51/51** test-moy-intervention-link.
- [ ] בדיקה ידנית של מיטל ✓ (פר sub_type לפחות 1 item).

## אסור לך

- ❌ לערוך moy-items.json **בלי אישור פר sub_type** של מיטל (תוכן פדגוגי).
- ❌ להמציא mapping של IPA לעברית — להישאר בטבלה. אם חסר — לשאול.
- ❌ לערוך משימה 3 (passages + questions) — היא תקינה.
- ❌ לשנות mechanic של MOY (10 random + 22 balanced) — רק UI של options.
- ❌ לדחוף ל-git בלי אישור.
- ❌ לערוך teacher-rama/teacher-action — לא קשור.
- ❌ "תכונות חכמות" — לא להוסיף animations, לא loading spinners, לא ML.

## בספק

שאלי את מיטל. במיוחד אם:
- IPA לא בטבלה (לדוגמה `/zh/`, `/dj/`).
- options ב-`count_syllables` או `phoneme_count` הם מספרים (1, 2, 3, 4) — צריך audio? איזה? "אֶחָד · שְׁתַּיִם · שָׁלוֹש"?
- ה-test נשבר מסיבה שלא הבנת — תיעדי + לעצור.

## תיאום עם סוכנים פעילים

- סוכן 25 (a11y fixes) — אם רץ במקביל ב-moy-screener.html → conflict ב-HTML/CSS. `git fetch && git status` תחילה.
- סוכן 23 (6 packs) — אין חפיפה (curriculum/packs).
- סוכן 21 (interventions) — אין חפיפה.

---

*Bootstrap סוכן 26 — תיקון חמור של MOY-Lite. אחרי הסיום: MOY מוכן לפיילוט.*
