#!/usr/bin/env python3
"""generate-vocab-match-audio-m1.py — השלמת 3 קליפי המילים החסרים ב-stage-vocab-match.

המשחקון (M1) עלה עם 9/12 מילים מוקלטות; חסרים:
  דֹּב   (animals) → word-dov.mp3
  צַלָּם  (people)  → word-tsalam.mp3
  פֶּרַח (nature)  → word-perach.mp3

שיטה זהה ל-generate-bank-play-audio-b2.py: וריאנטי-איות פר מילה, כל וריאנט
מסונתז לקובץ זמני ועובר תמלול Whisper (small, initial_prompt עברי) —
הראשון שעובר את בדיקת-הקבלה מועתק לשם הסופי word-*.mp3.

הרצה: PYTHONIOENCODING=utf-8 python generate-vocab-match-audio-m1.py
פלט:  ../assets/audio/word-{dov,tsalam,perach}.mp3 + vocab-match-audio-m1-report.json
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
TRIES = Path(__file__).parent / "_m1_tries"
OUT.mkdir(parents=True, exist_ok=True)
TRIES.mkdir(parents=True, exist_ok=True)

WHISPER_PROMPT = "מילים בעברית: דוב, צלם, פרח, דב, פרך."


def norm(s):
    """נירמול תמלול: בלי ניקוד/פיסוק/רווחים."""
    s = re.sub(r"[֑-ׇ]", "", s or "")
    s = re.sub(r"[^א-תa-zA-Z]", "", s)
    return s


def ok_dov(h):
    # /dov/ — דב/דוב (כתיב מלא). "דבר"/"תוף" = הגייה שגויה.
    return h in ("דב", "דוב")


def ok_tsalam(h):
    # /tsalam/ — צלם. "סלם"/"שלם" = עיצור פותח שגוי.
    return h in ("צלם", "צאלם")


def ok_perach(h):
    # /perach/ — פרח בלבד; "פרך" הומופון-כתיב שגוי אך זהה קולית — מתקבל.
    return h in ("פרח", "פרך")


TARGETS = [
    {"key": "word-dov", "check": ok_dov,
     "variants": ["דֹּב.", "דּוֹב.", "דּוֹב"]},
    {"key": "word-tsalam", "check": ok_tsalam,
     "variants": ["צַלָּם.", "צַלָּם", "הַצַּלָּם."]},
    {"key": "word-perach", "check": ok_perach,
     "variants": ["פֶּרַח.", "פֶּרַח", "פֶּרַח!"]},
]


def synth(text, out):
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


print("synthesizing variants...")
for t in TARGETS:
    for i, text in enumerate(t["variants"]):
        p = TRIES / f"{t['key']}-v{i}.mp3"
        if not p.exists():
            synth(text, p)
            print(f"  synth {t['key']}-v{i} «{text}»")
        else:
            print(f"  skip  {t['key']}-v{i} (קיים)")

print("loading whisper (small)...")
import whisper  # import כבד — אחרי הסינתזה
model = whisper.load_model("small")

rows = []
winners = {}
for t in TARGETS:
    for i, text in enumerate(t["variants"]):
        p = TRIES / f"{t['key']}-v{i}.mp3"
        r = model.transcribe(str(p), language="he", fp16=False,
                             initial_prompt=WHISPER_PROMPT)
        heard = (r.get("text") or "").strip()
        passed = bool(t["check"](norm(heard)))
        rows.append({"key": t["key"], "variant": i, "text": text,
                     "heard": heard, "norm": norm(heard), "pass": passed})
        print(f"  [{t['key']}-v{i}] «{text}» → «{heard}» {'✅' if passed else '❌'}")
        if passed and t["key"] not in winners:
            winners[t["key"]] = p

for key, src in winners.items():
    dst = OUT / f"{key}.mp3"
    shutil.copyfile(src, dst)
    print(f"✅ {key}.mp3 ← {src.name}")

missing = [t["key"] for t in TARGETS if t["key"] not in winners]
if missing:
    print("❌ לא עברו QA (נשארים חסרים):", ", ".join(missing))

report = Path(__file__).parent / "vocab-match-audio-m1-report.json"
report.write_text(json.dumps({"winners": {k: str(v.name) for k, v in winners.items()},
                              "missing": missing, "tries": rows},
                             ensure_ascii=False, indent=2), encoding="utf-8")
print("done →", report.name)
