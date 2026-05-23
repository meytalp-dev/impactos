"""
PIL post-process — הופך רקע בהיר (RGB) לשקיפות אמיתית (RGBA).
מריצים על כל PNG שחוזרת מ-ChatGPT.

לקח קריטי מ-project-avnei-yesod-island3-mem-lessons:
ChatGPT מחזיר PNG כ-RGB (אין alpha channel) — הרקע "שקוף" שלו
הוא בעצם לבן/בז'. בלי PIL, התמונה מופיעה עם ריבוע לבן.
"""

import sys
from PIL import Image
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

HERE = Path(__file__).parent

TARGETS = [
    "coral-house.png",
    "coral-bricks.png",
    "noni-in-window.png",
]

# סף הבהירות — פיקסל עם R+G+B מעל הסף יהפוך לשקוף
LIGHT_THRESHOLD = 240  # כל אחד מ-RGB
EDGE_THRESHOLD = 220   # softening באזורי קצה


def make_transparent(src_path: Path):
    img = Image.open(src_path).convert("RGBA")
    pixels = img.load()
    w, h = img.size

    flipped = 0
    softened = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r > LIGHT_THRESHOLD and g > LIGHT_THRESHOLD and b > LIGHT_THRESHOLD:
                pixels[x, y] = (r, g, b, 0)
                flipped += 1
            elif r > EDGE_THRESHOLD and g > EDGE_THRESHOLD and b > EDGE_THRESHOLD:
                pixels[x, y] = (r, g, b, 80)
                softened += 1

    img.save(src_path)
    total = w * h
    print(f"OK {src_path.name}: {flipped:,} px -> transparent ({flipped/total*100:.1f}%), "
          f"{softened:,} edge softened ({softened/total*100:.1f}%)")


if __name__ == "__main__":
    for name in TARGETS:
        p = HERE / name
        if p.exists():
            make_transparent(p)
        else:
            print(f"✗ skipping (not found): {p}")
    print("Done.")
