#!/usr/bin/env python3
"""generate-bank-play-audio-b3.py — אודיו ל-9 השאלות החדשות (jan-w1-d4 + apr-w3-d3-c1).

סבב B3 (4.7.2026, אושר פדגוגית ע"י מיטל): שני הימים שנשארו "חסר" אחרי B1 —
'"מה יוצא דופן?" + יש/אין' (ינואר) ו'שמות תואר + עַל' (אפריל).

19 קליפים:
  7 מילים בודדות ליוצא-דופן בהאזנה (אריחי-שמע two-tap): דָּג סַל חָלָב מִיץ
    יָד רַגְלַיִם מִכְנָסַיִם (פִּיל כבר קיים).
  3 משפטי-סיפור (stems של יש/אין).
  9 צירופי יֵשׁ/אֵין (אפשרויות-שמע — הילד שומע ובוחר, לא קורא צירה בינואר).

שיטה כמו B2: וריאנטי-איות פר יעד → Whisper (small) → הראשון שעובר מועתק
לשם הסופי. הרצה: PYTHONIOENCODING=utf-8 python generate-bank-play-audio-b3.py
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
TRIES = Path(__file__).parent / "_b3_tries"
OUT.mkdir(parents=True, exist_ok=True)
TRIES.mkdir(parents=True, exist_ok=True)

WHISPER_PROMPT = ("מילים ומשפטים בעברית: דג, סל, חלב, מיץ, יד, רגליים, מכנסיים, "
                  "יש תפוח בסל, אין חלב, אין בננה בתיק, דני חיפש בתיק.")


def norm(s):
    s = re.sub(r"[֑-ׇ]", "", s or "")
    s = re.sub(r"[^א-ת]", "", s)
    return s


def ok(*accepted):
    acc = {norm(a) for a in accepted}
    return lambda h: h in acc


# (key, וריאנטים, בדיקת-קבלה) — הווריאנט הראשון = הנוסח הקנוני מהבנק
TARGETS = [
    # --- מילים ליוצא-דופן (c1) ---
    ("bank-w-dag",         ["דָּג.", "דָּג!"],                 ok("דג")),
    ("bank-w-sal",         ["סַל.", "סַל!"],                   ok("סל")),
    ("bank-w-chalav",      ["חָלָב.", "חָלָב"],                ok("חלב")),
    ("bank-w-mitz",        ["מִיץ.", "מִיץ!"],                 ok("מיץ", "מיצ")),
    ("bank-w-yad",         ["יָד.", "יָד!"],                   ok("יד")),
    ("bank-w-raglayim",    ["רַגְלַיִם.", "רַגְלַיִים."],       ok("רגלים", "רגליים")),
    ("bank-w-michnasayim", ["מִכְנָסַיִם.", "מִכְנָסַיִים."],   ok("מכנסים", "מכנסיים")),
    # --- משפטי-סיפור יש/אין (stems, c2) ---
    ("bank-s-yeshein-1", ["הִנֵּה סַל, וּבַסַּל תַּפּוּחַ."],
     ok("הנהסלובסלתפוח")),
    ("bank-s-yeshein-2", ["עַל הַשֻּׁלְחָן יֵשׁ מִיץ, וְאֵין חָלָב."],
     ok("עלהשלחןישמיץואיןחלב", "עלהשולחןישמיץואיןחלב")),
    ("bank-s-yeshein-3", ["דָּנִי חִפֵּשׂ בַּתִּיק וְלֹא מָצָא בָּנָנָה."],
     ok("דניחיפשבתיקולאמצאבננה", "דניחפשבתיקולאמצאבננה")),
    # --- אפשרויות יש/אין (c2) ---
    ("bank-o-yesh-tapuach-basal", ["יֵשׁ תַּפּוּחַ בַּסַּל."], ok("ישתפוחבסל")),
    ("bank-o-ein-tapuach-basal",  ["אֵין תַּפּוּחַ בַּסַּל."], ok("איןתפוחבסל")),
    ("bank-o-yesh-pil-basal",     ["יֵשׁ פִּיל בַּסַּל."],     ok("ישפילבסל")),
    ("bank-o-ein-chalav",         ["אֵין חָלָב."],             ok("איןחלב")),
    ("bank-o-yesh-chalav",        ["יֵשׁ חָלָב."],             ok("ישחלב")),
    ("bank-o-ein-mitz",           ["אֵין מִיץ."],              ok("איןמיץ", "איןמיצ")),
    ("bank-o-ein-banana-batik",   ["אֵין בָּנָנָה בַּתִּיק."], ok("איןבננהבתיק")),
    ("bank-o-yesh-banana-batik",  ["יֵשׁ בָּנָנָה בַּתִּיק."], ok("ישבננהבתיק")),
    ("bank-o-ein-tik",            ["אֵין תִּיק."],             ok("איןתיק")),
]


def synth(text, out):
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


print("synthesizing variants...")
for key, variants, _ in TARGETS:
    for i, text in enumerate(variants):
        p = TRIES / f"{key}-v{i}.mp3"
        if not p.exists():
            synth(text, p)
            print(f"  synth {key}-v{i} «{text}»")
        else:
            print(f"  skip  {key}-v{i} (קיים)")

print("loading whisper (small)...")
import whisper
model = whisper.load_model("small")

rows = []
winners = {}
for key, variants, check in TARGETS:
    for i, text in enumerate(variants):
        if key in winners:
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
    shutil.copyfile(src, OUT / f"{key}.mp3")
    print(f"✅ {key}.mp3")

missing = [k for k, _, _ in TARGETS if k not in winners]
if missing:
    print("❌ לא עברו QA:", ", ".join(missing))

report = Path(__file__).parent / "bank-play-audio-b3-report.json"
report.write_text(json.dumps({"winners": sorted(winners), "missing": missing,
                              "tries": rows}, ensure_ascii=False, indent=2),
                  encoding="utf-8")
print("done →", report.name)
