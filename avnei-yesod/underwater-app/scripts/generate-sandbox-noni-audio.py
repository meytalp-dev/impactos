#!/usr/bin/env python3
"""
generate-sandbox-noni-audio.py — 5 קליפי נוני לדף-ליווי הסנדבוקס (sandbox-guide.html).
נוני מלווה מעריכים (אינקלו) בהתנסות: פתיחה + הכלה + 3 כובעים + שיגור.

  s0.mp3 — פתיחה: "שמחה שהצטרפתם לשונית שלי"
  s1.mp3 — הבטחת-ליווי
  s2.mp3 — עקרון ההכלה (לא הסללה)
  s3.mp3 — שלושת הכובעים → תרגול הופך לתובנה
  s4.mp3 — שיגור: "מוכנים? איך נתחיל?"

כללים (reference-noni-voice-elevenlabs + feedback-no-yofi-in-praise-audio):
  ElevenLabs eleven_v3 דרך _eleven_tts · נוני = נוּנִי (שורוק) · פנייה בלשון רבים ·
  בלי "יופי" · מנוקד מלא · sequential עם retries. QA בתמלול Whisper אחרי הפקה:
      PYTHONIOENCODING=utf-8 python qa-transcribe-tav-island.py \
        ../assets/audio/sandbox/s0.mp3 ... s4.mp3

מצב ברירת מחדל: לא דורס קבצים קיימים. --force להקלטה מחדש.
"""
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # ElevenLabs drop-in

VOICE = "he-IL-AvriNeural"  # תאימות חתימה בלבד — הקול בפועל = נוני (ElevenLabs)
RATE = "-8%"

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio" / "sandbox"
OUT_DIR.mkdir(parents=True, exist_ok=True)

CLIPS = {
    "s0": "שָׁלוֹם! אֲנִי נוּנִי, כַּמָּה כֵּיף שֶׁהִצְטָרַפְתֶּם לַשּׁוֹנִית שֶׁלִּי!",
    "s1": "אֲנִי אֶהְיֶה אִתְּכֶם לְאוֹרֶךְ כָּל הַהִתְנַסּוּת, צַעַד אַחֲרֵי צַעַד, בְּתוֹךְ הַמַּעֲרֶכֶת עַצְמָהּ.",
    "s2": "הֲכִי חָשׁוּב אֶצְלֵנוּ: כָּל יֶלֶד לוֹמֵד אֶת אוֹתוֹ נוֹשֵׂא שֶׁל הַכִּתָּה, וַאֲנִי עוֹזֶרֶת לְכָל אֶחָד בַּקֶּצֶב שֶׁלּוֹ. אֲנִי מַכִּילָה אֶת כֻּלָּם, לֹא מַסְלִילָה.",
    "s3": "תִּלְבְּשׁוּ שְׁלוֹשָׁה כּוֹבָעִים, מְנַהֶלֶת, מוֹרָה וְתַלְמִיד, וְתִרְאוּ אֵיךְ תִּרְגּוּל שֶׁל יֶלֶד הוֹפֵךְ לְתוֹבָנָה אֵצֶל הַמּוֹרָה.",
    "s4": "מוּכָנִים? אֲנִי אִתְּכֶם בְּכָל מָסָךְ. אֵיךְ נַתְחִיל?",
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
                out.unlink()
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
