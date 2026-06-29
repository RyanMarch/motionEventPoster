/**
 * tests/e2e/theme.spec.js
 *
 * Theme switching: selecting a theme from the dropdown updates CSS variables,
 * marks the option as active, and persists the selection across reload.
 */
import { test, expect } from '@playwright/test';
import { openPoster, openAppearancePanel } from './helpers.js';

test.describe('Theme switching', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('about:blank');
        await page.evaluate(() => localStorage.clear());
        await openPoster(page);
        await openAppearancePanel(page);
    });

    test('opening the theme dropdown reveals the options list', async ({ page }) => {
        const trigger = page.locator('#theme-select-trigger');
        await trigger.click();
        await expect(page.locator('#theme-select-options')).toBeVisible();
    });

    test('clicking a theme option applies it (--color-primary changes)', async ({ page }) => {
        // Read current primary before switching
        const primaryBefore = await page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
        );

        // Open the dropdown and click the first option that is NOT already active
        const trigger = page.locator('#theme-select-trigger');
        await trigger.click();
        await page.waitForSelector('#theme-select-options .custom-select-option');

        const options = page.locator('#theme-select-options .custom-select-option');
        const count = await options.count();

        let clicked = false;
        for (let i = 0; i < count; i++) {
            const opt = options.nth(i);
            const isSelected = await opt.evaluate(el => el.classList.contains('selected'));
            if (!isSelected) {
                await opt.click();
                clicked = true;
                break;
            }
        }
        expect(clicked).toBe(true);

        // Wait for CSS to update
        await page.waitForTimeout(300);

        const primaryAfter = await page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
        );

        // Primary color should now be different
        expect(primaryAfter).not.toBe(primaryBefore);
    });

    test('selected theme option gets the "selected" class', async ({ page }) => {
        const trigger = page.locator('#theme-select-trigger');
        await trigger.click();
        await page.waitForSelector('#theme-select-options .custom-select-option');

        const options = page.locator('#theme-select-options .custom-select-option');
        const count = await options.count();

        let targetValue = null;
        for (let i = 0; i < count; i++) {
            const opt = options.nth(i);
            const isSelected = await opt.evaluate(el => el.classList.contains('selected'));
            if (!isSelected) {
                targetValue = await opt.getAttribute('data-value');
                await opt.click();
                break;
            }
        }

        expect(targetValue).not.toBeNull();

        // Verify the newly clicked option is now marked selected
        const activeOption = page.locator(`#theme-select-options .custom-select-option[data-value="${targetValue}"]`);
        await expect(activeOption).toHaveClass(/selected/);
    });

    test('selected theme persists after page reload', async ({ page }) => {
        // Switch to a non-default theme
        const trigger = page.locator('#theme-select-trigger');
        await trigger.click();
        await page.waitForSelector('#theme-select-options .custom-select-option');

        const options = page.locator('#theme-select-options .custom-select-option');
        let chosenTheme = null;
        for (let i = 0; i < await options.count(); i++) {
            const opt = options.nth(i);
            if (!(await opt.evaluate(el => el.classList.contains('selected')))) {
                chosenTheme = await opt.getAttribute('data-value');
                await opt.click();
                break;
            }
        }

        await page.waitForTimeout(300);
        await page.reload();
        await page.waitForFunction(() => !document.body.classList.contains('is-loading'));

        // After reload the saved theme should still be active
        const savedTheme = await page.evaluate(() => {
            try {
                const s = JSON.parse(localStorage.getItem('poster-settings') || '{}');
                return s.activeTheme;
            } catch { return null; }
        });
        expect(savedTheme).toBe(chosenTheme);
    });
});
