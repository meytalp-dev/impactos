#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""generate-mishmish-audio.py — מייצר את קליפי-היעד (עברית, קול-מישמיש) לכל
מפתחות-האודיו בכל ה-packs תחת data/, + QA תמלול-Whisper.

מה נאסף (deliverable א):
  • mapping/market  items  → key=item.id           , text=prompt.audio_he|he
  • lexicon                → key=lexeme.audio_he     ('lex/*'), text=lexeme.he
  • patterns               → key=pattern.audio_frame ('pat/*'), text=sanitize(frame)
  • contrasts              → key=contrast.audio[i]   ('con/*'), text=words[0][i]
  • scaffold.amir_hints.he → key='amir/<tier>-he'    , text=tier.he

הפרדת-קול (deliverable ב): יעד-עברית=קול-מישמיש. פיגום-עאמייה=קול-אמיר, 🔴 מגודר —
נאסף לרשימת-hook ומדווח, אך לא מסונתז עד בודק/ת ילידי/ת (ראו _mishmish_tts.AMIYA_ENABLED).

QA (deliverable ג): כל קליפ מתומלל ב-Whisper (small, he, בלי הטיה) — הסוכן לא שומע,
התמלול הוא האימות. השוואת שלד-עיצורים; אי-התאמה → WARN לדוח → asks.meytal.
ניקוד: כתיב-חסר קודם ואז רפה/דגש (KNOWN_WORD_FIXES ב-_mishmish_tts). בלי "יופי".

פלט:
  ../assets/audio/<rel>.mp3
  ../assets/audio/manifest.json          (key → rel  — audio.js טוען אוטומטית)
  ./mishmish-audio-report.json           (QA: expect/heard/verdict + gated_amiya)

הרצה: PYTHONIOENCODING=utf-8 python scripts/generate-mishmish-audio.py [--force] [--no-qa] [--only STR] [--dry]
"""
import argparse
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).parent))
import _mishmish_tts as tts  # noqa: E402

ROOT = Path(__file__).parent.parent          # .../mishmish
DATA = ROOT / "data"
AUDIO = ROOT / "assets" / "audio"

FINALS = {"ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ"}


# ─── עזרי-טקסט ───
def de_niqud(s: str) -> str:
    return "".join(c for c in (s or "") if not ("֑" <= c <= "ׇ"))


WEAK = set("אהוי")  # אימות-קריאה — ניטרלי לכתיב-מלא/חסר (צפור/ציפור, תפוח/תפוחה)


def skeleton(s: str) -> str:
    """שלד-עיצורים: אותיות עבריות בלבד, סופיות מנורמלות — להשוואת QA."""
    out = []
    for c in de_niqud(s):
        c = FINALS.get(c, c)
        if "א" <= c <= "ת":
            out.append(c)
    return "".join(out)


def strong_skeleton(s: str) -> str:
    """שלד-חזק: שלד ללא אותיות-אם — מבטל false-positive של כתיב-מלא מול חסר."""
    return "".join(c for c in skeleton(s) if c not in WEAK)


def qa_verdict(expect: str, heard: str) -> str:
    """ok אם השלד-החזק תואם/מוכל (Whisper-small רועש על מילים קצרות/בודדות);
    אחרת WARN → אימות-אוזן ע"י מיטל. הסוכן לא שומע — זה גבול-האימות."""
    e, h = strong_skeleton(expect), strong_skeleton(heard)
    if e and (e == h or e in h or h in e):
        return "ok"
    return "WARN"


def sanitize_frame(frame: str) -> str:
    """frame לתצוגה → טקסט-דיבור: '·'→עצירת-משפט, '___'→פאוזה, רווחים מכווצים."""
    t = (frame or "").replace("·", ". ").replace("___", "…")
    return " ".join(t.split())


# שמות-התקן השמורים ב-Windows — git.exe (Win32) לא יכול לפתוח נתיב שמכיל רכיב
# כזה, גם אם MSYS/ls רואה אותו. מסננים רק את ה-rel (הנתיב על הדיסק + ערך-manifest):
# con→conc. ה-key נשאר כמות-שהוא (מזהה לוגי בדאטת-המשחקים), אז שום pack לא נגע.
_WIN_RESERVED = {"con", "prn", "aux", "nul"} | {f"com{i}" for i in range(1, 10)} | {f"lpt{i}" for i in range(1, 10)}


def _safe_seg(seg: str) -> str:
    stem = seg.split(".", 1)[0]
    return stem + "c" + seg[len(stem):] if stem.lower() in _WIN_RESERVED else seg


def safe_rel(rel: str) -> str:
    """ממפה רכיבי-נתיב שמורים ל-<name>c (con/abba.mp3 → conc/abba.mp3)."""
    return "/".join(_safe_seg(p) for p in rel.split("/"))


# ─── איסוף ה-specs (key, rel, text_spoken, text_display) ───
def load(name):
    p = DATA / name
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def collect():
    """מחזיר (he_specs, gated_amiya) — he_specs = list[dict(key,rel,spoken,display,src)]."""
    he, gated = [], []

    for pack_path in sorted(DATA.glob("pack-*.json")):
        pk = json.loads(pack_path.read_text(encoding="utf-8"))
        pid = pk.get("pack")
        mech = pk.get("mechanic")

        # ── packs עשירים (lexicon/patterns/contrasts) ──
        for lex in pk.get("lexicon", []) or []:
            k = lex.get("audio_he")
            if k:
                he.append({"key": k, "rel": k + ".mp3", "spoken": lex.get("he", ""),
                           "display": lex.get("he", ""), "src": f"{pid}:lex:{lex.get('id')}"})
            if lex.get("audio_amiya"):
                gated.append({"key": lex["audio_amiya"], "text": lex.get("cognate_ar", ""),
                              "src": f"{pid}:lex:{lex.get('id')}", "ar_verified": lex.get("ar_verified", False)})

        for pat in pk.get("patterns", []) or []:
            k = pat.get("audio_frame")
            if k:
                frame = pat.get("frame", "")
                he.append({"key": k, "rel": k + ".mp3", "spoken": sanitize_frame(frame),
                           "display": frame, "src": f"{pid}:pat:{pat.get('id')}"})

        for con in pk.get("contrasts", []) or []:
            audio = con.get("audio") or []
            words = (con.get("words") or [[]])[0]
            for i, k in enumerate(audio):
                w = words[i] if i < len(words) else ""
                he.append({"key": k, "rel": k + ".mp3", "spoken": w, "display": w,
                           "src": f"{pid}:con:{'/'.join(con.get('pair', []))}"})

        # ── packs שטוחים (items · mapping=lantern / market=play) ──
        for it in pk.get("items", []) or []:
            prompt = it.get("prompt") or {}
            spoken = prompt.get("audio_he") or prompt.get("he") or ""
            display = prompt.get("he") or spoken
            if not spoken:
                continue
            if mech == "give-me":               # play.js: clipMap[id] = pack/target.mp3
                rel = f"{pid}/{it.get('target')}.mp3"
            elif mech == "lantern":             # lantern.js: key = item.id
                rel = f"{pid}/{it.get('id')}.mp3"
            else:
                rel = f"{pid}/{it.get('id')}.mp3"
            he.append({"key": it.get("id"), "rel": rel, "spoken": spoken,
                       "display": display, "src": f"{pid}:item:{it.get('id')}"})
            for ark in ("help_ar",):
                if it.get(ark):
                    gated.append({"key": f"{pid}:{it.get('id')}:{ark}", "text": it[ark],
                                  "src": f"{pid}:item:{it.get('id')}",
                                  "ar_verified": it.get("help_ar_verified", False)})

    # ── scaffold: amir_hints.he (קול-מישמיש) + .ar (מגודר) ──
    sc = load("scaffold.json") or {}
    for tier in ((sc.get("amir_hints") or {}).get("tiers") or []):
        name = tier.get("tier")
        if tier.get("he"):
            he.append({"key": f"amir/{name}-he", "rel": f"amir/{name}-he.mp3",
                       "spoken": tier["he"], "display": tier["he"], "src": f"scaffold:amir:{name}"})
        if tier.get("ar"):
            gated.append({"key": f"amir/{name}-ar", "text": tier["ar"],
                          "src": f"scaffold:amir:{name}", "ar_verified": tier.get("ar_verified", False)})

    # de-dup לפי key (הראשון מנצח) — שומר יציבות-manifest
    seen, uniq = set(), []
    for s in he:
        if s["key"] and s["key"] not in seen:
            seen.add(s["key"])
            uniq.append(s)
    # סינון-נתיב לשמות-התקן שמורים ב-Windows (con→conc) — key נשאר, רק rel/הדיסק
    for s in uniq:
        s["rel"] = safe_rel(s["rel"])
    return uniq, gated


# ─── main ───
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="ייצר-מחדש קליפים קיימים")
    ap.add_argument("--no-qa", action="store_true", help="דלג על תמלול-Whisper")
    ap.add_argument("--only", default=None, help="סנן לפי תת-מחרוזת ב-key")
    ap.add_argument("--pack", action="append", default=None,
                    help="הגבל לפאק/ים (id מתוך src, למשל mapping/market). ניתן לחזור.")
    ap.add_argument("--dry", action="store_true", help="הצג מה ייווצר בלי לסנתז")
    args = ap.parse_args()

    he, gated = collect()
    if args.only:
        he = [s for s in he if args.only in s["key"]]
    if args.pack:
        he = [s for s in he if s["src"].split(":", 1)[0] in args.pack]

    print(f"קול-מישמיש (יעד-עברית) = {tts.VOICE_MISHMISH}  ·  model {tts.MODEL_ID}")
    print(f"נאספו {len(he)} קליפי-עברית  ·  {len(gated)} עאמייה 🔴 מגודרים (hook בלבד)\n")

    if args.dry:
        for s in he:
            print(f"  {s['key']:34s} → {s['rel']:28s} «{s['spoken']}»")
        print(f"\n[dry] {len(he)} קליפים ייווצרו. עאמייה מגודרת:")
        for g in gated:
            print(f"  🔒 {g['key']:34s} «{g['text']}»  ({g['src']})")
        return

    if tts.client() is None:
        print("🔴 ELEVENLABS_API_KEY חסר ב-.env — עצירה.")
        sys.exit(1)

    # ── סינתזה ──
    made, skipped = [], []
    for s in he:
        dst = AUDIO / s["rel"]
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists() and not args.force:
            skipped.append(s["key"])
            print(f"  skip  {s['key']:34s} (קיים)")
            continue
        tts.synth_hebrew(s["spoken"], dst)
        made.append(s["key"])
        print(f"  synth {s['key']:34s} «{s['spoken']}»")
    print(f"\nסונתזו {len(made)} · דילוג {len(skipped)}")

    # ── manifest — רק קליפים שקיימים בפועל על-הדיסק (מיזוג עם הקיים כדי לתמוך
    #    ביצירה-מדורגת פר-pack). audio.js טוען אותו ולעולם לא מצביע על קובץ-חסר. ──
    mpath = AUDIO / "manifest.json"
    manifest = {}
    if mpath.exists():
        try:
            manifest = json.loads(mpath.read_text(encoding="utf-8"))
        except Exception:
            manifest = {}
    for s in he:
        if (AUDIO / s["rel"]).exists():
            manifest[s["key"]] = s["rel"]
    manifest = {k: manifest[k] for k in sorted(manifest)}
    mpath.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ manifest → assets/audio/manifest.json ({len(manifest)} מפתחות קיימים)")

    # ── QA: תמלול-Whisper (הסוכן לא שומע — זה האימות) ──
    rows = []
    if not args.no_qa:
        print("\nטוען Whisper (small)…")
        import whisper
        model = whisper.load_model("small")
        for s in he:
            dst = AUDIO / s["rel"]
            if not dst.exists():
                continue
            r = model.transcribe(str(dst), language="he", fp16=False)
            heard = (r.get("text") or "").strip()
            verdict = qa_verdict(s["display"], heard)
            rows.append({"key": s["key"], "src": s["src"], "spoken": s["spoken"],
                         "expect": de_niqud(s["display"]), "heard": heard,
                         "expect_skeleton": skeleton(s["display"]), "heard_skeleton": skeleton(heard),
                         "verdict": verdict})
            mark = "✓" if verdict == "ok" else "⚠"
            print(f"  {mark} [{s['key']:30s}] «{de_niqud(s['display'])}» → «{heard}»")

    warns = [r for r in rows if r["verdict"] == "WARN"]
    report = {
        "voice_mishmish": tts.VOICE_MISHMISH,
        "model": tts.MODEL_ID,
        "he_clips": len(he), "synthesized": len(made), "skipped": len(skipped),
        "qa_ok": len([r for r in rows if r["verdict"] == "ok"]),
        "qa_warn": len(warns),
        "gated_amiya": gated,          # 🔴 hook: פר בודק/ת ילידי/ת, לא מסונתז
        "rows": rows,
    }
    rp = Path(__file__).parent / "mishmish-audio-report.json"
    rp.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n✅ דוח → scripts/mishmish-audio-report.json  ·  QA: {report['qa_ok']} ok / {len(warns)} ⚠")
    if warns:
        print("⚠ אי-התאמות-תמלול (→ asks.meytal):")
        for w in warns:
            print(f"    {w['key']}: expect «{w['expect']}» heard «{w['heard']}»")
    print(f"🔒 עאמייה מגודרת: {len(gated)} מחרוזות → asks.native (tools/arabic-review-tool.html)")


if __name__ == "__main__":
    main()
