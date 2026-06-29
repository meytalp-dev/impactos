#!/usr/bin/env python3
"""generate-fixes.py — קליפים ל-2 התיקונים: נוּנִי (Nuni) + מועמדי תשובה."""
import json
import os
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
import _eleven_tts as tts
import whisper

REPO_ROOT = Path(__file__).parent.parent.parent.parent
load_dotenv(REPO_ROOT / ".env")
client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY", "").strip())
OUT = Path(__file__).parent.parent / "_audio-test" / "eleven-v3-proof" / "fixes"
OUT.mkdir(parents=True, exist_ok=True)

# (id, text, group, label, expect)
ITEMS = [
    ("nuni-old", "נוֹנִי", "nuni", "ישן — holam (נשמע Noni)", "נוני = Nuni"),
    ("nuni-new", "נוּנִי", "nuni", "חדש — shuruk (אמור להישמע Nuni)", "נוני = Nuni"),
    ("nuni-sentence", "הַתַּמְנוּן נוּנִי שׂוֹחֶה בַּשּׁוּנִית.", "nuni",
     "משפט עם נוּנִי", "...נוני שוחה..."),
    ("tshuva-a", "תְּשׁוּבָה", "tshuva", "א — שווא+דגש (נוכחי)", "תשובה"),
    ("tshuva-b", "תשובה", "tshuva", "ב — בלי ניקוד", "תשובה"),
    ("tshuva-c", "תֶּשׁוּבָה", "tshuva", "ג — סגול (te-shuva)", "תשובה"),
    ("tshuva-d", "תְּשׁוּבָָה", "tshuva", "ד — שווא, tav ללא דגש", "תשובה"),
]


def synth(text, out):
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


for sid, text, *_ in ITEMS:
    synth(text, OUT / f"{sid}.mp3")
    print(f"  synth {sid:16s} «{text}»")

print("loading whisper...")
model = whisper.load_model("small")
rows = []
for sid, text, group, label, expect in ITEMS:
    r = model.transcribe(str(OUT / f"{sid}.mp3"), language="he", fp16=False)
    heard = (r.get("text") or "").strip()
    rows.append({"id": sid, "text": text, "group": group, "label": label,
                 "expect": expect, "heard": heard})
    print(f"  [{sid:16s}] «{text}» → «{heard}»")

(OUT / "fixes-report.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
print("✅ done")
