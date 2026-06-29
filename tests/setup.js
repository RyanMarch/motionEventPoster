/**
 * tests/setup.js
 */

// Stub out APIs that source files reference at load time
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

// Stub localStorage
if (!globalThis.localStorage) {
    const _store = new Map();
    globalThis.localStorage = {
        getItem: (k) => _store.get(k) ?? null,
        setItem: (k, v) => _store.set(k, String(v)),
        removeItem: (k) => _store.delete(k),
        clear: () => _store.clear(),
        get length() { return _store.size; },
    };
}

// Emulate browser global exposure via standard imports
// This allows Vitest's V8 engine to properly instrument coverage!
await import('../js/modules/Constants.js');
await import('../js/modules/Utils.js');
await import('../js/themes.js');
await import('../js/modules/ParticleEngine.js');
await import('../js/modules/ThemeManager.js');
await import('../js/modules/UIController.js');
await import('../js/modules/RemoteManager.js');
await import('../js/EventPoster.js');