#!/usr/bin/env python3
"""
test-elevenlabs-noni-voices.py — A/B test: ElevenLabs voices vs AvriNeural.

מייצר 7 דגימות (5 מילים מאי 4 + 2 משפטי נרטיב) ב-3 voices נשיים רכים של ElevenLabs.
שומר ב-_audio-test/elevenlabs/<voice>/<sample>.mp3 כדי שלא לדרוס assets/audio/ הקיים.

דגימות נבחרו לבדוק:
  - ב/כ/פ דגש קל ב-CV תחילת הברה ([[reference-hebrew-bgd-kpt-dagesh-rule]])
  - ניקוד מורכב (שווא, חולם)
  - משפט נרטיב של נוני
  - הוראת מכניקה

שימוש:
  python test-elevenlabs-noni-voices.py            # מייצר את הכל
  python test-elevenlabs-noni-voices.py --voice sarah  # רק voice אחד
  python test-elevenlabs-noni-voices.py --force    # דורס קיימים
"""
import argparse
import os
import sys
from pathlib import Path

# Windows console fix — forces UTF-8 stdout so Hebrew prints don't crash on cp1252.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

REPO_ROOT = Path(__file__).parent.parent.parent.parent
load_dotenv(REPO_ROOT / ".env")

API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
if not API_KEY:
    print(f"❌ ELEVENLABS_API_KEY לא נמצא ב-{REPO_ROOT / '.env'}", file=sys.stderr)
    sys.exit(1)

OUT_DIR = Path(__file__).parent.parent / "_audio-test" / "elevenlabs"

# 3 voices נשיים רכים שתומכים היטב במולטילינגואל v2 (כולל עברית).
# ה-voice IDs הם pre-made voices בספריית ElevenLabs.
VOICES = [
    ("sarah", "EXAVITQu4vr4xnSDxMaL", "Sarah — צעירה חמה ורכה"),
    ("charlotte", "XB0fDUnXU5powFXDhCwa", "Charlotte — רכה ובוגרת מעט"),
    ("lily", "pFZP5JQG7iQjIQuC4Bku", "Lily — מספרת סיפורים חמה"),
]

# 7 דגימות test. id נשמר כשם קובץ.
SAMPLES = [
    ("01-barak",        "בָּרָק",        "ב דגש (חובה /ba/ לא /va/)"),
    ("02-brecha",       "בְּרֵכָה",       "ב+שווא נע (תחילת הברה — דגש)"),
    ("03-machar",       "מָחָר",         "מ קמץ — פשוט"),
    ("04-tapuz",        "תַּפּוּז",       "ת דגש + פ דגש"),
    ("05-kfitz",        "קְפִיץ",         "ק+שווא — מורכב"),
    ("06-noni-intro",
        "בַּשּׁוּנִית שֶׁל נוּנִי חַיִּים חֲמִשָּׁה דָּגִים, וְכֹל אֶחָד שָׁר צְלִיל אַחֵר.",
        "משפט נרטיב של נוני"),
    ("07-mission",
        "בַּחֲרִי אֶת הַצְּלִיל הַנָּכוֹן שֶׁל הַדָּג.",
        "הוראת מכניקה"),
]

MODEL_ID = "eleven_multilingual_v2"


def gen_one(client: ElevenLabs, voice_id: str, text: str, out_path: Path, force: bool) -> str:
    if out_path.exists() and not force and out_path.stat().st_size > 100:
        return f"skip"
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
        return "FAIL (empty)"
    except Exception as e:
        return f"FAIL: {e}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", help="רק voice אחד (sarah/charlotte/lily)")
    ap.add_argument("--force", action="store_true", help="דורס קבצים קיימים")
    args = ap.parse_args()

    voices_to_run = VOICES
    if args.voice:
        voices_to_run = [v for v in VOICES if v[0] == args.voice]
        if not voices_to_run:
            print(f"❌ voice לא מוכר: {args.voice}", file=sys.stderr)
            sys.exit(1)

    client = ElevenLabs(api_key=API_KEY)

    total = len(voices_to_run) * len(SAMPLES)
    print(f"מייצר {total} דגימות ({len(voices_to_run)} voices × {len(SAMPLES)} samples)")
    print(f"model: {MODEL_ID}")
    print(f"out:   {OUT_DIR}")
    print()

    for voice_slug, voice_id, voice_desc in voices_to_run:
        print(f"━━━ {voice_slug}: {voice_desc} ━━━")
        for sample_id, text, desc in SAMPLES:
            out_path = OUT_DIR / voice_slug / f"{sample_id}.mp3"
            status = gen_one(client, voice_id, text, out_path, args.force)
            print(f"  {sample_id:20s} ({desc[:30]:30s}) → {status}")
        print()

    print(f"✅ סיום. פתחי את ה-A/B comparison page:")
    print(f"   avnei-yesod/underwater-app/_audio-test/compare.html")


if __name__ == "__main__":
    main()
