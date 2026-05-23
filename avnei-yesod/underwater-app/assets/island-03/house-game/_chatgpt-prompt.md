# פרומפטים ל-ChatGPT — אסטים למשחקון "הבית של נוני" (אי 3, אות מ׳)

> **חשוב לפני שמייצרים:** הבית עצמו (5 לבנים + צורת מ׳) נבנה ב-SVG פנימי בקוד.
> האסטים שכאן הם **אופציונליים** — לעיטור ולהעמקת החוויה. אם אין זמן, המשחק עובד גם בלעדיהם.

---

## פרומפט #1 — נוני בחלון הבית (האסט הכי חשוב)

```
A cute cartoon child sea creature called "Noni" peeking from the window of a coral-built underwater house, smiling and waving hello. Soft pastel turquoise body, big shiny eyes, gentle smile. The house window is round/arched, glowing with warm golden light from inside. Sago Mini illustration style. Underwater pastel palette: aqua, turquoise, soft coral, pale gold. Soft watercolor textures, gentle drop shadow. PNG with TRANSPARENT BACKGROUND. Centered character with the window frame around them.

Square 1024x1024. NO realistic textures, NO photo style, NO 3D rendering. Hand-drawn cartoon style for ages 6-7. Friendly, calm, dreamy.
```

**שימוש:** `assets/island-03/house-game/noni-in-window.png`
**יוצג:** במסך הסיום, מעל הבית הסגור. אופציונלי.

---

## פרומפט #2 — חמש לבני אלמוג (אופציונלי — יש כבר ב-SVG)

```
Five coral building blocks for an underwater children's game, top-down view. Each block is a rectangular brick made of coral, in warm peach-gold gradient (#FFE7A8 to #FFA98D to #E27F66). White outline 2px. Soft drop shadow. Each block slightly different shape:
1. Wide flat foundation brick
2. Tall left column brick
3. Tall right column brick
4. Short middle column brick
5. Long roof beam

Sago Mini style. Pastel underwater palette. Cute, child-friendly. PNG with TRANSPARENT BACKGROUND. Square 1024x1024 layout with the 5 bricks arranged in a row.
```

**שימוש:** `assets/island-03/house-game/coral-bricks-set.png`
**יוצג:** placeholder אם רוצים להחליף את ה-SVG הפנימי. לא חובה.

---

## פרומפט #3 — סצנת בית מואר בסוף (תמונה אווירתית, לא חובה)

```
A magical underwater coral house at the bottom of a calm pastel sea, shaped like the Hebrew letter "מ" (with two outer pillars, one inner pillar, and a flat roof). Coral-built walls in warm peach and gold. Two arched windows glowing with warm golden light. A small coral flag on top. Gentle bubbles floating up. Pastel turquoise water with soft beams of light filtering down. Sago Mini storybook illustration style. Cute, calm, dreamy.

Square 1024x1024. PNG with transparent OR pale turquoise background. Hand-drawn cartoon style for ages 6-7.
```

**שימוש:** `assets/island-03/house-game/house-scene.png`
**יוצג:** רקע למסך הסיום (אופציונלי — כרגע מסך הסיום הוא overlay טורקיז).

---

## ⚠️ פוסט-פרוסס חובה (PIL) — לכל PNG שחוזרת מ-ChatGPT

ChatGPT מחזיר RGB ללא alpha channel אמיתי — הרקע "שקוף" שלו הוא בעצם לבן/בז'.

**סקריפט פייתון להפעיל אחרי כל אסט:**

```python
from PIL import Image

src = "noni-in-window.png"  # החלף לכל קובץ
img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        # פיקסל בהיר → שקוף
        if r > 240 and g > 240 and b > 240:
            pixels[x, y] = (r, g, b, 0)
        # edge softening
        elif r > 220 and g > 220 and b > 220:
            pixels[x, y] = (r, g, b, 80)

img.save(src)
print(f"✓ {src} — transparent background applied")
```

---

## סדר עדיפויות

1. **פרומפט #1 (נוני בחלון)** — הכי משדרג, פחות מ-5 דקות לעשות.
2. **פרומפט #3 (סצנת בית מואר)** — נחמד אבל לא קריטי.
3. **פרומפט #2 (לבנים)** — דלגי, ה-SVG פנימי טוב מספיק.

המשחק עובד מצוין גם בלי שום אסט.
