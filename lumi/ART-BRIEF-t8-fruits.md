# בריף אמנות · Lumi — T8 · 🧺 סַל הַפֵּרוֹת (The Fruit Basket)
**מכניקה:** אלומת־אור (light-beam) — הילד מזיז אלומה בסל־פירות דמדומי; היא חושפת פרי, והילד מאיר על הפרי שלומי אמר.
**מילים:** apple · banana · orange. **צ׳אנק:** "I want a/an ___." (פונקציית־הרצון).

> **סטטוס: ✅ הנכסים התקבלו והוטמעו (13/07 22:33).** מיטל הפיקה 3 דמויות־פרי + רקע חורשה ב־GPT. עברו rembg והוזרקו למשחקון. המסמך שמור לשחזור / להפקה חוזרת.

---

## 0. עקרונות-על
- **סגנון:** soft-3D storybook · דמות־פרי מואנשת (kawaii mascot) · תאורה רכה · זוהר־פנס פנימי בבטן · עלה מנטה זוהר. זהה לעולם lantern-grove.
- **פלטה:** lantern-grove — `#9fe8d8 mint · #78d8d0 aqua · #f6e8a6 warm-glow · #4a3a5e dusk`. הרקע דמדומי; הפרי הוא נקודת־הצבע.
- **אסור:** טקסט בתוך התמונה · ניאון צורם · אימוג'י · הצללת־קרקע צרובה.

## 0.1 דרישות טכניות
- **דמויות־הפרי:** PNG **רקע שקוף**. GPT צובע רקע אטום → **rembg חובה** (`isnet-general-use`, `alpha_matting=True`, fg=250/bg=15/erode=8 — הזוהר החם סביב הדמות נשמר בכוונה, קורא כאאורת־אור במכניקה). סקריפט: `lumi/scratchpad/process-fruit-art.py`.
- **רקע הסצנה:** נשאר **אטום** (RGB), full-bleed, ~1080px רוחב. מוחשך ב־CSS ב־overlay דמדומי כדי שחשיפת־האלומה תיקרא.

## 0.2 מבנה תיקיות + שמות (כך הקוד מצפה)
```
lumi/app/assets/fruits/
├── apple.png      ← דמות־תפוח (זוהר אדום)
├── banana.png     ← דמות־בננה (זוהר צהוב)
└── orange.png     ← דמות־תפוז (זוהר כתום)
lumi/app/assets/worlds/fruits/
└── orchard-bg.png ← רקע: סל־פירות בחורשה קסומה, דמדומים
```

## 1. הדמויות (הנכס המרכזי)
דמות־פרי מואנשת אחת פר־מילה: פנים חמודות (עיניים גדולות טורקיז/כחול, לחיים ורודות, חיוך רך), גוף עגלגל בצבע הפרי, זוהר־פנס לבן־זהוב בבטן, עלה מנטה זוהר בראש. עקבי בין 3 הפירות (התפוח והתפוז תאומים; הבננה מעט שונה — עיניים כחולות/חיוך פתוח — עדיין באותה איכות).

**Prompt seed ל-GPT (דמות בודדת, חזור ×3 עם הפרי):**
> A cute soft-3D storybook mascot character shaped like a **{apple / banana / orange}**, big friendly teal eyes, rosy cheeks, gentle smile, a small glowing mint leaf, a soft warm lantern-glow swirl on the belly, rounded chubby body, premium children's-book render, soft rim light, **plain white background, no text, no ground shadow**.

## 2. הרקע — orchard-bg
> A magical **fruit orchard at soft twilight/sunset**, a woven **fruit basket** in the foreground, a glowing storybook tree, pastel mint/aqua/lavender sky, floating light motes, dreamy premium children's-book scene, portrait 9:16, **no text**.

## 3. פערים / ASK
- אין. 3/3 דמויות + רקע הוטמעו. אודיו: apple+banana הופקו (Jessica), orange משותף עם T4, אינטרו/סיום עברית (Nunni). אין מילים עם `age_flag` (תפוח/בננה/תפוז מוכרים לגיל 6).
