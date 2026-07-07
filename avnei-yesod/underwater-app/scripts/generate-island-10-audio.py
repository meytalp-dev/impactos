#!/usr/bin/env python3
"""generate-island-10-audio.py — אודיו לאי 10 (מִפְרַץ אַבְנֵי הַבְּנִיָּה) · C10.

7 קליפים, קול נוני (ElevenLabs eleven_v3 דרך _eleven_tts):
  intro-isl10.mp3             — סיפור פתיחת האי (בעיה→פתרון)
  mission-isl10-plural.mp3    — הוראת משחקון 1 (אֶחָד אוֹ הַרְבֵּה)
  mission-isl10-prefix.mp3    — הוראת משחקון 2 (הַהַתְחָלָה הַקְּטַנָּה)
  completion-isl10.mp3        — שֶׁבַח סיום (בלי "יופי")
  isl10-w-lenadav.mp3         — stem אודיו: לְנָדָב  (תחילית לְ)
  isl10-w-vechardal.mp3       — stem אודיו: וְחַרְדָּל (ו' החיבור)
  isl10-w-bidvash.mp3         — stem אודיו: בִּדְבַשׁ  (תחילית בְּ)

מדוע רק 3 מילים? משחקון הסיומות (יחיד/רבים) עובד על stem טקסט (הבסיס נראֶה
לעין) → אין צורך באודיו פר-מילה שם. רק ה-stems האודיו של התחיליות מוקלטים.

QA (הסוכן לא שומע — תמלול = האימות): Whisper small.
  נרטיב  — דמיון-רצף על עיצורים ≥ 0.80 (כמו island-09/14).
  מילים   — רשימת-קבלה מדויקת של הומופונים; ו'-החיבור חייבת להישמע (accept={"וחרדל"}).
עד 4 ניסיונות פר קליפ; כישלון נרשם בדוח ולא מועתק.

הרצה: PYTHONIOENCODING=utf-8 python generate-island-10-audio.py
פלט:  ../assets/audio/*.mp3 + island-10-audio-report.json
"""
import asyncio
import difflib
import json
import re
import shutil
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import _eleven_tts as tts

APP = Path(__file__).parent.parent
OUT = APP / "assets" / "audio"
TRIES = Path(__file__).parent / "_isl10_tries"
REPORT = Path(__file__).parent / "island-10-audio-report.json"
OUT.mkdir(parents=True, exist_ok=True)
TRIES.mkdir(parents=True, exist_ok=True)

MAX_TRIES = 4
NARRATION_MIN_SIM = 0.80

# ─── נרטיב (מנוקד מלא · לשון רבים · בלי "יופי") ───
NARRATION = {
    "intro-isl10": (
        "מִפְרַץ אַבְנֵי הַבְּנִיָּה. "
        "בַּמִּפְרָץ שֶׁל נוּנִי הַמִּלִּים בְּנוּיוֹת מֵאַבְנֵי בְּנִיָּה — "
        "אוֹת קְטַנָּה בַּהַתְחָלָה וְסִיּוֹמֶת בַּסּוֹף. "
        "אֲבָל זֶרֶם חָזָק נִתֵּק אֶת הָאֲבָנִים מֵהַמִּלִּים, "
        "וְעַכְשָׁו קָשֶׁה לָדַעַת מָה אֶחָד וּמָה הַרְבֵּה. "
        "בּוֹאוּ נַחֲזִיר כֹּל אֶבֶן לַמָּקוֹם שֶׁלָּהּ!"
    ),
    "mission-isl10-plural": (
        "כְּשֶׁיֵּשׁ הַרְבֵּה, הַמִּלָּה מְקַבֶּלֶת אֶבֶן בַּסּוֹף. "
        "הִסְתַּכְּלוּ בַּמִּלָּה, וּבַחֲרוּ אֶת צוּרַת הָרַבִּים הַנְּכוֹנָה."
    ),
    "mission-isl10-prefix": (
        "לִפְנֵי הַמִּלָּה מִתְחַבֵּאת אוֹת קְטַנָּה — לְ, וְ אוֹ בְּ. "
        "הַקְשִׁיבוּ הֵיטֵב, וּבַחֲרוּ אֶת הַכְּתִיב הַנָּכוֹן."
    ),
    "completion-isl10": (
        "מְעֻלֶּה! הֶחְזַרְתֶּם אֶת כֹּל אַבְנֵי הַבְּנִיָּה לַמִּלִּים!"
    ),
}

# ─── מילות ה-stem (תחיליות) — (key, טקסט מנוקד, accept-set של תמלול מנורמל) ───
WORDS = [
    ("isl10-w-lenadav",   "לְנָדָב",    {"לנדב"}),
    ("isl10-w-vechardal", "וְחַרְדָּל",  {"וחרדל"}),   # ו'-החיבור חייבת להישמע
    ("isl10-w-bidvash",   "בִּדְבַשׁ",   {"בדבש"}),
]

WHISPER_PROMPT_WORDS = "מילים בעברית: " + ", ".join(re.sub(r"[֑-ׇ]", "", w) for _, w, _ in WORDS) + "."


def norm_seq(s):
    """נירמול לנרטיב: בלי ניקוד, אותיות ורווחים בלבד."""
    s = re.sub(r"[֑-ׇ]", "", s or "")
    s = re.sub(r"[^א-ת ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def norm_word(s):
    """נירמול למילה בודדת: אותיות בלבד, סופיות→רגילות."""
    s = re.sub(r"[֑-ׇ]", "", s or "")
    s = re.sub(r"[^א-ת]", "", s)
    return s.translate(str.maketrans("ךםןףץ", "כמנפצ"))


async def gen(text, path):
    await tts.Communicate(text).save(path)


def produce(model, key, text, accept):
    """מפיק קליפ + QA. accept=None → נרטיב (דמיון-רצף); אחרת רשימת-קבלה למילה."""
    final = OUT / f"{key}.mp3"
    if final.exists() and final.stat().st_size > 0:
        return ("skipped", None)

    prompt = text if accept is None else WHISPER_PROMPT_WORDS
    best_sim = 0.0
    for attempt in range(1, MAX_TRIES + 1):
        try_path = TRIES / f"{key}-t{attempt}.mp3"
        try:
            asyncio.run(gen(text, try_path))
        except Exception as e:
            print(f"    t{attempt} TTS error: {e}")
            continue
        if not try_path.exists() or try_path.stat().st_size == 0:
            continue
        heard_raw = model.transcribe(str(try_path), language="he", initial_prompt=prompt)["text"]
        if accept is None:
            want, heard = norm_seq(text), norm_seq(heard_raw)
            sim = difflib.SequenceMatcher(None, want, heard).ratio()
            best_sim = max(best_sim, sim)
            print(f"    t{attempt} sim={sim:.2f}")
            if sim >= NARRATION_MIN_SIM:
                shutil.copyfile(try_path, final)
                return ("ok", round(sim, 3))
        else:
            heard = norm_word(heard_raw)
            passed = heard in {norm_word(a) for a in accept}
            print(f"    t{attempt} heard='{heard}' {'PASS' if passed else 'reject'}")
            if passed:
                shutil.copyfile(try_path, final)
                return ("ok", heard)
    return ("failed", best_sim if accept is None else None)


def main():
    import whisper
    print("loading whisper (small)...")
    model = whisper.load_model("small")

    targets = [(k, t, None) for k, t in NARRATION.items()] + \
              [(k, t, a) for k, t, a in WORDS]
    report = {"ok": [], "failed": [], "skipped": []}

    for i, (key, text, accept) in enumerate(targets, 1):
        print(f"[{i}/{len(targets)}] {key}")
        status, detail = produce(model, key, text, accept)
        if status == "ok":
            report["ok"].append({"key": key, "qa": detail})
        elif status == "skipped":
            report["skipped"].append(key)
            print("    exists, skip")
        else:
            report["failed"].append({"key": key, "text": text, "best": detail})
            print(f"    !! FAILED after {MAX_TRIES} tries")

    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\ndone: {len(report['ok'])} ok · {len(report['failed'])} failed · "
          f"{len(report['skipped'])} skipped → {REPORT.name}")
    sys.exit(1 if report["failed"] else 0)


if __name__ == "__main__":
    main()
