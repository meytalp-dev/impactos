# בריף אמנות · Lumi — T3 · Find the Feeling / Emotions 🔦
מיועד להעברה ל-GPT (gpt-image / DALL·E). מטרה: **6 פרצופי-רגש** drop-in למשחקון "מָה מַרְגִּישִׁים?" (מכניקת אלומת-אור).

## ✅ סטטוס: הפרצופים סופקו וחוּוְּטוּ (13.7)
מיטל ייצרה גיליון 6-פרצופים; חתכתי (PIL) → **rembg** לשקיפות אמיתית → `lumi/app/assets/emotions/faces/{happy,sad,scared,tired,surprised,okay}.png`. מחוּוָּטים במשחקון (החלפת ה-placeholder אמוג׳י ב-CSS/JS).
**🔴 שינוי אוצר (מיטל):** `hungry` הוחלף ב-`surprised` — הגיליון כלל פרצוף "מופתע/מודאג", לא "רעב". **מחיר:** נופל חיבור-Food ("I'm hungry"→"I want ___"). אם רוצים להחזיר את hungry: לייצר פרצוף "רעב" (מלקק שפתיים/יד-על-בטן) באותו סגנון ולהחזיר את המילה.
הבריף למטה נשמר כרשומת-מקור וכתבנית לפרצוף-רעב עתידי.

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
├── sad.png       ✅
├── scared.png    ✅
├── tired.png     ✅
├── surprised.png ✅
└── okay.png      ✅   (hungry.png — עתידי, אם מחזירים)
```
> **חיווט (בוצע):** `find-the-feeling.html` ממפה את glyph-האמוג׳י שב-`.ba-emoji` חזרה למילה ומציב `background-image` של ה-PNG על `.beam-animal` (page-local — בלי לגעת ב-`light-beam.js` המשותפת). האמוג׳י נשאר fallback אם PNG חסר.

---

## 1. ששת הפרצופים
דמות זוהרת קטנה אחת (אותו יצור עקבי) — משנה **רק הבעה**. חם וזוהר, על רקע שקוף.

| קובץ | רגש | אודיו אנגלי | תיאור הבעה (חד-משמעי) |
|---|---|---|---|
| `happy.png`  | שמח   | "happy" · "I'm happy!"   | חיוך רחב, עיניים קורנות, זוהר מעט חזק יותר |
| `sad.png`    | עצוב  | "sad" · "I'm sad!"       | פה נפול, גבות פנימה-למעלה, דמעה קטנה עדינה (לא בכי מר) |
| `scared.png` | מפחד  | "scared" · "I'm scared!" | גבות מודאגות, פה קטן, ידיים מחבקות את הגוף — **רך, לא מפחיד** |
| `tired.png`  | עייף  | "tired" · "I'm tired!"   | עיניים חצי-עצומות, פיהוק, יד לפה — **רגוע, לא עצוב** |
| `surprised.png` | מופתע | "surprised" · "I'm surprised!" | עיניים גדולות, פה פתוח, שתי ידיים ללחיים — הפתעה/גאסְפּ |
| `okay.png`   | בסדר  | "okay" · "I'm okay!"     | חיוך קל ניטרלי, רגוע — "הכול טוב" |
| *(עתידי)* `hungry.png` | רעב | "hungry" · "I'm hungry!" | מלקק שפתיים / יד על בטן — **לא חיוך שמח**. רק אם מחזירים את hungry לחיבור-Food |

**Prompt seed ל-GPT:**
> A small glowing storybook creature, soft 3D children's-book style, warm inner glow (peach/gold/warm-glow palette), big friendly eyes, rounded soft shapes, premium and adorable, **transparent background, no baked shadow**. Generate the SAME character in these 6 facial expressions, identical size and centered position: **happy** (big warm smile) / **sad** (droopy mouth, one gentle tear) / **hungry** (licking lips, hand on tummy — not a happy smile) / **tired** (half-closed eyes, small yawn, relaxed) / **scared** (big eyes, hands close, soft & cute — NOT frightening) / **okay** (calm neutral little smile, tiny thumbs-up).

---

## ❌ אל תייצרי (נעשה ב-CSS)
זוהר-הסצנה · אלומת-האור · ניצוצות (LumiFx) · האורות שנדלקים בפס-ההתקדמות · הצללות.

## ✅ צ'קליסט מסירה
- [x] 6 × emotions/faces/*.png (אותה דמות, רקע שקוף אחרי rembg) — happy/sad/scared/tired/surprised/okay
- [x] כל הבעה חד-משמעית (scared מודאג-רך ≠ surprised גאספ ≠ sad דמעה)
- [x] חיווט PNG במשחקון (page-local, בלי לגעת ב-light-beam המשותפת)
- [ ] *(עתידי)* `hungry.png` — אם מיטל רוצה להחזיר את hungry לחיבור-Food
