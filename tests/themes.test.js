/**
 * tests/themes.test.js
 *
 * Data integrity tests for all THEMES and THEME_PACKS. Zero mocks needed.
 * These tests act as a guard rail: if a new theme is added that's missing
 * a required field, or its pack ID is wrong, the tests fail immediately.
 */

const REQUIRED_THEME_KEYS = ['id', 'name', 'pack', 'colors', 'fonts', 'assets', 'particles', 'defaults'];
const REQUIRED_FONT_KEYS = ['primary', 'display', 'heading'];
const REQUIRED_ASSET_KEYS = ['border', 'sway1', 'sway2', 'sway3', 'sway4', 'swaySide'];
const REQUIRED_DEFAULTS_KEYS = ['hostsTitle', 'eventTitle', 'eventSubtitle', 'eventTopLabel'];

// ---------------------------------------------------------------------------
// THEME_PACKS
// ---------------------------------------------------------------------------
describe('THEME_PACKS', () => {
    it('is defined on window', () => {
        expect(window.THEME_PACKS).toBeDefined();
    });

    it('every pack has a name and icon', () => {
        for (const [packId, pack] of Object.entries(window.THEME_PACKS)) {
            expect(typeof pack.name, `Pack "${packId}" missing name`).toBe('string');
            expect(typeof pack.icon, `Pack "${packId}" missing icon`).toBe('string');
            expect(pack.name.length, `Pack "${packId}" name is empty`).toBeGreaterThan(0);
        }
    });
});

// ---------------------------------------------------------------------------
// THEMES — structure
// ---------------------------------------------------------------------------
describe('THEMES', () => {
    it('is defined on window', () => {
        expect(window.THEMES).toBeDefined();
    });

    it('contains at least one theme', () => {
        expect(Object.keys(window.THEMES).length).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// Per-theme validation
// ---------------------------------------------------------------------------
describe.each(Object.entries(window.THEMES))('Theme: %s', (themeKey, theme) => {
    it('has all required top-level keys', () => {
        for (const key of REQUIRED_THEME_KEYS) {
            expect(theme, `Theme "${themeKey}" missing key: ${key}`).toHaveProperty(key);
        }
    });

    it('id matches its key in THEMES', () => {
        expect(theme.id).toBe(themeKey);
    });

    it('pack is a valid THEME_PACKS key', () => {
        expect(
            window.THEME_PACKS,
            `Theme "${themeKey}" has unknown pack: "${theme.pack}"`
        ).toHaveProperty(theme.pack);
    });

    it('colors has primary and accent', () => {
        expect(theme.colors).toHaveProperty('primary');
        expect(theme.colors).toHaveProperty('accent');
        expect(theme.colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(theme.colors.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('fonts has all required keys', () => {
        for (const key of REQUIRED_FONT_KEYS) {
            expect(theme.fonts, `Theme "${themeKey}" missing font.${key}`).toHaveProperty(key);
            expect(typeof theme.fonts[key]).toBe('string');
        }
    });

    it('assets has all required keys', () => {
        for (const key of REQUIRED_ASSET_KEYS) {
            expect(theme.assets, `Theme "${themeKey}" missing asset.${key}`).toHaveProperty(key);
        }
    });

    it('has at least one particle type', () => {
        expect(Array.isArray(theme.particles)).toBe(true);
        expect(theme.particles.length).toBeGreaterThan(0);
    });

    it('every particle has a positive weight', () => {
        for (const p of theme.particles) {
            const weight = p.weight ?? 1;
            expect(weight, `Theme "${themeKey}" has a particle with weight <= 0`).toBeGreaterThan(0);
        }
    });

    it('defaults has all required text keys', () => {
        for (const key of REQUIRED_DEFAULTS_KEYS) {
            expect(theme.defaults, `Theme "${themeKey}" missing defaults.${key}`).toHaveProperty(key);
            expect(typeof theme.defaults[key]).toBe('string');
        }
    });

    it('swatches array exists and each swatch has a hex', () => {
        expect(Array.isArray(theme.swatches)).toBe(true);
        expect(theme.swatches.length).toBeGreaterThan(0);
        for (const s of theme.swatches) {
            // Accept 6-digit or 8-digit (RGBA) hex values
            expect(s.hex, `Theme "${themeKey}" swatch missing hex`).toMatch(
                /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/i
            );
        }
    });

    it('overrides keys all exist in DEFAULTS', () => {
        if (!theme.overrides) return;
        // These are known legacy keys present in some themes that predate DEFAULTS
        const legacyKeys = new Set(['opacity']);
        for (const key of Object.keys(theme.overrides)) {
            if (legacyKeys.has(key)) continue;
            expect(
                window.DEFAULTS,
                `Theme "${themeKey}" override key "${key}" not found in DEFAULTS`
            ).toHaveProperty(key);
        }
    });
});
