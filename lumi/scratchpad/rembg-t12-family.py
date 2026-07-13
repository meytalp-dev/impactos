# rembg-t12-family.py — real transparency for the 7 Lumi family members (T12 · Family).
# GPT paints an opaque near-white bg → rembg with alpha matting for clean edges.
# The family-room background (8) is NOT cut — it stays opaque as the scene backdrop.
from rembg import remove, new_session
from PIL import Image
import io, os, shutil

DL = r"C:\Users\meyta\Downloads"
CHARS = r"C:\Users\meyta\Downloads\impactos\lumi\app\assets\family"
WORLD = r"C:\Users\meyta\Downloads\impactos\lumi\app\assets\worlds\family"
os.makedirs(CHARS, exist_ok=True)
os.makedirs(WORLD, exist_ok=True)

# confirmed with Meytal (2026-07-13): source file -> family word
JOBS = [
    ("ChatGPT Image Jul 13, 2026, 10_42_17 PM (1).png", "mum"),
    ("ChatGPT Image Jul 13, 2026, 10_42_17 PM (2).png", "dad"),
    ("ChatGPT Image Jul 13, 2026, 10_42_18 PM (3).png", "baby"),
    ("ChatGPT Image Jul 13, 2026, 10_42_18 PM (4).png", "brother"),
    ("ChatGPT Image Jul 13, 2026, 10_42_18 PM (5).png", "sister"),
    ("ChatGPT Image Jul 13, 2026, 10_42_19 PM (6).png", "grandma"),
    ("ChatGPT Image Jul 13, 2026, 10_42_19 PM (7).png", "grandpa"),
]
BG = ("ChatGPT Image Jul 13, 2026, 10_42_20 PM (8).png", "room-bg")

session = new_session("isnet-general-use")
for src, name in JOBS:
    p = os.path.join(DL, src)
    with open(p, "rb") as f:
        data = f.read()
    out = remove(
        data, session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=250,
        alpha_matting_background_threshold=15,
        alpha_matting_erode_size=8,
    )
    img = Image.open(io.BytesIO(out)).convert("RGBA")
    bbox = img.getbbox()          # tight crop to the visible character
    if bbox:
        img = img.crop(bbox)
    dest = os.path.join(CHARS, name + ".png")
    img.save(dest)
    print(f"char {name}.png  size={img.size}  bytes={os.path.getsize(dest)}")

# background: keep opaque, just normalise to PNG in the world folder
bp = os.path.join(DL, BG[0])
bg = Image.open(bp).convert("RGB")
bgdest = os.path.join(WORLD, BG[1] + ".png")
bg.save(bgdest)
print(f"bg   {BG[1]}.png  size={bg.size}  bytes={os.path.getsize(bgdest)}")
print("DONE-T12-REMBG.")
