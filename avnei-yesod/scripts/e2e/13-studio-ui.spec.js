// Story 13 — Teacher Content Studio UI smoke test.
// Verifies wizard 3-step flow + preview + validation + feedback widget + onboarding tour.
const { test, expect } = require('@playwright/test');

test.describe('Story 13 · Teacher Content Studio (teacher-studio.html)', () => {
  // One-shot localStorage clear (NOT via addInitScript — that re-runs on every nav,
  // which would defeat tests that verify onboarding flag persistence across reload).
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.removeItem('studio-onboarded');
        localStorage.removeItem('studio-feedback-log');
        localStorage.removeItem('studio-drafts');
        localStorage.removeItem('studio-published');
      } catch (e) {}
    });
  });

  test('page loads with ?guest=1 without console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/teacher-studio.html?guest=1');
    await expect(page.locator('.studio-header')).toBeVisible();
    await expect(page.locator('.studio-wizard')).toBeVisible();
    await expect(page.locator('.studio-preview')).toBeVisible();
    // Wait a beat for tour to appear / errors to surface
    await page.waitForTimeout(400);
    expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('onboarding tour appears on first visit, persists dismissal', async ({ page }) => {
    await page.goto('/teacher-studio.html?guest=1');
    const overlay = page.locator('#studioTourOverlay');
    await expect(overlay).toBeVisible({ timeout: 2000 });
    await page.locator('#tourSkip').click();
    await expect(overlay).toBeHidden();
    const onboarded = await page.evaluate(() => localStorage.getItem('studio-onboarded'));
    expect(onboarded).toBe('1');

    await page.reload();
    await page.waitForTimeout(500);
    await expect(page.locator('#studioTourOverlay')).toHaveCount(0);
  });

  test('full wizard flow: island 3 → tap-all → letter מ → distractors → publish', async ({ page }) => {
    await page.goto('/teacher-studio.html?guest=1');
    await page.waitForTimeout(350);
    const tour = page.locator('#tourSkip');
    if (await tour.isVisible().catch(() => false)) await tour.click();

    // Step 1 — choose island 3 + tap-all
    await page.locator('[data-island="3"]').click();
    await expect(page.locator('[data-mechanic="tap-all"]')).toBeVisible();
    await page.locator('[data-mechanic="tap-all"]').click();
    await page.locator('#navNext').click();

    // Step 2 — letter + niqud'd distractors (real pipeline's validator treats bare
    // letters as Hebrew text needing niqud → errors. Use patach to satisfy it.)
    await expect(page.locator('[data-field="letter"]')).toBeVisible();
    await page.selectOption('[data-field="letter"]', 'מ');

    const chipField = page.locator('[data-chip-add]');
    for (const letter of ['סַ', 'טַ', 'הַ']) {  // ס/ט are shape-confusions of מ
      await chipField.fill(letter);
      await chipField.press('Enter');
    }
    await expect(page.locator('.chip')).toHaveCount(3);

    // navNext should be enabled (no hard errors expected)
    await expect(page.locator('#navNext')).toBeEnabled({ timeout: 2000 });
    await page.locator('#navNext').click();

    // Step 3 — review visible
    await expect(page.locator('.checklist')).toBeVisible({ timeout: 2000 });
    await page.locator('#publishBtn').click();

    // missing_audio is a warning → confirmation modal may appear
    const confirmBtn = page.locator('#cw-ok');
    if (await confirmBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Toast appears
    await expect(page.locator('.studio-toast.is-success')).toBeVisible({ timeout: 2000 });

    // Real pipeline stores under 'studio-items-v1' as { drafts, published } object.
    // Stub stored under 'studio-published' as array. Test against both.
    const items = await page.evaluate(() => {
      const all = [];
      const v1 = localStorage.getItem('studio-items-v1');
      if (v1) {
        try {
          const parsed = JSON.parse(v1);
          if (parsed.drafts) all.push(...Object.values(parsed.drafts));
          if (parsed.published) all.push(...Object.values(parsed.published));
        } catch {}
      }
      const stubPub = localStorage.getItem('studio-published');
      if (stubPub) { try { all.push(...JSON.parse(stubPub)); } catch {} }
      return all;
    });
    const found = items.filter(x => x && x.mechanic === 'tap-all' && x.letter === 'מ');
    expect(found.length, `tap-all item with letter מ not found in studio storage`).toBeGreaterThan(0);
  });

  test('validation: cannot advance step 2 with no letter for pick mechanic', async ({ page }) => {
    await page.goto('/teacher-studio.html?guest=1');
    await page.waitForTimeout(350);
    const tour = page.locator('#tourSkip');
    if (await tour.isVisible().catch(() => false)) await tour.click();

    // Pick island 1 (bubbles, supports pick), then pick mechanic
    await page.locator('[data-island="1"]').click();
    await page.locator('[data-mechanic="pick"]').click();
    await page.locator('#navNext').click();

    // Don't fill letter, click next — button should be disabled
    await expect(page.locator('#navNext')).toBeDisabled();
  });

  test('preview iframe updates after picking mechanic + letter', async ({ page }) => {
    await page.goto('/teacher-studio.html?guest=1');
    await page.waitForTimeout(350);
    const tour = page.locator('#tourSkip');
    if (await tour.isVisible().catch(() => false)) await tour.click();

    // Initially: placeholder, no iframe
    await expect(page.locator('#previewViewport .preview-placeholder')).toBeVisible();

    await page.locator('[data-island="3"]').click();
    await page.locator('[data-mechanic="tap-all"]').click();
    await page.locator('#navNext').click();
    await page.selectOption('[data-field="letter"]', 'ש');

    // Wait for debounced preview update
    await page.waitForTimeout(600);
    const iframe = page.locator('#previewViewport iframe');
    await expect(iframe).toBeVisible();
    const iframeBody = iframe.contentFrame();
    if (iframeBody) {
      // Preview body should contain the letter we chose
      const text = await iframeBody.locator('body').innerText().catch(() => '');
      expect(text).toContain('ש');
    }
  });

  test('feedback widget opens modal and saves to localStorage', async ({ page }) => {
    await page.goto('/teacher-studio.html?guest=1');
    await page.waitForTimeout(350);
    const tour = page.locator('#tourSkip');
    if (await tour.isVisible().catch(() => false)) await tour.click();

    await page.locator('#studioFeedbackFab').click();
    await expect(page.locator('#fbSubmit')).toBeVisible();
    await page.fill('#fbWanted', 'לבדוק את הסטודיו');
    await page.fill('#fbHappened', 'הכל עובד');
    await page.locator('[data-urg="compliment"]').click();
    await page.locator('#fbSubmit').click();

    await expect(page.locator('.studio-toast.is-success')).toBeVisible({ timeout: 2000 });

    const log = await page.evaluate(() => JSON.parse(localStorage.getItem('studio-feedback-log') || '[]'));
    expect(log.length).toBe(1);
    expect(log[0].wanted).toBe('לבדוק את הסטודיו');
    expect(log[0].category).toBe('compliment');
  });

  test('niqud button calls applyNiqud (stub returns same text)', async ({ page }) => {
    await page.goto('/teacher-studio.html?guest=1');
    await page.waitForTimeout(350);
    const tour = page.locator('#tourSkip');
    if (await tour.isVisible().catch(() => false)) await tour.click();

    await page.locator('[data-island="3"]').click();
    await page.locator('[data-mechanic="pick"]').click();
    await page.locator('#navNext').click();

    // Wait for the prompt_text field to appear
    await expect(page.locator('[data-field="prompt_text"]')).toBeVisible();

    await page.fill('[data-field="prompt_text"]', 'איזו אות זאת');
    await page.locator('[data-niqud="prompt_text"]').click();
    // Stub returns same text; we just need to verify no crash + toast
    await expect(page.locator('.studio-toast.is-success')).toBeVisible({ timeout: 2000 });
  });
});
