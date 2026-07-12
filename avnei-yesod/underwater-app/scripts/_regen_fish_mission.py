#!/usr/bin/env python3
"""
הקלטה-מחדש ממוקדת: intro-fish-mission (אי 2).
מיטל 12.7: "וְלִשְׁלֹחַ אוֹתוֹ" נשמע רע. תיקון: חולם-מלא (וְלִשְׁלוֹחַ) — התיקון
הקלאסי ל-eleven_v3 (ktiv-male קודם, לפי ההנחיה). קול נוני דרך _eleven_tts.
הרצה:  PYTHONIOENCODING=utf-8 python scripts/_regen_fish_mission.py
"""
import asyncio
from pathlib import Path
import _eleven_tts as tts

OUT = Path(__file__).parent.parent / "assets" / "audio"

# מיטל 12.7: "לשלוח...הביתה" נשבר כרצף ב-eleven_v3 (גם אחרי חולם-מלא).
# ניסוח מחדש נאמן-למכניקה בלי שתי המילים הבעייתיות: "למצוא את הלהקה".
TARGETS = {
    "intro-fish-mission":
        "הַמְשִׂימָה שֶׁלָּכֶם: לְהַקְשִׁיב לְכָל דְּגִיג, וְלִמְצֹא אֶת הַלְּהָקָה שֶׁמַּתְחִילָה בְּאוֹתוֹ צְלִיל.",
}


async def main():
    print(f"Regenerating {len(TARGETS)} clip (voice=noni/ElevenLabs)...")
    ok = 0
    for i, (key, text) in enumerate(TARGETS.items(), 1):
        out = OUT / f"{key}.mp3"
        try:
            await tts.Communicate(text).save(str(out))
            print(f"[{i}/{len(TARGETS)}] OK   {key}")
            ok += 1
        except Exception as e:
            print(f"[{i}/{len(TARGETS)}] FAIL {key} ({type(e).__name__}: {e})")
    print(f"\nDone: {ok}/{len(TARGETS)}")


if __name__ == "__main__":
    asyncio.run(main())
