#!/usr/bin/env python3
"""
qa-pronunciation-sweep.py — סריקת-הגייה מלאה: מתמלל את כל קליפי האודיו ב-Whisper
ומשווה לטקסט-היעד (audio-manifest.json), כדי לאתר טעויות-הגייה בקול נוני.

הסוכן לא שומע — תמלול הוא הדרך היחידה לאמת (reference-noni-voice-elevenlabs).
Whisper בעברית לא מושלם → זהו כלי-סינון (מצמצם ל"חשודים"), לא אמת מוחלטת.

שימוש:
    PYTHONIOENCODING=utf-8 python qa-pronunciation-sweep.py            # כל הקליפים
    PYTHONIOENCODING=utf-8 python qa-pronunciation-sweep.py f1.mp3 ..  # קבצים מסוימים

פלט: admin/qa-transcriptions.json  → {key: {heard, intended?, sim?, suspect?}}
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

from faster_whisper import WhisperModel

APP = Path(__file__).parent.parent
AUDIO = APP / "assets" / "audio"
ADMIN = APP.parent.parent / "admin"
MANIFEST = ADMIN / "audio-manifest.json"
OUT = ADMIN / "qa-transcriptions.json"

MODEL_SIZE = "small"  # איזון מהירות/דיוק; אפשר "medium" לדיוק גבוה (איטי)


def strip_niqqud(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not (0x0591 <= ord(c) <= 0x05C7))  # טעמים+ניקוד
    s = re.sub(r"[^א-ת0-9]", "", s)  # רק אותיות/ספרות
    return s


def similarity(a: str, b: str) -> float:
    a, b = strip_niqqud(a), strip_niqqud(b)
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    # Levenshtein ratio
    la, lb = len(a), len(b)
    d = list(range(lb + 1))
    for i in range(1, la + 1):
        prev, d[0] = d[0], i
        for j in range(1, lb + 1):
            cur = d[j]
            d[j] = min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] != b[j - 1]))
            prev = cur
    return 1 - d[lb] / max(la, lb)


def collect_files(args):
    if args:
        return [AUDIO / a for a in args]
    files = []
    for p in sorted(AUDIO.rglob("*.mp3")):
        if "_old-hila" in str(p) or "hila-backup" in str(p):
            continue
        files.append(p)
    return files


def main():
    manifest = {}
    if MANIFEST.exists():
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    files = collect_files(sys.argv[1:])
    print(f"loading faster-whisper ({MODEL_SIZE})...", flush=True)
    model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")

    results = {}
    n = len(files)
    for i, f in enumerate(files, 1):
        key = f.stem
        try:
            segs, _ = model.transcribe(str(f), language="he", beam_size=1)
            heard = "".join(s.text for s in segs).strip()
        except Exception as e:
            heard = ""
            print(f"[{i}/{n}] ERR {key}: {e}", flush=True)
        rec = {"heard": heard}
        intended = manifest.get(key)
        if intended:
            sim = round(similarity(intended, heard), 2)
            rec["intended"] = intended
            rec["sim"] = sim
            rec["suspect"] = sim < 0.6 or not strip_niqqud(heard)
        else:
            rec["suspect"] = not strip_niqqud(heard)  # ריק/לא-עברי = חשוד
        results[key] = rec
        if i % 25 == 0 or i == n:
            print(f"[{i}/{n}] {key}: '{heard}'" + (f" (sim={rec.get('sim')})" if "sim" in rec else ""), flush=True)

    payload = {
        "model": MODEL_SIZE,
        "checked": n,
        "with_intended": sum(1 for r in results.values() if "intended" in r),
        "suspects": sum(1 for r in results.values() if r.get("suspect")),
        "results": results,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n✓ {OUT} — {n} clips · {payload['suspects']} suspects · {payload['with_intended']} with intended-text")


if __name__ == "__main__":
    main()
