# -*- coding: utf-8 -*-
"""
build-audio-manifest-words.py — משלים ל-build-audio-manifest.js (הליבה הפונטית).
מחלץ טקסט-יעד גם ל**מילים ולנרטיב** (~700 קליפים בלי יעד) מתוך:
  1. סקריפטי ה-generate (זוגות "stem","text" בטאפלים/מילונים)
  2. קבצי ה-JSON של הפסקאות/המילים (item_id/q_id/id → passage_text/question_text/…)

בטיחות: כל זוג מסונן מול שמות-הקבצים האמיתיים — טוקן שאינו קליף אמיתי נזרק.
פלט: admin/audio-manifest-words.json  → {stem: intended_text}
הרצה: PYTHONIOENCODING=utf-8 python build-audio-manifest-words.py
"""
import json, os, re, io, sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)                      # underwater-app
AUDIO = os.path.join(APP, "assets", "audio")
DATA = os.path.join(APP, "data")
ADMIN = os.path.join(os.path.dirname(os.path.dirname(APP)), "admin")
CORE_MANIFEST = os.path.join(ADMIN, "audio-manifest.json")
OUT = os.path.join(ADMIN, "audio-manifest-words.json")

HEB = re.compile(r"[א-ת]")

# --- 1. real audio stems (skip old-hila) ---
stems = set()
for root, _, fns in os.walk(AUDIO):
    if "_old-hila" in root or "hila-backup" in root:
        continue
    for fn in fns:
        if fn.lower().endswith(".mp3"):
            stems.add(fn[:-4])

# stems already covered by the phonetic-core manifest — don't override those
core = {}
if os.path.exists(CORE_MANIFEST):
    core = json.load(open(CORE_MANIFEST, encoding="utf-8"))

manifest = {}   # stem -> text

def offer(stem, text):
    if not stem or stem in core:              # core wins
        return
    if stem not in stems:                     # not a real clip -> ignore (safety filter)
        return
    text = (text or "").strip()
    if not HEB.search(text):                  # must contain Hebrew
        return
    # first non-empty wins; prefer longer if we already have a very short one
    prev = manifest.get(stem)
    if prev is None or (len(text) > len(prev) and prev in text is False):
        manifest.setdefault(stem, text)

# --- 2. scrape generate scripts ---
STEM = r"[a-zA-Z][a-zA-Z0-9_\-]{2,}"
TXT = r"[^'\"]*[א-ת][^'\"]*"
# P1  ("stem", "text"   |   "stem": "text"
P1 = re.compile(r"""['"](%s)['"]\s*[,:]\s*['"](%s)['"]""" % (STEM, TXT))
# P2  ("text", "stem")   — reversed order (island-21 SENTENCES)
P2 = re.compile(r"""['"](%s)['"]\s*,\s*['"](%s)['"]""" % (TXT, STEM))
# P3  "stem": ( "text"   — dict key → tuple whose first element is the text (island-06)
P3 = re.compile(r"""['"](%s)['"]\s*:\s*\(\s*['"](%s)['"]""" % (STEM, TXT))
# P4  "stem", [ "text"   — text wrapped in a list (bank-play-audio-b3)
P4 = re.compile(r"""['"](%s)['"]\s*,\s*\[\s*['"](%s)['"]""" % (STEM, TXT))
for fn in os.listdir(HERE):
    if not fn.endswith(".py"):
        continue
    try:
        src = open(os.path.join(HERE, fn), encoding="utf-8").read()
    except Exception:
        continue
    for m in P1.finditer(src):
        offer(m.group(1), m.group(2))
    for m in P2.finditer(src):
        offer(m.group(2), m.group(1))   # stem is group2, text is group1
    for m in P3.finditer(src):
        offer(m.group(1), m.group(2))
    for m in P4.finditer(src):
        offer(m.group(1), m.group(2))

# --- 3. parse JSON data files (passages / words / items) ---
ID_FIELDS = ("item_id", "q_id", "id", "key", "file", "audio", "audio_key", "clip")
TEXT_FIELDS = ("passage_text", "question_text", "text", "text_he", "prompt",
               "prompt_he", "display", "display_he", "word", "sentence", "he")

def walk_json(obj):
    if isinstance(obj, dict):
        ids = [str(obj[f]) for f in ID_FIELDS if isinstance(obj.get(f), str)]
        txts = [obj[f] for f in TEXT_FIELDS if isinstance(obj.get(f), str) and HEB.search(obj[f])]
        for i in ids:
            base = i[:-4] if i.endswith(".mp3") else i
            for t in txts:
                offer(base, t)
                offer("word-" + base, t)   # island-05: filename = word-<key>
                offer("sound-" + base, t)
        for v in obj.values():
            walk_json(v)
    elif isinstance(obj, list):
        for v in obj:
            walk_json(v)

for root, _, fns in os.walk(DATA):
    for fn in fns:
        if fn.endswith(".json"):
            try:
                walk_json(json.load(open(os.path.join(root, fn), encoding="utf-8")))
            except Exception:
                pass

json.dump(manifest, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# --- report ---
need = [s for s in stems if s not in core]
covered = [s for s in need if s in manifest]
print(f"✓ {OUT}")
print(f"  קליפים ללא יעד-ליבה: {len(need)}")
print(f"  קיבלו טקסט-יעד עכשיו: {len(covered)}")
print(f"  עדיין ללא יעד: {len(need) - len(covered)}")
still = sorted(set(need) - set(manifest))
from collections import Counter
c = Counter(s.split("-")[0] for s in still)
print("  נותרו לפי קידומת:", dict(c.most_common(15)))
