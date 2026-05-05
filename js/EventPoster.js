/**
 * EventPoster is the main orchestrator for the motion poster application.
 * It manages state, coordinate modules, and handles core lifecycle events.
 */
window.EventPoster = class EventPoster {
    constructor() {
        // Initialize Modules
        this.themeManager = new window.ThemeManager(this);
        this.particleEngine = new window.ParticleEngine(this);
        this.ui = new window.UIController(this);

        this.cacheElements();
        this.createSwayLayers();
        
        this.state = { ...window.DEFAULTS };
        this.settings = this.loadSettings();
        this.baseHosts = window.DEFAULT_HOSTS || [];
        
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
            floralBg: document.querySelector('.floral-bg'),
            controlsPanel: document.getElementById('controls-panel'),
            hostsList: document.querySelector('.hosts-list'),
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
            recoveryHint: document.getElementById('recovery-hint'),
            // poster text elements
            hostsTitleEl: document.getElementById('hosts-title'),
            eventTopLabelEl: document.getElementById('event-top-label'),
            eventTitleEl: document.getElementById('event-title'),
            eventSubtitleEl: document.getElementById('event-subtitle'),
            eventDateEl: document.getElementById('event-date'),
            qrSoireeImg: document.getElementById('qr-soiree-img'),
            qrMembershipImg: document.getElementById('qr-membership-img'),
            // Edit panel controls
            editPosterDetails: document.getElementById('edit-poster-details'),
            helpDetails: document.getElementById('help-details'),
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
            mobileScreenSizeInfo: document.getElementById('mobile-screen-size-info'),
            btnBypassBlocker: document.getElementById('btn-bypass-blocker'),
            mobileBlocker: document.getElementById('mobile-blocker'),
            themeFrame: document.querySelector('.theme-frame')
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
            autoHideMenu: document.getElementById('check-auto-hide-menu'),
            smoothTransitions: document.getElementById('check-smooth-transitions'),
            themeSelectContainer: document.getElementById('theme-custom-select'),
            themeSelectTrigger: document.getElementById('theme-select-trigger'),
            themeSelectIcon: document.getElementById('theme-select-icon'),
            themeSelectLabel: document.getElementById('theme-select-label'),
            fullscreenToggle: document.getElementById('check-fullscreen'),
            fpsCapRadios: document.querySelectorAll('input[name="fpsCap"]')
        };

        this.controlLabels = {
            hideLogo: document.getElementById('label-hide-logo'),
            hideDate: document.getElementById('label-hide-date'),
            hideTitle: document.getElementById('label-hide-title'),
            hideHost: document.getElementById('label-hide-host'),
            qrSoiree: document.getElementById('label-qr-soiree'),
            qrMembership: document.getElementById('label-qr-membership')
        };

        this.containers = {
            wrapper: document.querySelector('.content-wrapper'),
            hosts: document.querySelector('.hosts-container')
        };
    }

    createSwayLayers() {
        const layers = [
            'sway-top-right', 'sway-top-left', 'sway-bottom-left', 'sway-bottom-right',
            'sway-left-side', 'sway-right-side', 'sway-top-1', 'sway-top-2', 'sway-top-3'
        ];
        layers.forEach(cls => {
            const div = document.createElement('div');
            div.className = `sway-layer ${cls}`;
            this.body.appendChild(div);
        });
    }

    hydrate() {
        const s = this.settings;
        
        // Determine active theme early to apply its overrides during hydration
        this.state.activeTheme = s.activeTheme || window.DEFAULTS.activeTheme;
        this.theme = window.THEMES[this.state.activeTheme] || window.THEMES.spring;
        this.petalTypes = this.theme.particles;

        Object.keys(window.DEFAULTS).forEach((key) => {
            let defaultValue = window.DEFAULTS[key];
            
            // If the active theme has an override for this key, use it as the new baseline
            if (this.theme.overrides && this.theme.overrides[key] !== undefined) {
                defaultValue = this.theme.overrides[key];
            }
            
            const savedValue = s[key];
            if (savedValue === undefined || savedValue === null) {
                this.state[key] = defaultValue;
                return;
            }
            if (typeof defaultValue === 'boolean') {
                this.state[key] = savedValue === true || savedValue === 'true';
            } else if (typeof defaultValue === 'number') {
                const n = Number(savedValue);
                this.state[key] = Number.isNaN(n) ? defaultValue : n;
            } else {
                this.state[key] = savedValue;
            }
        });

        this.state.petals = [];
        this.state.currentWind = 0;
        this.state.windDirection = 1;
        this.state.targetWindDirection = 1;
        this.state.gustForce = 0;
        this.state.downtimeTimer = 0;
        
        this.state.addedHosts = this.readStoredHosts();
        this.state.removedHosts = this.readStoredRemovedHosts();
        this.state.posterText = this.loadPosterText();
        this.state.wakeLock = null;
        this.state.wakeLockActive = false;
        this.state.lastFrameTime = performance.now();
        this.state.lastPhysicsTime = performance.now();
        this.state.frameCount = 0;
        this.state.totalFullscreenSeconds = null;
        this.state.fullscreenStartTime = null;
        this.state.isKeyboardUser = false;
        this.state.isResizing = false;
        this.state.factoryResetStartTime = null;
        this.state.hasEverAddedHost = localStorage.getItem(window.STORAGE_KEYS.hasEverAddedHost) === 'true';
    }

    init() {
        // setupEventListeners moved to startApp so dynamic sliders are ready before binding

        if (this.elements.btnBypassBlocker) {
            this.elements.btnBypassBlocker.addEventListener('click', () => {
                this.body.classList.add('is-mobile-dismissed');
                if (!this.state.isAppRunning) this.startApp();
            });
        }

        if (window.matchMedia("(max-width: 1280px), (max-height: 800px)").matches) {
            this.elements.mobileBlocker?.classList.add('is-visible');
            this.updateMobileScreenSizeInfo();
            return;
        }

        this.startApp();
    }

    startApp() {
        if (this.state.isAppRunning) return;
        this.state.isAppRunning = true;

        this.hydrate();
        
        // Modules startup
        this.themeManager.initThemeSelector();
        this.themeManager.initSwatches();
        this.ui.initSlidersUI();
        this.ui.initShortcutsUI();
        this.ui.setupEventListeners();
                
        this.themeManager.applyTheme(this.state.activeTheme, true);
        this.applyStateToUI();
        this.applyPosterText();
        this.particleEngine.adjustAmbientPetals();
        this.particleEngine.startAnimationLoop();
        
        this.checkWakeLockSupport();
        this.checkPersistentFullscreen();
        this.renderHosts();
        this.updateSleepStatus('off');
        this.updateScreenSize();
        this.updateTimerDisplay();
        this.startWakeLockHeartbeat();
        this.showKeyboardHint();

        requestAnimationFrame(() => {
            this.body.classList.remove('is-loading');
        });

        setTimeout(() => this.syncLayout(), 500);
    }

    applyStateToUI() {
        // Sync Sliders from registry
        window.SLIDER_CONFIGS.forEach(config => {
            const slider = document.getElementById(`slider-${config.id}`);
            const display = document.getElementById(`val-${config.id}`);
            const value = this.state[config.stateKey];
            if (slider) slider.value = value;
            if (display) display.textContent = `${value}${config.suffix || ''}`;
        });

        const isAccentBg = this.theme.flags?.useAccentAsBackground;
        const currentBg = this.state.bgColor || this.theme.colors.primary;
        const currentAccent = this.state.accentColor || this.theme.colors.accent;
        const displayColor = isAccentBg ? currentAccent : currentBg;

        if (this.elements.bgColorPicker) this.elements.bgColorPicker.value = displayColor;
        if (this.elements.bgColorVal) this.elements.bgColorVal.textContent = displayColor.toUpperCase();

        this.themeManager.updateSwatchActiveState();

        if (this.controls.hostLayoutRadios) {
            this.controls.hostLayoutRadios.forEach(radio => { radio.checked = (radio.value === this.state.hostLayout); });
        }
        
        if (this.controls.fpsCapRadios) {
            this.controls.fpsCapRadios.forEach(radio => { radio.checked = (Number(radio.value) === this.state.fpsCap); });
        }

        if (this.elements.logoModeRadios) {
            this.elements.logoModeRadios.forEach(radio => { radio.checked = (radio.value === this.state.posterText.logoMode); });
        }

        this.ui.syncPosterTextInputs();
        
        this.applyHostLayout(this.state.hostLayout);

        this.themeManager.syncWind();
        this.syncLayout();
        this.themeManager.syncBackdrop();

        this.controls.qrSoiree.checked = this.state.qrSoiree;
        this.controls.qrMembership.checked = this.state.qrMembership;
        this.controls.hideLogo.checked = this.state.hideLogo;
        this.controls.hideDate.checked = this.state.hideDate;
        this.controls.hideTitle.checked = this.state.hideTitle;
        this.controls.hideHost.checked = this.state.hideHost;
        this.controls.hideBorder.checked = this.state.hideBorder;
        this.controls.disableAutoFullscreen.checked = this.state.disableAutoFullscreen;
        
        if (this.controls.autoHideMenu) this.controls.autoHideMenu.checked = this.state.autoHideMenu;
        if (this.controls.smoothTransitions) {
            this.controls.smoothTransitions.checked = this.state.smoothTransitions;
            this.root.classList.toggle('no-transitions', !this.state.smoothTransitions);
        }

        this.applyHideUiState(this.state.hideUi);
        this.body.classList.toggle('logo-hidden', this.state.hideLogo);
        this.body.classList.toggle('date-hidden', this.state.hideDate);
        this.body.classList.toggle('title-hidden', this.state.hideTitle);
        this.body.classList.toggle('host-hidden', this.state.hideHost);
        this.body.classList.toggle('border-hidden', this.state.hideBorder);

        this.elements.qrSoiree.classList.toggle('qr-hidden', !this.state.qrSoiree);
        this.elements.qrMembership.classList.toggle('qr-hidden', !this.state.qrMembership);

        this.syncPauseStates();
    }

    syncLayout() {
        const wrapper = this.containers.wrapper;
        if (wrapper) {
            wrapper.style.setProperty('--inset-v', `${this.state.insetV}px`);
            wrapper.style.setProperty('--inset-h', `${this.state.insetH}px`);
        }
        const hosts = this.containers.hosts;
        if (hosts) {
            hosts.style.setProperty('--host-text-size', (this.state.hostTextSize * 1.1).toString());
            const maxWidthPx = (this.state.hostMaxWidth / 100) * 1110 * 1.16;
            hosts.style.setProperty('--host-max-width', `${maxWidthPx}px`);
        }
        requestAnimationFrame(() => this.optimizeLayouts());
    }

    syncPauseStates() {
        const pLabel = this.theme?.uiLabels?.particlesPlural || 'Particles';
        this.elements.pausePetalsButton.classList.toggle('active', this.state.isPetalsPaused);
        this.elements.pausePetalsButton.textContent = this.state.isPetalsPaused ? `Resume ${pLabel}` : `Pause ${pLabel}`;
        Object.values(this.layers).forEach(layer => layer.classList.toggle('paused', this.state.isPetalsPaused));

        const frameName = this.theme?.uiLabels?.frameName || 'Frame';
        this.elements.pauseBgButton.classList.toggle('active', this.state.isBgPaused);
        this.elements.pauseBgButton.textContent = this.state.isBgPaused ? `Resume ${frameName}` : `Pause ${frameName}`;
        document.querySelectorAll('.sway-layer, .floral-bg').forEach(el => el.classList.toggle('paused', this.state.isBgPaused));
    }

    applyHostLayout(layout) {
        if (!this.elements.hostsList) return;
        this.elements.hostsList.classList.remove('layout-justify', 'layout-centered', 'layout-columns');
        this.elements.hostsList.classList.add(`layout-${layout}`);
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
                spans.forEach(span => { span.style.fontSize = `calc(${scale}rem * var(--host-text-size) * var(--host-scale-base) * var(--dynamic-scale))`; });
                let lastTop = -1, itemsOnLastLine = 0;
                for (let i = 0; i < spans.length; i++) {
                    const top = spans[i].offsetTop;
                    if (top > lastTop + 10) { lastTop = top; itemsOnLastLine = 1; } else { itemsOnLastLine++; }
                }
                if (itemsOnLastLine > 1 || itemsOnLastLine === spans.length) { bestScale = scale; break; }
            }
            spans.forEach(span => { span.style.fontSize = `calc(${bestScale}rem * var(--host-text-size) * var(--host-scale-base) * var(--dynamic-scale))`; });
        }
        this.enforceVerticalFit();
    }

    enforceVerticalFit() {
        if (!this.containers.hosts || !this.elements.logoBanner || !this.elements.eventFooter) return;
        const MIN_SCALE = 0.35; const GAPS = 60;
        this.containers.hosts.style.setProperty('--dynamic-scale', '1');
        const logoH = this.elements.logoBanner.offsetHeight;
        const footerH = this.elements.eventFooter.offsetHeight;
        const titleH = this.containers.hosts.querySelector('.hosts-title').offsetHeight;
        const listH = this.elements.hostsList.offsetHeight;
        const totalH = logoH + footerH + titleH + listH + GAPS;
        const availH = window.innerHeight;
        let scale = 1;
        if (totalH > availH) {
            const hAreaH = titleH + listH;
            const nonHAreaH = logoH + footerH + GAPS;
            const targetH = availH - nonHAreaH;
            scale = targetH > 0 && hAreaH > 0 ? targetH / hAreaH : MIN_SCALE;
        }
        scale = Math.max(MIN_SCALE, Math.min(1.0, scale));
        this.containers.hosts.style.setProperty('--dynamic-scale', scale.toFixed(3));
    }

    applyPosterText() {
        const pt = this.state.posterText;
        if (this.elements.logoTextEl) this.elements.logoTextEl.textContent = pt.logoText;
        if (this.elements.hostsTitleEl) this.elements.hostsTitleEl.textContent = pt.hostsTitle;
        if (this.elements.eventTopLabelEl) this.elements.eventTopLabelEl.textContent = pt.eventTopLabel;
        if (this.elements.eventTitleEl) this.elements.eventTitleEl.textContent = pt.eventTitle;
        if (this.elements.eventSubtitleEl) this.elements.eventSubtitleEl.textContent = pt.eventSubtitle;
        if (this.elements.eventDateEl) this.elements.eventDateEl.textContent = pt.eventDate;

        if (this.elements.logoImg) {
            this.elements.logoImg.src = pt.logoImageData || '';
            this.elements.logoImg.classList.toggle('is-hidden', pt.logoMode !== 'image' || !pt.logoImageData);
        }
        if (this.elements.logoTextEl) {
            this.elements.logoTextEl.classList.toggle('is-hidden', pt.logoMode !== 'text');
        }

        // Toggle edit control visibility
        if (this.elements.logoImageControls) {
            this.elements.logoImageControls.classList.toggle('is-hidden', pt.logoMode !== 'image');
        }
        if (this.elements.logoTextControls) {
            this.elements.logoTextControls.classList.toggle('is-hidden', pt.logoMode !== 'text');
        }

        // Sync radio buttons
        if (this.elements.logoModeRadios) {
            this.elements.logoModeRadios.forEach(radio => {
                radio.checked = (radio.value === pt.logoMode);
            });
        }

        if (this.elements.qrSoireeImg) this.elements.qrSoireeImg.src = pt.qrLeftData || '';
        if (this.elements.qrMembershipImg) this.elements.qrMembershipImg.src = pt.qrRightData || '';
    }

    renderHosts() {
        if (!this.elements.hostsList) return;
        this.elements.hostsList.innerHTML = '';
        
        // If the user has ever added a host, we stop showing base hosts entirely
        const hostsToShow = this.state.hasEverAddedHost ? this.state.addedHosts : [...this.baseHosts, ...this.state.addedHosts];
        const allHosts = hostsToShow.filter(h => !this.state.removedHosts.includes(h));
        
        allHosts.sort((a, b) => {
            const getSortKey = (name) => {
                const words = name.toLowerCase().split(/\s+/).filter(w => !window.TITLE_FILTER_WORDS.has(w));
                return words.length > 0 ? words[words.length - 1] : name.toLowerCase();
            };
            return getSortKey(a).localeCompare(getSortKey(b));
        });

        allHosts.forEach(name => {
            const span = document.createElement('span');
            span.textContent = name;
            this.ui.bindHostHold(span, name);
            this.elements.hostsList.appendChild(span);
        });
        this.elements.hostsEmptyHint?.classList.toggle('is-hidden', allHosts.length > 0);
        requestAnimationFrame(() => this.optimizeLayouts());
        this.ui.renderAddedHosts();
        this.ui.renderRemovedHosts();
    }

    // Storage & Settings helpers
    loadSettings() { try { return JSON.parse(localStorage.getItem(window.STORAGE_KEYS.settings) || '{}'); } catch { return {}; } }
    saveSettings() { 
        const settings = {};
        Object.keys(window.DEFAULTS).forEach(key => {
            settings[key] = this.state[key];
        });
        localStorage.setItem(window.STORAGE_KEYS.settings, JSON.stringify(settings)); 
    }
    loadPosterText() { try { return { ...window.POSTER_TEXT_DEFAULTS, ...JSON.parse(localStorage.getItem(window.STORAGE_KEYS.posterText) || '{}') }; } catch { return window.POSTER_TEXT_DEFAULTS; } }
    savePosterText() { localStorage.setItem(window.STORAGE_KEYS.posterText, JSON.stringify(this.state.posterText)); }
    readStoredHosts() { try { return JSON.parse(localStorage.getItem(window.STORAGE_KEYS.addedHosts) || '[]'); } catch { return []; } }
    persistAddedHosts() { localStorage.setItem(window.STORAGE_KEYS.addedHosts, JSON.stringify(this.state.addedHosts)); }
    readStoredRemovedHosts() { try { return JSON.parse(localStorage.getItem(window.STORAGE_KEYS.removedHosts) || '[]'); } catch { return []; } }
    persistRemovedHosts() { localStorage.setItem(window.STORAGE_KEYS.removedHosts, JSON.stringify(this.state.removedHosts)); }

    // Logic Helpers
    deriveAccentColor(hex) { return window.PosterUtils.deriveAccentColor(hex); }
    
    // UI visibility helpers
    isControlsPanelVisible() { return this.elements.controlsPanel?.classList.contains('is-visible'); }
    isAddHostFormOpen() { return !this.elements.addHostForm?.classList.contains('is-hidden'); }
    isFactoryResetModalVisible() { return !this.elements.factoryResetModal?.classList.contains('is-hidden'); }
    isCustomizeOpen() { return this.elements.appearanceDetails?.open; }
    
    // Shortcut toggles
    toggleEditPosterShortcut() { 
        if (!this.isControlsPanelVisible()) {
            this.ui.toggleControlsPanel();
            this.elements.editPosterDetails.open = true;
        } else {
            this.elements.editPosterDetails.open = !this.elements.editPosterDetails.open;
        }
        const scrollContainer = this.elements.controlsPanel.querySelector('.controls-panel-scroll');
        if (scrollContainer) scrollContainer.scrollTop = 0;
    }
    toggleCustomizeShortcut() { 
        if (!this.isControlsPanelVisible()) {
            this.ui.toggleControlsPanel();
            this.elements.appearanceDetails.open = true;
        } else {
            this.elements.appearanceDetails.open = !this.elements.appearanceDetails.open;
        }
        const scrollContainer = this.elements.controlsPanel.querySelector('.controls-panel-scroll');
        if (scrollContainer) scrollContainer.scrollTop = 0;
    }
    toggleAddHostShortcut() { 
        if (!this.isControlsPanelVisible()) {
            this.ui.toggleControlsPanel();
            this.elements.hostManagementDetails.open = true;
            this.openAddHostForm();
        } else {
            const isNowOpen = !this.elements.hostManagementDetails.open;
            this.elements.hostManagementDetails.open = isNowOpen;
            if (isNowOpen) this.openAddHostForm();
        }
        const scrollContainer = this.elements.controlsPanel.querySelector('.controls-panel-scroll');
        if (scrollContainer) scrollContainer.scrollTop = 0;
    }
    toggleHelpShortcut() { 
        if (!this.isControlsPanelVisible()) {
            this.ui.toggleControlsPanel();
            this.elements.helpDetails.open = true;
        } else {
            this.elements.helpDetails.open = !this.elements.helpDetails.open;
        }
        const scrollContainer = this.elements.controlsPanel.querySelector('.controls-panel-scroll');
        if (scrollContainer) scrollContainer.scrollTop = 0;
    }

    // Add Host Logic
    openAddHostForm() { this.elements.addHostForm?.classList.remove('is-hidden'); this.elements.addHostInput?.focus(); }
    closeAddHostForm() { this.elements.addHostForm?.classList.add('is-hidden'); this.elements.addHostInput.value = ''; this.clearAddHostError(); }
    clearAddHostError() { this.elements.addHostError?.classList.add('is-hidden'); this.elements.addHostError.textContent = ''; }
    submitAddHost() {
        const val = this.elements.addHostInput.value.trim();
        if (!val) return;
        if (this.state.addedHosts.includes(val) || this.baseHosts.includes(val)) { this.elements.addHostError.textContent = 'Name already in list'; this.elements.addHostError.classList.remove('is-hidden'); return; }
        this.state.addedHosts.push(val);
        this.state.hasEverAddedHost = true;
        localStorage.setItem(window.STORAGE_KEYS.hasEverAddedHost, 'true');
        localStorage.setItem(window.STORAGE_KEYS.addedHosts, JSON.stringify(this.state.addedHosts));
        this.renderHosts(); this.closeAddHostForm();
    }

    removeHostByName(name) {
        if (!name) return;
        const addedIdx = this.state.addedHosts.indexOf(name);
        if (addedIdx !== -1) {
            this.state.addedHosts.splice(addedIdx, 1);
            this.persistAddedHosts();
        }
        
        // Hide it from the poster by adding to removedHosts
        if (!this.state.removedHosts.includes(name)) {
            this.state.removedHosts.push(name);
            this.persistRemovedHosts();
        }
        this.renderHosts();
    }

    restoreHostByName(name) {
        if (!name) return;
        
        // Remove from hidden list
        this.state.removedHosts = this.state.removedHosts.filter(h => h !== name);
        this.persistRemovedHosts();

        // If it's not a base host, it must be an added host, so put it back
        if (!this.baseHosts.includes(name) && !this.state.addedHosts.includes(name)) {
            this.state.addedHosts.push(name);
            this.persistAddedHosts();
        }
        
        this.renderHosts();
    }

    // Factory Reset Logic
    handleFactoryResetKeyDown(e) {
        if (e.repeat) return;
        this.state.factoryResetStartTime = Date.now();
        this.elements.factoryResetOverlay.classList.remove('is-hidden');
        const update = () => {
            if (!this.state.factoryResetStartTime) return;
            const elapsed = Date.now() - this.state.factoryResetStartTime;
            const progress = Math.min(elapsed / 1500, 1);
            this.elements.factoryResetProgress.style.width = `${progress * 100}%`;
            if (progress < 1) requestAnimationFrame(update);
            else { this.showFactoryResetConfirmation(); this.handleFactoryResetKeyUp(); }
        };
        requestAnimationFrame(update);
    }
    handleFactoryResetKeyUp() { this.state.factoryResetStartTime = null; this.elements.factoryResetOverlay.classList.add('is-hidden'); this.elements.factoryResetProgress.style.width = '0%'; }
    showFactoryResetConfirmation() { this.elements.factoryResetModal.classList.remove('is-hidden'); }
    hideFactoryResetConfirmation() { this.elements.factoryResetModal.classList.add('is-hidden'); }
    performFactoryReset() { localStorage.clear(); window.location.reload(); }

    resetDefaults() {
        this.state = { 
            ...this.state,
            ...window.DEFAULTS, 
            isAppRunning: this.state.isAppRunning,
            activeTheme: this.state.activeTheme, // Preserve the current theme
            addedHosts: this.state.addedHosts, 
            removedHosts: this.state.removedHosts, 
            posterText: this.state.posterText 
        };

        // Re-apply the current theme's overrides on top of the global defaults
        if (this.theme && this.theme.overrides) {
            Object.keys(this.theme.overrides).forEach(key => {
                if (key in this.state) this.state[key] = this.theme.overrides[key];
            });
        }

        this.saveSettings(); 
        this.applyStateToUI();
        
        // Trigger necessary side-effects so the engine actually reflects the reset state
        this.syncLayout();
        this.themeManager?.syncWind();
        this.themeManager?.syncBackdrop();
        this.particleEngine?.adjustAmbientPetals();
    }

    // Wake Lock & Fullscreen helpers
    async checkWakeLockSupport() { if ('wakeLock' in navigator) this.state.wakeLockMode = 'native'; else if (this.elements.wakeLockVideo) this.state.wakeLockMode = 'video'; }
    async requestWakeLock() {
        if (this.state.wakeLockMode === 'native') { try { this.state.wakeLock = await navigator.wakeLock.request('screen'); this.updateSleepStatus('on'); } catch { this.updateSleepStatus('error'); } }
        else if (this.state.wakeLockMode === 'video') { this.elements.wakeLockVideo.play(); this.updateSleepStatus('on'); }
    }
    releaseWakeLock() {
        if (this.state.wakeLock) { this.state.wakeLock.release().then(() => { this.state.wakeLock = null; this.updateSleepStatus('off'); }); }
        else if (this.state.wakeLockMode === 'video') { this.elements.wakeLockVideo.pause(); this.updateSleepStatus('off'); }
    }
    updateSleepStatus(status) {
        if (this.elements.sleepStatus) {
            this.elements.sleepStatus.className = `stat-value status-${status}`;
            this.elements.sleepStatus.textContent = status === 'on' ? 'Active' : status === 'error' ? 'Error' : 'Off';
        }
    }
    startWakeLockHeartbeat() { setInterval(() => { if (this.state.wakeLockActive && !this.state.wakeLock && this.state.wakeLockMode === 'native') this.requestWakeLock(); }, 15000); }
    
    requestFullscreenMode() { if (!document.fullscreenElement) this.root.requestFullscreen().catch(() => { this.elements.fullscreenToggle.checked = false; }); }
    exitFullscreenMode() { if (document.fullscreenElement) document.exitFullscreen(); }
    checkPersistentFullscreen() {
        if (localStorage.getItem(window.STORAGE_KEYS.fullscreenIntent) !== 'true') return;
        
        // Show the recovery hint immediately (matches the style of the countdown)
        if (this.elements.recoveryHint) {
            this.elements.recoveryHint.classList.remove('is-countdown-hidden');
            
            // Auto-hide after 10 seconds if no interaction
            this.state.recoveryHintTimer = setTimeout(() => {
                this.elements.recoveryHint?.classList.add('is-countdown-hidden');
            }, 10000);
        }
        
        // Wait for a user gesture (click) before starting the recovery countdown
        const triggerRecovery = () => {
            if (this.state.disableAutoFullscreen || document.fullscreenElement) return;
            
            // Hide the hint immediately on interaction
            if (this.elements.recoveryHint) {
                this.elements.recoveryHint.classList.add('is-countdown-hidden');
                if (this.state.recoveryHintTimer) clearTimeout(this.state.recoveryHintTimer);
            }
            
            this.showFullscreenCountdown();
        };

        window.addEventListener('click', triggerRecovery, { once: true });
    }
    
    showFullscreenCountdown() {
        if (this.state.disableAutoFullscreen || document.fullscreenElement) return;
        this.elements.fullscreenCountdown.classList.remove('is-countdown-hidden');
        let count = 3; 
        this.elements.countdownNumber.textContent = count;
        
        this.state.countdownTimer = setInterval(() => {
            count--; 
            this.elements.countdownNumber.textContent = count;
            if (count <= 0) { 
                this.cancelFullscreenCountdown(true, false); 
            }
        }, 1000);
    }

    cancelFullscreenCountdown(triggerFullscreen = false, clearIntent = false) {
        if (this.state.countdownTimer) {
            clearInterval(this.state.countdownTimer);
            this.state.countdownTimer = null;
        }
        this.elements.fullscreenCountdown.classList.add('is-countdown-hidden');
        
        if (triggerFullscreen) { 
            this.elements.fullscreenToggle.click(); 
        }
        
        if (clearIntent) { 
            localStorage.setItem(window.STORAGE_KEYS.fullscreenIntent, 'false'); 
        }
    }

    updateScreenSize() { 
        if (this.elements.screenSize) {
            const w = window.innerWidth || document.documentElement.clientWidth;
            const h = window.innerHeight || document.documentElement.clientHeight;
            this.elements.screenSize.textContent = `${w} × ${h}`; 
        }
    }
    updateTimerDisplay() {
        if (!this.elements.timer) return;
        
        let timeStr = '0:00';
        if (this.state.fullscreenStartTime) {
            const sec = Math.floor((Date.now() - this.state.fullscreenStartTime) / 1000);
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            timeStr = `${m}:${s < 10 ? '0' : ''}${s}`;
        }
        
        if (this.elements.timer.textContent !== timeStr) {
            this.elements.timer.textContent = timeStr;
        }
        this.elements.timer.classList.toggle('stat-value--inactive', timeStr === '0:00');
    }
    
    showKeyboardHint() {
        if (!this.elements.keyboardHint) return;
        setTimeout(() => { if (!this.isControlsPanelVisible() && !document.fullscreenElement) { this.elements.keyboardHint.classList.add('is-visible'); setTimeout(() => this.elements.keyboardHint.classList.remove('is-visible'), 8000); } }, 1500);
    }

    updateMobileScreenSizeInfo() {
        if (this.elements.mobileScreenSizeInfo) {
            this.elements.mobileScreenSizeInfo.textContent = `Detected: ${window.innerWidth}×${window.innerHeight}  |  Recommended: >1280×800`;
        }
    }

    autoGrowTextarea(el) { el.style.height = 'auto'; el.style.height = (el.scrollHeight) + 'px'; }
    
    applyHideUiState(hidden) {
        this.body.classList.toggle('ui-hidden', hidden);
        // If we hide UI, we also hide the sub-toggles to keep panel clean
        const subToggles = [this.controlLabels.hideLogo, this.controlLabels.hideDate, this.controlLabels.hideTitle, this.controlLabels.hideHost];
        subToggles.forEach(el => el?.classList.toggle('is-hidden', hidden));
    }

    reloadStyles() {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
            const url = new URL(link.href, window.location.href);
            url.searchParams.set('v', Date.now());
            link.href = url.toString();
        });
    }
};
