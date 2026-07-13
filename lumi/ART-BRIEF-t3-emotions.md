# בריף אמנות · Lumi — T3 · Find the Feeling / Emotions 🔦
מיועד להעברה ל-GPT (gpt-image / DALL·E). מטרה: **6 פרצופי-רגש** drop-in למשחקון "מָה מַרְגִּישִׁים?" (מכניקת אלומת-אור).
**סטטוס נוכחי:** המשחקון **בר-בדיקה עכשיו** עם placeholder אמוג׳י (😄😢😋🥱😨🙂). הפרצופים למטה מחליפים אותם לאיכות פרימיום.

---

## 0. עקרונות-על (חלים על כל נכס)
- **סגנון:** soft 3D storybook · יצור זוהר חמוד אחד · תאורה רכה · צורות מעוגלות · מראה פרימיום · **בלי עומס**.
- **DNA צבע (פלטת השקיעה הנעולה — tokens.css §5):**
  `#ffd8b0 peach · #ffc35c gold · #f5972b amber · #f4785f coral · #8fb89a sage · #4a3a5c dusk · #2e2440 dusk-deep · #fff0b0 lantern-glow · #fff6ec cream`
  הפרצוף = אור חם (peach/gold/glow) על רקע שקוף; ייראה זוהר בתוך הסצנה הכהה (dusk).
- **אסור:** צבעים רוויים/ניאון · קווי-מתאר דקים/שטוח · אימוג׳י · טקסט כלשהו בתוך התמונה · הבעת-פחד **מפחידה** (scared = עדין/רך בלבד).

## 0.1 דרישות טכניות (חובה, אחרת לא drop-in)
- **PNG עם רקע שקוף אמיתי.** GPT צובע רקע אטום → **חובה `rembg`** לשקיפות → `assets/`. לבקש מפורשות: *"transparent background, no ground shadow baked in"*.
- **רזולוציה:** ~700×700px, הפרצוף ממורכז.
- **עקביות עיגון (קריטי):** כל 6 הפרצופים — **אותה דמות, אותו קנבס, אותו גודל, אותו מרכז**. שינוי = רק ההבעה. הכי טוב: לייצר את כולם כ-sheet אחד ואז לחתוך, או "same character, same size and position, only the facial expression changes".
- **חד-משמעות (קריטי למדידה):** כל הבעה חייבת להיות **מובחנת** — ילד בן 6 מזהה את הרגש בלי מילים. במיוחד להפריד: happy מול hungry (שניהם פה פתוח/חיוך) · sad מול tired (שניהם נפולים).

## 0.2 מבנה תיקיות + שמות
```
lumi/app/assets/emotions/faces/
├── happy.png     (😄 placeholder)
├── sad.png       (😢)
├── hungry.png    (😋)
├── tired.png     (🥱)
├── scared.png    (😨)
└── okay.png      (🙂)
```
> **הערה למפתח:** `light-beam.js` מציג כרגע glyph אמוג׳י בתוך `.ba-emoji`. חיווט ה-PNG הוא **משימת-המשך קלה** (להוסיף ל-CSS רקע לפי מזהה-רגש, כמו `.lg-animal[data-animal]` בפֶּטס). עד אז — placeholder אמוג׳י.

---

## 1. ששת הפרצופים
דמות זוהרת קטנה אחת (אותו יצור עקבי) — משנה **רק הבעה**. חם וזוהר, על רקע שקוף.

| קובץ | רגש | אודיו אנגלי | תיאור הבעה (חד-משמעי) |
|---|---|---|---|
| `happy.png`  | שמח   | "happy" · "I'm happy!"   | חיוך רחב, עיניים קורנות, זוהר מעט חזק יותר |
| `sad.png`    | עצוב  | "sad" · "I'm sad!"       | פה נפול, גבות פנימה-למעלה, דמעה קטנה עדינה (לא בכי מר) |
| `hungry.png` | רעב   | "hungry" · "I'm hungry!" | מלקק שפתיים / יד על בטן, עיניים על "אוכל" — **לא חיוך שמח** |
| `tired.png`  | עייף  | "tired" · "I'm tired!"   | עיניים חצי-עצומות, פיהוק קטן, גוף רפוי — **רגוע, לא עצוב** |
| `scared.png` | מפחד  | "scared" · "I'm scared!" | עיניים גדולות, ידיים קרובות לגוף, "אופס" — **רך וחמוד, לא מפחיד** |
| `okay.png`   | בסדר  | "okay" · "I'm okay!"     | חיוך קל ניטרלי, רגוע, אגודל-למעלה קטן — "הכול טוב" |

**Prompt seed ל-GPT:**
> A small glowing storybook creature, soft 3D children's-book style, warm inner glow (peach/gold/warm-glow palette), big friendly eyes, rounded soft shapes, premium and adorable, **transparent background, no baked shadow**. Generate the SAME character in these 6 facial expressions, identical size and centered position: **happy** (big warm smile) / **sad** (droopy mouth, one gentle tear) / **hungry** (licking lips, hand on tummy — not a happy smile) / **tired** (half-closed eyes, small yawn, relaxed) / **scared** (big eyes, hands close, soft & cute — NOT frightening) / **okay** (calm neutral little smile, tiny thumbs-up).

---

## ❌ אל תייצרי (נעשה ב-CSS)
זוהר-הסצנה · אלומת-האור · ניצוצות (LumiFx) · האורות שנדלקים בפס-ההתקדמות · הצללות.

## ✅ צ'קליסט מסירה
- [ ] 6 × emotions/faces/*.png (אותה דמות, אותו עיגון, רקע שקוף, אחרי rembg)
- [ ] כל הבעה חד-משמעית (happy≠hungry · sad≠tired · scared רך)
- [ ] (מפתח) חיווט PNG ב-CSS של light-beam במקום glyph
