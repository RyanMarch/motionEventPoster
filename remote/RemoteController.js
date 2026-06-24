/**
 * RemoteController — iPad-side only.
 *
 * Responsibilities:
 *  1. Show connect screen, handle code input / auto-connect from ?code=
 *  2. Load PeerJS lazily, connect to the Host peer
 *  3. Receive initial state-sync → populate all controls
 *  4. Bind every control → send message to Host
 *
 * This file runs ONLY on /remote/index.html. It has no knowledge of
 * the poster animation engine — it just sends control messages.
 */
class RemoteController {
    constructor() {
        this.peer = null;
        this.conn = null;
        this._applying = false; // Suppress re-sends while populating from state-sync

        const params = new URLSearchParams(location.search);
        this.prefilledRoom = (params.get('code') || '').toUpperCase();
    }

    // ─── Init ───────────────────────────────────────────────────────────────

    init() {
        this._injectSliders();
        this._initThemeSelector();
        this._wireConnectScreen();
        this._wireAddHost();

        const input = document.getElementById('rcs-code-input');
        if (input && !this.prefilledRoom) {
            // Auto-focus on load
            input.focus();
            // A secondary focus attempt to ensure it succeeds even during layout/rendering cycles
            setTimeout(() => {
                if (document.activeElement !== input) {
                    input.focus();
                }
            }, 50);
        }

        if (this.prefilledRoom) {
            if (input) input.value = this.prefilledRoom;
            // Small delay so the page finishes rendering before connecting
            setTimeout(() => this._connect(this.prefilledRoom), 400);
        }
    }

    // ─── Slider Injection (mirrors UIController.initSlidersUI) ─────────────

    _injectSliders() {
        const configs = window.SLIDER_CONFIGS || [];
        configs.forEach(config => {
            const section = document.getElementById(config.sectionId);
            if (!section) return;

            let container = section;
            if (config.isHalf) {
                let lastRow = section.lastElementChild;
                if (!lastRow || !lastRow.classList.contains('control-row') || lastRow.children.length >= 2) {
                    lastRow = document.createElement('div');
                    lastRow.className = 'control-row';
                    section.appendChild(lastRow);
                }
                container = lastRow;
            }

            const control = document.createElement('div');
            control.className = 'control';
            if (config.id === 'backdrop-opacity') control.style.marginBottom = '12px';

            const label = document.createElement('label');
            label.htmlFor = `slider-${config.id}`;
            label.textContent = `${config.label} `;

            const span = document.createElement('span');
            span.id = `val-${config.id}`;
            span.textContent = `${config.default ?? '—'}${config.suffix || ''}`;
            label.appendChild(span);

            const input = document.createElement('input');
            input.type = 'range';
            input.id = `slider-${config.id}`;
            input.min = config.min;
            input.max = config.max;
            input.step = config.step || 1;
            input.value = config.default ?? config.min;

            control.appendChild(label);
            control.appendChild(input);

            if (config.id === 'backdrop-opacity') {
                container.prepend(control);
            } else {
                container.appendChild(control);
            }
        });
    }

    // ─── Theme Selector ─────────────────────────────────────────────────────

    _initThemeSelector() {
        const container = document.getElementById('theme-select-options');
        const trigger = document.getElementById('theme-select-trigger');
        const selectEl = document.getElementById('theme-custom-select');
        if (!container || typeof THEMES === 'undefined') return;

        container.innerHTML = '';

        // 1. Render Sticky Jump Links at the top of the dropdown container
        const jumpLinksDiv = document.createElement('div');
        jumpLinksDiv.className = 'custom-select-jump-links';
        jumpLinksDiv.setAttribute('role', 'navigation');
        jumpLinksDiv.setAttribute('aria-label', 'Jump to theme pack');
        
        Object.entries(window.THEME_PACKS || {}).forEach(([packId, packInfo]) => {
            const packThemes = Object.values(THEMES).filter(t => t.pack === packId);
            if (packThemes.length === 0) return;

            const link = document.createElement('button');
            link.type = 'button';
            link.className = 'jump-link';
            link.tabIndex = -1; // Keep keyboard focus cycle on custom options
            link.title = `Jump to ${packInfo.name}`;
            
            const iconSpan = document.createElement('span');
            iconSpan.textContent = packInfo.icon;
            link.appendChild(iconSpan);
            
            const textSpan = document.createElement('span');
            textSpan.className = 'jump-link-text';
            textSpan.textContent = packInfo.name.split(' ')[0]; // E.g. "Standard", "Holiday"
            link.appendChild(textSpan);

            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent closing/toggling the select
                const groupEl = container.querySelector(`.custom-select-group[data-pack="${packId}"]`);
                if (groupEl) {
                    const stickyHeight = jumpLinksDiv.offsetHeight || 36;
                    container.scrollTo({
                        top: groupEl.offsetTop - stickyHeight,
                        behavior: 'smooth'
                    });
                }
            });

            jumpLinksDiv.appendChild(link);
        });
        container.appendChild(jumpLinksDiv);

        // 2. Iterate through packs to build grouped dropdown layout
        Object.entries(window.THEME_PACKS || {}).forEach(([packId, packInfo]) => {
            // Filter themes belonging to this pack
            const packThemes = Object.values(THEMES).filter(t => t.pack === packId);
            if (packThemes.length === 0) return;

            const groupDiv = document.createElement('div');
            groupDiv.className = 'custom-select-group';
            groupDiv.dataset.pack = packId;
            groupDiv.setAttribute('role', 'group');
            groupDiv.setAttribute('aria-label', packInfo.name);

            const headerDiv = document.createElement('div');
            headerDiv.className = 'custom-select-group-header';
            headerDiv.setAttribute('role', 'presentation');
            headerDiv.textContent = `${packInfo.icon} ${packInfo.name}`;
            groupDiv.appendChild(headerDiv);

            packThemes.forEach(theme => {
                const opt = document.createElement('div');
                opt.className = 'custom-select-option';
                opt.dataset.value = theme.id;
                opt.setAttribute('role', 'option');
                opt.setAttribute('aria-selected', 'false');
                opt.tabIndex = -1; // Programmatically focused

                const icon = document.createElement('span');
                icon.className = 'option-icon';
                icon.textContent = theme.icon || '✨';

                opt.appendChild(icon);
                opt.appendChild(document.createTextNode(` ${theme.name}`));

                opt.addEventListener('click', () => {
                    this._selectTheme(theme.id, theme.name, theme.icon);
                });
                opt.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { 
                        e.preventDefault(); 
                        this._selectTheme(theme.id, theme.name, theme.icon); 
                    }
                });

                groupDiv.appendChild(opt);
            });

            container.appendChild(groupDiv);
        });

        // Toggle dropdown
        trigger?.addEventListener('click', () => {
            const isOpen = selectEl?.classList.toggle('is-open');
            trigger?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        document.addEventListener('click', (e) => {
            if (!selectEl?.contains(e.target)) {
                selectEl?.classList.remove('is-open');
                trigger?.setAttribute('aria-expanded', 'false');
            }
        });

        // Initial sync of UI labels for the default theme
        const defaultThemeId = Object.keys(THEMES)[0] || 'spring';
        this._syncUILabels(defaultThemeId);
    }

    _selectTheme(id, name, icon) {
        const trigger = document.getElementById('theme-select-trigger');
        document.getElementById('theme-select-icon').textContent = icon || '✨';
        document.getElementById('theme-select-label').textContent = name;
        document.getElementById('theme-custom-select')?.classList.remove('is-open');
        trigger?.setAttribute('aria-expanded', 'false');
        this._updateThemeActive(id);
        // Update swatches for the new theme
        this._initSwatches(id);
        this._syncUILabels(id);
        if (!this._applying) this._send({ type: 'theme', id });
    }

    _updateThemeActive(id) {
        document.querySelectorAll('#theme-select-options .custom-select-option').forEach(opt => {
            const isSelected = opt.dataset.value === id;
            opt.classList.toggle('selected', isSelected);
            opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });
        if (typeof THEMES !== 'undefined') {
            Object.keys(THEMES).forEach(tid => {
                document.body.classList.remove(`theme-${tid}`);
            });
        }
        document.body.classList.add(`theme-${id}`);

    }

    _initSwatches(themeId) {
        if (typeof THEMES === 'undefined') return;
        const theme = THEMES[themeId] || Object.values(THEMES)[0];
        const grid = document.getElementById('bg-swatch-grid');
        if (!grid) return;

        // Remove old swatches (keep .swatch--custom)
        grid.querySelectorAll('.swatch:not(.swatch--custom)').forEach(s => s.remove());

        (theme.swatches || []).forEach(colorObj => {
            const btn = document.createElement('button');
            btn.className = 'swatch';
            btn.style.backgroundColor = colorObj.hex;
            btn.dataset.color = colorObj.hex;
            btn.title = colorObj.name;
            btn.addEventListener('click', () => {
                if (!this._applying) this._send({ type: 'swatch', color: colorObj.hex, accent: colorObj.accent || null, secondary: colorObj.secondary || null });
                // Update picker display
                const picker = document.getElementById('picker-bg-color');
                if (picker) picker.value = colorObj.hex;
                const val = document.getElementById('val-bg-color');
                if (val) val.textContent = colorObj.hex.toUpperCase();
                this._updateSwatchActive(colorObj.hex);
            });
            grid.insertBefore(btn, grid.querySelector('.swatch--custom'));
        });
    }

    _updateSwatchActive(color) {
        document.querySelectorAll('#bg-swatch-grid .swatch:not(.swatch--custom)').forEach(s => {
            s.classList.toggle('active', (s.dataset.color || '').toLowerCase() === (color || '').toLowerCase());
        });
    }

    _syncUILabels(themeId) {
        if (typeof THEMES === 'undefined') return;
        const theme = THEMES[themeId] || Object.values(THEMES)[0];
        if (!theme) return;

        const uiLabels = theme.uiLabels || {
            particlesPlural: 'Particles',
            particlesSingular: 'Particle',
            borderToggle: 'Hide background motif',
            gustStrength: 'Frame Intensity'
        };

        const pLabel = uiLabels.particlesPlural;
        const spLabel = uiLabels.particlesSingular;

        const pTitle = document.getElementById('particles-section-title');
        if (pTitle) pTitle.textContent = pLabel;

        const cntLabel = document.querySelector('label[for="slider-max-petals"]') || document.querySelector('#slider-max-petals')?.parentElement?.querySelector('label');
        if (cntLabel && cntLabel.firstChild) {
            cntLabel.firstChild.textContent = `${spLabel} Count `;
        }

        const bLabel = document.getElementById('check-hide-border')?.closest('label');
        if (bLabel) {
            const labelSpan = bLabel.querySelector('.toggle-label');
            if (labelSpan) labelSpan.textContent = uiLabels.borderToggle;
        }

        const wLabel = document.querySelector('label[for="slider-gust-strength"]') || document.querySelector('#slider-gust-strength')?.parentElement?.querySelector('label');
        if (wLabel && wLabel.firstChild) {
            wLabel.firstChild.textContent = `${uiLabels.gustStrength} `;
        }

        const fLabel = document.querySelector('label[for="slider-fall-speed"]') || document.querySelector('#slider-fall-speed')?.parentElement?.querySelector('label');
        if (fLabel && fLabel.firstChild) {
            fLabel.firstChild.textContent = `${uiLabels.fallSpeed || 'Fall Speed'} `;
        }
         const windinessControl = document.getElementById('slider-gust-freq')?.closest('.control');
        if (windinessControl) {
            windinessControl.style.display = themeId === 'space-odyssey' ? 'none' : '';
        }

        const tumbleControl = document.getElementById('slider-tumble-speed')?.closest('.control');
        if (tumbleControl) {
            tumbleControl.style.display = themeId === 'space-odyssey' ? 'none' : '';
        }

        const backdropControl = document.getElementById('slider-backdrop-opacity')?.closest('.control');
        if (backdropControl) {
            backdropControl.style.display = themeId === 'memphis-pop' ? 'none' : '';
        }

        const valentinesHeartsControl = document.getElementById('label-hide-valentines-hearts');
        if (valentinesHeartsControl) {
            valentinesHeartsControl.style.display = themeId === 'valentines-romance' ? '' : 'none';
        }
    }

    // ─── Connect Screen ─────────────────────────────────────────────────────

    _wireConnectScreen() {
        const input = document.getElementById('rcs-code-input');
        const connectBtn = document.getElementById('rcs-connect-btn');
        const retryBtn = document.getElementById('rcs-retry-btn');

        input?.addEventListener('input', () => {
            input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (connectBtn) connectBtn.disabled = input.value.length < 4;
        });

        connectBtn?.addEventListener('click', () => {
            const code = input?.value.trim();
            if (code) this._connect(code);
        });

        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !connectBtn?.disabled) connectBtn?.click();
        });

        retryBtn?.addEventListener('click', () => this._showStep('entry'));

        this._wireScanner();
    }

    _showStep(step, errorMsg) {
        ['entry', 'connecting', 'error'].forEach(s => {
            const el = document.getElementById(`rcs-step-${s}`);
            if (el) el.style.display = (s === step) ? '' : 'none';
        });
        if (step === 'error' && errorMsg) {
            const el = document.getElementById('rcs-error-msg');
            if (el) el.textContent = errorMsg;
        }
        if (step === 'entry') {
            const input = document.getElementById('rcs-code-input');
            const btn = document.getElementById('rcs-connect-btn');
            if (input) { input.value = ''; input.focus(); }
            if (btn) btn.disabled = true;

            // Hide header room code display
            const codeEl = document.getElementById('rc-header-code');
            if (codeEl) {
                codeEl.textContent = '';
                codeEl.style.display = 'none';
            }
        }
    }

    // ─── PeerJS + Connection ─────────────────────────────────────────────────

    _loadPeerJS() {
        return new Promise((resolve, reject) => {
            if (window.Peer) { resolve(); return; }
            const s = document.createElement('script');
            s.src = '../js/vendor/peerjs.min.js';
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

    async _connect(roomCode) {
        this._showStep('connecting');
        this.roomCode = roomCode;

        try {
            await this._loadPeerJS();
        } catch {
            this._showStep('error', 'Could not load the connection library. Check your internet connection and try again.');
            return;
        }

        if (this.peer) { this.peer.destroy(); this.peer = null; }

        // Give ourselves a random peer ID
        this.peer = new Peer({ debug: 0 });

        const connectTimeout = setTimeout(() => {
            this._showStep('error', `Could not reach the poster with code "${roomCode}". Make sure to open the Remote Pairing panel and try again.`);
        }, 15000);

        this.peer.on('open', () => {
            const conn = this.peer.connect(roomCode, { reliable: true });
            this.conn = conn;

            conn.on('open', () => {
                clearTimeout(connectTimeout);
                this._onConnected();
            });

            conn.on('data', (msg) => this._onMessage(msg));

            conn.on('close', () => {
                // The host may have just reloaded (e.g. Live Server). Retry automatically
                // using the same room code before showing the error screen.
                this._autoReconnect(roomCode);
            });

            conn.on('error', (err) => {
                clearTimeout(connectTimeout);
                this._showStep('error', `Connection failed: ${err.message || 'Unknown error'}`);
            });
        });

        this.peer.on('error', (err) => {
            clearTimeout(connectTimeout);
            this._showStep('error', `Could not connect: ${err.message || err.type || 'Unknown error'}`);
        });
    }

    /**
     * Attempts to reconnect to the same room code automatically.
     * Shows a subtle "Reconnecting…" state rather than the full error screen.
     * Gives up after maxAttempts and then shows the error screen.
     */
    _autoReconnect(roomCode, attempt = 1) {
        const maxAttempts = 5;
        const delayMs = 2000;

        // Show the controller UI with a reconnecting indicator in the header
        const dot = document.querySelector('.rc-header-dot');
        if (dot) dot.innerHTML = '<span class="rc-dot" style="background:#f9a825;box-shadow:0 0 6px rgba(249,168,37,.6)"></span> Reconnecting…';

        if (attempt > maxAttempts) {
            // Give up — show the connect screen error
            document.getElementById('remote-controller')?.classList.remove('is-active');
            document.getElementById('remote-connect-screen').style.display = '';
            this._showStep('error', 'Lost connection to the poster. Enter the room code again to reconnect.');
            return;
        }

        setTimeout(async () => {
            // Reconnect attempt: reuse the existing peer (still valid after conn close)
            if (!this.peer || this.peer.destroyed) {
                try { await this._loadPeerJS(); } catch { /* ignore */ }
                this.peer = new Peer({ debug: 0 });
            }

            const tryConnect = () => {
                const conn = this.peer.connect(roomCode, { reliable: true });
                this.conn = conn;

                const successTimeout = setTimeout(() => {
                    this._autoReconnect(roomCode, attempt + 1);
                }, 3000);

                conn.on('open', () => {
                    clearTimeout(successTimeout);
                    // Restore the live indicator
                    if (dot) dot.innerHTML = '<span class="rc-dot"></span> Live';
                    this._onConnected();
                });
                conn.on('close', () => this._autoReconnect(roomCode));
                conn.on('error', () => {
                    clearTimeout(successTimeout);
                    this._autoReconnect(roomCode, attempt + 1);
                });
            };

            if (this.peer.open) {
                tryConnect();
            } else {
                this.peer.on('open', tryConnect);
            }
        }, delayMs);
    }

    _onConnected() {
        // Hide connect screen, show controller
        document.getElementById('remote-connect-screen').style.display = 'none';
        document.getElementById('remote-controller').classList.add('is-active');

        // Update the header room code display
        const codeEl = document.getElementById('rc-header-code');
        if (codeEl && this.roomCode) {
            codeEl.textContent = this.roomCode;
            codeEl.style.display = 'inline-block';
        }

        // Wire all controls — only once, even if we auto-reconnect multiple times
        if (!this._controlsBound) {
            this._bindControls();
            this._controlsBound = true;
        }
    }

    _send(msg) {
        if (this.conn?.open) this.conn.send(msg);
    }

    // ─── Incoming Messages (state-sync from Host) ───────────────────────────

    _onMessage(msg) {
        if (!msg?.type) return;
        if (msg.type === 'state-sync') {
            this._applyStateSync(msg.state);
        }
        // Host could send individual updates too — handle them
        // (same structure as what we send to host)
    }

    _applyStateSync(state) {
        if (!state) return;
        this._applying = true;
        try {
            // Sliders
            (window.SLIDER_CONFIGS || []).forEach(config => {
                const val = state[config.stateKey];
                if (val === undefined) return;
                const slider = document.getElementById(`slider-${config.id}`);
                const display = document.getElementById(`val-${config.id}`);
                if (slider) slider.value = val;
                if (display) display.textContent = `${val}${config.suffix || ''}`;
            });

            // Checkboxes
            const toggleMap = {
                hideUi: 'check-hide-ui', hideLogo: 'check-hide-logo', hideDate: 'check-hide-date',
                hideTitle: 'check-hide-title', hideHost: 'check-hide-host', hideBorder: 'check-hide-border',
                qrSoiree: 'check-qr-soiree', qrMembership: 'check-qr-membership',
                hideValentinesHearts: 'check-hide-valentines-hearts'
            };
            Object.entries(toggleMap).forEach(([key, id]) => {
                if (state[key] === undefined) return;
                const el = document.getElementById(id);
                if (el) el.checked = !!state[key];
            });

            // Host layout radio
            if (state.hostLayout) {
                const r = document.querySelector(`input[name="hostLayout"][value="${state.hostLayout}"]`);
                if (r) r.checked = true;
            }

            // FPS cap radio
            if (state.fpsCap !== undefined) {
                const r = document.querySelector(`input[name="fpsCap"][value="${state.fpsCap}"]`);
                if (r) r.checked = true;
            }

            // Color picker
            if (state.bgColor) {
                const picker = document.getElementById('picker-bg-color');
                const val = document.getElementById('val-bg-color');
                if (picker) picker.value = state.bgColor;
                if (val) val.textContent = state.bgColor.toUpperCase();
                this._updateSwatchActive(state.bgColor);
            }

            // Theme selector
            if (state.activeTheme && typeof THEMES !== 'undefined') {
                const theme = THEMES[state.activeTheme];
                if (theme) {
                    document.getElementById('theme-select-icon').textContent = theme.icon || '✨';
                    document.getElementById('theme-select-label').textContent = theme.name;
                    this._updateThemeActive(state.activeTheme);
                    this._initSwatches(state.activeTheme);
                    this._syncUILabels(state.activeTheme);
                }
            }

            // Poster text fields
            const textMap = {
                logoText: 'input-logo-text',
                hostsTitle: 'input-hosts-title',
                eventTopLabel: 'input-event-top-label',
                eventTitle: 'input-event-title',
                eventSubtitle: 'input-event-subtitle',
                eventDate: 'input-event-date',
            };
            if (state.posterText) {
                Object.entries(textMap).forEach(([key, id]) => {
                    const val = state.posterText[key];
                    if (val === undefined) return;
                    const el = document.getElementById(id);
                    if (el) el.value = val;
                });
            }

            // Added/removed hosts lists
            if (state.addedHosts !== undefined || state.removedHosts !== undefined) {
                this._renderAddedHosts(state.addedHosts || []);
                this._renderRemovedHosts(state.removedHosts || []);
            }

            // Pause button labels
            const pausePetalsBtn = document.getElementById('btn-pause-petals');
            if (pausePetalsBtn && state.isPetalsPaused !== undefined) {
                pausePetalsBtn.textContent = state.isPetalsPaused ? 'Resume Particles' : 'Pause Particles';
                pausePetalsBtn.classList.toggle('active', !!state.isPetalsPaused);
            }
            const pauseBgBtn = document.getElementById('btn-pause-bg');
            if (pauseBgBtn && state.isBgPaused !== undefined) {
                pauseBgBtn.textContent = state.isBgPaused ? 'Resume Frame' : 'Pause Frame';
                pauseBgBtn.classList.toggle('active', !!state.isBgPaused);
            }

        } finally {
            this._applying = false;
        }
    }

    // ─── Control Binding ─────────────────────────────────────────────────────

    _bindControls() {
        // Sliders
        (window.SLIDER_CONFIGS || []).forEach(config => {
            const slider = document.getElementById(`slider-${config.id}`);
            const display = document.getElementById(`val-${config.id}`);
            if (!slider) return;
            slider.addEventListener('input', (e) => {
                const v = e.target.value;
                const numVal = config.step >= 1 ? parseInt(v, 10) : parseFloat(v);
                if (display) display.textContent = `${v}${config.suffix || ''}`;
                if (!this._applying) this._send({ type: 'slider', id: config.id, value: numVal });
            });
        });

        // Checkboxes
        [
            ['check-hide-ui', 'hideUi'],
            ['check-hide-logo', 'hideLogo'],
            ['check-hide-date', 'hideDate'],
            ['check-hide-title', 'hideTitle'],
            ['check-hide-host', 'hideHost'],
            ['check-hide-border', 'hideBorder'],
            ['check-qr-soiree', 'qrSoiree'],
            ['check-qr-membership', 'qrMembership'],
            ['check-hide-valentines-hearts', 'hideValentinesHearts'],
        ].forEach(([id]) => {
            const el = document.getElementById(id);
            el?.addEventListener('change', (e) => {
                if (!this._applying) this._send({ type: 'toggle', id, checked: e.target.checked });
            });
        });

        // Radios: host layout
        document.querySelectorAll('input[name="hostLayout"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked && !this._applying) {
                    this._send({ type: 'radio', name: 'hostLayout', value: e.target.value });
                }
            });
        });

        // Radios: fps cap
        document.querySelectorAll('input[name="fpsCap"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked && !this._applying) {
                    this._send({ type: 'radio', name: 'fpsCap', value: e.target.value });
                }
            });
        });

        // Color picker
        document.getElementById('picker-bg-color')?.addEventListener('input', (e) => {
            const color = e.target.value;
            const val = document.getElementById('val-bg-color');
            if (val) val.textContent = color.toUpperCase();
            if (!this._applying) this._send({ type: 'color', value: color });
        });

        // Pause buttons
        document.getElementById('btn-pause-petals')?.addEventListener('click', () => {
            if (!this._applying) this._send({ type: 'button', id: 'btn-pause-petals' });
        });
        document.getElementById('btn-pause-bg')?.addEventListener('click', () => {
            if (!this._applying) this._send({ type: 'button', id: 'btn-pause-bg' });
        });

        // Reset to Defaults button
        document.getElementById('btn-reset-defaults')?.addEventListener('click', () => {
            if (!this._applying) this._send({ type: 'button', id: 'btn-reset-defaults' });
        });

        // Text inputs
        const textBindings = [
            ['input-logo-text', 'btn-clear-logo-text', 'logoText'],
            ['input-hosts-title', 'btn-clear-hosts-title', 'hostsTitle'],
            ['input-event-top-label', 'btn-clear-event-top-label', 'eventTopLabel'],
            ['input-event-title', 'btn-clear-event-title', 'eventTitle'],
            ['input-event-subtitle', 'btn-clear-event-subtitle', 'eventSubtitle'],
            ['input-event-date', 'btn-clear-event-date', 'eventDate'],
        ];
        textBindings.forEach(([inputId, clearId, key]) => {
            const input = document.getElementById(inputId);
            const clear = document.getElementById(clearId);

            input?.addEventListener('input', (e) => {
                if (!this._applying) this._send({ type: 'text', key, value: e.target.value });
                // Auto-grow for textareas
                if (input.tagName === 'TEXTAREA') this._autoGrow(input);
            });
            clear?.addEventListener('click', () => {
                if (input) { input.value = ''; if (input.tagName === 'TEXTAREA') this._autoGrow(input); }
                if (!this._applying) this._send({ type: 'text', key, value: '' });
            });
        });
    }

    _autoGrow(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }

    // ─── Add Host Form ───────────────────────────────────────────────────────

    _wireAddHost() {
        const showBtn = document.getElementById('btn-show-add-host');
        const form = document.getElementById('add-host-form');
        const input = document.getElementById('input-host-title');
        const confirmBtn = document.getElementById('btn-confirm-add-host');
        const cancelBtn = document.getElementById('btn-cancel-add-host');
        const errorEl = document.getElementById('add-host-error');

        showBtn?.addEventListener('click', () => {
            form?.classList.remove('is-hidden');
            input?.focus();
        });

        cancelBtn?.addEventListener('click', () => {
            form?.classList.add('is-hidden');
            if (input) input.value = '';
            errorEl?.classList.add('is-hidden');
            if (confirmBtn) confirmBtn.disabled = true;
        });

        input?.addEventListener('input', () => {
            if (confirmBtn) confirmBtn.disabled = !input.value.trim();
            errorEl?.classList.add('is-hidden');
        });

        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim()) confirmBtn?.click();
        });

        confirmBtn?.addEventListener('click', () => {
            const name = input?.value.trim();
            if (!name) return;
            this._send({ type: 'host-add', name });
            // Optimistic UI
            this._addToAddedList(name);
            form?.classList.add('is-hidden');
            if (input) input.value = '';
            if (confirmBtn) confirmBtn.disabled = true;
        });
    }

    _addToAddedList(name) {
        const list = document.getElementById('added-hosts-list');
        const items = document.getElementById('added-hosts-items');
        if (!list || !items) return;
        list.classList.remove('is-hidden');

        const row = document.createElement('div');
        row.className = 'added-host-item';
        row.dataset.name = name;
        row.innerHTML = `
            <span class="added-host-name">${this._escHtml(name)}</span>
            <button class="btn-remove-host button button--warning button--clear-sm" title="Remove">−</button>
        `;
        row.querySelector('.btn-remove-host')?.addEventListener('click', () => {
            this._send({ type: 'host-remove', name });
            row.remove();
            if (!items.children.length) list.classList.add('is-hidden');
            this._addToRemovedList(name);
        });
        items.appendChild(row);
    }

    _addToRemovedList(name) {
        const list = document.getElementById('removed-hosts-list');
        const items = document.getElementById('removed-hosts-items');
        if (!list || !items) return;
        list.classList.remove('is-hidden');

        const row = document.createElement('div');
        row.className = 'added-host-item';
        row.dataset.name = name;
        row.innerHTML = `
            <span class="added-host-name">${this._escHtml(name)}</span>
            <button class="btn-restore-host button button--primary button--clear-sm" title="Restore">+</button>
        `;
        row.querySelector('.btn-restore-host')?.addEventListener('click', () => {
            this._send({ type: 'host-restore', name });
            row.remove();
            if (!items.children.length) list.classList.add('is-hidden');
        });
        items.appendChild(row);
    }

    _renderAddedHosts(hosts) {
        const list = document.getElementById('added-hosts-list');
        const items = document.getElementById('added-hosts-items');
        if (!items) return;
        items.innerHTML = '';
        hosts.forEach(name => this._addToAddedList(name));
        if (list) list.classList.toggle('is-hidden', !hosts.length);
    }

    _renderRemovedHosts(hosts) {
        const list = document.getElementById('removed-hosts-list');
        const items = document.getElementById('removed-hosts-items');
        if (!items) return;
        items.innerHTML = '';
        hosts.forEach(name => this._addToRemovedList(name));
        if (list) list.classList.toggle('is-hidden', !hosts.length);
    }

    // ─── QR Scanner ─────────────────────────────────────────────────────────

    _loadJsQR() {
        return new Promise((resolve, reject) => {
            if (window.jsQR) { resolve(); return; }
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
            s.onload = resolve;
            s.onerror = () => reject(new Error('Failed to load jsQR'));
            document.head.appendChild(s);
        });
    }

    _wireScanner() {
        const scanBtn = document.getElementById('rcs-scan-btn');
        const closeBtn = document.getElementById('btn-scanner-close');
        const backdrop = document.querySelector('.rcs-scanner-backdrop');
        const zoomSlider = document.getElementById('scanner-zoom-slider');

        scanBtn?.addEventListener('click', () => this._startScanner());
        closeBtn?.addEventListener('click', () => this._stopScanner());
        backdrop?.addEventListener('click', () => this._stopScanner());

        zoomSlider?.addEventListener('input', (e) => {
            this.scannerZoom = parseFloat(e.target.value) || 1.0;
            const video = document.getElementById('scanner-video');
            if (video) {
                video.style.transform = `scale(${this.scannerZoom})`;
            }
        });
    }

    async _startScanner() {
        const statusEl = document.getElementById('scanner-status');
        if (statusEl) statusEl.textContent = 'Accessing camera…';

        const modal = document.getElementById('rcs-scanner-modal');
        if (modal) modal.style.display = 'flex';

        try {
            // Lazily load jsQR library
            await this._loadJsQR();

            // Check if mediaDevices is available at all (requires HTTPS)
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw Object.assign(new Error('Camera API unavailable'), { name: 'NotSupportedError' });
            }

            // Request environment camera access
            this.scannerStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } }
            });

            // Reset zoom
            this.scannerZoom = 1.0;
            const zoomSlider = document.getElementById('scanner-zoom-slider');
            if (zoomSlider) zoomSlider.value = '1';

            const video = document.getElementById('scanner-video');
            if (video) {
                video.srcObject = this.scannerStream;
                video.setAttribute('playsinline', 'true'); // Required for iOS Safari
                video.style.transform = 'scale(1)';
                video.play();
            }

            this.scannerActive = true;
            if (statusEl) statusEl.textContent = 'Align the QR code within the frame to connect automatically.';
            requestAnimationFrame(() => this._scanFrame());

        } catch (err) {
            console.error('[RemoteController] Camera access failed:', err);
            this.scannerActive = false;

            if (statusEl) {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    // Permission was denied or was never prompted (e.g. site is blocked in Safari settings)
                    statusEl.innerHTML = [
                        '<span style="color:#ff8e8e;font-weight:600">Camera access was denied.</span>',
                        '<br><span style="color:#ccc;font-size:0.9em">',
                        'On iPhone/iPad: go to <strong>Settings → Safari → Camera</strong> and set it to <em>Allow</em>, then reload this page.',
                        '</span>',
                        '<br><br><span style="color:#aaa;font-size:0.85em">You can also enter the pairing code manually below.</span>',
                    ].join('');
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    statusEl.innerHTML = '<span style="color:#ff8e8e">No camera found on this device. Please enter the code manually.</span>';
                } else if (err.name === 'NotSupportedError') {
                    statusEl.innerHTML = '<span style="color:#ff8e8e">Camera scanning requires a secure (HTTPS) connection. Please enter the code manually.</span>';
                } else {
                    statusEl.innerHTML = `<span style="color:#ff8e8e">Could not access camera (${err.name || 'unknown error'}). Please enter the code manually.</span>`;
                }
            }
        }
    }

    _stopScanner() {
        this.scannerActive = false;
        if (this.scannerStream) {
            this.scannerStream.getTracks().forEach(track => track.stop());
            this.scannerStream = null;
        }
        const video = document.getElementById('scanner-video');
        if (video) {
            video.srcObject = null;
            video.style.transform = 'scale(1)';
        }

        const zoomSlider = document.getElementById('scanner-zoom-slider');
        if (zoomSlider) zoomSlider.value = '1';

        const modal = document.getElementById('rcs-scanner-modal');
        if (modal) modal.style.display = 'none';
    }

    _scanFrame() {
        if (!this.scannerStream || !this.scannerActive) return;

        const video = document.getElementById('scanner-video');
        if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
            if (!this.scannerCanvas) {
                this.scannerCanvas = document.createElement('canvas');
            }
            const canvas = this.scannerCanvas;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw cropped frame for zoom
            const zoom = this.scannerZoom || 1.0;
            const sw = video.videoWidth / zoom;
            const sh = video.videoHeight / zoom;
            const sx = (video.videoWidth - sw) / 2;
            const sy = (video.videoHeight - sh) / 2;
            ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
                this._handleScanSuccess(code.data);
                return;
            }
        }

        // Recursively capture next frame
        if (this.scannerActive) {
            requestAnimationFrame(() => this._scanFrame());
        }
    }

    _handleScanSuccess(data) {
        let roomCode = '';
        try {
            // Extract code if it's a full pairing URL.
            // Supports both ?code= (current) and ?room= (legacy) parameter names.
            const hasQuery = data.includes('?');
            if (hasQuery) {
                const url = new URL(data);
                roomCode = (
                    url.searchParams.get('code') ||
                    url.searchParams.get('room') || // backward-compat with old QR codes
                    ''
                ).toUpperCase();
            }
            // If no URL params matched, treat the raw data as the code itself
            if (!roomCode) {
                roomCode = data.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            }
        } catch {
            roomCode = data.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        }

        if (roomCode && roomCode.length >= 4) {
            const input = document.getElementById('rcs-code-input');
            if (input) {
                input.value = roomCode;
                const connectBtn = document.getElementById('rcs-connect-btn');
                if (connectBtn) connectBtn.disabled = false;
            }
            this._stopScanner();
            this._connect(roomCode);
        } else {
            // Invalid data format, resume scanning
            if (this.scannerActive) {
                requestAnimationFrame(() => this._scanFrame());
            }
        }
    }

    _escHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
