#!/usr/bin/env python3
"""
Playwright smoke test לאות מ באי 3 (stage-3-shell.html).
חוב #3 שנפתח לאחר הסבב על אות מ.

מטרה: לזהות שגיאות בולטות בלי בדיקה ידנית.
- האם הדף נטען?
- האם יש שגיאות JS בקונסול?
- האם הרכיבים העיקריים מופיעים (נוני, האות, אופציות)?
- צילומי מסך בנקודות מפתח לעין אנושית.

שימוש:
    python test-shell-quest.py

דורש: edge-tts לא — רק playwright (כבר מותקן).
"""
import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).parent.parent
SHOTS_DIR = ROOT / "scripts" / "test-screenshots"
SHOTS_DIR.mkdir(parents=True, exist_ok=True)

# הקובץ ייפתח דרך URL פומבי (חוסך הקמת שרת מקומי)
URL = "https://impact-os.app/avnei-yesod/underwater-app/stage-3-shell.html"


async def run_test():
    errors = []
    warnings = []
    results = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            locale="he-IL",
        )
        page = await context.new_page()

        # אוסף שגיאות JS מהקונסול
        page.on("console", lambda msg: (
            errors.append(msg.text) if msg.type == "error" else
            warnings.append(msg.text) if msg.type == "warning" else None
        ))
        page.on("pageerror", lambda exc: errors.append(f"PAGE ERROR: {exc}"))

        print(f"פותח: {URL}")
        await page.goto(URL, wait_until="networkidle")

        # צילום ראשון — מצב התחלתי
        await page.screenshot(path=str(SHOTS_DIR / "01-initial.png"))
        print(f"  ✓ צילום: 01-initial.png")

        # מחכה לטעינה מלאה של הסצנה
        await page.wait_for_timeout(2000)
        await page.screenshot(path=str(SHOTS_DIR / "02-after-load.png"))

        # בודק אם יש כפתור התחלה / מעבר למשחק
        # מנסה לזהות לפי טקסט נפוץ
        try:
            start_btn = page.locator("text=התחל").first
            if await start_btn.is_visible():
                print("  → לוחץ על 'התחל'")
                await start_btn.click()
                await page.wait_for_timeout(1500)
                await page.screenshot(path=str(SHOTS_DIR / "03-after-start.png"))
        except Exception as e:
            print(f"  ⚠ לא מצא כפתור התחל: {e}")

        # בודק נוכחות נוני
        noni = page.locator(".noni, [class*='noni'], img[alt*='נוני']").first
        results["noni_present"] = await noni.count() > 0
        print(f"  נוני בעמוד: {results['noni_present']}")

        # בודק נוכחות quest header
        quest_header = page.locator(".quest-header, [class*='quest']").first
        results["quest_header_present"] = await quest_header.count() > 0
        print(f"  quest-header בעמוד: {results['quest_header_present']}")

        # בודק נוכחות game area
        game_area = page.locator(".game-area, [class*='game']").first
        results["game_area_present"] = await game_area.count() > 0
        print(f"  game-area בעמוד: {results['game_area_present']}")

        # צילום סופי
        await page.screenshot(path=str(SHOTS_DIR / "04-final.png"))

        await browser.close()

    # סיכום
    print("\n" + "=" * 60)
    print("סיכום בדיקה")
    print("=" * 60)

    print(f"\nרכיבים:")
    for key, val in results.items():
        sym = "✓" if val else "✗"
        print(f"  {sym} {key}")

    print(f"\nשגיאות JS: {len(errors)}")
    for e in errors[:10]:
        print(f"  ✗ {e}")
    if len(errors) > 10:
        print(f"  ... ועוד {len(errors) - 10}")

    print(f"\nאזהרות JS: {len(warnings)}")

    print(f"\nצילומי מסך: {SHOTS_DIR}")
    for shot in sorted(SHOTS_DIR.glob("*.png")):
        size_kb = shot.stat().st_size / 1024
        print(f"  - {shot.name} ({size_kb:.0f}KB)")

    # קוד יציאה
    if errors:
        print("\n⚠ נמצאו שגיאות JS")
        sys.exit(1)
    else:
        print("\n✓ אין שגיאות JS")


if __name__ == "__main__":
    asyncio.run(run_test())
