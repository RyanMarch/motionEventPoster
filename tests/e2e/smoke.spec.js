/**
 * tests/e2e/smoke.spec.js
 *
 * Basic page-load and render sanity checks.
 * These run first — if they fail, nothing else is meaningful.
 */
import { test, expect } from '@playwright/test';
import { openPoster } from './helpers.js';

test.describe('Smoke — page load', () => {

    test.beforeEach(async ({ page }) => {
        await openPoster(page);
    });

    test('loads without console errors', async ({ page }) => {
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        // Re-navigate so the listener captures everything from the start
        await page.reload();
        await page.waitForFunction(() => !document.body.classList.contains('is-loading'));

        // Filter out known third-party noise (fonts, favicon 404s, etc.)
        const appErrors = errors.filter(e =>
            !e.includes('fonts.gstatic') &&
            !e.includes('favicon') &&
            !e.includes('net::ERR')
        );
        expect(appErrors).toHaveLength(0);
    });

    test('poster content wrapper is visible', async ({ page }) => {
        const wrapper = page.locator('.content-wrapper');
        await expect(wrapper).toBeVisible();
    });

    test('default event title is rendered on the poster', async ({ page }) => {
        // The default title from POSTER_TEXT_DEFAULTS
        const title = page.locator('#event-title');
        await expect(title).toBeVisible();
        await expect(title).not.toBeEmpty();
    });

    test('default hosts list is populated', async ({ page }) => {
        const hosts = page.locator('.hosts-list');
        await expect(hosts).toBeVisible();
        // DEFAULT_HOSTS has 20 entries — at least some should appear
        const items = hosts.locator('.host-item, [class*="host"]');
        await expect(items.first()).toBeVisible();
    });

    test('particle layers exist in the DOM', async ({ page }) => {
        await expect(page.locator('#particles-back')).toBeAttached();
        await expect(page.locator('#particles-mid')).toBeAttached();
        await expect(page.locator('#particles-front')).toBeAttached();
    });

    test('QR code containers start hidden', async ({ page }) => {
        const left = page.locator('#qr-soiree');
        const right = page.locator('#qr-membership');
        await expect(left).toHaveClass(/qr-hidden/);
        await expect(right).toHaveClass(/qr-hidden/);
    });
});
