/**
 * tests/setup.js
 *
 * Loads all source modules into the jsdom window object before each test file,
 * replicating the browser's <script> loading order. No source files are modified.
 *
 * Loading order matches index.html script tag order:
 *   1. Constants    (STORAGE_KEYS, DEFAULTS, SLIDER_CONFIGS, etc.)
 *   2. Utils        (PosterUtils)
 *   3. themes.js    (THEME_PACKS, THEMES, defineTheme)
 *   4. ParticleEngine
 *   5. ThemeManager
 *   6. UIController
 *   7. RemoteManager
 *   8. EventPoster  (main class — not loaded here, needs full DOM)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadScript(relativePath) {
    const absolutePath = resolve(process.cwd(), relativePath);
    const code = readFileSync(absolutePath, 'utf-8');
    // eslint-disable-next-line no-new-func
    const fn = new Function('window', 'document', code);
    fn(globalThis, globalThis.document);
}

// Stub out APIs that source files reference at load time
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

// Stub localStorage — jsdom provides it on window but not on globalThis
// when code is evaluated via new Function('window', ...). Provide a minimal
// in-memory implementation so RemoteManager._applyHostAdd etc. don't throw.
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

// Load modules in dependency order
loadScript('js/modules/Constants.js');
loadScript('js/modules/Utils.js');
loadScript('js/themes.js');
loadScript('js/modules/ParticleEngine.js');
loadScript('js/modules/ThemeManager.js');
loadScript('js/modules/UIController.js');
loadScript('js/modules/RemoteManager.js');
