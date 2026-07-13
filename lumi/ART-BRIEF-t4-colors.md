# בריף אמנות · Lumi — T4 · צֶבַע הַחוֹרְשָׁה (Color the Grove)
מיועד להעברה ל-GPT (gpt-image / DALL·E). מטרה: נכסים **drop-in** למשחקון הצבעים.
**מכניקה:** אלומת־אור (light-beam) — הילד מזיז אלומה בחורשה חשוכה; היא "צובעת" את מה שהיא פוגשת, והילד מאיר על החפץ בצבע שלומי אמר.

> **🔑 עקרון־הבידוד הקריטי (זו כל הנקודה של הנושא הזה):** הצבע הוא המשתנה הנמדד. לכן כל האפשרויות במסך חייבות להיות **אותו אובייקט בדיוק** — רק הצבע משתנה. אם החפץ האדום הוא פרח והכחול הוא כדור, הילד יכול לפתור לפי **צורה** במקום צבע, והמדד מזוהם. **צורה זהה + גוון שונה = הילד חייב להקשיב לצבע.**

---

## 0. עקרונות-על (חלים על כל נכס)
- **סגנון:** soft 3D storybook · עולם דמדומים קסום · תאורה רכה · צורות מעוגלות · מראה פרימיום · **בלי עומס**. זהה לחלוטין לסט Lumi/החיות הקיים (אותו עולם).
- **פלטה מנחה (רקע/סצנה):** `#9fe8d8 mint · #78d8d0 aqua · #f6e8a6 warm-glow · #4a3a5e dusk · #35283f grove-night`. הרקע קריר; החפץ־בצבע הוא נקודת־הצבע הבולטת.
- **אסור:** ניאון צורם · קווי־מתאר שטוחים · אימוג'י · **טקסט כלשהו בתוך התמונה** · הצללה קרקע צרובה.

## 0.1 דרישות טכניות (חובה, אחרת לא drop-in)
- **חפצי־הצבע:** PNG **עם רקע שקוף** (transparent). לבקש מפורשות: *"transparent background, no ground shadow baked in"*.
- **🔴 rembg חובה:** GPT צובע רקע אטום (לרוב לבן). אחרי ההורדה — להריץ `rembg` על כל קובץ לשקיפות אמיתית, ואז לתיקייה. **בלי rembg הריבוע הלבן ייראה במשחק.**
- **רזולוציה:** קנבס **~700×700px**, החפץ ממורכז (בערך פי 3 מהתצוגה, ~96px).
- **🔒 עקביות־צורה בין 10 הצבעים (הכי קריטי):** **אותו קנבס, אותה צורה, אותו גודל, אותו מרכז, אותה תאורה** — **רק הגוון (hue) משתנה.** הכי בטוח: לייצר sheet של כל 10 בבת־אחת עם *"same identical object, same size/pose/lighting, only the color changes"*, ואז לחתוך.

## 0.2 מבנה תיקיות + שמות (מדויק — כך הקוד יצפה)
```
lumi/app/assets/colors/orbs/
├── orb-red.png
├── orb-blue.png
├── orb-yellow.png
├── orb-green.png
├── orb-orange.png
├── orb-purple.png      ← 6 צבעי־ליבה (גל ראשון)
├── orb-pink.png
├── orb-black.png
├── orb-white.png
└── orb-brown.png       ← גל שני
```

---

## 1. החפץ — "כדור־אור" אחד ב-10 גוונים (הנכס המרכזי)
אובייקט **אחד** בלבד, חוזר ×10: **כדור־אור רך וזוהר** (balloon-orb / lantern-orb) — כדור עגול חלק עם זוהר פנימי עדין, כמו פנס עגול קטן. חמוד, ידידותי, מרחף מעט.

**Prompt seed ל-GPT (10 בבת־אחת):**
> A single soft glowing storybook orb (a rounded balloon-lantern), soft 3D children's-book style, smooth rounded shape, gentle inner glow, premium and adorable, front view, centered, **transparent background, no baked shadow**. Generate the SAME identical orb — same size, same shape, same lighting, same centered position — in these 10 colors, ONLY the hue changing: **red, blue, yellow, green, orange, purple, pink, black, white, brown**. The object must be pixel-identical across all 10; only the colour differs.

**סדר הפקה:** קודם 6 הליבה (red/blue/yellow/green/orange/purple), אחר־כך גל שני (pink/black/white/brown).

**דגשים לגוונים קשים:**
- **white** — כדור לבן־שנהב רך על רקע שקוף; לוודא שהצורה נראית (זוהר/צל־עדין־כחלחל בקצה כדי שלא ייעלם).
- **black** — כדור אנתרציט/כחול־כהה־רך (לא שחור מת); זוהר פנימי חמים כדי שיישאר "חי" ולא מפחיד.
- **pink** ↔ **red** ו-**orange** ↔ **red** ↔ **brown** — לוודא שהגוונים **נבדלים בבירור** (אלה זוגות ה-discriminate; אם pink נראה כמו red חיוור, המשימה נשברת).

## 2. (אופציונלי, גל שני) וריאציות־אובייקט לרב־ייצוג
כדי שהילד ילמד ש"אדום" = צבע ולא "כדור אדום", אפשר להוסיף **אותו רעיון** על 1–2 אובייקטים נוספים (כל אחד שוב ×10 גוונים, שמירה על עקביות־צורה בתוך הסט):
- `flower/flower-<color>.png` — פרח־אור זהה ×10 גוונים.
- `ball/ball-<color>.png` — כדור־משחק זהה ×10 גוונים.
*(לא חוסם את הפיילוט. הכדור־אור לבדו מספיק כדי לשחק ולמדוד.)*

---

## 1.1 🎨 פרומפט GPT — 4 כדורי גל־שני (pink/black/white/brown) — התאמה 1:1 לסט הקיים
**חשוב:** צרפי כתמונת־רפרנס אחד מ-6 הכדורים הקיימים (למשל `orb-red.png`) → *"match this exact orb style/shape/lighting, only change the color"*. כך העקביות מובטחת.

> A set of **4 identical magical glowing orbs**, soft 3D storybook style, matching this reference orb exactly: a glossy translucent crystal sphere with a **bright glowing spiral-flame symbol at the center**, tiny sparkles/stars floating inside, delicate faint filigree swirls along the lower edges, smooth premium lighting with a soft highlight at the upper-left. The orbs must be **IDENTICAL in shape, size, inner symbol, lighting and style — ONLY the hue changes**. Front view, centered, each on a **plain solid white background, no text, no ground shadow**. Generate large (~900×900). The 4 colors:
> - **pink** — soft rosy pink, clearly **lighter/cooler than red** (so pink↔red stay distinct).
> - **black** — deep soft **anthracite / midnight** sphere with a **warm golden inner glow** so it stays alive and friendly (NOT dead-black, NOT scary); keep a subtly lit rim so the shape reads.
> - **white** — pearly **ivory-white** with a faint **cool blue-ish rim + inner glow** so the sphere shape reads clearly (must not disappear on a white background).
> - **brown** — warm cozy **amber-brown / caramel**, clearly **deeper/earthier than orange** (so brown↔orange stay distinct).

אחרי ההורדה: `rembg` על כל קובץ → שקיפות → הקטנה ל~320px → `assets/colors/orbs/orb-{pink,black,white,brown}.png`. אז הם ייכנסו למשחקון אוטומטית (הוסיפי את 4 המילים ל-`WORDS` ב-`color-beam.html`).

## ❌ אל תייצרי (נעשה ב-CSS/קוד)
אלומת־האור · הזוהר שנדלק בבחירה · ניצוצות · רצועת־ההתקדמות · רקע־החורשה (נעשה ב-gradient). אלה תאורה/אפקט.

## ✅ צ'קליסט מסירה
- [x] **6 × orbs/orb-{red,blue,yellow,green,orange,purple}.png — סופקו ע"י מיטל (13/7), rembg, ~320px, שובצו.** ✓
- [x] **4 × orbs/orb-{pink,black,white,brown}.png — סופקו ע"י מיטל (13/7), rembg (white עם alpha-matting), ~320px, שובצו.** ✓
- [ ] (אופ') flower/*.png · ball/*.png לרב־ייצוג
- [x] אימות: גוונים זה־ליד־זה — הצורה **זהה לחלוטין**, רק הצבע שונה (אומת headless: ליבה + גל־שני). ✓

---

## מצב נוכחי (2026-07-13, עודכן לילה) — ✅ כל 10 הצבעים חיים עם נכסים אמיתיים
מיטל סיפקה **10 כדורי־אור** זוהרים (אותו כדור, גוון משתנה, סמל־זוהר פנימי). כולם עברו `rembg` → שקיפות אמיתית → הוקטנו ל~320px → `assets/colors/orbs/orb-*.png`. שובצו ל־`color-beam.html` **בלי לגעת במכניקה המשותפת** (`light-beam.js`): המשחקון מעביר את ה־PNG כ־`<img>` דרך מפת ה־glyph המקומית שהמכניקה מזריקה. במצב־מנוחה הכדור מעומעם (grayscale) — האלומה "צובעת" אותו לגוון מלא.

- **white** — נדרש `rembg` עם **alpha-matting** (כדור בהיר על רקע לבן); ה-rim הכחלחל+הזוהר הפנימי שומרים על קריאוּת־הצורה מול החורשה הכהה. ✓
- **black** — כדור כהה עם זוהר־זהב חמים (ידידותי, לא שחור־מת); הכי כהה בסט → נבדל מ-brown. ✓
- **המשחקון מריץ עכשיו את כל 10 הצבעים.** אומת בצילום headless: ליבה (red/blue/yellow) + גל־שני (black/white/brown) — כולם קוראים נבדל, שקיפות נקייה.
