# בריף אמנות · Lumi — T2 · 🌴 Safari Beam (Wild)
מיועד להעברה ל-GPT (gpt-image / DALL·E). מטרה: נכסים **drop-in** למשחקון "ספארי הפנס".
משחקון: מכניקת **אלומת־אור** (light-beam) — ג׳ונגל־לילה חשוך, אלומת פנס לומי חושפת חיה מסתתרת בכל פעם.
מילים: **lion · elephant · monkey · bear**.

> **✅ סטטוס: האיורים נחתו ושולבו (2026-07-13).** מיטל הפיקה ב-GPT את 4 החיות + רקע הג׳ונגל (soft-3D storybook, פלטת lantern-grove). עברו **rembg** לשקיפות אמיתית ונשמרו ל-`assets/animals/wild/*.png` + `assets/worlds/safari/backgrounds/jungle-bg.png`. חווטו לדף (silhouette כהה → נחשף באלומה). המשחקון כעת רץ עם **הנכסים האמיתיים**, אפס placeholder. הבריף נשמר כתיעוד + אם יידרשו רה-פקות/וריאציות.

---

## 0. עקרונות-על (חלים על כל נכס)
- **סגנון:** soft 3D storybook · אותו עולם ואותו קו כמו לומי ולנטרן־גרוב · תאורה רכה · צורות מעוגלות · עומק בשכבות · פרימיום · **בלי עומס**.
- **מצב-רוח:** ג׳ונגל־לילה **קסום ובטוח** (לא מפחיד) — אור חם (אלומת הפנס/הגחליליות) מול סביבה כהה־קרירה.
- **אסור:** צבעים רוויים/ניאון · כהה־מפחיד/מאיים · קווי־מתאר דקים/שטוח · אימוג׳י · טקסט כלשהו בתוך התמונה.
- **פלטה מנחה (lantern-grove + ג׳ונגל):**
  `#9fe8d8 mint · #78d8d0 aqua · #bff3ea seafoam · #f6e8a6 warm-glow · #f8f3e8 cream · #1c4034 jungle-deep · #123027 jungle-night · #2a4e40 jungle-twilight · #ffec b0 firefly`

## 0.1 דרישות טכניות (חובה, אחרת לא drop-in)
- **חיות:** PNG **עם רקע שקוף** (transparent). לבקש מ-GPT מפורשות: *"transparent background, no ground shadow baked in"*. GPT צובע רקע אטום → **חובה `rembg`** לשקיפות אמיתית לפני שמירה ל-`assets/`.
- **רקע/סצנה:** ללא שקיפות, יוצא כ-PNG.
- **רזולוציה (גדול, ~פי 3 מהתצוגה):**
  - חיה: קנבס **~700×700px**, ממורכזת.
  - רקע-סצנה: **1170×2532px** (אנכי, מובייל).
- **עקביות סט:** 4 החיות — **אותו קו, אותה פלטה, אותו גודל־עיגון**. הכי טוב לייצר כ-sheet אחד ואז לחתוך, או "same art style across all animals".
- **ניגוד גודל מכוון:** ה־**elephant גדול** וה־**monkey קטן** בתוך הפריים — הניגוד מנוצל ל-discriminate טבעי במשחקון. שמרו על יחס: פיל ≈ ממלא את הקנבס, קוף ≈ 60% מגובה הקנבס.

## 0.2 מבנה תיקיות + שמות (מדויק — כך הקוד מצפה)
```
lumi/app/assets/
├── animals/wild/
│   ├── lion.png
│   ├── elephant.png
│   ├── monkey.png
│   └── bear.png
└── worlds/safari/
    └── backgrounds/jungle-bg.png     ← הדף כבר מפנה לכאן (fallback ל-gradient עד שינחת)
```

---

## 1. חיות — 4 חיות־בר (תמונה אחת לכל אחת)
כל חיה = איור מלא, חמוד וידידותי, מרכזי, על רקע שקוף. **אותו סגנון בדיוק כמו לומי** (soft 3D storybook). את הגרסה ה"מעומעמת בצללית" (עד שהאלומה נופלת עליה) אני מפיק ב-CSS מאותה תמונה — צריך רק אחת לכל חיה.

| קובץ | חיה | דגש |
|---|---|---|
| `lion.png` | אריה | רעמה רכה, ידידותי (לא מאיים/שואג) |
| `elephant.png` | פיל | **גדול ועדין** — ממלא את הקנבס (ניגוד גודל) |
| `monkey.png` | קוף | **קטן ושובב** — ~60% גובה הקנבס |
| `bear.png` | דוב | עגול ונעים־חיבוק |

**Prompt seed ל-GPT:**
> A cute friendly [lion] in soft 3D storybook style, matching a calm magical palette (mint/aqua/cream/warm-glow) with gentle night-jungle tones, rounded soft shapes, big gentle eyes, front-facing, centered, **transparent background, no shadow**. Not scary, adorable and premium. Same art style across all four animals (lion, elephant, monkey, bear). Make the **elephant large and the monkey small** to preserve a clear size contrast.

*(להריץ 4 פעמים, להחליף שם החיה. לוודא סט אחיד → rembg על כל אחת.)*

---

## 2. רקע-סצנה — ג׳ונגל־לילה
- `jungle-bg.png` — ג׳ונגל־לילה קסום: עלווה בשכבות עומק, צמחים זוהרים בעדינות, גחליליות רכות, שביל עדין. **חשוך אך חמים ובטוח, לא מפחיד.** אנכי 1170×2532. להשאיר את **מרכז/גוף המסך פתוח יחסית** (שם נעות החיות ואלומת האור) — הפעילות מתרחשת על פני כל השדה.

**Prompt seed:**
> A magical night jungle, soft 3D storybook style, layered leafy depth, softly glowing plants and gentle fireflies, a faint receding path, dark-but-warm calm palette (deep teal-greens with warm firefly glow accents), dreamy and safe (not scary), **vertical mobile composition, keep the central field relatively open**.

---

## ❌ אל תייצרי (אני עושה ב-CSS)
אלומת־האור/הפנס · זוהר החשיפה · גחליליות אנימטיביות · צלליות ה"טרם־התגלה" (מיוצרות מאותה תמונה) · הצללות. אלה תאורה/אפקט — קלים ועקביים יותר ב-CSS.

## ⚙️ תלות קוד (למפתח, לא ל-GPT)
המכניקה `light-beam.js` מציגה כרגע **אמוג׳י** ב-`.beam-animal` (משותפת ל-T2–T5). כשינחתו ה-PNG-ים, צריך חיווט PNG ל-`.beam-animal` (בדומה ל-`.lg-animal[data-animal]` של לנטרן־גרוב). **follow-up — לא לגעת במכניקה המשותפת בלי תיאום תזמורת.**

## ✅ צ'קליסט מסירה — הושלם
- [x] 4 × animals/wild/*.png (lion/elephant/monkey/bear · סט אחיד · rembg → שקיפות אמיתית · ניגוד גודל)
- [x] 1 × worlds/safari/backgrounds/jungle-bg.png (אנכי, לילה־קסום־חם, שולב ומחווט)
- הערה: jungle-bg כ-PNG ~2MB — אפשר להמיר ל-WebP בהמשך לאופטימיזציה (לא חוסם).
