#!/usr/bin/env python3
"""
gen-pulse-pronunciation-fix.py — תיקון הגייה למסך-הבוקר (setup-adjust) בפולס.

מיטל (9.7.2026): במסך הפולס "הבקרים נאמרים לא טוב, וגם נוני נהגה לא נכון".
הקליפ הנוכחי (setup-adjust) הופק בניקוד מלא — בניגוד ללקח 9.7 ש-eleven_v3
הוגה טוב יותר *בלי* ניקוד (כתיב-חסר קודם; רק אם נכשל → רפה/דגש).

הסקריפט מפיק וריאנטים של המשפט המלא + של שתי המילים הבעייתיות בבידוד,
כדי שמיטל תבחר באוזן. פלט: pulse-grade1/_audio-test/pronun-fix/ + compare page.

שימוש:
  python gen-pulse-pronunciation-fix.py            # מייצר חסרים
  python gen-pulse-pronunciation-fix.py --force    # דורס
"""
import argparse
import os
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

REPO_ROOT = Path(__file__).parent.parent.parent
load_dotenv(REPO_ROOT / ".env")

API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
if not API_KEY:
    print(f"❌ ELEVENLABS_API_KEY לא נמצא ב-{REPO_ROOT / '.env'}", file=sys.stderr)
    sys.exit(1)

VOICE_ID = "ZI6I4a3UGgs1DXxqWjBV"   # קול נוני
MODEL_ID = "eleven_v3"              # תומך עברית רשמית
OUT_DIR = Path(__file__).parent.parent / "_audio-test" / "pronun-fix"

# ─── וריאנטים של המשפט המלא ───
# הערה: "שֶׁקַּל" נשאר מנוקד תמיד — בלי ניקוד "שקל" נהגה /shekel/ (כסף).
SENTENCE = [
    ("A-baseline",
     "כָּל בֹּקֶר נוּנִי מַגִּיעַ לַשּׁוֹנִית. יֵשׁ בְּקָרִים שֶׁקַּל לוֹ, וְיֵשׁ בְּקָרִים שֶׁקְּצָת פָּחוֹת.",
     "המצב הנוכחי (ניקוד מלא)"),
    ("B-mornings-plain",
     "כָּל בֹּקֶר נוּנִי מַגִּיעַ לַשּׁוֹנִית. יֵשׁ בקרים שֶׁקַּל לוֹ, וְיֵשׁ בקרים שֶׁקְצָת פָּחוֹת.",
     "בקרים בלי ניקוד · נוני נשאר"),
    ("C-both-fixed",
     "כָּל בֹּקֶר נוּני מַגִּיעַ לַשּׁוֹנִית. יֵשׁ בקרים שֶׁקַּל לוֹ, וְיֵשׁ בקרים שֶׁקְצָת פָּחוֹת.",
     "בקרים בלי ניקוד · נוני = שורוק בלי חיריק סופי"),
    ("D-noni-plain",
     "כָּל בֹּקֶר נוני מַגִּיעַ לַשּׁוֹנִית. יֵשׁ בקרים שֶׁקַּל לוֹ, וְיֵשׁ בקרים שֶׁקְצָת פָּחוֹת.",
     "בקרים + נוני שניהם בלי ניקוד"),
]

# ─── המילים הבעייתיות בבידוד (קל יותר לשמוע את ההבדל) ───
WORDS = [
    ("word-mornings-1", "בְּקָרִים", "בקרים · ניקוד מלא (נוכחי)"),
    ("word-mornings-2", "בקרים", "בקרים · בלי ניקוד"),
    ("word-mornings-3", "בְקָרִים", "בקרים · שווא בלי דגש"),
    ("word-noni-1", "נוּנִי", "נוני · שורוק+חיריק (נוכחי)"),
    ("word-noni-2", "נוּני", "נוני · שורוק בלי חיריק"),
    ("word-noni-3", "נוני", "נוני · בלי ניקוד"),
]


def gen_one(client, text, out_path, force):
    if out_path.exists() and not force and out_path.stat().st_size > 100:
        return "skip (קיים)"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        audio_iter = client.text_to_speech.convert(
            voice_id=VOICE_ID, text=text, model_id=MODEL_ID,
            output_format="mp3_44100_128",
        )
        with open(out_path, "wb") as f:
            for chunk in audio_iter:
                if chunk:
                    f.write(chunk)
        if out_path.exists() and out_path.stat().st_size > 100:
            return f"OK ({out_path.stat().st_size // 1024}KB)"
        return "FAIL (ריק)"
    except Exception as e:
        return f"FAIL: {e}"


def build_compare_html(out_dir):
    def cells(items):
        rows = []
        for slug, text, desc in items:
            rows.append(
                f'<div class="cell"><div class="cell-text">{text}</div>'
                f'<div class="cell-desc">{desc}</div>'
                f'<audio controls src="{slug}.mp3"></audio></div>'
            )
        return "\n".join(rows)

    html = f"""<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>תיקון הגייה · מסך הבוקר · פולס</title>
<style>
  body {{ font-family: "Heebo", Arial, sans-serif; max-width: 900px; margin: 0 auto;
         padding: 28px 18px 64px; background: #F7F4EE; color: #2b2b2b; }}
  h1 {{ font-size: 1.5rem; }}
  h2 {{ font-size: 1.15rem; margin-top: 34px; border-bottom: 2px solid #E6C46A; padding-bottom: 6px; }}
  p.note {{ background: #FFF6DC; border-radius: 10px; padding: 12px 16px; font-size: .95rem; }}
  .grid {{ display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); }}
  .cell {{ background: #fff; border-radius: 12px; padding: 12px 14px; box-shadow: 0 2px 6px rgba(0,0,0,.06); }}
  .cell-text {{ font-size: 1.3rem; margin-bottom: 4px; }}
  .cell-desc {{ color: #777; font-size: .8rem; margin-bottom: 8px; }}
  audio {{ width: 100%; height: 36px; }}
</style>
</head>
<body>
<h1>🔊 תיקון הגייה · מסך הבוקר (setup-adjust)</h1>
<p class="note">מיטל: "הבקרים נאמרים לא טוב, וגם נוני נהגה לא נכון".
בחרי באוזן איזה וריאנט נשמע הכי טוב — ואני אצרוב אותו לקליפ הפרודקשן ואפיק מחדש.</p>

<h2>המשפט המלא</h2>
<div class="grid">
{cells(SENTENCE)}
</div>

<h2>"בקרים" בבידוד</h2>
<div class="grid">
{cells([w for w in WORDS if w[0].startswith("word-mornings")])}
</div>

<h2>"נוני" בבידוד</h2>
<div class="grid">
{cells([w for w in WORDS if w[0].startswith("word-noni")])}
</div>
</body>
</html>
"""
    (out_dir / "compare.html").write_text(html, encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    client = ElevenLabs(api_key=API_KEY)
    items = [(s, t) for s, t, _ in SENTENCE] + [(s, t) for s, t, _ in WORDS]
    print(f"מייצר {len(items)} דגימות · model {MODEL_ID} · voice נוני")
    print(f"פלט: {OUT_DIR}\n")

    fails = 0
    for slug, text in items:
        status = gen_one(client, text, OUT_DIR / f"{slug}.mp3", args.force)
        if status.startswith("FAIL"):
            fails += 1
        print(f"  {slug:20s} → {status}")

    build_compare_html(OUT_DIR)
    print(f"\n{'⚠️ ' + str(fails) + ' נכשלו' if fails else '✅ סיום'}")
    print(f"פתחי: {OUT_DIR / 'compare.html'}")
    if fails:
        sys.exit(1)


if __name__ == "__main__":
    main()
