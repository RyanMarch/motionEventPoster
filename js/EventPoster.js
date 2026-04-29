/**
 * EventPoster is the primary coordinator for the application.
 */
window.EventPoster = class EventPoster {
    constructor() {
        this.cacheElements();
        this.baseHosts = this.getInitialHosts();
        this.settings = this.loadSettings();
        this.state = { ...window.DEFAULTS };
        
        // Sub-systems
        this.particleEngine = new window.ParticleEngine(this);
        this.themeManager = new window.ThemeManager(this);
        this.ui = new window.UIController(this);

        this.theme = THEMES.spring;
        this.petalTypes = this.theme.particles;
        this.inactivityTimer = null;
        this.dismissTimer = null;
        this.fullscreenCountdownTimer = null;

        this.init();
    }

    cacheElements() {
        this.root = document.documentElement;
        this.body = document.body;
        this.layers = {
            back: document.getElementById('particles-back'),
            front: document.getElementById('particles-front'),
            mid: document.getElementById('particles-mid')
        };

        this.elements = {
            controlsPanel: document.getElementById('controls-panel'),
            hostsList: document.querySelector('.hosts-list'),
            wakeLockStatus: document.getElementById('wakelock-status'),
            fullscreenToggle: document.getElementById('check-fullscreen'),
            fps: document.getElementById('stat-fps'),
            timer: document.getElementById('stat-timer'),
            addHostButton: document.getElementById('btn-show-add-host'),
            addHostForm: document.getElementById('add-host-form'),
            addHostInput: document.getElementById('input-host-title'),
            addHostCancel: document.getElementById('btn-cancel-add-host'),
            addHostConfirm: document.getElementById('btn-confirm-add-host'),
            addedHostsList: document.getElementById('added-hosts-list'),
            addedHostsItems: document.getElementById('added-hosts-items'),
            removedHostsList: document.getElementById('removed-hosts-list'),
            removedHostsItems: document.getElementById('removed-hosts-items'),
            addHostError: document.getElementById('add-host-error'),
            qrSoiree: document.getElementById('qr-soiree'),
            qrMembership: document.getElementById('qr-membership'),
            appearanceDetails: document.getElementById('appearance-details'),
            hostManagementDetails: document.getElementById('host-management-details'),
            pausePetalsButton: document.getElementById('btn-pause-petals'),
            pauseBgButton: document.getElementById('btn-pause-bg'),
            resetDefaultsButton: document.getElementById('btn-reset-defaults'),
            sleepStatus: document.getElementById('stat-wakelock'),
            keyboardHint: document.getElementById('keyboard-hint'),
            hintFullscreenBtn: document.getElementById('btn-hint-fullscreen'),
            hintOptionsBtn: document.getElementById('btn-hint-options'),
            hintHelpBtn: document.getElementById('btn-hint-help'),
            fullscreenLabel: document.getElementById('label-fullscreen'),
            closePanelBtn: document.getElementById('btn-close-panel'),
            screenSize: document.getElementById('stat-screen-size'),
            fullscreenCountdown: document.getElementById('fullscreen-countdown'),
            countdownNumber: document.getElementById('countdown-number'),
            cancelFullscreenBtn: document.getElementById('btn-cancel-fullscreen'),
            wakeLockVideo: document.getElementById('wake-lock-video'),
            logoBanner: document.querySelector('.logo-banner'),
            logoImg: document.getElementById('logo-img'),
            logoTextEl: document.getElementById('logo-text'),
            eventFooter: document.querySelector('.event-footer'),
            hostsEmptyHint: document.getElementById('hosts-empty-hint'),
            factoryResetOverlay: document.getElementById('factory-reset-overlay'),
            factoryResetProgress: document.getElementById('factory-reset-progress'),
            factoryResetModal: document.getElementById('factory-reset-modal'),
            btnResetCancel: document.getElementById('btn-reset-cancel'),
            btnResetConfirm: document.getElementById('btn-reset-confirm'),
            hostsTitleEl: document.getElementById('hosts-title'),
            eventTopLabelEl: document.getElementById('event-top-label'),
            eventTitleEl: document.getElementById('event-title'),
            eventSubtitleEl: document.getElementById('event-subtitle'),
            eventDateEl: document.getElementById('event-date'),
            qrSoireeImg: document.getElementById('qr-soiree-img'),
            qrMembershipImg: document.getElementById('qr-membership-img'),
            editPosterDetails: document.getElementById('edit-poster-details'),
            editPosterSummary: document.querySelector('#edit-poster-details summary'),
            helpDetails: document.getElementById('help-details'),
            helpSummary: document.querySelector('#help-details summary'),
            logoModeRadios: document.querySelectorAll('input[name="logoMode"]'),
            logoImageControls: document.getElementById('logo-image-controls'),
            logoTextControls: document.getElementById('logo-text-controls'),
            btnUploadLogo: document.getElementById('btn-upload-logo'),
            btnClearLogoImg: document.getElementById('btn-clear-logo-img'),
            inputLogoFile: document.getElementById('input-logo-file'),
            logoImgPreview: document.getElementById('logo-img-preview'),
            logoImgThumb: document.getElementById('logo-img-thumb'),
            inputLogoText: document.getElementById('input-logo-text'),
            btnClearLogoText: document.getElementById('btn-clear-logo-text'),
            inputHostsTitle: document.getElementById('input-hosts-title'),
            btnClearHostsTitle: document.getElementById('btn-clear-hosts-title'),
            inputEventTopLabel: document.getElementById('input-event-top-label'),
            btnClearEventTopLabel: document.getElementById('btn-clear-event-top-label'),
            inputEventTitle: document.getElementById('input-event-title'),
            btnClearEventTitle: document.getElementById('btn-clear-event-title'),
            inputEventSubtitle: document.getElementById('input-event-subtitle'),
            btnClearEventSubtitle: document.getElementById('btn-clear-event-subtitle'),
            inputEventDate: document.getElementById('input-event-date'),
            btnClearEventDate: document.getElementById('btn-clear-event-date'),
            btnUploadQrLeft: document.getElementById('btn-upload-qr-left'),
            btnClearQrLeft: document.getElementById('btn-clear-qr-left'),
            inputQrLeftFile: document.getElementById('input-qr-left-file'),
            qrLeftPreview: document.getElementById('qr-left-preview'),
            qrLeftThumb: document.getElementById('qr-left-thumb'),
            btnUploadQrRight: document.getElementById('btn-upload-qr-right'),
            btnClearQrRight: document.getElementById('btn-clear-qr-right'),
            inputQrRightFile: document.getElementById('input-qr-right-file'),
            qrRightPreview: document.getElementById('qr-right-preview'),
            qrRightThumb: document.getElementById('qr-right-thumb'),
            bgColorPicker: document.getElementById('picker-bg-color'),
            bgColorVal: document.getElementById('val-bg-color'),
            swatchGrid: document.getElementById('bg-swatch-grid'),
            btnCustomColor: document.getElementById('btn-custom-color'),
            proceedAnywayBtn: document.getElementById('btn-bypass-blocker'),
            mobileScreenSizeInfo: document.getElementById('mobile-screen-size-info'),
            themeFrame: document.querySelector('.theme-frame'),
        };

        this.controls = {
            hostLayoutRadios: document.querySelectorAll('input[name="hostLayout"]'),
            hideUi: document.getElementById('check-hide-ui'),
            hideLogo: document.getElementById('check-hide-logo'),
            hideDate: document.getElementById('check-hide-date'),
            hideTitle: document.getElementById('check-hide-title'),
            hideHost: document.getElementById('check-hide-host'),
            hideBorder: document.getElementById('check-hide-border'),
            qrSoiree: document.getElementById('check-qr-soiree'),
            qrMembership: document.getElementById('check-qr-membership'),
            disableAutoFullscreen: document.getElementById('check-disable-auto-fullscreen'),
            themeRadios: document.querySelectorAll('input[name="activeTheme"]')
        };

        this.containers = {
            wrapper: document.querySelector('.content-wrapper'),
            hosts: document.querySelector('.hosts-container')
        };
    }

    init() {
        if (this.elements.proceedAnywayBtn) {
            this.elements.proceedAnywayBtn.addEventListener('click', () => {
                this.body.classList.add('is-mobile-dismissed');
                if (!this.state.isAppRunning) this.startApp();
            });
        }
        if (window.matchMedia("(max-width: 1280px), (max-height: 800px)").matches) {
            this.updateMobileScreenSizeInfo();
            return;
        }
        this.startApp();
    }

    startApp() {
        if (this.state.isAppRunning) return;
        this.state.isAppRunning = true;
        this.hydrate();
        this.themeManager.initSwatches();
        this.ui.setupEventListeners();
        this.applyStateToUI();
        this.applyPosterText();
        this.particleEngine.adjustAmbientPetals();
        this.particleEngine.startAnimationLoop();
        this.checkWakeLockSupport();
        this.renderHosts();
        this.updateSleepStatus('off');
        this.updateScreenSize();
        this.startWakeLockHeartbeat();
        this.showKeyboardHint();
        this.setupAutoFullscreenTrigger();
        requestAnimationFrame(() => this.body.classList.remove('is-loading'));
        setTimeout(() => this.syncLayout(), 500);
    }

    hydrate() {
        const s = this.settings;
        Object.keys(window.DEFAULTS).forEach((key) => {
            const defaultValue = window.DEFAULTS[key];
            const savedValue = s[key];
            if (savedValue === undefined || savedValue === null) {
                this.state[key] = defaultValue; return;
            }
            this.state[key] = savedValue;
        });
        this.state.petals = [];
        this.theme = THEMES[this.state.activeTheme] || THEMES.spring;
        this.petalTypes = this.theme.particles;
        this.state.addedHosts = this.readStoredHosts();
        this.state.removedHosts = this.readStoredRemovedHosts();
        this.state.posterText = this.loadPosterText();
        this.state.lastFrameTime = performance.now();
        this.state.lastPhysicsTime = performance.now();
        this.state.currentWind = 0;
        this.state.gustForce = 0;
        this.state.windDirection = 1;
        this.state.targetWindDirection = 1;
        this.state.frameCount = 0;
    }

    // Layout Logic
    syncLayout() {
        const wrapper = this.containers.wrapper;
        if (wrapper) {
            wrapper.style.setProperty('--inset-v', `${this.state.insetV}px`);
            wrapper.style.setProperty('--inset-h', `${this.state.insetH}px`);
        }
        const hosts = this.containers.hosts;
        if (hosts) {
            hosts.style.setProperty('--host-text-size', this.state.hostTextSize * 1.1);
            const maxWidthPx = (this.state.hostMaxWidth / 100) * 1110 * 1.16;
            hosts.style.setProperty('--host-max-width', `${maxWidthPx}px`);
        }
        requestAnimationFrame(() => this.optimizeLayouts());
    }

    optimizeLayouts() {
        if (!this.elements.hostsList) return;
        const layout = this.state.hostLayout;
        const spans = Array.from(this.elements.hostsList.querySelectorAll('span'));
        spans.forEach(span => span.style.fontSize = '');
        if (layout === 'justify') {
            let bestScale = 1.6;
            for (let scale = 1.6; scale >= 0.8; scale -= 0.05) {
                spans.forEach(span => span.style.fontSize = `calc(${scale}rem * var(--host-text-size) * var(--host-scale-base) * var(--dynamic-scale))`);
                let lastTop = -1; let count = 0;
                for (let i = 0; i < spans.length; i++) {
                    if (spans[i].offsetTop > lastTop + 10) { lastTop = spans[i].offsetTop; count = 1; } else count++;
                }
                if (count > 1 || count === spans.length) { bestScale = scale; break; }
            }
            spans.forEach(span => span.style.fontSize = `calc(${bestScale}rem * var(--host-text-size) * var(--host-scale-base) * var(--dynamic-scale))`);
        }
        this.enforceVerticalFit();
    }

    enforceVerticalFit() {
        if (!this.containers.hosts || !this.elements.logoBanner || !this.elements.eventFooter) return;
        const MIN_SCALE = 0.35; const GAPS = 60;
        this.containers.hosts.style.setProperty('--host-text-size', '1.1');
        this.containers.hosts.style.setProperty('--dynamic-scale', '1');
        const titleH = this.containers.hosts.querySelector('.hosts-title')?.offsetHeight || 0;
        const totalH = this.elements.logoBanner.offsetHeight + this.elements.eventFooter.offsetHeight + titleH + this.elements.hostsList.offsetHeight + GAPS;
        const availH = window.innerHeight;
        let scale = totalH > availH ? (availH - (this.elements.logoBanner.offsetHeight + this.elements.eventFooter.offsetHeight + GAPS)) / (titleH + this.elements.hostsList.offsetHeight) : 1;
        scale = Math.max(MIN_SCALE, Math.min(1.0, scale));
        this.containers.hosts.style.setProperty('--dynamic-scale', scale.toFixed(3));
        this.containers.hosts.style.setProperty('--host-text-size', (this.state.hostTextSize * 1.1).toString());
    }

    updateTimerDisplay() {
        if (this.elements.timer) {
            this.elements.timer.textContent = window.PosterUtils.formatFullscreenTimer(this.state.totalFullscreenSeconds, this.state.fullscreenStartTime);
        }
    }

    applyStateToUI() {
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
        const setLabel = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
        
        setVal('slider-max-petals', this.state.maxPetals); setLabel('val-max-petals', this.state.maxPetals);
        setVal('slider-gust-freq', this.state.windiness); setLabel('val-gust-freq', this.state.windiness);
        setVal('slider-fall-speed', this.state.fallSpeed); setLabel('val-fall-speed', `${this.state.fallSpeed}x`);
        setVal('slider-tumble-speed', this.state.tumbleSpeed); setLabel('val-tumble-speed', `${this.state.tumbleSpeed}x`);
        setVal('slider-gust-strength', this.state.gustStrength); setLabel('val-gust-strength', this.state.gustStrength);
        setVal('slider-host-text-size', this.state.hostTextSize); setLabel('val-host-text-size', `${this.state.hostTextSize}x`);
        setVal('slider-host-max-width', this.state.hostMaxWidth); setLabel('val-host-max-width', `${this.state.hostMaxWidth}%`);
        setVal('slider-backdrop-opacity', this.state.backdropOpacity); setLabel('val-backdrop-opacity', `${this.state.backdropOpacity}%`);
        setVal('slider-inset-v', this.state.insetV); setLabel('val-inset-v', `${this.state.insetV}px`);
        setVal('slider-inset-h', this.state.insetH); setLabel('val-inset-h', `${this.state.insetH}px`);

        if (this.elements.bgColorPicker) this.elements.bgColorPicker.value = this.state.bgColor;
        if (this.elements.bgColorVal) this.elements.bgColorVal.textContent = this.state.bgColor.toUpperCase();

        this.controls.hostLayoutRadios?.forEach(r => r.checked = (r.value === this.state.hostLayout));
        this.applyHostLayout(this.state.hostLayout);
        this.themeManager.syncWind();
        this.syncLayout();
        this.themeManager.syncBackdrop();
        this.controls.hideUi.checked = this.state.hideUi;
        this.applyHideUiState(this.state.hideUi);
        this.body.classList.toggle('logo-hidden', this.state.hideLogo);
        this.body.classList.toggle('date-hidden', this.state.hideDate);
        this.body.classList.toggle('title-hidden', this.state.hideTitle);
        this.body.classList.toggle('host-hidden', this.state.hideHost);
        this.body.classList.toggle('border-hidden', this.state.hideBorder);
        this.controls.themeRadios?.forEach(r => r.checked = (r.value === this.state.activeTheme));
        this.themeManager.applyTheme(this.state.activeTheme, true);
        this.elements.qrSoiree.classList.toggle('qr-hidden', !this.state.qrSoiree);
        this.elements.qrMembership.classList.toggle('qr-hidden', !this.state.qrMembership);
        this.syncPauseStates();
    }

    applyHideUiState(isHidden) {
        this.body.classList.toggle('ui-hidden', isHidden);
        [this.controls.hideLogo, this.controls.hideDate, this.controls.hideTitle, this.controls.hideHost].forEach(c => {
            if (c) c.disabled = isHidden;
            c?.parentElement?.classList.toggle('disabled', isHidden);
        });
    }

    applyHostLayout(layout) {
        this.elements.hostsList?.classList.remove('layout-justify', 'layout-centered', 'layout-columns');
        this.elements.hostsList?.classList.add(`layout-${layout}`);
        requestAnimationFrame(() => this.optimizeLayouts());
    }

    syncPauseStates() {
        const btn = this.elements.pausePetalsButton;
        if (btn) {
            btn.classList.toggle('active', this.state.isPetalsPaused);
            btn.textContent = this.state.isPetalsPaused ? 'Resume Particles' : 'Pause Particles';
        }
        Object.values(this.layers).forEach(l => l.classList.toggle('paused', this.state.isPetalsPaused));
        const bgBtn = this.elements.pauseBgButton;
        if (bgBtn) {
            bgBtn.classList.toggle('active', this.state.isBgPaused);
            bgBtn.textContent = this.state.isBgPaused ? 'Resume Frame' : 'Pause Frame';
        }
        document.querySelectorAll('.sway-layer, .floral-bg, .theme-frame').forEach(el => el.classList.toggle('paused', this.state.isBgPaused));
    }

    renderHosts() {
        if (!this.elements.hostsList) return;
        const all = this.hasEverAddedHost() ? [...this.state.addedHosts] : [...this.baseHosts, ...this.state.addedHosts].filter(h => !this.state.removedHosts.includes(h));
        all.sort((a,b) => this.getHostSortKey(a).localeCompare(this.getHostSortKey(b)));
        this.elements.hostsList.innerHTML = '';
        all.forEach(name => {
            const span = document.createElement('span');
            span.textContent = name;
            this.bindHostHold(span, name);
            this.elements.hostsList.appendChild(span);
        });
        this.renderAddedHosts();
        this.renderRemovedHosts();
        this.updateEmptyHint(all.length === 0);
        requestAnimationFrame(() => this.optimizeLayouts());
    }

    getHostSortKey(name) {
        const parts = name.trim().split(/\s+/).filter(p => !window.TITLE_FILTER_WORDS.has(p.toLowerCase()));
        return parts.length ? parts.at(-1).toLowerCase() : name.toLowerCase();
    }

    renderAddedHosts() {
        const list = this.elements.addedHostsList;
        const items = this.elements.addedHostsItems;
        if (!items) return;
        if (this.state.addedHosts.length === 0) { list?.classList.add('is-hidden'); items.innerHTML = ''; return; }
        items.innerHTML = '';
        this.state.addedHosts.forEach((name, idx) => {
            const div = document.createElement('div'); div.className = 'added-host-row';
            div.innerHTML = `<span class="added-host-name">${name}</span><button class="btn-remove-host" data-index="${idx}">Remove</button>`;
            div.querySelector('button').addEventListener('click', () => {
                if (this.hasEverAddedHost() && !this.state.removedHosts.includes(name)) { this.state.removedHosts.push(name); this.persistRemovedHosts(); }
                this.state.addedHosts.splice(idx, 1); this.persistAddedHosts(); this.renderHosts();
            });
            items.appendChild(div);
        });
        list?.classList.remove('is-hidden');
    }

    renderRemovedHosts() {
        const list = this.elements.removedHostsList;
        const items = this.elements.removedHostsItems;
        if (!items) return;
        const displayed = this.hasEverAddedHost() ? this.state.removedHosts.filter(n => !this.baseHosts.includes(n)) : this.state.removedHosts;
        if (displayed.length === 0) { list?.classList.add('is-hidden'); items.innerHTML = ''; return; }
        items.innerHTML = '';
        displayed.forEach(name => {
            const div = document.createElement('div'); div.className = 'added-host-row';
            div.innerHTML = `<span class="added-host-name">${name}</span><button class="btn-put-back-host" data-name="${name}">Put Back</button>`;
            div.querySelector('button').addEventListener('click', () => {
                this.state.removedHosts = this.state.removedHosts.filter(h => h !== name); this.persistRemovedHosts();
                if (this.hasEverAddedHost() && !this.baseHosts.includes(name) && !this.state.addedHosts.includes(name)) { this.state.addedHosts.push(name); this.persistAddedHosts(); }
                this.renderHosts();
            });
            items.appendChild(div);
        });
        list?.classList.remove('is-hidden');
    }

    bindHostHold(el, name) {
        let timer = null;
        const start = (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            el.style.transition = 'transform 2s ease-out'; el.style.transform = 'scale(1.08)';
            timer = setTimeout(() => {
                el.style.transition = 'opacity 0.3s ease, transform 0.3s ease'; el.style.opacity = '0'; el.style.transform = 'scale(0.8)';
                setTimeout(() => this.removeHost(name), 300);
            }, 2000);
        };
        const cancel = () => { if (timer) { clearTimeout(timer); timer = null; el.style.transition = 'transform 0.3s ease'; el.style.transform = ''; } };
        el.addEventListener('pointerdown', start); ['pointerup', 'pointercancel', 'pointerleave'].forEach(e => el.addEventListener(e, cancel));
        el.addEventListener('contextmenu', e => e.preventDefault());
    }

    removeHost(name) {
        if (this.baseHosts.includes(name)) { if (!this.hasEverAddedHost() && !this.state.removedHosts.includes(name)) { this.state.removedHosts.push(name); this.persistRemovedHosts(); } }
        else { if (this.hasEverAddedHost() && !this.state.removedHosts.includes(name)) { this.state.removedHosts.push(name); this.persistRemovedHosts(); }
            this.state.addedHosts = this.state.addedHosts.filter(h => h !== name); this.persistAddedHosts(); }
        this.renderHosts();
    }

    updateEmptyHint(isEmpty) {
        const el = this.elements.hostsEmptyHint; if (!el) return;
        if (this.state.emptyHintTimer) clearTimeout(this.state.emptyHintTimer);
        if (isEmpty && this.hasEverAddedHost()) this.state.emptyHintTimer = setTimeout(() => el.classList.remove('is-hidden'), 3000);
        else el.classList.add('is-hidden');
    }

    submitAddHost() {
        const val = this.elements.addHostInput.value.trim(); if (!val) return;
        if (this.state.addedHosts.includes(val) || (this.baseHosts.includes(val) && !this.state.removedHosts.includes(val))) { this.showAddHostError('Host already exists'); return; }
        if (!this.hasEverAddedHost()) localStorage.setItem(window.STORAGE_KEYS.hasEverAddedHost, 'true');
        this.state.addedHosts.push(val); this.persistAddedHosts(); this.renderHosts();
        this.elements.addHostInput.value = ''; this.elements.addHostInput.focus();
    }

    showAddHostError(msg) {
        const el = this.elements.addHostError; if (el) { el.textContent = msg; el.classList.remove('is-hidden'); }
        this.elements.addHostInput?.classList.add('text-input--error');
        setTimeout(() => this.elements.addHostInput?.classList.remove('text-input--error'), 400);
    }

    clearAddHostError() { this.elements.addHostError?.classList.add('is-hidden'); this.elements.addHostInput?.classList.remove('text-input--error'); }

    saveSettings() { localStorage.setItem(window.STORAGE_KEYS.settings, JSON.stringify(this.state)); }
    loadSettings() { try { return JSON.parse(localStorage.getItem(window.STORAGE_KEYS.settings) || '{}'); } catch { return {}; } }
    readStoredHosts() { try { return JSON.parse(localStorage.getItem(window.STORAGE_KEYS.addedHosts) || '[]'); } catch { return []; } }
    persistAddedHosts() { localStorage.setItem(window.STORAGE_KEYS.addedHosts, JSON.stringify(this.state.addedHosts)); }
    readStoredRemovedHosts() { try { return JSON.parse(localStorage.getItem(window.STORAGE_KEYS.removedHosts) || '[]'); } catch { return []; } }
    persistRemovedHosts() { localStorage.setItem(window.STORAGE_KEYS.removedHosts, JSON.stringify(this.state.removedHosts)); }
    hasEverAddedHost() { return localStorage.getItem(window.STORAGE_KEYS.hasEverAddedHost) === 'true'; }

    loadPosterText() { try { return { ...window.POSTER_TEXT_DEFAULTS, ...JSON.parse(localStorage.getItem(window.STORAGE_KEYS.posterText) || '{}') }; } catch { return window.POSTER_TEXT_DEFAULTS; } }
    savePosterText() { localStorage.setItem(window.STORAGE_KEYS.posterText, JSON.stringify(this.state.posterText)); }
    applyPosterText() {
        const pt = this.state.posterText; const mode = pt.logoMode || 'text';
        if (mode === 'image' && pt.logoImageData) { this.elements.logoImg.src = pt.logoImageData; this.elements.logoImg.classList.remove('is-hidden'); this.elements.logoTextEl.classList.add('is-hidden'); }
        else if (mode === 'text') { this.elements.logoImg.classList.add('is-hidden'); this.elements.logoTextEl.textContent = pt.logoText; this.elements.logoTextEl.classList.remove('is-hidden'); }
        else { this.elements.logoImg.classList.add('is-hidden'); this.elements.logoTextEl.classList.add('is-hidden'); }
        this.elements.hostsTitleEl.textContent = pt.hostsTitle; this.elements.eventTopLabelEl.textContent = pt.eventTopLabel;
        this.elements.eventTitleEl.textContent = pt.eventTitle; this.elements.eventSubtitleEl.textContent = pt.eventSubtitle;
        this.elements.eventDateEl.textContent = pt.eventDate; this.syncLayout();
    }

    openAddHostForm() { this.elements.addHostForm.classList.remove('is-hidden'); this.elements.addHostButton.classList.add('is-hidden'); this.elements.addHostInput.focus(); this.ui.updateFocusableElements(); }
    closeAddHostForm() { this.elements.addHostForm.classList.add('is-hidden'); this.elements.addHostButton.classList.remove('is-hidden'); this.elements.addHostInput.value = ''; this.clearAddHostError(); }
    isAddHostFormOpen() { return !this.elements.addHostForm.classList.contains('is-hidden'); }
    isControlsPanelVisible() { return this.elements.controlsPanel.classList.contains('is-visible'); }
    
    toggleEditPosterShortcut() { const det = this.elements.editPosterDetails; if (det.open) det.open = false; else { if (!this.isControlsPanelVisible()) this.ui.toggleControlsPanel(); det.open = true; } this.ui.updateFocusableElements(); }
    toggleHelpShortcut() { const det = this.elements.helpDetails; if (det.open) det.open = false; else { if (!this.isControlsPanelVisible()) this.ui.toggleControlsPanel(); det.open = true; } this.ui.updateFocusableElements(); }
    toggleAddHostShortcut() { const det = this.elements.hostManagementDetails; if (det.open) det.open = false; else { if (!this.isControlsPanelVisible()) this.ui.toggleControlsPanel(); det.open = true; this.openAddHostForm(); } this.ui.updateFocusableElements(); }
    toggleCustomizeShortcut() { const det = this.elements.appearanceDetails; if (det.open) det.open = false; else { if (!this.isControlsPanelVisible()) this.ui.toggleControlsPanel(); det.open = true; } this.ui.updateFocusableElements(); }
    isCustomizeOpen() { return this.elements.appearanceDetails?.open; }

    handleFactoryResetKeyDown(e) {
        if (e.repeat) {
            if (this.state.factoryResetStartTime) {
                const progress = Math.min(((Date.now() - this.state.factoryResetStartTime) / 2000) * 100, 100);
                if (this.elements.factoryResetProgress) this.elements.factoryResetProgress.style.width = `${progress}%`;
                if (progress >= 100) this.showFactoryResetConfirmation();
            } return;
        }
        if (!this.elements.factoryResetModal.classList.contains('is-hidden')) return;
        this.state.factoryResetStartTime = Date.now(); this.elements.factoryResetOverlay?.classList.remove('is-hidden');
    }
    handleFactoryResetKeyUp() { this.state.factoryResetStartTime = null; this.elements.factoryResetOverlay?.classList.add('is-hidden'); }
    showFactoryResetConfirmation() { this.state.factoryResetStartTime = null; this.elements.factoryResetOverlay?.classList.add('is-hidden'); this.elements.factoryResetModal?.classList.remove('is-hidden'); }
    hideFactoryResetConfirmation() { this.elements.factoryResetModal?.classList.add('is-hidden'); }
    performFactoryReset() { localStorage.clear(); window.location.reload(); }

    getInitialHosts() { return Array.from(this.elements.hostsList.querySelectorAll('span'), el => el.textContent.trim()); }
    updateScreenSize() { if (this.elements.screenSize) this.elements.screenSize.textContent = `${window.innerWidth} × ${window.innerHeight}`; }
    updateMobileScreenSizeInfo() { if (this.elements.mobileScreenSizeInfo) this.elements.mobileScreenSizeInfo.textContent = `Detected: ${window.innerWidth}×${window.innerHeight} | Recommended: >1280×800`; }
    autoGrowTextarea(el) { el.style.height = '40px'; el.style.height = Math.min(el.scrollHeight, 64) + 'px'; }
    reloadStyles() { window.location.reload(); }
    
    async requestWakeLock() { if ('wakeLock' in navigator) { try { this.state.wakeLock = await navigator.wakeLock.request('screen'); this.updateSleepStatus('api'); } catch { this.updateSleepStatus('error'); } } }
    releaseWakeLock() { this.state.wakeLock?.release(); this.state.wakeLock = null; this.updateSleepStatus('off'); }
    updateSleepStatus(s) { const el = this.elements.sleepStatus; if (el) { el.textContent = s; el.className = `status-${s}`; } }
    checkWakeLockSupport() {
        if (!this.elements.wakeLockStatus) return;
        if (!window.isSecureContext) {
            this.elements.wakeLockStatus.textContent = 'Insecure context';
        } else if (!('wakeLock' in navigator)) {
            this.elements.wakeLockStatus.textContent = 'Not supported';
        } else {
            // It's supported and in a secure context
            this.elements.wakeLockStatus.classList.add('is-hidden');
        }
    }
    startWakeLockHeartbeat() { setInterval(() => { if (document.fullscreenElement && !this.state.wakeLock) this.requestWakeLock(); }, 30000); }
    resetDefaults() {
        const theme = this.theme;
        Object.keys(window.DEFAULTS).forEach(key => {
            // Reset most settings but preserve identity/data keys
            const identityKeys = ['activeTheme', 'addedHosts', 'removedHosts', 'posterText', 'isAppRunning'];
            if (!identityKeys.includes(key)) {
                this.state[key] = window.DEFAULTS[key];
            }
        });
        
        // Re-apply theme specific overrides
        if (theme.overrides) {
            Object.keys(theme.overrides).forEach(key => {
                if (key in this.state) this.state[key] = theme.overrides[key];
            });
        }

        this.applyStateToUI();
        this.saveSettings();
    }

    showKeyboardHint() {
        if (!this.elements.keyboardHint) return;
        // Show hint if it's the first time or after a reset
        const hasSeenHint = localStorage.getItem('poster-hint-seen');
        if (!hasSeenHint) {
            this.elements.keyboardHint.classList.add('is-visible');
            localStorage.setItem('poster-hint-seen', 'true');
            // Auto-hide after 10 seconds
            setTimeout(() => this.elements.keyboardHint.classList.remove('is-visible'), 10000);
        }
    }

    deriveAccentColor(h) { return window.PosterUtils.deriveAccentColor(h); }

    // Auto-Fullscreen Logic
    setupAutoFullscreenTrigger() {
        // Only start if the user previously had a fullscreen intent
        if (localStorage.getItem(window.STORAGE_KEYS.fullscreenIntent) !== 'true') return;
        
        const trigger = () => {
            if (this.state.disableAutoFullscreen || document.fullscreenElement) return;
            this.startFullscreenCountdown();
        };
        // Use a one-time listener for the first interaction
        ['mousedown', 'keydown', 'touchstart'].forEach(type => {
            document.addEventListener(type, trigger, { once: true, capture: true });
        });
    }

    startFullscreenCountdown() {
        if (this.elements.fullscreenCountdown) {
            this.elements.fullscreenCountdown.classList.remove('is-countdown-hidden');
            let count = 3;
            if (this.elements.countdownNumber) this.elements.countdownNumber.textContent = count;
            
            this.fullscreenCountdownTimer = setInterval(() => {
                count--;
                if (count <= 0) {
                    clearInterval(this.fullscreenCountdownTimer);
                    this.fullscreenCountdownTimer = null;
                    this.cancelFullscreenCountdown(false);
                    
                    // Trigger fullscreen directly
                    if (this.elements.fullscreenToggle) {
                        this.elements.fullscreenToggle.checked = true;
                        // Fire the click logic manually to ensure wake lock and storage are handled
                        this.requestFullscreenMode();
                        localStorage.setItem(window.STORAGE_KEYS.fullscreenIntent, 'true');
                        this.requestWakeLock();
                    }
                } else {
                    if (this.elements.countdownNumber) this.elements.countdownNumber.textContent = count;
                }
            }, 1000);
        }
    }

    cancelFullscreenCountdown(showHint = true) {
        if (this.fullscreenCountdownTimer) {
            clearInterval(this.fullscreenCountdownTimer);
            this.fullscreenCountdownTimer = null;
        }
        if (this.elements.fullscreenCountdown) {
            this.elements.fullscreenCountdown.classList.add('is-countdown-hidden');
        }
    }

    async requestFullscreenMode() {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
                // State update handled by fullscreenchange listener in UIController
            }
        } catch (err) {
            console.warn("Auto-fullscreen failed:", err);
            // Fallback: If it failed, make sure the toggle is unchecked
            if (this.elements.fullscreenToggle) this.elements.fullscreenToggle.checked = false;
        }
    }

    async exitFullscreenMode() {
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (err) {
                console.warn("Exit fullscreen failed:", err);
            }
        }
    }

    deriveAccentColor(h) { return window.PosterUtils.deriveAccentColor(h); }
}
