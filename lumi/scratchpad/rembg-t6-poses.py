# rembg-t6-poses.py — real transparency for the 3 Lumi TPR poses.
# GPT paints an opaque near-white bg → rembg with alpha matting for clean edges.
from rembg import remove, new_session
from PIL import Image
import io, os

DL = r"C:\Users\meyta\Downloads"
OUT = r"C:\Users\meyta\Downloads\impactos\lumi\app\assets\actions"
os.makedirs(OUT, exist_ok=True)

# source pose  ->  action name
JOBS = [
    ("ChatGPT Image Jul 13, 2026, 10_19_05 PM (1).png", "jump"),  # arms wide, leaping
    ("ChatGPT Image Jul 13, 2026, 10_19_05 PM (2).png", "stop"),  # palm out
    ("ChatGPT Image Jul 13, 2026, 10_19_05 PM (3).png", "go"),    # walking / mid-stride
]

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
    # tight crop to the visible character
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    dest = os.path.join(OUT, name + ".png")
    img.save(dest)
    print(f"{name}.png  size={img.size}  bytes={os.path.getsize(dest)}")
print("DONE.")
