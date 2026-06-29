/**
 * tests/ParticleEngine.physics.test.js
 *
 * Tests for ParticleEngine physics logic.
 * The only "mock" here is a minimal fake poster object with pre-set state —
 * no DOM is touched by these specific physics calculations.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a minimal fake poster object that satisfies ParticleEngine's
 * dependencies for physics tests. We pass real theme data so particle
 * creation uses actual config values.
 */
function makeFakePoster(stateOverrides = {}) {
    const springTheme = window.THEMES['spring'];
    return {
        theme: springTheme,
        petalTypes: springTheme.particles,
        layers: {
            back: document.createElement('div'),
            mid: document.createElement('div'),
            front: document.createElement('div'),
        },
        elements: { fps: null },
        state: {
            petals: [],
            maxPetals: 10,
            windiness: 20,
            fallSpeed: 1.0,
            tumbleSpeed: 1.0,
            gustStrength: 50,
            gustForce: 0,
            currentWind: 0,
            windDirection: 1,
            targetWindDirection: 1,
            downtimeTimer: 0,
            lastPhysicsTime: null,
            lastFrameTime: 0,
            lastFrameExecutionTime: null,
            frameCount: 0,
            fpsCap: 0,
            isPetalsPaused: false,
            isBgPaused: false,
            bgColor: null,
            accentColor: null,
            secondaryColor: null,
            ...stateOverrides,
        },
    };
}

// ---------------------------------------------------------------------------
// getRandomPetalType
// ---------------------------------------------------------------------------
describe('ParticleEngine.getRandomPetalType', () => {
    it('always returns a type that exists in petalTypes', () => {
        const poster = makeFakePoster();
        const engine = new window.ParticleEngine(poster);

        for (let i = 0; i < 100; i++) {
            const result = engine.getRandomPetalType();
            expect(poster.petalTypes).toContain(result);
        }
    });

    it('respects weighted distribution roughly (high-weight types drawn more often)', () => {
        const poster = makeFakePoster();
        // Spring: petal weight=30, petal weight=30, leaf weight=20, petal weight=10, petal weight=10
        // Petal types (first two) have combined weight 60 vs leaf weight 20
        const engine = new window.ParticleEngine(poster);

        const counts = new Map();
        const RUNS = 2000;
        for (let i = 0; i < RUNS; i++) {
            const t = engine.getRandomPetalType();
            counts.set(t.type, (counts.get(t.type) || 0) + 1);
        }

        // Leaf (weight 20) should be drawn less often than petals (combined weight 70)
        const leafCount = counts.get('leaf') || 0;
        const petalCount = counts.get('petal') || 0;
        expect(petalCount).toBeGreaterThan(leafCount);
    });
});

// ---------------------------------------------------------------------------
// adjustAmbientPetals
// ---------------------------------------------------------------------------
describe('ParticleEngine.adjustAmbientPetals', () => {
    it('adds petals when currentCount < maxPetals', () => {
        const poster = makeFakePoster({ maxPetals: 5, petals: [] });
        const engine = new window.ParticleEngine(poster);

        engine.adjustAmbientPetals();

        expect(poster.state.petals).toHaveLength(5);
    });

    it('removes petals when currentCount > maxPetals', () => {
        const poster = makeFakePoster({ maxPetals: 2 });
        const engine = new window.ParticleEngine(poster);

        // Pre-fill with 5 petals
        engine.adjustAmbientPetals();
        poster.state.maxPetals = 2;
        // Now add 3 more manually to simulate having 5
        engine.adjustAmbientPetals();
        poster.state.maxPetals = 5;
        engine.adjustAmbientPetals();
        poster.state.maxPetals = 2;
        engine.adjustAmbientPetals();

        expect(poster.state.petals).toHaveLength(2);
    });

    it('does nothing when currentCount === maxPetals', () => {
        const poster = makeFakePoster({ maxPetals: 3, petals: [] });
        const engine = new window.ParticleEngine(poster);

        engine.adjustAmbientPetals();
        const count = poster.state.petals.length;
        engine.adjustAmbientPetals(); // call again with same maxPetals
        expect(poster.state.petals).toHaveLength(count);
    });

    it('sets maxPetals to 0 and removes all petals', () => {
        const poster = makeFakePoster({ maxPetals: 5, petals: [] });
        const engine = new window.ParticleEngine(poster);

        engine.adjustAmbientPetals();
        expect(poster.state.petals).toHaveLength(5);

        poster.state.maxPetals = 0;
        engine.adjustAmbientPetals();
        expect(poster.state.petals).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// createPetal
// ---------------------------------------------------------------------------
describe('ParticleEngine.createPetal', () => {
    it('returns a petal object with required physics properties', () => {
        const poster = makeFakePoster();
        const engine = new window.ParticleEngine(poster);
        const petal = engine.createPetal();

        expect(petal).toHaveProperty('element');
        expect(petal).toHaveProperty('x');
        expect(petal).toHaveProperty('y');
        expect(petal).toHaveProperty('mass');
        expect(petal).toHaveProperty('aero');
        expect(petal).toHaveProperty('rotation');
        expect(petal).toHaveProperty('rotSpeed');
        expect(petal).toHaveProperty('baseFallSpeed');
        expect(petal).toHaveProperty('naturalDrift');
    });

    it('appends a DOM element to one of the three layers', () => {
        const poster = makeFakePoster();
        const engine = new window.ParticleEngine(poster);
        const petal = engine.createPetal();

        const inBack = poster.layers.back.contains(petal.element);
        const inMid = poster.layers.mid.contains(petal.element);
        const inFront = poster.layers.front.contains(petal.element);
        expect(inBack || inMid || inFront).toBe(true);
    });

    it('creates an element with a petal-- class', () => {
        const poster = makeFakePoster();
        const engine = new window.ParticleEngine(poster);
        const petal = engine.createPetal();
        expect(petal.element.className).toMatch(/^petal/);
    });
});

// ---------------------------------------------------------------------------
// updatePhysics — gravity
// ---------------------------------------------------------------------------
describe('ParticleEngine.updatePhysics', () => {
    it('increases y position over time (gravity)', () => {
        const poster = makeFakePoster({ maxPetals: 1, windiness: 0 });
        const engine = new window.ParticleEngine(poster);
        engine.adjustAmbientPetals();

        const petal = poster.state.petals[0];
        // Force a non-shooting-star, non-reflection type
        petal.type = 'petal';
        petal.horizontalSpeed = 0;
        petal.y = 10;
        const initialY = petal.y;

        engine.updatePhysics(1.0); // 1 second dt

        expect(petal.y).toBeGreaterThan(initialY);
    });

    it('wraps a petal back to the top when it falls past y=110', () => {
        const poster = makeFakePoster({ maxPetals: 1 });
        const engine = new window.ParticleEngine(poster);
        engine.adjustAmbientPetals();

        const petal = poster.state.petals[0];
        petal.type = 'petal';
        petal.y = 115; // already past the boundary

        engine.updatePhysics(0.016);

        expect(petal.y).toBeLessThan(10); // wrapped back to top
    });

    it('shooting stars are hidden during spawn delay', () => {
        const poster = makeFakePoster({ maxPetals: 1 });
        const engine = new window.ParticleEngine(poster);
        engine.adjustAmbientPetals();

        const petal = poster.state.petals[0];
        petal.type = 'shooting-star';
        petal.spawnDelay = 5;
        petal.horizontalSpeed = 0; // force init path
        petal.verticalSpeed = undefined;

        engine.updatePhysics(0.016);

        expect(petal.element.style.display).toBe('none');
    });
});

// ---------------------------------------------------------------------------
// adjustAmbientPetals — petal removal path
// ---------------------------------------------------------------------------
describe('ParticleEngine.adjustAmbientPetals — removal', () => {
    it('removes excess petal DOM elements from the layer when shrinking', () => {
        const poster = makeFakePoster({ maxPetals: 4 });
        const engine = new window.ParticleEngine(poster);
        engine.adjustAmbientPetals(); // creates 4

        // Capture all existing elements before shrink
        const allEls = poster.state.petals.map(p => p.element);
        const removedEl = allEls[allEls.length - 1]; // pop() removes last
        const parent = removedEl.parentNode;

        poster.state.maxPetals = 3;
        engine.adjustAmbientPetals();

        expect(poster.state.petals).toHaveLength(3);
        // The popped element should no longer be in the DOM
        expect(parent?.contains(removedEl)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// updateParticleColors
// ---------------------------------------------------------------------------
describe('ParticleEngine.updateParticleColors', () => {
    it('updates background style on particles that use the theme primary color', () => {
        // Find a theme whose particles use useThemePrimary
        const posterForTheme = makeFakePoster({ bgColor: '#ff0000' });
        // Override petalTypes so at least one particle uses useThemePrimary
        const customType = { type: 'petal', color: '#aabbcc', gradient: '#112233',
            weight: 10, sizeMultiplier: 1, shape: '50%', useThemePrimary: true };
        posterForTheme.petalTypes = [customType];
        posterForTheme.theme.particles = [customType];

        const engine = new window.ParticleEngine(posterForTheme);
        engine.adjustAmbientPetals();

        const before = posterForTheme.state.petals[0].element.style.background;
        posterForTheme.state.bgColor = '#00ff00';
        engine.updateParticleColors();

        const after = posterForTheme.state.petals[0].element.style.background;
        // Background should now reference the new color
        expect(after).not.toBe('');
        // Green should appear in the new background, not the original red
        expect(after.toLowerCase()).not.toBe(before.toLowerCase());
    });

    it('does not throw when state.petals is empty', () => {
        const poster = makeFakePoster({ maxPetals: 0, petals: [] });
        const engine = new window.ParticleEngine(poster);
        expect(() => engine.updateParticleColors()).not.toThrow();
    });
});
