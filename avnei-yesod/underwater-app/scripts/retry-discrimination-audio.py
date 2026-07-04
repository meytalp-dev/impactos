#!/usr/bin/env python3
"""retry-discrimination-audio.py — סינתזה חוזרת לקליפים שנכשלו ב-QA (eleven_v3
לא-דטרמיניסטי — ניסיון נוסף לרוב מספיק). עד 3 ניסיונות פר קליפ; נשמר הראשון
שהתמלול (whisper small, לא-מוטה) שלו עובר regex פונמי. גם בודק את name-hey.mp3
הקיים כ-fallback לקליפי הֵי.

הרצה: PYTHONIOENCODING=utf-8 python retry-discrimination-audio.py
"""
import os
import re
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

# (key, text, accept-regex על תמלול מנורמל ללא ניקוד/רווחים)
# מילה בודדת של הברה אחת נבלעת בתמלול (ר סופית נעלמת בעקביות) — מסנתזים את
# המילה פעמיים ("סָר. סָר.") = יותר אות ל-Whisper, ופדגוגית שמיעה כפולה של
# אפשרות-שמע רק עוזרת. הקליפ משרת גם את ה-stem וגם את ה-two-tap preview.
RETRY = [
    ("disc-w-tzar",         "צָר. צָר.",       r"(צר|זר|צאר).*(צר|זר|צאר)"),
    ("disc-w-sar",          "סָר. סָר.",       r"(סר|שר|סאר).*(סר|שר|סאר)"),
    ("disc-stem-zot-hey",   "זֹאת הָאוֹת הֵי",  r"(זאת|זות).*(הי|היי|הא)$"),
    ("disc-stem-who-hey",   "מִי כָּאן הֵי?",   r"(מי|מ).*(כאן|כן|קן).*(הי|היי|הא)"),
]

print("loading whisper (small)...")
import whisper
model = whisper.load_model("small")


def norm(s):
    return re.sub(r"[^א-ת ]", "", s or "").strip()


def hear(path):
    r = model.transcribe(str(path), language="he", fp16=False)
    return norm(r.get("text") or "")


def synth(text, out):
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


# fallback קיים: name-hey.mp3 (מאגר אי 3) — אם הוא נשמע טוב אפשר למפות אליו
print("  [name-hey.mp3 קיים] →", hear(OUT / "name-hey.mp3"))

for key, text, pat in RETRY:
    dst = OUT / f"{key}.mp3"
    ok = False
    for attempt in range(1, 4):
        synth(text, dst)
        heard = hear(dst)
        ok = bool(re.search(pat, heard))
        print(f"  [{key}] ניסיון {attempt}: «{text}» → «{heard}» {'✅' if ok else '❌'}")
        if ok:
            break
    if not ok:
        print(f"  🔴 {key} — כל הניסיונות נכשלו; הקובץ האחרון נשמר, נדרש טיפול ידני")
print("done")
