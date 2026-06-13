#!/usr/bin/env python3
"""
gen-pulse-voice-compare.py — השוואת קולות ElevenLabs לנוני בפולס א'-ב'.

מייצר 3 דגימות מתוך הפולס (סטאפ + שאלה מאושרת + תודה) ב-3 קולות נשיים רכים,
כדי שמיטל תבחר קול לפרודקציה (החלטה 12.6.2026: מעבר מאודיו מוקלט ל-ElevenLabs).

פלט: pulse-grade1/_audio-test/<voice>/<sample>.mp3 (לא בגיט)
דף השוואה: pulse-grade1/_audio-test/compare.html

שימוש:
  python gen-pulse-voice-compare.py            # מייצר את הכל
  python gen-pulse-voice-compare.py --force    # דורס קיימים
"""
import argparse
import os
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

REPO_ROOT = Path(__file__).parent.parent.parent
load_dotenv(REPO_ROOT / ".env")

API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
if not API_KEY:
    print(f"❌ ELEVENLABS_API_KEY לא נמצא ב-{REPO_ROOT / '.env'}", file=sys.stderr)
    sys.exit(1)

OUT_DIR = Path(__file__).parent.parent / "_audio-test"

# אותם 3 קולות שנבדקו באבני יסוד (multilingual v2, תומכים עברית).
VOICES = [
    ("sarah", "EXAVITQu4vr4xnSDxMaL", "Sarah — צעירה חמה ורכה"),
    ("charlotte", "XB0fDUnXU5powFXDhCwa", "Charlotte — רכה ובוגרת מעט"),
    ("lily", "pFZP5JQG7iQjIQuC4Bku", "Lily — מספרת סיפורים חמה"),
]

# 3 דגימות מייצגות מתוך ה-spec (סעיף 6.7) — ניקוד מלא, בדיוק כפי שיוקלט.
SAMPLES = [
    ("01-setup-adjust",
     "כָּל בֹּקֶר נוּנִי מַגִּיעַ לַשּׁוֹנִית. יֵשׁ בְּקָרִים שֶׁקַּל לוֹ, וְיֵשׁ בְּקָרִים שֶׁקְּצָת פָּחוֹת.",
     "סטאפ מימד 1 — הסתגלות"),
    ("02-question-adjust",
     "הַאִם נוּנִי מַרְגִּישׁ טוֹב כְּשֶׁהוּא בָּא לַשּׁוֹנִית בַּבֹּקֶר?",
     "שאלה מאושרת מימד 1"),
    ("03-thanks",
     "תּוֹדָה שֶׁעֲזַרְתֶּם לִי. זֶה עוֹזֵר לִי לְהָבִין.",
     "תודה + מעבר"),
]

# v3 תומך עברית רשמית (multilingual_v2 לא! — לכן ההגייה הייתה גרועה בסבב הראשון)
MODEL_ID = "eleven_v3"


def gen_one(client: ElevenLabs, voice_id: str, text: str, out_path: Path, force: bool) -> str:
    if out_path.exists() and not force and out_path.stat().st_size > 100:
        return "skip (קיים)"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        audio_iter = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id=MODEL_ID,
            output_format="mp3_44100_128",
        )
        with open(out_path, "wb") as f:
            for chunk in audio_iter:
                if chunk:
                    f.write(chunk)
        if out_path.exists() and out_path.stat().st_size > 100:
            return f"OK ({out_path.stat().st_size // 1024}KB)"
        return "FAIL (ריק)"
    except Exception as e:
        return f"FAIL: {e}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="דורס קבצים קיימים")
    args = ap.parse_args()

    client = ElevenLabs(api_key=API_KEY)

    total = len(VOICES) * len(SAMPLES)
    print(f"מייצר {total} דגימות ({len(VOICES)} קולות × {len(SAMPLES)} משפטים) · model: {MODEL_ID}")
    print(f"פלט: {OUT_DIR}")
    print()

    fails = 0
    for voice_slug, voice_id, voice_desc in VOICES:
        print(f"━━━ {voice_slug}: {voice_desc} ━━━")
        for sample_id, text, desc in SAMPLES:
            out_path = OUT_DIR / voice_slug / f"{sample_id}.mp3"
            status = gen_one(client, voice_id, text, out_path, args.force)
            if status.startswith("FAIL"):
                fails += 1
            print(f"  {sample_id:22s} ({desc:24s}) → {status}")
        print()

    if fails:
        print(f"⚠️ {fails} דגימות נכשלו")
        sys.exit(1)
    print("✅ סיום. פתחי את דף ההשוואה: pulse-grade1/_audio-test/compare.html")


if __name__ == "__main__":
    main()
