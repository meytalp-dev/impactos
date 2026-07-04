#!/usr/bin/env python3
"""generate-bank-play-audio-b2.py — סבב B2: השלמת האודיו שנפסל ב-B1.

שלושה קליפים חסרים לנגן הבנק (stage-bank-play.html):
  הִבְהִיל (stem, jan-w2-d1-c1-L2) — נפסל ב-B1: הגייה שגויה ב-5 נסיונות.
  יָשׁ /yash/ (מסיח, apr-w4-d1-c2-L1) — נפסל: נשמע /yesh/ = זהה לתשובה.
  אוֹן /on/ (מסיח, apr-w4-d1-c2-L2) — הוסר יחד עם יָשׁ; ננסה שוב בנפרד.

שיטה: לכל יעד כמה וריאנטי-איות (כתיב מלא / פיסוק / תעתיק). כל וריאנט
מסונתז לקובץ זמני, עובר תמלול Whisper (small, initial_prompt עברי) —
הווריאנט הראשון שעובר את בדיקת-הקבלה מועתק לשם הסופי bank-w-*.mp3.
וריאנט שנכשל נשמר ב-_b2_tries/ לצורך בדיקה ידנית.

הרצה: PYTHONIOENCODING=utf-8 python generate-bank-play-audio-b2.py
פלט:  ../assets/audio/bank-w-{hivhil,yash,on}.mp3 + bank-play-audio-b2-report.json
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
TRIES = Path(__file__).parent / "_b2_tries"
OUT.mkdir(parents=True, exist_ok=True)
TRIES.mkdir(parents=True, exist_ok=True)

WHISPER_PROMPT = "מילים בעברית: הבהיל, היבהיל, יאש, און, יש, אין, אונה."


def norm(s):
    """נירמול תמלול: בלי ניקוד/פיסוק/רווחים, ו' עיצורית כפולה→בודדת."""
    s = re.sub(r"[֑-ׇ]", "", s or "")
    s = re.sub(r"[^א-תa-zA-Z]", "", s)
    return s


# בדיקות-קבלה: heard (מנורמל) → תקין?
def ok_hivhil(h):
    # רק הומופונים מדויקים — הבהיל/היבהיל (הכתיב המלא). בח = הגייה שגויה, נפסל.
    return h in ("הבהיל", "היבהיל")


def ok_yash(h):
    # חייב /a/ מפורש (א אחרי י) — "יש" בלבד = נפסל (נשמע כתשובה הנכונה)
    return h in ("יאש", "יאאש", "יעש", "yash")


def ok_on(h):
    # /on/ — און; הומופונים קרובים שוויספר נוטה אליהם: הון/אן נפסלים (עיצור אחר/תנועה אחרת)
    return h in ("און", "אונ", "on", "אוון")


TARGETS = [
    {
        "key": "bank-w-hivhil",
        "check": ok_hivhil,
        "variants": ["הִיבְהִיל", "היבהיל", "הִבְהִיל."],
    },
    {
        "key": "bank-w-yash",
        "check": ok_yash,
        "variants": ["יַאשׁ", "יָאשׁ.", "יַאְשׁ"],
    },
    {
        "key": "bank-w-on",
        "check": ok_on,
        "variants": ["אוֹן", "אוֹן.", "און"],
    },
]


def synth(text, out):
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


print("synthesizing variants...")
paths = []  # (key, variant_idx, text, path)
for t in TARGETS:
    for i, text in enumerate(t["variants"]):
        p = TRIES / f"{t['key']}-v{i}.mp3"
        if not p.exists():
            synth(text, p)
            print(f"  synth {t['key']}-v{i} «{text}»")
        else:
            print(f"  skip  {t['key']}-v{i} (קיים)")
        paths.append((t["key"], i, text, p))

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

report = Path(__file__).parent / "bank-play-audio-b2-report.json"
report.write_text(json.dumps({"winners": {k: str(v.name) for k, v in winners.items()},
                              "missing": missing, "tries": rows},
                             ensure_ascii=False, indent=2), encoding="utf-8")
print("done →", report.name)
