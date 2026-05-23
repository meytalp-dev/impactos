"""
Process ChatGPT-generated PNGs for transparency + soft edges.

Lessons applied (from project-avnei-yesod-island3-mem-lessons):
  #4 — ChatGPT PNGs come as RGB (no alpha). Convert to RGBA + transparency.
"""
from PIL import Image
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
FILES = ['seaweed-closed.png', 'seaweed-open.png',
         'fish-single.png', 'fish-school.png']

# Threshold for "this is background, make it transparent"
# Anything brighter than this becomes fully transparent.
HARD_THRESHOLD = 240
# Threshold for "this is an edge, soften it"
# Anything brighter than this gets reduced alpha.
SOFT_THRESHOLD = 220


def process(path):
    img = Image.open(path)
    orig_mode = img.mode
    orig_size = img.size

    # Ensure RGBA
    img = img.convert('RGBA')
    pixels = img.load()
    w, h = img.size

    converted = 0
    softened = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Already transparent → leave it
            if a < 255:
                continue
            brightness = (r + g + b) / 3
            if brightness > HARD_THRESHOLD:
                pixels[x, y] = (r, g, b, 0)
                converted += 1
            elif brightness > SOFT_THRESHOLD:
                # Gradual: brightness 220 → ~178 alpha, brightness 240 → 0 alpha
                new_a = int(255 * (HARD_THRESHOLD - brightness) /
                            (HARD_THRESHOLD - SOFT_THRESHOLD))
                pixels[x, y] = (r, g, b, max(0, min(255, new_a)))
                softened += 1

    img.save(path)
    return {
        'file': os.path.basename(path),
        'orig_mode': orig_mode,
        'size': orig_size,
        'converted_to_transparent': converted,
        'edge_softened': softened,
    }


def main():
    for f in FILES:
        path = os.path.join(HERE, f)
        if not os.path.exists(path):
            print(f'MISSING: {f}')
            continue
        result = process(path)
        print(f"OK {result['file']:25s} {result['orig_mode']} {result['size']}"
              f"  bg-clear={result['converted_to_transparent']:>7d}px"
              f"  edge-soft={result['edge_softened']:>6d}px")


if __name__ == '__main__':
    main()
