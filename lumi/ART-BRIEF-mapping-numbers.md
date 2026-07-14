# ART-BRIEF · כרטיסי כמות/מספרים למיפוי (חסר — הנחיות GPT)

**למה:** מספרים (one–ten) הם אוצר-ליבה חוצה-נושא, אבל אין תמונות-כמות → אין פריט-מספרים במיפוי (`mapping.html`) ובמאגר-הפריטים. האודיו כבר קיים (`one`…`ten`, `howmany-*`). צריך רק **כרטיסי כמות** בסגנון לומי.

**מה מייצרים:** 10 כרטיסים — כל כרטיס = קבוצה של N אובייקטים זוהרים לספירה (N=1…10). האובייקט הקבוע (פנס/גחלילית/כוכב) חוזר בכל הכרטיסים; **רק הכמות משתנה** — כדי שהילד סופר, לא מזהה צורה.

**סגנון (חובה — תואם לכרטיסי החיות/פירות הקיימים):** אותו סגנון רך, ציורי, חמים כמו שאר נכסי לומי — חורשת-פנסים בין-ערביים, זהב/אפרסק/סגול. אובייקט חמוד וזוהר. **רקע שקוף (PNG, alpha).** בלי טקסט, בלי ספרות, בלי רקע.

---

## פרומפט ל-GPT / DALL·E (הריצי 10 פעמים, פעם לכל כמות)

```
A children's storybook illustration of EXACTLY {N} identical glowing paper
lanterns, arranged in a clear, easy-to-count cluster on a transparent background.

Style: soft painterly, warm and cute, Pixar/Ghibli glow — the same look as a
cozy lantern-grove at dusk (warm gold, peach, amber light). Each lantern is round,
softly glowing from within, floating gently. Identical lanterns, same size and color.

VERY IMPORTANT:
- EXACTLY {N} lanterns — no more, no less. (replace {N} with the number 1..10)
- NO numbers, NO digits, NO text, NO letters anywhere.
- Transparent background (PNG alpha), no scene, no ground, no frame.
- Lanterns clearly separated so they are easy to count.
```

**הערות:**
- אם GPT מתקשה בכמות מדויקת בכמויות גבוהות (7–10) — לייצר, ולספור ידנית לפני שמירה (חשוב שהכמות מדויקת בול).
- אפשר להחליף "lanterns" ב-"fireflies" או "stars" אם רוצים אובייקט אחר — רק לשמור עקביות בין כל 10 הכרטיסים.

## שמות קבצים ומיקום
`app/assets/numbers/qty-1.png` … `qty-10.png` (10 קבצים).

## אחרי שהאמנות מוכנה (מה שאני אעשה בקוד)
1. פריט-מיפוי חדש ב-`mapping.html`: לומי אומר `three` → 3 כרטיסי-כמות (3/…/…) → הילד נוגע ב-3. תיוג `topic:'numbers', canDo:'recognize-quantity', band:'B1'`.
2. אופציונלי: להעשיר את `count-the-lanterns` בכרטיסים האמיתיים במקום קבוצות-אמוג'י.
