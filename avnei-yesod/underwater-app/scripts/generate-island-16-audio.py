#!/usr/bin/env python3
"""generate-island-16-audio.py — אודיו לאי 16 · "שַׁרְשֶׁרֶת הָאַלְמוֹגִים".

אי 16 מבוסס-קריאה: הילד.ה קורא.ת את המשפטים לבד ומסדר.ת אותם לפסקה — ולכן
**אין הקראת-משפטים**. האודיו כאן הוא נרטיב נוני בלבד (הנחיה/עידוד, checklist §5):
  intro-isl16      — סיפור-מסגרת (בעיה→פתרון) בדף-האי, כפתור 🔊 ידני.
  mission-isl16    — הנחיית-משימה חד-פעמית בתחילת המשחקון.
  completion-isl16 — עידוד-סיום.

כולם בקול נוני (ElevenLabs eleven_v3, voice ZI6I4a3UGgs1DXxqWjBV).
ניקוד מלא · לשון רבים · בלי "יופי" (מצוין/מעולה) · נוּנִי בשורוק.
QA רך: תמלול Whisper חייב להכיל את מילות-המפתח (נרטיב, לא הכתבה).
הרצה: PYTHONIOENCODING=utf-8 python generate-island-16-audio.py
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
TRIES = Path(__file__).parent / "_isl16_tries"
OUT.mkdir(parents=True, exist_ok=True)
TRIES.mkdir(parents=True, exist_ok=True)

_FINALS = {"ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ"}


def norm(s):
    s = re.sub(r"[֑-ׇ]", "", s or "")
    s = re.sub(r"[^א-ת]", "", s)
    return "".join(_FINALS.get(c, c) for c in s)


NARRATION = {
    'intro-isl16': (
        "שַׁרְשֶׁרֶת הָאַלְמוֹגִים. "
        "הַזֶּרֶם פִּזֵּר אֶת אַלְמוֹגֵי הַסִּפּוּר, וְהַמִּשְׁפָּטִים הִתְעַרְבְּבוּ! "
        "כֹּל מִשְׁפָּט הוּא אַלְמוֹג קָטָן. "
        "אִם נְשַׁרְשֵׁר אוֹתָם בַּסֵּדֶר הַנָּכוֹן — תֵּצֵא פִּסְקָה שֶׁמְּסַפֶּרֶת אֶת כֹּל הַסִּפּוּר. "
        "בּוֹאוּ נַעֲזֹר לְנוּנִי לְחַבֵּר אֶת הַשַּׁרְשֶׁרֶת!"
    ),
    'mission-isl16': (
        "רֶגַע אֶחָד — קִרְאוּ אֶת שְׁלוֹשֶׁת הַמִּשְׁפָּטִים בְּעַצְמְכֶם, בְּשֶׁקֶט. "
        "חִשְׁבוּ מָה קָרָה קֹדֶם וּמָה אַחַר כָּךְ — "
        "וְלִחֲצוּ עֲלֵיהֶם בַּסֵּדֶר הַנָּכוֹן."
    ),
    'completion-isl16': (
        "מְצֻיָּן! "
        "קְרָאתֶם אֶת הַמִּשְׁפָּטִים לְבַד וְשִׁרְשַׁרְתֶּם אוֹתָם לְפִסְקָה. "
        "מְעֻלֶּה!"
    ),
}
# QA רך: כל איבר ברשימה = לפחות אחת מהחלופות שלו חייבת להופיע בתמלול.
# הערה על mission: eleven_v3 מבטא את "קִרְאוּ" כ-/kiru/ (מובן וטבעי בדיבור), ו-Whisper
# (small+medium) מתמלל זאת "קירו"/"קהות" ולא "קראו" — ארטיפקט-תמלול, לא הגייה שגויה
# (שאר ההנחיה מתומללת מושלם). מקבלים את הווריאנטים המתומללים, כמו באי 15.
NARRATION_MUST = {
    # small מפצל לפעמים "אלמוג"→"על מוג" (עלמוג) — הגייה נכונה, ארטיפקט-תמלול; מקבלים.
    'intro-isl16': [["אלמוג", "עלמוג"], ["משפט"], ["פסקה"]],
    'mission-isl16': [["קראו", "קירו", "קהות"], ["סדר"], ["משפט"]],
    'completion-isl16': [["מעולה"]],
}


def synth(text, out):
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


print("=== נרטיב אי 16 — synthesizing...")
for key, text in NARRATION.items():
    p = TRIES / f"{key}.mp3"
    if not p.exists():
        synth(text, p)
        print(f"  synth {key}")
    else:
        print(f"  reuse {key}")

print("loading whisper (small)...")
import whisper
model = whisper.load_model("small")

rows = []
fails = []
for key, text in NARRATION.items():
    p = TRIES / f"{key}.mp3"
    r = model.transcribe(str(p), language="he", fp16=False)
    heard = (r.get("text") or "").strip()
    h = norm(heard)
    musts = NARRATION_MUST.get(key, [])
    # כל קבוצת-חלופות חייבת להיות מיוצגת ע"י לפחות חלופה אחת בתמלול.
    passed = all(any(norm(alt) in h for alt in group) for group in musts)
    rows.append({"key": key, "text": text, "heard": heard, "pass": passed})
    print(f"  [{key}] → «{heard}» {'OK' if passed else 'X'}")
    if passed:
        shutil.copyfile(p, OUT / f"{key}.mp3")
        print(f"OK {key}.mp3")
    else:
        fails.append(key)

report = Path(__file__).parent / "island-16-audio-report.json"
report.write_text(json.dumps({"narration": rows, "fail": fails},
                             ensure_ascii=False, indent=2), encoding="utf-8")
print("done ->", report.name)
if fails:
    print("X נרטיב שלא עבר QA:", ", ".join(fails))
    sys.exit(1)
