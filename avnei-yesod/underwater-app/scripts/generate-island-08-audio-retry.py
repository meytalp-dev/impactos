#!/usr/bin/env python3
"""generate-island-08-audio-retry.py — סבב תיקון לשלושת הכשלים של אי 8.

כשלים מהסבב הראשון (island-08-audio-report.json):
  bank-w-hu    — «הוּא.» נשמע «הו» (א' נבלעה). ננסה כתיב לא-מנוקד + פיסוק אחר.
  bank-w-kelev — «כֶּלֶב.» נשמע «כאלה». ננסה כתיב לא-מנוקד (מילה שכיחה, TTS מכיר).
  mission-isl08-sentence — «קָצָר»→«קצל», «הַקְשִׁיבוּ»→«הקשיביב». ניסוח מחדש + נסיונות.

הרצה: PYTHONIOENCODING=utf-8 python generate-island-08-audio-retry.py
"""
import json
import os
import re
import shutil
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
import _eleven_tts as tts

REPO_ROOT = Path(__file__).parent.parent.parent.parent
load_dotenv(REPO_ROOT / ".env")
client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY", "").strip())
OUT = Path(__file__).parent.parent / "assets" / "audio"
TRIES = Path(__file__).parent / "_isl08_tries"
TRIES.mkdir(parents=True, exist_ok=True)

WHISPER_PROMPT = "מילים בעברית לכיתה א': הוא, כלב, נוני אומרת משפט קצר, הקשיבו."


def norm(s):
    s = re.sub(r"[֑-ׇ]", "", s or "")
    s = re.sub(r"[^א-ת]", "", s)
    return s


def synth(text, out):
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


# (key, וריאנטים, נורמות-קבלה)
TARGETS = [
    ("bank-w-hu", ["הוא.", "הוא!", "הוּא, הוּא."], {"הוא"}),
    ("bank-w-kelev", ["כלב.", "כלב!", "כֶּלֶב, כֶּלֶב."], {"כלב"}),
]
# נרטיב — QA רך: כל מילות-המפתח חייבות להישמע
NARR = [
    ("mission-isl08-sentence",
     ["נוּנִי אוֹמֶרֶת מִשְׁפָּט קָטָן. הַקְשִׁיבוּ הֵיטֵב, וּבַחֲרוּ אֶת הַמִּשְׁפָּט שֶׁשְּׁמַעְתֶּם.",
      "נוּנִי אוֹמֶרֶת מִשְׁפָּט קָטָן. הַקְשִׁיבוּ הֵיטֵב, וּבַחֲרוּ אֶת הַמִּשְׁפָּט שֶׁשְּׁמַעְתֶּם.",
      "נוּנִי אוֹמֶרֶת מִשְׁפָּט. הַקְשִׁיבוּ הֵיטֵב, וּבַחֲרוּ אֶת הַמִּשְׁפָּט שֶׁשְּׁמַעְתֶּם."],
     ["משפט", "הקשיבו", "ובחרו"]),
]

print("synthesizing retries...")
for key, variants, _ in TARGETS:
    for i, text in enumerate(variants):
        p = TRIES / f"{key}-r{i}.mp3"
        if not p.exists():
            synth(text, p)
            print(f"  synth {key}-r{i} «{text}»")
for key, variants, _ in NARR:
    for i, text in enumerate(variants):
        p = TRIES / f"{key}-r{i}.mp3"
        if not p.exists():
            synth(text, p)
            print(f"  synth {key}-r{i}")

print("loading whisper (small)...")
import whisper
model = whisper.load_model("small")

rows = []
winners = {}
for key, variants, accept in TARGETS:
    for i, text in enumerate(variants):
        if key in winners:
            break
        p = TRIES / f"{key}-r{i}.mp3"
        r = model.transcribe(str(p), language="he", fp16=False,
                             initial_prompt=WHISPER_PROMPT)
        heard = (r.get("text") or "").strip()
        passed = norm(heard) in accept
        rows.append({"key": key, "variant": i, "text": text, "heard": heard, "pass": passed})
        print(f"  [{key}-r{i}] «{text}» → «{heard}» {'✅' if passed else '❌'}")
        if passed:
            winners[key] = p

for key, variants, musts in NARR:
    for i, text in enumerate(variants):
        if key in winners:
            break
        p = TRIES / f"{key}-r{i}.mp3"
        r = model.transcribe(str(p), language="he", fp16=False)
        heard = (r.get("text") or "").strip()
        h = norm(heard)
        passed = all(norm(m) in h for m in musts)
        rows.append({"key": key, "variant": i, "text": text, "heard": heard, "pass": passed})
        print(f"  [{key}-r{i}] → «{heard}» {'✅' if passed else '❌'}")
        if passed:
            winners[key] = p

for key, src in winners.items():
    shutil.copyfile(src, OUT / f"{key}.mp3")
    print(f"✅ {key}.mp3")

missing = [k for k, _, _ in TARGETS + NARR if k not in winners]
if missing:
    print("❌ עדיין חסרים:", ", ".join(missing))

report = Path(__file__).parent / "island-08-audio-retry-report.json"
report.write_text(json.dumps({"winners": sorted(winners), "missing": missing, "tries": rows},
                             ensure_ascii=False, indent=2), encoding="utf-8")
print("done →", report.name)
if missing:
    sys.exit(1)
