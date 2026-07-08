#!/usr/bin/env python3
"""
qa-island-07-whisper.py — QA תמלול Whisper לקליפי אי 7 (word-isl07-* / chunk-isl07-* / נרטיב).

הסוכן לא שומע — תמלול ואימות מול הטקסט הצפוי (השוואת שלד-עיצורים, Levenshtein).
תבנית: qa-pronunciation-sweep.py (faster_whisper, small, he).

הרצה:
  python scripts/qa-island-07-whisper.py            # כל קליפי אי 7 הקיימים
  python scripts/qa-island-07-whisper.py --slug matana
כלל: צ׳אנקים קצרים (הברה בודדת) → סף מקל; מילים → סף 0.6.
"""
import argparse
import re
import sys
import unicodedata
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).parent.parent
AUDIO = ROOT / "assets" / "audio"
MODEL_SIZE = "small"

# מקור-אמת: זהה ל-WORDS ב-generate-island-07-audio.py / stage-7-chunks.html
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


def strip_niqqud(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not (0x0591 <= ord(c) <= 0x05C7))
    s = re.sub(r"[^א-ת0-9]", "", s)
    return s


def similarity(a: str, b: str) -> float:
    a, b = strip_niqqud(a), strip_niqqud(b)
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    la, lb = len(a), len(b)
    d = list(range(lb + 1))
    for i in range(1, la + 1):
        prev, d[0] = d[0], i
        for j in range(1, lb + 1):
            cur = d[j]
            d[j] = min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] != b[j - 1]))
            prev = cur
    return 1 - d[lb] / max(la, lb)


def build_jobs(slug):
    jobs = []  # (filename, expected_text, kind)
    for s, text, chunks in WORDS:
        if slug and s != slug:
            continue
        jobs.append((f"word-isl07-{s}", text, "word"))
        for i, ch in enumerate(chunks, 1):
            jobs.append((f"chunk-isl07-{s}-{i}", ch, "chunk"))
    return jobs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug")
    args = ap.parse_args()

    jobs = [(fn, exp, k) for (fn, exp, k) in build_jobs(args.slug) if (AUDIO / f"{fn}.mp3").exists()]
    if not jobs:
        print("אין קבצים לבדיקה (הריצו קודם generate-island-07-audio.py).")
        sys.exit(1)

    print(f"טוען Whisper ({MODEL_SIZE})...")
    model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")

    fails = []
    for fn, expected, kind in jobs:
        f = AUDIO / f"{fn}.mp3"
        segs, _ = model.transcribe(str(f), language="he", beam_size=1)
        heard = "".join(s.text for s in segs).strip()
        sim = similarity(expected, heard)
        exp_sk, heard_sk = strip_niqqud(expected), strip_niqqud(heard)
        # סף: מילה=0.6; צ׳אנק=התאמת עיצור-ראשון או הכלה (הברה בודדת קשה ל-Whisper)
        if kind == "word":
            ok = sim >= 0.6
        else:
            ok = (exp_sk and (exp_sk in heard_sk or heard_sk in exp_sk
                              or (heard_sk and exp_sk[0] == heard_sk[0]))) or sim >= 0.5
        mark = "OK  " if ok else "FAIL"
        print(f"  {mark} {fn:26s} exp «{expected}»  heard «{heard}»  sim={sim:.2f}")
        if not ok:
            fails.append((fn, expected, heard, sim))

    print(f"\n✓ {len(jobs)-len(fails)}/{len(jobs)} עברו")
    if fails:
        print("\n🔴 לבדיקה ידנית / הקלטה מחדש:")
        for fn, e, h, s in fails:
            print(f"  {fn}: exp «{e}» heard «{h}» ({s:.2f})")


if __name__ == "__main__":
    main()
