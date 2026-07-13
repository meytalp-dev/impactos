# בריף אמנות · Lumi — T10 · 👀 Light Up the Face / פנים
מיועד להעברה ל-GPT (gpt-image / DALL·E). מטרה: נכסי **פנים** drop-in למשחקון "הָאִירוּ אֶת הַפָּנִים" (מכניקת אלומת-אור, `light-beam.js` המשותפת).
מילים: **eyes · nose · mouth · ears** · צ׳אנק: "This is my nose." / "These are my eyes."

## 🟡 סטטוס: PLACEHOLDER — המשחקון בר-בדיקה עכשיו
כרגע הסצנה = **פני לומי הקיימות** (`lumi-idle.png`) עמומות ברקע (`.face-portrait`, page-local) + **hotspots אמוג׳י** (👀👃👄👂) בטבעות-זוהר, ממוקמים אנטומית מעל הפנים. אין תלות בנכס חדש כדי לשחק/למדוד. הפוליש החזותי ממתין לאישור המכניקה.

## 🔴 ASK מיטל (החלטת-אוצר/נכס פתוחה — חוסמת "פוליש", לא חוסמת בדיקה)
**ללומי אין אוזניים מובחנות.** הפנים הקיימות: עיניים גדולות + אף זעיר + חיוך — אבל "אוזניים" הן רק זיזי-הלהבה בצדי הראש. שתי אפשרויות:
- **(א · מומלץ)** לצייר **דיוקן-פנים חדש של לומי** (close-up חזיתי) עם **אוזניים רכות עגולות** מוספות + עיניים/אף/פה ברורים ומרווחים. זה גם פותר את בעיית-הצפיפות (בסגנון chibi האף יושב גבוה בין העיניים הענקיות).
- **(ב · זול)** להשאיר "ears" ממופה לזיזי-הצד + טבעת-hotspot כ-callout. עובד, אבל לא "אוזניים" אמיתיות.
> בנוסף: אמוג׳י ה-ears 👂 **זהה** לאייקון 👂 שעל כפתור-המטרה ("הקשיבו"), שנעול ב-`_measured-core.js`. נכס-callout אמיתי מסיר את הכפילות הזו.

---

## 0. עקרונות-על (חלים על כל נכס)
- **סגנון:** soft 3D storybook · לומי הזוהר · תאורה רכה · צורות מעוגלות · פרימיום · **בלי עומס**.
- **DNA צבע (פלטת lantern-grove — mint/aqua של לומי + warm-glow · tokens.css §5):**
  `mint/aqua גוף-לומי · #ffc35c gold · #f5972b amber · #fff0b0 lantern-glow · #fff6ec cream · רקע-סצנה teal-dusk כהה`
  הנכסים = לומי חם/זוהר על רקע שקוף; ייראו זוהרים בתוך הסצנה הכהה.
- **אסור:** צבעים רוויים/ניאון · קווי-מתאר שטוחים · אימוג׳י · **טקסט כלשהו בתמונה** (no_read) · חלוקת-פנים "מדעית"/מפחידה.

## 0.1 דרישות טכניות (חובה, אחרת לא drop-in)
- **PNG עם רקע שקוף אמיתי.** GPT צובע רקע אטום → **חובה `rembg`** לשקיפות → `assets/`. לבקש מפורשות: *"transparent background, no ground shadow baked in"* (לבנוני-על-לבן → `rembg` עם `alpha_matting`).
- **רזולוציה:** דיוקן ~1000×1000, ממורכז. Callouts בודדים ~400×400.
- **עקביות:** אותו לומי, אותו קנבס. חלקי-הפנים במיקום שתואם ל-`FACEMAP` שבמשחקון (או: תעדכני את הקואורדינטות אם הדיוקן מזיז חלקים).

## 0.2 מבנה תיקיות + שמות (החיווט כבר מוכן להחלפה)
```
lumi/app/assets/face/
├── lumi-face.png          ← (אופציה א) דיוקן close-up עם אוזניים — יחליף את .face-portrait
└── parts/                 ← (אופציה ב) callouts per-part, אם רוצים אמנות במקום אמוג׳י
    ├── eyes.png
    ├── nose.png
    ├── mouth.png
    └── ears.png
```
**חיווט (page-local, בלי לגעת ב-`light-beam.js`):**
- **רקע:** `.face-portrait { background-image: url(assets/face/lumi-face.png) }` — שורת-CSS אחת ב-`t10-face.html`.
- **hotspots:** בדיוק כמו `paintFaces` ב-T3 — מיפוי glyph-אמוג׳י→מילה כבר קיים (`glyphWord`); להוסיף ב-`placeHotspots` הצבת `background-image: assets/face/parts/{word}.png` על `.beam-animal`. האמוג׳י נשאר fallback.
- **קואורדינטות נוכחיות (`FACEMAP`, % מהסצנה):** eyes (50,34) · ears (20,42) · nose (50,52) · mouth (50,68). מרווח מספיק למגע ≥56px; סדר אינטואיטיבי עיניים→אף→פה.

---

## 1. הנכסים

### אופציה א (מומלצת) — דיוקן-פנים אחד
לומי חזיתי close-up, פרצוף גדול וממלא, **עם אוזניים רכות עגולות**, עיניים/אף/פה ברורים ומרווחים מעט יותר מהמקור, רקע שקוף.

**Prompt seed ל-GPT:**
> A close-up front-facing portrait of a single small glowing storybook creature (soft 3D children's-book style, mint/aqua body with warm inner glow, big friendly eyes), **head and face fill the frame**. Clearly readable, well-separated facial features: two big **eyes**, a small **nose**, a gentle smiling **mouth**, and two soft rounded **ears** on the sides of the head. Adorable and premium, soft lighting, **transparent background, no baked shadow, no text**.

### אופציה ב — 4 callouts (טבעת/הדגשה זוהרת לכל חלק)
אם משאירים את הדיוקן הקיים: 4 סמני-hotspot זוהרים (טבעת רכה + חלק-הפנים המצויר בפנים), באותו סגנון, שקופים.

| קובץ | חלק | אודיו אנגלי | הערה |
|---|---|---|---|
| `parts/eyes.png`  | עיניים | "eyes" · "These are my eyes!" | זוג עיניים |
| `parts/nose.png`  | אף     | "nose" · "This is my nose!"   | אף רך |
| `parts/mouth.png` | פה     | "mouth" · "This is my mouth!" | חיוך |
| `parts/ears.png`  | אוזניים | "ears" · "These are my ears!" | תלוי בהחלטת-האוזניים למעלה |

---

## ❌ אל תייצרי (נעשה ב-CSS/JS)
רקע-הסצנה teal-dusk · אלומת-האור · טבעות-הזוהר של ה-hotspots · ניצוצות (LumiFx) · אורות פס-ההתקדמות · הצללות.

## ✅ צ'קליסט מסירה
- [ ] החלטת-אוזניים (אופציה א/ב) — ASK מיטל
- [ ] `lumi-face.png` (אופציה א) **או** 4×`parts/*.png` (אופציה ב) — אותו לומי, רקע שקוף אחרי rembg
- [ ] חלקים חד-משמעיים לילד בן 6 (eyes≠ears, nose≠mouth)
- [x] placeholder אמוג׳י פעיל — המשחקון בר-בדיקה עכשיו (בלי תלות בנכס)
