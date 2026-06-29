#!/usr/bin/env python3
"""
סקריפט מאוחד ליצירת כל קבצי האודיו הנדרשים לאות חדשה באי 3.

שימוש:
    python generate-letter-audio.py mem
    python generate-letter-audio.py mem --force   # מחליף קבצים קיימים

הסקריפט יוצר עבור האות שצוינה:
  - name-{letter}.mp3       — שם האות (לדוגמה "מם")
  - sound-{letter}.mp3      — צליל קצר (לדוגמה "מְ")
  - find-{letter}.mp3       — "מצא את האות מ"
  - find-sound-{letter}.mp3 — "מצא את הצליל /מ/"
  - find-letter-in-word-{letter}.mp3 — "מצא את האות במילה"
  - which-bubble-{letter}.mp3 — "באיזו בועה האות מ?"
  - וכל המילים מ-items של האות (מ-data/island-03-items.json)

קביעה גלובלית: AvriNeural בלבד. עיין feedback_avrineural_tts_only.md.
"""
import asyncio
import json
import sys
import unicodedata
from pathlib import Path

import _eleven_tts as edge_tts  # מעבר ל-ElevenLabs (was: import edge_tts)

VOICE = "he-IL-AvriNeural"
ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
DATA_DIR = ROOT / "data"

# מיפוי אות עברית → שם קובץ אנגלי
LETTER_FILENAMES = {
    "א": "alef", "ב": "bet", "ג": "gimel", "ד": "dalet",
    "ה": "hey", "ו": "vav", "ז": "zayin", "ח": "het",
    "ט": "tet", "י": "yud", "כ": "kaf", "ל": "lamed",
    "מ": "mem", "נ": "nun", "ס": "samekh", "ע": "ayin",
    "פ": "pey", "צ": "tzadi", "ק": "qof", "ר": "resh",
    "ש": "shin", "ת": "tav",
}

# שם האות בעברית מנוקדת (לקובץ name-X.mp3)
LETTER_NAMES = {
    "א": "אָלֶף", "ב": "בֵּית", "ג": "גִּימֶל", "ד": "דָּלֶת",
    "ה": "הֵא", "ו": "וָו", "ז": "זַיִן", "ח": "חֵית",
    "ט": "טֵית", "י": "יוֹד", "כ": "כָּף", "ל": "לָמֶד",
    "מ": "מֵם", "נ": "נוּן", "ס": "סָמֶךְ", "ע": "עַיִן",
    "פ": "פֵּא", "צ": "צָדִי", "ק": "קוֹף", "ר": "רֵישׁ",
    "ש": "שִׁין", "ת": "תָּו",
}

# צליל קצר של האות (לקובץ sound-X.mp3) — שווא נע
LETTER_SOUNDS = {
    "א": "אְ", "ב": "בְּ", "ג": "גְּ", "ד": "דְּ",
    "ה": "הְ", "ו": "וְ", "ז": "זְ", "ח": "חְ",
    "ט": "טְ", "י": "יְ", "כ": "כְּ", "ל": "לְ",
    "מ": "מְ", "נ": "נְ", "ס": "סְ", "ע": "עְ",
    "פ": "פְּ", "צ": "צְ", "ק": "קְ", "ר": "רְ",
    "ש": "שְׁ", "ת": "תְ",
}


def strip_niqqud(s: str) -> str:
    """מסיר ניקוד מהמילה — לבחירת שם קובץ."""
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


async def gen(text: str, filename: str, force: bool = False):
    out = OUT_DIR / f"{filename}.mp3"
    if out.exists() and not force:
        return f"SKIP {filename}.mp3 (קיים)"
    try:
        tts = edge_tts.Communicate(text, VOICE, rate="-15%")
        await tts.save(str(out))
        size_kb = out.stat().st_size / 1024
        return f"OK   {filename}.mp3 ({size_kb:.1f}KB): {text}"
    except Exception as e:
        return f"FAIL {filename}: {text} ({type(e).__name__}: {e})"


def extract_words_for_letter(letter: str) -> set[str]:
    """מחלץ מילים מ-items של האות (כולל מסיחים) — בלי ניקוד."""
    words = set()
    items_file = DATA_DIR / "island-03-items.json"
    if not items_file.exists():
        return words
    d = json.loads(items_file.read_text(encoding="utf-8"))
    items = d.get("items", [])
    for it in items:
        if it.get("letter_in_focus") != letter:
            continue
        for opt in it.get("options", []):
            w = opt.get("word") or opt.get("concept")
            if w:
                words.add(strip_niqqud(w))
                words.add(w)  # גם עם ניקוד למקרה שמשתמשים כך
    return words


async def main():
    if len(sys.argv) < 2:
        print("שימוש: python generate-letter-audio.py <letter> [--force]")
        print("דוגמה: python generate-letter-audio.py מ")
        sys.exit(1)

    letter = sys.argv[1]
    force = "--force" in sys.argv

    if letter not in LETTER_FILENAMES:
        print(f"אות לא מזוהה: {letter}")
        print(f"אותיות אפשריות: {' '.join(LETTER_FILENAMES.keys())}")
        sys.exit(1)

    letter_en = LETTER_FILENAMES[letter]
    name = LETTER_NAMES[letter]
    sound = LETTER_SOUNDS[letter]

    # 6 קבצי ליבה לאות
    core_files = {
        f"name-{letter_en}": name,
        f"sound-{letter_en}": sound,
        f"find-{letter_en}": f"מָצָא אֶת הָאוֹת {letter}",
        f"find-sound-{letter_en}": f"מָצָא אֶת הַצְּלִיל {sound}",
        f"find-letter-in-word-{letter_en}": f"בְּאֵיזוֹ מִלָּה מוֹפִיעָה הָאוֹת {letter}?",
        f"which-bubble-{letter_en}": f"בְּאֵיזוֹ בּוּעָה הָאוֹת {letter}?",
    }

    # מילים מ-items
    words = extract_words_for_letter(letter)
    word_files = {strip_niqqud(w): w for w in words if w}

    all_files = {**core_files, **word_files}

    print(f"אות: {letter} ({letter_en})")
    print(f"קול: {VOICE}")
    print(f"קבצי ליבה: {len(core_files)}")
    print(f"מילים: {len(word_files)}")
    print(f"סה\"כ: {len(all_files)} קבצים")
    print(f"מצב: {'force (יחליף קיים)' if force else 'skip קיימים'}\n")

    success = 0
    items = list(all_files.items())
    for i, (key, text) in enumerate(items, 1):
        result = await gen(text, key, force=force)
        print(f"[{i:3}/{len(items)}] {result}")
        if "OK" in result or "SKIP" in result:
            success += 1
        await asyncio.sleep(0.25)

    print(f"\nDone. {success}/{len(items)}")
    print(f"Output: {OUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
