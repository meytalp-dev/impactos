#!/usr/bin/env python3
"""generate-island-08-audio.py — אודיו לאי 8 · מילים שכיחות ("גַּן אַצּוֹת הַמִּלִּים הַקְּטַנּוֹת").

שני חלקים:
  א. stems מהבנק (מילים בודדות + משפטים) שחסר להם MP3 — QA קשיח בשיטת B2/B3:
     וריאנטי-איות פר יעד → Whisper (small) → הווריאנט הראשון שעובר מועתק לשם הסופי.
     המילים הקיימות (bank-w-ani/ata/dag/yad) לא מיוצרות שוב.
  ב. נרטיב נוני לאי (intro/missions/completion) — נוצר תמיד, מתומלל ומדווח
     (QA רך: משפט ארוך לא מושווה תו-בתו; חובה מילות-מפתח).

הרצה: PYTHONIOENCODING=utf-8 python generate-island-08-audio.py
"""
import json
import os
import re
import shutil
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
import _eleven_tts as tts

REPO_ROOT = Path(__file__).parent.parent.parent.parent
load_dotenv(REPO_ROOT / ".env")
client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY", "").strip())
OUT = Path(__file__).parent.parent / "assets" / "audio"
TRIES = Path(__file__).parent / "_isl08_tries"
OUT.mkdir(parents=True, exist_ok=True)
TRIES.mkdir(parents=True, exist_ok=True)

WHISPER_PROMPT = ("מילים ומשפטים בעברית לכיתה א': של, את, כן, לא, שם, בית, דלת, דוד, "
                  "הוא, כלב, הפרח של תמר, תמר לקחה את החלה, תמר אוכלת חלה.")


def norm(s):
    s = re.sub(r"[֑-ׇ]", "", s or "")
    s = re.sub(r"[^א-ת]", "", s)
    return s


def ok(*accepted):
    acc = {norm(a) for a in accepted}
    return lambda h: h in acc


# ── חלק א: stems מהבנק (nov-w3-d1 · nov-w3-d2 · jun-w1-d1 · jun-w3-d1) ──
# מילה בודדת = נקודה בסוף מייצבת את ההגייה (דפוס B3).
TARGETS = [
    ("bank-w-shel",  ["שֶׁל.", "שֶׁל!"],        ok("של")),
    ("bank-w-et",    ["אֶת.", "אֶת!"],          ok("את")),
    ("bank-w-ken",   ["כֵּן.", "כֵּן!"],         ok("כן")),
    ("bank-w-lo",    ["לֹא.", "לֹא!"],           ok("לא")),
    ("bank-w-sham",  ["שָׁם.", "שָׁם!"],         ok("שם")),
    ("bank-w-bayit", ["בַּיִת.", "בַּיִת!"],      ok("בית")),
    ("bank-w-delet", ["דֶּלֶת.", "דֶּלֶת!"],      ok("דלת")),
    ("bank-w-dod",   ["דּוֹד.", "דּוֹד!"],        ok("דוד")),
    ("bank-w-hu",    ["הוּא.", "הוּא!"],          ok("הוא")),
    ("bank-w-kelev", ["כֶּלֶב.", "כֶּלֶב!"],      ok("כלב")),
    # משפטי nov-w3-d2 (stems) + שאלת כן/לא (nov-w3-d1-c3-L3)
    ("bank-s-perach-shel-tamar", ["הַפֶּרַח שֶׁל תָּמָר."],
     ok("הפרחשלתמר")),
    ("bank-s-tamar-et-chala", ["תָּמָר לָקְחָה אֶת הַחַלָּה."],
     ok("תמרלקחהאתהחלה", "תמרלקחהאתהחלא")),
    ("bank-s-tamar-ochelet-q", ["תָּמָר אוֹכֶלֶת חַלָּה. הַאִם תָּמָר יְשֵׁנָה?"],
     ok("תמראוכלתחלההאםתמרישנה", "תמראוכלתחלאהאםתמרישנה")),
]

# ── חלק ב: נרטיב נוני (ניקוד מלא · לשון רבים · בלי "יופי" · נוּנִי בשורוק) ──
NARRATION = {
    'intro-isl08': (
        "גַּן אַצּוֹת הַמִּלִּים הַקְּטַנּוֹת. "
        "בַּגַּן שֶׁל נוּנִי צוֹמְחוֹת אַצּוֹת רַכּוֹת, "
        "וְעַל כֹּל אַצָּה גָּרָה מִלָּה קְטַנָּה: שֶׁל, אֶת, כֵּן, לֹא. "
        "בַּלַּיְלָה עָבַר זֶרֶם חָזָק, וְהַמִּלִּים הַקְּטַנּוֹת עָפוּ מִן הָאַצּוֹת. "
        "בּוֹאוּ נַעֲזֹר לְנוּנִי לְהַחְזִיר כֹּל מִלָּה הַבַּיְתָה!"
    ),
    'mission-isl08-flash': (
        "מִלָּה קְטַנָּה מִתְחַבֵּאת בֵּין הָאַצּוֹת. "
        "הַקְשִׁיבוּ לַמִּלָּה — וְהַקִּישׁוּ עָלֶיהָ מַהֵר!"
    ),
    'mission-isl08-sentence': (
        "נוּנִי אוֹמֶרֶת מִשְׁפָּט קָצָר. "
        "הַקְשִׁיבוּ טוֹב — וּבַחֲרוּ אֶת הַמִּשְׁפָּט שֶׁשְּׁמַעְתֶּם."
    ),
    'mission-isl08-write': (
        "הַמִּלִּים רוֹצוֹת לַחְזֹר לַגַּן. "
        "הַקְשִׁיבוּ לַמִּלָּה — וּבַחֲרוּ אֵיךְ כּוֹתְבִים אוֹתָהּ."
    ),
    'completion-isl08': (
        "אֵיזֶה גַּן נִפְלָא! "
        "כֹּל הַמִּלִּים הַקְּטַנּוֹת חָזְרוּ הַבַּיְתָה. "
        "מְעֻלֶּה!"
    ),
}
# מילות-מפתח שחייבות להישמע בתמלול הנרטיב (QA רך)
NARRATION_MUST = {
    'intro-isl08': ["גן", "מילים", "קטנות"],
    'mission-isl08-flash': ["הקשיבו", "מילה"],
    'mission-isl08-sentence': ["משפט", "הקשיבו"],
    'mission-isl08-write': ["כותבים", "מילה"],
    'completion-isl08': ["מעולה"],
}


def synth(text, out):
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


print("=== חלק א: stems — synthesizing variants...")
for key, variants, _ in TARGETS:
    if (OUT / f"{key}.mp3").exists():
        print(f"  skip  {key} (כבר קיים ב-assets)")
        continue
    for i, text in enumerate(variants):
        p = TRIES / f"{key}-v{i}.mp3"
        if not p.exists():
            synth(text, p)
            print(f"  synth {key}-v{i} «{text}»")

print("=== חלק ב: נרטיב — synthesizing...")
for key, text in NARRATION.items():
    p = TRIES / f"{key}.mp3"
    if not p.exists():
        synth(text, p)
        print(f"  synth {key}")

print("loading whisper (small)...")
import whisper
model = whisper.load_model("small")

rows = []
winners = {}
for key, variants, check in TARGETS:
    if (OUT / f"{key}.mp3").exists():
        winners[key] = None  # קיים — לא נבדק שוב
        continue
    for i, text in enumerate(variants):
        if winners.get(key):
            break
        p = TRIES / f"{key}-v{i}.mp3"
        r = model.transcribe(str(p), language="he", fp16=False,
                             initial_prompt=WHISPER_PROMPT)
        heard = (r.get("text") or "").strip()
        passed = bool(check(norm(heard)))
        rows.append({"key": key, "variant": i, "text": text,
                     "heard": heard, "norm": norm(heard), "pass": passed})
        print(f"  [{key}-v{i}] «{text}» → «{heard}» {'✅' if passed else '❌'}")
        if passed:
            winners[key] = p

for key, src in winners.items():
    if src is None:
        continue
    shutil.copyfile(src, OUT / f"{key}.mp3")
    print(f"✅ {key}.mp3")

missing = [k for k, _, _ in TARGETS if k not in winners]

narration_rows = []
narration_fail = []
for key, text in NARRATION.items():
    p = TRIES / f"{key}.mp3"
    r = model.transcribe(str(p), language="he", fp16=False)
    heard = (r.get("text") or "").strip()
    h = norm(heard)
    musts = NARRATION_MUST.get(key, [])
    passed = all(norm(m) in h for m in musts)
    narration_rows.append({"key": key, "text": text, "heard": heard, "pass": passed})
    print(f"  [{key}] → «{heard}» {'✅' if passed else '❌'}")
    if passed:
        shutil.copyfile(p, OUT / f"{key}.mp3")
        print(f"✅ {key}.mp3")
    else:
        narration_fail.append(key)

if missing:
    print("❌ stems שלא עברו QA:", ", ".join(missing))
if narration_fail:
    print("❌ נרטיב שלא עבר QA:", ", ".join(narration_fail))

report = Path(__file__).parent / "island-08-audio-report.json"
report.write_text(json.dumps({
    "winners": sorted(k for k in winners),
    "missing": missing,
    "narration_fail": narration_fail,
    "stem_tries": rows,
    "narration": narration_rows,
}, ensure_ascii=False, indent=2), encoding="utf-8")
print("done →", report.name)
if missing or narration_fail:
    sys.exit(1)
