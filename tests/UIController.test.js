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
            inactivityTimer: null,
            dismissTimer: null,
            ...stateOverrides,
        },
        baseHosts: window.DEFAULT_HOSTS || [],
        inactivityTimer: null,
        dismissTimer: null,
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
    it('clears inactivityTimer and dismissTimer on the poster', () => {
        const { ui, poster } = makeUI();
        poster.inactivityTimer = setTimeout(() => {}, 99999);
        poster.dismissTimer = setTimeout(() => {}, 99999);
        ui.clearInactivityTimers();
        expect(poster.inactivityTimer).toBeNull();
        expect(poster.dismissTimer).toBeNull();
    });

    it('does not throw when timers are already null', () => {
        const { ui, poster } = makeUI();
        poster.inactivityTimer = null;
        poster.dismissTimer = null;
        expect(() => ui.clearInactivityTimers()).not.toThrow();
    });
});
