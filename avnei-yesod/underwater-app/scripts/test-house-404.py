#!/usr/bin/env python3
"""בודק איזה משאב חסר ב-house.html"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    failures = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        page.on("response", lambda resp: failures.append(resp.url) if resp.status >= 400 else None)
        await page.goto("https://impact-os.app/avnei-yesod/underwater-app/stage-3-house.html",
                        wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)
        await browser.close()
    print(f"\nFailed resources ({len(failures)}):")
    for url in failures:
        print(f"  {url}")

if __name__ == "__main__":
    asyncio.run(main())
