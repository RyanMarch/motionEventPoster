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

    it('forces green and blue math paths using distinct mixed colors', () => {
        // Green is highest channel (triggers line 29: case g)
        const mixedGreen = PU.rgbToHsl(30, 200, 100);
        expect(mixedGreen.h).toBeCloseTo(144.7, 1);

        // Blue is highest channel (triggers line 30: case b)
        const mixedBlue = PU.rgbToHsl(50, 120, 220);
        expect(mixedBlue.h).toBeCloseTo(215.29, 1);

        // Red is highest channel AND blue > green (triggers line 28 ternary branch)
        const mixedRose = PU.rgbToHsl(255, 50, 150);
        expect(mixedRose.h).toBeCloseTo(330.7, 1);
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

    it('forces negative hue branch execution in hue2rgb wrapper', () => {
        // Hue of 300 (magenta) triggers the (t < 0) condition internally for the blue channel calculations
        const magentaHex = hslToHex(300, 1, 0.5);
        expect(magentaHex).toBe('#ff00ff');
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
        const result = PU.deriveAccentColor('#808080');
        const { r, g, b } = PU.hexToRgb(result); // Use PU.
        const { s } = PU.rgbToHsl(r, g, b);      // Use PU.
        expect(s).toBeGreaterThanOrEqual(0.8);
    });

    it('enforces minimum lightness floor of 0.75', () => {
        const result = PU.deriveAccentColor('#000000');
        const { r, g, b } = PU.hexToRgb(result); // Use PU.
        const { l } = PU.rgbToHsl(r, g, b);      // Use PU.
        expect(l).toBeGreaterThanOrEqual(0.74);
    });

    it('handles pure grayscale input to hit the internal saturation fallback branch', () => {
        // Passing pure white forces s === 0 and runs cleanly via PU context
        const result = PU.deriveAccentColor('#ffffff');
        expect(result).toBe('#a1f7f7');
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

describe('PosterUtils.readFileAsDataURL', () => {
    it('successfully reads a file block and triggers the callback with a data URL', () => {
        const fakeFile = new File(['hello content'], 'test.txt', { type: 'text/plain' });

        // 1. Stub FileReader
        const originalFileReader = globalThis.FileReader;
        globalThis.FileReader = class {
            readAsDataURL(file) {
                if (typeof this.onload === 'function') {
                    this.onload({ target: { result: 'data:text/plain;base64,aGVsbG8=' } });
                }
            }
        };

        // 2. Stub Image element loader to force img.onload to run immediately
        const originalImage = globalThis.Image;
        globalThis.Image = class {
            set src(val) {
                if (typeof this.onload === 'function') {
                    this.onload();
                }
            }
        };

        let called = false;
        let resultData = '';

        window.PosterUtils.readFileAsDataURL(fakeFile, (dataUrl) => {
            called = true;
            resultData = dataUrl;
        });

        // Clean up globals completely
        globalThis.FileReader = originalFileReader;
        globalThis.Image = originalImage;

        expect(called).toBe(true);
        expect(resultData).toMatch(/^data:text\/plain;base64,/);
    });
});

describe('PosterUtils.shrinkTextToFit', () => {
    it('decreases font size until the element width is within the max width bounds', () => {
        // Create a fake element stub
        const fakeEl = {
            style: { fontSize: '' },
            // Simulate a large initial scrollWidth that drops as fontSize shrinks
            get scrollWidth() {
                const currentSize = parseFloat(this.style.fontSize || '24px');
                return currentSize > 14 ? 200 : 80;
            }
        };

        // Stub getComputedStyle so your code reads our starting size
        const originalGetComputedStyle = window.getComputedStyle;
        window.getComputedStyle = () => ({ fontSize: '24px' });

        // Run the function with a maxWidth of 100
        window.PosterUtils.shrinkTextToFit(fakeEl, 100);

        // Restore the global style reader cleanly
        window.getComputedStyle = originalGetComputedStyle;

        // Verify the loop successfully scaled down the font size style property
        expect(parseFloat(fakeEl.style.fontSize)).toBeLessThan(24);
        expect(fakeEl.style.fontSize).toMatch(/px$/);
    });

    it('bails out immediately if element layout or configuration is missing', () => {
        // Line 94 checks "if (!el) return;"
        expect(window.PosterUtils.shrinkTextToFit(null, 100)).toBeUndefined();
    });
});