# ChatGPT Prompt — Fish Rescue Assets (Island 3)

## איך להשתמש

1. פתחי [ChatGPT](https://chatgpt.com) (DALL·E / GPT-4o image)
2. הדביקי את **הפרומפט הראשון** (סט אצות + דגיגים)
3. הורידי את 4 התמונות
4. אם משהו לא מתאים — השתמשי ב-**Prompt Variations** למטה
5. שמרי לתיקייה: `avnei-yesod/underwater-app/assets/island-03/rescue-game/`

## שמות קבצים שאני מצפה לקבל

```
seaweed-closed.png   ← אצה סגורה (תבנית אחת — נשכפל ב-CSS עם letters)
seaweed-open.png     ← אותה אצה אחרי שנפתחה (ריקה)
fish-school.png      ← להקת 5-6 דגים שוחה יחד (לחגיגת הסיום)
fish-single.png      ← דגיג בודד (לאנימציית "שחרור" + מקומות ב-school-row)
```

---

## 🎨 PROMPT 1 — Main Asset Set (העתיקי הכל)

```
Create a set of 4 transparent-background PNG illustrations for a children's
educational app. Style: soft pastel watercolor with subtle 3D shading, gentle
glowing highlights, similar to Sago Mini and underwater storybook art for ages
5-7. Color palette: cyan (#A8E8FF), turquoise (#73D9D1), coral pink (#FFA98D),
warm peach (#FFE7A8), soft purple (#D9D2FF). NO text, NO letters, NO words on
any asset. NO realistic / photographic style. NO dark or saturated colors.
NO sharp outlines — use soft, dreamy edges. Each image must be on a fully
transparent background (alpha channel), square 1024x1024.

Image 1 — "seaweed-closed.png":
A friendly closed seaweed pod, vertical orientation, shaped like a teardrop
or rounded cocoon with soft ribbed texture. Pastel cyan-to-coral gradient.
The pod has a small subtle "seam" down the middle hinting it can open.
Gentle highlights, dreamy underwater glow. Imagine a hug-shaped seaweed pouch
holding a little secret inside. No fish visible — just the closed pod.
Centered, full body, no shadow on ground.

Image 2 — "seaweed-open.png":
The SAME seaweed pod as Image 1 — same shape, same colors, same proportions —
but now open: split into two halves curling outward like petals, revealing a
soft glowing empty interior with sparkles and bubbles. The two halves should
look like the two sides of the closed pod from Image 1, just spread apart.
No fish inside — it's already been released. Glowing inner light (warm peach
to white).

Image 3 — "fish-single.png":
One small cute baby fish, side view, swimming pose, friendly cartoon style.
Soft pastel coloring (use coral pink #FFA98D as primary), round body, big
gentle eyes, tiny smile, simple fins, soft watercolor texture. Imagine a
Sago Mini character. Facing LEFT (so it looks like swimming out from a
seaweed on the right). About 60% of canvas, centered.

Image 4 — "fish-school.png":
A happy school of 5-6 different baby fish swimming together, side view,
all in soft pastels (mix of coral pink, peach, cyan, soft purple, mint).
Each fish slightly different shape/color but same friendly style. They are
swimming in a loose cluster from left to right, with tiny bubbles around them.
This is the "celebration" image when all fish are reunited. Soft underwater
glow, dreamy atmosphere. No text, no background — transparent.

CRITICAL:
- ALL 4 images must have FULLY TRANSPARENT backgrounds (PNG alpha)
- NO white squares, NO checkerboard, NO color background
- Same art style across all 4 (consistent)
- Soft watercolor + gentle 3D — NOT flat vector, NOT realistic photo
- Friendly, gentle, NO scary or aggressive elements
```

---

## 🎨 PROMPT 2 — If you need MORE FISH VARIATIONS

If `fish-school.png` looks bad or you want individual fish, use this:

```
Create 6 separate transparent PNG images of cute baby fish, side view,
swimming pose, all in the SAME art style: soft pastel watercolor with subtle
3D shading, Sago Mini influence, for kids ages 5-7. Each fish facing LEFT.

Same body shape (round, friendly, big gentle eyes, tiny smile), but different
COLORS:
- fish-1.png — coral pink (#FFA98D)
- fish-2.png — soft peach (#FFE7A8)
- fish-3.png — cyan (#A8E8FF)
- fish-4.png — turquoise (#73D9D1)
- fish-5.png — soft purple (#D9D2FF)
- fish-6.png — mint (#B8F2CF)

Transparent background, 512x512 each, centered. No text, no shadows,
no environment.
```

---

## 🎨 PROMPT 3 — If you need seaweed VARIATIONS (closed in different colors)

If we want 5 distinct seaweed pods (not just 1 repeated):

```
Create 5 transparent PNG variations of the same closed seaweed pod from
"seaweed-closed.png" — same teardrop/cocoon shape, same proportions, same
soft pastel watercolor style — but each in a slightly different color combo:

- seaweed-1.png — cyan + coral pink (the original)
- seaweed-2.png — turquoise + soft purple
- seaweed-3.png — mint + peach
- seaweed-4.png — cyan + soft purple
- seaweed-5.png — peach + coral pink

All vertical orientation, dreamy underwater glow, no fish visible,
transparent background, 1024x1024.
```

---

## 🚫 What to AVOID

- ❌ Realistic photographic seaweed/fish (kelp, salmon, etc.) — must be cartoon
- ❌ Bright saturated colors (red, neon, black) — only soft pastels
- ❌ Sharp dark outlines like flat vector — we want soft watercolor edges
- ❌ Aggressive expressions (sharp teeth, angry eyes) — friendly only
- ❌ Background of any kind — must be fully transparent

---

## ✅ Reference: Existing assets to match style

Look at these for style reference:
- `assets/island-03/shell-game/shell-closed.png` (pearl-like pastel pod)
- `assets/island-03/shell-game/shell-open.png` (split open with glow)
- `assets/noni-idle.png` (the character — same world)

The new fish-rescue assets should feel like they're from the same illustrated
storybook as the shell-game and Noni.
