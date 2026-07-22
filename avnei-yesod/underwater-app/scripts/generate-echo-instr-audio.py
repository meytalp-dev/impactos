#!/usr/bin/env python3
"""generate-echo-instr-audio.py — הנחיה קולית של נוני למשחקון מְעָרַת הַהֵד.

ניסוח אושר ע"י מיטל (22.7.2026): "מלא + שם נוני".
מתנגן בפתיחה, בהדגמה, ובראש כל סבב (stage-echo-cave-codex.html → NARRATION).

קול נוני — ElevenLabs eleven_v3 (דרך _eleven_tts). QA = תמלול Whisper (הסוכן לא שומע).
הרצה: PYTHONIOENCODING=utf-8 python generate-echo-instr-audio.py
פלט:  ../assets/audio/echo-instr.mp3 + echo-instr-audio-report.json
"""
import json
import os
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
OUT.mkdir(parents=True, exist_ok=True)

# (key, text, expect) — expect = מה Whisper אמור לשמוע בקירוב (בלי ניקוד)
ITEMS = [
    ("echo-instr",
     "הַקְשִׁיבוּ לַצְּלִיל, וְהָזִיזוּ אֶת נוּנִי אֶל הַמְּעָרָה שֶׁהַהֵד שֶׁלָּהּ מַתְאִים.",
     "הקשיבו לצליל והזיזו את נוני אל המערה שההד שלה מתאים"),
]


def synth(text, out):
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


for key, text, _ in ITEMS:
    dst = OUT / f"{key}.mp3"
    synth(text, dst)
    print(f"  synth {key:20s} «{text}»")

print("loading whisper (small)...")
import whisper  # import כבד — אחרי הסינתזה
model = whisper.load_model("small")
rows = []
for key, text, expect in ITEMS:
    r = model.transcribe(str(OUT / f"{key}.mp3"), language="he", fp16=False)
    heard = (r.get("text") or "").strip()
    rows.append({"key": key, "text": text, "expect": expect, "heard": heard})
    print(f"  [{key:20s}] «{text}» → «{heard}»")

report = Path(__file__).parent / "echo-instr-audio-report.json"
report.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
print("done ->", report.name)
