#!/usr/bin/env python3
"""
proof-eleven-v3.py — דגימת הוכחה לפני מעבר מלא לקול ElevenLabs באבני יסוד.

מייצר את המקרים הקשים (CV עם שווא/דגש, צלילי אות, מילים עם שווא בתחילה,
מילות עוגן, משפט נרטיב) בשני מצבים — shva-fix דלוק / כבוי — כדי להשוות.
ואז מתמלל כל קליפ חזרה (ElevenLabs STT, scribe_v1) כדי לבדוק אובייקטיבית
שמה שנשמע = מה שהתכוונו (תופס הגייה שגויה כמו בעיית השווא).

פלט:
  _audio-test/eleven-v3-proof/<on|off>/<id>.mp3
  _audio-test/eleven-v3-proof/qa-report.json   ← לסוכן ה-QA

הרצה:  python scripts/proof-eleven-v3.py
"""
import json
import os
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

import _eleven_tts as tts  # אותו shim של המעבר

REPO_ROOT = Path(__file__).parent.parent.parent.parent
load_dotenv(REPO_ROOT / ".env")
API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
if not API_KEY:
    sys.exit(f"❌ ELEVENLABS_API_KEY חסר ב-{REPO_ROOT / '.env'}")

client = ElevenLabs(api_key=API_KEY)
OUT_DIR = Path(__file__).parent.parent / "_audio-test" / "eleven-v3-proof"

# (id, text, kind, expect) — expect = מה ש-STT אמור לשמוע (de-niqud, גס)
# kind: cv (לא לגעת בשווא) · sound · word · narr
SAMPLES = [
    # ── CV עם שווא — חייב להישאר שווא (אות אחת, fix לא חל) ──
    ("cv-bet-shva",   "בְּ", "cv",   "בְּ /be/"),
    ("cv-mem-shva",   "מְ",  "cv",   "מְ /me/"),
    ("cv-lamed-shva", "לְ",  "cv",   "לְ /le/"),
    # ── CV עם דגש קל ב/כ/פ ──
    ("cv-bet-patach", "בַּ", "cv",   "בַּ /ba/ לא /va/"),
    ("cv-kaf-patach", "כַּ", "cv",   "כַּ /ka/ לא /xa/"),
    ("cv-pey-patach", "פַּ", "cv",   "פַּ /pa/ לא /fa/"),
    # ── צלילי אות (סיום נקודה) ──
    ("sound-lamed",   "לַ.", "sound", "לַ /la/"),
    ("sound-bet",     "בַּ.", "sound", "בַּ /ba/"),
    # ── מילים עם שווא נע בתחילה (כאן ה-fix אמור לעזור) ──
    ("w-mechonit",    "מְכוֹנִית",  "word", "מכונית"),
    ("w-brecha",      "בְּרֵכָה",    "word", "ברכה"),
    ("w-tzlil",       "צְלִיל",      "word", "צליל"),
    ("w-metzuyan",    "מְצֻיָּן",    "word", "מצוין"),
    ("w-tshuva",      "תְּשׁוּבָה",  "word", "תשובה"),
    # ── מילים בלי שווא (ביקורת — fix לא משנה) ──
    ("w-ima",         "אִמָּא",      "word", "אמא"),
    ("w-tapuach",     "תַּפּוּחַ",   "word", "תפוח"),
    # ── מילות עוגן ל-ל (דמו) ──
    ("w-lev",         "לֵב",  "word", "לב"),
    ("w-lul",         "לוּל", "word", "לול"),
    ("w-lakach",      "לָקַח", "word", "לקח"),
    # ── משפט נרטיב של נוני ──
    ("narr-intro",
     "בַּשּׁוּנִית שֶׁל נוּנִי חַיִּים חֲמִשָּׁה דָּגִים, וְכֹל אֶחָד שָׁר צְלִיל אַחֵר.",
     "narr", "בשונית של נוני חיים חמישה דגים וכל אחד שר צליל אחר"),
]


def synth(text: str, out_path: Path) -> str:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    audio = client.text_to_speech.convert(
        voice_id=tts.VOICE_ID, text=text,
        model_id=tts.MODEL_ID, output_format=tts.OUTPUT_FORMAT)
    with open(out_path, "wb") as f:
        for ch in audio:
            if ch:
                f.write(ch)
    return f"{out_path.stat().st_size // 1024}KB"


def transcribe(path: Path) -> str:
    try:
        with open(path, "rb") as f:
            r = client.speech_to_text.convert(file=f, model_id="scribe_v1",
                                               language_code="heb")
        return (getattr(r, "text", "") or "").strip()
    except Exception as e:
        return f"[STT-FAIL: {e}]"


def main():
    report = []
    print(f"קול: {tts.VOICE_ID} · model: {tts.MODEL_ID}\n")
    for sid, text, kind, expect in SAMPLES:
        row = {"id": sid, "kind": kind, "source_niqud": text, "expect": expect}
        # fix-off תמיד; fix-on רק כשהוא משנה משהו (מילים עם שווא בתחילה)
        fixed = tts.strip_initial_shva(text)
        variants = [("off", text)]
        if fixed != text:
            variants.append(("on", fixed))
        for mode, t in variants:
            out = OUT_DIR / mode / f"{sid}.mp3"
            size = synth(t, out)
            heard = transcribe(out)
            row[f"text_{mode}"] = t
            row[f"heard_{mode}"] = heard
            print(f"  [{mode:3s}] {sid:14s} «{t}» → STT: «{heard}»  ({size})")
        report.append(row)

    rpt_path = OUT_DIR / "qa-report.json"
    rpt_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n✅ דו\"ח QA: {rpt_path}")


if __name__ == "__main__":
    main()
