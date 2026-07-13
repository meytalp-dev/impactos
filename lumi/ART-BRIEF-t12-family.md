# ART-BRIEF · T12 · 🖼️ The Family Photo (Family)

**Status: EMBEDDED — all assets delivered & wired. No missing art.**

Minigame: `lumi/app/family-photo.html` · mechanic: scene-hide (shared, untouched).
Style: soft-3D storybook, lantern-grove palette (mint / aqua / warm-glow), matches the
approved quality shell. Every family member is the same Lumi-creature base with a distinct
accessory so the child tells them apart by comprehension, not by color.

## Delivered characters (7) — rembg'd to true transparency
Meytal dropped 8 PNGs in Downloads (2026-07-13 22:42). **Mapping confirmed with Meytal**
before cutting. Cut with `scratchpad/rembg-t12-family.py`
(isnet-general-use + alpha-matting fg=250 / bg=15 / erode=8 — keeps the soft glow rim).

| word    | source (Downloads)              | asset                          | distinguishing cue        |
|---------|---------------------------------|--------------------------------|---------------------------|
| mum     | `…10_42_17 PM (1).png`          | `assets/family/mum.png`        | purple bow + pearl, lashes|
| dad     | `…10_42_17 PM (2).png`          | `assets/family/dad.png`        | full body, green leaf pin |
| baby    | `…10_42_18 PM (3).png`          | `assets/family/baby.png`       | tiny, seated, tiny cape   |
| brother | `…10_42_18 PM (4).png`          | `assets/family/brother.png`    | neck bandana + satchel    |
| sister  | `…10_42_18 PM (5).png`          | `assets/family/sister.png`     | flower bloom on scarf     |
| grandma | `…10_42_19 PM (6).png`          | `assets/family/grandma.png`    | round glasses + lace cape |
| grandpa | `…10_42_19 PM (7).png`          | `assets/family/grandpa.png`    | glasses + white beard/bow |

## Background (1) — kept opaque (it's the scene)
| room    | source                          | asset                              |
|---------|---------------------------------|------------------------------------|
| family room | `…10_42_20 PM (8).png`      | `assets/worlds/family/room-bg.png` |

Warm mint room; framed page-local as a hanging photo (white mat) with a dusk overlay.

## Wiring (page-local only — shared mechanic untouched)
- `paintFamily()` drops each PNG into every `.peeker` (correct + distractors); silent
  fallback to the emoji placeholder if a file is absent.
- CSS `.peeker` / `.has-art` in `family-photo.html` owns all visuals; `scene-hide.js`
  is NOT modified.

## Open item for Meytal
- **`mum` pronunciation:** recorded with Jessica (American) → sounds close to "mom"
  (Whisper heard "mom"). Both are valid English. If a distinct British "mum" is wanted,
  regenerate `mum`, `where-mum`, `this-mum` with a different voice/pronunciation.
