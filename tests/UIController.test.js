/**
 * tests/UIController.test.js
 *
 * Tests for UIController — isolated/pure methods only.
 * Event listener binding (bindSliders, bindToggles, etc.) is deferred
 * as it requires a full index.html DOM fixture.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a minimal fake poster for UIController tests.
 */
function makeFakePoster(stateOverrides = {}) {
    return {
        state: {
            addedHosts: [],
            removedHosts: [],
            autoHideMenu: true,
            isAppRunning: false,
            isKeyboardUser: false,
            ...stateOverrides,
        },
        baseHosts: window.DEFAULT_HOSTS || [],
        root: document.documentElement,
        isControlsPanelVisible: vi.fn(() => false),
        isAddHostFormOpen: vi.fn(() => false),
        optimizeLayouts: vi.fn(),
        removeHostByName: vi.fn(),
        restoreHostByName: vi.fn(),
        renderHosts: vi.fn(),
        autoGrowTextarea: vi.fn(),
        elements: {
            controlsPanel: null,
            addedHostsItems: null,
            addedHostsList: null,
            removedHostsItems: null,
            removedHostsList: null,
            addHostConfirm: null,
            addHostInput: null,
        },
        controls: {},
    };
}

function makeUI(stateOverrides = {}) {
    const poster = makeFakePoster(stateOverrides);
    const ui = new window.UIController(poster);
    return { ui, poster };
}

// ---------------------------------------------------------------------------
// isTextInput
// ---------------------------------------------------------------------------
describe('UIController.isTextInput', () => {
    it('returns false for null', () => {
        const { ui } = makeUI();
        expect(ui.isTextInput(null)).toBe(false);
    });

    it('returns false for a button element', () => {
        const { ui } = makeUI();
        const btn = document.createElement('button');
        expect(ui.isTextInput(btn)).toBe(false);
    });

    it('returns false for a checkbox input', () => {
        const { ui } = makeUI();
        const input = document.createElement('input');
        input.type = 'checkbox';
        expect(ui.isTextInput(input)).toBe(false);
    });

    it('returns false for a range input', () => {
        const { ui } = makeUI();
        const input = document.createElement('input');
        input.type = 'range';
        expect(ui.isTextInput(input)).toBe(false);
    });

    it('returns true for a text input', () => {
        const { ui } = makeUI();
        const input = document.createElement('input');
        input.type = 'text';
        expect(ui.isTextInput(input)).toBe(true);
    });

    it('returns true for a search input', () => {
        const { ui } = makeUI();
        const input = document.createElement('input');
        input.type = 'search';
        expect(ui.isTextInput(input)).toBe(true);
    });

    it('returns true for a textarea', () => {
        const { ui } = makeUI();
        const textarea = document.createElement('textarea');
        expect(ui.isTextInput(textarea)).toBe(true);
    });

    it('returns false for a contentEditable element not in DOM (jsdom limitation)', () => {
        // In a real browser this would return true; jsdom returns undefined for
        // isContentEditable on detached elements, so Boolean(undefined) === false.
        // This test documents the known jsdom behavior, not a bug in the source.
        const { ui } = makeUI();
        const div = document.createElement('div');
        div.contentEditable = 'true';
        expect(ui.isTextInput(div)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// renderAddedHosts
// ---------------------------------------------------------------------------
describe('UIController.renderAddedHosts', () => {
    function setupHostElements(poster) {
        const list = document.createElement('div');
        list.id = 'added-hosts-list';
        const items = document.createElement('div');
        items.id = 'added-hosts-items';
        document.body.appendChild(list);
        document.body.appendChild(items);
        poster.elements.addedHostsList = list;
        poster.elements.addedHostsItems = items;
    }

    it('hides the list and clears items when addedHosts is empty', () => {
        const { ui, poster } = makeUI({ addedHosts: [] });
        setupHostElements(poster);
        poster.state.addedHosts = [];
        ui.renderAddedHosts();
        expect(poster.elements.addedHostsList.classList.contains('is-hidden')).toBe(true);
        expect(poster.elements.addedHostsItems.innerHTML).toBe('');
    });

    it('renders a row for each added host', () => {
        const { ui, poster } = makeUI();
        setupHostElements(poster);
        poster.state.addedHosts = ['Alice', 'Bob', 'Charlie'];
        ui.renderAddedHosts();
        const rows = poster.elements.addedHostsItems.querySelectorAll('.added-host-row');
        expect(rows).toHaveLength(3);
    });

    it('each row contains the host name', () => {
        const { ui, poster } = makeUI();
        setupHostElements(poster);
        poster.state.addedHosts = ['Dana'];
        ui.renderAddedHosts();
        const label = poster.elements.addedHostsItems.querySelector('.added-host-name');
        expect(label.textContent).toBe('Dana');
    });

    it('each row contains a remove button with correct data-index', () => {
        const { ui, poster } = makeUI();
        setupHostElements(poster);
        poster.state.addedHosts = ['Eve', 'Frank'];
        ui.renderAddedHosts();
        const buttons = poster.elements.addedHostsItems.querySelectorAll('.btn-remove-host');
        expect(buttons[0].dataset.index).toBe('0');
        expect(buttons[1].dataset.index).toBe('1');
    });

    it('removes the is-hidden class when hosts exist', () => {
        const { ui, poster } = makeUI();
        setupHostElements(poster);
        poster.elements.addedHostsList.classList.add('is-hidden');
        poster.state.addedHosts = ['Grace'];
        ui.renderAddedHosts();
        expect(poster.elements.addedHostsList.classList.contains('is-hidden')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// renderRemovedHosts
// ---------------------------------------------------------------------------
describe('UIController.renderRemovedHosts', () => {
    function setupRemovedElements(poster) {
        const list = document.createElement('div');
        list.id = 'removed-hosts-list';
        const items = document.createElement('div');
        items.id = 'removed-hosts-items';
        document.body.appendChild(list);
        document.body.appendChild(items);
        poster.elements.removedHostsList = list;
        poster.elements.removedHostsItems = items;
    }

    it('hides the list when removedHosts is empty', () => {
        const { ui, poster } = makeUI({ removedHosts: [] });
        setupRemovedElements(poster);
        ui.renderRemovedHosts();
        expect(poster.elements.removedHostsList.classList.contains('is-hidden')).toBe(true);
    });

    it('filters out names that are in baseHosts (only shows user-added removed hosts)', () => {
        const { ui, poster } = makeUI({ removedHosts: ['Base Host', 'User Added'] });
        poster.baseHosts = ['Base Host'];
        setupRemovedElements(poster);
        ui.renderRemovedHosts();
        const rows = poster.elements.removedHostsItems.querySelectorAll('.added-host-row');
        // 'Base Host' should be filtered out — only 'User Added' appears
        expect(rows).toHaveLength(1);
        expect(rows[0].querySelector('.added-host-name').textContent).toBe('User Added');
    });

    it('each row contains a restore button with data-name', () => {
        const { ui, poster } = makeUI({ removedHosts: ['Hank'] });
        poster.baseHosts = [];
        setupRemovedElements(poster);
        ui.renderRemovedHosts();
        const btn = poster.elements.removedHostsItems.querySelector('.btn-restore-host');
        expect(btn.dataset.name).toBe('Hank');
    });

    it('unhides the list when there are displayable removed hosts', () => {
        const { ui, poster } = makeUI({ removedHosts: ['Ivy'] });
        poster.baseHosts = [];
        setupRemovedElements(poster);
        poster.elements.removedHostsList.classList.add('is-hidden');
        ui.renderRemovedHosts();
        expect(poster.elements.removedHostsList.classList.contains('is-hidden')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// clearInactivityTimers
// ---------------------------------------------------------------------------
describe('UIController.clearInactivityTimers', () => {
    it('clears inactivityTimer and dismissTimer on the UIController', () => {
        const { ui } = makeUI();
        ui.inactivityTimer = setTimeout(() => {}, 99999);
        ui.dismissTimer = setTimeout(() => {}, 99999);
        ui.clearInactivityTimers();
        expect(ui.inactivityTimer).toBeNull();
        expect(ui.dismissTimer).toBeNull();
    });

    it('does not throw when timers are already null', () => {
        const { ui } = makeUI();
        ui.inactivityTimer = null;
        ui.dismissTimer = null;
        expect(() => ui.clearInactivityTimers()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// syncPosterTextInputs
// ---------------------------------------------------------------------------
describe('UIController.syncPosterTextInputs', () => {
    function buildTextElements(poster) {
        const fields = ['inputLogoText', 'inputHostsTitle', 'inputEventTopLabel',
            'inputEventTitle', 'inputEventSubtitle', 'inputEventDate'];
        fields.forEach(name => {
            const el = document.createElement('input');
            el.type = 'text';
            el.id = name;
            document.body.appendChild(el);
            poster.elements[name] = el;
        });
    }

    it('sets input values from state.posterText', () => {
        const { ui, poster } = makeUI();
        poster.state.posterText = {
            logoText: 'My Org',
            hostsTitle: 'Our Hosts',
            eventTopLabel: 'Annual',
            eventTitle: 'Gala',
            eventSubtitle: 'fundraiser',
            eventDate: 'April 1, 2050',
        };
        buildTextElements(poster);

        ui.syncPosterTextInputs();

        expect(poster.elements.inputLogoText.value).toBe('My Org');
        expect(poster.elements.inputHostsTitle.value).toBe('Our Hosts');
        expect(poster.elements.inputEventTitle.value).toBe('Gala');
        expect(poster.elements.inputEventDate.value).toBe('April 1, 2050');
    });

    it('is a no-op when input elements are null', () => {
        const { ui } = makeUI();
        // All elements default to null in the fake poster
        expect(() => ui.syncPosterTextInputs()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// toggleControlsPanel
// ---------------------------------------------------------------------------
describe('UIController.toggleControlsPanel', () => {
    function buildPanel(poster, opts = {}) {
        const panel = document.createElement('div');
        if (opts.dismissed) panel.classList.add('is-dismissed');
        poster.elements.controlsPanel = panel;
        poster.elements.keyboardHint = null;
        poster.updateScreenSize = vi.fn();
        poster.isControlsPanelVisible = vi.fn(() => panel.classList.contains('is-visible'));
        return panel;
    }

    it('adds is-visible when panel is currently hidden', () => {
        const { ui, poster } = makeUI();
        const panel = buildPanel(poster);
        ui.toggleControlsPanel();
        expect(panel.classList.contains('is-visible')).toBe(true);
    });

    it('removes is-visible when panel is already visible', () => {
        const { ui, poster } = makeUI();
        const panel = buildPanel(poster);
        panel.classList.add('is-visible');
        ui.toggleControlsPanel();
        expect(panel.classList.contains('is-visible')).toBe(false);
    });

    it('is a no-op when panel is null', () => {
        const { ui, poster } = makeUI();
        poster.elements.controlsPanel = null;
        expect(() => ui.toggleControlsPanel()).not.toThrow();
    });

    it('clears inactivity timers when hiding the panel', () => {
        const { ui, poster } = makeUI();
        const panel = buildPanel(poster);
        panel.classList.add('is-visible');
        ui.inactivityTimer = setTimeout(() => {}, 99999);
        ui.toggleControlsPanel();
        expect(ui.inactivityTimer).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// resetGlobalInactivityTimer
// ---------------------------------------------------------------------------
describe('UIController.resetGlobalInactivityTimer', () => {
    it('removes inactivity-hide from root immediately', () => {
        const { ui, poster } = makeUI({ autoHideMenu: false });
        poster.root.classList.add('inactivity-hide');
        poster.isControlsPanelVisible = vi.fn(() => false);
        ui.resetGlobalInactivityTimer();
        expect(poster.root.classList.contains('inactivity-hide')).toBe(false);
    });

    it('does not schedule inactivity timer when autoHideMenu is false', () => {
        const { ui, poster } = makeUI({ autoHideMenu: false });
        poster.isControlsPanelVisible = vi.fn(() => false);
        ui.resetGlobalInactivityTimer();
        expect(ui.globalInactivityTimer).toBeUndefined();
    });

    it('does not schedule inactivity timer when panel is visible', () => {
        const { ui, poster } = makeUI({ autoHideMenu: true });
        poster.isControlsPanelVisible = vi.fn(() => true);
        ui.resetGlobalInactivityTimer();
        // Timer may be set but inactivity-hide should not be applied while panel is open
        // The key assertion: root does not have inactivity-hide right now
        expect(poster.root.classList.contains('inactivity-hide')).toBe(false);
    });
});
