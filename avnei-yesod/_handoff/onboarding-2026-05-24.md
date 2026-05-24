# Onboarding Journey — תיעוד בנייה
## "המסע הראשון בים" · 23-24.5.2026

> תיעוד מה נבנה. המסמך הסמכותי לעיון ב-`underwater-app/onboarding.html`. החלטות פדגוגיות ב-`architecture-mvp.md` סקציה 8.6.

## הקבצים שנוצרו/עודכנו

| קובץ | סטטוס |
|---|---|
| `underwater-app/onboarding.html` | חדש — המסע המלא, 5 שלבים, ~700 שורות |
| `underwater-app/onboarding-components.html` | חדש — preview של 4 רכיבים (לאישור עיצוב) |
| `underwater-app/assets/onboarding/treasure-chest.png` | חדש — תיבת המילים (פרומפט 1) |
| `underwater-app/assets/onboarding/story-1-running.png` | חדש — פריים 1 (ילד רץ) |
| `underwater-app/assets/onboarding/story-2-hungry.png` | חדש — פריים 2 (ילד רעב) |
| `underwater-app/assets/onboarding/story-3-apple.png` | חדש — פריים 3 (אמא נותנת תפוח) |
| `underwater-app/assets/onboarding/scene-bay-bg.png` | חדש — רקע מפרץ הבועות |
| `underwater-app/assets/island-03/*.png` (9 קבצים) | עודכן — PIL transparency (רקע לבן הוסר) |
| `underwater-app/assets/island-03/tapuach.png` | חדש — הועתק מ-engine/content/images/ |
| `underwater-app/map.html` | עודכן — auto-redirect ל-onboarding בכניסה ראשונה |
| `architecture-mvp.md` | עודכן — נוספה סקציה 8.6 על המסע |

## מבנה הקובץ onboarding.html

```
HTML:
├── <head>: tokens (design-system) + fonts (Heebo + Rubik)
├── <body>: 6 <section class="screen"> (welcome + 5 stages)
├── Noni speech bubble (overlay)
├── Replay audio button (overlay)
└── SVG defs (coralGrad reusable)

CSS:
├── Design tokens (--water-main, --gold-hint, --success, ...)
├── Screen system (.screen, .active, screen-in animation)
├── .bubble (180×180 image bubble + 4 states)
├── .coral (SVG-based letter coral + 3 states)
├── .word-bubble (380×380, decoding stage)
├── .dot-card (segmentation cards)
├── .word-choice-btn (stage 4 — knows/tell-me)
├── Story frame + chest container
└── Map outro (island wraps + names + gems)

JavaScript:
├── State (responses, signals, attempts)
├── ITEMS (item bank per stage)
├── Audio (MP3 first → TTS fallback, Avri preferred)
├── Noni speech UI
├── Screen navigation
├── Journey flow (startJourney → stage1 → stage2 → ... → map)
├── Adaptive logic (stage 1.3, stage 4)
└── Output → localStorage.avnei-yesod-onboarding
```

## החלטות שנתפסו תוך כדי

### א. שווא נח = בעיה פדגוגית
מכונית (מְכוֹנִית) **לא** מתחילה ב-/m/ נקי. החלפנו ל-מרק (מָרָק) בשלב 1.1.

### ב. הקריינות אסור שתאמר את התשובה
טעות קריטית: שלב 3.2 השמיע `tapuach.mp3` לפני שהילדה בחרה. תוקן ל-`sound: null` + TTS על הטקסט המנוקד.

### ג. שלב 4 — דיווח עצמי, לא מדידה
לא יכולנו לשמוע את הילדה. 2 כפתורים: "אני יודעת" (+0.10) / "תגיד לי" (ניטרלי).

### ד. סגמנטציה להברות (לא לפונמות)
התחלנו עם /גן/ = 3 פונמות. סגמנטציה לפונמות בינוני-קשה לגיל 6. עברנו ל-/אבא/ = 2 הברות.

### ה. המפה — שמות לאיים
לא "1, 2, 3" אלא הבועות / האותיות / המילים + אייקונים פנימיים.

## ה-Output

```json
{
  "student": "רוני",
  "timestamp": "2026-05-24T...",
  "responses": [
    { "stage": "stage1", "item": "1.1", "correct": true, "attempts": 0 },
    ...
  ],
  "soft_priors": {
    "PA": 0.05,
    "letter_id": 0.05,
    "vocab": 0.10,
    "listening": 0.05,
    "decoding": 0.10
  },
  "profile_label": "TBD",
  "confidence": "initial",
  "next_step": "BKT cold-start with shifted priors, profile to be determined after 3-5 sessions"
}
```

נכתב ל-`localStorage.avnei-yesod-onboarding`. בעתיד יחובר ל-`AvneiBKT.setInitialState()` (קיים ב-`js/shared/bkt.js`).

## ייעוץ מומחה (Perplexity sonar-pro · 23.5.2026)

נשאלו 3 שאלות סטרטגיות. תשובות:

1. **מסע = נוסף ל-BOY screener, לא מחליף.** כל המערכות (Lexia/Amira/i-Ready) מפרידות placement מ-screener.
2. **המסע = priors רכים בלבד.** פרופיל נקבע אחרי 3-5 ימי משחק. 5 דק' לא מספיקות לקביעת פרופיל.
3. **Output = soft shifts ±0.1** מ-population defaults. לא p(L0) ישיר ל-22 איים.

דגל אדום: בעברית מנוקדת (אורתוגרפיה שקופה), Letter-Sound-Fluency הוא signal חלש. הסיגנל החזק = decoding מורפולוגי-עשיר.

## משימות פתוחות

- [ ] חיבור הילדה ל-`AvneiBKT.setInitialState()` בסיום המסע (כרגע רק לוג ל-localStorage)
- [ ] עדכון `screener.html` להוסיף RAN עברי + decoding מורפולוגי
- [ ] תיקון משחקוני אי 3 לסטנדרט הוויזואלי החדש (הנחיה ב-`_handoff/island-3-visual-fix.md`)
- [ ] צילום תמונות-תלמידים אמיתיות (placeholder = אות ראשונה בעיגול לבנדר)
- [ ] mini-screener אחרי שבועיים לכיול baseline אם הילדה התביישה ביום הראשון
- [ ] בחינה: האם AvriNeural מוכן בכל סביבת פיילוט? אם לא — fallback ל-TTS דפדפן

## ניווט

- כניסה ראשונה: `map.html` → auto-redirect ל-`onboarding.html`
- דילוג למפה ישירות: `map.html?skip-onboarding=1`
- בדיקה עם שם אחר: `onboarding.html?name=דנה`
- בסיום המסע: alert + console.log עם ה-priors (לפיתוח). בעתיד: redirect ל-map.html
