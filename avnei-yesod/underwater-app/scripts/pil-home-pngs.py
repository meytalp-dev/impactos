"""
Strip the opaque/checkerboard background from the journey-game home PNGs.

ChatGPT exports come as RGB with an opaque white-ish background even when the
checkerboard suggests transparency. PIL converts RGB → RGBA and turns near-white
pixels transparent, with a soft edge ramp on lighter pixels.

Run from repo root:
    python avnei-yesod/underwater-app/scripts/pil-home-pngs.py
"""

from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent.parent / "assets" / "island-03" / "journey-game"

PAIRS = [
    ("home-closed-raw.png", "home-closed.png"),
    ("home-open-raw.png",   "home-open.png"),
]

OPAQUE_THRESHOLD  = 240   # brightness >= this → fully transparent
EDGE_THRESHOLD    = 220   # brightness in [220, 240) → soft edge


def process(src: Path, dst: Path) -> None:
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size

    transparent = 0
    softened = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            brightness = (r + g + b) / 3
            if brightness >= OPAQUE_THRESHOLD:
                px[x, y] = (r, g, b, 0)
                transparent += 1
            elif brightness >= EDGE_THRESHOLD:
                ramp = (OPAQUE_THRESHOLD - brightness) / (OPAQUE_THRESHOLD - EDGE_THRESHOLD)
                px[x, y] = (r, g, b, int(255 * ramp))
                softened += 1

    im.save(dst, "PNG", optimize=True)
    total = w * h
    print(f"{src.name} -> {dst.name}")
    print(f"  size       : {w}x{h}")
    print(f"  transparent: {transparent} ({100*transparent/total:.1f}%)")
    print(f"  softened   : {softened}")


def main() -> None:
    for raw, out in PAIRS:
        src = HERE / raw
        dst = HERE / out
        if not src.exists():
            print(f"skip — missing {src}")
            continue
        process(src, dst)


if __name__ == "__main__":
    main()
