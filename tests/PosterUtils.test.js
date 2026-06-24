/**
 * tests/PosterUtils.test.js
 *
 * Tests for window.PosterUtils — pure functions, zero mocks needed.
 *
 * NOTE: Methods that use `this` internally (isDark, deriveAccentColor) must
 * be called via window.PosterUtils.method() to preserve the correct `this`
 * binding. Free-function destructuring breaks these.
 */

// Convenience aliases — bound to the object to preserve `this`
const PU = window.PosterUtils;
const { hexToRgb, rgbToHsl, hslToHex, formatFullscreenTimer } = PU;

// ---------------------------------------------------------------------------
// hexToRgb
// ---------------------------------------------------------------------------
describe('PosterUtils.hexToRgb', () => {
    it('parses a standard 6-digit hex with #', () => {
        expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(hexToRgb('#032858')).toEqual({ r: 3, g: 40, b: 88 });
        expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('strips the alpha channel from an 8-digit hex', () => {
        // #ff0000ff → treat as #ff0000
        expect(hexToRgb('#ff0000ff')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('handles 6-digit hex without leading #', () => {
        expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('returns the fallback color for null or undefined input', () => {
        expect(hexToRgb(null)).toEqual({ r: 3, g: 40, b: 88 });
        expect(hexToRgb(undefined)).toEqual({ r: 3, g: 40, b: 88 });
    });

    it('returns the fallback color for an invalid hex string', () => {
        expect(hexToRgb('#gggggg')).toEqual({ r: 3, g: 40, b: 88 });
        expect(hexToRgb('not-a-color')).toEqual({ r: 3, g: 40, b: 88 });
    });
});

// ---------------------------------------------------------------------------
// rgbToHsl
// ---------------------------------------------------------------------------
describe('PosterUtils.rgbToHsl', () => {
    it('converts pure red correctly', () => {
        const { h, s, l } = rgbToHsl(255, 0, 0);
        expect(h).toBeCloseTo(0, 0);
        expect(s).toBeCloseTo(1, 2);
        expect(l).toBeCloseTo(0.5, 2);
    });

    it('converts white (achromatic) correctly', () => {
        const { h, s, l } = rgbToHsl(255, 255, 255);
        expect(h).toBe(0);
        expect(s).toBe(0);
        expect(l).toBeCloseTo(1, 2);
    });

    it('converts black (achromatic) correctly', () => {
        const { h, s, l } = rgbToHsl(0, 0, 0);
        expect(h).toBe(0);
        expect(s).toBe(0);
        expect(l).toBe(0);
    });

    it('converts pure blue correctly', () => {
        const { h, s, l } = rgbToHsl(0, 0, 255);
        expect(h).toBeCloseTo(240, 0);
        expect(s).toBeCloseTo(1, 2);
        expect(l).toBeCloseTo(0.5, 2);
    });
});

// ---------------------------------------------------------------------------
// hslToHex (and round-trip fidelity with hexToRgb)
// ---------------------------------------------------------------------------
describe('PosterUtils.hslToHex', () => {
    it('converts pure red hsl back to #ff0000', () => {
        expect(hslToHex(0, 1, 0.5)).toBe('#ff0000');
    });

    it('converts white back to #ffffff', () => {
        expect(hslToHex(0, 0, 1)).toBe('#ffffff');
    });

    it('converts black back to #000000', () => {
        expect(hslToHex(0, 0, 0)).toBe('#000000');
    });

    it('round-trips through hexToRgb → rgbToHsl → hslToHex with minimal drift', () => {
        const original = '#032858';
        const { r, g, b } = hexToRgb(original);
        const { h, s, l } = rgbToHsl(r, g, b);
        const result = hslToHex(h, s, l);
        // Allow ±1 in each channel due to rounding
        const orig = hexToRgb(original);
        const res = hexToRgb(result);
        expect(Math.abs(orig.r - res.r)).toBeLessThanOrEqual(1);
        expect(Math.abs(orig.g - res.g)).toBeLessThanOrEqual(1);
        expect(Math.abs(orig.b - res.b)).toBeLessThanOrEqual(1);
    });
});

// ---------------------------------------------------------------------------
// isDark
// ---------------------------------------------------------------------------
describe('PosterUtils.isDark', () => {
    it('identifies black as dark', () => {
        expect(PU.isDark('#000000')).toBe(true);
    });

    it('identifies dark navy as dark', () => {
        expect(PU.isDark('#032858')).toBe(true);
    });

    it('identifies white as not dark', () => {
        expect(PU.isDark('#ffffff')).toBe(false);
    });

    it('identifies a light color as not dark', () => {
        expect(PU.isDark('#F5F5F7')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// deriveAccentColor
// ---------------------------------------------------------------------------
describe('PosterUtils.deriveAccentColor', () => {
    it('returns a hex string', () => {
        const result = PU.deriveAccentColor('#032858');
        expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('enforces minimum saturation floor of 0.85', () => {
        // A near-gray input should get bumped to at least 85% saturation
        const result = PU.deriveAccentColor('#808080');
        const { r, g, b } = hexToRgb(result);
        const { s } = rgbToHsl(r, g, b);
        expect(s).toBeGreaterThanOrEqual(0.8); // 0.8 tolerance for rounding
    });

    it('enforces minimum lightness floor of 0.75', () => {
        // A very dark input should get bumped to at least 75% lightness
        const result = PU.deriveAccentColor('#000000');
        const { r, g, b } = hexToRgb(result);
        const { l } = rgbToHsl(r, g, b);
        expect(l).toBeGreaterThanOrEqual(0.74); // 0.74 tolerance for rounding
    });
});

// ---------------------------------------------------------------------------
// formatFullscreenTimer
// ---------------------------------------------------------------------------
describe('PosterUtils.formatFullscreenTimer', () => {
    it('returns "-:--" when seconds is null and no start time', () => {
        expect(formatFullscreenTimer(null, null)).toBe('-:--');
    });

    it('formats 0 seconds as "0:00"', () => {
        expect(formatFullscreenTimer(0, null)).toBe('0:00');
    });

    it('formats 75 seconds as "1:15"', () => {
        expect(formatFullscreenTimer(75, null)).toBe('1:15');
    });

    it('formats 3600 seconds as "60:00"', () => {
        expect(formatFullscreenTimer(3600, null)).toBe('60:00');
    });

    it('zero-pads single-digit seconds', () => {
        expect(formatFullscreenTimer(65, null)).toBe('1:05');
    });

    it('uses elapsed time from start time when provided', () => {
        const twoSecondsAgo = Date.now() - 2000;
        const result = formatFullscreenTimer(null, twoSecondsAgo);
        // Should be "0:02" or "0:03" depending on timing
        expect(result).toMatch(/^0:0[23]$/);
    });
});
