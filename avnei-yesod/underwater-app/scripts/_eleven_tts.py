#!/usr/bin/env python3
"""
_eleven_tts.py — שכבת תאימות (drop-in) שמחליפה את edge_tts ב-ElevenLabs.

החלטה (29.6.2026): מעבר קול אבני יסוד מ-Microsoft edge-tts (he-IL-AvriNeural)
ל-ElevenLabs — model eleven_v3, voice_id ZI6I4a3UGgs1DXxqWjBV (אותו קול נוני
שנבחר בפולס). כל סקריפטי היצירה משתמשים באותו דפוס:
    import edge_tts
    edge_tts.Communicate(text, VOICE, rate=RATE).save(path)   # await
לכן מספיק להחליף את השורה `import edge_tts` ב-`import _eleven_tts as edge_tts`
וכל הסקריפטים עוברים לקול החדש בלי שינוי נוסף.

🔴 תיקון שווא בתחילת מילה (ניסיוני, ביקשה מיטל 29.6.2026):
eleven_v3 לעיתים מבטא לא נכון מילה שמתחילה בעיצור+שווא נע (למשל מְכוֹנִית).
ההשערה: הסרת השווא מהאות הראשונה בלבד משפרת את ההגייה. לכן strip_initial_shva
מסיר שווא מהאות הראשונה — אבל **רק במילים בנות ≥3 אותיות עבריות**, כדי לא
להרוס את קליפי ה-CV שמלמדים שווא בכוונה (cv-bet-shva = "בְּ" = אות אחת).
כיבוי: TTS_SHVA_FIX=0 בסביבה.
"""
import asyncio
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

# ─── הגדרות קול ───
VOICE_ID = "ZI6I4a3UGgs1DXxqWjBV"   # קול נוני (ElevenLabs)
MODEL_ID = "eleven_v3"              # תומך עברית רשמית
OUTPUT_FORMAT = "mp3_44100_128"

# תיקון שווא — כבוי כברירת מחדל. בדיקת A/B (29.6.2026, proof-eleven-v3 + QA לשוני)
# הראתה ש-eleven_v3 מבטא שווא-נע בתחילת מילה נכון, וההסרה דווקא *מקלקלת*
# (מְכוֹנִית→"מחוני", בְּרֵכָה→"המחה"). זו ההפך מ-AvriNeural. הדלקה: TTS_SHVA_FIX=1
SHVA_FIX = os.getenv("TTS_SHVA_FIX", "0") == "1"
SHVA_MIN_LETTERS = 3   # מחילים רק על מילים בנות ≥3 אותיות (מגן על קליפי CV)


def _find_env() -> Path | None:
    """מאתר את .env של הריפו (חיפוש כלפי מעלה מתיקיית הקובץ)."""
    here = Path(__file__).resolve()
    for parent in [here.parent, *here.parents]:
        cand = parent / ".env"
        if cand.exists():
            return cand
    return None


load_dotenv(_find_env())
_API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
_client = ElevenLabs(api_key=_API_KEY) if _API_KEY else None

SHVA = "ְ"   # HEBREW POINT SHEVA


def _is_heb_letter(c: str) -> bool:
    return "א" <= c <= "ת"


def strip_initial_shva(text: str, min_letters: int = SHVA_MIN_LETTERS) -> str:
    """מסיר שווא מהאות הראשונה של כל מילה בת ≥min_letters אותיות עבריות."""
    out = []
    for tok in re.split(r"(\s+)", text):
        if not tok or tok.isspace():
            out.append(tok)
            continue
        if sum(1 for c in tok if _is_heb_letter(c)) >= min_letters:
            chars = list(tok)
            i = 0
            while i < len(chars) and not _is_heb_letter(chars[i]):
                i += 1
            if i < len(chars):
                j = i + 1
                # סימני ניקוד/דגש של האות הראשונה — עד האות הבאה
                while j < len(chars) and not _is_heb_letter(chars[j]):
                    if chars[j] == SHVA:
                        del chars[j]
                        break
                    j += 1
            tok = "".join(chars)
        out.append(tok)
    return "".join(out)


# ─── תיקוני הגייה למילים ספציפיות (de-niqud → כתיב שמבוטא נכון) ───
# נוני: holam→shuruk כבר תוקן בסקריפטים עצמם (נוֹנִי→נוּנִי).
# תשובה: הכתיב המנוקד (תְּשׁוּבָה) נשמע "תישובה" אצל eleven_v3; בלי ניקוד תקין.
#        מפתח = רצף עיצורים בלבד; ערך = הכתיב שמבוטא נכון. (אושר ע"י מיטל 29.6.2026)
KNOWN_WORD_FIXES = {
    "תשובה": "תשובה",
}


def _consonants(token: str) -> str:
    return "".join(c for c in token if _is_heb_letter(c))


def apply_word_fixes(text: str) -> str:
    out = []
    for tok in re.split(r"(\s+)", text):
        if tok and not tok.isspace():
            fix = KNOWN_WORD_FIXES.get(_consonants(tok))
            if fix:
                tok = fix
        out.append(tok)
    return "".join(out)


def preprocess(text: str) -> str:
    text = apply_word_fixes(text)
    return strip_initial_shva(text) if SHVA_FIX else text


class Communicate:
    """תחליף ל-edge_tts.Communicate — אותה חתימה, מנוע ElevenLabs מאחור.

    הפרמטרים voice/rate/pitch/volume נקלטים לתאימות ומתעלמים מהם (לקול
    ElevenLabs יש pacing משלו). הטקסט עובר preprocess (תיקון שווא).
    """

    def __init__(self, text, voice=None, *, rate=None, pitch=None, volume=None, **kwargs):
        self.text = preprocess(text)

    async def save(self, path):
        if _client is None:
            raise RuntimeError("ELEVENLABS_API_KEY חסר ב-.env")

        def _do():
            audio = _client.text_to_speech.convert(
                voice_id=VOICE_ID,
                text=self.text,
                model_id=MODEL_ID,
                output_format=OUTPUT_FORMAT,
            )
            with open(path, "wb") as f:
                for chunk in audio:
                    if chunk:
                        f.write(chunk)

        await asyncio.to_thread(_do)
