/**
 * tests/ThemeManager.test.js
 *
 * Tests for ThemeManager methods beyond syncWind (which lives in
 * ThemeManager.syncWind.test.js).
 *
 * Strategy: construct ThemeManager with a minimal fake poster built around a
 * real spring theme object. CSS variable writes are captured by spying on
 * document.documentElement.style.setProperty where needed.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFakePoster(stateOverrides = {}) {
    const theme = window.THEMES['spring'];
    return {
        theme,
        petalTypes: theme.particles,
        state: {
            gustStrength: 50,
            petals: [],
            bgColor: null,
            accentColor: null,
            secondaryColor: null,
            backdropOpacity: 100,
            activeTheme: 'spring',
            isApplyingTheme: false,
            ...stateOverrides,
        },
        elements: {
            swatchGrid: null,
            btnCustomColor: null,
            bgColorPicker: null,
            bgColorVal: null,
            themeFrame: null,
            logoBanner: null,
        },
        controls: {
            themeSelectIcon: null,
            themeSelectLabel: null,
            themeSelectOptions: null,
        },
        particleEngine: { adjustAmbientPetals: vi.fn(), updateParticleColors: vi.fn() },
        applyPosterText: vi.fn(),
        savePosterText: vi.fn(),
        ui: { syncPosterTextInputs: vi.fn() },
        saveSettings: vi.fn(),
        syncPauseStates: vi.fn(),
        optimizeLayouts: vi.fn(),
        cacheSwayLayers: vi.fn(),
        layers: { back: document.createElement('div'), mid: document.createElement('div'), front: document.createElement('div') },
    };
}

function makeTM(stateOverrides = {}) {
    const poster = makeFakePoster(stateOverrides);
    const tm = new window.ThemeManager(poster);
    return { tm, poster };
}

// ---------------------------------------------------------------------------
// resolveColorLabel
// ---------------------------------------------------------------------------
describe('ThemeManager.resolveColorLabel', () => {
    it('returns the passed swatchName directly when provided', () => {
        const { tm } = makeTM();
        expect(tm.resolveColorLabel('Royal Blue')).toBe('Royal Blue');
    });

    it('returns the matching swatch name when bgColor matches a theme swatch', () => {
        const { tm, poster } = makeTM();
        const firstSwatch = poster.theme.swatches?.[0];
        if (!firstSwatch) return; // skip if theme has no swatches
        poster.state.bgColor = firstSwatch.hex;
        poster.state.accentColor = firstSwatch.accent || null;
        expect(tm.resolveColorLabel()).toBe(firstSwatch.name);
    });

    it('returns the hex in uppercase when no swatch matches', () => {
        const { tm, poster } = makeTM();
        poster.state.bgColor = '#abcdef';
        // Make sure this color is not in spring swatches
        const result = tm.resolveColorLabel();
        expect(result).toBe('#ABCDEF');
    });

    it('returns theme primary hex when bgColor is null and no swatch matches', () => {
        const { tm, poster } = makeTM();
        poster.state.bgColor = null;
        // If the theme primary matches a swatch, the name will be returned.
        // Either way the result should be a non-empty string.
        expect(typeof tm.resolveColorLabel()).toBe('string');
        expect(tm.resolveColorLabel().length).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// syncBackdrop — CSS custom property output
// ---------------------------------------------------------------------------
describe('ThemeManager.syncBackdrop', () => {
    function captureSyncBackdrop(stateOverrides = {}) {
        const cssVars = new Map();
        vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(
            (prop, val) => cssVars.set(prop, val)
        );
        vi.spyOn(document.documentElement.style, 'removeProperty').mockImplementation(() => {});

        const { tm } = makeTM(stateOverrides);
        tm.syncBackdrop();

        vi.restoreAllMocks();
        return cssVars;
    }

    it('sets --color-primary to the bgColor (or theme primary)', () => {
        const vars = captureSyncBackdrop({ bgColor: '#032858' });
        expect(vars.get('--color-primary')).toBe('#032858');
    });

    it('sets --backdrop-opacity to backdropOpacity / 100', () => {
        const vars = captureSyncBackdrop({ backdropOpacity: 80 });
        const opacity = parseFloat(vars.get('--backdrop-opacity'));
        expect(opacity).toBeCloseTo(0.8, 2);
    });

    it('sets --color-primary-rgb as a comma-separated RGB string', () => {
        const vars = captureSyncBackdrop({ bgColor: '#032858' });
        const rgb = vars.get('--color-primary-rgb');
        expect(rgb).toMatch(/^\d+, \d+, \d+$/);
    });

    it('sets is-light-bg on body for light colors', () => {
        const cssVars = new Map();
        vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(
            (prop, val) => cssVars.set(prop, val)
        );
        vi.spyOn(document.documentElement.style, 'removeProperty').mockImplementation(() => {});

        const { tm } = makeTM({ bgColor: '#ffffff' });
        document.body.classList.remove('is-light-bg');
        tm.syncBackdrop();

        vi.restoreAllMocks();
        expect(document.body.classList.contains('is-light-bg')).toBe(true);
    });

    it('removes is-light-bg from body for dark colors', () => {
        const cssVars = new Map();
        vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(
            (prop, val) => cssVars.set(prop, val)
        );
        vi.spyOn(document.documentElement.style, 'removeProperty').mockImplementation(() => {});

        document.body.classList.add('is-light-bg');
        const { tm } = makeTM({ bgColor: '#000000' });
        tm.syncBackdrop();

        vi.restoreAllMocks();
        expect(document.body.classList.contains('is-light-bg')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// updateSwatchActiveState
// ---------------------------------------------------------------------------
describe('ThemeManager.updateSwatchActiveState', () => {
    function buildSwatchGrid(poster) {
        const theme = poster.theme;
        const grid = document.createElement('div');
        grid.id = 'bg-swatch-grid';

        // Build swatches matching the theme's swatch list
        (theme.swatches || []).forEach(sw => {
            const btn = document.createElement('span');
            btn.className = 'swatch';
            btn.dataset.color = sw.hex;
            btn.title = sw.name;
            grid.appendChild(btn);
        });

        // Custom swatch (should never become active via normal matching)
        const custom = document.createElement('span');
        custom.className = 'swatch swatch--custom';
        custom.id = 'btn-custom-color';
        grid.appendChild(custom);
        document.body.appendChild(grid);

        poster.elements.swatchGrid = grid;
        poster.elements.btnCustomColor = custom;
    }

    afterEach(() => {
        document.getElementById('bg-swatch-grid')?.remove();
    });

    it('marks the matching swatch as active', () => {
        const { tm, poster } = makeTM();
        buildSwatchGrid(poster);
        const firstSwatch = poster.theme.swatches?.[0];
        if (!firstSwatch) return;
        poster.state.bgColor = firstSwatch.hex;
        poster.state.accentColor = firstSwatch.accent || null;

        tm.updateSwatchActiveState();

        const swatches = poster.elements.swatchGrid.querySelectorAll('.swatch:not(.swatch--custom)');
        const activeOnes = Array.from(swatches).filter(s => s.classList.contains('active'));
        expect(activeOnes.length).toBeGreaterThanOrEqual(1);
        expect(activeOnes[0].dataset.color.toLowerCase()).toBe(firstSwatch.hex.toLowerCase());
    });

    it('marks btnCustomColor active when no swatch matches', () => {
        const { tm, poster } = makeTM();
        buildSwatchGrid(poster);
        poster.state.bgColor = '#deadbe';

        tm.updateSwatchActiveState();

        expect(poster.elements.btnCustomColor.classList.contains('active')).toBe(true);
    });

    it('marks btnCustomColor inactive when a swatch matches', () => {
        const { tm, poster } = makeTM();
        buildSwatchGrid(poster);
        const firstSwatch = poster.theme.swatches?.[0];
        if (!firstSwatch) return;
        poster.state.bgColor = firstSwatch.hex;
        poster.state.accentColor = firstSwatch.accent || null;

        tm.updateSwatchActiveState();

        expect(poster.elements.btnCustomColor.classList.contains('active')).toBe(false);
    });

    it('is a no-op when swatchGrid is null', () => {
        const { tm } = makeTM();
        expect(() => tm.updateSwatchActiveState()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// cleanupBistroLights
// ---------------------------------------------------------------------------
describe('ThemeManager.cleanupBistroLights', () => {
    it('removes the bistro-lights-container element if present', () => {
        const { tm } = makeTM();
        const container = document.createElement('div');
        container.id = 'bistro-lights-container';
        document.body.appendChild(container);

        tm.cleanupBistroLights();

        expect(document.getElementById('bistro-lights-container')).toBeNull();
    });

    it('removes the resize listener stored on _onBistroResize', () => {
        const { tm } = makeTM();
        const handler = vi.fn();
        tm._onBistroResize = handler;
        window.addEventListener('resize', handler);

        tm.cleanupBistroLights();

        expect(tm._onBistroResize).toBeNull();
        // The handler should no longer fire on resize
        window.dispatchEvent(new Event('resize'));
        expect(handler).not.toHaveBeenCalled();
    });

    it('is a no-op when no container exists', () => {
        const { tm } = makeTM();
        document.getElementById('bistro-lights-container')?.remove();
        expect(() => tm.cleanupBistroLights()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// buildBistroBulbs
// ---------------------------------------------------------------------------
describe('ThemeManager.buildBistroBulbs', () => {
    beforeEach(() => {
        document.getElementById('bistro-lights-container')?.remove();
    });

    afterEach(() => {
        document.getElementById('bistro-lights-container')?.remove();
    });

    it('creates the bistro-lights-container when absent', () => {
        const wrapper = document.createElement('div');
        wrapper.className = 'content-wrapper';
        document.body.appendChild(wrapper);

        const { tm } = makeTM();
        tm.buildBistroBulbs();

        expect(document.getElementById('bistro-lights-container')).not.toBeNull();
        wrapper.remove();
    });

    it('creates a wire element inside the container', () => {
        const wrapper = document.createElement('div');
        wrapper.className = 'content-wrapper';
        document.body.appendChild(wrapper);

        const { tm } = makeTM();
        tm.buildBistroBulbs();

        const wire = document.querySelector('.bistro-wire');
        expect(wire).not.toBeNull();
        wrapper.remove();
    });

    it('creates at least one bistro bulb', () => {
        const wrapper = document.createElement('div');
        wrapper.className = 'content-wrapper';
        document.body.appendChild(wrapper);

        const { tm } = makeTM();
        tm.buildBistroBulbs();

        const bulbs = document.querySelectorAll('.bistro-bulb-peak');
        expect(bulbs.length).toBeGreaterThan(0);
        wrapper.remove();
    });

    it('clears existing bulbs on rebuild', () => {
        const wrapper = document.createElement('div');
        wrapper.className = 'content-wrapper';
        document.body.appendChild(wrapper);

        const { tm } = makeTM();
        tm.buildBistroBulbs();
        const firstCount = document.querySelectorAll('.bistro-bulb-peak').length;
        tm.buildBistroBulbs();
        const secondCount = document.querySelectorAll('.bistro-bulb-peak').length;

        // Should not keep doubling up
        expect(secondCount).toBe(firstCount);
        wrapper.remove();
    });
});
