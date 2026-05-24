# הנחיית תיקון — להחיל את הסטנדרט הוויזואלי החדש על אי 3

> מסמך זה נכתב ב-23.5.2026 כדי להעביר לשיחה חדשה את ההנחיה לתיקון משחקוני אי 3 הקיימים, כך שיתאימו לסטנדרט הוויזואלי שאומת ב-`underwater-app/onboarding.html`.

---

## ההקשר

**מה זה אבני יסוד:** מערכת תרגול דיפרנציאלית לרכישת קריאה בעברית לכיתה א'. מבוססת על 22 איים פדגוגיים, BKT, ו-Companion (נוני — אבן/תמנון).

**מה כבר נעשה (23.5.2026):**
- בנינו את `underwater-app/onboarding.html` — המסע הראשון של תלמיד.ה (5-7 דק', 5 שלבים).
- בתוכו פיתחנו **סטנדרט ויזואלי חדש** של בועות, אלמוגי-אותיות, ותמונות שקופות ממורכזות.
- מיטל אישרה: "מקסים! הלוואי שזה היה נראה ככה בתוך המשחקונים של אי 3."

**המשימה הנוכחית:** להחיל את הסטנדרט הזה על 5 משחקוני אי 3 הקיימים.

---

## הסטנדרט הוויזואלי המחייב

קרא במלואו: [`memory/feedback_avnei_yesod_visual_standard.md`](../../../../.claude/projects/c--Users-meyta-Downloads-ort-presentation-builder/memory/feedback_avnei_yesod_visual_standard.md)

תקציר:
- **בועת תמונה (.bubble)**: 180×180px, רקע גלאסי, ברק עליון, פעימה רכה 4s, glow צבעי לפי מצב
- **תמונה בתוך בועה**: 70% מהבועה, object-fit: contain, ממורכזת, **רקע שקוף**
- **אלמוג-אות**: SVG flat-vector, אות Rubik 72px, glow זוהר/הצלחה
- **מצבי טעות**: **לעולם לא אדום** — רק shake רכה
- **PIL transparency חובה** על כל PNG חדש

הקבצים הסמכותיים לעיון:
- `underwater-app/onboarding.html` — המסע המלא (המקור)
- `underwater-app/onboarding-components.html` — preview של הרכיבים במצבים שונים
- `underwater/design-system.md` — פלטה וטוקנים

---

## 5 הקבצים לתיקון

| קובץ | משחקון |
|---|---|
| `underwater-app/stage-3-house.html` | משחקון הבית (אות מ') |
| `underwater-app/stage-3-rescue.html` | הצלת דגים (אות ק') |
| `underwater-app/stage-3-shell.html` | צדף קסום (אות מ' עם trace) |
| `underwater-app/stage-3-storm.html` | סערה (אות ת') |
| `underwater-app/stage-3-trail-resh.html` | שביל החזרה (אות ר') |

---

## צעדי הביצוע

### צעד 1 — חילוץ ה-CSS המשותף
- צור `underwater-app/css/components.css` חדש (או הרחב את הקיים אם יש).
- העתק מ-`onboarding.html` את ה-CSS של:
  - `.bubble` + מצביה (`zoharet`, `correct`, `wrong-pulse`) + animations (`bubble-breath`, `bubble-hint`, `bubble-pop`, `bubble-shake`)
  - `.coral` + מצביה (`zoher`, `correct-glow`) + animations (`coral-idle`, `coral-sway`, `coral-bloom`)
  - `.word-bubble` (אם נדרש)
- ודא ש-`:root` tokens מוגדרים (`--water-main`, `--gold-hint`, `--success`, וכו'). אם הם כבר ב-`tokens.css` הקיים — להסתפק בייבוא.

### צעד 2 — לכל אחד מ-5 המשחקונים
א. **זהה את כל ה-`.png` שמוצגים** במשחקון. רשום אותם.

ב. **הרץ PIL transparency** על כל אחד מהם. סקריפט inline (העתק והרץ עם python):
```python
from PIL import Image
from pathlib import Path

LIGHT = 240
EDGE = 220
files = [
    # החלף לרשימה הספציפית של הקובץ
    Path('c:/Users/meyta/Downloads/impactos/avnei-yesod/underwater-app/assets/island-03/SOMETHING.png'),
]

for p in files:
    if not p.exists():
        print(f'SKIP {p.name}')
        continue
    img = Image.open(p).convert('RGBA')
    px = img.load()
    w, h = img.size
    flipped = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r > LIGHT and g > LIGHT and b > LIGHT:
                px[x, y] = (r, g, b, 0); flipped += 1
            elif r > EDGE and g > EDGE and b > EDGE:
                px[x, y] = (r, g, b, 80)
    img.save(p)
    print(f'OK {p.name}: {flipped:,} px transparent ({flipped/(w*h)*100:.1f}%)')
```

ג. **הרץ PIL crop-center** אחרי transparency:
```bash
python underwater-app/scripts/pil-crop-center-assets.py <path-to-image>
```

ד. **החלף את ה-CSS הקיים** ב-class הסטנדרטי. במיוחד:
- כל element שמציג תמונה בעיגול → להפוך ל-`.bubble` הסטנדרטי
- כל אות מוצגת → להפוך ל-`.coral` עם SVG flat-vector
- להסיר X אדומים, צלילי כישלון, "Game Over"
- ודא ש-mistake feedback הוא רק `wrong-pulse` (לא אדום)

ה. **בדוק במכשיר**:
- האם הבועה ברוחב 180px (140 במובייל)?
- האם התמונה ממוקמת 70% מהבועה, ממורכזת?
- האם יש רקע לבן בתמונה? (אם כן — PIL נכשל, לחזור על שלב ב')
- האם הפעימה רכה?
- האם הטעות לא אדומה?

### צעד 3 — בדיקה כללית
פתח את כל 5 המשחקונים בדפדפן ובדוק שהם:
- נראים עקביים אחד עם השני
- עקביים עם `onboarding.html`
- אין שום תמונה עם רקע לבן
- אין שום X אדום או צבע אזהרה

---

## הקפדות קריטיות

1. **רקע שקוף** — אסור שתופיע תמונה עם ריבוע לבן. אם זה קורה, PIL לא רץ נכון או לא רץ כלל.
2. **גודל אחיד** — 180×180 לבועות בכל המשחקונים (לא 200, לא 160).
3. **אין אימוג'ים** — תמונות SVG/PNG בלבד. מיטל לא אוהבת אימוג'ים בקבצים.
4. **לא אדום** — אף פעם, בשום מצב שגיאה. רק shake קטנה.
5. **שמות אנגלית לקבצים** — אם יוצרים PNG חדשים, slug-באנגלית.

---

## הקשר מהזיכרון (חובה לקרוא לפני)

- `feedback_avnei_yesod_visual_standard.md` — הסטנדרט המלא
- `project_avnei_yesod_island3_mem_lessons.md` — 19 לקחים מבניית האות מ' באי 3
- `feedback_pil_chatgpt_pngs.md` — למה PIL transparency חיוני
- `feedback_pil_crop_center_chatgpt.md` — למה גם crop-center חיוני
- `feedback_image_generation_meytal_task.md` — אם יש צורך ביצירת PNG חדשים, מיטל מייצרת ב-ChatGPT (לא Claude)

---

## הערה אחרונה

המשחקונים הקיימים באי 3 **עובדים** — הם לא שבורים. רק נראים פחות יפה מהסטנדרט החדש. לכן זה ריפקטור ויזואלי, לא בנייה מחדש. שמור על כל הלוגיקה הקיימת, רק החלף את שכבת ה-CSS וודא שתמונות שקופות וממורכזות.
