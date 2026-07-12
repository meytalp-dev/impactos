#!/usr/bin/env python3
"""סבב-3 אי 2 (מיטל 8.7): עקיפת 'שתי'→'זוג'/'המילים' ו-'הביתה'→'אל הבית שלו'
(eleven לא הגה אותן גם בכתיב-חסר). מייבא טקסטים מסקריפטי היצירה. קול נוני.
הרצה: PYTHONIOENCODING=utf-8 python scripts/_regen_island2_round3.py"""
import asyncio, importlib.util
from pathlib import Path
import _eleven_tts as tts

SCRIPTS = Path(__file__).parent
AUDIO = SCRIPTS.parent / "assets" / "audio"

def load(f):
    spec = importlib.util.spec_from_file_location(f.replace("-", "_"), SCRIPTS / f)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

twin = load("generate-island-02-audio.py")
fish = load("generate-island-02-fish-audio.py")

TARGETS = {
    "intro-twin-seaweeds":             twin.GAME_LINES["intro-twin-seaweeds"],
    "twin-question-same-or-different": twin.GAME_LINES["twin-question-same-or-different"],
    "twin-feedback-correct-same":      twin.GAME_LINES["twin-feedback-correct-same"],
    "twin-feedback-correct-different": twin.GAME_LINES["twin-feedback-correct-different"],
    "intro-fish-schools":              fish.GAME_LINES["intro-fish-schools"],
    "intro-fish-mission":              fish.GAME_LINES["intro-fish-mission"],
    "fish-feedback-correct":           fish.GAME_LINES["fish-feedback-correct"],
}

async def main():
    print(f"Round-3 regen: {len(TARGETS)} clips (voice=noni)")
    ok = 0
    for i, (key, text) in enumerate(TARGETS.items(), 1):
        try:
            await tts.Communicate(text).save(str(AUDIO / f"{key}.mp3"))
            print(f"[{i}/{len(TARGETS)}] OK   {key}  |  {tts.preprocess(text)}")
            ok += 1
        except Exception as e:
            print(f"[{i}/{len(TARGETS)}] FAIL {key} ({type(e).__name__}: {e})")
        await asyncio.sleep(0.25)
    print(f"\nDone: {ok}/{len(TARGETS)}")

if __name__ == "__main__":
    asyncio.run(main())
