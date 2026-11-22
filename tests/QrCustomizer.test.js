/**
 * tests/QrCustomizer.test.js
 *
 * QR code generation (bindQRApi), the customize dialog (bindQrCustomizer),
 * remote push, and the persisted QR defaults.
 */

const SIDES = ['left', 'right'];

function makeEnv() {
    document.body.innerHTML = `
        <input id="url-left"><button id="gen-left"></button><div id="status-left" class="is-hidden"></div>
        <input id="url-right"><button id="gen-right"></button><div id="status-right" class="is-hidden"></div>
        <div id="poster-left" class="qr-hidden"></div>
        <dialog id="dlg">
            <span id="side-label"></span>
            <div id="corner"><button class="seg-btn" data-value="square"></button><button class="seg-btn" data-value="rounded"></button></div>
            <input id="fg-hex"><button id="fg-btn"></button><input id="fg-picker">
            <div id="bg-group"></div><input id="bg-hex"><button id="bg-btn"></button><input id="bg-picker">
            <input type="checkbox" id="transparent">
            <div id="icons"><button class="icon-btn" data-value="none"></button><button class="icon-btn" data-value="link"></button></div>
            <button id="cancel"></button><button id="apply"></button>
            <button id="cust-left"></button><button id="cust-right"></button>
        </dialog>`;
    const $ = (id) => document.getElementById(id);
    const dlg = $('dlg');
    // jsdom has no <dialog> modal support
    dlg.showModal = vi.fn(() => { dlg.open = true; });
    dlg.close = vi.fn(() => { dlg.open = false; });

    const poster = {
        state: {
            qrSoiree: false, qrMembership: false,
            posterText: { ...window.POSTER_TEXT_DEFAULTS },
        },
        elements: {
            qrCustomizeDialog: dlg, customizerSideLabel: $('side-label'),
            qrCornerStyleControl: $('corner'),
            qrFgColorBtn: $('fg-btn'), qrFgColorHex: $('fg-hex'), qrFgColorPicker: $('fg-picker'),
            qrBgColorGroup: $('bg-group'), qrBgColorBtn: $('bg-btn'), qrBgColorHex: $('bg-hex'), qrBgColorPicker: $('bg-picker'),
            qrTransparentCheck: $('transparent'), qrIconSelectorGrid: $('icons'),
            btnQrCustCancel: $('cancel'), btnQrCustApply: $('apply'),
            btnCustQrLeft: $('cust-left'), btnCustQrRight: $('cust-right'),
            inputQrLeftUrl: $('url-left'), btnGenQrLeft: $('gen-left'),
            inputQrRightUrl: $('url-right'), btnGenQrRight: $('gen-right'),
        },
        controls: {},
        savePosterText: vi.fn(),
        saveSettings: vi.fn(),
        applyPosterText: vi.fn(),
    };
    const ui = new window.UIController(poster);
    ui.syncPosterTextInputs = vi.fn();
    ui.notifyRemote = vi.fn();
    return { ui, poster, $, dlg };
}

function mockFetchOk(data = 'data:image/png;base64,AAAA') {
    globalThis.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ data }) }));
    return globalThis.fetch;
}

describe('QR defaults', () => {
    it('defines style defaults for both sides', () => {
        const d = window.POSTER_TEXT_DEFAULTS;
        for (const side of ['qrLeft', 'qrRight']) {
            expect(d[side + 'Url']).toBe('');
            expect(d[side + 'FgColor']).toBe('#000000');
            expect(d[side + 'BgColor']).toBe('#FFFFFF');
            expect(d[side + 'Transparent']).toBe(false);
            expect(d[side + 'CornerStyle']).toBe('square');
            expect(d[side + 'Icon']).toBe('none');
        }
    });
});

describe('UIController.bindQRApi', () => {
    afterEach(() => { vi.restoreAllMocks(); });

    it.each(SIDES)('generates the %s QR with style params, stores it, shows it and notifies the remote', async (side) => {
        const { ui, poster, $ } = makeEnv();
        const fetchMock = mockFetchOk();
        const prefix = side === 'left' ? 'qrLeft' : 'qrRight';
        const stateKey = side === 'left' ? 'qrSoiree' : 'qrMembership';
        poster.state.posterText[prefix + 'FgColor'] = '#CC0000';
        poster.state.posterText[prefix + 'Transparent'] = true;
        poster.state.posterText[prefix + 'CornerStyle'] = 'rounded';
        poster.state.posterText[prefix + 'Icon'] = 'link';

        await ui.bindQRApi($('url-' + side), $('gen-' + side), $('status-' + side), prefix + 'Data', stateKey, null, $('poster-left'));
        $('url-' + side).value = ' https://example.com ';
        $('gen-' + side).click();
        await vi.waitFor(() => expect(poster.state.posterText[prefix + 'Data']).toBe('data:image/png;base64,AAAA'));

        const url = new URL(fetchMock.mock.calls[0][0], 'http://x');
        expect(url.pathname).toBe('/api/qr');
        const p = url.searchParams;
        expect(p.get('content')).toBe('https://example.com');
        expect(p.get('fgColor')).toBe('CC0000');
        expect(p.get('transparent')).toBe('true');
        expect(p.get('cornerStyle')).toBe('rounded');
        expect(p.get('icon')).toBe('link');
        expect(p.get('format')).toBe('base64');

        expect(poster.state.posterText[prefix + 'Url']).toBe('https://example.com');
        expect(poster.state[stateKey]).toBe(true);
        expect(poster.savePosterText).toHaveBeenCalled();
        expect(ui.notifyRemote).toHaveBeenCalledTimes(1);
        expect($('poster-left').classList.contains('qr-hidden')).toBe(false);
    });

    it('does nothing for an empty URL', async () => {
        const { ui, poster, $ } = makeEnv();
        const fetchMock = mockFetchOk();
        await ui.bindQRApi($('url-left'), $('gen-left'), $('status-left'), 'qrLeftData', 'qrSoiree', null, null);
        $('gen-left').click();
        await Promise.resolve();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(poster.state.posterText.qrLeftData).toBeNull();
    });

    it('shows an error, keeps old data and does not notify the remote when the API fails', async () => {
        const { ui, poster, $ } = makeEnv();
        globalThis.fetch = vi.fn(async () => ({ ok: false, status: 500 }));
        poster.state.posterText.qrLeftData = 'old';
        await ui.bindQRApi($('url-left'), $('gen-left'), $('status-left'), 'qrLeftData', 'qrSoiree', null, null);
        $('url-left').value = 'https://example.com';
        $('gen-left').click();
        await vi.waitFor(() => expect($('status-left').classList.contains('qr-api-status--error')).toBe(true));
        expect(poster.state.posterText.qrLeftData).toBe('old');
        expect(ui.notifyRemote).not.toHaveBeenCalled();
        expect($('gen-left').disabled).toBe(false);
    });
});

describe('UIController.bindQrCustomizer', () => {
    it.each(SIDES)('opens for the %s side with its stored style', (side) => {
        const { ui, poster, $, dlg } = makeEnv();
        const prefix = side === 'left' ? 'qrLeft' : 'qrRight';
        poster.state.posterText[prefix + 'FgColor'] = '#112233';
        poster.state.posterText[prefix + 'CornerStyle'] = 'rounded';
        poster.state.posterText[prefix + 'Icon'] = 'link';
        ui.bindQrCustomizer();
        $('cust-' + side).click();
        expect(dlg.open).toBe(true);
        expect($('side-label').textContent).toBe(side === 'left' ? 'Left QR Code' : 'Right QR Code');
        expect($('fg-hex').value.toLowerCase()).toBe('#112233');
        expect($('corner').querySelector('.active').dataset.value).toBe('rounded');
        expect($('icons').querySelector('.active').dataset.value).toBe('link');
    });

    it('Apply saves the style for that side only and persists it even with no URL', () => {
        const { ui, poster, $, dlg } = makeEnv();
        ui.bindQrCustomizer();
        $('cust-right').click();
        $('fg-hex').value = '#CC0000';
        $('corner').querySelector('[data-value="rounded"]').click();
        $('icons').querySelector('[data-value="link"]').click();
        $('apply').click();

        const pt = poster.state.posterText;
        expect(pt.qrRightFgColor).toBe('#CC0000');
        expect(pt.qrRightCornerStyle).toBe('rounded');
        expect(pt.qrRightIcon).toBe('link');
        expect(pt.qrLeftFgColor).toBe('#000000');
        expect(pt.qrLeftCornerStyle).toBe('square');
        expect(poster.savePosterText).toHaveBeenCalled();
        expect(dlg.open).toBe(false);
    });

    it('Apply re-generates only when a URL is present', () => {
        const { ui, poster, $ } = makeEnv();
        const gen = vi.fn();
        $('gen-left').addEventListener('click', gen);
        ui.bindQrCustomizer();

        $('cust-left').click(); $('apply').click();
        expect(gen).not.toHaveBeenCalled();

        poster.elements.inputQrLeftUrl.value = 'https://example.com';
        $('cust-left').click(); $('apply').click();
        expect(gen).toHaveBeenCalledTimes(1);
    });

    it('Cancel closes without changing state', () => {
        const { ui, poster, $, dlg } = makeEnv();
        ui.bindQrCustomizer();
        $('cust-left').click();
        $('fg-hex').value = '#CC0000';
        $('cancel').click();
        expect(dlg.open).toBe(false);
        expect(poster.state.posterText.qrLeftFgColor).toBe('#000000');
        expect(poster.savePosterText).not.toHaveBeenCalled();
    });
});

describe('RemoteManager.pushState', () => {
    function makeRM(conn) {
        const poster = {
            state: { posterText: { qrLeftData: 'x' }, addedHosts: [], removedHosts: [], qrSoiree: true, qrMembership: false },
            baseHosts: [],
        };
        const rm = new window.RemoteManager(poster);
        rm.conn = conn;
        return rm;
    }

    it('sends a state-sync including QR visibility and data when connected', () => {
        const conn = { open: true, send: vi.fn() };
        makeRM(conn).pushState();
        const msg = conn.send.mock.calls[0][0];
        expect(msg.type).toBe('state-sync');
        expect(msg.state.qrSoiree).toBe(true);
        expect(msg.state.posterText.qrLeftData).toBe('x');
    });

    it('is a no-op when not paired, when closed, or while applying a remote message', () => {
        const closed = { open: false, send: vi.fn() };
        makeRM(null).pushState();
        makeRM(closed).pushState();
        expect(closed.send).not.toHaveBeenCalled();

        const open = { open: true, send: vi.fn() };
        const rm = makeRM(open);
        rm._applying = true;
        rm.pushState();
        expect(open.send).not.toHaveBeenCalled();
    });
});

describe('RemoteManager._applyQr (remote-driven QR)', () => {
    function setup() {
        document.body.innerHTML = `
            <input id="input-qr-left-url"><button id="btn-gen-qr-left"></button><button id="btn-clear-qr-left"></button>
            <input id="input-qr-right-url"><button id="btn-gen-qr-right"></button><button id="btn-clear-qr-right"></button>`;
        const poster = { state: { posterText: { ...window.POSTER_TEXT_DEFAULTS }, addedHosts: [], removedHosts: [] }, baseHosts: [] };
        const rm = new window.RemoteManager(poster);
        const gen = { left: vi.fn(), right: vi.fn() };
        const clear = { left: vi.fn(), right: vi.fn() };
        for (const s of SIDES) {
            document.getElementById(`btn-gen-qr-${s}`).addEventListener('click', gen[s]);
            document.getElementById(`btn-clear-qr-${s}`).addEventListener('click', clear[s]);
        }
        return { rm, poster, gen, clear };
    }
    const good = { type: 'qr', action: 'generate', url: ' https://example.com ', fg: '#cc0000', bg: '#00ff00', transparent: true, corner: 'leaf', icon: 'wifi' };

    it.each(SIDES)('generate sets the %s style + URL and clicks only that side\'s Generate', (side) => {
        const { rm, poster, gen } = setup();
        const prefix = side === 'left' ? 'qrLeft' : 'qrRight';
        const other = side === 'left' ? 'right' : 'left';
        rm._applyMessage({ ...good, side });
        const pt = poster.state.posterText;
        expect(pt[prefix + 'FgColor']).toBe('#CC0000');
        expect(pt[prefix + 'BgColor']).toBe('#00FF00');
        expect(pt[prefix + 'Transparent']).toBe(true);
        expect(pt[prefix + 'CornerStyle']).toBe('leaf');
        expect(pt[prefix + 'Icon']).toBe('wifi');
        expect(document.getElementById(`input-qr-${side}-url`).value).toBe('https://example.com');
        expect(gen[side]).toHaveBeenCalledTimes(1);
        expect(gen[other]).not.toHaveBeenCalled();
    });

    it('clear clicks the matching Clear button', () => {
        const { rm, clear } = setup();
        rm._applyMessage({ type: 'qr', side: 'right', action: 'clear' });
        expect(clear.right).toHaveBeenCalledTimes(1);
        expect(clear.left).not.toHaveBeenCalled();
    });

    it('clear echoes state back to the remote after the message is applied', async () => {
        const { rm } = setup();
        rm.conn = { open: true, send: vi.fn() };
        rm._applyMessage({ type: 'qr', side: 'left', action: 'clear' });
        expect(rm.conn.send).not.toHaveBeenCalled();
        await new Promise((r) => setTimeout(r, 5));
        expect(rm.conn.send).toHaveBeenCalledWith(expect.objectContaining({ type: 'state-sync' }));
    });

    it('rejects bad input: unknown side/action, empty URL', () => {
        const { rm, gen, clear } = setup();
        rm._applyMessage({ ...good, side: 'middle' });
        rm._applyMessage({ ...good, side: 'left', action: 'explode' });
        rm._applyMessage({ ...good, side: 'left', url: '   ' });
        rm._applyMessage({ ...good, side: 'left', url: 42 });
        expect(gen.left).not.toHaveBeenCalled();
        expect(clear.left).not.toHaveBeenCalled();
    });

    it('ignores invalid style values instead of storing them', () => {
        const { rm, poster } = setup();
        rm._applyMessage({ ...good, side: 'left', fg: 'red; x', bg: 'javascript:1', corner: '../../x', icon: '<img>', transparent: 'yes' });
        const pt = poster.state.posterText;
        expect(pt.qrLeftFgColor).toBe('#000000');
        expect(pt.qrLeftBgColor).toBe('#FFFFFF');
        expect(pt.qrLeftCornerStyle).toBe('square');
        expect(pt.qrLeftIcon).toBe('none');
        expect(pt.qrLeftTransparent).toBe(false);
    });

    it('sendQrStatus reports to an open connection only', () => {
        const { rm } = setup();
        rm.sendQrStatus('left', true);
        rm.conn = { open: true, send: vi.fn() };
        rm.sendQrStatus('left', false);
        expect(rm.conn.send).toHaveBeenCalledWith({ type: 'qr-status', side: 'left', ok: false });
    });
});
