#!/usr/bin/env python3
"""
generate-island-04-cv-audio.py — מפיק MP3 ל-198 CV pairs (22 × 9 vowels)
לאי 4 — אות-ניקוד-צליל.

סוכן 29 · 29.5.2026 ערב — מטמיע אחרי שמיטל אישרה לעבור מ-Web Speech ל-AvriNeural
(החלטה שונה מההוראת תזמורת המקורית, אחרי שהתגלה שאין קול עברי
זמין ב-Windows ובדפדפנים מסוימים).

שם קובץ: cv-<letter_key>-<vowel_id>.mp3
מיקום:   assets/audio/cv-<letter_key>-<vowel_id>.mp3

דוגמאות:
  cv-mem-patach.mp3   → "מַ"
  cv-mem-kamatz.mp3   → "מָ" (אותו צליל /ma/)
  cv-bet-shva.mp3     → "בְּ"

מצב ברירת מחדל: לא דורס. --force כדי להקליט מחדש.

דורש: pip install edge-tts
הרצה:
  python scripts/generate-island-04-cv-audio.py            # כל 198
  python scripts/generate-island-04-cv-audio.py --letter מ  # אות אחת (9 קבצים)
  python scripts/generate-island-04-cv-audio.py --force     # דריסה מלאה
"""
import argparse
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

VOICE_AVRI = "he-IL-AvriNeural"   # סטנדרט אבני יסוד
RATE = "-10%"                     # אותו rate כמו ב-shin demo + bubbles

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# letter → letter_key (תואם sound-<key>.mp3 הקיים באי 3)
LETTER_KEY = {
    'א': 'alef',  'ב': 'bet',   'ג': 'gimel', 'ד': 'dalet', 'ה': 'hey',
    'ו': 'vav',   'ז': 'zayin', 'ח': 'het',   'ט': 'tet',   'י': 'yud',
    'כ': 'kaf',   'ל': 'lamed', 'מ': 'mem',   'נ': 'nun',   'ס': 'samekh',
    'ע': 'ayin',  'פ': 'pey',   'צ': 'tzadi', 'ק': 'qof',   'ר': 'resh',
    'ש': 'shin',  'ת': 'tav',
}

# 9 ה-vowels — תואם vowel-adapter.VOWELS (קובוץ+שורוק נוספו 4.7.2026 — שבוע אוּ)
VOWELS = [
    {'id': 'kamatz', 'symbol': 'ָ'},   # ָ
    {'id': 'patach', 'symbol': 'ַ'},   # ַ
    {'id': 'shva',   'symbol': 'ְ'},   # ְ
    {'id': 'hiriq',  'symbol': 'ִ'},   # ִ
    {'id': 'holam',  'symbol': 'ֹ'},   # ֹ
    {'id': 'tzere',  'symbol': 'ֵ'},   # ֵ
    {'id': 'segol',  'symbol': 'ֶ'},   # ֶ
    {'id': 'kubutz', 'symbol': 'ֻ'},   # ֻ
    {'id': 'shuruk', 'symbol': 'וּ'},  # וּ — אות ו + דגש, לא combining mark
]

# טקסט שיוקרא ע"י AvriNeural — CV כ-string (אות + ניקוד + דגש אם רלוונטי).
# ב/כ/פ בתחילת הברה חייבות דגש קל כדי שמיטל לא תקבל /v·x·f/.
# ראה: reference-hebrew-bgd-kpt-dagesh-rule. נוסף 30.5.2026.
BKP_LETTERS = {'ב', 'כ', 'פ'}
DAGESH = 'ּ'   # HEBREW POINT DAGESH OR MAPIQ

def cv_text(letter: str, vowel_id: str, vowel_symbol: str) -> str:
    """letter + vowel + dagesh (אם ב/כ/פ). סדר Unicode 5d1 5b7 5bc תואם vowel-adapter.

    שורוק יוצא דופן: וּ = אות ו + דגש (לא combining mark), והדגש הקל של ב/כ/פ
    יושב על העיצור *לפני* ה-ו: בּוּ = 5d1 5bc 5d5 5bc. תואם buildCV ב-vowel-adapter.
    """
    if vowel_id == 'shuruk':
        return (letter + DAGESH if letter in BKP_LETTERS else letter) + vowel_symbol
    if letter in BKP_LETTERS:
        return letter + vowel_symbol + DAGESH
    return letter + vowel_symbol


async def gen_one(text: str, filename: str, force: bool, retries: int = 3) -> str:
    """Generate one MP3 with retry on edge-tts 'No audio was received' errors."""
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not force:
        return f"skip {filename}"
    last_err = None
    for attempt in range(retries):
        try:
            tts = edge_tts.Communicate(text, VOICE_AVRI, rate=RATE)
            await tts.save(str(out))
            # ודא שהקובץ אכן נוצר ולא 0 bytes (edge-tts כותב לפעמים ריק במקרה
            # של 'No audio was received')
            if out.exists() and out.stat().st_size > 100:
                return f"OK   {filename}" + (f" (retry {attempt})" if attempt > 0 else "")
            # מחק קובץ ריק לפני retry
            if out.exists():
                out.unlink()
        except Exception as e:
            last_err = e
        await asyncio.sleep(0.5 * (attempt + 1))  # exponential backoff: 0.5s, 1s, 1.5s
    return f"FAIL {filename}: {last_err or 'no audio after retries'}"


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--letter', help='הגבל לאות אחת (תו עברי בודד, למשל: מ)')
    ap.add_argument('--vowel', help='הגבל ל-vowel id אחד (kamatz/patach/.../shuruk)')
    ap.add_argument('--force', action='store_true', help='דרוס קבצים קיימים')
    args = ap.parse_args()

    letters = [args.letter] if args.letter else list(LETTER_KEY.keys())
    vowels = [v for v in VOWELS if not args.vowel or v['id'] == args.vowel]

    if args.letter and args.letter not in LETTER_KEY:
        print(f"✗ אות לא חוקית: {args.letter}", file=sys.stderr)
        sys.exit(1)
    if args.vowel and not any(v['id'] == args.vowel for v in VOWELS):
        print(f"✗ vowel לא חוקי: {args.vowel}", file=sys.stderr)
        sys.exit(1)

    # סדרתי (לא asyncio.gather) — edge-tts מצערת בקשות מקבילות עם
    # 'No audio was received'. השהייה קצרה בין בקשות.
    jobs = []
    for letter in letters:
        key = LETTER_KEY[letter]
        for v in vowels:
            text = cv_text(letter, v['id'], v['symbol'])
            filename = f"cv-{key}-{v['id']}"
            jobs.append((text, filename))

    print(f"בונה {len(jobs)} CV MP3 (rate={RATE}, voice={VOICE_AVRI})...")
    results = []
    for i, (text, filename) in enumerate(jobs):
        result = await gen_one(text, filename, args.force)
        results.append(result)
        print(f"  [{i+1}/{len(jobs)}] {result}")
        await asyncio.sleep(0.1)  # 100ms gap בין בקשות

    ok = sum(1 for r in results if r.startswith('OK'))
    skip = sum(1 for r in results if r.startswith('skip'))
    fail = sum(1 for r in results if r.startswith('FAIL'))
    print(f"\n✓ סיכום: {ok} נוצרו · {skip} דולגו · {fail} נכשלו")
    if fail > 0:
        print("\nכשלים:")
        for r in results:
            if r.startswith('FAIL'):
                print(f"  {r}")
    if fail > 0:
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())
