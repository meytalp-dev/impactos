#!/usr/bin/env python3
"""generate-island-09-audio.py — אודיו לאי 9 (שְׂדֵה מִשְׁפְּחוֹת הָאַלְמוֹגִים) · C9.

27 קליפים, קול נוני (ElevenLabs eleven_v3 דרך _eleven_tts):
  intro-isl09.mp3                — סיפור פתיחת האי
  mission-isl09-family-sort.mp3  — הוראת משחקון 1 (בית משפחת המילים)
  mission-isl09-root-stamp.mp3   — הוראת משחקון 2 (חותמת המשפחה)
  isl9-w-*.mp3 × 24              — מילות משפחות (js/shared/island-9-families.js)

QA (הסוכן לא שומע — תמלול = האימות): Whisper small.
  נרטיב  — דמיון-רצף על עיצורים ≥ 0.80 (כמו island-14).
  מילים   — רשימת-קבלה מדויקת של הומופונים (כמו B2); בלי קבלה סלחנית.
עד 4 ניסיונות פר קליפ; כישלון נרשם בדוח ולא מועתק.

הרצה: PYTHONIOENCODING=utf-8 python generate-island-09-audio.py
פלט:  ../assets/audio/*.mp3 + island-09-audio-report.json
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
TRIES = Path(__file__).parent / "_isl9_tries"
REPORT = Path(__file__).parent / "island-09-audio-report.json"
OUT.mkdir(parents=True, exist_ok=True)
TRIES.mkdir(parents=True, exist_ok=True)

MAX_TRIES = 4
NARRATION_MIN_SIM = 0.80

# ─── נרטיב (מנוקד מלא · לשון רבים · בלי "יופי") ───
NARRATION = {
    "intro-isl09": (
        "שְׂדֵה מִשְׁפְּחוֹת הָאַלְמוֹגִים. "
        "בַּשָּׂדֶה שֶׁל נוּנִי הָאַלְמוֹגִים גְּדֵלִים בְּמִשְׁפָּחוֹת, "
        "וְכֹל מִשְׁפָּחָה שׁוֹמֶרֶת עַל חוֹתֶמֶת סוֹדִית — "
        "שָׁלוֹשׁ אוֹתִיּוֹת שֶׁחוֹזְרוֹת בְּכֹל מִלָּה. "
        "אֲבָל בַּלַּיְלָה עָבַר זֶרֶם חָזָק, וְהַמִּלִּים הִתְפַּזְּרוּ מֵהַבָּתִּים. "
        "בּוֹאוּ נַחְזִיר כֹּל מִלָּה לַמִּשְׁפָּחָה שֶׁלָּהּ!"
    ),
    "mission-isl09-family-sort": (
        "לְכֹל מִשְׁפָּחָה יֵשׁ בַּיִת שֶׁל אַלְמוֹגִים, "
        "וְעַל הַבַּיִת — חוֹתֶמֶת שֶׁל שָׁלוֹשׁ אוֹתִיּוֹת. "
        "הִסְתַּכְּלוּ בַּמִּלָּה, מִצְאוּ אֶת הָאוֹתִיּוֹת שֶׁחוֹזְרוֹת, "
        "וְהַקִּישׁוּ עַל הַבַּיִת הַמַּתְאִים."
    ),
    "mission-isl09-root-stamp": (
        "נוּנִי מַרְאָה לָכֶם חוֹתֶמֶת שֶׁל מִשְׁפָּחָה — שָׁלוֹשׁ אוֹתִיּוֹת. "
        "רַק בְּמִלָּה אַחַת הַחוֹתֶמֶת מִסְתַּתֶּרֶת. "
        "מִצְאוּ אוֹתָהּ — וְהַקִּישׁוּ עָלֶיהָ."
    ),
}

# ─── מילות המשפחות — (key, טקסט מנוקד, accept-set של תמלול מנורמל) ───
# ה-accept כולל כתיב חסר+מלא; אין קבלה "קרובה" — מילה שנשמעת אחרת נפסלת.
WORDS = [
    ("isl9-w-sefer",    "סֵפֶר",      {"ספר"}),
    ("isl9-w-sipur",    "סִפּוּר",     {"ספור", "סיפור"}),
    ("isl9-w-mesaper",  "מְסַפֵּר",    {"מספר"}),
    ("isl9-w-kotev",    "כּוֹתֵב",     {"כותב"}),
    ("isl9-w-kotevet",  "כּוֹתֶבֶת",   {"כותבת"}),
    ("isl9-w-michtav",  "מִכְתָּב",    {"מכתב"}),
    ("isl9-w-lomed",    "לוֹמֵד",     {"לומד"}),
    ("isl9-w-lomedet",  "לוֹמֶדֶת",   {"לומדת"}),
    ("isl9-w-talmid",   "תַּלְמִיד",   {"תלמיד"}),
    ("isl9-w-tsochek",  "צוֹחֵק",     {"צוחק"}),
    ("isl9-w-tschok",   "צְחוֹק",     {"צחוק"}),
    ("isl9-w-matschik", "מַצְחִיק",    {"מצחיק"}),
    ("isl9-w-roked",    "רוֹקֵד",     {"רוקד"}),
    ("isl9-w-rokedet",  "רוֹקֶדֶת",   {"רוקדת"}),
    ("isl9-w-rikud",    "רִקּוּד",     {"רקוד", "ריקוד"}),
    ("isl9-w-shomer",   "שׁוֹמֵר",     {"שומר"}),
    ("isl9-w-shomeret", "שׁוֹמֶרֶת",   {"שומרת"}),
    ("isl9-w-shmira",   "שְׁמִירָה",   {"שמירה"}),
    ("isl9-w-gadol",    "גָּדוֹל",     {"גדול"}),
    ("isl9-w-gdola",    "גְּדוֹלָה",   {"גדולה"}),
    ("isl9-w-migdal",   "מִגְדָּל",    {"מגדל"}),
    ("isl9-w-kofets",   "קוֹפֵץ",     {"קופץ", "קופצ"}),
    ("isl9-w-kofetset", "קוֹפֶצֶת",   {"קופצת"}),
    ("isl9-w-kfitsa",   "קְפִיצָה",    {"קפיצה", "קפיצא"}),
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
