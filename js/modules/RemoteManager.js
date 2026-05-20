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

        // If there's a saved room code from a previous session (e.g. after a Live Server
        // reload), silently re-register the same PeerJS ID so the remote can reconnect
        // without the user needing to touch the MacBook.
        const savedCode = this._getSavedCode();
        if (savedCode) {
            this._startHost(/* silent= */ true);
        }
    }

    // ─── Host UI ─────────────────────────────────────────────────────────────

    _injectButton() {
        const scrollArea = document.querySelector('.controls-panel-scroll');
        if (!scrollArea) return;

        // Build a bottom Remote section
        const section = document.createElement('div');
        section.className = 'remote-panel-section';
        section.innerHTML = `
            <div class="remote-panel-section-inner">
                <button id="btn-remote-start" class="btn-remote-start" title="Start Remote Control">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2.5"
                         stroke-linecap="round" stroke-linejoin="round">
                        <rect x="5" y="2" width="14" height="20" rx="2"/>
                        <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                    <span>[W]ireless Remote</span>
                </button>
                <span id="remote-status-badge" class="remote-status-badge" style="display:none"></span>
            </div>`;

        scrollArea.appendChild(section);

        scrollArea.querySelector('#btn-remote-start').addEventListener('click', () => this._startHost());

        const badge = scrollArea.querySelector('#remote-status-badge');
        badge.addEventListener('click', () => this._openModal());
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
                    <h2 class="remote-modal-title">Wireless Remote - Control Pairing</h2>
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
                            <span id="rc-status-text">Waiting for remote device to connect…</span>
                        </div>
                        <div class="remote-connect-cols">
                            <div class="remote-qr-wrap">
                                <img id="remote-qr-img" class="remote-qr" src="" alt="QR Code">
                            </div>
                            <div class="remote-code-wrap">
                                <p class="remote-code-label">Scan QR or <br/>enter this code on remote device:</p>
                                <div class="remote-code-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                    <div class="remote-code" id="remote-room-code" style="margin-bottom: 0;">——</div>
                                    <button id="btn-copy-code" class="btn-copy-icon" title="Copy Code">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </button>
                                </div>
                                <p class="remote-url-hint">
                                    Open on remote device:<br>
                                    <span style="display: inline-flex; align-items: center; gap: 8px; margin-top: 4px; width: 100%; min-width: 0; overflow: hidden;">
                                        <a id="remote-ipad-url" href="#" target="_blank" class="remote-url-link" style="flex: 1; min-width: 0;"></a>
                                        <button id="btn-copy-url" class="btn-copy-icon" title="Copy URL" style="flex-shrink: 0;">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                            </svg>
                                        </button>
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div id="remote-modal-connected" class="remote-step" style="display:none">
                        <div class="remote-connected-icon">✓</div>
                        <p class="remote-connected-msg">Remote device connected!</p>
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

        const copyCodeBtn = modal.querySelector('#btn-copy-code');
        const copyUrlBtn = modal.querySelector('#btn-copy-url');

        const attachCopyHandler = (btn, textFn) => {
            btn?.addEventListener('click', async () => {
                const text = textFn();
                if (!text || text === '——') return;

                try {
                    await navigator.clipboard.writeText(text);
                    btn.classList.add('copied');
                    const originalHTML = btn.innerHTML;
                    const size = btn.id === 'btn-copy-code' ? '16' : '14';
                    btn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>`;
                    setTimeout(() => {
                        btn.classList.remove('copied');
                        btn.innerHTML = originalHTML;
                    }, 2000);
                } catch (err) {
                    console.warn('[RemoteManager] clipboard write failed:', err);
                }
            });
        };

        attachCopyHandler(copyCodeBtn, () => modal.querySelector('#remote-room-code')?.textContent);
        attachCopyHandler(copyUrlBtn, () => modal.querySelector('#remote-ipad-url')?.href);
    }

    // ─── Host Session ─────────────────────────────────────────────────────────

    _generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit 0/O and 1/I
        let code = '';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }

    /** Returns the saved room code from this browser session, if any. */
    _getSavedCode() {
        try { return sessionStorage.getItem('remoteRoomCode') || null; } catch { return null; }
    }

    /** Persists the room code so it survives a Live Server / manual page reload. */
    _saveCode(code) {
        try { sessionStorage.setItem('remoteRoomCode', code); } catch { /* ignore */ }
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

    async _startHost(silent = false) {
        if (!silent) {
            this._openModal();
            this._showModalStep('loading');
        }

        try {
            await this._loadPeerJS();
        } catch {
            if (!silent) this._showModalStep('error', 'Could not load the connection library. Check your internet connection.');
            return;
        }

        const tryCode = (code) => {
            if (this.peer) { this.peer.destroy(); this.peer = null; }
            this.peer = new Peer(code, { debug: 0 });

            this.peer.on('open', (id) => {
                this._saveCode(id);
                if (!silent) this._showConnectionInfo(id);
                // Silent mode: just update the badge so the user can see it's live
                else this._updateBadge('waiting');
            });

            this.peer.on('error', (err) => {
                if (err.type === 'unavailable-id') {
                    // Saved code is taken (e.g. stale session); generate a fresh one
                    tryCode(this._generateCode());
                } else {
                    if (!silent) this._showModalStep('error', `Connection error: ${err.message || err.type}`);
                }
            });

            this.peer.on('connection', (conn) => {
                // Only allow one connection at a time
                if (this.conn?.open) this.conn.close();
                this.conn = conn;
                this._setupConnection(conn);
            });
        };

        // Reuse the code from the last session (survives Live Server reloads)
        const savedCode = this._getSavedCode();
        tryCode(savedCode || this._generateCode());
    }

    _showConnectionInfo(roomCode) {
        // Build the URL for the /remote/ page, stripping any filename (e.g. index.html)
        // so it works whether the address bar shows "/" or "/index.html".
        const pageUrl = location.href.replace(/[?#].*$/, '');
        const base = pageUrl.endsWith('/') ? pageUrl : pageUrl.substring(0, pageUrl.lastIndexOf('/') + 1);
        const remoteUrl = `${base}remote/?code=${roomCode}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(remoteUrl)}`;

        const codeEl = document.getElementById('remote-room-code');
        const qrEl = document.getElementById('remote-qr-img');
        const urlEl = document.getElementById('remote-ipad-url');

        if (codeEl) codeEl.textContent = roomCode;
        if (qrEl) qrEl.src = qrUrl;
        if (urlEl) { urlEl.href = remoteUrl; urlEl.textContent = remoteUrl.replace(/^https?:\/\//, ''); }

        this._showModalStep('ready');
    }

    _setupConnection(conn) {
        conn.on('open', () => {
            this._setStatusDot('connected');
            // Send full state snapshot immediately
            this._sendStateSync(conn);
            // Show connected step briefly, then auto-dismiss the modal
            setTimeout(() => {
                this._showModalStep('connected');
                this._updateBadge('connected');
                // Auto-close after 3 seconds so the host can get back to the poster
                this._autoDismissTimer = setTimeout(() => this._closeModal(), 3000);
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
                case 'slider': this._applySlider(msg); break;
                case 'toggle': this._applyToggle(msg); break;
                case 'radio': this._applyRadio(msg); break;
                case 'color': this._applyColor(msg); break;
                case 'swatch': this._applySwatch(msg); break;
                case 'theme': this._applyTheme(msg); break;
                case 'text': this._applyText(msg); break;
                case 'button': this._applyButton(msg); break;
                case 'host-add': this._applyHostAdd(msg); break;
                case 'host-remove': this._applyHostRemove(msg); break;
                case 'host-restore': this._applyHostRestore(msg); break;
            }
        } finally {
            this._applying = false;
        }
    }

    _applySlider({ id, value }) {
        // Find the config so we know the stateKey and side effects
        const config = (window.SLIDER_CONFIGS || []).find(c => c.id === id);
        if (!config) return;

        // 1. Update the DOM slider + display label (for visual feedback on host)
        const slider = document.getElementById(`slider-${id}`);
        const display = document.getElementById(`val-${id}`);
        if (slider) slider.value = value;
        if (display) display.textContent = `${value}${config.suffix || ''}`;

        // 2. Write directly into poster state (avoids rAF + synthetic-event race)
        const s = this.poster.state;
        s[config.stateKey] = value;

        // 3. Call any required side-effects (mirrors UIController.bindSliders)
        if (id === 'max-petals') this.poster.particleEngine?.adjustAmbientPetals();
        if (id === 'gust-strength') this.poster.themeManager?.syncWind();
        if (['host-text-size', 'host-max-width', 'inset-v', 'inset-h'].includes(id)) this.poster.syncLayout();
        if (id === 'backdrop-opacity') this.poster.themeManager?.syncBackdrop();

        // 4. Persist
        this.poster.saveSettings();
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
        // After a pause toggle or reset, push updated state back to the remote so its
        // controls reflect the new values.
        if (id === 'btn-pause-petals' || id === 'btn-pause-bg' || id === 'btn-reset-defaults') {
            setTimeout(() => this._sendStateSync(this.conn), 50);
        }
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

    _openModal() {
        // Auto-hide the controls panel overlay when pairing modal is displayed
        if (this.poster.isControlsPanelVisible?.()) {
            this.poster.ui?.toggleControlsPanel();
        }
        this._modalEl?.classList.add('is-open');
    }
    _closeModal() {
        // Cancel any pending auto-dismiss so manual closes don't double-fire
        if (this._autoDismissTimer) { clearTimeout(this._autoDismissTimer); this._autoDismissTimer = null; }
        this._modalEl?.classList.remove('is-open');
    }

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
        const dot = document.getElementById('rc-status-dot');
        const text = document.getElementById('rc-status-text');
        if (dot) dot.className = `remote-status-dot remote-status-dot--${state}`;
        if (text) text.textContent = state === 'connected' ? 'Remote device connected!' : 'Waiting for remote device to connect…';
    }

    _updateBadge(state) {
        const badge = this._statusBadgeEl;
        if (!badge) return;
        badge.style.display = '';
        badge.className = `remote-status-badge remote-status-badge--${state}`;
        badge.textContent = state === 'connected' ? '● Connected' : '○ Not Connected';
    }
};
