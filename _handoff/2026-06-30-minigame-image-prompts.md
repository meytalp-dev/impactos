# גיליון Prompts לתמונות משחקונים — בנק שאלות כיתה א'

> 30.6.2026 · נכתב ע"י Claude עבור מיטל פלג · מקור: `avnei-yesod/curriculum/questions-grade1.json`
> מיפוי קובץ↔label: `avnei-yesod/curriculum/image-map.json` · יעד הנכסים: `avnei-yesod/underwater-app/assets/bank/`

## איך משתמשים

1. הריצי כל prompt ב-GPT (image). **הדביקי קודם את "preamble הסגנון" פעם אחת בתחילת השיחה**, ואז כל prompt בנפרד — כך כל 47 התמונות יוצאות אחיד.
2. שמרי כל קובץ בשם המדויק מעמודת **`file`** (תואם ל-`image-map.json`).
3. הפילי את כל הקבצים ל-`avnei-yesod/underwater-app/assets/bank/`. תגידי לי — אני מעדכן `status: ready` ב-map ומחווט.
4. **⭐ = באטץ' הפיילוט (10 תמונות).** מספיק להריץ אותן קודם כדי לאמת את הפלואו לפני הפקת כל ה-47.

## ⚠️ הערות לפני שמתחילים

- **13 העצמים הבודדים** — בִּדקי קודם ב-`assets/island-01` ו-`assets/island-03`: חלקם כבר קיימים (kadur, sefer, kelev, chatul...). אם קיים — דלגי, רק עדכני את ה-`file` ב-map לקובץ הקיים.
- **סצנות (25)** — אלו ההרכבות החדשות (יחס-מקום, זכר/נקבה, כמות) שאין בספרייה. כאן עיקר העבודה.
- **זוגות-ניגוד** (כדור-בתוך/ליד · ילד-נותן/ילדה-נותנת · קנגורו-עם/בלי כדור) — חייבים להיות **זהים בכל פרט חוץ מההבדל הנבדק**, אחרת השאלה לא תקפה. שמרתי לכל זוג prompt עם דרישת-עקביות מפורשת.

---

## 🎨 PREAMBLE הסגנון — הדביקי פעם אחת בראש שיחת GPT

```
You are illustrating flashcards for a Hebrew first-grade (age 6) reading app
set in a friendly underwater world. Style for EVERY image I ask for next:
- Flat, soft, rounded children's-book illustration. Friendly and warm.
- Clean PLAIN WHITE background, no scenery, no shadows on the ground — the
  object/scene floats centered with generous margin (easy to cut out).
- Bright but soft pastel palette (teal, coral, sand, sky-blue, warm yellow).
- Thick clean outlines, simple shapes, no fine detail, no gradients-heavy look.
- NO text, NO letters, NO numbers anywhere in the image.
- Single clear focal subject, unambiguous, instantly recognizable to a 6-year-old.
- Square 1:1, centered.
Confirm and then wait for each item.
```

---

## A · עצמים בודדים (13) — בִּדקי קיום בספרייה קודם

| ⭐ | file | מילה | Prompt |
|----|------|------|--------|
| ⭐ | `nmlh.png` | נְמָלָה | A single friendly ant, side view, simple and cute. |
| ⭐ | `tzlm.png` | צַלָּם | A photographer: a person holding a camera up to their eye. |
|  | `mth.png` | מַטֶּה (מקל) | A simple wooden walking staff / stick, vertical. |
|  | `db.png` | דֹּב | A cute brown bear, sitting, front view. |
|  | `kdvr.png` | כַּדּוּר | A simple ball (check island assets first — likely exists). |
|  | `prch.png` | פֶּרַח | A single simple flower with a stem and a few petals. |
|  | `chlh.png` | חַלָּה | A braided challah bread loaf. |
|  | `nchsh.png` | נָחָשׁ | A friendly cartoon snake, coiled, smiling. |
|  | `mym.png` | מַיִם | A simple splash / drop of blue water. |
|  | `sh.png` | אֵשׁ | A small friendly campfire flame. |
|  | `ysh.png` | אִישׁ | A simple standing man, neutral, full body. |
|  | `tz.png` | עֵץ | A single simple tree with a round green crown. |
|  | `dly-lbd.png` | דְּלִי לְבַד | A single empty bucket, alone, centered. |

---

## B · צבעים (9) — אותו עצם, רק הצבע משתנה

> ⚠️ לשלושת הכדורים ולשלושת הפרחים: **אותו עצם בדיוק** (אותה צורה/גודל/זווית), רק הצבע מתחלף. הריצי כ-set רצוף.

| ⭐ | file | מילה | Prompt |
|----|------|------|--------|
| ⭐ | `kdvr-dm.png` | כַּדּוּר אָדֹם | A simple round ball, solid RED. Same ball shape I'll reuse for other colors. |
| ⭐ | `kdvr-ktm.png` | כַּדּוּר כָּתֹם | The exact same ball, solid ORANGE. |
| ⭐ | `kdvr-kchl.png` | כַּדּוּר כָּחֹל | The exact same ball, solid BLUE. |
|  | `prch-dm.png` | פֶּרַח אָדֹם | A simple flower, RED petals, green stem. Same flower for other colors. |
|  | `prch-vrd.png` | פֶּרַח וָרֹד | The exact same flower, PINK petals. |
|  | `prch-ktm.png` | פֶּרַח כָּתֹם | The exact same flower, ORANGE petals. |
|  | `tpvch-dm.png` | תַּפּוּחַ אָדֹם | A single RED apple with a small green leaf. |
|  | `lh-yrk.png` | עָלֶה יָרֹק | A single GREEN leaf. |
|  | `shmym-kchlym.png` | שָׁמַיִם כְּחֻלִּים | A patch of BLUE sky with one small soft cloud. |

---

## C · יחס-מקום + הבנת-נקרא (סצנות) — זוגות-ניגוד

> ⚠️ הספר, הדלי והרקע **זהים** בכל הסצנות — רק מיקום הספר משתנה.

| ⭐ | file | תיאור עברי | Prompt |
|----|------|-----------|--------|
| ⭐ | `spr-btvk-hdly.png` | סֵפֶר בְּתוֹךְ הַדְּלִי | A bucket with a closed book INSIDE it (book sticking out of the top). Same bucket+book I'll reuse. |
| ⭐ | `spr-lyd-dly.png` | סֵפֶר לְיַד דְּלִי | The same bucket and same book, but the book is lying NEXT TO the bucket on the ground. |
|  | `yld-yvshb-lyd-shlchn.png` | יֶלֶד יוֹשֵׁב לְיַד שֻׁלְחָן | A boy sitting on a chair next to a table. |
|  | `klb-yshn.png` | כֶּלֶב יָשֵׁן | A dog lying down, sleeping, eyes closed, small "Z" not allowed (no text) — show curled and peaceful. |
|  | `dg-l-shlchn.png` | דָּג עַל שֻׁלְחָן | A fish lying ON TOP of a table. |
|  | `dg-bym.png` | דָּג בַּיָּם | The same fish swimming IN THE SEA (blue water around it). |
|  | `shlchn-ryk.png` | שֻׁלְחָן רֵיק | An empty table, nothing on it. |
|  | `yld-yvshb-l-slm.png` | יֶלֶד יוֹשֵׁב עַל סֻלָּם | A boy sitting on a ladder rung. |
|  | `yldh-yvshbt-l-slm.png` | יַלְדָּה יוֹשֶׁבֶת עַל סֻלָּם | A girl sitting on a ladder rung (clearly a girl: dress/long hair). |
|  | `yldh-yvshbt-l-ks.png` | יַלְדָּה יוֹשֶׁבֶת עַל כִּסֵּא | A girl sitting on a chair. |

---

## D · זכר/נקבה + פעולה (מורפולוגיה) — הדמויות חייבות להיות נבדלות

> ⚠️ בכל הסצנות: **ילד = שיער קצר/מכנס · ילדה = שיער ארוך/שמלה**, עקבי. בזוג "נותן/נותנת" התפקידים מתהפכים — שמרי שאר הפרטים זהים.

| ⭐ | file | תיאור עברי | Prompt |
|----|------|-----------|--------|
| ⭐ | `yldh-nvtnt-trvph-lyld.png` | יַלְדָּה נוֹתֶנֶת תְּרוּפָה לְיֶלֶד | A GIRL handing a medicine spoon/bottle TO a BOY. The girl is the giver. |
| ⭐ | `yld-nvtn-trvph-lyldh.png` | יֶלֶד נוֹתֵן תְּרוּפָה לְיַלְדָּה | The same two children, but now the BOY is handing the medicine TO the GIRL (roles swapped). |
|  | `yldh-shvth-trvph.png` | יַלְדָּה שׁוֹתָה תְּרוּפָה | A girl drinking/taking medicine from a spoon herself. |
|  | `yld-rtz.png` | יֶלֶד רָץ | A boy running. |
|  | `yld-rtz-bchtzr.png` | יֶלֶד רָץ בֶּחָצֵר | A boy running in a yard/playground. |
|  | `yld-yvshb.png` | יֶלֶד יוֹשֵׁב | A boy sitting. |
|  | `yldh-rtzh.png` | יַלְדָּה רָצָה | A girl running (clearly a girl). |
|  | `yld-kvptz-lym.png` | יֶלֶד קוֹפֵץ לַיָּם | A boy jumping into the sea. |
|  | `yld-yshn-bmth.png` | יֶלֶד יָשֵׁן בַּמִּטָּה | A boy sleeping in a bed. |
|  | `yld-mchzyk-kdvr.png` | יֶלֶד מַחֲזִיק כַּדּוּר | A boy holding a ball in his hands. |

---

## E · כמות (מספרים) — קנגורו, ניגודי "עם/בלי" ו-"אחד/שניים"

> ⚠️ אותו קנגורו, אותו כדור. ההבדל היחיד = כמה קנגורו ומי מחזיק כדור.

| ⭐ | file | תיאור עברי | Prompt |
|----|------|-----------|--------|
|  | `kngvrv-mchzyk-kdvr.png` | קַנְגּוּרוּ מַחֲזִיק כַּדּוּר | ONE kangaroo holding a ball. |
|  | `shny-kngvrv-bly-kdvr.png` | שְׁנֵי קַנְגּוּרוּ בְּלִי כַּדּוּר | TWO identical kangaroos, neither holding a ball. |
|  | `kngvrv-bly-kdvr-chbrv-mchzyk-kdvr.png` | קַנְגּוּרוּ בְּלִי כַּדּוּר, חֲבֵרוֹ מַחֲזִיק כַּדּוּר | TWO kangaroos side by side: the left one has NO ball, the right one HOLDS a ball. |
|  | `yldh-l-slm-ml-mym-m-bvvt.png` | יַלְדָּה עַל סֻלָּם מֵעַל מַיִם עִם בּוּעוֹת | A girl on a ladder above water, with bubbles rising in the water below. |
|  | `bvvt-bmym-blbd.png` | בּוּעוֹת בַּמַּיִם בִּלְבַד | Just bubbles rising in blue water, nothing else. |

---

**סיכום:** 47 תמונות · 10 בפיילוט (⭐) · ~13 עצמים בודדים (חלקם קיימים — לבדוק). אחרי שתפילי ל-`assets/bank/` — תגידי, ואני מעדכן `image-map.json` ל-`ready` ומחווט את `image_src` בפלואו.
