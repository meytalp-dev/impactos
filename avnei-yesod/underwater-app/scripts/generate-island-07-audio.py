#!/usr/bin/env python3
"""
generate-island-07-audio.py — MP3 לאי 7 "לָגוּנַת הַזְּרָמִים" (דקודינג צ׳אנקים).

7.7.2026 · לוח בניית האיים H7. תבנית: generate-island-05-word-audio.py.
קול נוני = ElevenLabs eleven_v3 (voice ZI6I4a3UGgs1DXxqWjBV) דרך _eleven_tts.
QA = תמלול Whisper (scripts/qa-island-07-whisper.py).

שמות קבצים (assets/audio/):
  word-isl07-<slug>.mp3          → המילה המלאה (מַתָּנָה)
  chunk-isl07-<slug>-<i>.mp3     → צ׳אנק בודד (מַ / תָּ / נָה)
  intro-isl07.mp3                → סיפור האי (דף-אי)
  mission-isl07-chunks.mp3       → הוראת המשחקון (overlay)

הרצה:
  python scripts/generate-island-07-audio.py                 # הכל (חסר בלבד)
  python scripts/generate-island-07-audio.py --words         # רק מילים מלאות
  python scripts/generate-island-07-audio.py --chunks        # רק צ׳אנקים
  python scripts/generate-island-07-audio.py --narration     # רק intro + mission
  python scripts/generate-island-07-audio.py --slug matana   # מילה אחת + צ׳אנקיה
  python scripts/generate-island-07-audio.py --force         # דריסה
"""
import argparse
import asyncio
import sys
from pathlib import Path

import _eleven_tts as edge_tts  # ElevenLabs eleven_v3 (קול נוני)

VOICE = "he-IL-AvriNeural"  # מתעלמים ממנו ב-_eleven_tts (קול ElevenLabs קבוע)
RATE = "-10%"

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── 14 המילים (אושרו ע"י מיטל 7.7.2026) — זהה ל-WORDS ב-stage-7-chunks.html ──
# אילוץ-תנועות לפי לוח התוכנית: ליבה=קמץ/פתח/שווא/חיריק; חולם=פבר+; צירי/סגול=מרץ+.
WORDS = [
    ("matana",   "מַתָּנָה",   ["מַ", "תָּ", "נָה"]),
    ("banana",   "בָּנָנָה",   ["בָּ", "נָ", "נָה"]),
    ("ananas",   "אֲנָנָס",    ["אֲ", "נָ", "נָס"]),
    ("ayala",    "אַיָּלָה",   ["אַ", "יָּ", "לָה"]),
    ("nemala",   "נְמָלָה",    ["נְ", "מָ", "לָה"]),
    ("mamtakim", "מַמְתַּקִּים", ["מַמְ", "תַּ", "קִּים"]),
    ("chatzait", "חֲצָאִית",   ["חֲ", "צָ", "אִית"]),
    ("mitriya",  "מִטְרִיָּה",  ["מִטְ", "רִ", "יָּה"]),
    ("pitriya",  "פִּטְרִיָּה", ["פִּטְ", "רִ", "יָּה"]),
    ("menora",   "מְנוֹרָה",   ["מְ", "נוֹ", "רָה"]),
    ("iparon",   "עִפָּרוֹן",  ["עִ", "פָּ", "רוֹן"]),
    ("levena",   "לְבֵנָה",    ["לְ", "בֵ", "נָה"]),
    ("mafteach", "מַפְתֵּחַ",  ["מַפְ", "תֵּ", "חַ"]),
    ("rakevet",  "רַכֶּבֶת",   ["רַ", "כֶּ", "בֶת"]),
]

INTRO_TEXT = (
    "בַּלָּגוּנָה שֶׁל נוֹנִי הַזְּרָמִים חֲזָקִים. "
    "הֵם תָּפְסוּ מִלִּים אֲרֻכּוֹת וּפֵרְקוּ אוֹתָן לַחֲלָקִים קְטַנִּים. "
    "בּוֹאוּ נַרְכִּיב אֶת הַחֲלָקִים בְּמִגְדַּל הָאַלְמוֹגִים, וְהַמִּלָּה תֵּאוֹר!"
)

MISSION_TEXT = (
    "כֹּל מִלָּה בְּנוּיָה מֵחֲלָקִים. "
    "הַרְכִּיבוּ כֹּל חֵלֶק בַּמִּגְדָּל, לְפִי הַסֵּדֶר — מִיָּמִין לִשְׂמֹאל."
)


async def gen_one(text: str, filename: str, force: bool, retries: int = 3) -> str:
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not force:
        return f"skip {filename}"
    last_err = None
    for attempt in range(retries):
        try:
            tts = edge_tts.Communicate(text, VOICE, rate=RATE)
            await tts.save(str(out))
            if out.exists() and out.stat().st_size > 100:
                return f"OK   {filename}" + (f" (retry {attempt})" if attempt else "")
            if out.exists():
                out.unlink()
        except Exception as e:  # noqa: BLE001
            last_err = e
        await asyncio.sleep(0.6 * (attempt + 1))
    return f"FAIL {filename}: {last_err or 'no audio'}"


def build_jobs(args) -> list[tuple[str, str]]:
    """מחזיר [(text, filename), ...]."""
    jobs = []
    words = WORDS
    if args.slug:
        words = [w for w in WORDS if w[0] == args.slug]
        if not words:
            print(f"✗ slug לא נמצא: {args.slug}", file=sys.stderr)
            sys.exit(1)

    want_words = args.words or args.slug or not (args.chunks or args.narration)
    want_chunks = args.chunks or args.slug or not (args.words or args.narration)
    want_narr = args.narration or not (args.words or args.chunks or args.slug)

    if want_words:
        for slug, text, _ in words:
            jobs.append((text, f"word-isl07-{slug}"))
    if want_chunks:
        for slug, _, chunks in words:
            for i, ch in enumerate(chunks, start=1):
                jobs.append((ch, f"chunk-isl07-{slug}-{i}"))
    if want_narr:
        jobs.append((INTRO_TEXT, "intro-isl07"))
        jobs.append((MISSION_TEXT, "mission-isl07-chunks"))
    return jobs


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--words", action="store_true", help="רק מילים מלאות")
    ap.add_argument("--chunks", action="store_true", help="רק צ׳אנקים")
    ap.add_argument("--narration", action="store_true", help="רק intro + mission")
    ap.add_argument("--slug", help="מילה אחת (slug) + הצ׳אנקים שלה")
    ap.add_argument("--force", action="store_true", help="דרוס קיימים")
    args = ap.parse_args()

    jobs = build_jobs(args)
    print(f"בונה {len(jobs)} MP3 (קול נוני · eleven_v3)...")
    results = []
    for i, (text, filename) in enumerate(jobs):
        res = await gen_one(text, filename, args.force)
        results.append(res)
        print(f"  [{i+1}/{len(jobs)}] {res}  «{text}»")
        await asyncio.sleep(0.15)

    ok = sum(1 for r in results if r.startswith("OK"))
    skip = sum(1 for r in results if r.startswith("skip"))
    fail = sum(1 for r in results if r.startswith("FAIL"))
    print(f"\n✓ סיכום: {ok} נוצרו · {skip} דולגו · {fail} נכשלו")
    if fail:
        print("\nכשלים:")
        for r in results:
            if r.startswith("FAIL"):
                print(f"  {r}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
