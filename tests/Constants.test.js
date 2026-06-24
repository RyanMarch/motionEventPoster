/**
 * tests/Constants.test.js
 *
 * Data integrity tests for all global constants. Zero mocks needed.
 */

// ---------------------------------------------------------------------------
// DEFAULTS
// ---------------------------------------------------------------------------
describe('DEFAULTS', () => {
    it('is defined on window', () => {
        expect(window.DEFAULTS).toBeDefined();
    });

    it('contains all required keys', () => {
        const requiredKeys = [
            'maxPetals', 'windiness', 'fallSpeed', 'tumbleSpeed', 'gustStrength',
            'hostTextSize', 'hostMaxWidth', 'hostLayout', 'backdropOpacity',
            'insetV', 'insetH', 'hideUi', 'hideLogo', 'hideDate', 'hideTitle',
            'hideHost', 'hideBorder', 'hideValentinesHearts', 'qrSoiree', 'qrMembership',
            'isPetalsPaused', 'isBgPaused', 'disableAutoFullscreen',
            'autoHideMenu', 'smoothTransitions', 'isAppRunning',
            'bgColor', 'accentColor', 'secondaryColor', 'activeTheme', 'fpsCap',
        ];
        for (const key of requiredKeys) {
            expect(window.DEFAULTS, `Missing key: ${key}`).toHaveProperty(key);
        }
    });

    it('has numeric values for slider-backed settings', () => {
        expect(typeof window.DEFAULTS.maxPetals).toBe('number');
        expect(typeof window.DEFAULTS.windiness).toBe('number');
        expect(typeof window.DEFAULTS.fallSpeed).toBe('number');
        expect(typeof window.DEFAULTS.tumbleSpeed).toBe('number');
        expect(typeof window.DEFAULTS.gustStrength).toBe('number');
        expect(typeof window.DEFAULTS.backdropOpacity).toBe('number');
        expect(typeof window.DEFAULTS.fpsCap).toBe('number');
    });

    it('has boolean values for toggle settings', () => {
        expect(typeof window.DEFAULTS.hideUi).toBe('boolean');
        expect(typeof window.DEFAULTS.hideLogo).toBe('boolean');
        expect(typeof window.DEFAULTS.isPetalsPaused).toBe('boolean');
        expect(typeof window.DEFAULTS.isBgPaused).toBe('boolean');
        expect(typeof window.DEFAULTS.smoothTransitions).toBe('boolean');
    });

    it('has a valid default theme string', () => {
        expect(typeof window.DEFAULTS.activeTheme).toBe('string');
        expect(window.DEFAULTS.activeTheme.length).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// STORAGE_KEYS
// ---------------------------------------------------------------------------
describe('STORAGE_KEYS', () => {
    it('is defined on window', () => {
        expect(window.STORAGE_KEYS).toBeDefined();
    });

    it('has no duplicate values', () => {
        const values = Object.values(window.STORAGE_KEYS);
        const unique = new Set(values);
        expect(unique.size).toBe(values.length);
    });

    it('all values are non-empty strings', () => {
        for (const [key, val] of Object.entries(window.STORAGE_KEYS)) {
            expect(typeof val, `STORAGE_KEYS.${key} should be a string`).toBe('string');
            expect(val.length, `STORAGE_KEYS.${key} should not be empty`).toBeGreaterThan(0);
        }
    });
});

// ---------------------------------------------------------------------------
// SLIDER_CONFIGS
// ---------------------------------------------------------------------------
describe('SLIDER_CONFIGS', () => {
    it('is an array on window', () => {
        expect(Array.isArray(window.SLIDER_CONFIGS)).toBe(true);
    });

    it('every entry has required shape', () => {
        for (const cfg of window.SLIDER_CONFIGS) {
            expect(cfg, 'missing id').toHaveProperty('id');
            expect(cfg, 'missing label').toHaveProperty('label');
            expect(cfg, 'missing min').toHaveProperty('min');
            expect(cfg, 'missing max').toHaveProperty('max');
            expect(cfg, 'missing step').toHaveProperty('step');
            expect(cfg, 'missing stateKey').toHaveProperty('stateKey');
            expect(cfg.min).toBeLessThan(cfg.max);
        }
    });

    it('every stateKey maps to a key in DEFAULTS', () => {
        for (const cfg of window.SLIDER_CONFIGS) {
            expect(
                window.DEFAULTS,
                `SLIDER_CONFIGS entry "${cfg.id}" has stateKey "${cfg.stateKey}" not found in DEFAULTS`
            ).toHaveProperty(cfg.stateKey);
        }
    });

    it('has no duplicate ids', () => {
        const ids = window.SLIDER_CONFIGS.map(c => c.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });
});

// ---------------------------------------------------------------------------
// SHORTCUT_CONFIGS
// ---------------------------------------------------------------------------
describe('SHORTCUT_CONFIGS', () => {
    it('is an array on window', () => {
        expect(Array.isArray(window.SHORTCUT_CONFIGS)).toBe(true);
    });

    it('every entry has key, label, desc, and action', () => {
        for (const cfg of window.SHORTCUT_CONFIGS) {
            expect(cfg).toHaveProperty('key');
            expect(cfg).toHaveProperty('label');
            expect(cfg).toHaveProperty('desc');
            expect(cfg).toHaveProperty('action');
        }
    });
});

// ---------------------------------------------------------------------------
// TITLE_FILTER_WORDS
// ---------------------------------------------------------------------------
describe('TITLE_FILTER_WORDS', () => {
    it('is a Set on window', () => {
        expect(window.TITLE_FILTER_WORDS).toBeInstanceOf(Set);
    });

    it('contains expected honorifics', () => {
        expect(window.TITLE_FILTER_WORDS.has('the')).toBe(true);
        expect(window.TITLE_FILTER_WORDS.has('honorable')).toBe(true);
        expect(window.TITLE_FILTER_WORDS.has('dr.')).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// POSTER_TEXT_DEFAULTS
// ---------------------------------------------------------------------------
describe('POSTER_TEXT_DEFAULTS', () => {
    it('is defined on window', () => {
        expect(window.POSTER_TEXT_DEFAULTS).toBeDefined();
    });

    it('has required text fields as strings', () => {
        const requiredKeys = [
            'logoMode', 'logoText', 'hostsTitle', 'eventTopLabel',
            'eventTitle', 'eventSubtitle', 'eventDate',
        ];
        for (const key of requiredKeys) {
            expect(typeof window.POSTER_TEXT_DEFAULTS[key], `Missing or wrong type: ${key}`).toBe('string');
        }
    });
});
