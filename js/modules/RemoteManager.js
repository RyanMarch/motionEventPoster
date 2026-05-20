/**
 * RemoteManager — MacBook (Host) side only.
 *
 * Runs inside index.html on the poster MacBook.
 * Responsibilities:
 *  1. Add a "Remote" button to the controls panel header
 *  2. On click: load PeerJS, generate a room code, show QR + code in a modal
 *  3. When the iPad connects: send a full state snapshot
 *  4. Receive messages from the iPad → apply them to the poster
 *
 * Messages received from the iPad:
 *   { type: 'slider',       id, value }
 *   { type: 'toggle',       id, checked }
 *   { type: 'radio',        name, value }
 *   { type: 'color',        value }
 *   { type: 'swatch',       color, accent }
 *   { type: 'theme',        id }
 *   { type: 'text',         key, value }
 *   { type: 'button',       id }
 *   { type: 'host-add',     name }
 *   { type: 'host-remove',  name }
 *   { type: 'host-restore', name }
 */
window.RemoteManager = class RemoteManager {
    constructor(poster) {
        this.poster = poster;
        this.peer = null;
        this.conn = null;
        this._modalEl = null;
        this._statusBadgeEl = null;

        // _applying: set true while we apply a received message so any DOM event
        // handlers that also try to send don't create an echo back to the iPad.
        this._applying = false;
    }

    // Public send — called by UIController/ThemeManager hooks.
    // No-op when no iPad is connected; forwards when connected.
    send(msg) {
        if (this.conn?.open) this.conn.send(msg);
    }

    // ─── Init ────────────────────────────────────────────────────────────────

    init() {
        this._injectButton();
        this._injectModal();
    }

    // ─── Host UI ─────────────────────────────────────────────────────────────

    _injectButton() {
        const header = document.querySelector('.controls-panel-header');
        if (!header) return;

        const btn = document.createElement('button');
        btn.id = 'btn-remote-start';
        btn.className = 'btn-remote-start';
        btn.title = 'Start Remote Control';
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
            <span>Remote</span>`;
        btn.addEventListener('click', () => this._startHost());
        header.appendChild(btn);

        // Status badge — hidden until a remote connects
        const badge = document.createElement('span');
        badge.id = 'remote-status-badge';
        badge.className = 'remote-status-badge';
        badge.style.display = 'none';
        badge.addEventListener('click', () => this._openModal());
        header.appendChild(badge);
        this._statusBadgeEl = badge;
    }

    _injectModal() {
        const modal = document.createElement('div');
        modal.id = 'remote-modal';
        modal.className = 'remote-modal';
        modal.innerHTML = `
            <div class="remote-modal-backdrop"></div>
            <div class="remote-modal-panel">
                <div class="remote-modal-header">
                    <h2 class="remote-modal-title">Remote Control</h2>
                    <button class="remote-modal-close" id="btn-remote-modal-close" aria-label="Close">✕</button>
                </div>
                <div class="remote-modal-body">
                    <div id="remote-modal-loading" class="remote-step remote-step--loading">
                        <div class="remote-spinner"></div>
                        <p>Setting up connection…</p>
                    </div>
                    <div id="remote-modal-ready" class="remote-step" style="display:none">
                        <div class="remote-connection-status">
                            <span class="remote-status-dot remote-status-dot--waiting" id="rc-status-dot"></span>
                            <span id="rc-status-text">Waiting for iPad to connect…</span>
                        </div>
                        <div class="remote-connect-cols">
                            <div class="remote-qr-wrap">
                                <img id="remote-qr-img" class="remote-qr" src="" alt="QR Code">
                            </div>
                            <div class="remote-code-wrap">
                                <p class="remote-code-label">Or enter this code on the iPad:</p>
                                <div class="remote-code" id="remote-room-code">——</div>
                                <p class="remote-url-hint">
                                    Open on iPad:<br>
                                    <a id="remote-ipad-url" href="#" target="_blank" class="remote-url-link"></a>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div id="remote-modal-connected" class="remote-step" style="display:none">
                        <div class="remote-connected-icon">✓</div>
                        <p class="remote-connected-msg">iPad connected!</p>
                        <p class="remote-connected-sub">All controls are synced. You can close this panel.</p>
                    </div>
                    <div id="remote-modal-error" class="remote-step" style="display:none">
                        <div class="remote-error-icon">⚠</div>
                        <p class="remote-error-msg" id="remote-error-msg">Unable to connect.</p>
                        <button class="remote-btn-retry" id="btn-remote-retry">Try Again</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
        this._modalEl = modal;

        modal.querySelector('#btn-remote-modal-close').addEventListener('click', () => this._closeModal());
        modal.querySelector('.remote-modal-backdrop').addEventListener('click', () => this._closeModal());
        modal.querySelector('#btn-remote-retry').addEventListener('click', () => {
            this._showModalStep('loading');
            this._startHost();
        });
    }

    // ─── Host Session ─────────────────────────────────────────────────────────

    _generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit 0/O and 1/I
        let code = '';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }

    _loadPeerJS() {
        return new Promise((resolve, reject) => {
            if (window.Peer) { resolve(); return; }
            const s = document.createElement('script');
            s.src = 'js/vendor/peerjs.min.js';
            s.onload = resolve;
            s.onerror = () => {
                const s2 = document.createElement('script');
                s2.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
                s2.onload = resolve;
                s2.onerror = () => reject(new Error('Failed to load PeerJS'));
                document.head.appendChild(s2);
            };
            document.head.appendChild(s);
        });
    }

    async _startHost() {
        this._openModal();
        this._showModalStep('loading');

        try {
            await this._loadPeerJS();
        } catch {
            this._showModalStep('error', 'Could not load the connection library. Check your internet connection.');
            return;
        }

        const tryCode = (code) => {
            if (this.peer) { this.peer.destroy(); this.peer = null; }
            this.peer = new Peer(code, { debug: 0 });

            this.peer.on('open', (id) => this._showConnectionInfo(id));

            this.peer.on('error', (err) => {
                if (err.type === 'unavailable-id') {
                    tryCode(this._generateCode()); // collision — try again
                } else {
                    this._showModalStep('error', `Connection error: ${err.message || err.type}`);
                }
            });

            this.peer.on('connection', (conn) => {
                // Only allow one connection at a time
                if (this.conn?.open) this.conn.close();
                this.conn = conn;
                this._setupConnection(conn);
            });
        };

        tryCode(this._generateCode());
    }

    _showConnectionInfo(roomCode) {
        // Build the URL for the /remote/ page, stripping any filename (e.g. index.html)
        // so it works whether the address bar shows "/" or "/index.html".
        const pageUrl = location.href.replace(/[?#].*$/, '');
        const base = pageUrl.endsWith('/') ? pageUrl : pageUrl.substring(0, pageUrl.lastIndexOf('/') + 1);
        const remoteUrl = `${base}remote/?room=${roomCode}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(remoteUrl)}`;

        const codeEl = document.getElementById('remote-room-code');
        const qrEl   = document.getElementById('remote-qr-img');
        const urlEl  = document.getElementById('remote-ipad-url');

        if (codeEl) codeEl.textContent = roomCode;
        if (qrEl)   qrEl.src = qrUrl;
        if (urlEl)  { urlEl.href = remoteUrl; urlEl.textContent = remoteUrl.replace(/^https?:\/\//, ''); }

        this._showModalStep('ready');
    }

    _setupConnection(conn) {
        conn.on('open', () => {
            this._setStatusDot('connected');
            // Send full state snapshot immediately
            this._sendStateSync(conn);
            // Show connected step briefly then let them close
            setTimeout(() => {
                this._showModalStep('connected');
                this._updateBadge('connected');
            }, 500);
        });

        conn.on('data', (msg) => this._applyMessage(msg));

        conn.on('close', () => {
            this.conn = null;
            this._updateBadge('disconnected');
            // Re-open the modal so they can share the code again
            this._showModalStep('ready');
            this._setStatusDot('waiting');
        });

        conn.on('error', (err) => {
            console.warn('[RemoteManager] connection error:', err);
            this._updateBadge('disconnected');
        });
    }

    // ─── State Sync ──────────────────────────────────────────────────────────

    _sendStateSync(conn) {
        if (!conn?.open) return;
        const s = this.poster.state;
        const pt = s.posterText || {};
        conn.send({
            type: 'state-sync',
            state: {
                // Sliders
                maxPetals: s.maxPetals, windiness: s.windiness,
                fallSpeed: s.fallSpeed, tumbleSpeed: s.tumbleSpeed,
                gustStrength: s.gustStrength, hostTextSize: s.hostTextSize,
                hostMaxWidth: s.hostMaxWidth, insetV: s.insetV, insetH: s.insetH,
                backdropOpacity: s.backdropOpacity,
                // Toggles
                hideUi: s.hideUi, hideLogo: s.hideLogo, hideDate: s.hideDate,
                hideTitle: s.hideTitle, hideHost: s.hideHost, hideBorder: s.hideBorder,
                qrSoiree: s.qrSoiree, qrMembership: s.qrMembership,
                isPetalsPaused: s.isPetalsPaused, isBgPaused: s.isBgPaused,
                // Selects
                activeTheme: s.activeTheme, hostLayout: s.hostLayout, fpsCap: s.fpsCap,
                bgColor: s.bgColor, accentColor: s.accentColor,
                // Text
                posterText: { ...pt },
                // Hosts
                addedHosts: [...(s.addedHosts || [])],
                removedHosts: [...(s.removedHosts || [])],
            }
        });
    }

    // ─── Apply Incoming Messages ──────────────────────────────────────────────

    _applyMessage(msg) {
        if (!msg?.type) return;
        this._applying = true;
        try {
            switch (msg.type) {
                case 'slider':       this._applySlider(msg);      break;
                case 'toggle':       this._applyToggle(msg);      break;
                case 'radio':        this._applyRadio(msg);       break;
                case 'color':        this._applyColor(msg);       break;
                case 'swatch':       this._applySwatch(msg);      break;
                case 'theme':        this._applyTheme(msg);       break;
                case 'text':         this._applyText(msg);        break;
                case 'button':       this._applyButton(msg);      break;
                case 'host-add':     this._applyHostAdd(msg);     break;
                case 'host-remove':  this._applyHostRemove(msg);  break;
                case 'host-restore': this._applyHostRestore(msg); break;
            }
        } finally {
            this._applying = false;
        }
    }

    _applySlider({ id, value }) {
        const slider = document.getElementById(`slider-${id}`);
        if (!slider) return;
        slider.value = value;
        slider.dispatchEvent(new Event('input', { bubbles: false }));
        slider.dispatchEvent(new Event('change', { bubbles: false }));
    }

    _applyToggle({ id, checked }) {
        const el = document.getElementById(id);
        if (!el || el.checked === checked) return;
        el.checked = checked;
        el.dispatchEvent(new Event('change', { bubbles: false }));
    }

    _applyRadio({ name, value }) {
        const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
        if (!radio || radio.checked) return;
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: false }));
    }

    _applyColor({ value }) {
        const picker = document.getElementById('picker-bg-color');
        if (!picker) return;
        picker.value = value;
        picker.dispatchEvent(new Event('input', { bubbles: false }));
        picker.dispatchEvent(new Event('change', { bubbles: false }));
    }

    _applySwatch({ color, accent }) {
        const s = this.poster.state;
        s.bgColor = color;
        s.accentColor = accent;
        this.poster.themeManager?.syncBackdrop?.();
        this.poster.themeManager?.updateSwatchActiveState?.();
        this.poster.saveSettings?.();
        const picker = document.getElementById('picker-bg-color');
        if (picker) picker.value = color;
        const val = document.getElementById('val-bg-color');
        if (val) val.textContent = color.toUpperCase();
    }

    _applyTheme({ id }) {
        this.poster.themeManager?.applyTheme(id);
    }

    _applyText({ key, value }) {
        const idMap = {
            logoText: 'input-logo-text', hostsTitle: 'input-hosts-title',
            eventTopLabel: 'input-event-top-label', eventTitle: 'input-event-title',
            eventSubtitle: 'input-event-subtitle', eventDate: 'input-event-date',
        };
        const el = document.getElementById(idMap[key]);
        if (!el) return;
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: false }));
    }

    _applyButton({ id }) {
        const el = document.getElementById(id);
        if (el) el.click();
    }

    _applyHostAdd({ name }) {
        if (!name) return;
        const s = this.poster.state;
        if (s.addedHosts.includes(name) || this.poster.baseHosts?.includes(name)) return;
        s.addedHosts.push(name);
        s.hasEverAddedHost = true;
        localStorage.setItem(window.STORAGE_KEYS.hasEverAddedHost, 'true');
        localStorage.setItem(window.STORAGE_KEYS.addedHosts, JSON.stringify(s.addedHosts));
        this.poster.renderHosts?.();
        this.poster.ui?.renderAddedHosts?.();
    }

    _applyHostRemove({ name }) {
        this.poster.removeHostByName?.(name);
    }

    _applyHostRestore({ name }) {
        this.poster.restoreHostByName?.(name);
    }

    // ─── Modal UX ─────────────────────────────────────────────────────────────

    _openModal()  { this._modalEl?.classList.add('is-open'); }
    _closeModal() { this._modalEl?.classList.remove('is-open'); }

    _showModalStep(step, errorMsg) {
        ['loading', 'ready', 'connected', 'error'].forEach(s => {
            const el = document.getElementById(`remote-modal-${s}`);
            if (el) el.style.display = (s === step) ? '' : 'none';
        });
        if (step === 'error' && errorMsg) {
            const el = document.getElementById('remote-error-msg');
            if (el) el.textContent = errorMsg;
        }
    }

    _setStatusDot(state) {
        const dot  = document.getElementById('rc-status-dot');
        const text = document.getElementById('rc-status-text');
        if (dot)  dot.className  = `remote-status-dot remote-status-dot--${state}`;
        if (text) text.textContent = state === 'connected' ? 'iPad connected!' : 'Waiting for iPad to connect…';
    }

    _updateBadge(state) {
        const badge = this._statusBadgeEl;
        if (!badge) return;
        badge.style.display = '';
        badge.className = `remote-status-badge remote-status-badge--${state}`;
        badge.textContent = state === 'connected' ? '● Connected' : '○ Disconnected';
    }
};
