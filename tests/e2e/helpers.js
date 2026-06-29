/**
 * tests/e2e/helpers.js
 *
 * Shared utilities for the E2E test suite.
 */

/** Base URL — override with E2E_BASE_URL env var if your server runs on a different port. */
export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5501';

/**
 * Navigate to the poster and wait until the app finishes booting.
 * The body starts with class "is-loading" and the JS removes it once init completes.
 */
export async function openPoster(page) {
    await page.goto(BASE_URL);
    // Wait for the loading class to be removed — signals app init is complete
    await page.waitForFunction(() => !document.body.classList.contains('is-loading'), {
        timeout: 10_000,
    });
}

/**
 * Ensure the controls panel is open. Uses the Q keyboard shortcut.
 * Safe to call even if the panel is already open — checks first.
 */
export async function openControls(page) {
    const isVisible = await page.evaluate(() =>
        document.getElementById('controls-panel')?.classList.contains('is-visible')
    );
    if (!isVisible) {
        await page.keyboard.press('q');
        await page.waitForFunction(
            () => document.getElementById('controls-panel')?.classList.contains('is-visible'),
            { timeout: 3000 }
        );
    }
}

/**
 * Open the controls panel, then open the "[E]dit Poster Content" details section.
 */
export async function openEditPanel(page) {
    await openControls(page);
    const details = page.locator('#edit-poster-details');
    const isOpen = await details.evaluate(el => el.open);
    if (!isOpen) {
        await details.locator('summary').click();
        await page.waitForTimeout(150); // allow details animation
    }
}

/**
 * Open the controls panel, then open the "[C]ustomize Appearance" details section.
 */
export async function openAppearancePanel(page) {
    await openControls(page);
    const details = page.locator('#appearance-details');
    const isOpen = await details.evaluate(el => el.open);
    if (!isOpen) {
        await details.locator('summary').click();
        await page.waitForTimeout(150);
    }
}

/**
 * A minimal valid 1×1 transparent PNG as a Buffer.
 * Used to simulate a file upload without needing a real image on disk.
 */
export const FAKE_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
);
