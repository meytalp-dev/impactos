# בריף אמנות · Lumi — 🚜 The Farm Path (T1 · חיות־משק)
מיועד להעברה ל-GPT (gpt-image / DALL·E). מטרה: נכסים **drop-in** למשחקון path-choice של חיות־המשק.
> בכרטיס T1 בלוח (`lumi-minigames-tasks-board.html`) יש כפתור **"🎨 העתק פרומפט GPT"** עם פרומפט מוכן לנכסים האלה — אפשר להשתמש בו ישירות.

---

## 0. עקרונות-על (חלים על כל נכס)
- **סגנון:** soft 3D storybook · **שקיעה חמה** · תאורה רכה · צורות מעוגלות · עומק בשכבות · מראה פרימיום · **בלי עומס**.
- **מצב-רוח:** אור חם (הדמות/הפנס) על רקע שדה־שקיעה. תואם את הדמות Lumi הקיימת.
- **אסור:** צבעים רוויים/ניאון · כהה-מפחיד · קווי-מתאר דקים/שטוח · אימוג'י · **טקסט כלשהו בתוך התמונה**.
- **פלטת השקיעה (tokens.css — נעולה):**
  `#ffd8b0 peach · #ffc35c gold · #f5972b amber · #f4785f coral · #8fb89a sage · #4a3a5c dusk · #2e2440 dusk-deep · #ffd98a sky-glow`
  (החיות עצמן = צבעים טבעיים־רכים; הרקע מקבל את גוני-השקיעה.)

## 0.1 דרישות טכניות (חובה, אחרת לא drop-in)
- **חיות:** PNG **עם רקע שקוף** (transparent). לבקש מ-GPT מפורשות: *"transparent background, no ground shadow baked in"*.
  🔴 GPT צובע רקע אטום → **חובה rembg** להסרת רקע לשקיפות אמיתית לפני העברה ל-`assets/`.
- **רקע/סצנה:** ללא שקיפות, PNG.
- **רזולוציה (גדול, ~פי 3 מהתצוגה, חד במובייל):**
  - חיה: **~700×700px**, ממורכזת, front-facing.
  - רקע-סצנה: **1170×2532px** (אנכי, מובייל).
- **עקביות סט:** כל 5 החיות = **אותו סגנון, אותה שפה עיצובית**, כאילו יצאו מאותו ספר. הכי טוב לייצר את כולן ברצף עם אותו seed-prompt.

## 0.2 מבנה תיקיות + שמות (מדויק — כך הקוד יצפה כשנחליף placeholder→PNG)
```
lumi/app/assets/
├── animals/farm/
│   ├── cow.png
│   ├── horse.png
│   ├── duck.png
│   ├── pig.png
│   └── sheep.png        ← 🔴 רק אחרי אישור מיטל (age_flag)
└── worlds/farm-path/
    └── backgrounds/farm-bg.png
```
> **מצב נוכחי:** המשחקון בר-בדיקה **עכשיו** עם **placeholder אמוג׳י** (🐮🐴🦆🐷🐑 מ-`_emoji.json`) ורקע-CSS (שמי-שקיעה + שדה). כשה-PNG יגיעו — צעד פוליש קצר יחווט אותם למכניקת path-choice (כמו שנעשה ל-pets ב-`lantern-grove.css`). **אל תבנה פוליש חזותי לפני אישור המכניקה.**

---

## 1. חיות — 5 חיות-משק (תמונה אחת לכל אחת)
כל חיה = איור מלא, חמוד, מרכזי, front-facing, על רקע שקוף. **אותו סגנון בדיוק כמו Lumi ו-pets** (soft 3D storybook).

| קובץ | חיה | הערת עיצוב |
|---|---|---|
| `cow.png` | פרה | ידידותית, עומדת, front-facing, כתמים רכים |
| `horse.png` | סוס | עדין, עומד, רעמה רכה |
| `duck.png` | ברווז | קטן, front-facing, מקור עדין |
| `pig.png` | חזיר | עגול וחמוד, ורוד־רך |
| `sheep.png` | כבשה | 🔴 **לאשר עם מיטל לפני ההפקה** (age_flag — ייתכן נדיר לגן ישראלי) |

**Prompt seed ל-GPT (להריץ 5 פעמים, להחליף שם):**
> A cute [cow] in soft 3D storybook style, warm sunset children's-book palette, rounded friendly shapes, big gentle eyes, front-facing, centered, **transparent background, no shadow**. Same art style across all farm animals, matching a small glowing creature named Lumi.

---

## 2. רקע-סצנה — שביל הרפת בשקיעה
- `farm-bg.png` — רפת/שדה קסום בשעת שקיעה: **גדר-עץ רכה** + **ערמת-חציר**, שביל עדין שנמשך אל העומק, אורות-פנס מרחפים מטושטשים ברקע, שכבות עומק, אסם קטן על קו-האופק. **חמים וקסום, לא מפחיד.** אנכי 1170×2532. להשאיר את **מרכז-המסך פנוי יחסית** (שם ישבו 3 השבילים + Lumi + החיות).

**Prompt seed:**
> A magical twilight farm / pasture, soft 3D storybook style, a soft wooden fence and a hay bale, a gentle glowing path receding into depth, soft floating lantern-lights blurred in the background, a small barn on the horizon, layered depth, warm sunset palette with soft glow, dreamy and safe (not scary), **vertical mobile composition, keep the center area relatively open**.

---

## ❌ אל תייצרי (נעשה ב-CSS)
inner glow · אורות שנדלקים · ניצוצות/חלקיקים · השבילים המקווקוים · ברק/זוהר-פנס · הצללות. אלה תאורה/אפקט — קלים ועקביים יותר ב-CSS.

## ✅ צ'קליסט מסירה
- [ ] 5 × animals/farm/*.png (סט אחיד, רקע שקוף אמיתי אחרי rembg) — **sheep רק אחרי אישור מיטל**
- [ ] 1 × worlds/farm-path/backgrounds/farm-bg.png (אנכי, מרכז פנוי)
