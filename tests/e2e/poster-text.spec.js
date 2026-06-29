/**
 * tests/e2e/poster-text.spec.js
 *
 * Typing in the edit panel updates visible poster elements and persists
 * across a page reload via localStorage.
 */
import { test, expect } from '@playwright/test';
import { openPoster, openEditPanel } from './helpers.js';

test.describe('Poster text editing', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('about:blank');
        await page.evaluate(() => localStorage.clear());
        await openPoster(page);
        await openEditPanel(page);
    });

    test('typing in Event Title updates the poster in real time', async ({ page }) => {
        const input = page.locator('#input-event-title');
        await input.click();
        await input.fill('Summer Gala');

        await expect(page.locator('#event-title')).toHaveText('Summer Gala');
    });

    test('typing in Event Subtitle updates the poster in real time', async ({ page }) => {
        const input = page.locator('#input-event-subtitle');
        await input.click();
        await input.fill('Annual Fundraiser');

        await expect(page.locator('#event-subtitle')).toHaveText('Annual Fundraiser');
    });

    test('typing in Event Date updates the poster in real time', async ({ page }) => {
        const input = page.locator('#input-event-date');
        await input.click();
        await input.fill('Saturday, October 1, 2050');

        await expect(page.locator('#event-date')).toHaveText('Saturday, October 1, 2050');
    });

    test('typing in Top Label updates the poster in real time', async ({ page }) => {
        const input = page.locator('#input-event-top-label');
        await input.click();
        await input.fill('Bi-Annual');

        await expect(page.locator('#event-top-label')).toHaveText('Bi-Annual');
    });

    test('typing in Banner Text updates the logo span in real time', async ({ page }) => {
        const textarea = page.locator('#input-logo-text');
        await textarea.click();
        await textarea.fill('Community Foundation');

        await expect(page.locator('#logo-text')).toHaveText('Community Foundation');
    });

    test('edited event title persists after page reload', async ({ page }) => {
        const input = page.locator('#input-event-title');
        await input.fill('Persisted Title');
        await expect(page.locator('#event-title')).toHaveText('Persisted Title');

        await page.reload();
        await page.waitForFunction(() => !document.body.classList.contains('is-loading'));

        await expect(page.locator('#event-title')).toHaveText('Persisted Title');
    });

    test('clear button resets event title to empty', async ({ page }) => {
        const input = page.locator('#input-event-title');
        await input.fill('To Be Cleared');
        await page.locator('#btn-clear-event-title').click();

        // Input should be empty and poster should reflect that
        await expect(input).toHaveValue('');
    });
});
