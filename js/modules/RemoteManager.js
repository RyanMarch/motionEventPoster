/**
 * RemoteManager handles the WebRTC peer-to-peer connection for remote control.
 *
 * Modes:
 *  - Host (MacBook): Runs the poster. Generates a room code, waits for Remote to connect.
 *    Receives messages → fires DOM events → existing UIController logic handles everything.
 *  - Remote (iPad): URL contains ?remote=1. Shows only the controls panel.
 *    Sends messages to Host whenever the user interacts with a control.
 *
 * The _applying flag prevents echo loops: when the Host fires DOM events to apply
 * a received message, those events are guarded so they don't get re-sent back to Remote.
 */
window.RemoteManager = class RemoteManager {
    constructor(poster) {
        this.poster = poster;
        this.peer = null;
        this.conn = null;
        this._applying = false;
        this._statusEl = null;
        this._modalEl = null;
        this._statusBadgeEl = null;

        const params = new URLSearchParams(location.search);
        this.isRemoteMode = params.has('remote');
        this.prefilledRoom = params.get('room') || '';
    }

    // ─── Initialization ────────────────────────────────────────────────────────

    /**
     * Called after the app starts. Sets up the Remote button on the host,
     * or starts the connection flow on the iPad.
     */
    init() {
        if (this.isRemoteMode) {
            this._initRemoteUI();
        } else {
            this._injectHostUI();
        }
    }

    // ─── Script Loading ─────────────────────────────────────────────────────────

    _loadPeerJS() {
        return new Promise((resolve, reject) => {
            if (window.Peer) { resolve(); return; }
            const s = document.createElement('script');
            // Try vendored file first, fall back to CDN
            s.src = 'js/vendor/peerjs.min.js';
            s.onload = resolve;
            s.onerror = () => {
                // Fallback to CDN
                const s2 = document.createElement('script');
                s2.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
                s2.onload = resolve;
                s2.onerror = () => reject(new Error('Failed to load PeerJS'));
                document.head.appendChild(s2);
            };
            document.head.appendChild(s);
        });
    }

    // ─── Code Generation ────────────────────────────────────────────────────────

    _generateCode() {
        // 6-char alphanumeric, uppercase, easy to read/type
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I confusion
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    // ─── Host Mode ──────────────────────────────────────────────────────────────

    _injectHostUI() {
        // Add "Remote" button to the controls panel header
        const header = document.querySelector('.controls-panel-header');
        if (!header) return;

        const btn = document.createElement('button');
        btn.id = 'btn-remote-start';
        btn.className = 'btn-remote-start';
        btn.title = 'Start Remote Control';
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg><span>Remote</span>`;
        btn.addEventListener('click', () => this._startHost());
        header.appendChild(btn);

        // Status badge (hidden until connected)
        const badge = document.createElement('span');
        badge.id = 'remote-status-badge';
        badge.className = 'remote-status-badge';
        badge.style.display = 'none';
        header.appendChild(badge);
        this._statusBadgeEl = badge;

        // Inject modal HTML
        this._injectModal();
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
                        <div class="remote-connection-status" id="remote-connection-status">
                            <span class="remote-status-dot remote-status-dot--waiting"></span>
                            <span id="remote-status-text">Waiting for iPad to connect…</span>
                        </div>
                        <div class="remote-connect-cols">
                            <div class="remote-qr-wrap">
                                <img id="remote-qr-img" class="remote-qr" src="" alt="QR Code" />
                            </div>
                            <div class="remote-code-wrap">
                                <p class="remote-code-label">Or enter this code on the iPad:</p>
                                <div class="remote-code" id="remote-room-code">——</div>
                                <p class="remote-url-hint">Open on iPad:<br><a id="remote-ipad-url" href="#" target="_blank" class="remote-url-link"></a></p>
                            </div>
                        </div>
                    </div>
                    <div id="remote-modal-connected" class="remote-step" style="display:none">
                        <div class="remote-connected-icon">✓</div>
                        <p class="remote-connected-msg">iPad connected successfully!</p>
                        <p class="remote-connected-sub">All controls are synced. You can close this panel.</p>
                    </div>
                    <div id="remote-modal-error" class="remote-step" style="display:none">
                        <div class="remote-error-icon">⚠</div>
                        <p class="remote-error-msg" id="remote-error-msg">Unable to connect. Check your internet connection and try again.</p>
                        <button class="remote-btn-retry" id="btn-remote-retry">Try Again</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this._modalEl = modal;

        // Wire up close/backdrop
        modal.querySelector('#btn-remote-modal-close').addEventListener('click', () => this._closeModal());
        modal.querySelector('.remote-modal-backdrop').addEventListener('click', () => this._closeModal());
        modal.querySelector('#btn-remote-retry')?.addEventListener('click', () => {
            this._showModalStep('loading');
            this._startHost();
        });
    }

    async _startHost() {
        this._openModal();
        this._showModalStep('loading');

        try {
            await this._loadPeerJS();
        } catch (e) {
            this._showModalStep('error', 'Could not load PeerJS. Check your internet connection.');
            return;
        }

        const tryConnect = (code) => {
            if (this.peer) { this.peer.destroy(); }
            this.peer = new Peer(code, { debug: 0 });

            this.peer.on('open', (id) => {
                this._showConnectionInfo(id);
            });

            this.peer.on('error', (err) => {
                if (err.type === 'unavailable-id') {
                    // Code collision — try a new one
                    tryConnect(this._generateCode());
                } else {
                    this._showModalStep('error', `Connection error: ${err.message || err.type}`);
                }
            });

            this.peer.on('connection', (conn) => {
                this.conn = conn;
                this._onHostConnectionOpen(conn);
            });
        };

        tryConnect(this._generateCode());
    }

    _showConnectionInfo(roomCode) {
        const remoteUrl = `https://motionposter.ryanmarch.me?remote=1&room=${roomCode}`;
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(remoteUrl)}`;

        const codeEl = document.getElementById('remote-room-code');
        const qrEl = document.getElementById('remote-qr-img');
        const urlEl = document.getElementById('remote-ipad-url');
        if (codeEl) codeEl.textContent = roomCode;
        if (qrEl) { qrEl.src = qrApiUrl; }
        if (urlEl) { urlEl.href = remoteUrl; urlEl.textContent = `motionposter.ryanmarch.me?room=${roomCode}`; }

        this._showModalStep('ready');
        this._setConnectionStatus('waiting');
    }

    _onHostConnectionOpen(conn) {
        conn.on('open', () => {
            this._setConnectionStatus('connected');
            // Send full state snapshot to sync the iPad
            this._sendStateSync();
            // Show connected step briefly, then allow closing
            setTimeout(() => {
                this._showModalStep('connected');
                this._updateStatusBadge('connected');
            }, 600);
        });

        conn.on('data', (msg) => this._applyMessage(msg));

        conn.on('close', () => {
            this._updateStatusBadge('disconnected');
            this._setConnectionStatus('waiting');
            this._showModalStep('ready');
        });

        conn.on('error', (err) => {
            console.warn('[Remote] Connection error:', err);
            this._updateStatusBadge('disconnected');
        });
    }

    // ─── Remote Mode (iPad) ────────────────────────────────────────────────────

    _initRemoteUI() {
        // Hide the poster animation, show the remote controller root
        document.body.classList.add('remote-mode');

        // Build the connection screen
        const connectScreen = document.createElement('div');
        connectScreen.id = 'remote-connect-screen';
        connectScreen.className = 'remote-connect-screen';
        connectScreen.innerHTML = `
            <div class="remote-connect-inner">
                <div class="remote-connect-logo">Motion Poster Remote</div>
                <div id="rcs-step-entry" class="rcs-step">
                    <p class="rcs-label">Enter the room code shown on the MacBook:</p>
                    <input type="text"
                           id="rcs-code-input"
                           class="rcs-code-input"
                           maxlength="6"
                           autocomplete="off"
                           autocapitalize="characters"
                           spellcheck="false"
                           placeholder="XXXXXX" />
                    <button id="rcs-connect-btn" class="rcs-connect-btn" disabled>Connect</button>
                </div>
                <div id="rcs-step-connecting" class="rcs-step" style="display:none">
                    <div class="remote-spinner"></div>
                    <p>Connecting to poster…</p>
                </div>
                <div id="rcs-step-error" class="rcs-step" style="display:none">
                    <p class="rcs-error-msg" id="rcs-error-msg">Could not connect. Check the code and try again.</p>
                    <button id="rcs-retry-btn" class="rcs-connect-btn">Try Again</button>
                </div>
            </div>
        `;
        document.body.insertBefore(connectScreen, document.body.firstChild);

        // Wire up input + button
        const input = connectScreen.querySelector('#rcs-code-input');
        const connectBtn = connectScreen.querySelector('#rcs-connect-btn');
        const retryBtn = connectScreen.querySelector('#rcs-retry-btn');

        // Auto-populate if room code was in URL
        if (this.prefilledRoom) {
            input.value = this.prefilledRoom.toUpperCase();
            connectBtn.disabled = false;
        }

        input.addEventListener('input', () => {
            input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            connectBtn.disabled = input.value.length < 4;
        });

        connectBtn.addEventListener('click', () => {
            this._startRemote(input.value.trim());
        });

        retryBtn.addEventListener('click', () => {
            this._showRcsStep('entry');
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !connectBtn.disabled) connectBtn.click();
        });

        // Auto-connect if room code was prefilled
        if (this.prefilledRoom) {
            setTimeout(() => this._startRemote(this.prefilledRoom.toUpperCase()), 200);
        }
    }

    async _startRemote(roomCode) {
        this._showRcsStep('connecting');

        try {
            await this._loadPeerJS();
        } catch (e) {
            this._showRcsStep('error', 'Could not load PeerJS. Check your internet connection.');
            return;
        }

        if (this.peer) { this.peer.destroy(); }
        this.peer = new Peer({ debug: 0 }); // Random ID for the iPad

        this.peer.on('open', () => {
            const conn = this.peer.connect(roomCode, { reliable: true });
            this.conn = conn;

            conn.on('open', () => {
                // Connection established — hide connect screen, show controls
                const screen = document.getElementById('remote-connect-screen');
                if (screen) screen.style.display = 'none';

                // Show the controls panel
                const panel = document.getElementById('controls-panel');
                if (panel) {
                    panel.classList.add('is-visible', 'remote-panel-active');
                    // Remove inactivity behaviors on iPad
                    panel.classList.remove('is-dimmed', 'is-dismissed');
                }

                // Add a persistent header indicating remote connection
                this._injectRemoteHeader();
            });

            conn.on('data', (msg) => this._applyMessage(msg));

            conn.on('close', () => {
                this._showReconnectPrompt();
            });

            conn.on('error', (err) => {
                this._showRcsStep('error', `Connection failed: ${err.message || 'Unknown error'}`);
            });

            // Timeout if no connection within 15s
            const timeout = setTimeout(() => {
                if (!conn.open) {
                    conn.close();
                    this._showRcsStep('error', `Could not reach poster with code "${roomCode}". Make sure the MacBook is showing the Remote panel.`);
                }
            }, 15000);
            conn.on('open', () => clearTimeout(timeout));
        });

        this.peer.on('error', (err) => {
            this._showRcsStep('error', `Connection error: ${err.message || err.type}`);
        });
    }

    _injectRemoteHeader() {
        const header = document.createElement('div');
        header.id = 'remote-controller-header';
        header.className = 'remote-controller-header';
        header.innerHTML = `
            <span class="remote-ctrl-indicator">
                <span class="remote-ctrl-dot"></span>
                Remote Controller
            </span>
        `;
        // Insert before controls panel
        const panel = document.getElementById('controls-panel');
        if (panel) panel.parentNode.insertBefore(header, panel);
    }

    // ─── State Sync ─────────────────────────────────────────────────────────────

    _sendStateSync() {
        if (!this.conn?.open) return;
        const s = this.poster.state;
        const snapshot = {
            type: 'state-sync',
            state: {
                // Sliders
                maxPetals: s.maxPetals,
                windiness: s.windiness,
                fallSpeed: s.fallSpeed,
                tumbleSpeed: s.tumbleSpeed,
                gustStrength: s.gustStrength,
                hostTextSize: s.hostTextSize,
                hostMaxWidth: s.hostMaxWidth,
                insetV: s.insetV,
                insetH: s.insetH,
                backdropOpacity: s.backdropOpacity,
                // Toggles
                hideUi: s.hideUi,
                hideLogo: s.hideLogo,
                hideDate: s.hideDate,
                hideTitle: s.hideTitle,
                hideHost: s.hideHost,
                hideBorder: s.hideBorder,
                qrSoiree: s.qrSoiree,
                qrMembership: s.qrMembership,
                isPetalsPaused: s.isPetalsPaused,
                isBgPaused: s.isBgPaused,
                autoHideMenu: s.autoHideMenu,
                smoothTransitions: s.smoothTransitions,
                disableAutoFullscreen: s.disableAutoFullscreen,
                // Other
                activeTheme: s.activeTheme,
                bgColor: s.bgColor,
                accentColor: s.accentColor,
                hostLayout: s.hostLayout,
                fpsCap: s.fpsCap,
                addedHosts: s.addedHosts,
                removedHosts: s.removedHosts,
                posterText: { ...s.posterText },
            }
        };
        this.conn.send(snapshot);
    }

    // ─── Message Application ────────────────────────────────────────────────────

    send(msg) {
        if (this.conn?.open) {
            this.conn.send(msg);
        }
    }

    _applyMessage(msg) {
        if (!msg || !msg.type) return;
        this._applying = true;
        try {
            switch (msg.type) {
                case 'state-sync':    this._applyStateSync(msg.state); break;
                case 'slider':        this._applySlider(msg); break;
                case 'toggle':        this._applyToggle(msg); break;
                case 'radio':         this._applyRadio(msg); break;
                case 'color':         this._applyColor(msg); break;
                case 'swatch':        this._applySwatch(msg); break;
                case 'theme':         this._applyTheme(msg); break;
                case 'text':          this._applyText(msg); break;
                case 'host-add':      this._applyHostAdd(msg); break;
                case 'host-remove':   this._applyHostRemove(msg); break;
                case 'host-restore':  this._applyHostRestore(msg); break;
                case 'button':        this._applyButton(msg); break;
                default: break;
            }
        } finally {
            this._applying = false;
        }
    }

    _applyStateSync(state) {
        if (!state) return;

        // Apply sliders
        (window.SLIDER_CONFIGS || []).forEach(config => {
            if (state[config.stateKey] === undefined) return;
            const slider = document.getElementById(`slider-${config.id}`);
            const display = document.getElementById(`val-${config.id}`);
            if (slider) {
                slider.value = state[config.stateKey];
                slider.dispatchEvent(new Event('input'));
                slider.dispatchEvent(new Event('change'));
            }
            if (display) display.textContent = `${state[config.stateKey]}${config.suffix || ''}`;
        });

        // Apply toggles
        const toggleMap = {
            hideUi: 'check-hide-ui', hideLogo: 'check-hide-logo', hideDate: 'check-hide-date',
            hideTitle: 'check-hide-title', hideHost: 'check-hide-host', hideBorder: 'check-hide-border',
            qrSoiree: 'check-qr-soiree', qrMembership: 'check-qr-membership',
            autoHideMenu: 'check-auto-hide-menu', smoothTransitions: 'check-smooth-transitions',
            disableAutoFullscreen: 'check-disable-auto-fullscreen'
        };
        Object.entries(toggleMap).forEach(([key, id]) => {
            if (state[key] === undefined) return;
            const el = document.getElementById(id);
            if (el && el.checked !== !!state[key]) {
                el.checked = !!state[key];
                el.dispatchEvent(new Event('change'));
            }
        });

        // Theme
        if (state.activeTheme) {
            this.poster.themeManager?.applyTheme(state.activeTheme);
        }

        // Color
        if (state.bgColor) {
            const picker = document.getElementById('picker-bg-color');
            if (picker) {
                picker.value = state.bgColor;
                picker.dispatchEvent(new Event('input'));
            }
        }

        // Host layout
        if (state.hostLayout) {
            const radio = document.querySelector(`input[name="hostLayout"][value="${state.hostLayout}"]`);
            if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change')); }
        }

        // FPS cap
        if (state.fpsCap !== undefined) {
            const radio = document.querySelector(`input[name="fpsCap"][value="${state.fpsCap}"]`);
            if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change')); }
        }

        // Poster text
        if (state.posterText) {
            const textMap = {
                logoText: 'input-logo-text',
                hostsTitle: 'input-hosts-title',
                eventTopLabel: 'input-event-top-label',
                eventTitle: 'input-event-title',
                eventSubtitle: 'input-event-subtitle',
                eventDate: 'input-event-date'
            };
            Object.entries(textMap).forEach(([key, id]) => {
                if (state.posterText[key] === undefined) return;
                const el = document.getElementById(id);
                if (el) {
                    el.value = state.posterText[key];
                    el.dispatchEvent(new Event('input'));
                }
            });
        }

        // Hosts (add/remove state)
        if (state.addedHosts !== undefined) {
            this.poster.state.addedHosts = state.addedHosts;
        }
        if (state.removedHosts !== undefined) {
            this.poster.state.removedHosts = state.removedHosts;
        }
        if (state.addedHosts !== undefined || state.removedHosts !== undefined) {
            this.poster.renderHosts?.();
            this.poster.ui?.renderAddedHosts?.();
            this.poster.ui?.renderRemovedHosts?.();
        }

        // Pause states
        if (state.isPetalsPaused !== undefined || state.isBgPaused !== undefined) {
            this.poster.syncPauseStates?.();
        }
    }

    _applySlider({ id, value }) {
        const slider = document.getElementById(`slider-${id}`);
        if (!slider) return;
        slider.value = value;
        slider.dispatchEvent(new Event('input'));
        slider.dispatchEvent(new Event('change'));
    }

    _applyToggle({ id, checked }) {
        const el = document.getElementById(id);
        if (!el || el.checked === checked) return;
        el.checked = checked;
        el.dispatchEvent(new Event('change'));
    }

    _applyRadio({ name, value }) {
        const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
        if (!radio || radio.checked) return;
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
    }

    _applyColor({ value }) {
        const picker = document.getElementById('picker-bg-color');
        if (!picker) return;
        picker.value = value;
        picker.dispatchEvent(new Event('input'));
        picker.dispatchEvent(new Event('change'));
    }

    _applySwatch({ color, accent }) {
        if (!this.poster.themeManager) return;
        const s = this.poster.state;
        s.bgColor = color;
        s.accentColor = accent;
        this.poster.themeManager.syncBackdrop?.();
        this.poster.themeManager.updateSwatchActiveState?.();
        this.poster.saveSettings?.();
        // Sync color picker on remote side
        const picker = document.getElementById('picker-bg-color');
        if (picker) picker.value = color;
    }

    _applyTheme({ id }) {
        this.poster.themeManager?.applyTheme(id);
    }

    _applyText({ key, value }) {
        const idMap = {
            logoText: 'input-logo-text',
            hostsTitle: 'input-hosts-title',
            eventTopLabel: 'input-event-top-label',
            eventTitle: 'input-event-title',
            eventSubtitle: 'input-event-subtitle',
            eventDate: 'input-event-date'
        };
        const elId = idMap[key];
        if (!elId) return;
        const el = document.getElementById(elId);
        if (!el) return;
        el.value = value;
        el.dispatchEvent(new Event('input'));
    }

    _applyHostAdd({ name }) {
        if (!name) return;
        // Apply directly to state to bypass any form validation
        const poster = this.poster;
        if (poster.state.addedHosts.includes(name) || poster.baseHosts?.includes(name)) return;
        poster.state.addedHosts.push(name);
        poster.state.hasEverAddedHost = true;
        localStorage.setItem(window.STORAGE_KEYS?.hasEverAddedHost || 'hasEverAddedHost', 'true');
        localStorage.setItem(window.STORAGE_KEYS?.addedHosts || 'addedHosts', JSON.stringify(poster.state.addedHosts));
        poster.renderHosts?.();
        poster.ui?.renderAddedHosts?.();
    }

    _applyHostRemove({ name }) {
        this.poster.removeHostByName?.(name);
    }

    _applyHostRestore({ name }) {
        this.poster.restoreHostByName?.(name);
    }

    _applyButton({ id }) {
        const el = document.getElementById(id);
        if (el) el.click();
    }

    // ─── Modal UX ────────────────────────────────────────────────────────────────

    _openModal() {
        if (this._modalEl) this._modalEl.classList.add('is-open');
    }

    _closeModal() {
        if (this._modalEl) this._modalEl.classList.remove('is-open');
    }

    _showModalStep(step, errorMsg) {
        ['loading', 'ready', 'connected', 'error'].forEach(s => {
            const el = document.getElementById(`remote-modal-${s}`);
            if (el) el.style.display = (s === step) ? '' : 'none';
        });
        if (step === 'error' && errorMsg) {
            const msgEl = document.getElementById('remote-error-msg');
            if (msgEl) msgEl.textContent = errorMsg;
        }
    }

    _setConnectionStatus(state) {
        const dot = this._modalEl?.querySelector('.remote-status-dot');
        const text = document.getElementById('remote-status-text');
        if (!dot || !text) return;
        dot.className = `remote-status-dot remote-status-dot--${state}`;
        text.textContent = state === 'connected' ? 'iPad connected!' : 'Waiting for iPad to connect…';
    }

    _updateStatusBadge(state) {
        const badge = this._statusBadgeEl;
        if (!badge) return;
        badge.style.display = '';
        badge.className = `remote-status-badge remote-status-badge--${state}`;
        badge.textContent = state === 'connected' ? '● Connected' : '○ Disconnected';
        // Clicking badge re-opens the modal
        badge.onclick = () => this._openModal();
    }

    // ─── Remote Connect Screen UX ────────────────────────────────────────────────

    _showRcsStep(step, errorMsg) {
        ['entry', 'connecting', 'error'].forEach(s => {
            const el = document.getElementById(`rcs-step-${s}`);
            if (el) el.style.display = (s === step) ? '' : 'none';
        });
        if (step === 'error' && errorMsg) {
            const msgEl = document.getElementById('rcs-error-msg');
            if (msgEl) msgEl.textContent = errorMsg;
        }
        if (step === 'entry') {
            const input = document.getElementById('rcs-code-input');
            if (input) { input.value = ''; input.focus(); }
            const btn = document.getElementById('rcs-connect-btn');
            if (btn) btn.disabled = true;
        }
    }

    _showReconnectPrompt() {
        const screen = document.getElementById('remote-connect-screen');
        if (screen) screen.style.display = '';
        this._showRcsStep('error', 'Lost connection to the poster. Enter the room code again to reconnect.');
    }
};
