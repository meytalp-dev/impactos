// Story 13b — Teacher Content Studio screenshots for completion report.
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', '_handoff', 'studio-ui-screenshots');

test.describe('Story 13b · Studio screenshots', () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  });

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

  test('01-onboarding-tour-step-1', async ({ page }) => {
    await page.goto('/teacher-studio.html?guest=1');
    await page.waitForSelector('#studioTourOverlay');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-onboarding-tour.png'), fullPage: false });
  });

  test('02-step-1-island-mechanic', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('studio-onboarded', '1'));
    await page.goto('/teacher-studio.html?guest=1');
    await page.waitForSelector('.island-grid');
    await page.locator('[data-island="3"]').click();
    await page.waitForSelector('.mechanic-grid');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-step1-island-mechanic.png'), fullPage: false });
  });

  test('03-step-2-tap-all-form', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('studio-onboarded', '1'));
    await page.goto('/teacher-studio.html?guest=1');
    await page.locator('[data-island="3"]').click();
    await page.locator('[data-mechanic="tap-all"]').click();
    await page.locator('#navNext').click();
    await page.selectOption('[data-field="letter"]', 'מ');
    const chipField = page.locator('[data-chip-add]');
    for (const letter of ['סַ', 'טַ', 'הַ']) {
      await chipField.fill(letter);
      await chipField.press('Enter');
    }
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-step2-tap-all-with-preview.png'), fullPage: false });
  });

  test('04-step-3-review', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('studio-onboarded', '1'));
    await page.goto('/teacher-studio.html?guest=1');
    await page.locator('[data-island="3"]').click();
    await page.locator('[data-mechanic="tap-all"]').click();
    await page.locator('#navNext').click();
    await page.selectOption('[data-field="letter"]', 'מ');
    const chipField = page.locator('[data-chip-add]');
    for (const letter of ['סַ', 'טַ', 'הַ']) {
      await chipField.fill(letter);
      await chipField.press('Enter');
    }
    await page.locator('#navNext').click();
    await page.waitForSelector('.checklist');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04-step3-review.png'), fullPage: false });
  });

  test('05-validator-modal', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('studio-onboarded', '1'));
    await page.goto('/teacher-studio.html?guest=1');
    await page.locator('[data-island="3"]').click();
    await page.locator('[data-mechanic="tap-all"]').click();
    await page.locator('#navNext').click();
    // Don't fill letter — click next would be disabled.
    // To force modal: fill letter then publish from step 3 without distractors.
    await page.selectOption('[data-field="letter"]', 'מ');
    await page.locator('#navNext').click();
    await page.locator('#publishBtn').click();
    await page.waitForSelector('#errClose', { timeout: 3000 }).catch(() => {});
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05-validator-modal.png'), fullPage: false });
  });

  test('06-feedback-widget-open', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('studio-onboarded', '1'));
    await page.goto('/teacher-studio.html?guest=1');
    await page.locator('#studioFeedbackFab').click();
    await page.waitForSelector('#fbSubmit');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06-feedback-widget.png'), fullPage: false });
  });
});
