#!/usr/bin/env python3
"""
generate-island-04-words-audio.py — מפיק MP3 ל-anchor words של אי 4.
שם קובץ: word-<letter_key>-<vowel_id>.mp3   (אותה convention כמו cv-*.mp3)

קורא מ-data/island-04-cv/cv-pairs.json — כל pair עם anchor_word != null.

סוכן 29 · 29.5.2026 ערב.
"""
import argparse
import asyncio
import json
import sys
from pathlib import Path

import edge_tts

VOICE_AVRI = "he-IL-AvriNeural"
RATE = "-10%"

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
CV_PAIRS_JSON = ROOT / "data" / "island-04-cv" / "cv-pairs.json"


async def gen_one(text: str, filename: str, force: bool, retries: int = 3) -> str:
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not force and out.stat().st_size > 100:
        return f"skip {filename} ('{text}')"
    last_err = None
    for attempt in range(retries):
        try:
            tts = edge_tts.Communicate(text, VOICE_AVRI, rate=RATE)
            await tts.save(str(out))
            if out.exists() and out.stat().st_size > 100:
                return f"OK   {filename} ('{text}')" + (f" retry={attempt}" if attempt > 0 else "")
            if out.exists():
                out.unlink()
        except Exception as e:
            last_err = e
        await asyncio.sleep(0.5 * (attempt + 1))
    return f"FAIL {filename} ('{text}'): {last_err or 'no audio'}"


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--force', action='store_true')
    args = ap.parse_args()

    with open(CV_PAIRS_JSON, encoding='utf-8') as f:
        data = json.load(f)

    jobs = []
    for p in data['pairs']:
        if not p.get('anchor_word'):
            continue
        filename = f"word-{p['letter_key']}-{p['vowel_id']}"
        jobs.append((p['anchor_word'], filename))

    print(f"בונה {len(jobs)} word MP3 (rate={RATE}, voice={VOICE_AVRI})...")
    results = []
    for i, (text, filename) in enumerate(jobs):
        r = await gen_one(text, filename, args.force)
        results.append(r)
        print(f"  [{i+1}/{len(jobs)}] {r}")
        await asyncio.sleep(0.1)

    ok = sum(1 for r in results if r.startswith('OK'))
    skip = sum(1 for r in results if r.startswith('skip'))
    fail = sum(1 for r in results if r.startswith('FAIL'))
    print(f"\n✓ {ok} נוצרו · {skip} דולגו · {fail} נכשלו")
    if fail > 0:
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())
