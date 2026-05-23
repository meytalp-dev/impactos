#!/usr/bin/env python3
"""
Smoke test לכל 5 המשחקונים של אי 3.
בודק: טעינה, אין שגיאות JS, רכיבי מפתח, BKT/EventLogger נטענים.
"""
import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).parent.parent
SHOTS_DIR = ROOT / "scripts" / "test-screenshots-all"
SHOTS_DIR.mkdir(parents=True, exist_ok=True)

BASE = "https://impact-os.app/avnei-yesod/underwater-app"

GAMES = [
    ("shell",  "stage-3-shell.html",       "מ", "הצדף הקסום"),
    ("rescue", "stage-3-rescue.html",      "ק", "הצלת הדגים"),
    ("house",  "stage-3-house.html",       "ב", "הבית של נוני"),
    ("trail",  "stage-3-trail-resh.html",  "ר", "שביל החזרה"),
    ("storm",  "stage-3-storm.html",       "ת", "ציד האורות"),
]


async def test_one_game(p, game_id, file, letter, name):
    """בודק משחקון אחד. מחזיר dict עם תוצאות."""
    errors = []
    warnings = []
    results = {
        "id": game_id, "file": file, "letter": letter, "name": name,
        "loads": False, "no_js_errors": True, "bkt_loaded": False,
        "logger_loaded": False, "noni_present": False, "errors": [],
    }

    browser = await p.chromium.launch(headless=True)
    context = await browser.new_context(viewport={"width": 1280, "height": 800}, locale="he-IL")
    page = await context.new_page()

    page.on("console", lambda msg: (
        errors.append(msg.text) if msg.type == "error" else
        warnings.append(msg.text) if msg.type == "warning" else None
    ))
    page.on("pageerror", lambda exc: errors.append(f"PAGE ERROR: {exc}"))

    url = f"{BASE}/{file}"
    print(f"\n[{game_id}] {name} (אות {letter})")
    print(f"  URL: {url}")

    try:
        await page.goto(url, wait_until="networkidle", timeout=30000)
        results["loads"] = True
        print("  ✓ נטען")
    except Exception as e:
        print(f"  ✗ טעינה נכשלה: {e}")
        results["errors"].append(f"load: {e}")
        await browser.close()
        return results

    await page.wait_for_timeout(2500)

    # בדיקות
    bkt_loaded = await page.evaluate("typeof window.AvneiBKT !== 'undefined'")
    logger_loaded = await page.evaluate("typeof window.AvneiEventLogger !== 'undefined'")
    noni_count = await page.locator(".noni, [class*='noni'], img[id*='noni'], img[class*='noni']").count()

    results["bkt_loaded"] = bkt_loaded
    results["logger_loaded"] = logger_loaded
    results["noni_present"] = noni_count > 0

    print(f"  {'✓' if bkt_loaded else '✗'} BKT loaded")
    print(f"  {'✓' if logger_loaded else '✗'} EventLogger loaded")
    print(f"  {'✓' if noni_count > 0 else '✗'} נוני בעמוד ({noni_count} מופעים)")

    results["no_js_errors"] = len(errors) == 0
    results["errors"] = errors[:5]
    print(f"  {'✓' if len(errors) == 0 else '✗'} שגיאות JS: {len(errors)}")
    for e in errors[:3]:
        print(f"    ! {e[:120]}")

    await page.screenshot(path=str(SHOTS_DIR / f"{game_id}.png"))

    await browser.close()
    return results


async def main():
    print("=" * 70)
    print("בדיקה מקיפה — 5 משחקונים של אי 3")
    print("=" * 70)

    all_results = []
    async with async_playwright() as p:
        for game_id, file, letter, name in GAMES:
            r = await test_one_game(p, game_id, file, letter, name)
            all_results.append(r)

    # סיכום
    print("\n" + "=" * 70)
    print("סיכום כללי")
    print("=" * 70)
    print(f"{'משחקון':<12} {'אות':<5} {'נטען':<7} {'BKT':<7} {'Logger':<8} {'נוני':<7} {'JS OK':<7}")
    print("-" * 70)
    for r in all_results:
        sym = lambda b: "✓" if b else "✗"
        print(f"{r['id']:<12} {r['letter']:<5} {sym(r['loads']):<7} {sym(r['bkt_loaded']):<7} {sym(r['logger_loaded']):<8} {sym(r['noni_present']):<7} {sym(r['no_js_errors']):<7}")

    total_ok = sum(1 for r in all_results if r['loads'] and r['bkt_loaded'] and r['logger_loaded'] and r['no_js_errors'])
    print(f"\n{total_ok}/5 משחקונים תקינים לחלוטין")
    print(f"צילומי מסך: {SHOTS_DIR}")

    if total_ok < 5:
        print("\n⚠ בעיות שזוהו:")
        for r in all_results:
            if not (r['loads'] and r['bkt_loaded'] and r['logger_loaded'] and r['no_js_errors']):
                print(f"  - {r['id']} ({r['name']}):")
                if not r['loads']: print("    × לא נטען")
                if not r['bkt_loaded']: print("    × BKT לא טעון")
                if not r['logger_loaded']: print("    × EventLogger לא טעון")
                if not r['no_js_errors']:
                    print(f"    × {len(r['errors'])} שגיאות JS")
                    for e in r['errors'][:2]:
                        print(f"      ! {e[:120]}")

    sys.exit(0 if total_ok == 5 else 1)


if __name__ == "__main__":
    asyncio.run(main())
