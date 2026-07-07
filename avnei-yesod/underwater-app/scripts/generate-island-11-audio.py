#!/usr/bin/env python3
"""generate-island-11-audio.py — אודיו לאי 11 · מילות יחס/מקום ("מִפְרַץ הַגֶּשְׁרוֹנִים").

שלושה חלקים, כולם בקול נוני (ElevenLabs eleven_v3, voice ZI6I4a3UGgs1DXxqWjBV):
  א. מילות-יחס בודדות (w-isl11-*)  — משחקון 2, אפשרויות two-tap. נקודה בסוף
     מייצבת הגייה (דפוס B3). QA קשיח: Whisper → התאמת-עיצורים מדויקת.
  ב. משפטי-מיקום (s-isl11-*)       — משחקון 1, ה-stem. QA קשיח: רצף-עיצורים
     של המשפט (עם וריאנטי-הומופון).
  ג. נרטיב נוני (intro/missions/completion) — QA רך: חובה מילות-מפתח.

ניקוד מלא · לשון רבים · בלי "יופי" (מצוין/מעולה) · נוּנִי בשורוק.
הרצה: PYTHONIOENCODING=utf-8 python generate-island-11-audio.py
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
TRIES = Path(__file__).parent / "_isl11_tries"
OUT.mkdir(parents=True, exist_ok=True)
TRIES.mkdir(parents=True, exist_ok=True)

WHISPER_PROMPT = ("מילים ומשפטים בעברית לכיתה א': על, מתחת, ליד, בתוך, "
                  "הדג על הגשר, הדג מתחת לגשר, הדג ליד הגשר, הדג בתוך המערה.")

# מקפל אותיות-סופיות לרגילות + מסיר ניקוד/לא-עברית — כדי ש"בתוך"/"בתוכ" ישתוו.
_FINALS = {"ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ"}


def norm(s):
    s = re.sub(r"[֑-ׇ]", "", s or "")
    s = re.sub(r"[^א-ת]", "", s)
    return "".join(_FINALS.get(c, c) for c in s)


def ok(*accepted):
    acc = {norm(a) for a in accepted}
    return lambda h: h in acc


# ── חלק א: מילות-יחס בודדות (משחקון 2) ──
WORDS = [
    ("w-isl11-al",       ["עַל.", "עַל!"],           ok("על")),
    ("w-isl11-mitachat", ["מִתַּחַת.", "מִתַּחַת!"],    ok("מתחת")),
    ("w-isl11-leyad",    ["לְיַד.", "לְיַד!"],         ok("ליד")),
    ("w-isl11-betoch",   ["בְּתוֹךְ.", "בְּתוֹךְ!"],     ok("בתוך")),
]

# ── חלק ב: משפטי-מיקום (משחקון 1, stems) ──
SENTENCES = [
    ("s-isl11-dag-al-gesher",       ["הַדָּג עַל הַגֶּשֶׁר."],
     ok("הדגעלהגשר")),
    ("s-isl11-dag-mitachat-gesher", ["הַדָּג מִתַּחַת לַגֶּשֶׁר."],
     ok("הדגמתחתלגשר")),
    ("s-isl11-dag-leyad-gesher",    ["הַדָּג לְיַד הַגֶּשֶׁר."],
     ok("הדגלידהגשר")),
    ("s-isl11-dag-betoch-meara",    ["הַדָּג בְּתוֹךְ הַמְּעָרָה."],
     ok("הדגבתוךהמערה", "הדגבתוכהמערה", "הדגבתוךהמארה")),
    ("s-isl11-dag-al-meara",        ["הַדָּג עַל הַמְּעָרָה."],
     ok("הדגעלהמערה", "הדגעלהמארה")),
]

TARGETS = WORDS + SENTENCES

# ── חלק ג: נרטיב נוני ──
NARRATION = {
    'intro-isl11': (
        "מִפְרַץ הַגֶּשְׁרוֹנִים. "
        "בַּמִּפְרָץ שֶׁל נוּנִי יֵשׁ גֶּשְׁרוֹנֵי אֶבֶן וּמְעָרוֹת, "
        "וְהַחֲבֵרִים אוֹהֲבִים לְשַׂחֵק מַחְבּוֹאִים. "
        "אֵיךְ נֹאמַר לְנוּנִי אֵיפֹה כֹּל אֶחָד מִתְחַבֵּא? "
        "עִם הַמִּלִּים הַקְּטַנּוֹת: עַל, מִתַּחַת, לְיַד, בְּתוֹךְ. "
        "בּוֹאוּ נְשַׂחֵק!"
    ),
    'mission-isl11-where': (
        "נוּנִי אוֹמֶרֶת אֵיפֹה מִתְחַבֵּא הַדָּג. "
        "הַקְשִׁיבוּ טוֹב — וּבַחֲרוּ אֶת הַתְּמוּנָה הַמַּתְאִימָה."
    ),
    'mission-isl11-missing': (
        "בְּכֹל תְּמוּנָה חֲסֵרָה מִלָּה קְטַנָּה. "
        "הַאֲזִינוּ לָאֶפְשָׁרֻיּוֹת — וּבַחֲרוּ אֵיזוֹ מִלָּה מַתְאִימָה."
    ),
    'completion-isl11': (
        "מְצֻיָּן! "
        "מְצָאתֶם כֹּל דָּג בַּשּׁוֹנִית, בְּעֶזְרַת הַמִּלִּים הַקְּטַנּוֹת. "
        "מְעֻלֶּה!"
    ),
}
NARRATION_MUST = {
    # 'גשרונים' מושמט לעיתים ע"י Whisper-small (מפיל את ה-ר בצרור) — אומת ידנית
    # ב-medium ("מפרץ הגשרונים... גשרוני אבן ומערות"); QA רך על מילות-מפתח יציבות.
    'intro-isl11': ["מפרץ", "מילים", "קטנות"],
    'mission-isl11-where': ["הקשיבו", "תמונה"],
    'mission-isl11-missing': ["מילה", "האזינו"],
    'completion-isl11': ["מעולה"],
}


def synth(text, out):
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


print("=== חלק א+ב: מילים+משפטים — synthesizing variants...")
for key, variants, _ in TARGETS:
    if (OUT / f"{key}.mp3").exists():
        print(f"  skip  {key} (כבר קיים)")
        continue
    for i, text in enumerate(variants):
        p = TRIES / f"{key}-v{i}.mp3"
        if not p.exists():
            synth(text, p)
            print(f"  synth {key}-v{i} «{text}»")

print("=== חלק ג: נרטיב — synthesizing...")
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
        winners[key] = None
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
        print(f"  [{key}-v{i}] «{text}» → «{heard}» ({norm(heard)}) {'OK' if passed else 'X'}")
        if passed:
            winners[key] = p

for key, src in winners.items():
    if src is None:
        continue
    shutil.copyfile(src, OUT / f"{key}.mp3")
    print(f"OK {key}.mp3")

missing = [k for k, _, _ in TARGETS if k not in winners or (winners.get(k) is None and not (OUT / f"{k}.mp3").exists())]

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
    print(f"  [{key}] → «{heard}» {'OK' if passed else 'X'}")
    if passed:
        shutil.copyfile(p, OUT / f"{key}.mp3")
        print(f"OK {key}.mp3")
    else:
        narration_fail.append(key)

if missing:
    print("X targets שלא עברו QA:", ", ".join(missing))
if narration_fail:
    print("X נרטיב שלא עבר QA:", ", ".join(narration_fail))

report = Path(__file__).parent / "island-11-audio-report.json"
report.write_text(json.dumps({
    "winners": sorted(k for k in winners),
    "missing": missing,
    "narration_fail": narration_fail,
    "target_tries": rows,
    "narration": narration_rows,
}, ensure_ascii=False, indent=2), encoding="utf-8")
print("done ->", report.name)
if missing or narration_fail:
    sys.exit(1)
