#!/usr/bin/env python3
"""
מייצר קבצי MP3 לכל האותיות, צלילים ומילים של "אבני יסוד".
דורש: pip install edge-tts
מריץ: python generate-audio.py
תוצאה: audio/he/*.mp3 (~85 קבצים)
"""
import asyncio
import os
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    sys.exit("חסר edge-tts. הריצי: pip install edge-tts")

VOICE = "he-IL-HilaNeural"
OUT_DIR = Path(__file__).parent / "audio" / "he"

# ─── 22 שמות אותיות + 5 סופיות ───
LETTER_NAMES = {
    "alef": "אָלֶף", "bet": "בֵּית", "gimel": "גִּימֶל", "dalet": "דָּלֶת",
    "hey": "הֵא", "vav": "וָו", "zayin": "זַיִן", "het": "חֵית",
    "tet": "טֵית", "yud": "יוֹד", "kaf": "כָּף", "lamed": "לָמֶד",
    "mem": "מֵם", "nun": "נוּן", "samekh": "סָמֶךְ", "ayin": "עַיִן",
    "pey": "פֵּא", "tzadi": "צָדִי", "qof": "קוֹף", "resh": "רֵישׁ",
    "shin": "שִׁין", "tav": "תָּו",
    # סופיות
    "kaf-sofit": "כָּף סוֹפִית", "mem-sofit": "מֵם סוֹפִית",
    "nun-sofit": "נוּן סוֹפִית", "pey-sofit": "פֵּא סוֹפִית",
    "tzadi-sofit": "צָדִי סוֹפִית",
}

# ─── 22 צלילי אותיות (עם פתח/קמץ) ───
LETTER_SOUNDS = {
    "sound-alef": "אַ", "sound-bet": "בַּ", "sound-gimel": "גַּ", "sound-dalet": "דַּ",
    "sound-hey": "הַ", "sound-vav": "וַ", "sound-zayin": "זַ", "sound-het": "חַ",
    "sound-tet": "טַ", "sound-yud": "יַ", "sound-kaf": "כַּ", "sound-lamed": "לַ",
    "sound-mem": "מַ", "sound-nun": "נַ", "sound-samekh": "סַ", "sound-ayin": "עַ",
    "sound-pey": "פַּ", "sound-tzadi": "צַ", "sound-qof": "קַ", "sound-resh": "רַ",
    "sound-shin": "שַׁ", "sound-tav": "תַּ",
}

# ─── 7 ניקודים ───
NIKUD = {
    "kamatz": "קָמָץ", "patah": "פַּתָּח", "hirik": "חִירִיק",
    "holam": "חוֹלָם", "shuruk": "שׁוּרוּק", "tzere": "צֵירֵי", "segol": "סֶגוֹל",
}

# ─── ~30 מילים שכיחות (לפי content/words.json של אבני יסוד) ───
WORDS = {
    "ima": "אִמָּא", "aba": "אַבָּא", "yeled": "יֶלֶד", "yalda": "יַלְדָּה",
    "bayit": "בַּיִת", "gan": "גַּן", "yad": "יָד", "regel": "רֶגֶל",
    "ayin": "עַיִן", "ozen": "אֹזֶן", "shemesh": "שֶׁמֶשׁ", "yareach": "יָרֵחַ",
    "mayim": "מַיִם", "ochel": "אֹכֶל", "sefer": "סֵפֶר", "et": "עֵט",
    "daf": "דַּף", "kise": "כִּסֵּא", "shulchan": "שֻׁלְחָן", "delet": "דֶּלֶת",
    "dag": "דָּג", "kelev": "כֶּלֶב", "chatul": "חָתוּל", "ir": "עִיר",
    "perach": "פֶּרַח", "tapuach": "תַּפּוּחַ", "mechonit": "מְכוֹנִית",
    "etz": "עֵץ",
    # מילים ל-phonemic test (חריזה / segment)
    "chag": "חַג", "zait": "זַיִת", "din": "דִּין",
}

# ─── הוראות ופרזות שהמערכת אומרת ───
PHRASES = {
    "good": "כָּל הַכָּבוֹד!",
    "try-again": "בּוֹאִי נְנַסֶּה שׁוּב",
    "excellent": "מְצֻיָּן!",
    "what-letter": "אֵיזוֹ אוֹת?",
    "what-sound": "אֵיזֶה צְלִיל?",
}


async def generate_one(text: str, filename: Path):
    """מייצר קובץ MP3 בודד."""
    if filename.exists() and filename.stat().st_size > 0:
        print(f"  ✓ קיים: {filename.name}")
        return
    communicate = edge_tts.Communicate(text, VOICE, rate="-15%", pitch="+5Hz")
    await communicate.save(str(filename))
    size_kb = filename.stat().st_size / 1024
    print(f"  ✓ {filename.name} ({size_kb:.1f}KB)")


async def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\n📁 תיקיית פלט: {OUT_DIR}")
    print(f"🔊 קול: {VOICE}\n")

    all_items = []
    print("─── שמות אותיות (27) ───")
    for slug, text in LETTER_NAMES.items():
        all_items.append((slug, text))

    print("─── צלילי אותיות (22) ───")
    for slug, text in LETTER_SOUNDS.items():
        all_items.append((slug, text))

    print("─── ניקודים (7) ───")
    for slug, text in NIKUD.items():
        all_items.append((slug, text))

    print("─── מילים (31) ───")
    for slug, text in WORDS.items():
        all_items.append((slug, text))

    print("─── פרזות מערכת (5) ───")
    for slug, text in PHRASES.items():
        all_items.append((slug, text))

    total = len(all_items)
    print(f"\nסה\"כ {total} קבצים ליצירה...\n")

    # סינכרוני עם השהיות — Edge TTS חוסם batch גדולים
    for i, (slug, text) in enumerate(all_items, 1):
        try:
            await generate_one(text, OUT_DIR / f"{slug}.mp3")
        except Exception as e:
            print(f"  ✗ {slug}: {e}")
        if i % 5 == 0:
            print(f"  [{i}/{total}]")
            await asyncio.sleep(1)  # rate-limit relief
        else:
            await asyncio.sleep(0.2)

    print(f"\n✅ סיימתי. {total} קבצי MP3 ב-{OUT_DIR}")

    # סיכום סך הקבצים והגודל
    files = list(OUT_DIR.glob("*.mp3"))
    total_kb = sum(f.stat().st_size for f in files) / 1024
    print(f"📊 {len(files)} קבצים, {total_kb:.1f}KB סה\"כ")


if __name__ == "__main__":
    asyncio.run(main())
