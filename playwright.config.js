import { defineConfig } from '@playwright/test';

export default defineConfig({
    testMatch: '**/*.spec.js',
    timeout: 5 * 60 * 1000,
    reporter: [
        ['list'],
        ['json', { outputFile: 'tests/results/perf-matrix.json' }] // Native structured output tracker
    ],
    use: {
        headless: false,
        viewport: { width: 1920, height: 1080 },
    },
});