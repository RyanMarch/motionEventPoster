/**
 * tests/e2e/qr.spec.js
 *
 * QR image upload, display on the poster, thumbnail preview in the controls
 * panel, clear, and localStorage persistence across a page reload.
 *
 * Uses page.setInputFiles() to bypass the OS file-picker dialog entirely.
 * FAKE_PNG is a 1×1 transparent PNG — just enough for FileReader to produce
 * a valid data URL without needing a real QR code image on disk.
 */
import { test, expect } from '@playwright/test';
import { openPoster, openEditPanel, FAKE_PNG } from './helpers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Upload a fake PNG to the given hidden file input, bypassing the picker.
 * Playwright's setInputFiles works on hidden inputs directly.
 */
async function uploadQR(page, inputId) {
    await page.locator(`#${inputId}`).setInputFiles({
        name: 'test-qr.png',
        mimeType: 'image/png',
        buffer: FAKE_PNG,
    });
    // FileReader is async — wait for the img src to be set
    await page.waitForFunction(
        (imgId) => {
            const img = document.getElementById(imgId);
            return img?.src && img.src.startsWith('data:');
        },
        inputId === 'input-qr-left-file' ? 'qr-soiree-img' : 'qr-membership-img',
        { timeout: 5000 }
    );
}

// ---------------------------------------------------------------------------
// Left QR
// ---------------------------------------------------------------------------
test.describe('QR upload — left', () => {

    test.beforeEach(async ({ page }) => {
        // Start clean each time
        await page.goto('about:blank');
        await page.evaluate(() => localStorage.clear());
        await openPoster(page);
        await openEditPanel(page);
    });

    test('poster image gets a data URL src after upload', async ({ page }) => {
        await uploadQR(page, 'input-qr-left-file');
        const src = await page.locator('#qr-soiree-img').getAttribute('src');
        expect(src).toMatch(/^data:image\//);
    });

    test('qr-soiree container loses qr-hidden class after upload', async ({ page }) => {
        await uploadQR(page, 'input-qr-left-file');
        await expect(page.locator('#qr-soiree')).not.toHaveClass(/qr-hidden/);
    });

    test('check-qr-soiree checkbox is checked after upload', async ({ page }) => {
        await uploadQR(page, 'input-qr-left-file');
        await expect(page.locator('#check-qr-soiree')).toBeChecked();
    });

    test('controls panel thumbnail preview is shown after upload', async ({ page }) => {
        await uploadQR(page, 'input-qr-left-file');
        await expect(page.locator('#qr-left-preview')).not.toHaveClass(/is-hidden/);
        const thumbSrc = await page.locator('#qr-left-thumb').getAttribute('src');
        expect(thumbSrc).toMatch(/^data:image\//);
    });

    test('clear button hides the poster QR again', async ({ page }) => {
        await uploadQR(page, 'input-qr-left-file');
        await expect(page.locator('#qr-soiree')).not.toHaveClass(/qr-hidden/);

        await page.locator('#btn-clear-qr-left').click();

        await expect(page.locator('#qr-soiree')).toHaveClass(/qr-hidden/);
    });

    test('clear button unchecks the toggle checkbox', async ({ page }) => {
        await uploadQR(page, 'input-qr-left-file');
        await page.locator('#btn-clear-qr-left').click();
        await expect(page.locator('#check-qr-soiree')).not.toBeChecked();
    });

    test('uploaded QR persists after page reload', async ({ page }) => {
        await uploadQR(page, 'input-qr-left-file');
        const srcBefore = await page.locator('#qr-soiree-img').getAttribute('src');

        await page.reload();
        await page.waitForFunction(() => !document.body.classList.contains('is-loading'));

        const srcAfter = await page.locator('#qr-soiree-img').getAttribute('src');
        expect(srcAfter).toBe(srcBefore);
        await expect(page.locator('#qr-soiree')).not.toHaveClass(/qr-hidden/);
    });
});

// ---------------------------------------------------------------------------
// Right QR
// ---------------------------------------------------------------------------
test.describe('QR upload — right', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('about:blank');
        await page.evaluate(() => localStorage.clear());
        await openPoster(page);
        await openEditPanel(page);
    });

    test('poster image gets a data URL src after upload', async ({ page }) => {
        await uploadQR(page, 'input-qr-right-file');
        const src = await page.locator('#qr-membership-img').getAttribute('src');
        expect(src).toMatch(/^data:image\//);
    });

    test('qr-membership container loses qr-hidden class after upload', async ({ page }) => {
        await uploadQR(page, 'input-qr-right-file');
        await expect(page.locator('#qr-membership')).not.toHaveClass(/qr-hidden/);
    });

    test('check-qr-membership checkbox is checked after upload', async ({ page }) => {
        await uploadQR(page, 'input-qr-right-file');
        await expect(page.locator('#check-qr-membership')).toBeChecked();
    });

    test('controls panel thumbnail preview is shown after upload', async ({ page }) => {
        await uploadQR(page, 'input-qr-right-file');
        await expect(page.locator('#qr-right-preview')).not.toHaveClass(/is-hidden/);
    });

    test('clear button hides the poster QR again', async ({ page }) => {
        await uploadQR(page, 'input-qr-right-file');
        await page.locator('#btn-clear-qr-right').click();
        await expect(page.locator('#qr-membership')).toHaveClass(/qr-hidden/);
    });

    test('clear button unchecks the toggle checkbox', async ({ page }) => {
        await uploadQR(page, 'input-qr-right-file');
        await page.locator('#btn-clear-qr-right').click();
        await expect(page.locator('#check-qr-membership')).not.toBeChecked();
    });

    test('uploaded QR persists after page reload', async ({ page }) => {
        await uploadQR(page, 'input-qr-right-file');
        const srcBefore = await page.locator('#qr-membership-img').getAttribute('src');

        await page.reload();
        await page.waitForFunction(() => !document.body.classList.contains('is-loading'));

        const srcAfter = await page.locator('#qr-membership-img').getAttribute('src');
        expect(srcAfter).toBe(srcBefore);
        await expect(page.locator('#qr-membership')).not.toHaveClass(/qr-hidden/);
    });
});
