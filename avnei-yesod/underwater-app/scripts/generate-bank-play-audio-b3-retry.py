#!/usr/bin/env python3
"""generate-bank-play-audio-b3-retry.py — סבב-תיקון ל-4 הקליפים שנפסלו ב-B3.

נפסלו: bank-s-yeshein-1 (וּבַסַּל→"ובשל", תַּפּוּחַ→"תפוחה") ·
bank-s-yeshein-2 (הַשֻּׁלְחָן→"השוכן") · bank-o-yesh-chalav ("יש חלה") ·
bank-o-ein-tik ("אנטיק").

תיקונים: כתיב מלא (שׁוּלְחָן — הטריק של הִיבְהִיל מ-B2), ניסוח חלופי למשפט
הסל ("וּבְתוֹךְ הַסַּל"), סימני קריאה. ה-initial_prompt כולל את כל היעדים
שווה-בשווה. אם וריאנט עם ניסוח שונה מנצח — חובה ליישר stem_he בבנק +
WORD_AUDIO בנגן (נעשה ידנית אחרי הריצה).
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
TRIES.mkdir(parents=True, exist_ok=True)

WHISPER_PROMPT = ("משפטים בעברית: הנה סל ובתוך הסל תפוח, על השולחן יש מיץ ואין חלב, "
                  "יש חלב, אין תיק, יש תיק, אין חלה.")


def norm(s):
    s = re.sub(r"[֑-ׇ]", "", s or "")
    s = re.sub(r"[^א-ת]", "", s)
    return s


def ok(*accepted):
    acc = {norm(a) for a in accepted}
    return lambda h: h in acc


TARGETS = [
    ("bank-s-yeshein-1",
     ["הִנֵּה סַל, וּבְתוֹךְ הַסַּל תַּפּוּחַ.",
      "הִנֵּה סַל! בְּתוֹךְ הַסַּל תַּפּוּחַ.",
      "הִנֵּה סַל. בַּסַּל תַּפּוּחַ אֶחָד."],
     ok("הנה סל ובתוך הסל תפוח", "הנה סל בתוך הסל תפוח", "הנה סל בסל תפוח אחד")),
    ("bank-s-yeshein-2",
     ["עַל הַשּׁוּלְחָן יֵשׁ מִיץ, וְאֵין חָלָב.",
      "עַל הַשּׁוּלְחָן יֵשׁ מִיץ. וְאֵין חָלָב!"],
     ok("על השולחן יש מיץ ואין חלב", "על השלחן יש מיץ ואין חלב")),
    ("bank-o-yesh-chalav",
     ["יֵשׁ חָלָב!", "יֵשׁ חָלָב", "יֵשׁ חָלָב."],
     ok("יש חלב")),
    ("bank-o-ein-tik",
     ["אֵין תִּיק!", "אֵין תִּיק", "אֵין תִּיק."],
     ok("אין תיק")),
]


def synth(text, out):
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


print("synthesizing retry variants...")
for key, variants, _ in TARGETS:
    for i, text in enumerate(variants):
        p = TRIES / f"{key}-r{i}.mp3"
        if not p.exists():
            synth(text, p)
            print(f"  synth {key}-r{i} «{text}»")

print("loading whisper (small)...")
import whisper
model = whisper.load_model("small")

rows = []
winners = {}
for key, variants, check in TARGETS:
    for i, text in enumerate(variants):
        if key in winners:
            break
        p = TRIES / f"{key}-r{i}.mp3"
        r = model.transcribe(str(p), language="he", fp16=False,
                             initial_prompt=WHISPER_PROMPT)
        heard = (r.get("text") or "").strip()
        passed = bool(check(norm(heard)))
        rows.append({"key": key, "variant": f"r{i}", "text": text,
                     "heard": heard, "pass": passed})
        print(f"  [{key}-r{i}] «{text}» → «{heard}» {'✅' if passed else '❌'}")
        if passed:
            winners[key] = (p, text)

for key, (src, text) in winners.items():
    shutil.copyfile(src, OUT / f"{key}.mp3")
    print(f"✅ {key}.mp3 ← «{text}»")

missing = [k for k, _, _ in TARGETS if k not in winners]
if missing:
    print("❌ עדיין נפסלים:", ", ".join(missing))

report = Path(__file__).parent / "bank-play-audio-b3-retry-report.json"
report.write_text(json.dumps({"winners": {k: t for k, (_, t) in winners.items()},
                              "missing": missing, "tries": rows},
                             ensure_ascii=False, indent=2), encoding="utf-8")
print("done →", report.name)
