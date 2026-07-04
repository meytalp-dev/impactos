#!/usr/bin/env python3
"""generate-discrimination-audio.py — אודיו למשחקון ההבחנה (stage-discrimination.html).

stems של שאלות ההבחנה (זֹאת הָאוֹת... / אֵיזוֹ אוֹת הִיא...) + מילות הזוגות
המינימליים של שׁ/שׂ (שָׂר, סָר=הומופון, שָׁל, סָב, רָץ, צָר, שְׁתֵּיהֶן).
צלילים מבודדים (/ש/ /ס/) לא מיוצרים כאן — משתמשים ב-sound-*.mp3 המאומתים
מאי 3 דרך 'seq:' בדף. קול נוני — ElevenLabs eleven_v3 (דרך _eleven_tts).
QA: תמלול Whisper לכל קליפ (הסוכן לא שומע — התמלול הוא האימות).

הרצה: PYTHONIOENCODING=utf-8 python generate-discrimination-audio.py
פלט:  ../assets/audio/disc-*.mp3 + discrimination-audio-report.json
"""
import json
import os
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
OUT.mkdir(parents=True, exist_ok=True)

# (key, text, expect) — expect = מה Whisper אמור לשמוע בקירוב (בלי ניקוד);
# מופרד ב-| = חלופות קבילות (הומופונים: שר/סר, שמות-אות)
# 🔴 ממצאי QA (4.7.2026, whisper small לא-מוטה; ראו גם retry-discrimination-audio.py):
#   • שָׂר/כְּמוֹ...שָׂר — מסונתזים מהכתיב "סָר" (הומופון מושלם) כדי להבטיח /s/;
#     TTS מהכתיב שָׂר נשמע /shar/ בתמלול = שובר את כל הפואנטה של שׁ/שׂ.
#   • הֵא (שם האות ה) נהגה שגוי בעקביות → הכתיב הדבור "הֵי" בכל הקליפים.
#   • מילה בודדת שנגמרת ב-ר (סָר/צָר) — eleven_v3 בולע את ה-ר הסופית ברוב
#     הסינתזות (10+ נסיונות). הקבצים שבריפו יוצרו ידנית ואומתו:
#     disc-w-tzar = "צָר. צָר." (פעמיים, v3) → «צאר»; disc-w-sar = "סָר."
#     ב-eleven_multilingual_v2 (אותו voice, speed 0.8) → «שר» (=/sar/ שָׂר).
#     סקריפט זה מדלג על קבצים קיימים — לא לרוץ עליהם מחדש בלי QA חוזר.
ITEMS = [
    # --- מילות שׁ/שׂ (זוג מינימלי) — disc-w-sar משרת גם שָׂר וגם סָר (הומופון) ---
    ("disc-w-sar",      "סָר.",      "סר|שר"),
    ("disc-w-shal",     "שָׁל",       "של|שאל"),
    ("disc-w-sav",      "סָב",       "סב|סף|סבא"),
    ("disc-w-ratz",     "רָץ",       "רץ"),
    ("disc-w-tzar",     "צָר.",      "צר|זר"),
    ("disc-w-shteihen", "שְׁתֵּיהֶן",  "שתיהן"),
    # --- "כְּמוֹ בַּמִּלָּה..." (החצי השני של seq: אחרי sound-shin/samekh) ---
    ("disc-kmo-shar", "כְּמוֹ בַּמִּלָּה שָׁר.", "כמו במילה שר|כמו במילה שאר"),
    ("disc-kmo-sar",  "כְּמוֹ בַּמִּלָּה סָר.", "כמו במילה סר|כמו במילה שר"),
    # --- stems חזותיים: "זֹאת הָאוֹת <שם>" (ספטמבר: ת/ר · ב/כ · ה/ח) ---
    ("disc-stem-zot-tav",  "זֹאת הָאוֹת תָּו",  "זאת האות תו"),
    ("disc-stem-zot-resh", "זֹאת הָאוֹת רֵישׁ", "זאת האות ריש"),
    ("disc-stem-zot-bet",  "זֹאת הָאוֹת בֵּית", "זאת האות בית|זאת האות בת"),
    ("disc-stem-zot-kaf",  "זֹאת הָאוֹת כָּף",  "זאת האות כף|זאת האות קף"),
    ("disc-stem-zot-het",  "זֹאת הָאוֹת חֵית",  "זאת האות חית|זאת האות חת"),
    ("disc-stem-zot-hey",  "זֹאת הָאוֹת הֵי",   "זאת האות הי|זאת האות היי|זאת האות הא"),
    # --- stems אוקטובר: "אֵיזוֹ אוֹת הִיא <שם>?" + pick_odd_one "מִי כָּאן <שם>?" ---
    ("disc-stem-which-dalet", "אֵיזוֹ אוֹת הִיא דָּלֶת?", "איזו אות היא דלת|איזות הידלת"),
    ("disc-stem-which-hey",   "אֵיזוֹ אוֹת הִיא הֵי?",   "איזו אות היא הי|היי|הא"),
    ("disc-stem-which-kaf",   "אֵיזוֹ אוֹת הִיא כָּף?",  "איזו אות היא כף|קף|אוטיקף"),
    ("disc-stem-who-dalet",   "מִי כָּאן דָּלֶת?",       "מי כאן דלת"),
    ("disc-stem-who-hey",     "מִי כָּאן הֵי?",          "מי כאן הי|היי|הא"),
    ("disc-stem-who-kaf",     "מִי כָּאן כָּף?",         "מי כאן כף|קף"),
]


def synth(text, out):
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


for key, text, _ in ITEMS:
    dst = OUT / f"{key}.mp3"
    if dst.exists():
        print(f"  skip  {key:24s} (קיים)")
        continue
    synth(text, dst)
    print(f"  synth {key:24s} «{text}»")

print("loading whisper (small)...")
import whisper  # import כבד — אחרי הסינתזה
model = whisper.load_model("small")
rows = []
for key, text, expect in ITEMS:
    # תמלול לא-מוטה בכוונה (בלי initial_prompt עם הטקסט) — אחרת Whisper מעתיק
    # את הכתיב המצופה וסבב-1 "אישר" שָׂר שנהגה /shar/.
    r = model.transcribe(str(OUT / f"{key}.mp3"), language="he", fp16=False)
    heard = (r.get("text") or "").strip()
    rows.append({"key": key, "text": text, "expect": expect, "heard": heard})
    print(f"  [{key:24s}] «{text}» → «{heard}»")

report = Path(__file__).parent / "discrimination-audio-report.json"
report.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
print("✅ done →", report.name)
