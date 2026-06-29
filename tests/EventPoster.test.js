/**
 * tests/EventPoster.test.js
 *
 * Tests for EventPoster pure/stateless methods.
 * EventPoster's constructor requires the full index.html DOM, so we skip it.
 * Instead we call prototype methods directly with .call(fakePoster) — the same
 * pattern used throughout the rest of the test suite.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a minimal fake poster whose shape satisfies the methods under test.
 * Only add fields that the specific test group actually reads.
 */
function makeEP(overrides = {}) {
    const poster = {
        state: {
            ...window.DEFAULTS,
            addedHosts: [],
            removedHosts: [],
            posterText: { ...window.POSTER_TEXT_DEFAULTS },
            isAppRunning: false,
            fullscreenStartTime: null,
            totalFullscreenSeconds: null,
        },
        baseHosts: [],
        body: document.body,
        root: document.documentElement,
        elements: {},
        controlLabels: {},
        controls: {},
        containers: {},
        layers: {},
        theme: window.THEMES?.['spring'] ?? {},
        ...overrides,
    };
    return poster;
}

// Grab the prototype so we can call methods without constructing
const EP = window.EventPoster.prototype;

// ---------------------------------------------------------------------------
// loadSettings
// ---------------------------------------------------------------------------
describe('EventPoster.loadSettings', () => {
    beforeEach(() => localStorage.clear());

    it('returns {} when nothing is stored', () => {
        const result = EP.loadSettings.call(makeEP());
        expect(result).toEqual({});
    });

    it('round-trips valid JSON', () => {
        localStorage.setItem(window.STORAGE_KEYS.settings, JSON.stringify({ maxPetals: 99 }));
        const result = EP.loadSettings.call(makeEP());
        expect(result.maxPetals).toBe(99);
    });

    it('returns {} on corrupt JSON', () => {
        localStorage.setItem(window.STORAGE_KEYS.settings, '{broken json}}');
        const result = EP.loadSettings.call(makeEP());
        expect(result).toEqual({});
    });
});

// ---------------------------------------------------------------------------
// saveSettings
// ---------------------------------------------------------------------------
describe('EventPoster.saveSettings', () => {
    beforeEach(() => localStorage.clear());

    it('persists state keys from DEFAULTS to localStorage', () => {
        const ep = makeEP();
        ep.state.maxPetals = 77;
        EP.saveSettings.call(ep);
        const saved = JSON.parse(localStorage.getItem(window.STORAGE_KEYS.settings));
        expect(saved.maxPetals).toBe(77);
    });

    it('does not store keys not present in DEFAULTS', () => {
        const ep = makeEP();
        ep.state.__testOnly = 'secret';
        EP.saveSettings.call(ep);
        const saved = JSON.parse(localStorage.getItem(window.STORAGE_KEYS.settings));
        expect(saved.__testOnly).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// readStoredHosts / persistAddedHosts
// ---------------------------------------------------------------------------
describe('EventPoster host persistence (added)', () => {
    beforeEach(() => localStorage.clear());

    it('readStoredHosts returns [] when nothing is stored', () => {
        const result = EP.readStoredHosts.call(makeEP());
        expect(result).toEqual([]);
    });

    it('persistAddedHosts + readStoredHosts round-trip', () => {
        const ep = makeEP();
        ep.state.addedHosts = ['Alice', 'Bob'];
        EP.persistAddedHosts.call(ep);
        const result = EP.readStoredHosts.call(ep);
        expect(result).toEqual(['Alice', 'Bob']);
    });

    it('readStoredHosts returns [] on corrupt JSON', () => {
        localStorage.setItem(window.STORAGE_KEYS.addedHosts, 'not-json');
        const result = EP.readStoredHosts.call(makeEP());
        expect(result).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// readStoredRemovedHosts / persistRemovedHosts
// ---------------------------------------------------------------------------
describe('EventPoster host persistence (removed)', () => {
    beforeEach(() => localStorage.clear());

    it('readStoredRemovedHosts returns [] when nothing is stored', () => {
        expect(EP.readStoredRemovedHosts.call(makeEP())).toEqual([]);
    });

    it('persistRemovedHosts + readStoredRemovedHosts round-trip', () => {
        const ep = makeEP();
        ep.state.removedHosts = ['Charlie'];
        EP.persistRemovedHosts.call(ep);
        expect(EP.readStoredRemovedHosts.call(ep)).toEqual(['Charlie']);
    });
});

// ---------------------------------------------------------------------------
// loadPosterText
// ---------------------------------------------------------------------------
describe('EventPoster.loadPosterText', () => {
    beforeEach(() => localStorage.clear());

    it('returns POSTER_TEXT_DEFAULTS when nothing is stored', () => {
        const result = EP.loadPosterText.call(makeEP());
        expect(result).toMatchObject(window.POSTER_TEXT_DEFAULTS);
    });

    it('merges stored values over defaults', () => {
        localStorage.setItem(
            window.STORAGE_KEYS.posterText,
            JSON.stringify({ eventTitle: 'Custom Event' })
        );
        const result = EP.loadPosterText.call(makeEP());
        expect(result.eventTitle).toBe('Custom Event');
        // Other defaults survive
        expect(result.logoMode).toBe(window.POSTER_TEXT_DEFAULTS.logoMode);
    });

    it('returns POSTER_TEXT_DEFAULTS on corrupt JSON', () => {
        localStorage.setItem(window.STORAGE_KEYS.posterText, 'oops{');
        const result = EP.loadPosterText.call(makeEP());
        expect(result).toEqual(window.POSTER_TEXT_DEFAULTS);
    });
});

// ---------------------------------------------------------------------------
// removeHostByName
// ---------------------------------------------------------------------------
describe('EventPoster.removeHostByName', () => {
    function makeEPWithHosts() {
        const ep = makeEP();
        ep.state.addedHosts = ['Alice', 'Bob'];
        ep.state.removedHosts = [];
        ep.persistAddedHosts = vi.fn(() => EP.persistAddedHosts.call(ep));
        ep.persistRemovedHosts = vi.fn(() => EP.persistRemovedHosts.call(ep));
        // renderHosts depends on real DOM — stub it
        ep.renderHosts = vi.fn();
        ep.ui = { renderAddedHosts: vi.fn(), renderRemovedHosts: vi.fn() };
        return ep;
    }

    it('is a no-op for null/undefined name', () => {
        const ep = makeEPWithHosts();
        EP.removeHostByName.call(ep, null);
        expect(ep.state.addedHosts).toEqual(['Alice', 'Bob']);
    });

    it('removes the host from addedHosts', () => {
        const ep = makeEPWithHosts();
        EP.removeHostByName.call(ep, 'Alice');
        expect(ep.state.addedHosts).not.toContain('Alice');
        expect(ep.state.addedHosts).toContain('Bob');
    });

    it('adds the host to removedHosts', () => {
        const ep = makeEPWithHosts();
        EP.removeHostByName.call(ep, 'Alice');
        expect(ep.state.removedHosts).toContain('Alice');
    });

    it('does not duplicate a name already in removedHosts', () => {
        const ep = makeEPWithHosts();
        ep.state.removedHosts = ['Alice'];
        EP.removeHostByName.call(ep, 'Alice');
        expect(ep.state.removedHosts.filter(n => n === 'Alice')).toHaveLength(1);
    });

    it('calls renderHosts', () => {
        const ep = makeEPWithHosts();
        EP.removeHostByName.call(ep, 'Bob');
        expect(ep.renderHosts).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// restoreHostByName
// ---------------------------------------------------------------------------
describe('EventPoster.restoreHostByName', () => {
    function makeEPWithRemoved() {
        const ep = makeEP();
        ep.state.addedHosts = [];
        ep.state.removedHosts = ['Alice'];
        ep.baseHosts = [];
        ep.persistAddedHosts = vi.fn(() => EP.persistAddedHosts.call(ep));
        ep.persistRemovedHosts = vi.fn(() => EP.persistRemovedHosts.call(ep));
        ep.renderHosts = vi.fn();
        ep.ui = { renderAddedHosts: vi.fn(), renderRemovedHosts: vi.fn() };
        return ep;
    }

    it('is a no-op for null/undefined name', () => {
        const ep = makeEPWithRemoved();
        EP.restoreHostByName.call(ep, null);
        expect(ep.state.removedHosts).toContain('Alice');
    });

    it('removes the name from removedHosts', () => {
        const ep = makeEPWithRemoved();
        EP.restoreHostByName.call(ep, 'Alice');
        expect(ep.state.removedHosts).not.toContain('Alice');
    });

    it('re-adds to addedHosts when not a base host', () => {
        const ep = makeEPWithRemoved();
        EP.restoreHostByName.call(ep, 'Alice');
        expect(ep.state.addedHosts).toContain('Alice');
    });

    it('does not re-add when name is in baseHosts', () => {
        const ep = makeEPWithRemoved();
        ep.baseHosts = ['Alice'];
        EP.restoreHostByName.call(ep, 'Alice');
        expect(ep.state.addedHosts).not.toContain('Alice');
    });

    it('does not duplicate if already in addedHosts', () => {
        const ep = makeEPWithRemoved();
        ep.state.addedHosts = ['Alice'];
        EP.restoreHostByName.call(ep, 'Alice');
        expect(ep.state.addedHosts.filter(n => n === 'Alice')).toHaveLength(1);
    });

    it('calls renderHosts', () => {
        const ep = makeEPWithRemoved();
        EP.restoreHostByName.call(ep, 'Alice');
        expect(ep.renderHosts).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// updateSleepStatus
// ---------------------------------------------------------------------------
describe('EventPoster.updateSleepStatus', () => {
    function makeSleepEl() {
        const el = document.createElement('span');
        document.body.appendChild(el);
        return el;
    }

    it('sets class and text to "Active" when status is "on"', () => {
        const el = makeSleepEl();
        const ep = makeEP({ elements: { sleepStatus: el } });
        EP.updateSleepStatus.call(ep, 'on');
        expect(el.textContent).toBe('Active');
        expect(el.className).toContain('status-on');
    });

    it('sets text to "Off" when status is "off"', () => {
        const el = makeSleepEl();
        const ep = makeEP({ elements: { sleepStatus: el } });
        EP.updateSleepStatus.call(ep, 'off');
        expect(el.textContent).toBe('Off');
    });

    it('sets text to "Error" when status is "error"', () => {
        const el = makeSleepEl();
        const ep = makeEP({ elements: { sleepStatus: el } });
        EP.updateSleepStatus.call(ep, 'error');
        expect(el.textContent).toBe('Error');
    });

    it('is a no-op when sleepStatus element is absent', () => {
        const ep = makeEP({ elements: { sleepStatus: null } });
        expect(() => EP.updateSleepStatus.call(ep, 'on')).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// updateScreenSize
// ---------------------------------------------------------------------------
describe('EventPoster.updateScreenSize', () => {
    it('sets textContent to "W × H" format', () => {
        const el = document.createElement('span');
        const ep = makeEP({ elements: { screenSize: el } });
        EP.updateScreenSize.call(ep);
        expect(el.textContent).toMatch(/\d+ × \d+/);
    });

    it('is a no-op when screenSize element is absent', () => {
        const ep = makeEP({ elements: { screenSize: null } });
        expect(() => EP.updateScreenSize.call(ep)).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// updateTimerDisplay
// ---------------------------------------------------------------------------
describe('EventPoster.updateTimerDisplay', () => {
    it('shows "0:00" when fullscreenStartTime is null', () => {
        const el = document.createElement('span');
        const ep = makeEP({ elements: { timer: el } });
        ep.state.fullscreenStartTime = null;
        EP.updateTimerDisplay.call(ep);
        expect(el.textContent).toBe('0:00');
    });

    it('formats elapsed time as M:SS', () => {
        const el = document.createElement('span');
        const ep = makeEP({ elements: { timer: el } });
        // 90 seconds ago
        ep.state.fullscreenStartTime = Date.now() - 90_000;
        EP.updateTimerDisplay.call(ep);
        expect(el.textContent).toBe('1:30');
    });

    it('pads seconds below 10 with a leading zero', () => {
        const el = document.createElement('span');
        const ep = makeEP({ elements: { timer: el } });
        ep.state.fullscreenStartTime = Date.now() - 65_000;
        EP.updateTimerDisplay.call(ep);
        expect(el.textContent).toBe('1:05');
    });

    it('adds stat-value--inactive class when time is 0:00', () => {
        const el = document.createElement('span');
        const ep = makeEP({ elements: { timer: el } });
        ep.state.fullscreenStartTime = null;
        EP.updateTimerDisplay.call(ep);
        expect(el.classList.contains('stat-value--inactive')).toBe(true);
    });

    it('removes stat-value--inactive class when actively timing', () => {
        const el = document.createElement('span');
        el.classList.add('stat-value--inactive');
        const ep = makeEP({ elements: { timer: el } });
        ep.state.fullscreenStartTime = Date.now() - 5_000;
        EP.updateTimerDisplay.call(ep);
        expect(el.classList.contains('stat-value--inactive')).toBe(false);
    });

    it('is a no-op when timer element is absent', () => {
        const ep = makeEP({ elements: { timer: null } });
        expect(() => EP.updateTimerDisplay.call(ep)).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// updateMobileScreenSizeInfo
// ---------------------------------------------------------------------------
describe('EventPoster.updateMobileScreenSizeInfo', () => {
    it('sets innerHTML with detected dimensions', () => {
        const el = document.createElement('div');
        const ep = makeEP({ elements: { mobileScreenSizeInfo: el } });
        EP.updateMobileScreenSizeInfo.call(ep);
        expect(el.innerHTML).toContain('Detected:');
        expect(el.innerHTML).toContain('Recommended:');
        // jsdom reports non-zero innerWidth
        expect(el.innerHTML).toMatch(/\d+×\d+|Unavailable/);
    });

    it('is a no-op when mobileScreenSizeInfo is absent', () => {
        const ep = makeEP({ elements: { mobileScreenSizeInfo: null } });
        expect(() => EP.updateMobileScreenSizeInfo.call(ep)).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// autoGrowTextarea
// ---------------------------------------------------------------------------
describe('EventPoster.autoGrowTextarea', () => {
    it('sets height to auto then to scrollHeight', () => {
        const ep = makeEP();
        const el = document.createElement('textarea');
        document.body.appendChild(el);
        // jsdom sets scrollHeight to 0 for detached-ish elements; just verify
        // the call doesn't throw and height is set to a px string.
        EP.autoGrowTextarea.call(ep, el);
        expect(el.style.height).toMatch(/^\d+px$/);
    });
});

// ---------------------------------------------------------------------------
// applyHideUiState
// ---------------------------------------------------------------------------
describe('EventPoster.applyHideUiState', () => {
    function makeEPForHideUI() {
        // controlLabels elements that should be toggled
        const labels = {
            hideLogo: document.createElement('label'),
            hideDate: document.createElement('label'),
            hideTitle: document.createElement('label'),
            hideHost: document.createElement('label'),
        };
        const ep = makeEP({ controlLabels: labels });
        return { ep, labels };
    }

    it('adds "ui-hidden" to body when hidden=true', () => {
        const { ep } = makeEPForHideUI();
        document.body.classList.remove('ui-hidden');
        EP.applyHideUiState.call(ep, true);
        expect(document.body.classList.contains('ui-hidden')).toBe(true);
    });

    it('removes "ui-hidden" from body when hidden=false', () => {
        const { ep } = makeEPForHideUI();
        document.body.classList.add('ui-hidden');
        EP.applyHideUiState.call(ep, false);
        expect(document.body.classList.contains('ui-hidden')).toBe(false);
    });

    it('hides sub-toggle labels when hidden=true', () => {
        const { ep, labels } = makeEPForHideUI();
        EP.applyHideUiState.call(ep, true);
        Object.values(labels).forEach(el => {
            expect(el.classList.contains('is-hidden')).toBe(true);
        });
    });

    it('shows sub-toggle labels when hidden=false', () => {
        const { ep, labels } = makeEPForHideUI();
        Object.values(labels).forEach(el => el.classList.add('is-hidden'));
        EP.applyHideUiState.call(ep, false);
        Object.values(labels).forEach(el => {
            expect(el.classList.contains('is-hidden')).toBe(false);
        });
    });
});

// ---------------------------------------------------------------------------
// isControlsPanelVisible / isAddHostFormOpen
// ---------------------------------------------------------------------------
describe('EventPoster visibility helpers', () => {
    it('isControlsPanelVisible returns true when panel has is-visible', () => {
        const panel = document.createElement('div');
        panel.classList.add('is-visible');
        const ep = makeEP({ elements: { controlsPanel: panel } });
        expect(EP.isControlsPanelVisible.call(ep)).toBe(true);
    });

    it('isControlsPanelVisible returns false when panel lacks is-visible', () => {
        const panel = document.createElement('div');
        const ep = makeEP({ elements: { controlsPanel: panel } });
        expect(EP.isControlsPanelVisible.call(ep)).toBe(false);
    });

    it('isAddHostFormOpen returns true when form does NOT have is-hidden', () => {
        const form = document.createElement('form');
        const ep = makeEP({ elements: { addHostForm: form } });
        expect(EP.isAddHostFormOpen.call(ep)).toBe(true);
    });

    it('isAddHostFormOpen returns false when form has is-hidden', () => {
        const form = document.createElement('form');
        form.classList.add('is-hidden');
        const ep = makeEP({ elements: { addHostForm: form } });
        expect(EP.isAddHostFormOpen.call(ep)).toBe(false);
    });
});
