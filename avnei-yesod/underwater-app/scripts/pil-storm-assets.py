#!/usr/bin/env python3
"""
PIL חובה על PNG מ-ChatGPT (לפי feedback_pil_chatgpt_pngs ב-MEMORY).
מסיר רקע לבן ומחזיר RGBA אמיתי + edge softening.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent.parent
DIR = ROOT / "assets" / "island-03" / "storm-game"

# רק האובייקטים — לא הרקעים (1 ו-2 צריכים רקע מלא)
TRANSPARENT_TARGETS = [
    "coral-mem-dark.png",
    "coral-mem-lit.png",
    "noni-sad-storm.png",
]


def remove_white_bg(input_path: Path):
    img = Image.open(input_path).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    changed = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # רקע לבן מלא -> שקיפות מלאה
            if r >= 240 and g >= 240 and b >= 240:
                pixels[x, y] = (r, g, b, 0)
                changed += 1
            # שוליים בהירים -> שקיפות חלקית (edge softening)
            elif r >= 220 and g >= 220 and b >= 220:
                pixels[x, y] = (r, g, b, int(a * 0.4))
    img.save(input_path, "PNG", optimize=True)
    return changed, w * h


def main():
    for name in TRANSPARENT_TARGETS:
        p = DIR / name
        if not p.exists():
            print(f"MISSING: {name}")
            continue
        changed, total = remove_white_bg(p)
        pct = (changed / total) * 100 if total else 0
        print(f"OK {name}: {changed}/{total} pixels made transparent ({pct:.1f}%)")


if __name__ == "__main__":
    main()
