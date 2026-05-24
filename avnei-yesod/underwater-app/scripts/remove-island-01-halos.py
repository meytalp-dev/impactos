#!/usr/bin/env python3
"""
מסיר את הרקע הלבן/קרם של ChatGPT מ-15 תמונות אי 1 — משאיר
את ההילה הצהובה ואת הדמות עצמה.

הבעיה: ChatGPT הוסיף ריבוע פנימי לבן/קרם (RGB≈255,251,236) מסביב
לדמות, בתוך אזור ההילה. הריבוע הזה אטום ונראה כ"רקע" בתוך הבועות.

הפתרון: לזהות פיקסלים בהירים-אכרומטיים (R≈G≈B, כולם גבוהים)
ולהחזיר להם alpha=0. ההילה הצהובה (B<220) נשמרת.

שימוש: python remove-island-01-halos.py
"""
import sys
import shutil
from pathlib import Path
from PIL import Image
import numpy as np

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ASSETS_DIR = Path(__file__).parent.parent / "assets" / "island-01"
BACKUP_DIR = ASSETS_DIR / "_with-white-bg-backup"
BACKUP_DIR.mkdir(exist_ok=True)

SKIP = {"bay-bg.png"}

# White/cream detection thresholds
WHITE_R_MIN = 245
WHITE_G_MIN = 240
WHITE_B_MIN = 225        # if B is high → it's white/cream, not yellow
ACHROMATIC_MAX_DIFF = 22 # R-B difference must be small (i.e. not yellow)


def remove_white_bg(src_path: Path) -> str:
    img = Image.open(src_path).convert("RGBA")
    arr = np.array(img)

    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    diff_rb = r.astype(int) - b.astype(int)

    white_mask = (
        (r >= WHITE_R_MIN) &
        (g >= WHITE_G_MIN) &
        (b >= WHITE_B_MIN) &
        (a > 200) &
        (diff_rb < ACHROMATIC_MAX_DIFF)
    )

    # Soft edges — pixels that are partially white-cream should also fade
    near_white_mask = (
        (r >= 235) & (g >= 230) & (b >= 215) &
        (a > 100) & (diff_rb < 30)
    ) & ~white_mask

    # Apply: full white → alpha=0; near-white → reduced alpha
    arr[white_mask, 3] = 0
    arr[near_white_mask, 3] = (arr[near_white_mask, 3] * 0.4).astype(np.uint8)

    cleaned = Image.fromarray(arr, "RGBA")
    cleaned.save(src_path)

    removed = white_mask.sum()
    softened = near_white_mask.sum()
    return f"OK   {src_path.name}: removed {removed:,} px, softened {softened:,} px"


def main():
    pngs = [p for p in sorted(ASSETS_DIR.glob("*.png")) if p.name not in SKIP]
    print(f"Processing {len(pngs)} images in {ASSETS_DIR}")
    print(f"Backups -> {BACKUP_DIR}")
    print("=" * 70)

    for i, src in enumerate(pngs, 1):
        # backup if not already
        backup = BACKUP_DIR / src.name
        if not backup.exists():
            shutil.copy2(src, backup)
        try:
            result = remove_white_bg(src)
            print(f"[{i}/{len(pngs)}] {result}")
        except Exception as e:
            print(f"[{i}/{len(pngs)}] FAIL {src.name}: {type(e).__name__}: {e}")

    print("=" * 70)
    print("Done. Originals backed up to _with-white-bg-backup/")


if __name__ == "__main__":
    main()
