#!/usr/bin/env python3
"""
generate-island-05-word-audio.py — מפיק MP3 ל-49 מילים של אי 5 + intro/completion.

סוכן 30 · 30.5.2026 — תבנית: generate-island-04-cv-audio.py.

שם קובץ: word-<key>.mp3
מיקום:   assets/audio/word-<key>.mp3

דוגמאות:
  word-bet-tav-bat.mp3       → "בַּת"
  word-bet-yud-tav-bayit.mp3 → "בַּיִת"
  word-bet-resh-qof-barak.mp3 → "בָּרָק"

ב/כ/פ דגש קל — חובה. הטקסט מ-data/island-05-words/*.json כבר מנוקד נכון; אנו
לא משנים — רק בודקים פר מילה לפני שליחה ל-AvriNeural ומדפיסים אזהרה.

דורש: pip install edge-tts
הרצה:
  python scripts/generate-island-05-word-audio.py            # כל 49 + intro + completion
  python scripts/generate-island-05-word-audio.py --level 2cv  # רק רמה אחת
  python scripts/generate-island-05-word-audio.py --word בַּת  # מילה אחת
  python scripts/generate-island-05-word-audio.py --force      # דריסה מלאה
  python scripts/generate-island-05-word-audio.py --narration  # רק intro + completion
"""
import argparse
import asyncio
import json
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

VOICE_AVRI = "he-IL-AvriNeural"
RATE = "-10%"

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR = ROOT / "data" / "island-05-words"

BKP_LETTERS = {'ב', 'כ', 'פ'}
DAGESH = 'ּ'   # U+05BC HEBREW POINT DAGESH OR MAPIQ


def validate_bkp_dagesh(text: str) -> tuple[bool, str]:
    """אם המילה מתחילה ב-ב/כ/פ — חייבת דגש קל אחרי הניקוד הראשון.
    מחזיר (ok, warning_msg). MVP — בדיקה פשוטה של תחילת מילה.
    """
    if not text or text[0] not in BKP_LETTERS:
        return True, ""
    # סרוק את התווים אחרי האות הראשונה עד שמוצאים אות הבאה.
    for ch in text[1:]:
        # אות עברית הבאה = ב-range 0x05D0-0x05EA
        if 0x05D0 <= ord(ch) <= 0x05EA:
            # האות הבאה ולא ראינו דגש בדרך
            return False, f'⚠ "{text}" — מתחיל ב-{text[0]} ללא דגש קל; AvriNeural יבטא /v·x·f/.'
        if ch == DAGESH:
            return True, ""
    return True, ""


def load_words() -> list[dict]:
    """טוען את 3 קבצי ה-JSON ומאחד לרשימת מילים."""
    all_words = []
    for n in (1, 2, 3):
        f = DATA_DIR / f"words-level-{n}.json"
        if not f.exists():
            print(f"✗ חסר: {f}", file=sys.stderr)
            sys.exit(1)
        try:
            data = json.loads(f.read_text(encoding='utf-8'))
        except Exception as e:
            print(f"✗ שגיאה בפרסור {f}: {e}", file=sys.stderr)
            sys.exit(1)
        words = data.get("words", [])
        all_words.extend(words)
    return all_words


# נרטיב — מנוקד מלא (תלמיד.ת כיתה א' לא קוראת שוטף).
INTRO_TEXT = (
    "בּוֹאוּ נְגַלֶּה אֶת הַשּׁוּנִית הַצְּדָפִית. "
    "בְּכָל צֶדֶף מַחֲבִיא מִילָּה. "
    "נַחֲבֵר אֶת הַחֲלָקִים, וְהַמִּילָּה תִּפָּתַח!"
)

COMPLETION_TEXT = (
    "כָּל הַצְּדָפִים נִפְתָּחוּ! "
    "כְּעֵת אַתֶּם יוֹדְעִים לְחַבֵּר צֵרוּפִים לְמִילִּים. "
    "כֹּל הַכָּבוֹד!"
)


async def gen_one(text: str, filename: str, force: bool, retries: int = 3) -> str:
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not force:
        return f"skip {filename}"
    last_err = None
    for attempt in range(retries):
        try:
            tts = edge_tts.Communicate(text, VOICE_AVRI, rate=RATE)
            await tts.save(str(out))
            if out.exists() and out.stat().st_size > 100:
                return f"OK   {filename}" + (f" (retry {attempt})" if attempt > 0 else "")
            if out.exists():
                out.unlink()
        except Exception as e:
            last_err = e
        await asyncio.sleep(0.5 * (attempt + 1))
    return f"FAIL {filename}: {last_err or 'no audio after retries'}"


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--level', help='הגבל לרמה אחת: 2cv / 3cv / 4cv')
    ap.add_argument('--word', help='הגבל למילה אחת (text מנוקד)')
    ap.add_argument('--narration', action='store_true', help='רק intro + completion (לא מילים)')
    ap.add_argument('--words-only', action='store_true', help='רק מילים, לא נרטיב')
    ap.add_argument('--force', action='store_true', help='דרוס קבצים קיימים')
    args = ap.parse_args()

    jobs = []  # list of (text, filename, validation_warning)

    if not args.narration:
        all_words = load_words()
        # סינון
        if args.level:
            all_words = [w for w in all_words if w.get('level') == args.level]
        if args.word:
            all_words = [w for w in all_words if w.get('text') == args.word]
            if not all_words:
                print(f"✗ מילה לא נמצאה: {args.word}", file=sys.stderr)
                sys.exit(1)

        # בנה jobs + ולידציה
        for w in all_words:
            text = w.get('text', '')
            key = w.get('key', '')
            if not text or not key:
                print(f"⚠ דילוג: רשומה לא חוקית {w}", file=sys.stderr)
                continue
            ok, warning = validate_bkp_dagesh(text)
            jobs.append((text, f"word-{key}", warning))
            if not ok:
                print(warning, file=sys.stderr)

    if not args.words_only and not (args.level or args.word):
        # narration כוללת — רק כשרצים על הכל
        jobs.append((INTRO_TEXT, "intro-isl05", ""))
        jobs.append((COMPLETION_TEXT, "completion-isl05", ""))

    if args.narration:
        jobs.append((INTRO_TEXT, "intro-isl05", ""))
        jobs.append((COMPLETION_TEXT, "completion-isl05", ""))

    print(f"בונה {len(jobs)} MP3 (rate={RATE}, voice={VOICE_AVRI})...")
    results = []
    for i, (text, filename, warning) in enumerate(jobs):
        result = await gen_one(text, filename, args.force)
        results.append(result)
        suffix = f"  ← {warning}" if warning else ""
        print(f"  [{i+1}/{len(jobs)}] {result}{suffix}")
        await asyncio.sleep(0.1)

    ok_count = sum(1 for r in results if r.startswith('OK'))
    skip_count = sum(1 for r in results if r.startswith('skip'))
    fail_count = sum(1 for r in results if r.startswith('FAIL'))
    print(f"\n✓ סיכום: {ok_count} נוצרו · {skip_count} דולגו · {fail_count} נכשלו")
    if fail_count > 0:
        print("\nכשלים:")
        for r in results:
            if r.startswith('FAIL'):
                print(f"  {r}")
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())
