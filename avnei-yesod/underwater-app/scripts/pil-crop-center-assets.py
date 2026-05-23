#!/usr/bin/env python3
"""
PIL crop & center — מתקנן כל PNG באי 3 כך שהדמות תהיה ממורכזת בריבוע
1:1 עם padding שווה מסביב.

הבעיה שזה פותר (לקח 23.5.2026):
ChatGPT מחזיר PNG ב-1024x1024 אבל הדמות לא תמיד ממורכזת — לעיתים
דחוסה לראש (קיפוד) או לצד. גם אחרי PIL transparency, ה-object-fit
ב-CSS לא יודע "להזיז" את הדמות. התוצאה: דמויות עלות לראש של הקונכייה.

הפתרון:
1. מוצא bounding box של הפיקסלים הלא-שקופים (img.getbbox())
2. גוזר לאותו bounding box
3. מציב במרכז canvas מרובע חדש עם padding שווה מסביב

זה פותר את הבעיה רוחבית לכל התמונות באי 3.

שימוש:
  python pil-crop-center-assets.py             # על כל island-03 recursively
  python pil-crop-center-assets.py path/to/img.png   # על תמונה ספציפית
"""

import sys
from pathlib import Path
from PIL import Image

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

PADDING_PCT = 10           # אחוז padding מסביב לדמות (מתוך הצד הארוך)
ALPHA_THRESHOLD = 8        # פיקסל "שקוף" אם alpha < threshold (סינון noise)


def crop_and_center(src_path: Path) -> str:
    try:
        img = Image.open(src_path).convert("RGBA")
    except Exception as e:
        return f"FAIL {src_path.name} (open: {e})"

    # Filter alpha channel by threshold (ignore near-transparent edge pixels)
    if ALPHA_THRESHOLD > 0:
        alpha = img.split()[-1]
        mask = alpha.point(lambda a: 255 if a >= ALPHA_THRESHOLD else 0)
        bbox = mask.getbbox()
    else:
        bbox = img.getbbox()

    if not bbox:
        return f"skip {src_path.name} (empty/all-transparent)"

    cropped = img.crop(bbox)
    cw, ch = cropped.size

    # Build square canvas with even padding
    longest = max(cw, ch)
    padding = int(longest * PADDING_PCT / 100)
    canvas_size = longest + 2 * padding

    new_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    x_offset = (canvas_size - cw) // 2
    y_offset = (canvas_size - ch) // 2
    new_img.paste(cropped, (x_offset, y_offset), cropped)

    new_img.save(src_path)
    return f"OK   {src_path.name}: cropped {cw}x{ch} -> centered {canvas_size}x{canvas_size}"


def process_path(target: Path):
    if target.is_file():
        return [crop_and_center(target)]
    # Recursive on directory
    pngs = sorted(target.rglob("*.png"))
    results = []
    for p in pngs:
        # Skip files that already start with _ (helper assets, configs)
        if p.name.startswith("_"):
            continue
        results.append(crop_and_center(p))
    return results


def main():
    if len(sys.argv) > 1:
        target = Path(sys.argv[1])
    else:
        # Default: all of assets/island-03/ recursively
        target = Path(__file__).parent.parent / "assets" / "island-03"

    if not target.exists():
        print(f"FAIL target not found: {target}")
        sys.exit(1)

    print(f"Processing: {target}")
    print(f"Settings: padding={PADDING_PCT}%, alpha_threshold={ALPHA_THRESHOLD}")
    print("=" * 70)

    results = process_path(target)
    print("\n".join(results))

    print("=" * 70)
    ok = sum(1 for r in results if r.startswith("OK"))
    skip = sum(1 for r in results if r.startswith("skip"))
    fail = sum(1 for r in results if r.startswith("FAIL"))
    print(f"Done: {ok} OK · {skip} skip · {fail} fail · total {len(results)}")


if __name__ == "__main__":
    main()
