/**
 * tests/RemoteManager.test.js
 *
 * Tests for RemoteManager — pure/isolated logic only.
 * PeerJS networking is not tested here (requires a real WebSocket environment).
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal fake poster sufficient for RemoteManager tests.
 */
function makeFakePoster(stateOverrides = {}) {
    return {
        state: {
            addedHosts: [],
            removedHosts: [],
            maxPetals: 20,
            windiness: 10,
            fallSpeed: 0.6,
            tumbleSpeed: 1,
            gustStrength: 50,
            hostTextSize: 1.0,
            hostMaxWidth: 100,
            insetV: 60,
            insetH: 80,
            backdropOpacity: 100,
            hideUi: false, hideLogo: false, hideDate: false,
            hideTitle: false, hideHost: false, hideBorder: false,
            qrSoiree: false, qrMembership: false,
            isPetalsPaused: false, isBgPaused: false,
            activeTheme: 'spring',
            hostLayout: 'centered',
            fpsCap: 90,
            bgColor: null, accentColor: null, secondaryColor: null,
            posterText: { logoText: '', hostsTitle: '', eventTitle: '' },
            hasEverAddedHost: false,
            ...stateOverrides,
        },
        baseHosts: [],
        themeManager: {
            syncBackdrop: vi.fn(),
            updateSwatchActiveState: vi.fn(),
            resolveColorLabel: vi.fn(() => 'Custom'),
            applyTheme: vi.fn(),
        },
        particleEngine: { adjustAmbientPetals: vi.fn() },
        syncLayout: vi.fn(),
        saveSettings: vi.fn(),
        renderHosts: vi.fn(),
        ui: { renderAddedHosts: vi.fn(), toggleControlsPanel: vi.fn() },
        removeHostByName: vi.fn(),
        restoreHostByName: vi.fn(),
        isControlsPanelVisible: vi.fn(() => false),
    };
}

/**
 * Creates a RemoteManager with a fake poster and skips DOM injection
 * (which requires a full controls panel in the DOM).
 */
function makeRM(stateOverrides = {}) {
    const poster = makeFakePoster(stateOverrides);
    const rm = new window.RemoteManager(poster);
    // _modalEl is normally set by _injectModal(); provide a minimal stub
    // so modal methods don't throw in non-modal tests.
    rm._modalEl = document.createElement('div');
    rm._modalEl.innerHTML = `
        <div id="remote-modal-loading"></div>
        <div id="remote-modal-ready" style="display:none"></div>
        <div id="remote-modal-connected" style="display:none"></div>
        <div id="remote-modal-error" style="display:none">
            <p id="remote-error-msg"></p>
        </div>`;
    document.body.appendChild(rm._modalEl);
    return { rm, poster };
}

// ---------------------------------------------------------------------------
// _generateCode
// ---------------------------------------------------------------------------
describe('RemoteManager._generateCode', () => {
    it('returns a 6-character string', () => {
        const { rm } = makeRM();
        expect(rm._generateCode()).toHaveLength(6);
    });

    it('only contains characters from the allowed set (no 0, O, 1, I)', () => {
        const { rm } = makeRM();
        const ALLOWED = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
        for (let i = 0; i < 50; i++) {
            expect(rm._generateCode()).toMatch(ALLOWED);
        }
    });

    it('generates unique codes across multiple calls', () => {
        const { rm } = makeRM();
        const codes = new Set(Array.from({ length: 20 }, () => rm._generateCode()));
        // With a 32^6 space, collisions across 20 calls should be essentially impossible
        expect(codes.size).toBeGreaterThan(15);
    });
});

// ---------------------------------------------------------------------------
// _getSavedCode / _saveCode (sessionStorage round-trip)
// ---------------------------------------------------------------------------
describe('RemoteManager session code persistence', () => {
    beforeEach(() => sessionStorage.clear());

    it('_getSavedCode returns null when nothing is saved', () => {
        const { rm } = makeRM();
        expect(rm._getSavedCode()).toBeNull();
    });

    it('_saveCode persists a code retrievable by _getSavedCode', () => {
        const { rm } = makeRM();
        rm._saveCode('ABCD12');
        expect(rm._getSavedCode()).toBe('ABCD12');
    });

    it('_saveCode overwrites an existing code', () => {
        const { rm } = makeRM();
        rm._saveCode('FIRST1');
        rm._saveCode('SECND2');
        expect(rm._getSavedCode()).toBe('SECND2');
    });
});

// ---------------------------------------------------------------------------
// send()
// ---------------------------------------------------------------------------
describe('RemoteManager.send', () => {
    it('is a no-op when conn is null', () => {
        const { rm } = makeRM();
        rm.conn = null;
        // Should not throw
        expect(() => rm.send({ type: 'test' })).not.toThrow();
    });

    it('is a no-op when conn.open is false', () => {
        const { rm } = makeRM();
        const mockSend = vi.fn();
        rm.conn = { open: false, send: mockSend };
        rm.send({ type: 'test' });
        expect(mockSend).not.toHaveBeenCalled();
    });

    it('calls conn.send with the message when conn.open is true', () => {
        const { rm } = makeRM();
        const mockSend = vi.fn();
        rm.conn = { open: true, send: mockSend };
        const msg = { type: 'slider', id: 'max-petals', value: 30 };
        rm.send(msg);
        expect(mockSend).toHaveBeenCalledWith(msg);
    });
});

// ---------------------------------------------------------------------------
// _applyMessage — dispatch routing
// ---------------------------------------------------------------------------
describe('RemoteManager._applyMessage', () => {
    it('sets _applying to true during processing and false after', () => {
        const { rm } = makeRM();
        let wasApplyingDuring = false;
        // Spy on a handler to capture the flag mid-execution
        vi.spyOn(rm, '_applySlider').mockImplementation(() => {
            wasApplyingDuring = rm._applying;
        });
        rm._applyMessage({ type: 'slider', id: 'max-petals', value: 10 });
        expect(wasApplyingDuring).toBe(true);
        expect(rm._applying).toBe(false);
        vi.restoreAllMocks();
    });

    it('resets _applying to false even if a handler throws', () => {
        const { rm } = makeRM();
        vi.spyOn(rm, '_applySlider').mockImplementation(() => {
            throw new Error('handler error');
        });
        expect(() => rm._applyMessage({ type: 'slider', id: 'x', value: 0 })).toThrow();
        expect(rm._applying).toBe(false);
        vi.restoreAllMocks();
    });

    it('ignores messages with no type', () => {
        const { rm } = makeRM();
        // Should not throw or call any handler
        expect(() => rm._applyMessage({})).not.toThrow();
        expect(() => rm._applyMessage(null)).not.toThrow();
    });

    it.each([
        ['slider',       '_applySlider',      { id: 'max-petals', value: 10 }],
        ['toggle',       '_applyToggle',      { id: 'check-hide-ui', checked: true }],
        ['radio',        '_applyRadio',       { name: 'hostLayout', value: 'centered' }],
        ['color',        '_applyColor',       { value: '#ff0000' }],
        ['swatch',       '_applySwatch',      { color: '#032858', accent: '#f9d783' }],
        ['theme',        '_applyTheme',       { id: 'spring' }],
        ['text',         '_applyText',        { key: 'eventTitle', value: 'Test' }],
        ['button',       '_applyButton',      { id: 'btn-pause-petals' }],
        ['host-add',     '_applyHostAdd',     { name: 'Test User' }],
        ['host-remove',  '_applyHostRemove',  { name: 'Test User' }],
        ['host-restore', '_applyHostRestore', { name: 'Test User' }],
    ])('routes type "%s" to %s', (type, handlerName, extra) => {
        const { rm } = makeRM();
        const spy = vi.spyOn(rm, handlerName).mockImplementation(() => {});
        rm._applyMessage({ type, ...extra });
        expect(spy).toHaveBeenCalledOnce();
        vi.restoreAllMocks();
    });
});

// ---------------------------------------------------------------------------
// _applySwatch
// ---------------------------------------------------------------------------
describe('RemoteManager._applySwatch', () => {
    it('sets bgColor, accentColor, and secondaryColor on state', () => {
        const { rm, poster } = makeRM();
        rm._applySwatch({ color: '#032858', accent: '#f9d783', secondary: '#ffffff' });
        expect(poster.state.bgColor).toBe('#032858');
        expect(poster.state.accentColor).toBe('#f9d783');
        expect(poster.state.secondaryColor).toBe('#ffffff');
    });

    it('calls syncBackdrop and updateSwatchActiveState', () => {
        const { rm, poster } = makeRM();
        rm._applySwatch({ color: '#032858', accent: '#f9d783' });
        expect(poster.themeManager.syncBackdrop).toHaveBeenCalled();
        expect(poster.themeManager.updateSwatchActiveState).toHaveBeenCalled();
    });

    it('calls saveSettings', () => {
        const { rm, poster } = makeRM();
        rm._applySwatch({ color: '#032858', accent: '#f9d783' });
        expect(poster.saveSettings).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// _applySlider
// ---------------------------------------------------------------------------
describe('RemoteManager._applySlider', () => {
    it('updates poster.state for a known slider id', () => {
        const { rm, poster } = makeRM();
        rm._applySlider({ id: 'max-petals', value: 42 });
        expect(poster.state.maxPetals).toBe(42);
    });

    it('calls adjustAmbientPetals when id is max-petals', () => {
        const { rm, poster } = makeRM();
        rm._applySlider({ id: 'max-petals', value: 10 });
        expect(poster.particleEngine.adjustAmbientPetals).toHaveBeenCalled();
    });

    it('calls syncWind when id is gust-strength', () => {
        const syncWind = vi.fn();
        const { rm, poster } = makeRM();
        poster.themeManager.syncWind = syncWind;
        rm._applySlider({ id: 'gust-strength', value: 75 });
        expect(syncWind).toHaveBeenCalled();
    });

    it('calls saveSettings after applying', () => {
        const { rm, poster } = makeRM();
        rm._applySlider({ id: 'fall-speed', value: 1.2 });
        expect(poster.saveSettings).toHaveBeenCalled();
    });

    it('does nothing for an unknown slider id', () => {
        const { rm, poster } = makeRM();
        const before = { ...poster.state };
        rm._applySlider({ id: 'nonexistent-slider', value: 99 });
        // State should be unchanged (saveSettings not called because config not found)
        expect(poster.saveSettings).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// _applyHostAdd
// ---------------------------------------------------------------------------
describe('RemoteManager._applyHostAdd', () => {
    it('adds a new host to addedHosts', () => {
        const { rm, poster } = makeRM();
        rm._applyHostAdd({ name: 'New Person' });
        expect(poster.state.addedHosts).toContain('New Person');
    });

    it('does not add a duplicate host', () => {
        const { rm, poster } = makeRM({ addedHosts: ['Existing Person'] });
        rm._applyHostAdd({ name: 'Existing Person' });
        expect(poster.state.addedHosts.filter(n => n === 'Existing Person')).toHaveLength(1);
    });

    it('does not add a host that is already in baseHosts', () => {
        const { rm, poster } = makeRM();
        poster.baseHosts = ['Base Host'];
        rm._applyHostAdd({ name: 'Base Host' });
        expect(poster.state.addedHosts).not.toContain('Base Host');
    });

    it('sets hasEverAddedHost to true', () => {
        const { rm, poster } = makeRM();
        rm._applyHostAdd({ name: 'Someone' });
        expect(poster.state.hasEverAddedHost).toBe(true);
    });

    it('ignores a message with no name', () => {
        const { rm, poster } = makeRM();
        rm._applyHostAdd({ name: null });
        expect(poster.state.addedHosts).toHaveLength(0);
    });

    it('calls renderHosts and renderAddedHosts', () => {
        const { rm, poster } = makeRM();
        rm._applyHostAdd({ name: 'Test' });
        expect(poster.renderHosts).toHaveBeenCalled();
        expect(poster.ui.renderAddedHosts).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// _applyTheme
// ---------------------------------------------------------------------------
describe('RemoteManager._applyTheme', () => {
    it('calls themeManager.applyTheme with the given id', () => {
        const { rm, poster } = makeRM();
        rm._applyTheme({ id: 'celebration' });
        expect(poster.themeManager.applyTheme).toHaveBeenCalledWith('celebration');
    });
});

// ---------------------------------------------------------------------------
// _applyHostRemove / _applyHostRestore
// ---------------------------------------------------------------------------
describe('RemoteManager host remove/restore', () => {
    it('_applyHostRemove calls poster.removeHostByName', () => {
        const { rm, poster } = makeRM();
        rm._applyHostRemove({ name: 'Someone' });
        expect(poster.removeHostByName).toHaveBeenCalledWith('Someone');
    });

    it('_applyHostRestore calls poster.restoreHostByName', () => {
        const { rm, poster } = makeRM();
        rm._applyHostRestore({ name: 'Someone' });
        expect(poster.restoreHostByName).toHaveBeenCalledWith('Someone');
    });
});

// ---------------------------------------------------------------------------
// _sendStateSync
// ---------------------------------------------------------------------------
describe('RemoteManager._sendStateSync', () => {
    it('does nothing when conn is not open', () => {
        const { rm } = makeRM();
        const mockSend = vi.fn();
        rm.conn = { open: false, send: mockSend };
        rm._sendStateSync(rm.conn);
        expect(mockSend).not.toHaveBeenCalled();
    });

    it('sends a state-sync message with the expected shape', () => {
        const { rm } = makeRM();
        const mockSend = vi.fn();
        rm.conn = { open: true, send: mockSend };
        rm._sendStateSync(rm.conn);
        expect(mockSend).toHaveBeenCalledOnce();
        const msg = mockSend.mock.calls[0][0];
        expect(msg.type).toBe('state-sync');
        expect(msg.state).toHaveProperty('maxPetals');
        expect(msg.state).toHaveProperty('activeTheme');
        expect(msg.state).toHaveProperty('posterText');
        expect(msg.state).toHaveProperty('addedHosts');
        expect(msg.state).toHaveProperty('removedHosts');
    });

    it('snapshots addedHosts as a copy, not a reference', () => {
        const { rm, poster } = makeRM({ addedHosts: ['Alice'] });
        const mockSend = vi.fn();
        rm.conn = { open: true, send: mockSend };
        rm._sendStateSync(rm.conn);
        const sent = mockSend.mock.calls[0][0].state.addedHosts;
        poster.state.addedHosts.push('Bob');
        // The sent snapshot should not reflect mutations made after the send
        expect(sent).not.toContain('Bob');
    });
});

// ---------------------------------------------------------------------------
// _showModalStep
// ---------------------------------------------------------------------------
describe('RemoteManager._showModalStep', () => {
    it('shows only the requested step, hiding all others', () => {
        const { rm } = makeRM();
        // Inject step elements into body so getElementById can find them
        ['loading', 'ready', 'connected', 'error'].forEach(s => {
            const el = document.createElement('div');
            el.id = `remote-modal-${s}`;
            document.body.appendChild(el);
        });

        rm._showModalStep('ready');

        expect(document.getElementById('remote-modal-ready').style.display).toBe('');
        expect(document.getElementById('remote-modal-loading').style.display).toBe('none');
        expect(document.getElementById('remote-modal-connected').style.display).toBe('none');
        expect(document.getElementById('remote-modal-error').style.display).toBe('none');
    });

    it('sets error message text when step is "error"', () => {
        const { rm } = makeRM();
        rm._showModalStep('error', 'Something went wrong');
        const msgEl = document.getElementById('remote-error-msg');
        expect(msgEl?.textContent).toBe('Something went wrong');
    });
});
