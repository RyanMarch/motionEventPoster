/**
 * tests/ThemeManager.syncWind.test.js
 *
 * Tests for ThemeManager.syncWind — verifies CSS custom property values
 * at key wind thresholds.
 *
 * ThemeManager.get root() is hardcoded to return document.documentElement,
 * so we intercept style.setProperty on the real element and capture calls
 * in a Map, then restore the original afterward.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a minimal poster object for ThemeManager and intercepts
 * document.documentElement.style.setProperty so CSS variable calls are
 * captured without writing to a real stylesheet.
 */
function makeTM(gustStrength) {
    const cssVars = new Map();

    // Intercept setProperty on the real document.documentElement
    const originalSetProperty = document.documentElement.style.setProperty.bind(
        document.documentElement.style
    );
    vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(
        (prop, val) => cssVars.set(prop, val)
    );

    const poster = {
        theme: window.THEMES['spring'],
        state: {
            gustStrength,
            petals: [],
            bgColor: null,
            accentColor: null,
            secondaryColor: null,
        },
        elements: {},
        controls: {},
    };

    const tm = new window.ThemeManager(poster);
    tm.syncWind();

    // Restore the original
    vi.restoreAllMocks();

    return cssVars;
}

// ---------------------------------------------------------------------------
// syncWind — CSS variable values
// ---------------------------------------------------------------------------
describe('ThemeManager.syncWind', () => {
    it('sets --grid-play-state to "paused" at strength 0', () => {
        const vars = makeTM(0);
        expect(vars.get('--grid-play-state')).toBe('paused');
    });

    it('sets --grid-play-state to "running" above strength 0', () => {
        const vars = makeTM(1);
        expect(vars.get('--grid-play-state')).toBe('running');
    });

    it('sets --space-swirl-opacity-factor to "0" below threshold (strength < 47)', () => {
        const vars = makeTM(30);
        expect(vars.get('--space-swirl-opacity-factor')).toBe('0');
    });

    it('sets --space-swirl-display to "none" below threshold', () => {
        const vars = makeTM(46);
        expect(vars.get('--space-swirl-display')).toBe('none');
    });

    it('sets --space-swirl-play-state to "paused" below threshold', () => {
        const vars = makeTM(0);
        expect(vars.get('--space-swirl-play-state')).toBe('paused');
    });

    it('sets --space-swirl-opacity-factor to ~0 exactly at threshold (strength = 47)', () => {
        const vars = makeTM(47);
        const factor = parseFloat(vars.get('--space-swirl-opacity-factor'));
        expect(factor).toBeCloseTo(0, 3); // (47-47)/(100-47) = 0
    });

    it('sets --space-swirl-display to "block" above threshold', () => {
        const vars = makeTM(100);
        expect(vars.get('--space-swirl-display')).toBe('block');
    });

    it('sets --space-swirl-play-state to "running" above threshold', () => {
        const vars = makeTM(100);
        expect(vars.get('--space-swirl-play-state')).toBe('running');
    });

    it('--gust-speed is at minimum at strength 0', () => {
        const vars = makeTM(0);
        const speed = parseFloat(vars.get('--gust-speed'));
        // Formula: 0.12 + (0 * 0 / 4000) = 0.12
        expect(speed).toBeCloseTo(0.12, 2);
    });

    it('--gust-speed is greater at strength 100 than strength 0', () => {
        const speedAt0 = parseFloat(makeTM(0).get('--gust-speed'));
        const speedAt100 = parseFloat(makeTM(100).get('--gust-speed'));
        expect(speedAt100).toBeGreaterThan(speedAt0);
    });

    it('--gust-impact equals strength / 10', () => {
        const vars = makeTM(50);
        const impact = parseFloat(vars.get('--gust-impact'));
        expect(impact).toBeCloseTo(5.0, 1);
    });

    it('--frame-intensity equals strength / 100', () => {
        const vars = makeTM(75);
        const intensity = parseFloat(vars.get('--frame-intensity'));
        expect(intensity).toBeCloseTo(0.75, 2);
    });

    it('--space-swirl-opacity-factor reaches 1.0 at full strength 100', () => {
        const vars = makeTM(100);
        const factor = parseFloat(vars.get('--space-swirl-opacity-factor'));
        expect(factor).toBeCloseTo(1.0, 1);
    });
});
