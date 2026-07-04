#!/usr/bin/env python3
"""
qa-transcribe-tav-island.py — QA תמלול Whisper לקבצי האודיו של אי ת (תיבת האוצר).

הסוכן לא שומע — תמלול הוא הדרך היחידה לאמת שההקלטה אומרת את מה שביקשנו
(reference-noni-voice-elevenlabs: "QA=תמלול Whisper").

שימוש:
    PYTHONIOENCODING=utf-8 python qa-transcribe-tav-island.py [file1.mp3 file2.mp3 ...]
בלי ארגומנטים — בודק את רשימת ברירת המחדל של האי.
"""
import sys
from pathlib import Path

import whisper

ROOT = Path(__file__).parent.parent
AUDIO = ROOT / "assets" / "audio"

DEFAULT_FILES = [
    # קיימים — מועמדים לשימוש חוזר
    "sound-tav.mp3",
    "find-tav.mp3",
    "finale-found-treasure.mp3",
    "cv-tav-kamatz.mp3",
    "cv-tav-patach.mp3",
    "cv-tav-hiriq.mp3",
    "cv-tav-shva.mp3",
    # חדשים (אחרי הפקה)
    "intro-tav-treasure.mp3",
    "find-tav-treasure.mp3",
    "finale-tav-treasure.mp3",
]


def main():
    names = sys.argv[1:] or DEFAULT_FILES
    print("loading whisper (small)...")
    model = whisper.load_model("small")
    for name in names:
        p = AUDIO / name
        if not p.exists():
            print(f"--- {name}: MISSING")
            continue
        r = model.transcribe(str(p), language="he")
        print(f"--- {name}: {r['text'].strip()}")


if __name__ == "__main__":
    main()
