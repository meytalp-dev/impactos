#!/usr/bin/env python3
"""
generate-pulse-audio.py — מייצר את כל אודיו נוני לפולס א'-ב'.

קול: he-IL-HilaNeural (Microsoft Edge TTS, עברית נייטיב) + עיבוד "דמות מצוירת"
(הרמת גובה-צליל בלי שינוי קצב, ffmpeg rubberband). זה פתרון הביניים שאושר
(13.6.2026): הילה היא הקול הטבעי היחיד שעבד בעברית; העיבוד הופך אותה לדמות.

🔴 שני תיקונים קריטיים מול הגרסה הישנה:
  1. כל הטקסטים מנוקדים מלא — מתקן את הגיית "נוּנִי" אחרי תחיליות (כְּשֶׁ/לְ).
  2. PITCH_SHIFT — הופך את קול האישה לקול דמות. שנו את הערך כדי לכוון.

דורש: pip install edge-tts  +  ffmpeg ב-PATH (עם rubberband).
שימוש:
  python generate-pulse-audio.py            # מייצר חסרים בלבד
  python generate-pulse-audio.py --force    # מייצר הכל מחדש
"""
import argparse
import asyncio
import subprocess
import sys
import tempfile
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

try:
    import edge_tts
except ImportError:
    sys.exit("חסר edge-tts. הריצו: pip install edge-tts")

VOICE = "he-IL-HilaNeural"
RATE = "-10%"           # מעט איטי לכיתה א'
PITCH = "+5Hz"          # מיקרו-כוונון של edge-tts
PITCH_SHIFT = "1.16"    # ⬅️ עיבוד הדמות. 1.08=עדין · 1.16=מצויר · 1.24=מאוד מצויר

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "assets" / "audio"
DRAFTS_DIR = OUT_DIR / "drafts"

# ─── 14 קליפים מאושרים — מנוקד מלא (שמות תואמים ל-AUDIO_MAP בשאלון) ───
CLIPS = {
    "bridge": "נוּנִי צָרִיךְ עֶזְרָה קְטַנָּה. בְּכָל פַּעַם תִּבְחֲרוּ אֵיךְ נִרְאֶה לָכֶם שֶׁנּוּנִי מַרְגִּישׁ. אֵין תְּשׁוּבָה נְכוֹנָה אוֹ לֹא נְכוֹנָה.",

    "setup-adjust":  "כָּל בֹּקֶר נוּנִי מַגִּיעַ לַשּׁוֹנִית. יֵשׁ בְּקָרִים שֶׁקַּל לוֹ, וְיֵשׁ בְּקָרִים שֶׁקְּצָת פָּחוֹת.",
    "setup-friend":  "בַּשּׁוֹנִית יֵשׁ דָּגִים שֶׁאוֹהֲבִים לְשַׂחֵק יַחַד. לִפְעָמִים נוּנִי מִצְטָרֵף, וְלִפְעָמִים הוּא מְחַפֵּשׂ עִם מִי.",
    "setup-emotion": "לִפְעָמִים קוֹרֶה מַשֶּׁהוּ מַרְגִּיז. נוּנִי עוֹצֵר רֶגַע, וּמְנַסֶּה לְהֵרָגַע.",
    "setup-joy":     "נוּנִי מָצָא בַּשּׁוֹנִית מַשֶּׁהוּ שֶׁעוֹד לֹא הִכִּיר. הוּא מִסְתַּכֵּל, וְחוֹשֵׁב מָה זֶה.",

    "question-adjust":  "הַאִם נוּנִי מַרְגִּישׁ טוֹב כְּשֶׁהוּא בָּא לַשּׁוֹנִית בַּבֹּקֶר?",
    "question-friend":  "הַאִם יֵשׁ לְנוּנִי עִם מִי לְשַׂחֵק בַּשּׁוֹנִית?",
    "question-emotion": "כְּשֶׁנוּנִי כּוֹעֵס, הַאִם יֵשׁ מַשֶּׁהוּ שֶׁעוֹזֵר לוֹ לְהֵרָגַע?",
    "question-joy":     "הַאִם כֵּיף לְנוּנִי לְגַלּוֹת מַשֶּׁהוּ חָדָשׁ?",

    "thanks-1": "תּוֹדָה שֶׁעֲזַרְתֶּם לִי.",
    "thanks-2": "זֶה עוֹזֵר לִי לְהָבִין.",
    "thanks-3": "תּוֹדָה. נַעֲבֹר לַבּוּעָה הַבָּאָה.",
    "thanks-4": "שָׁמַעְתִּי אֶת הַתְּשׁוּבָה.",

    "outro": "תּוֹדָה שֶׁעֲזַרְתֶּם לְנוּנִי. נִתְרָאֶה בַּשּׁוֹנִית בַּפַּעַם הַבָּאָה.",
}

# ─── 16 שאלות 📝-טיוטה (spec 6.7) — מנוקד מלא → drafts/ ───
DRAFTS = {
    "question-adjust-d1": "כְּשֶׁנוּנִי נִכְנָס לַשּׁוֹנִית בַּבֹּקֶר, הַאִם קַל לוֹ לְהַתְחִיל אֶת הַיּוֹם?",
    "question-adjust-d2": "בַּבֹּקֶר, כְּשֶׁנוּנִי מַגִּיעַ לַשּׁוֹנִית, הַאִם הוּא מַרְגִּישׁ שֶׁזֶּה מָקוֹם טוֹב לוֹ?",
    "question-adjust-d3": "כְּשֶׁנוּנִי רוֹאֶה אֶת הַשּׁוֹנִית בַּבֹּקֶר, הַאִם נָעִים לוֹ לְהִיכָּנֵס?",
    "question-adjust-d4": "בַּבֹּקֶר, אַחֲרֵי שֶׁנוּנִי מַגִּיעַ, הַאִם הוּא מַרְגִּישׁ שֶׁהוּא בַּמָּקוֹם הַנָּכוֹן?",
    "question-friend-d1": "כְּשֶׁנוּנִי רוֹצֶה לְשַׂחֵק, הַאִם הוּא מוֹצֵא דָּג שֶׁמִּצְטָרֵף אֵלָיו?",
    "question-friend-d2": "בַּשּׁוֹנִית, הַאִם יֵשׁ לְנוּנִי מִישֶׁהוּ שֶׁאוֹהֵב לְשַׂחֵק אִתּוֹ?",
    "question-friend-d3": "כְּשֶׁהַדָּגִים מְשַׂחֲקִים, הַאִם נוּנִי מַצְלִיחַ לְהִצְטָרֵף אֲלֵיהֶם?",
    "question-friend-d4": "בִּזְמַן מִשְׂחָק, הַאִם נוּנִי מַרְגִּישׁ שֶׁיֵּשׁ לוֹ חָבֵר לְיַדּוֹ?",
    "question-emotion-d1": "כְּשֶׁנוּנִי מִתְרַגֵּז, הַאִם הוּא מוֹצֵא דָּבָר שֶׁמַּרְגִּיעַ אוֹתוֹ?",
    "question-emotion-d2": "אַחֲרֵי שֶׁנוּנִי כּוֹעֵס, הַאִם הוּא מַצְלִיחַ לְהִירָגַע לְאַט?",
    "question-emotion-d3": "כְּשֶׁמַּשֶּׁהוּ מַרְגִּיז אֶת נוּנִי, הַאִם הוּא יוֹדֵעַ מָה יַעֲזֹר לוֹ?",
    "question-emotion-d4": "כְּשֶׁנוּנִי כּוֹעֵס, הַאִם מִישֶׁהוּ אוֹ מַשֶּׁהוּ עוֹזֵר לוֹ לְהֵרָגַע?",
    "question-joy-d1": "כְּשֶׁנוּנִי פּוֹגֵשׁ דָּבָר חָדָשׁ, הַאִם הוּא רוֹצֶה לָדַעַת עָלָיו יוֹתֵר?",
    "question-joy-d2": "כְּשֶׁנוּנִי רוֹאֶה מַשֶּׁהוּ שֶׁהוּא לֹא מַכִּיר, הַאִם זֶה מְסַקְרֵן אוֹתוֹ?",
    "question-joy-d3": "בַּשּׁוֹנִית, כְּשֶׁיֵּשׁ דָּבָר חָדָשׁ, הַאִם נוּנִי שָׂמֵחַ לְנַסּוֹת?",
    "question-joy-d4": "כְּשֶׁנוּנִי לוֹמֵד מַשֶּׁהוּ חָדָשׁ, הַאִם זֶה עוֹשֶׂה לוֹ נָעִים בַּלֵּב?",
}


async def synth(name: str, text: str, out_dir: Path, force: bool) -> str:
    out = out_dir / f"{name}.mp3"
    if out.exists() and not force:
        return "skip"
    # 1) edge-tts → קובץ זמני
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    try:
        communicate = edge_tts.Communicate(text=text, voice=VOICE, rate=RATE, pitch=PITCH)
        await communicate.save(str(tmp_path))
        # 2) ffmpeg rubberband → עיבוד הדמות → קובץ סופי
        r = subprocess.run(
            ["ffmpeg", "-y", "-i", str(tmp_path),
             "-filter:a", f"rubberband=pitch={PITCH_SHIFT}",
             "-b:a", "128k", str(out)],
            capture_output=True, text=True)
        if not (out.exists() and out.stat().st_size > 500):
            return f"FAIL ffmpeg: {r.stderr[-200:]}"
        return f"OK ({out.stat().st_size // 1024}KB)"
    finally:
        tmp_path.unlink(missing_ok=True)


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="מייצר הכל מחדש")
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    DRAFTS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"קול: {VOICE} · עיבוד דמות: pitch ×{PITCH_SHIFT} · ניקוד מלא")
    print(f"מצב: {'force' if args.force else 'skip-if-exists'}\n")

    print("─── 14 מאושרים ───")
    for name, text in CLIPS.items():
        print(f"  {name:24s} → {await synth(name, text, OUT_DIR, args.force)}")
    print("─── 16 טיוטות → drafts/ ───")
    for name, text in DRAFTS.items():
        print(f"  {name:24s} → {await synth(name, text, DRAFTS_DIR, args.force)}")
    print(f"\n✅ {len(CLIPS)} מאושרים + {len(DRAFTS)} טיוטות.")


if __name__ == "__main__":
    asyncio.run(main())
