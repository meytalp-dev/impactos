#!/usr/bin/env python3
"""generate-rhyme-audio.py — אודיו למשחקון החריזה (stage-rhyme.html · M4).

30 מילות היעד/אפשרויות של data/rhyme-rounds.json + אינטרו נרטיב של נוני.
קול נוני — ElevenLabs eleven_v3 (דרך _eleven_tts). כל המילים אמיתיות ומוכרות
(אין מסיחי-תפל — הלקח מ-generate-bank-play-audio.py: v3 מנרמל מילות-תפל).

QA: תמלול Whisper לכל קליפ (הסוכן לא שומע — התמלול הוא האימות).
מילים קצרות (לֵב, נֵר, חַם...) מתומללות ג'יבריש בלי initial_prompt עברי —
לכן התמלול רץ עם prompt (לקח 4.7.2026).

הרצה: PYTHONIOENCODING=utf-8 python generate-rhyme-audio.py
פלט:  ../assets/audio/rhyme-*.mp3 + rhyme-audio-report.json
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

INTRO = ("שַׁרְשֶׁרֶת הַחֲרוּזִים שֶׁלִּי נִקְרְעָה, וְכָל הַחֲרוּזִים הִתְפַּזְּרוּ בַּשּׁוּנִית! "
         "מִלִּים שֶׁמִּתְחָרְזוֹת נִשְׁמָעוֹת אוֹתוֹ דָּבָר בַּסּוֹף — כְּמוֹ דָּג וְגַג. "
         "גְּעוּ בָּרַמְקוֹלִים, הַקְשִׁיבוּ הֵיטֵב, וּמִצְאוּ אֶת הַמִּלָּה שֶׁמִּתְחָרֶזֶת. "
         "כָּל מִלָּה נְכוֹנָה מַחְזִירָה חָרוּז לַשַּׁרְשֶׁרֶת!")

# (key, text, expect) — expect = מה Whisper אמור לשמוע (בקירוב, בלי ניקוד)
ITEMS = [
    ("rhyme-intro",      INTRO,        "שרשרת החרוזים"),
    # rhyme-01: דָּג → גַּג (מסיחים: דָּן, מַיִם)
    ("rhyme-w-dag",      "דָּג",       "דג"),
    ("rhyme-w-gag",      "גַּג",       "גג"),
    ("rhyme-w-dan",      "דָּן",       "דן"),
    ("rhyme-w-mayim",    "מַיִם",      "מים"),
    # rhyme-02: שִׁיר → קִיר (מסיחים: שָׁעוֹן, לֵב)
    ("rhyme-w-shir",     "שִׁיר",      "שיר"),
    ("rhyme-w-kir",      "קִיר",       "קיר"),
    ("rhyme-w-shaon",    "שָׁעוֹן",    "שעון"),
    ("rhyme-w-lev",      "לֵב",        "לב"),
    # rhyme-03: בָּלוֹן → חַלּוֹן (מסיחים: בַּיִת, גָּמָל)
    ("rhyme-w-balon",    "בָּלוֹן",    "בלון"),
    ("rhyme-w-chalon",   "חַלּוֹן",    "חלון"),
    ("rhyme-w-bayit",    "בַּיִת",     "בית"),
    ("rhyme-w-gamal",    "גָּמָל",     "גמל"),
    # rhyme-04: יָם → חַם (מסיחים: יָד, נֵר)
    ("rhyme-w-yam",      "יָם",        "ים"),
    ("rhyme-w-cham",     "חַם",        "חם"),
    ("rhyme-w-yad",      "יָד",        "יד"),
    ("rhyme-w-ner",      "נֵר",        "נר"),
    # rhyme-05: גַּל → סַל (מסיחים: גַּן, תַּפּוּחַ)
    ("rhyme-w-gal",      "גַּל",       "גל"),
    ("rhyme-w-sal",      "סַל",        "סל"),
    ("rhyme-w-gan",      "גַּן",       "גן"),
    ("rhyme-w-tapuach",  "תַּפּוּחַ",  "תפוח"),
    # rhyme-06: פִּיל → מְעִיל (מסיחים: פֶּרַח, כּוֹס)
    ("rhyme-w-pil",      "פִּיל",      "פיל"),
    ("rhyme-w-meil",     "מְעִיל",     "מעיל"),
    ("rhyme-w-perach",   "פֶּרַח",     "פרח"),
    ("rhyme-w-kos",      "כּוֹס",      "כוס"),
    # rhyme-07: מַיִם → שָׁמַיִם (מסיחים: מַתָּנָה, כֶּלֶב)
    ("rhyme-w-shamayim", "שָׁמַיִם",   "שמים"),
    ("rhyme-w-matana",   "מַתָּנָה",   "מתנה"),
    ("rhyme-w-kelev",    "כֶּלֶב",     "כלב"),
    # rhyme-08: נֵר → מְקָרֵר (מסיחים: נָחָשׁ, עוּגָה)
    ("rhyme-w-mekarer",  "מְקָרֵר",    "מקרר"),
    ("rhyme-w-nachash",  "נָחָשׁ",     "נחש"),
    ("rhyme-w-uga",      "עוּגָה",     "עוגה"),
]

WHISPER_PROMPT = "מילים בעברית לילדים: דג, גג, שיר, קיר, בלון, חלון, ים, חם, גל, סל, פיל, מעיל, מים, שמים, נר, מקרר, לב, יד, גן, כוס."


def synth(text, out):
    a = client.text_to_speech.convert(voice_id=tts.VOICE_ID, text=text,
                                      model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out, "wb") as f:
        for ch in a:
            if ch:
                f.write(ch)


for key, text, _ in ITEMS:
    dst = OUT / f"{key}.mp3"
    if dst.exists() and dst.stat().st_size > 0:
        print(f"  skip  {key:20s} (קיים)")
        continue
    synth(text, dst)
    print(f"  synth {key:20s} «{text}»")

print("loading whisper (small)...")
import whisper  # import כבד — אחרי הסינתזה
model = whisper.load_model("small")
rows = []
for key, text, expect in ITEMS:
    r = model.transcribe(str(OUT / f"{key}.mp3"), language="he", fp16=False,
                         initial_prompt=WHISPER_PROMPT)
    heard = (r.get("text") or "").strip()
    rows.append({"key": key, "text": text, "expect": expect, "heard": heard})
    print(f"  [{key:20s}] «{text}» → «{heard}»")

report = Path(__file__).parent / "rhyme-audio-report.json"
report.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
print("✅ done →", report.name)
