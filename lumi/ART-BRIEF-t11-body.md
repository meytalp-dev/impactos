# בריף אמנות · Lumi — T11 · 🙌 Touch & Go / גוף

מיועד להעברה ל-GPT (gpt-image / DALL·E). מטרה: נכסי **חלקי-גוף** drop-in למשחקון "גַּעוּ בַּגּוּף" (מכניקת מסלול-פנסים, `path-choice.js` המשותפת).
מילים: **head · hair · hands · feet** · צ׳אנק TPR: "Touch your head." / "These are my hands."

## 🟢 סטטוס: גוף-לומי המלא — DONE · חלקי-הגוף — PLACEHOLDER (המשחקון בר-בדיקה עכשיו)
- **גוף-לומי המלא (הדמות שמיטל הורידה) כבר נוקה ב-`rembg` ומחווט** → `assets/character/lumi/lumi-body.png`. משמש כ-**hero במסך-הפתיחה/סיום** וכ-**מדריך בפיתול-השביל** (`.fork-lumi`). זה מכסה את דרישת-הסצנה "לומי מלא-גוף".
- **כרטיסי-היעד** (ראשי-השבילים) הם כרגע **אמוג׳י placeholder**: 👤 head · 🦱 hair · 🙌 hands · 🦶 feet. אין תלות בנכס חדש כדי לשחק/למדוד. הפוליש החזותי (crop אמיתי לכל חלק) ממתין לאישור-המכניקה.

## 🎯 מה חסר (ל-"פוליש", לא חוסם בדיקה): 4 crops של חלקי-גוף לומי
כרטיס-יעד לכל מילה. עדיף **crop/callout מגוף-לומי עצמו** (עקבי עם ה-hero המלא) — כך הילד מקשר את חלק-הגוף המנוקד ללומי שמולו, ואז נוגע בעצמו (TPR).

---

## 0. עקרונות-על (חלים על כל נכס)
- **סגנון:** soft 3D storybook · לומי הזוהר · תאורה רכה · צורות מעוגלות · פרימיום · **בלי עומס**. אותו לומי בדיוק כמו `lumi-body.png`.
- **DNA צבע (פלטת lantern-grove — mint/aqua של לומי + warm-glow · tokens.css):**
  `mint/aqua גוף-לומי · #ffc35c gold · #f5972b amber · #fff0b0 lantern-glow · #fff6ec cream · רקע-סצנה teal-dusk כהה`
  הנכסים = חלק-גוף חם/זוהר על רקע שקוף; ייראו זוהרים בתוך כרטיס ה-cream הבהיר.
- **אסור:** צבעים רוויים/ניאון · קווי-מתאר שטוחים · אימוג׳י · **טקסט כלשהו בתמונה** (no_read) · אנטומיה "מדעית"/מפחידה.

## 0.1 דרישות טכניות (חובה, אחרת לא drop-in)
- **PNG עם רקע שקוף אמיתי.** GPT צובע רקע אטום → **חובה `rembg`** לשקיפות → `assets/`. לבקש מפורשות: *"transparent background, no ground shadow baked in"* (בהיר-על-בהיר → `rembg` עם `alpha_matting`, כפי שנעשה כבר עבור `lumi-body.png`).
- **רזולוציה:** callout בודד ~500×500, ממורכז, ממלא את הפריים (הכרטיס עם שוליים פנימיים — background-size:~116% כשמחווטים).
- **עקביות:** אותו לומי, אותו קנבס/סגנון. חלק-גוף מובלט/מוגדל בעדינות, שאר הגוף מרומז/מעומעם או חתוך.

## 0.2 מבנה תיקיות + שמות (החיווט כבר מוכן להחלפה — בלי לגעת ב-`path-choice.js`)
```
lumi/app/assets/body/
├── head.png     ← ראש-לומי (הפרצוף + כתר-הלהבה)
├── hair.png     ← "השיער" = זיזי-הלהבה הטורקיז מעל הראש + העלה
├── hands.png    ← שתי הידיים/כפות (מוגבהות מעט, מזמין למגע)
└── feet.png     ← שתי הרגליים/כפות התחתונות
```
**חיווט (page-local ב-`css/t11-body.css`, כבר מסומן):** בבלוק `.trail-animal[data-part="…"] .ta-emoji` — לבטל את ההערה ולהפעיל:
```css
.trail-animal[data-part="head"] .ta-emoji{ display:block; width:clamp(64px,16vw,92px); height:clamp(64px,16vw,92px);
  font-size:0; background:center/contain no-repeat url(../assets/body/head.png); }
/* וכן hair / hands / feet */
```
המשחקון כבר מתייג כל שביל ב-`data-part` (ב-`t11-body.html`), והאמוג׳י נשאר fallback אם נכס חסר.

---

## 1. פרומפט GPT מוכן (4 חלקי-גוף · אצווה אחת)
> Four separate soft-3D storybook illustrations of body-part close-ups of **the same glowing mint-aqua fairy character "Lumi"** (round chibi body, cream heart-shaped face, big teal eyes, turquoise flame-like hair with a small glowing leaf on top, soft translucent fairy wings). Consistent character, consistent soft lantern-glow lighting, warm mint/aqua palette with gold/amber glow accents. Each on a **plain white background, centered, no text, no ground shadow**:
> 1. **head** — Lumi's whole head close-up (cream face + turquoise flame-hair crown + leaf), friendly.
> 2. **hair** — focus on the turquoise flame-like hair tufts + the glowing leaf on top of the head.
> 3. **hands** — Lumi's two rounded little hands/paws, gently raised, inviting a high-five.
> 4. **feet** — Lumi's two rounded little feet at the bottom of the body.
> Style: premium, soft, rounded, glowing, uncluttered. No neon, no flat outlines, no emoji, no words.

לאחר ההפקה: `rembg` לכל PNG → `lumi/app/assets/body/{part}.png` → הסירי את ה-comment ב-`t11-body.css`.

## 2. הערות
- **head↔hair קרובים חזותית** (שניהם בראש) → זה בדיוק זוג ה-`discriminate` הנמדד. כדאי ש-`head.png` יראה את כל הראש כולל השיער, ו-`hair.png` יתמקד **רק** בזיזי-הלהבה, כדי שהילד יבחין.
- **hands↔feet** = זוג ה-`discriminate` השני (שתי כפות זוגיות). שמרי על הבחנה: ידיים מוגבהות/פתוחות · רגליים למטה/עומדות.
- אין `age_flag` — head/hair/hands/feet מוכרים היטב לילד ישראלי בן 6 (ראש/שיער/ידיים/רגליים).
