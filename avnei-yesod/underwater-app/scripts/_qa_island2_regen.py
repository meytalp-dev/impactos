#!/usr/bin/env python3
"""QA תמלול Whisper לקליפי אי 2 שהוקלטו מחדש (8.7). עיוור ל-/p//f/ ולניקוד —
תופס רק שגיאות-גסות (מילה שגויה/מעוותת). קול נוני. הרצה מ-underwater-app/."""
import re, unicodedata
from pathlib import Path
from faster_whisper import WhisperModel

AUDIO = Path(__file__).parent.parent / "assets" / "audio"

CLIPS = {
    "word-saba": "סבא", "word-sefer": "ספר", "word-mafteach": "מפתח",
    "intro-twin-seaweeds": "שתי אצות זוהרות שרה מילה",
    "intro-twin-mission": "הצליל הראשון זהה או שונה",
    "intro-fish-schools": "שתי להקות דגיגים",
    "intro-fish-mission": "לשלוח אותו הביתה ללהקה",
    "fish-feedback-correct": "הדגיג חזר הביתה",
    "fish-finale-complete": "הדגיגים הגיעו הביתה בלהקות שמחה",
}

def skel(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not (0x0591 <= ord(c) <= 0x05C7))
    return re.sub(r"[^א-ת]", "", s)

m = WhisperModel("small", device="cpu", compute_type="int8")
print("Whisper QA — island-2 regen clips\n" + "="*50)
for key, expect in CLIPS.items():
    f = AUDIO / f"{key}.mp3"
    if not f.exists():
        print(f"MISSING  {key}"); continue
    segs, _ = m.transcribe(str(f), language="he", beam_size=5)
    txt = " ".join(s.text.strip() for s in segs).strip()
    print(f"{key:24s} → {txt}")
