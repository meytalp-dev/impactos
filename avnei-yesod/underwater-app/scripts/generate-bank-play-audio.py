#!/usr/bin/env python3
"""generate-bank-play-audio.py — אודיו לנגן בנק-השאלות (stage-bank-play.html).

stems של שאלות audio_to_written + אופציות-אודיו של written_to_audio עבור ימי
הדקדוק שחווטו בתוכנית השנתית (4.7.2026): היה/היתה · את/אתה · כְּמוֹ · יֵשׁ/אֵין ·
אני · יחיד/רבים (שיר/פיל). קול נוני — ElevenLabs eleven_v3 (דרך _eleven_tts).
QA: תמלול Whisper לכל קליפ (הסוכן לא שומע — התמלול הוא האימות).

הרצה: PYTHONIOENCODING=utf-8 python generate-bank-play-audio.py
פלט:  ../assets/audio/bank-w-*.mp3 + bank-play-audio-report.json
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

# (key, text, expect) — expect = מה Whisper אמור לשמוע (בקירוב, בלי ניקוד)
#
# 🔴 ממצאי QA (4.7.2026, whisper small + initial_prompt עברי):
#   ✅ 15 קליפים אומתו (אַתָּה→«עתה» = הומופון תקין; אֵין אומת רק עם initial_prompt).
#   ❌ הִבְהִיל — נהגה שגוי בעקביות («היו היל»/«אבחיל») ב-5 נסיונות כולל פיסוק. הוסר.
#   ❌ יָשׁ / אוֹן (מסיחי-הגייה) — יָשׁ נשמע /yesh/ בכל הנסיונות (גם באיות פונטי
#      יָאשׁ/יַאשׁ) = זהה לתשובה הנכונה → באג מדידה. שניהם הוסרו; שאלות
#      written_to_audio של apr-w4-d1-c2 L1/L2 מדולגות בנגן עד שיהיה קול-אנוש.
ITEMS = [
    # jan-w2-d1 — הָיָה/הָיְתָה (+ שכני היום: הפעיל, מרפאה)
    ("bank-w-hikshiv", "הִקְשִׁיב",   "הקשיב"),
    ("bank-w-haya",    "הָיָה",       "היה"),
    ("bank-w-hayta",   "הָיְתָה",     "הייתה"),
    ("bank-w-mirpaa",  "מִרְפָּאָה",  "מרפאה"),
    # jan-w2-d3 — אַתְּ/אַתָּה
    ("bank-w-at",      "אַתְּ",       "את"),
    ("bank-w-ata",     "אַתָּה",      "אתה"),
    # may-w2-d1 — כְּמוֹ
    ("bank-w-kmo",     "כְּמוֹ",      "כמו"),
    # apr-w4-d1/d2 — יֵשׁ/אֵין
    ("bank-w-yesh",    "יֵשׁ",        "יש"),
    ("bank-w-ein",     "אֵין",        "אין"),
    ("bank-task-yesh-find", "אֵיזוֹ מִלָּה נִקְרֵאת יֵשׁ?", "איזו מילה נקראת יש"),
    # jan-w3-d1 — אֲנִי (כינויי גוף)
    ("bank-w-ani",     "אֲנִי",       "אני"),
    # jan-w1-d1 — יחיד/רבים
    ("bank-w-pil",     "פִּיל",       "פיל"),
    ("bank-w-shir",    "שִׁיר",       "שיר"),
    ("bank-w-shirim",  "שִׁירִים",    "שירים"),
    ("bank-w-pilim",   "פִּילִים",    "פילים"),
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
    if dst.exists():
        print(f"  skip  {key:22s} (קיים)")
        continue
    synth(text, dst)
    print(f"  synth {key:22s} «{text}»")

print("loading whisper (small)...")
import whisper  # import כבד — אחרי הסינתזה
model = whisper.load_model("small")
rows = []
for key, text, expect in ITEMS:
    r = model.transcribe(str(OUT / f"{key}.mp3"), language="he", fp16=False)
    heard = (r.get("text") or "").strip()
    rows.append({"key": key, "text": text, "expect": expect, "heard": heard})
    print(f"  [{key:22s}] «{text}» → «{heard}»")

report = Path(__file__).parent / "bank-play-audio-report.json"
report.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
print("✅ done →", report.name)
