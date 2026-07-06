#!/usr/bin/env python3
"""generate-island-12-intro-audio.py — נרטיב פתיחה לאי 12 (מְעָרַת הָאוֹצָרוֹת).

מפיק intro-isl12.mp3 — הסיפור של דף-האי stage-12-island.html (כפתור 🔊 בפס-הסיפור).
שיטה כמו generate-vocab-match-audio-m1.py: וריאנטי-ניסוח, כל וריאנט מסונתז
(ElevenLabs eleven_v3, קול נוני) ועובר תמלול Whisper (small, initial_prompt עברי) —
הראשון שעובר את בדיקת מילות-המפתח מועתק לשם הסופי.

הרצה: PYTHONIOENCODING=utf-8 python generate-island-12-intro-audio.py
פלט:  ../assets/audio/intro-isl12.mp3 + island-12-intro-audio-report.json
"""
import json
import re
import shutil
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import asyncio
import _eleven_tts as edge_tts

OUT = Path(__file__).parent.parent / "assets" / "audio"
TRIES = Path(__file__).parent / "_isl12_tries"
OUT.mkdir(parents=True, exist_ok=True)
TRIES.mkdir(parents=True, exist_ok=True)

WHISPER_PROMPT = "סיפור בעברית: נוני צללה אל מערת האוצרות, תיבה מלאה מילים ותמונות, זרם חזק, הכול התערבב, בואו נסדר את האוצר."

# הטקסט = הנרטיב שבפס-הסיפור של stage-12-island.html (נוּנִי בשורוק — חובה)
VARIANTS = [
    ("מְעָרַת הָאוֹצָרוֹת. "
     "נוּנִי צָלְלָה אֶל מְעָרַת הָאוֹצָרוֹת, וּמָצְאָה תֵּבָה מְלֵאָה מִלִּים וּתְמוּנוֹת. "
     "אֲבָל זֶרֶם חָזָק עָבַר בַּמְּעָרָה, וְהַכֹּל הִתְעַרְבֵּב! "
     "בּוֹאוּ נְסַדֵּר אֶת הָאוֹצָר!"),
    ("נוּנִי צָלְלָה אֶל מְעָרַת הָאוֹצָרוֹת, וּמָצְאָה תֵּבָה מְלֵאָה מִלִּים וּתְמוּנוֹת. "
     "אֲבָל זֶרֶם חָזָק עָבַר בַּמְּעָרָה, וְהַכֹּל הִתְעַרְבֵּב. "
     "בּוֹאוּ נְסַדֵּר אֶת הָאוֹצָר!"),
    ("נוּנִי מָצְאָה בַּמְּעָרָה תֵּבָה מְלֵאָה מִלִּים וּתְמוּנוֹת. "
     "אֲבָל זֶרֶם חָזָק עָבַר, וְהַכֹּל הִתְעַרְבֵּב. "
     "בּוֹאוּ נְסַדֵּר אֶת הָאוֹצָר!"),
]


def norm(s):
    """נירמול תמלול: בלי ניקוד/פיסוק, רווח יחיד."""
    s = re.sub(r"[֑-ׇ]", "", s or "")
    s = re.sub(r"[^א-ת ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


# מילות-מפתח שחובה לשמוע (וריאנטי-כתיב מקובלים של Whisper)
KEYWORDS = [
    ("נוני",),
    ("מערת", "מערה", "במערה"),
    ("אוצרות", "אוצר", "האוצרות", "האוצר"),
    ("זרם",),
    ("התערבב", "התערבבו"),
    ("נסדר", "לסדר", "סדר"),
]


def qa_pass(heard_norm):
    words = set(heard_norm.split())
    missing = []
    for group in KEYWORDS:
        if not any(any(v in w for w in words) for v in group):
            missing.append(group[0])
    return missing


async def synth(text, out):
    tts = edge_tts.Communicate(text)
    await tts.save(str(out))


async def main():
    print("synthesizing variants...")
    for i, text in enumerate(VARIANTS):
        p = TRIES / f"intro-isl12-v{i}.mp3"
        if not p.exists() or p.stat().st_size < 100:
            await synth(text, p)
            print(f"  synth v{i}")
        else:
            print(f"  skip  v{i} (קיים)")

    print("loading whisper (small)...")
    import whisper
    model = whisper.load_model("small")

    rows = []
    winner = None
    for i, text in enumerate(VARIANTS):
        p = TRIES / f"intro-isl12-v{i}.mp3"
        r = model.transcribe(str(p), language="he", fp16=False,
                             initial_prompt=WHISPER_PROMPT)
        heard = (r.get("text") or "").strip()
        missing = qa_pass(norm(heard))
        rows.append({"variant": i, "text": text, "heard": heard, "missing": missing})
        print(f"  [v{i}] → «{heard}» {'✅' if not missing else '❌ חסר: ' + ','.join(missing)}")
        if not missing and winner is None:
            winner = p

    if winner:
        shutil.copyfile(winner, OUT / "intro-isl12.mp3")
        print(f"✅ intro-isl12.mp3 ← {winner.name}")
    else:
        print("❌ אף וריאנט לא עבר QA — intro-isl12.mp3 לא נוצר")

    report = Path(__file__).parent / "island-12-intro-audio-report.json"
    report.write_text(json.dumps({"winner": winner.name if winner else None, "tries": rows},
                                 ensure_ascii=False, indent=2), encoding="utf-8")
    print("done →", report.name)
    if not winner:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
