#!/usr/bin/env python3
"""generate-boy-check-audio.py — קליפי הקול של המיפוי (מבדק-ילד BOY · boy-check.html).

עד עכשיו לא היה גנרטור מחויב לקליפי המיפוי → כל רה-יצירה גורפת (או עריכה ידנית)
מחקה את הכיוונון של ההגייה, ומיטל שמעה שוב-ושוב מילים לא-נכונות ("שמעתם" בשווא).
הקובץ הזה = מקור-האמת: הטקסטים תואמים ל-say-text שעל המסך, וההגייה עוברת
דרך tts.preprocess → KNOWN_WORD_FIXES (למשל שמעתם→שַׁמַעְתֶּם, פתח מפורש) כך שהתיקון
"נדבק" בכל הרצה עתידית.

קול נוני — ElevenLabs eleven_v3 (דרך _eleven_tts). QA = תמלול Whisper (הסוכן לא שומע).
הרצה:
  PYTHONIOENCODING=utf-8 python generate-boy-check-audio.py                # רק חסרים
  PYTHONIOENCODING=utf-8 python generate-boy-check-audio.py --force        # הכל מחדש
  PYTHONIOENCODING=utf-8 python generate-boy-check-audio.py --only boy-r1-ask,boy-r2-ask --force
פלט:  ../assets/audio/boy-*.mp3 + boy-check-audio-report.json
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

# (key, text, expect) — הטקסט תואם ל-say שעל המסך ב-boy-check.html.
# expect = מה Whisper אמור לשמוע בקירוב (בלי ניקוד) לצורך QA.
ITEMS = [
    ("boy-intro",
     "שָׁלוֹם! אֲנִי נוֹנִי. בֹּאוּ נֵצֵא לְמַסָּע קָטָן בַּשּׁוֹנִית — אַרְבַּע תַּחֲנוֹת, וַאֲנִי אֲלַוֶּה אֶתְכֶם בְּכָל אַחַת.",
     "שלום אני נוני בואו נצא למסע קטן בשונית ארבע תחנות ואני אלווה אתכם בכל אחת"),
    ("boy-r1-ask",
     "לַחֲצוּ עַל הָאוֹת שֶׁשְּׁמַעְתֶּם.",
     "לחצו על האות ששמעתם"),
    ("boy-r2-ask",
     "אֵיזוֹ הֲבָרָה שְׁמַעְתֶּם?",
     "איזו הברה שמעתם"),
    ("boy-rw-ask",
     "קִרְאוּ אֶת הַמִּלָּה, וְלַחֲצוּ עַל הַתְּמוּנָה הַנְּכוֹנָה.",
     "קראו את המילה ולחצו על התמונה הנכונה"),
    ("boy-r3",
     "נוֹנִי מָצְאָה צְדָפָה עַל הַחוֹל וְשָׂמְחָה מְאוֹד. אֵיךְ נוֹנִי מַרְגִּישָׁה?",
     "נוני מצאה צדפה על החול ושמחה מאוד איך נוני מרגישה"),
    ("boy-done",
     "כָּל הַכָּבוֹד! סִיַּמְתֶּם אֶת הַהֶכֵּרוּת.",
     "כל הכבוד סיימתם את ההכרות"),
]

FORCE = "--force" in sys.argv
ONLY = None
for i, a in enumerate(sys.argv):
    if a == "--only" and i + 1 < len(sys.argv):
        ONLY = set(sys.argv[i + 1].split(","))


def synth(text, out):
    # 🔴 חובה: preprocess מחיל את KNOWN_WORD_FIXES (client.convert הישיר עוקף אותו)
    text = tts.preprocess(text)
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


todo = [it for it in ITEMS if (ONLY is None or it[0] in ONLY)]
for key, text, _ in todo:
    dst = OUT / f"{key}.mp3"
    if dst.exists() and not FORCE:
        print(f"  skip  {key:14s} (קיים — --force לדריסה)")
        continue
    synth(text, dst)
    print(f"  synth {key:14s} «{tts.preprocess(text)}»")

print("loading whisper (small)...")
import whisper  # import כבד — אחרי הסינתזה
model = whisper.load_model("small")
rows = []
for key, text, expect in todo:
    dst = OUT / f"{key}.mp3"
    if not dst.exists():
        continue
    r = model.transcribe(str(dst), language="he", fp16=False)
    heard = (r.get("text") or "").strip()
    rows.append({"key": key, "text": text, "expect": expect, "heard": heard})
    print(f"  [{key:14s}] → «{heard}»")

report = Path(__file__).parent / "boy-check-audio-report.json"
report.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
print("done ->", report.name)
