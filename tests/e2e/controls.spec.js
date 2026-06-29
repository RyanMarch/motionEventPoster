/**
 * tests/e2e/controls.spec.js
 *
 * Controls panel open/close and basic slider interaction.
 */
import { test, expect } from '@playwright/test';
import { openPoster, openControls } from './helpers.js';

test.describe('Controls panel', () => {

    test.beforeEach(async ({ page }) => {
        await openPoster(page);
    });

    test('Q key opens the controls panel', async ({ page }) => {
        const panel = page.locator('#controls-panel');
        await expect(panel).not.toHaveClass(/is-visible/);

        await page.keyboard.press('q');

        await expect(panel).toHaveClass(/is-visible/, { timeout: 2000 });
    });

    test('Q key again closes an open controls panel', async ({ page }) => {
        const panel = page.locator('#controls-panel');

        await page.keyboard.press('q');
        await expect(panel).toHaveClass(/is-visible/, { timeout: 2000 });

        await page.keyboard.press('q');
        await expect(panel).not.toHaveClass(/is-visible/, { timeout: 2000 });
    });

    test('close button closes the controls panel', async ({ page }) => {
        await openControls(page);
        const panel = page.locator('#controls-panel');
        await expect(panel).toHaveClass(/is-visible/);

        await page.locator('#btn-close-panel').click();
        await expect(panel).not.toHaveClass(/is-visible/, { timeout: 2000 });
    });

    test('Customize Appearance section expands on click', async ({ page }) => {
        await openControls(page);
        const details = page.locator('#appearance-details');
        await expect(details).not.toHaveAttribute('open');

        await details.locator('summary').click();
        await expect(details).toHaveAttribute('open');
    });

    test('gust strength slider changes the --gust-impact CSS variable', async ({ page }) => {
        await openControls(page);

        // Open the Customize section to reveal the slider
        const details = page.locator('#appearance-details');
        if (!(await details.evaluate(el => el.open))) {
            await details.locator('summary').click();
            await page.waitForTimeout(150);
        }

        const slider = page.locator('#slider-gust-strength');
        await expect(slider).toBeVisible();

        // Set slider to 0 first, then to 100
        await slider.evaluate(el => {
            el.value = '0';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        const impactAt0 = await page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--gust-impact').trim()
        );

        await slider.evaluate(el => {
            el.value = '100';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        const impactAt100 = await page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--gust-impact').trim()
        );

        expect(parseFloat(impactAt100)).toBeGreaterThan(parseFloat(impactAt0));
    });

    test('setting max-petals to 0 removes all petal elements', async ({ page }) => {
        await openControls(page);

        const details = page.locator('#appearance-details');
        if (!(await details.evaluate(el => el.open))) {
            await details.locator('summary').click();
            await page.waitForTimeout(150);
        }

        const slider = page.locator('#slider-max-petals');
        await expect(slider).toBeVisible();

        await slider.evaluate(el => {
            el.value = '0';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });

        // Give the engine one tick to remove elements
        await page.waitForTimeout(100);

        const petalCount = await page.evaluate(() =>
            document.querySelectorAll('[class^="petal"]').length
        );
        expect(petalCount).toBe(0);
    });
});
