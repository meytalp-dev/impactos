#!/usr/bin/env python3
"""
generate-home-practice-audio.py — 3 קליפי נוני לתרגול הבית ("נוני בבית").
spec: _handoff/2026-07-04-home-practice-spec.md §3 + §5.

  home-intro.mp3        — פתיח בית: הזמנה למשימת היום (map.html, overlay המשימה)
  home-mission-done.mp3 — סיום משימה: מעבר למשחק חופשי (map.html, בועת החגיגה)
  home-cap-done.mp3     — מכסה יומית: "זֶהוּ לְהַיּוֹם" (home-context.js, overlay)

כללים (reference-noni-voice-elevenlabs + feedback-no-yofi-in-praise-audio):
  ElevenLabs eleven_v3 דרך _eleven_tts · נוני = נוּנִי (שורוק) · בלי "יופי" ·
  פנייה בלשון רבים · sequential עם retries · QA בתמלול Whisper אחרי הפקה:
      PYTHONIOENCODING=utf-8 python qa-transcribe-tav-island.py home-intro.mp3 home-mission-done.mp3 home-cap-done.mp3

מצב ברירת מחדל: לא דורס קבצים קיימים. --force להקלטה מחדש.
"""
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # ElevenLabs drop-in

VOICE = "he-IL-AvriNeural"  # תאימות חתימה בלבד — הקול בפועל = נוני (ElevenLabs)
RATE = "-10%"

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

CLIPS = {
    # פתיח בית — חם וקצר; מבטיח את העסקה: משימה קטנה ואז משחק חופשי
    # "שֶׁהִגַּעְתֶּם" ולא "שֶׁבָּאתֶם" — QA Whisper שמע את הראשון ברור יותר (4.7.2026)
    "home-intro": (
        "הֵיי! אֵיזֶה כֵּיף שֶׁהִגַּעְתֶּם! "
        "בּוֹאוּ נַעֲשֶׂה מְשִׂימָה קְטַנָּה, וְאַחַר כָּךְ מְשַׂחֲקִים חָפְשִׁי!"
    ),
    # סיום משימת היום — שבח בלי "יופי"
    "home-mission-done": (
        "מְעוּלֶה! סִיַּמְתֶּם אֶת מְשִׂימַת הַיּוֹם! "
        "עַכְשָׁו אֶפְשָׁר לְשַׂחֵק חָפְשִׁי!"
    ),
    # מכסה יומית — סגירה חיובית, בלי אשמה, מחר ממשיכים
    "home-cap-done": (
        "זֶהוּ לְהַיּוֹם! הָיָה כֵּיף גָּדוֹל! נִתְרָאֶה מָחָר!"
    ),
}

RETRIES = 3


async def make(key: str, text: str, force: bool) -> bool:
    out = OUT_DIR / f"{key}.mp3"
    if out.exists() and out.stat().st_size > 0 and not force:
        print(f"skip (exists): {out.name}")
        return True
    for attempt in range(1, RETRIES + 1):
        try:
            await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(out))
            if out.exists() and out.stat().st_size > 0:
                print(f"ok: {out.name} ({out.stat().st_size} bytes)")
                return True
            if out.exists():
                out.unlink()  # zero-byte — מוחקים ומנסים שוב
        except Exception as e:
            print(f"attempt {attempt} failed for {key}: {e}")
            if out.exists() and out.stat().st_size == 0:
                out.unlink()
        await asyncio.sleep(1.5 * attempt)
    print(f"FAILED: {key}")
    return False


async def main():
    force = "--force" in sys.argv
    ok = True
    for key, text in CLIPS.items():  # sequential — לא gather
        ok = await make(key, text, force) and ok
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    asyncio.run(main())
