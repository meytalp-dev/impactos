# משימות שלי — אבני יסוד

> **מטרת הקובץ:** משימות שדורשות פעולה ידנית של מיטל (לא של סוכן).
> סוכנים שמזהים צורך כזה — מוסיפים בלוק חדש בראש הקובץ.
>
> דוגמאות: יצירת קבצי TTS · יצירת תמונה ב-ChatGPT · רישום ל-Google Sheet · בדיקה ידנית · החלטה פדגוגית.

---

## ✅ A0.3 — Mastery משולש (הושלם ונדחף 27.5.2026)

**סטטוס:** ✅ הקוד נדחף · flow אומת קצה-לקצה ע"י מיטל ב-localhost
**מאמת:** סקציה 6 בדשבורד הציגה p=95% לאי 3 + שטף 6.1שנ' + 1/5 אותיות (לא נסגר — כצפוי, כי שיחקה רק את הצדף).

### החלטה פדגוגית פתוחה (לא חוסם — לחזור אליה כשנפתח אי 7-9)

- [ ] ספי שטף לאיים 7-9 — כרגע default 4.0שנ' פנימי. לעדכן כשמגדירים מה כל אי באמת בודק.

---

## 🎙️ A0.4 — 33 קבצי MP3 ל-"ים השמועות"

**נוסף ע"י סוכן A0.4 · 2026-05-26**
**סטטוס:** ⏳ ממתין להקלטה
**יעד תיקייה:** `underwater-app/audio/stage-2-whispers/`
**קול חובה:** AvriNeural בלבד (לא Hila)

### 8 מטא (הוראות והדגמות)
- [ ] `intro-whispers.mp3` — "ברוכים הבאים לים השמועות"
- [ ] `intro-whispers-mission.mp3` — "מצאו את הזוגות שמסתיימות באותו צליל"
- [ ] `whispers-question-find-pairs.mp3` — "איזה זוג מסתיים באותו צליל?"
- [ ] `whispers-feedback-correct-pair.mp3` — "כל הכבוד! זוג!"
- [ ] `whispers-feedback-wrong-pair.mp3` — "אופס, נסי שוב"
- [ ] `whispers-feedback-try-again.mp3` — "נסי שוב"
- [ ] `whispers-hint-listen-to-ends.mp3` — "הקשיבי לצליל בסוף"
- [ ] `whispers-finale-complete.mp3` — "מצוין! פתרת את ים השמועות!"

### 5 phoneme-end (צלילי סוף)
- [ ] `phoneme-end-mmm.mp3` — "ם"
- [ ] `phoneme-end-nnn.mp3` — "ן"
- [ ] `phoneme-end-shh.mp3` — "ש"
- [ ] `phoneme-end-rrr.mp3` — "ר"
- [ ] `phoneme-end-lll.mp3` — "ל"

### 20 word-* (חדשים — לא ניתנים לשימוש חוזר)
**סיומת -ם (4):** `word-yom.mp3` · `word-adam.mp3` · `word-shalom.mp3` · `word-halom.mp3`
**סיומת -ן (4):** `word-shulhan.mp3` · `word-shaon.mp3` · `word-galon.mp3` · `word-aron.mp3`
**סיומת -ש (4):** `word-rosh.mp3` · `word-ish.mp3` · `word-kvish.mp3` · `word-hamesh.mp3` (אם אומת)
**סיומת -ר (4):** `word-sukar.mp3` · `word-sefer.mp3` · `word-shir.mp3` · `word-shaar.mp3`
**סיומת -ל (4):** `word-hatul.mp3` · `word-pil.mp3` · `word-nahal.mp3` · `word-migdal.mp3` (אם אומת)

### 10 word-* (שימוש חוזר מ-twin-seaweeds — לא דורש הקלטה)
✅ קיימים: `word-mayim` · `word-lehem` · `word-shemesh` · `word-namer` · `word-ner` · `word-limon` · `word-gan` · `word-balon` · `word-nahal` (זה כפול ברשימה — לוודא)

**רשימה מלאה ומעודכנת:** `underwater-app/data/island-02-whispers.json` בשדה `audio_keys_required`.

**הערה:** "תיש" ו"מגדל" ממתינים לאימות (Perplexity / vocab-bank). אם נכשלים — להחליף לפי הצעת האורקסטרטור (תיש → רעש/דובש · מגדל → חבל/כלב) ולעדכן את רשימת ה-MP3 בהתאם.

---

## תבנית למשימה חדשה

```markdown
## [סוג: 🎙️/🖼️/📊/⚠️] [שם המשימה]

**נוסף ע"י:** [סוכן + משימה] · YYYY-MM-DD
**סטטוס:** ⏳ ממתין / 🟡 בתהליך / ✅ בוצע
**יעד תיקייה:** [נתיב] (אם רלוונטי)

[פרטי המשימה — checkboxes לפריטים שצריך לעשות]

[הערות / תלויות]
```

---

*כלל: בלוק חדש בראש הקובץ. סמני ✅ כשמסיימת — לא למחוק (היסטוריה).*
