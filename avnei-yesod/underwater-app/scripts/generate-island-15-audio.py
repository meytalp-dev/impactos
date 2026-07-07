#!/usr/bin/env python3
"""generate-island-15-audio.py — אודיו לאי 15 · הבנת משפט כתוב ("מִפְרַץ הַתְּמוּנוֹת").

אי 15 מבוסס-קריאה: הילד.ה קורא.ת את המשפט לבד — ולכן **אין הקראת-משפט**.
האודיו כאן הוא רק:
  א. נרטיב נוני (intro/missions/completion) — QA רך: חובה מילות-מפתח.
  ב. שאלות סוג-(ב) (q-isl15-*) — רמקול-עזרה ליד השאלה, ידני. QA קשיח: רצף-
     עיצורים של השאלה (בלי המשפט). אלה השאלות בלבד — לא המשפטים.

כולם בקול נוני (ElevenLabs eleven_v3, voice ZI6I4a3UGgs1DXxqWjBV).
ניקוד מלא · לשון רבים · בלי "יופי" (מצוין/מעולה) · נוּנִי בשורוק.
הרצה: PYTHONIOENCODING=utf-8 python generate-island-15-audio.py
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
TRIES = Path(__file__).parent / "_isl15_tries"
OUT.mkdir(parents=True, exist_ok=True)
TRIES.mkdir(parents=True, exist_ok=True)

WHISPER_PROMPT = ("שאלות קצרות בעברית לכיתה א': מי במים, מי אכל את התפוח, "
                  "מה עשתה מיה, איפה ישן הכלב, מה אכל הילד, איפה חי הלוויתן.")

_FINALS = {"ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ"}


def norm(s):
    s = re.sub(r"[֑-ׇ]", "", s or "")
    s = re.sub(r"[^א-ת]", "", s)
    return "".join(_FINALS.get(c, c) for c in s)


def ok(*accepted):
    acc = {norm(a) for a in accepted}
    return lambda h: h in acc


# ── חלק ב: שאלות סוג-(ב) (רמקול-עזרה) — המפתחות תואמים ל-island15-game.js ──
QUESTIONS = [
    ("q-isl15-mi-bamayim",    ["מִי בַּמַּיִם?"],              ok("מיבמים")),
    # תפוח/תפוחה = הבחנת-סיומת שאינה נשמעת בהקלטה (Whisper מוסיף ה'); האודיו אומר
    # "תַּפּוּחַ" נכון — מקבלים גם את הווריאנט המתומלל.
    ("q-isl15-mi-achal",      ["מִי אָכַל אֶת הַתַּפּוּחַ?"],   ok("מיאכלאתהתפוח", "מיאכלאתהתפוחה")),
    ("q-isl15-ma-asta",       ["מָה עָשְׂתָה מַיָּה?"],         ok("מהעשתהמיה")),
    ("q-isl15-eifo-yashan",   ["אֵיפֹה יָשַׁן הַכֶּלֶב?"],      ok("איפהישנהכלב")),
    ("q-isl15-ma-achal-yeled", ["מָה אָכַל הַיֶּלֶד?"],         ok("מהאכלהילד")),
    # לויתן/לוויתן = כתיב-מלא בלבד (וו כפול); אותה הגייה. מקבלים את שני הכתיבים.
    ("q-isl15-eifo-chai",     ["אֵיפֹה חַי הַלִּוְיָתָן?"],     ok("איפהחיהלויתן", "איפהחיהלוויתנ", "איפהחיהליביתן")),
]

# ── חלק א: נרטיב נוני ──
NARRATION = {
    'intro-isl15': (
        "מִפְרַץ הַתְּמוּנוֹת. "
        "הַזֶּרֶם עִרְבֵּב אֶת הַתְּמוּנוֹת בַּמִּפְרָץ, וְעַכְשָׁו הַכֹּל מְבֻלְבָּל! "
        "אֲבָל לְיַד כֹּל תְּמוּנָה יֵשׁ מִשְׁפָּט קָטָן שֶׁמְּסַפֵּר מָה קוֹרֶה בָּהּ. "
        "אִם נִקְרָא אֶת הַמִּשְׁפָּט לְבַד — נֵדַע אֵיזוֹ תְּמוּנָה מַתְאִימָה. "
        "בּוֹאוּ נַעֲזֹר לְנוּנִי לְסַדֵּר אֶת הַמִּפְרָץ!"
    ),
    'mission-isl15-image': (
        "קִרְאוּ אֶת הַמִּשְׁפָּט בְּעַצְמְכֶם, בְּשֶׁקֶט — "
        "וּבַחֲרוּ אֶת הַתְּמוּנָה הַמַּתְאִימָה מִבֵּין שָׁלוֹשׁ."
    ),
    'mission-isl15-question': (
        "קִרְאוּ אֶת הַמִּשְׁפָּט בְּעַצְמְכֶם. הוּא נִשְׁאָר עַל הַמָּסָךְ — "
        "וְעַכְשָׁו עֲנוּ עַל הַשְּׁאֵלָה."
    ),
    'completion-isl15': (
        "מְצֻיָּן! "
        "קְרָאתֶם אֶת הַמִּשְׁפָּטִים לְבַד, וְהֵבַנְתֶּם כֹּל אֶחָד. "
        "מְעֻלֶּה!"
    ),
}
NARRATION_MUST = {
    'intro-isl15': ["מפרץ", "תמונה", "משפט"],
    'mission-isl15-image': ["קראו", "תמונה"],
    'mission-isl15-question': ["קראו", "שאלה"],
    'completion-isl15': ["מעולה"],
}


def synth(text, out):
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


print("=== חלק ב: שאלות — synthesizing variants...")
for key, variants, _ in QUESTIONS:
    if (OUT / f"{key}.mp3").exists():
        print(f"  skip  {key} (כבר קיים)")
        continue
    for i, text in enumerate(variants):
        p = TRIES / f"{key}-v{i}.mp3"
        if not p.exists():
            synth(text, p)
            print(f"  synth {key}-v{i} «{text}»")

print("=== חלק א: נרטיב — synthesizing...")
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
for key, variants, check in QUESTIONS:
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

missing = [k for k, _, _ in QUESTIONS if k not in winners or (winners.get(k) is None and not (OUT / f"{k}.mp3").exists())]

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
    print("X שאלות שלא עברו QA:", ", ".join(missing))
if narration_fail:
    print("X נרטיב שלא עבר QA:", ", ".join(narration_fail))

report = Path(__file__).parent / "island-15-audio-report.json"
report.write_text(json.dumps({
    "winners": sorted(k for k in winners),
    "missing": missing,
    "narration_fail": narration_fail,
    "question_tries": rows,
    "narration": narration_rows,
}, ensure_ascii=False, indent=2), encoding="utf-8")
print("done ->", report.name)
if missing or narration_fail:
    sys.exit(1)
