import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const themesPath = path.resolve(__dirname, '../js/themes.js');
const themesFileContent = fs.readFileSync(themesPath, 'utf8');

const themeRegex = /['"]([^'"]+)['"]\s*:\s*defineTheme/g;
const discoveredThemes = [];
let match;
while ((match = themeRegex.exec(themesFileContent)) !== null) {
    discoveredThemes.push(match[1]);
}
const themes = ['spring', ...discoveredThemes];

test.describe('Theme Performance Matrix', () => {

    test('Execute Sequential Performance Iteration Loop', async ({ page }, testInfo) => {
        test.setTimeout(5 * 60 * 1000);

        const failures = [];
        const dashboardPayload = [];

        for (const theme of themes) {
            await test.step(`Profiling: ${theme.toUpperCase()}`, async () => {
                try {
                    await page.goto(`http://127.0.0.1:5501?theme=${theme}`);
                    await page.waitForSelector(':not(.is-loading)');

                    const perfSummary = await page.evaluate(async () => {
                        return new Promise((resolve) => {
                            const timestamps = [];
                            const startTime = performance.now();

                            const phase1Duration = 500;
                            const phase2Duration = 2500;
                            let hasCheckedPhase1 = false;

                            function sampleFrame(now) {
                                timestamps.push(now);
                                const elapsed = now - startTime;

                                if (!hasCheckedPhase1 && elapsed >= phase1Duration) {
                                    hasCheckedPhase1 = true;

                                    const currentFrames = timestamps.length - 1;
                                    const currentDuration = timestamps[timestamps.length - 1] - timestamps[0];
                                    const currentFps = (currentFrames / currentDuration) * 1000;

                                    if (currentFps >= 90) {
                                        return resolve({
                                            fps: currentFps,
                                            phasedEarlyExit: true
                                        });
                                    }
                                }

                                if (elapsed < phase2Duration) {
                                    requestAnimationFrame(sampleFrame);
                                } else {
                                    const totalFrames = timestamps.length - 1;
                                    const totalDuration = timestamps[timestamps.length - 1] - timestamps[0];
                                    const finalFps = (totalFrames / totalDuration) * 1000;

                                    resolve({
                                        fps: finalFps,
                                        phasedEarlyExit: false
                                    });
                                }
                            }

                            requestAnimationFrame(sampleFrame);
                        });
                    });

                    const averageFps = perfSummary.fps;
                    const exitContext = perfSummary.phasedEarlyExit ? '[FAST-PASS]' : '[DEEP-SAMPLE]';
                    console.log(`[${theme.toUpperCase()}] ${exitContext} Result: ${averageFps.toFixed(2)} FPS`);

                    const targetBaseline = 55;
                    const passed = averageFps >= targetBaseline;

                    if (!passed) {
                        failures.push({ theme: theme.toUpperCase(), fps: averageFps.toFixed(2) });
                    }

                    // Store clean records for the dashboard attachment
                    dashboardPayload.push({
                        theme: theme,
                        fps: parseFloat(averageFps.toFixed(2)),
                        passed: passed
                    });

                } catch (err) {
                    console.error(`Error profiling theme ${theme.toUpperCase()}:`, err);
                    failures.push({ theme: theme.toUpperCase(), error: err.message });
                    dashboardPayload.push({
                        theme: theme,
                        fps: 0.00,
                        passed: false
                    });
                }
            });
        }

        // Attach the complete dataset as a clean, native string inside the playwright JSON report output
        testInfo.attachments.push({
            name: 'perf-matrix-dataset',
            contentType: 'application/json',
            body: Buffer.from(JSON.stringify(dashboardPayload))
        });

        if (failures.length > 0) {
            const errorReport = failures.map(f => `${f.theme} (${f.fps || f.error} FPS)`).join(', ');
            expect(failures.length, `Performance regressions found in themes: ${errorReport}`).toBe(0);
        }
    });
});