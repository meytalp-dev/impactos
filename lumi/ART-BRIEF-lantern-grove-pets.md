# בריף אמנות · Lumi — Lantern Grove / Recognize (Pets)
מיועד להעברה ל-GPT (gpt-image / DALL·E). מטרה: נכסים **drop-in** למשחקון פיילוט אחד.

---

## 0. עקרונות-על (חלים על כל נכס)
- **סגנון:** soft 3D storybook · עולם דמדומים קסום · תאורה רכה · צורות מעוגלות · עומק בשכבות · מראה פרימיום · **בלי עומס**.
- **מצב-רוח:** אור חם (הדמות/הפנס) מול סביבה קרירה (החורשה).
- **אסור:** צבעים רוויים/ניאון · כהה-מפחיד · קווי-מתאר דקים/שטוח · אימוג'י · טקסט כלשהו בתוך התמונה.
- **פלטה מנחה:**
  `#9fe8d8 mint · #78d8d0 aqua · #bff3ea seafoam · #f6e8a6 warm-glow · #f8f3e8 cream · #dccdf8 lavender · #bdaee6 lilac-shadow · #2a4e63 eye-deep · #233c52 grove-night · #516a82 grove-twilight`

## 0.1 דרישות טכניות (חובה, אחרת לא drop-in)
- **דמויות + חיות + פנס:** PNG **עם רקע שקוף** (transparent). לבקש מ-GPT מפורשות: *"transparent background, no ground shadow baked in"*.
- **רקע/סצנה:** ללא שקיפות, יוצא כ-PNG ואני אמיר ל-WebP.
- **רזולוציה:** לייצר **גדול** (בערך פי 3 מהתצוגה) כדי שיהיה חד במובייל:
  - דמות Lumi: קנבס **~900×900px**, הדמות ממורכזת.
  - פנס: **~700×1000px**.
  - חיה: **~700×700px**, ממורכזת.
  - רקע-סצנה: **1170×2532px** (אנכי, מובייל).
- **עקביות עיגון (קריטי ל-Lumi):** כל 7 מצבי לומי — **אותו קנבס, אותו גודל-דמות, אותו מרכז**. שינוי מצב = רק הבעה/תנוחה, בלי קפיצה במיקום. (הכי טוב: לייצר את כולם בבת-אחת כ-sheet ואז לחתוך, או לבקש "same character, same size and position, only the expression/pose changes".)

## 0.2 מבנה תיקיות + שמות (מדויק — כך הקוד מצפה)
```
lumi/app/assets/
├── character/lumi/
│   ├── lumi-idle.png
│   ├── lumi-listening.png
│   ├── lumi-pointing.png
│   ├── lumi-curious.png
│   ├── lumi-happy.png
│   ├── lumi-celebrate.png
│   └── lumi-try-again.png
├── worlds/lantern-grove/
│   ├── backgrounds/grove-bg.png
│   └── lanterns/lantern-shell.png
├── animals/pets/
│   ├── dog.png
│   ├── cat.png
│   ├── fish.png
│   ├── bird.png
│   └── rabbit.png
└── references/            (אופציונלי — לבדיקה בלבד, לא נטען בקוד)
    ├── lantern-grove-target-idle.png
    ├── lantern-grove-target-active.png
    └── lantern-grove-target-success.png
```

---

## 1. דמות Lumi — 7 מצבים (הכי חשוב)
לומי = יצור קטן וזוהר שאיבד את דרכו הביתה; כל מילה מדליקה עוד אור. עיצוב הדמות צריך להיות **עקבי לחלוטין** בין 7 המצבים (אותו יצור, אותם צבעים/עיניים).

| קובץ | מצב | תיאור הבעה/תנוחה |
|---|---|---|
| `lumi-idle.png` | מנוחה | רגוע, נושם, חיוך עדין |
| `lumi-listening.png` | מקשיב | ראש מוטה, עיניים ערניות, "אוזן" קדימה — קשוב |
| `lumi-pointing.png` | מצביע | מחווה/מבט אל הצד (יראה על התשובה) |
| `lumi-curious.png` | סקרן | עיניים גדולות, הבעת "מה זה?" |
| `lumi-happy.png` | שמח | חיוך רחב, זוהר מעט חזק יותר |
| `lumi-celebrate.png` | חוגג | הכי אנרגטי, ניצוץ בעיניים, זרועות/גוף מורמים |
| `lumi-try-again.png` | מעודד | עדין, חם, לא עצוב ולא מאוכזב — "בוא ננסה שוב" |

**Prompt seed ל-GPT:**
> A small glowing storybook creature named Lumi, soft 3D children's-book style, warm inner glow, big friendly eyes (deep teal #2a4e63), rounded soft shapes, calm magical palette (mint/aqua/cream/warm-glow), premium and adorable, **transparent background, no baked shadow**. Generate the SAME character in these expressions, identical size and centered position: idle / listening / pointing / curious / happy / celebrating / gently-encouraging.

---

## 2. פנס — קליפה אחת ריקה (מודולרית)
נכס **אחד** בלבד: קליפת פנס **ריקה** עם "חלון" שקוף במרכז (שם תוצג החיה מאחורי הזכוכית). את הזוהר/הברק אני מוסיף ב-CSS — אל תצייר זוהר חזק בתוך הפנס.

- `lantern-shell.png` — פנס קסום מעוגל, מסגרת חמימה (זהב-רך/warm-glow), **מרכז שקוף/זכוכית שקופה**, בלי חיה בפנים, רקע שקוף.

**Prompt seed:**
> A single magical storybook lantern, soft 3D style, warm golden-glow frame, rounded cozy shape, **empty transparent glass center (see-through)**, no animal inside, calm palette, **transparent background**. Front view, symmetrical.

---

## 3. חיות — 5 חיות מחמד (תמונה אחת לכל אחת)
כל חיה = איור מלא, חמוד, מרכזי, על רקע שקוף. **אותו סגנון בדיוק כמו לומי** (soft 3D storybook). את הגרסה ה"מעומעמת בתוך הפנס" אני מפיק ב-CSS מאותה תמונה — צריך רק אחת.

- `dog.png` · `cat.png` · `fish.png` · `bird.png` · `rabbit.png`

**Prompt seed:**
> A cute [dog] in soft 3D storybook style, matching a magical calm palette (mint/aqua/cream/warm-glow), rounded friendly shapes, big gentle eyes, front-facing, centered, **transparent background, no shadow**. Same art style across all animals.

*(להריץ 5 פעמים, להחליף את שם החיה. חשוב שכולן ייראו כמו סט אחיד.)*

---

## 4. רקע-סצנה — חורשת הפנסים
- `grove-bg.png` — חורשה קסומה בשעת דמדומים, שביל עדין שנמשך אל העומק, פנסים/אורות מרחפים ברקע (מטושטשים, אווירה), שכבות עומק. **קריר וקסום, לא מפחיד.** אנכי 1170×2532. להשאיר את **מרכז-המסך פנוי יחסית** (שם ישבו 3 הפנסים + לומי).

**Prompt seed:**
> A magical twilight grove, soft 3D storybook style, a gentle glowing path receding into depth, soft floating lantern-lights blurred in the background, layered depth, cool calm palette with warm light accents, dreamy and safe (not scary), **vertical mobile composition, keep the center area relatively open**.

---

## 5. (אופציונלי) 3 מוקאפי-רפרנס לבדיקה
רק אם בא לך — תמונות "מטרה" של המסך המלא, לא נטענות בקוד, משמשות אותי ואותך להשוואה חזותית:
- `lantern-grove-target-idle.png` — לומי מקשיב + 3 פנסים כבויים על רקע החורשה.
- `lantern-grove-target-active.png` — פנס אחד נבחר וגדל, השאר מתעמעמים, החיה מבצבצת.
- `lantern-grove-target-success.png` — החיה הנכונה מוארת/מתרוממת, לומי חוגג, נקודת-דרך נדלקת.

---

## ❌ אל תייצרי (אני עושה ב-CSS)
inner glow · active glow · ניצוצות/חלקיקים · שביל-ההתקדמות והאורות שנדלקים · ברק-הזכוכית על הפנס · הצללות. אלה תאורה/אפקט — קלים ועקביים יותר ב-CSS.

## ✅ צ'קליסט מסירה
- [ ] 7 × lumi-*.png (רקע שקוף, אותו גודל/עיגון)
- [ ] 1 × lantern-shell.png (מרכז שקוף, בלי חיה)
- [ ] 5 × animals/pets/*.png (סט אחיד, רקע שקוף)
- [ ] 1 × grove-bg.png (אנכי, מרכז פנוי)
- [ ] (אופ') 3 × references/*.png
