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


RELOAD_EVERY = 120   # טעינה-מחדש של המודל כל N קליפים — משחרר זיכרון (מונע mkl_malloc OOM)
SAVE_EVERY = 20      # שמירה אינקרמנטלית — עמיד להפסקות/OOM, וניתן להמשך


def load_results():
    """טוען תוצאות קיימות (להמשך ריצה שנקטעה)."""
    if OUT.exists():
        try:
            return json.loads(OUT.read_text(encoding="utf-8")).get("results", {})
        except Exception:
            return {}
    return {}


def save(results, model_size, done, total):
    payload = {
        "model": model_size,
        "generatedAt": None,   # מוטבע אחרי סיום (Date לא זמין ב-build; נשאר null)
        "checked": len(results),
        "progress": f"{done}/{total}",
        "with_intended": sum(1 for r in results.values() if "intended" in r),
        "suspects": sum(1 for r in results.values() if r.get("suspect")),
        "results": results,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")


def main():
    manifest = {}
    if MANIFEST.exists():
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    files = collect_files(sys.argv[1:])
    n = len(files)

    results = load_results()
    todo = [f for f in files if f.stem not in results]
    print(f"סה\"כ {n} · כבר תומללו {len(results)} · נותרו {len(todo)}", flush=True)

    print(f"loading faster-whisper ({MODEL_SIZE})...", flush=True)
    model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")

    since_reload = 0
    for i, f in enumerate(todo, 1):
        key = f.stem
        try:
            segs, _ = model.transcribe(str(f), language="he", beam_size=1)
            heard = "".join(s.text for s in segs).strip()
        except Exception as e:
            heard = ""
            print(f"[{i}/{len(todo)}] ERR {key}: {e}", flush=True)
            # OOM? טען מודל מחדש והמשך
            if "malloc" in str(e).lower() or "memory" in str(e).lower():
                try:
                    del model
                    import gc; gc.collect()
                    model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
                    since_reload = 0
                except Exception:
                    pass
        rec = {"heard": heard}
        intended = manifest.get(key)
        if intended:
            rec["intended"] = intended
            rec["sim"] = round(similarity(intended, heard), 2)
            rec["suspect"] = rec["sim"] < 0.6 or not strip_niqqud(heard)
        else:
            rec["suspect"] = not strip_niqqud(heard)
        results[key] = rec

        since_reload += 1
        if i % 25 == 0:
            print(f"[{i}/{len(todo)}] {key}: '{heard}'" + (f" (sim={rec.get('sim')})" if "sim" in rec else ""), flush=True)
        if i % SAVE_EVERY == 0:
            save(results, MODEL_SIZE, len(results), n)
        if since_reload >= RELOAD_EVERY:   # שחרור זיכרון יזום
            del model
            import gc; gc.collect()
            model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
            since_reload = 0

    save(results, MODEL_SIZE, len(results), n)
    suspects = sum(1 for r in results.values() if r.get("suspect"))
    with_int = sum(1 for r in results.values() if "intended" in r)
    print(f"\n✓ {OUT} — {len(results)}/{n} clips · {suspects} suspects · {with_int} with intended-text")


if __name__ == "__main__":
    main()
