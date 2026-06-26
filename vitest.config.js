import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: ['./tests/setup.js'],
        include: ['tests/**/*.test.js'],
        globals: true,
        coverage: {
            provider: 'v8',
            include: ['js/**'],
            exclude: [
                'js/vendor/**',
                'tests/**'
            ]
        },
    },
});