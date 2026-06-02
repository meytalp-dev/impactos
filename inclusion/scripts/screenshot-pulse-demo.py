#!/usr/bin/env python3
"""
צילום screenshots מהדמו של פולס נוני — לשילוב במצגת הראשית.

מייצר 2 תמונות:
  1. pulse-question-noni.png  — מסך שאלה מתחנה 2 (חברים) עם נוני
  2. pulse-dashboard-teacher.png — דשבורד מחנכת עם 18 תלמידים (כיתה א1)

יעד: שני מקומות —
  - inclusion/screenshots/   (גיבוי בריפו שלנו)
  - ../impactso/site/avnei-board-assets/  (איפה שהמצגת של ליאור מחפשת)

דורש: pip install playwright + python -m playwright install chromium
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

# Windows UTF-8 console
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = Path(__file__).parent.parent
LOCAL_OUT = ROOT / "screenshots"
LOCAL_OUT.mkdir(exist_ok=True)

# הריפו של ליאור — אם קיים נעתיק לשם גם
LIRON_ASSETS = Path("c:/Users/meyta/Downloads/impactso/site/avnei-board-assets")

QUESTIONNAIRE_URL = "file:///" + str((ROOT / "pulse-questionnaire.html").resolve()).replace("\\", "/")
DASHBOARD_URL     = "file:///" + str((ROOT / "pulse-dashboard.html").resolve()).replace("\\", "/")


def screenshot_questionnaire(page) -> Path:
    """מצלם מסך שאלה ראשונה (תחנה 1 - מקום, צבע צהוב) עם נוני באלמוג."""
    print("  → questionnaire …", flush=True)
    page.goto(QUESTIONNAIRE_URL, wait_until="networkidle")
    page.wait_for_selector("text=בּוֹאוּ נַתְחִיל", timeout=10_000)
    page.click("text=בּוֹאוּ נַתְחִיל")

    # bridge — gate ~2.5s
    page.wait_for_timeout(3_200)
    page.click("#btn-bridge-next")

    # setup adjust — gate ~2.5s
    page.wait_for_timeout(3_200)
    page.click("#btn-setup-next")

    # question adjust visible — settle for audio + visual
    page.wait_for_selector("#screen-question.active", timeout=8_000)
    page.wait_for_timeout(1_800)

    out = LOCAL_OUT / "pulse-question-noni.png"
    page.screenshot(path=str(out), full_page=False)
    print(f"    ✓ {out.name}  ({out.stat().st_size // 1024} KB)")
    return out


def screenshot_dashboard(page) -> Path:
    """מצלם דשבורד עם 18 תלמידים בכיתה א1."""
    print("  → dashboard …", flush=True)
    page.goto(DASHBOARD_URL, wait_until="networkidle")
    page.evaluate("seedData()")
    page.wait_for_function("getSubmissions().length > 0", timeout=5_000)
    page.wait_for_timeout(400)

    # עבור לתצוגת כיתה א1 (לא layer) — מציג את ה-hero + dim bars + map
    page.evaluate("document.getElementById('class-select').value = 'א1'; render();")
    page.wait_for_selector(".hero-card", timeout=5_000)
    page.wait_for_timeout(600)

    out = LOCAL_OUT / "pulse-dashboard-teacher.png"
    page.screenshot(path=str(out), full_page=True)
    print(f"    ✓ {out.name}  ({out.stat().st_size // 1024} KB)")
    return out


def screenshot_layer(page) -> Path:
    """מצלם מבט שכבה (מנהלת) — 3 כיתות עם stats."""
    print("  → layer view …", flush=True)
    page.goto(DASHBOARD_URL, wait_until="networkidle")
    page.evaluate("seedData()")
    page.wait_for_function("getSubmissions().length > 0", timeout=5_000)
    page.evaluate("document.getElementById('class-select').value = 'layer'; render();")
    page.wait_for_selector(".class-card", timeout=5_000)
    page.wait_for_timeout(600)

    out = LOCAL_OUT / "pulse-dashboard-layer.png"
    page.screenshot(path=str(out), full_page=True)
    print(f"    ✓ {out.name}  ({out.stat().st_size // 1024} KB)")
    return out


def copy_to_liron(files: list[Path]) -> None:
    if not LIRON_ASSETS.exists():
        print(f"  ⚠️  לא נמצא: {LIRON_ASSETS} — מדלג על העתקה.")
        return
    import shutil
    for f in files:
        dst = LIRON_ASSETS / f.name
        shutil.copy2(f, dst)
        print(f"    📋 {dst}")


def main() -> None:
    print("צילום screenshots מ-pulse demo …")
    print(f"  questionnaire: {QUESTIONNAIRE_URL}")
    print(f"  dashboard:     {DASHBOARD_URL}")
    print("───")

    with sync_playwright() as p:
        # Tablet viewport לשאלון (כי זה הקונטקסט האמיתי)
        browser = p.chromium.launch(headless=True, args=["--mute-audio"])

        # ─── Questionnaire (tablet portrait) ───
        ctx_tablet = browser.new_context(
            viewport={"width": 768, "height": 1024},
            device_scale_factor=2,
            locale="he-IL",
        )
        page = ctx_tablet.new_page()
        q_file = screenshot_questionnaire(page)
        ctx_tablet.close()

        # ─── Dashboard (desktop) ───
        ctx_desktop = browser.new_context(
            viewport={"width": 1280, "height": 1800},
            device_scale_factor=2,
            locale="he-IL",
        )
        page = ctx_desktop.new_page()
        d_file = screenshot_dashboard(page)
        page = ctx_desktop.new_page()
        l_file = screenshot_layer(page)
        ctx_desktop.close()

        browser.close()

    print("───")
    print("העתקה לריפו של ליאור (impactso/site/avnei-board-assets/):")
    copy_to_liron([q_file, d_file, l_file])
    print("───")
    print(f'סה"כ: 3 קבצים. שמורים ב-{LOCAL_OUT}')


if __name__ == "__main__":
    main()
