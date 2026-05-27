#!/usr/bin/env python3
"""
D.15 v2 — ייצור 9 קבצי word-X.mp3 חדשים לאנימציה האסוציאטיבית
פר אות (סעיף 3 ב-spec D.15 v2).

מילים שכבר קיימות במאגר (לא נדרש להקליט):
  word-shemesh · word-lev · word-ner · word-yom · word-saba ·
  word-gamal · word-chatul · word-pil

9 מילים חדשות (זה הסקריפט):
  word-aryeh   (א)
  word-zebra   (ז)
  word-vered   (ו)
  word-har     (ה)
  word-etz     (ע)
  word-tzipor  (צ)
  word-tavas   (ט)
  word-dag     (ד)
  word-kelev   (כ)

מצב ברירת מחדל: לא דורס קבצים קיימים. --force כדי להקליט מחדש.
דורש: pip install edge-tts

3 כללי TTS עברי שאומצו ב-D.14/D.15 (מ-[[feedback-tts-hebrew-niqud-pitfalls]]):
  1. "כֹּל" בחולם — לא רלוונטי כאן (אין "כל"), אבל ניקוד מלא בכל מילה.
  2. AvriNeural בלבד · rate -10%.
  3. כל מילה ניתנת בכתיב מלא ומנוקד. ה-AvriNeural דורש את הניקוד
     כדי לבטא נכון. למשל "טַוָּס" (לא "טווס").
"""
import asyncio
import sys
from pathlib import Path

# Windows console default encoding (cp1252) doesn't handle Hebrew —
# force UTF-8 stdout so the OK/skip messages print without crashing.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import edge_tts

VOICE_AVRI = "he-IL-AvriNeural"
RATE       = "-10%"

ROOT     = Path(__file__).parent.parent
OUT_DIR  = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# 9 מילים חדשות, מנוקדות מלא ל-AvriNeural
WORDS = {
    "word-aryeh":   "אַרְיֵה",
    "word-zebra":   "זֶבְּרָה",
    "word-vered":   "וֶרֶד",
    "word-har":     "הַר",
    "word-etz":     "עֵץ",
    "word-tzipor":  "צִפּוֹר",
    "word-tavas":   "טַוָּס",
    "word-dag":     "דָּג",
    "word-kelev":   "כֶּלֶב",
}

FORCE = "--force" in sys.argv


async def gen(text: str, filename: str) -> str:
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not FORCE:
        return f"skip {filename}"
    try:
        tts = edge_tts.Communicate(text, VOICE_AVRI, rate=RATE)
        await tts.save(str(out))
        return f"OK   {filename}  ({text})"
    except Exception as e:
        return f"FAIL {filename} ({type(e).__name__}: {e})"


async def main():
    items = list(WORDS.items())
    print(f"Generating {len(items)} word audio files (voice={VOICE_AVRI}, rate={RATE})")
    print(f"Output dir: {OUT_DIR}")
    print()

    success = 0
    for i, (key, text) in enumerate(items, 1):
        result = await gen(text, key)
        print(f"[{i}/{len(items)}] {result}")
        if "OK" in result or "skip" in result:
            success += 1
        await asyncio.sleep(0.3)

    print(f"\nSuccess: {success}/{len(items)}")


if __name__ == "__main__":
    asyncio.run(main())
