#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""generate-follow-instr-audio.py — מקליט את קליפי-המשפט של מכניקת follow-instr
(קול-מישמיש = נוני, ביניים). משפטי-ההוראה חיים כרגע ב-fixture שבדף
src/follow-instr.html (MISHMISH_FOLLOW_INSTR_DEMO) ולא ב-pack, לכן הגנרטור
הכללי (generate-mishmish-audio.py) לא אוסף אותם. עד שסוכן-ה-pack יזרים
pack.follow_instr, זהו מקור-האמת ל-5 המשפטים.

מפתחות: 'follow_instr/<item>-<loc>' — תואם ל-placement.audio ב-fixture, כך
ש-round.audioKey נפתר לקליפ המוקלט. המניפסט ממוזג (לא נמחק) ואז data.js נבנה
מחדש כדי להטביע — audio.js זורע ממנו ב-file://.

הרצה: PYTHONIOENCODING=utf-8 python scripts/generate-follow-instr-audio.py [--force] [--dry]
🔴 קול-מישמיש טרם ננעל — נוני זמני. ביקורת-אוזן ע"י מיטל היא השער (הסוכן לא שומע).
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).parent))
import _mishmish_tts as tts  # noqa: E402

ROOT = Path(__file__).parent.parent
AUDIO = ROOT / "assets" / "audio"

# key → (rel, משפט מנוקד). זהה ל-placements ב-src/follow-instr.html (טיוטת-מיטל).
CLIPS = {
    "follow_instr/sefer-table":     ("follow_instr/sefer-table.mp3",     "שִׂימוּ אֶת הַסֵּפֶר עַל הַשֻּׁלְחָן"),
    "follow_instr/iparon-basket":   ("follow_instr/iparon-basket.mp3",   "שִׂימוּ אֶת הָעִפָּרוֹן בַּסַּל"),
    "follow_instr/machberet-shelf": ("follow_instr/machberet-shelf.mp3", "שִׂימוּ אֶת הַמַּחְבֶּרֶת עַל הַמַּדָּף"),
    "follow_instr/yalkut-table":    ("follow_instr/yalkut-table.mp3",    "שִׂימוּ אֶת הַיַּלְקוּט עַל הַשֻּׁלְחָן"),
    "follow_instr/machak-basket":   ("follow_instr/machak-basket.mp3",   "שִׂימוּ אֶת הַמַּחַק בַּסַּל"),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="ייצר-מחדש קליפים קיימים")
    ap.add_argument("--dry", action="store_true", help="הצג בלי לסנתז")
    args = ap.parse_args()

    print(f"קול-מישמיש = {tts.VOICE_MISHMISH}  ·  model {tts.MODEL_ID}")
    print(f"{len(CLIPS)} משפטי follow-instr\n")

    if args.dry:
        for key, (rel, text) in CLIPS.items():
            print(f"  {key:32s} → {rel:34s} «{text}»")
        return

    if tts.client() is None:
        print("🔴 ELEVENLABS_API_KEY חסר ב-.env — עצירה.")
        sys.exit(1)

    made, skipped = [], []
    for key, (rel, text) in CLIPS.items():
        dst = AUDIO / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists() and not args.force:
            skipped.append(key)
            print(f"  skip  {key:32s} (קיים)")
            continue
        tts.synth_hebrew(text, dst)
        made.append(key)
        print(f"  synth {key:32s} «{text}»")
    print(f"\nסונתזו {len(made)} · דילוג {len(skipped)}")

    # ── מיזוג למניפסט (רק קבצים שקיימים בפועל; לא מוחק מפתחות אחרים) ──
    mpath = AUDIO / "manifest.json"
    manifest = json.loads(mpath.read_text(encoding="utf-8")) if mpath.exists() else {}
    for key, (rel, _text) in CLIPS.items():
        if (AUDIO / rel).exists():
            manifest[key] = rel
    manifest = {k: manifest[k] for k in sorted(manifest)}
    mpath.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ manifest → assets/audio/manifest.json ({len(manifest)} מפתחות)")

    # ── בונה-מחדש את data.js כדי להטביע את המניפסט המעודכן (file://) ──
    build = ROOT / "src" / "js" / "_build-data.js"
    subprocess.run(["node", str(build)], check=True)
    print("✅ data.js נבנה מחדש (המניפסט מוטבע)")
    print("🔴 ביקורת-אוזן ע\"י מיטל = השער. הסוכן לא שומע.")


if __name__ == "__main__":
    main()
