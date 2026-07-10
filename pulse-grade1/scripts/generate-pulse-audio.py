#!/usr/bin/env python3
"""
generate-pulse-audio.py — מייצר את כל אודיו נוּני לפולס א'-ב'.

קול: ElevenLabs — model eleven_v3 (תומך עברית רשמית), voice_id ZI6I4a3UGgs1DXxqWjBV.
החלטה (21.6.2026): מעבר מ-edge-tts (Hila) לקול הזה של ElevenLabs לקול תלמידים בפולס.
eleven_v3 הוא המודל שתומך עברית כראוי (multilingual_v2 לא — הגייה גרועה).

🔴 לקח 9.7.2026 (עודכן): השם "נוּני" בכתיב-חסר יצא /noni/ (חולם) → שורוק "נוּני"
בכל הקליפים כדי לכפות /nuni/ (אושר באוזן ע"י מיטל, מסכי bridge + setup-adjust).
שאר הניקוד: מלא היכן שנדרש לפירוק דו-משמעות ("שֶׁקַּל" — אחרת /shekel/);
"תשובה" בכתיב-חסר (המנוקד נשמע "תישובה"). "בקרים"→"ימים" במסך-הבוקר (הגייה).

דורש: pip install elevenlabs python-dotenv  +  ELEVENLABS_API_KEY ב-.env של הריפו.
שימוש:
  python generate-pulse-audio.py            # מייצר חסרים בלבד
  python generate-pulse-audio.py --force    # מייצר הכל מחדש
"""
import argparse
import os
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

try:
    from dotenv import load_dotenv
    from elevenlabs.client import ElevenLabs
except ImportError:
    sys.exit("חסר elevenlabs/python-dotenv. הריצו: pip install elevenlabs python-dotenv")

ROOT = Path(__file__).parent.parent
REPO_ROOT = ROOT.parent
load_dotenv(REPO_ROOT / ".env")

API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
if not API_KEY:
    sys.exit(f"❌ ELEVENLABS_API_KEY לא נמצא ב-{REPO_ROOT / '.env'}")

VOICE_ID = "ZI6I4a3UGgs1DXxqWjBV"      # קול נוּני לתלמידים (ElevenLabs)
MODEL_ID = "eleven_v3"                  # תומך עברית רשמית
OUTPUT_FORMAT = "mp3_44100_128"

OUT_DIR = ROOT / "assets" / "audio"
DRAFTS_DIR = OUT_DIR / "drafts"

# ─── 14 קליפים מאושרים — מנוקד מלא (שמות תואמים ל-AUDIO_MAP בשאלון) ───
CLIPS = {
    # מיטל 9.7: "תְּשׁוּבָה" המנוקד נשמע "תישובה" → כתיב-חסר "תשובה" (KNOWN_WORD_FIXES).
    #           "נוּני" בכתיב-חסר יצא /noni/ → שורוק "נוּני" כופה /nuni/.
    "bridge": "נוּני צָרִיךְ עֶזְרָה קְטַנָּה. בְּכָל פַּעַם תִּבְחֲרוּ אֵיךְ נִרְאֶה לָכֶם שֶׁנוּני מַרְגִּישׁ. אֵין תשובה נְכוֹנָה אוֹ לֹא נְכוֹנָה.",

    # מיטל 9.7: "בקרים"→"ימים" (הגייה); "נוּני" בלי ניקוד; "שֶׁקַּל" נשאר מנוקד (אחרת /shekel/).
    "setup-adjust":  "כל בוקר נוּני מגיע לשונית. יש ימים שֶׁקַּל לו, ויש ימים שקצת פחות.",
    "setup-friend":  "בַּשּׁוֹנִית יֵשׁ דָּגִים שֶׁאוֹהֲבִים לְשַׂחֵק יַחַד. לִפְעָמִים נוּני מִצְטָרֵף, וְלִפְעָמִים הוּא מְחַפֵּשׂ עִם מִי.",
    "setup-emotion": "לִפְעָמִים קוֹרֶה מַשֶּׁהוּ מַרְגִּיז. נוּני עוֹצֵר רֶגַע, וּמְנַסֶּה לְהֵרָגַע.",
    "setup-joy":     "נוּני מָצָא בַּשּׁוֹנִית מַשֶּׁהוּ שֶׁעוֹד לֹא הִכִּיר. הוּא מִסְתַּכֵּל, וְחוֹשֵׁב מָה זֶה.",

    "question-adjust":  "הַאִם נוּני מַרְגִּישׁ טוֹב כְּשֶׁהוּא בָּא לַשּׁוֹנִית בַּבֹּקֶר?",
    "question-friend":  "הַאִם יֵשׁ לְנוּני עִם מִי לְשַׂחֵק בַּשּׁוֹנִית?",
    "question-emotion": "כְּשֶׁנוּני כּוֹעֵס, הַאִם יֵשׁ מַשֶּׁהוּ שֶׁעוֹזֵר לוֹ לְהֵרָגַע?",
    "question-joy":     "הַאִם כֵּיף לְנוּני לְגַלּוֹת מַשֶּׁהוּ חָדָשׁ?",

    "thanks-1": "תּוֹדָה שֶׁעֲזַרְתֶּם לִי.",
    "thanks-2": "זֶה עוֹזֵר לִי לְהָבִין.",
    "thanks-3": "תּוֹדָה. נַעֲבֹר לַבּוּעָה הַבָּאָה.",
    "thanks-4": "שָׁמַעְתִּי אֶת הַתְּשׁוּבָה.",

    "outro": "תּוֹדָה שֶׁעֲזַרְתֶּם לְנוּני. נִתְרָאֶה בַּשּׁוֹנִית בַּפַּעַם הַבָּאָה.",
}

# ─── 16 שאלות 📝-טיוטה (spec 6.7) — מנוקד מלא → drafts/ ───
DRAFTS = {
    "question-adjust-d1": "כְּשֶׁנוּני נִכְנָס לַשּׁוֹנִית בַּבֹּקֶר, הַאִם קַל לוֹ לְהַתְחִיל אֶת הַיּוֹם?",
    "question-adjust-d2": "בַּבֹּקֶר, כְּשֶׁנוּני מַגִּיעַ לַשּׁוֹנִית, הַאִם הוּא מַרְגִּישׁ שֶׁזֶּה מָקוֹם טוֹב לוֹ?",
    "question-adjust-d3": "כְּשֶׁנוּני רוֹאֶה אֶת הַשּׁוֹנִית בַּבֹּקֶר, הַאִם נָעִים לוֹ לְהִיכָּנֵס?",
    "question-adjust-d4": "בַּבֹּקֶר, כְּשֶׁנוּני מַגִּיעַ, הַאִם טוֹב לוֹ בַּשּׁוֹנִית?",
    "question-friend-d1": "כְּשֶׁנוּני רוֹצֶה לְשַׂחֵק, הַאִם הוּא מוֹצֵא דָּג שֶׁמִּצְטָרֵף אֵלָיו?",
    "question-friend-d2": "בַּשּׁוֹנִית, הַאִם יֵשׁ לְנוּני מִישֶׁהוּ שֶׁאוֹהֵב לְשַׂחֵק אִתּוֹ?",
    "question-friend-d3": "כְּשֶׁהַדָּגִים מְשַׂחֲקִים, הַאִם נוּני מַצְלִיחַ לְהִצְטָרֵף אֲלֵיהֶם?",
    "question-friend-d4": "בִּזְמַן מִשְׂחָק, הַאִם יֵשׁ לְנוּני עִם מִי לְשַׂחֵק?",
    "question-emotion-d1": "כְּשֶׁנוּני מִתְרַגֵּז, הַאִם הוּא מוֹצֵא דָּבָר שֶׁמַּרְגִּיעַ אוֹתוֹ?",
    "question-emotion-d2": "אַחֲרֵי שֶׁנוּני כּוֹעֵס, הַאִם הוּא מַצְלִיחַ לְהִירָגַע לְאַט?",
    "question-emotion-d3": "כְּשֶׁמַּשֶּׁהוּ מַרְגִּיז אֶת נוּני, הַאִם הוּא יוֹדֵעַ מָה יַעֲזֹר לוֹ?",
    "question-emotion-d4": "כְּשֶׁנוּני כּוֹעֵס, הַאִם הוּא מוֹצֵא דֶּרֶךְ לְהֵרָגַע?",
    "question-joy-d1": "כְּשֶׁנוּני פּוֹגֵשׁ דָּבָר חָדָשׁ, הַאִם הוּא רוֹצֶה לָדַעַת עָלָיו יוֹתֵר?",
    "question-joy-d2": "כְּשֶׁנוּני רוֹאֶה מַשֶּׁהוּ שֶׁהוּא לֹא מַכִּיר, הַאִם זֶה מְסַקְרֵן אוֹתוֹ?",
    "question-joy-d3": "בַּשּׁוֹנִית, כְּשֶׁיֵּשׁ דָּבָר חָדָשׁ, הַאִם נוּני שָׂמֵחַ לְנַסּוֹת?",
    "question-joy-d4": "כְּשֶׁנוּני לוֹמֵד מַשֶּׁהוּ חָדָשׁ, הַאִם הוּא רוֹצֶה לְנַסּוֹת עוֹד?",
}


def synth(client: ElevenLabs, name: str, text: str, out_dir: Path, force: bool) -> str:
    out = out_dir / f"{name}.mp3"
    if out.exists() and not force and out.stat().st_size > 500:
        return "skip"
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        audio_iter = client.text_to_speech.convert(
            voice_id=VOICE_ID,
            text=text,
            model_id=MODEL_ID,
            output_format=OUTPUT_FORMAT,
        )
        with open(out, "wb") as f:
            for chunk in audio_iter:
                if chunk:
                    f.write(chunk)
        if out.exists() and out.stat().st_size > 500:
            return f"OK ({out.stat().st_size // 1024}KB)"
        return "FAIL (ריק)"
    except Exception as e:
        return f"FAIL: {e}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="מייצר הכל מחדש")
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    DRAFTS_DIR.mkdir(parents=True, exist_ok=True)
    client = ElevenLabs(api_key=API_KEY)
    print(f"קול: ElevenLabs voice {VOICE_ID} · model {MODEL_ID} · נוּני שורוק")
    print(f"מצב: {'force' if args.force else 'skip-if-exists'}\n")

    print("─── 14 מאושרים ───")
    for name, text in CLIPS.items():
        print(f"  {name:24s} → {synth(client, name, text, OUT_DIR, args.force)}")
    print("─── 16 טיוטות → drafts/ ───")
    for name, text in DRAFTS.items():
        print(f"  {name:24s} → {synth(client, name, text, DRAFTS_DIR, args.force)}")
    print(f"\n✅ {len(CLIPS)} מאושרים + {len(DRAFTS)} טיוטות.")


if __name__ == "__main__":
    main()
