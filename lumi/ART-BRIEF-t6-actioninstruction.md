# בריף אמנות · Lumi — 🚦 לוּמִי אוֹמֵר (T6 · Action & Instruction / TPR)
מיועד להעברה ל-GPT (gpt-image / DALL·E). מטרה: נכסים **drop-in** למשחקון path-choice של מילות-הפעולה.
> בכרטיס T6 בלוח (`lumi-minigames-tasks-board.html`) יש כפתור **"🎨 העתק פרומפט GPT"** עם פרומפט מוכן — אפשר להשתמש בו ישירות.

---

## 0. עקרונות-על (חלים על כל נכס)
- **סגנון:** soft 3D storybook · דמות זוהרת · תאורה רכה · צורות מעוגלות · מראה פרימיום · **בלי עומס**.
- **הדמות = Lumi הקיים** (mint/aqua, בטן זוהרת-חמה, כנפי-פיה סגלגלות שקופות, נבט-עלה מזהיר על הראש, עיניים גדולות). **אותה דמות בדיוק** כמו 3 התנוחות שכבר סופקו — רק תנוחה חדשה.
- **אסור:** צבעים רוויים/ניאון · כהה-מפחיד · קווי-מתאר שטוחים · אימוג'י · **טקסט כלשהו בתוך התמונה**.
- **פלטת השקיעה של הממשק (tokens.css — נעולה, לרקע):**
  `#ffd8b0 peach · #ffc35c gold · #f5972b amber · #f4785f coral · #8fb89a sage · #4a3a5c dusk · #2e2440 dusk-deep · #ffd98a sky-glow`
  (הדמות שומרת על צבעי-הליבה שלה mint/aqua; הרקע/הסצנה מקבלים גוני-שקיעה.)

## 0.1 דרישות טכניות (חובה, אחרת לא drop-in)
- **תנוחות-דמות:** PNG **עם רקע שקוף**. לבקש מ-GPT מפורשות: *"transparent background, no ground shadow baked in"*.
  🔴 GPT צובע רקע אטום (בד"כ לבן/מנטה בהיר) → **חובה rembg** לשקיפות אמיתית לפני העברה ל-`assets/`.
  (הסקריפט לשימוש-חוזר: `lumi/scratchpad/rembg-t6-poses.py` — `isnet-general-use` + alpha-matting, crop ל-bbox.)
- **רזולוציה:** תנוחה **~700–900×1000px**, ממורכזת, front-facing, אותו קנה-מידה כמו 3 התנוחות הקיימות.
- **עקביות סט:** כל התנוחות = **אותה דמות, אותו סגנון, אותה תאורה** — כאילו יצאו מאותו ספר/seed.

## 0.2 מבנה תיקיות + שמות (כך הקוד מצפה)
```
lumi/app/assets/
├── actions/
│   ├── jump.png        ✅ מחווט + פעיל (תנוחה סופקה, אחרי rembg)
│   ├── stop.png        ✅ מחווט + פעיל (תנוחה סופקה, אחרי rembg)
│   ├── go.png          ✅ מחווט + פעיל (תנוחה סופקה, אחרי rembg)
│   └── come.png        ❌ חסר — placeholder אמוג׳י (👐) עד שתסופק
└── worlds/lumi-says/
    └── backgrounds/path-bg.png   ❌ חסר — כרגע סצנת-CSS (מדרון-שקיעה + שביל-אור)
```

## 1. מצב נוכחי (עודכן 13.7)
מיטל סיפקה **3 תנוחות Lumi** (ChatGPT 22:19) → עברו rembg → **מחווטים ופעילים** במשחקון:
- **`jump.png`** — לומי עם שתי ידיים פרושות מעלה ורגל מורמת (קפיצה). ל־**Jump!**
- **`stop.png`** — לומי עומד, כף-יד מורמת קדימה (עצירה). ל־**Stop!**
- **`go.png`** — לומי בהליכה/צעד. ל־**Go!**

## 2. 🔴 נכסים חסרים לבקש מ-GPT
### 2.1 תנוחת `come` (חובה — הרביעית מבין 4 מילות-הפעולה הנמדדות)
פרומפט מוצע:
> *Same glowing mint/aqua Lumi creature (soft 3D storybook, big eyes, translucent fairy wings, glowing leaf sprout on head, warm-glow belly) — full body, front-facing, **beckoning "come here" gesture**: one arm reaching forward with open hand waving toward the viewer, warm inviting smile, leaning slightly forward. Transparent background, no baked ground shadow. ~800×1000px, same scale/style as the jump/stop/go poses.*

### 2.2 (רשות) רקע-סצנה `path-bg.png`
> *A warm twilight storybook path winding up a gentle hill toward glowing lanterns; sunset palette (peach/gold/amber/coral/sage/dusk); soft, uncluttered, dreamy depth. No characters, no text. Vertical 1170×2532px.*
כרגע יש **סצנת-CSS placeholder** (מדרון-שקיעה + שביל-אור זוהר) — המשחקון בר-בדיקה ויפה בלעדיו; זו שדרוגית.

### 2.3 (רשות, meet לא-נמדד) תנוחות ל-look/listen/point/say
המילים look/listen/point/say הן **מילות-פונקציה לא-נמדדות** (meet בלבד) — כרגע אמוג׳י (👀 👂 👉 🗣️). תנוחות Lumi ל-4 אלה ישדרגו את ה-meet אך אינן חוסמות.

## 3. עקביות עם המכניקה
- הנכס נטען כ-`background-image` ב-`.trail-animal[data-action="<word>"] .ta-emoji` (ראה `css/lumi-says.css`).
- כשמגיע `come.png` → להוסיף שורת-CSS מקבילה (jump/stop/go כבר שם) ולהסיר את ה-placeholder — **שינוי page-local בלבד**, בלי לגעת ב-`path-choice.js` המשותף.
