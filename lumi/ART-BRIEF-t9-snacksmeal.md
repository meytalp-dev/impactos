# ART-BRIEF · T9 — 🍽️ Lumi's Picnic (Snacks & Meal)

מכניקה: scene-hide (סצנה־נסתרת). מילים: bread · egg · cake · milk · water.
סגנון: soft-3D storybook, פלטת lantern-grove (mint/aqua/warm-glow), פרצוף חמוד, PNG.
זרימה: GPT צובע רקע אטום → **rembg** לשקיפות אמיתית → `app/assets/food/*.png` (הרקע → `app/assets/worlds/picnic/`).

## סטטוס: ✅ כל 5 הפריטים + רקע פיקניק נמסרו, נחתכו (rembg) ומחוברים

| נכס | קובץ | סטטוס |
|---|---|---|
| לחם (פרוסה) | `assets/food/bread.png` | ✅ מושלם — פרצוף חמוד, glow זהוב |
| ביצה | `assets/food/egg.png` | ✅ נחתך — **ראה הערה↓** |
| עוגה (פרוסה) | `assets/food/cake.png` | ✅ מושלם — שכבות + זיגוג מנטה |
| חלב (בקבוק) | `assets/food/milk.png` | ✅ מושלם — בקבוק מלא, פרצוף |
| מים (כוס/קשית) | `assets/food/water.png` | ✅ מושלם — כוס שקופה + טיפת־מים זוהרת |
| רקע פיקניק | `assets/worlds/picnic/picnic-bg.png` | ✅ אטום — שמיכה משובצת + סל + עץ־פנסים |

## 🟡 ASK מיטל — נכס אחד לאישור
- **egg.png**: האיור הוא **ביצה מעוטרת/דקורטיבית** (עיטורי מנטה, עלה זוהר, טיפות סגולות) — יפה ועל־ה־DNA, אבל ייתכן שילד בן 6 יקרא אותה כ"קישוט/אבן־חן" ולא כ"ביצה/אוכל". המילה **egg / בֵּיצָה** מוכרת לחלוטין לגיל, אז אין `age_flag`; זו שאלת־**קריאוּת־איור** בלבד. אם מיטל רוצה — אפשר להפיק גרסה פשוטה יותר (ביצה חלקה/ביצה קשה חתוכה) עם אותו פרומפט GPT.

## גוצ׳ות שנלמדו
- **rembg alpha-matting נכשל ב־OOM** על ה־exports הגדולים (1024²+): הפכתי ל־`remove(post_process_mask=True)` בלי matting + הקטנת קלט ל־900px. הרקע (picnic-bg) נשמר אטום.
- שלד `.lg-stage` הועתק מ־safari-beam/family-photo (הבמה לא ריקה — `.measure-scene` height=660 ב־QA).
