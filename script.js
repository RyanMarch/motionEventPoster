/**
 * Event Poster controls.
 * Keeps display behavior stable while organizing UI, animation, and host logic.
 */

const STORAGE_KEYS = {
    addedHosts: 'poster-added-hosts',
    removedHosts: 'poster-removed-hosts',
    fullscreenIntent: 'poster-fullscreen-intent',
    settings: 'poster-settings',
    hasEverAddedHost: 'poster-has-ever-added-host',
    posterText: 'poster-text-content',
};

const DEFAULTS = {
    maxPetals: 20,
    windiness: 20,

    fallSpeed: 0.6,
    tumbleSpeed: 1,
    gustStrength: 10,

    hostTextSize: 1.0,
    hostMaxWidth: 100, // 100% (maps to 1110px)
    hostLayout: 'centered',

    backdropOpacity: 100,
    insetV: 60,
    insetH: 80,

    hideUi: false,
    hideLogo: false,
    hideDate: false,
    hideTitle: false,
    hideHost: false,
    hideBorder: false,

    qrSoiree: false,
    qrMembership: false,
    isPetalsPaused: false,
    isBgPaused: false,
    disableAutoFullscreen: false,
    isAppRunning: false,
    bgColor: '#032858'
};

const POSTER_TEXT_DEFAULTS = {
    logoMode: 'text',    // 'image' | 'text' | 'hidden'
    logoImageData: null,  // base64 data URL
    logoText: 'Organization Name or Logo Goes Here',
    hostsTitle: 'Thanks To Our Hosts',
    eventTopLabel: 'Annual',
    eventTitle: 'Spring Soiree',
    eventSubtitle: 'fundraiser',
    eventDate: 'Wednesday, April 1, 2050',
    qrLeftData: null,     // base64 data URL
    qrRightData: null,    // base64 data URL
};

const TITLE_FILTER_WORDS = new Set(['the', 'honorable', 'dr.', 'mr.', 'mrs.', 'ms.']);

const HERO_COLORS = [
    { hex: '#032858', name: 'Original Navy' },
    { hex: '#1B363C', name: 'Deep Teal' },
    { hex: '#3B4D35', name: 'Deep Moss' },
    { hex: '#4E3541', name: 'Deep Plum' },
    { hex: '#2B2D31', name: 'Charcoal' },
    { hex: '#8FA382', name: 'Sage Green' },
    { hex: '#F5F2EB', name: 'Warm Cream' }
];

class EventPoster {
    constructor() {
        this.petalTypes = [
            { color: '#d28282', gradient: '#b56363', type: 'petal' },
            { color: '#e6a4a4', gradient: '#c98585', type: 'petal' },
            { color: '#789c8a', gradient: '#5a7d6c', type: 'leaf' },
            { color: '#f9d783', gradient: '#dcb760', type: 'petal' },
            { color: '#ffffff', gradient: '#e0e0e0', type: 'petal' }
        ];

        this.cacheElements();
        this.baseHosts = this.getInitialHosts();
        this.settings = this.loadSettings();
        this.state = { ...DEFAULTS }

        this.focusableElements = [];
        this.currentIndex = -1;

        this.inactivityTimer = null;
        this.dismissTimer = null;

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
            advancedSummary: document.querySelector('#appearance-details summary'),
            hostManagementSummary: document.querySelector('#host-management-details summary'),
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
            proceedAnywayBtn: document.getElementById('btn-proceed-anyway'),
            mobileScreenSizeInfo: document.getElementById('mobile-screen-size-info'),
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
            disableAutoFullscreen: document.getElementById('check-disable-auto-fullscreen')
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

    hydrate() {
        const s = this.settings;

        Object.keys(DEFAULTS).forEach((key) => {
            const defaultValue = DEFAULTS[key];
            const savedValue = s[key];

            if (savedValue === undefined || savedValue === null) {
                this.state[key] = defaultValue;
                return;
            }

            // Type normalization
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
        this.state.addedHosts = this.readStoredHosts();
        this.state.removedHosts = this.readStoredRemovedHosts();
        this.state.posterText = this.loadPosterText();
        this.state.wakeLock = null;
        this.state.wakeLockActive = false;
        this.state.wakeLockMode = 'none';
        this.state.fallbackInterval = null;
        this.state.heartbeatInterval = null;
        this.state.lastFrameTime = performance.now();
        this.state.lastPhysicsTime = performance.now();
        this.state.currentWind = 0;
        this.state.gustForce = 0;
        this.state.windDirection = 1;
        this.state.targetWindDirection = 1;
        this.state.downtimeTimer = 0;
        this.state.frameCount = 0;
        this.state.totalFullscreenSeconds = null;
        this.state.fullscreenStartTime = null;
        this.state.isKeyboardUser = false;
        this.state.emptyHintTimer = null;
        this.state.factoryResetStartTime = null;
    }

    syncBackdrop() {
        const opacity = this.state.backdropOpacity / 100;
        const color = this.state.bgColor || '#032858';
        const rgb = this.hexToRgb(color);
        const rgbStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

        this.root.style.setProperty('--color-primary', color);

        // Calculate relative luminance to determine if background is light or dark
        // Formula: 0.2126 * R + 0.7152 * G + 0.0722 * B
        const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
        this.body.classList.toggle('is-light-bg', luminance > 0.5);

        const target = this.containers.wrapper || this.root;
        target.style.setProperty('--overlay-dark', `rgba(${rgbStr}, ${0.95 * opacity})`);
        target.style.setProperty('--overlay-mid', `rgba(${rgbStr}, ${0.7 * opacity})`);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 3, g: 40, b: 88 };
    }

    syncWind() {
        const impact = this.state.gustStrength / 10;
        const target = this.root; // Wind affects background layers globally
        target.style.setProperty('--gust-impact', impact);
        target.style.setProperty('--gust-speed', 0.5 + impact * 0.5);
    }
    syncLayout() {
        const wrapper = this.containers.wrapper;
        if (wrapper) {
            wrapper.style.setProperty('--inset-v', `${this.state.insetV}px`);
            wrapper.style.setProperty('--inset-h', `${this.state.insetH}px`);
        }

        const hosts = this.containers.hosts;
        if (hosts) {
            // 1.0x on the slider renders as the user's preferred 1.1x look.
            // Baking the factor here keeps labels clean (shows "1x", renders at 1.1×).
            hosts.style.setProperty('--host-text-size', this.state.hostTextSize * 1.1);

            // 100% on the slider maps to the user's preferred 116% width.
            // (100% = 1110px × 1.16 = 1287.6px)
            const maxWidthPx = (this.state.hostMaxWidth / 100) * 1110 * 1.16;
            hosts.style.setProperty('--host-max-width', `${maxWidthPx}px`);
        }

        requestAnimationFrame(() => this.optimizeLayouts());
    }

    syncPauseStates() {
        // Petals
        this.elements.pausePetalsButton.classList.toggle('active', this.state.isPetalsPaused);
        this.elements.pausePetalsButton.textContent = this.state.isPetalsPaused ? 'Resume Petals' : 'Pause Petals';

        Object.values(this.layers).forEach((layer) => {
            layer.classList.toggle('paused', this.state.isPetalsPaused);
        });

        // Background
        this.elements.pauseBgButton.classList.toggle('active', this.state.isBgPaused);
        this.elements.pauseBgButton.textContent = this.state.isBgPaused ? 'Resume Waves' : 'Pause Waves';

        document
            .querySelectorAll('.sway-layer, .floral-bg')
            .forEach((element) => element.classList.toggle('paused', this.state.isBgPaused));
    }

    applyStateToUI() {
        const setSlider = (id, value) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.value = value;
        };

        // 1. Sync Sliders
        setSlider('slider-max-petals', this.state.maxPetals);
        setSlider('slider-gust-freq', this.state.windiness);
        setSlider('slider-fall-speed', this.state.fallSpeed);
        setSlider('slider-tumble-speed', this.state.tumbleSpeed);
        setSlider('slider-gust-strength', this.state.gustStrength);
        setSlider('slider-host-text-size', this.state.hostTextSize);
        setSlider('slider-host-max-width', this.state.hostMaxWidth);
        setSlider('slider-backdrop-opacity', this.state.backdropOpacity);
        setSlider('slider-inset-v', this.state.insetV);
        setSlider('slider-inset-h', this.state.insetH);

        if (this.elements.bgColorPicker) {
            this.elements.bgColorPicker.value = this.state.bgColor || '#032858';
        }
        if (this.elements.bgColorVal) {
            const displayColor = this.state.bgColor || '#032858';
            this.elements.bgColorVal.textContent = displayColor.toUpperCase();
        }

        this.updateSwatchActiveState();

        // 2. Sync Labels
        const setLabel = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        setLabel('val-max-petals', this.state.maxPetals);
        setLabel('val-gust-freq', this.state.windiness);
        setLabel('val-fall-speed', `${this.state.fallSpeed}x`);
        setLabel('val-tumble-speed', `${this.state.tumbleSpeed}x`);
        setLabel('val-gust-strength', `${this.state.gustStrength}vw`);
        setLabel('val-host-text-size', `${this.state.hostTextSize}x`);
        setLabel('val-host-max-width', `${this.state.hostMaxWidth}%`);
        setLabel('val-backdrop-opacity', `${this.state.backdropOpacity}%`);
        setLabel('val-inset-v', `${this.state.insetV}px`);
        setLabel('val-inset-h', `${this.state.insetH}px`);

        // 3. Sync Host Layout
        if (this.controls.hostLayoutRadios) {
            this.controls.hostLayoutRadios.forEach(radio => {
                radio.checked = (radio.value === this.state.hostLayout);
            });
        }
        this.applyHostLayout(this.state.hostLayout);

        // 4. Sync CSS Variables
        this.syncWind();
        this.syncLayout();
        this.syncBackdrop();

        this.controls.qrMembership.checked = this.state.qrMembership;
        this.controls.hideBorder.checked = this.state.hideBorder;
        this.controls.disableAutoFullscreen.checked = this.state.disableAutoFullscreen;

        this.controls.hideUi.checked = this.state.hideUi;
        this.applyHideUiState(this.state.hideUi);

        this.controls.hideLogo.checked = this.state.hideLogo;
        this.body.classList.toggle('logo-hidden', this.state.hideLogo);

        this.controls.hideDate.checked = this.state.hideDate;
        this.body.classList.toggle('date-hidden', this.state.hideDate);

        this.controls.hideTitle.checked = this.state.hideTitle;
        this.body.classList.toggle('title-hidden', this.state.hideTitle);

        this.controls.hideHost.checked = this.state.hideHost;
        this.body.classList.toggle('host-hidden', this.state.hideHost);

        this.controls.hideBorder.checked = this.state.hideBorder;
        this.body.classList.toggle('border-hidden', this.state.hideBorder);

        this.controls.qrSoiree.checked = this.state.qrSoiree;
        this.elements.qrSoiree.classList.toggle('qr-hidden', !this.state.qrSoiree);

        this.controls.qrMembership.checked = this.state.qrMembership;
        this.elements.qrMembership.classList.toggle('qr-hidden', !this.state.qrMembership);

        // 6. Sync Animation Pause States
        this.syncPauseStates();
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

        // Reset dynamic inline styles
        spans.forEach(span => span.style.fontSize = '');

        if (layout === 'justify') {
            let bestScale = 1.6;

            for (let scale = 1.6; scale >= 0.8; scale -= 0.05) {
                spans.forEach(span => {
                    span.style.fontSize = `calc(${scale}rem * var(--host-text-size) * var(--host-scale-base) * var(--dynamic-scale))`;
                });

                let lastTop = -1;
                let itemsOnLastLine = 0;

                for (let i = 0; i < spans.length; i++) {
                    const top = spans[i].offsetTop;
                    if (top > lastTop + 10) {
                        lastTop = top;
                        itemsOnLastLine = 1;
                    } else {
                        itemsOnLastLine++;
                    }
                }

                // Space-between aligns perfectly when there's > 1 item on the last line
                if (itemsOnLastLine > 1 || itemsOnLastLine === spans.length) {
                    bestScale = scale;
                    break;
                }
            }

            spans.forEach(span => {
                span.style.fontSize = `calc(${bestScale}rem * var(--host-text-size) * var(--host-scale-base) * var(--dynamic-scale))`;
            });
        }

        this.enforceVerticalFit();
    }

    enforceVerticalFit() {
        if (!this.containers.hosts || !this.elements.logoBanner || !this.elements.eventFooter) return;

        const MIN_SCALE = 0.35;
        const GAPS = 60; // Total expected vertical breathing room between elements
        
        // 1. Reset to baseline for measurement
        this.containers.hosts.style.setProperty('--host-text-size', '1.1');
        this.containers.hosts.style.setProperty('--dynamic-scale', '1');

        // 2. Measure "natural" heights of fixed elements and hosts area
        const logoH = this.elements.logoBanner.offsetHeight;
        const footerH = this.elements.eventFooter.offsetHeight;
        const hostsTitleH = this.containers.hosts.querySelector('.hosts-title').offsetHeight;
        const hostsListH = this.elements.hostsList.offsetHeight;

        const totalNeededHeight = logoH + footerH + hostsTitleH + hostsListH + GAPS;
        const availableHeight = window.innerHeight;

        // 3. Calculate required scale if there's an overflow
        let scale = 1;
        if (totalNeededHeight > availableHeight) {
            const hostsAreaHeight = hostsTitleH + hostsListH;
            const nonHostsHeight = logoH + footerH + GAPS;
            const targetHostsHeight = availableHeight - nonHostsHeight;
            
            if (targetHostsHeight > 0 && hostsAreaHeight > 0) {
                scale = targetHostsHeight / hostsAreaHeight;
            } else {
                scale = MIN_SCALE;
            }
        }

        // Clamp to min scale and never grow beyond 1.0
        scale = Math.max(MIN_SCALE, Math.min(1.0, scale));

        // 4. Apply final properties
        this.containers.hosts.style.setProperty('--dynamic-scale', scale.toFixed(3));
        this.containers.hosts.style.setProperty('--host-text-size', (this.state.hostTextSize * 1.1).toString());
    }

    init() {
        if (this.elements.proceedAnywayBtn) {
            this.elements.proceedAnywayBtn.addEventListener('click', () => {
                this.body.classList.add('is-mobile-dismissed');
                if (!this.state.isAppRunning) {
                    this.startApp();
                }
            });
        }

        // Don't even try to load the rest of the app on a small screen.
        if (window.matchMedia("(max-width: 1280px), (max-height: 800px)").matches) {
            console.info("Small screen detected. Waiting for user interaction.");
            this.updateMobileScreenSizeInfo();
            return;
        }

        this.startApp();
    }

    updateMobileScreenSizeInfo() {
        if (this.elements.mobileScreenSizeInfo) {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.elements.mobileScreenSizeInfo.textContent = `Detected: ${w}×${h}  |  Recommended: >1280×800`;
        }
    }

    startApp() {
        if (this.state.isAppRunning) return;
        this.state.isAppRunning = true;

        this.hydrate();
        this.initSwatches();
        this.setupEventListeners();
        this.applyStateToUI();
        this.applyPosterText();
        this.adjustAmbientPetals();
        this.startAnimationLoop();
        this.checkWakeLockSupport();
        this.checkPersistentFullscreen();
        this.renderHosts();
        this.updateSleepStatus('off');
        this.updateScreenSize();
        this.startWakeLockHeartbeat();
        this.showKeyboardHint();

        // Reveal the app once initialization is complete
        requestAnimationFrame(() => {
            this.body.classList.remove('is-loading');
        });

        // Secondary sync after a delay to catch late-loading fonts/images
        setTimeout(() => this.syncLayout(), 500);
    }


    getInitialHosts() {
        return Array.from(this.elements.hostsList.querySelectorAll('span'), (element) =>
            element.textContent.trim()
        );
    }

    showKeyboardHint() {
        if (!this.elements.keyboardHint) return;

        setTimeout(() => {
            if (!this.isControlsPanelVisible() && !document.fullscreenElement) {
                this.elements.keyboardHint.classList.add('is-visible');

                setTimeout(() => {
                    this.elements.keyboardHint.classList.remove('is-visible');
                }, 8000);
            }
        }, 1500);
    }

    readStoredHosts() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.addedHosts) || '[]');
            return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : [];
        } catch {
            return [];
        }
    }

    persistAddedHosts() {
        localStorage.setItem(STORAGE_KEYS.addedHosts, JSON.stringify(this.state.addedHosts));
    }

    readStoredRemovedHosts() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.removedHosts) || '[]');
            return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : [];
        } catch {
            return [];
        }
    }

    persistRemovedHosts() {
        localStorage.setItem(STORAGE_KEYS.removedHosts, JSON.stringify(this.state.removedHosts));
    }

    loadSettings() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}') || {};
        } catch {
            return {};
        }
    }

    saveSettings() {
        const settings = {};
        Object.keys(DEFAULTS).forEach((key) => {
            settings[key] = this.state[key];
        });
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    }

    setupEventListeners() {
        this.bindGlobalShortcuts();
        this.initKeyboardNavigation();
        this.bindSliders();
        this.bindToggles();
        this.bindColorPicker();
        this.bindButtons();
        this.bindHostManagement();
        this.bindEditPoster();
        this.bindFullscreenControls();
        this.bindAccordionBehavior();
        this.bindPanelInactivity();
        this.bindOutsideClickDismiss();

        window.addEventListener('resize', () => {
            requestAnimationFrame(() => {
                if (this.state.isAppRunning) {
                    this.optimizeLayouts();
                    this.updateScreenSize();
                } else {
                    this.updateMobileScreenSizeInfo();
                }
            });
        });

        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'hidden') {
                this.state.wakeLockActive = false;
                this.updateSleepStatus('error');
                return;
            }

            if (
                document.visibilityState === 'visible' &&
                this.elements.fullscreenToggle.checked &&
                document.fullscreenElement &&
                !this.state.wakeLock
            ) {
                await this.requestWakeLock();
            }
        });
        this.bindHoldHotspot();

        // Ensure layout is optimized once fonts are loaded (especially important on hard refreshes)
        if (document.fonts) {
            document.fonts.ready.then(() => {
                requestAnimationFrame(() => this.optimizeLayouts());
            });
        }
    }

    bindHoldHotspot() {
        const HOLD_TIME = 700; // ms
        const HOTSPOT_SIZE = 120; // px (top-right region)

        let timer = null;
        let active = false;

        const isInHotspot = (event) => {
            const x = event.clientX;
            const y = event.clientY;

            return (
                x >= window.innerWidth - HOTSPOT_SIZE &&
                y <= HOTSPOT_SIZE
            );
        };

        const start = (event) => {
            if (!isInHotspot(event)) return;

            active = true;

            timer = setTimeout(() => {
                this.toggleControlsPanel();
                active = false;
            }, HOLD_TIME);
        };

        const cancel = () => {
            active = false;
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        };

        document.addEventListener('pointerdown', start);
        document.addEventListener('pointerup', cancel);
        document.addEventListener('pointercancel', cancel);
        document.addEventListener('pointerleave', cancel);

        // safety: cancel if pointer moves out of hotspot
        document.addEventListener('pointermove', (event) => {
            if (!active) return;
            if (!isInHotspot(event)) cancel();
        });

        // Track interaction mode to hide focus rings on click
        document.addEventListener('pointerdown', () => {
            this.state.isKeyboardUser = false;
        }, { capture: true });
    }

    bindGlobalShortcuts() {
        document.addEventListener('keydown', (event) => {
            const key = event.key;

            if (key === '\\' && !this.isTextInput(event.target)) {
                this.handleFactoryResetKeyDown(event);
                return;
            }

            // Escape handling (priority over text inputs and fullscreen exit)
            if (key === 'Escape') {
                let handled = false;

                if (this.isAddHostFormOpen()) {
                    this.closeAddHostForm();
                    handled = true;
                } else if (this.isControlsPanelVisible()) {
                    this.toggleControlsPanel();
                    handled = true;
                }

                if (handled) {
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
            }

            if (this.isTextInput(event.target)) {
                return;
            }

            const lowerKey = key.toLowerCase();

            if (lowerKey === 'q' && !event.repeat) {
                this.toggleControlsPanel();
                return;
            }

            // E opens the panel and jumps to Edit Poster (works even when panel is closed)
            if (lowerKey === 'e' && !event.repeat) {
                this.toggleEditPosterShortcut();
                event.preventDefault();
                return;
            }

            // ? or / opens the Help menu
            if ((key === '?' || key === '/') && !event.repeat) {
                this.toggleHelpShortcut();
                event.preventDefault();
                return;
            }

            // fullscreen should always work (not dependent on debug panel state)
            if (lowerKey === 'f' && !event.repeat) {
                if (!document.fullscreenElement) {
                    this.elements.fullscreenToggle.click();
                }
                return;
            }

            // only block remaining shortcuts when debug panel is not visible
            if (!this.isControlsPanelVisible() || event.repeat) {
                return;
            }

            if (lowerKey === 'h' && !event.repeat) {
                this.toggleHelpShortcut();
                event.preventDefault();
                return;
            }

            if (lowerKey === 'a') {
                this.toggleAddHostShortcut();
                event.preventDefault();
                return;
            }

            if (lowerKey === 'c') {
                this.toggleCustomizeShortcut();
                event.preventDefault();
                return;
            }

            if (lowerKey === 'r' && !event.repeat) {
                if (this.isCustomizeOpen()) {
                    event.preventDefault();
                    this.resetDefaults();
                }
                return;
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === '\\') {
                this.handleFactoryResetKeyUp();
            }
        });
    }

    bindSliders() {
        this.bindSlider('slider-max-petals', 'val-max-petals', (value) => {
            this.state.maxPetals = Number.parseInt(value, 10);
            this.adjustAmbientPetals();
        });

        this.bindSlider('slider-gust-freq', 'val-gust-freq', (value) => {
            this.state.windiness = Number.parseFloat(value);
        });

        this.bindSlider('slider-fall-speed', 'val-fall-speed', (value) => {
            this.state.fallSpeed = Number.parseFloat(value);
            return `${value}x`;
        });

        this.bindSlider('slider-tumble-speed', 'val-tumble-speed', (value) => {
            this.state.tumbleSpeed = Number.parseFloat(value);
            return `${value}x`;
        });

        this.bindSlider('slider-gust-strength', 'val-gust-strength', (value) => {
            this.state.gustStrength = Number.parseFloat(value);
            this.syncWind();
            return `${value}vw`;
        });

        this.bindSlider('slider-host-text-size', 'val-host-text-size', (value) => {
            this.state.hostTextSize = Number.parseFloat(value);
            this.syncLayout();
            return `${value}x`;
        });

        this.bindSlider('slider-host-max-width', 'val-host-max-width', (value) => {
            this.state.hostMaxWidth = Number.parseFloat(value);
            this.syncLayout();
            return `${value}%`;
        });

        this.bindSlider('slider-backdrop-opacity', 'val-backdrop-opacity', (value) => {
            this.state.backdropOpacity = Number.parseFloat(value);
            this.syncBackdrop();
            return `${value}%`;
        });

        this.bindSlider('slider-inset-v', 'val-inset-v', (value) => {
            this.state.insetV = Number.parseFloat(value);
            this.syncLayout();
            return `${value}px`;
        });

        this.bindSlider('slider-inset-h', 'val-inset-h', (value) => {
            this.state.insetH = Number.parseInt(value, 10);
            this.syncLayout();
            return `${value}px`;
        });
    }

    bindColorPicker() {
        if (!this.elements.bgColorPicker) return;

        this.elements.bgColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            this.state.bgColor = color;
            if (this.elements.bgColorVal) {
                this.elements.bgColorVal.textContent = color.toUpperCase();
            }
            this.syncBackdrop();
            this.updateSwatchActiveState();
        });

        this.elements.bgColorPicker.addEventListener('change', () => {
            this.saveSettings();
        });
    }

    initSwatches() {
        if (!this.elements.swatchGrid) return;

        // Prepend swatches to the grid (before the custom button)
        HERO_COLORS.forEach(colorObj => {
            const btn = document.createElement('button');
            btn.className = 'swatch';
            btn.style.backgroundColor = colorObj.hex;
            btn.dataset.color = colorObj.hex;
            btn.title = colorObj.name;

            btn.addEventListener('click', () => {
                const color = colorObj.hex;
                this.state.bgColor = color;
                if (this.elements.bgColorPicker) {
                    this.elements.bgColorPicker.value = color;
                }
                if (this.elements.bgColorVal) {
                    this.elements.bgColorVal.textContent = color.toUpperCase();
                }
                this.syncBackdrop();
                this.updateSwatchActiveState();
                this.saveSettings();
            });

            this.elements.swatchGrid.insertBefore(btn, this.elements.btnCustomColor);
        });
    }

    updateSwatchActiveState() {
        if (!this.elements.swatchGrid) return;

        const swatches = this.elements.swatchGrid.querySelectorAll('.swatch:not(.swatch--custom)');
        let found = false;

        swatches.forEach(s => {
            const swatchColor = s.dataset.color.toLowerCase();
            const currentColor = this.state.bgColor.toLowerCase();
            const isActive = swatchColor === currentColor;
            
            s.classList.toggle('active', isActive);
            if (isActive) found = true;
        });

        if (this.elements.btnCustomColor) {
            this.elements.btnCustomColor.classList.toggle('active', !found);
            if (!found) {
                this.elements.btnCustomColor.style.backgroundColor = this.state.bgColor;
                this.elements.btnCustomColor.style.color = this.isDark(this.state.bgColor) ? '#fff' : '#000';
                this.elements.btnCustomColor.style.borderStyle = 'solid';
                this.elements.btnCustomColor.style.borderColor = 'var(--color-accent)';
            } else {
                this.elements.btnCustomColor.style.backgroundColor = '';
                this.elements.btnCustomColor.style.color = '';
                this.elements.btnCustomColor.style.borderStyle = '';
                this.elements.btnCustomColor.style.borderColor = '';
            }
        }
    }

    isDark(color) {
        const rgb = this.hexToRgb(color);
        const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
        return luminance < 0.5;
    }

    bindToggles() {
        if (this.controls.hostLayoutRadios) {
            this.controls.hostLayoutRadios.forEach(radio => {
                radio.addEventListener('change', (event) => {
                    if (event.target.checked) {
                        this.state.hostLayout = event.target.value;
                        this.applyHostLayout(this.state.hostLayout);
                        this.saveSettings();
                    }
                });
            });
        }

        this.controls.hideUi.addEventListener('change', (event) => {
            this.state.hideUi = event.target.checked;
            this.applyHideUiState(this.state.hideUi);
            this.saveSettings();
        });

        this.controls.hideLogo.addEventListener('change', (event) => {
            this.state.hideLogo = event.target.checked;
            this.body.classList.toggle('logo-hidden', this.state.hideLogo);
            setTimeout(() => this.optimizeLayouts(), 50);
            this.saveSettings();
        });

        this.controls.hideDate.addEventListener('change', (event) => {
            this.state.hideDate = event.target.checked;
            this.body.classList.toggle('date-hidden', this.state.hideDate);
            setTimeout(() => this.optimizeLayouts(), 50);
            this.saveSettings();
        });

        this.controls.hideTitle.addEventListener('change', (event) => {
            this.state.hideTitle = event.target.checked;
            this.body.classList.toggle('title-hidden', this.state.hideTitle);
            setTimeout(() => this.optimizeLayouts(), 50);
            this.saveSettings();
        });

        this.controls.hideHost.addEventListener('change', (event) => {
            this.state.hideHost = event.target.checked;
            this.body.classList.toggle('host-hidden', this.state.hideHost);
            setTimeout(() => this.optimizeLayouts(), 50);
            this.saveSettings();
        });

        this.controls.hideBorder.addEventListener('change', (event) => {
            this.state.hideBorder = event.target.checked;
            this.body.classList.toggle('border-hidden', this.state.hideBorder);
            this.saveSettings();
        });

        this.controls.qrSoiree.addEventListener('change', (event) => {
            this.state.qrSoiree = event.target.checked;
            this.elements.qrSoiree.classList.toggle('qr-hidden', !this.state.qrSoiree);
            this.saveSettings();
        });

        this.controls.qrMembership.addEventListener('change', (event) => {
            this.state.qrMembership = event.target.checked;
            this.elements.qrMembership.classList.toggle('qr-hidden', !this.state.qrMembership);
            this.saveSettings();
        });

        this.controls.disableAutoFullscreen.addEventListener('change', (event) => {
            this.state.disableAutoFullscreen = event.target.checked;
            this.saveSettings();
        });
    }

    bindButtons() {
        this.elements.pausePetalsButton.addEventListener('click', () => {
            this.state.isPetalsPaused = !this.state.isPetalsPaused;
            this.syncPauseStates();
            this.saveSettings();
        });

        this.elements.pauseBgButton.addEventListener('click', () => {
            this.state.isBgPaused = !this.state.isBgPaused;
            this.syncPauseStates();
            this.saveSettings();
        });

        this.elements.resetDefaultsButton.addEventListener('click', () => this.resetDefaults());

        if (this.elements.closePanelBtn) {
            this.elements.closePanelBtn.addEventListener('click', () => {
                if (this.isControlsPanelVisible()) {
                    this.toggleControlsPanel();
                }
            });
        }

        if (this.elements.hintFullscreenBtn) {
            this.elements.hintFullscreenBtn.addEventListener('click', () => {
                this.elements.fullscreenToggle.click();
                this.elements.keyboardHint.classList.remove('is-visible');
            });
        }

        if (this.elements.btnResetCancel) {
            this.elements.btnResetCancel.addEventListener('click', () => {
                this.hideFactoryResetConfirmation();
            });
        }

        if (this.elements.btnResetConfirm) {
            this.elements.btnResetConfirm.addEventListener('click', () => {
                this.performFactoryReset();
            });
        }

        if (this.elements.hintOptionsBtn) {
            this.elements.hintOptionsBtn.addEventListener('click', () => {
                this.toggleControlsPanel();
                this.elements.keyboardHint.classList.remove('is-visible');
            });
        }

        if (this.elements.hintHelpBtn) {
            this.elements.hintHelpBtn.addEventListener('click', () => {
                if (!this.isControlsPanelVisible()) this.toggleControlsPanel();
                this.openHelp();
                this.elements.keyboardHint.classList.remove('is-visible');
            });
        }

        if (this.elements.cancelFullscreenBtn) {
            this.elements.cancelFullscreenBtn.addEventListener('click', () => {
                this.cancelFullscreenCountdown();
            });
        }
    }

    bindHostManagement() {
        this.elements.addHostButton.addEventListener('click', () => this.openAddHostForm());
        this.elements.addHostCancel.addEventListener('click', () => this.closeAddHostForm());

        this.elements.addHostInput.addEventListener('input', (event) => {
            const hasValue = event.target.value.trim().length > 0;
            this.elements.addHostConfirm.disabled = !hasValue;
            // Clear the error once the user starts correcting their input
            if (hasValue) this.clearAddHostError();
        });

        // Enter key submits the form
        this.elements.addHostInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                if (!this.elements.addHostConfirm.disabled) {
                    this.submitAddHost();
                }
            }
        });

        this.elements.addHostConfirm.addEventListener('click', () => this.submitAddHost());

        this.elements.addedHostsItems.addEventListener('click', (event) => {
            const button = event.target.closest('.btn-remove-host');
            if (!button) {
                return;
            }

            const index = Number.parseInt(button.dataset.index, 10);
            if (Number.isNaN(index)) {
                return;
            }

            const name = this.state.addedHosts[index];

            if (this.hasEverAddedHost() && name) {
                // User mode: send to Recently Removed so the user can undo.
                if (!this.state.removedHosts.includes(name)) {
                    this.state.removedHosts.push(name);
                    this.persistRemovedHosts();
                }
            }

            this.state.addedHosts.splice(index, 1);
            this.persistAddedHosts();
            this.renderHosts();
        });

        this.elements.removedHostsItems.addEventListener('click', (event) => {
            const button = event.target.closest('.btn-put-back-host');
            if (!button) {
                return;
            }

            const name = button.dataset.name;
            if (!name) return;

            this.state.removedHosts = this.state.removedHosts.filter(h => h !== name);
            this.persistRemovedHosts();

            // In user mode, putting back a user-added host restores it to the active list.
            if (this.hasEverAddedHost() && !this.baseHosts.includes(name)) {
                if (!this.state.addedHosts.includes(name)) {
                    this.state.addedHosts.push(name);
                    this.persistAddedHosts();
                }
            }

            this.renderHosts();
        });

        // Note: Escape key logic moved to bindGlobalShortcuts to handle preventDefault correctly
    }

    /**
     * Validates and commits a new host name. Keeps the form open for rapid entry.
     * Shows inline errors for whitespace-only input or duplicate names.
     */
    submitAddHost() {
        const name = this.elements.addHostInput.value.trim();

        // Should not normally be reached (button is disabled), but guard anyway
        if (!name) return;

        // Check if name already exists (case-insensitive, covers base + added hosts)
        if (this.isDuplicateHost(name)) {
            const isRemoved = this.state.removedHosts.some(
                h => h.trim().toLowerCase() === name.toLowerCase()
            );
            const msg = isRemoved
                ? `"${name}" is in the Recently Removed list — use "Put Back" to restore them.`
                : `"${name}" is already in the host list.`;
            this.showAddHostError(msg);
            return;
        }

        this.state.addedHosts.push(name);
        this.persistAddedHosts();

        // Set the irreversible threshold: once any host is added, sample names retire permanently.
        if (!this.hasEverAddedHost()) {
            localStorage.setItem(STORAGE_KEYS.hasEverAddedHost, 'true');
        }

        this.renderHosts();

        // Keep the form open and ready for the next name
        this.clearAddHostError();
        this.elements.addHostInput.value = '';
        this.elements.addHostConfirm.disabled = true;
        this.elements.addHostInput.focus();
    }

    /**
     * Returns true if `name` already exists among all active or removed base hosts
     * and any dynamically added hosts (case-insensitive).
     */
    isDuplicateHost(name) {
        const normalized = name.trim().toLowerCase();
        const allKnown = [
            ...this.baseHosts,
            ...this.state.addedHosts,
            ...this.state.removedHosts,
        ];
        return allKnown.some(h => h.trim().toLowerCase() === normalized);
    }

    showAddHostError(message) {
        const el = this.elements.addHostError;
        if (!el) return;
        el.textContent = message;
        el.classList.remove('is-hidden');

        // Shake the input to draw attention
        const input = this.elements.addHostInput;
        input.classList.remove('text-input--error');
        // Force reflow so the animation re-triggers if shown twice in a row
        void input.offsetWidth;
        input.classList.add('text-input--error');
        input.addEventListener('animationend', () => {
            input.classList.remove('text-input--error');
        }, { once: true });
    }

    clearAddHostError() {
        const el = this.elements.addHostError;
        if (!el) return;
        el.textContent = '';
        el.classList.add('is-hidden');
        this.elements.addHostInput.classList.remove('text-input--error');
    }

    bindFullscreenControls() {
        this.elements.fullscreenToggle.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === 'Return' || event.key === ' ') {
                event.preventDefault();
            }
        });

        this.elements.fullscreenToggle.addEventListener('click', async () => {
            if (this.elements.fullscreenToggle.checked) {
                localStorage.setItem(STORAGE_KEYS.fullscreenIntent, 'true');
                await this.requestWakeLock();
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen().catch(console.warn);
                }
                return;
            }

            localStorage.setItem(STORAGE_KEYS.fullscreenIntent, 'false');
            if (document.fullscreenElement) {
                await document.exitFullscreen().catch(console.warn);
            }
            this.releaseWakeLock();
        });

        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                this.state.fullscreenStartTime = Date.now();
                this.state.totalFullscreenSeconds = 0;
                this.body.classList.add('is-fullscreen');
                this.updateFullscreenDisplay(true);
                if (this.elements.fullscreenLabel) {
                    this.elements.fullscreenLabel.textContent = 'Fullscreen';
                }
                this.cancelFullscreenCountdown(false);
                return;
            }

            if (this.state.fullscreenStartTime) {
                this.state.totalFullscreenSeconds = Math.floor(
                    (Date.now() - this.state.fullscreenStartTime) / 1000
                );
                this.state.fullscreenStartTime = null;
            }

            this.elements.fullscreenToggle.checked = false;
            this.body.classList.remove('is-fullscreen');
            this.updateFullscreenDisplay(false);
            if (this.elements.fullscreenLabel) {
                this.elements.fullscreenLabel.textContent = '[F]ullscreen';
            }
            this.releaseWakeLock();
            localStorage.setItem(STORAGE_KEYS.fullscreenIntent, 'false');
        });
    }

    updateFullscreenDisplay(isActive) {
        const el = this.elements.timer;

        if (isActive) {
            el.classList.remove('is-dimmed');
        } else {
            el.classList.add('is-dimmed');
        }
    }

    toggleControlsPanel() {
        const panel = this.elements.controlsPanel;
        const isDismissed = panel.classList.contains('is-dismissed');

        if (isDismissed) {
            // If it was auto-dismissed, just bring it back
            this.resetInactivityTimer();
            if (this.elements.keyboardHint) {
                this.elements.keyboardHint.classList.remove('is-visible');
            }
            return;
        }

        const isVisible = panel.classList.toggle('is-visible');

        if (isVisible) {
            this.resetInactivityTimer();
            if (this.elements.keyboardHint) {
                this.elements.keyboardHint.classList.remove('is-visible');
            }
        } else {
            this.clearInactivityTimers();
            // Ensure classes are removed when manually closed
            panel.classList.remove('is-dimmed');
            panel.classList.remove('is-dismissed');
        }
    }

    bindPanelInactivity() {
        const panel = this.elements.controlsPanel;

        // Reset timer on any interaction within the panel
        ['mouseenter', 'mousemove', 'mousedown', 'keydown', 'input', 'change'].forEach(event => {
            panel.addEventListener(event, () => {
                if (!panel.classList.contains('is-dismissed')) {
                    this.resetInactivityTimer();
                }
            });
        });
    }

    bindOutsideClickDismiss() {
        document.addEventListener('pointerdown', (event) => {
            if (!this.isControlsPanelVisible()) return;

            const panel = this.elements.controlsPanel;

            // If the click is inside the panel, do nothing
            if (panel.contains(event.target)) return;

            // Otherwise dismiss the panel completely
            if (panel.classList.contains('is-dismissed')) {
                panel.classList.remove('is-visible', 'is-dimmed', 'is-dismissed');
                this.clearInactivityTimers();
            } else {
                this.toggleControlsPanel();
            }
        });
    }

    resetInactivityTimer() {
        this.clearInactivityTimers();

        const panel = this.elements.controlsPanel;

        // Revert to primary style
        panel.classList.remove('is-dimmed');
        panel.classList.remove('is-dismissed');

        if (!this.isControlsPanelVisible()) return;

        // 30 seconds to dim
        this.inactivityTimer = setTimeout(() => {
            panel.classList.add('is-dimmed');

            // Another 30 seconds to dismiss entirely
            this.dismissTimer = setTimeout(() => {
                panel.classList.add('is-dismissed');
                // Optional: actually remove is-visible so state is 'off'
                // panel.classList.remove('is-visible');
            }, 30000);
        }, 30000);
    }

    clearInactivityTimers() {
        if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
        if (this.dismissTimer) clearTimeout(this.dismissTimer);
        this.inactivityTimer = null;
        this.dismissTimer = null;
    }

    isControlsPanelVisible() {
        return this.elements.controlsPanel.classList.contains('is-visible');
    }

    isTextInput(target) {
        return (target.tagName === 'INPUT' && (target.type === 'text' || target.type === 'search')) || target.tagName === 'TEXTAREA';
    }

    applyHideUiState(isHidden) {
        const affectedControls = [
            { checkbox: this.controls.hideLogo, label: this.controlLabels.hideLogo, checkedWhenHidden: true },
            { checkbox: this.controls.hideDate, label: this.controlLabels.hideDate, checkedWhenHidden: true },
            { checkbox: this.controls.hideTitle, label: this.controlLabels.hideTitle, checkedWhenHidden: true },
            { checkbox: this.controls.hideHost, label: this.controlLabels.hideHost, checkedWhenHidden: true }
        ];

        this.body.classList.toggle('ui-hidden', isHidden);

        affectedControls.forEach(({ checkbox, label }) => {
            checkbox.disabled = isHidden;
            label.classList.toggle('disabled', isHidden);
        });
    }



    checkPersistentFullscreen() {
        if (localStorage.getItem(STORAGE_KEYS.fullscreenIntent) !== 'true') {
            return;
        }

        if (this.state.disableAutoFullscreen) {
            return;
        }

        const triggerCountdown = () => {
            this.startFullscreenCountdown();
        };

        window.addEventListener('click', triggerCountdown, { once: true });
    }

    startFullscreenCountdown() {
        if (!this.elements.fullscreenCountdown) return;

        this.elements.fullscreenCountdown.classList.remove('is-hidden');
        let seconds = 3;
        this.elements.countdownNumber.textContent = seconds;

        this.fullscreenCountdownTimer = setInterval(() => {
            seconds--;
            this.elements.countdownNumber.textContent = seconds;

            if (seconds <= 0) {
                clearInterval(this.fullscreenCountdownTimer);
                this.elements.fullscreenCountdown.classList.add('is-hidden');

                // Try to trigger fullscreen. 
                // Note: This might fail if the user gesture has expired.
                if (!this.elements.fullscreenToggle.checked) {
                    this.elements.fullscreenToggle.click();
                }
            }
        }, 1000);
    }

    cancelFullscreenCountdown(clearIntent = true) {
        if (this.fullscreenCountdownTimer) {
            clearInterval(this.fullscreenCountdownTimer);
            this.fullscreenCountdownTimer = null;
        }
        if (this.elements.fullscreenCountdown) {
            this.elements.fullscreenCountdown.classList.add('is-hidden');
        }

        if (clearIntent) {
            localStorage.setItem(STORAGE_KEYS.fullscreenIntent, 'false');
        }
    }

    hasEverAddedHost() {
        return !!localStorage.getItem(STORAGE_KEYS.hasEverAddedHost);
    }

    renderHosts() {
        let allHosts;

        if (this.hasEverAddedHost()) {
            // User mode: sample names are permanently retired. Show only user-added hosts.
            allHosts = [...this.state.addedHosts].sort((left, right) =>
                this.getHostSortKey(left).localeCompare(this.getHostSortKey(right))
            );
        } else {
            // Sample mode: show base hosts (minus hold-removed) + any added hosts.
            const activeBaseHosts = this.baseHosts.filter(name => !this.state.removedHosts.includes(name));
            allHosts = [...activeBaseHosts, ...this.state.addedHosts].sort((left, right) =>
                this.getHostSortKey(left).localeCompare(this.getHostSortKey(right))
            );
        }

        this.elements.hostsList.replaceChildren(
            ...allHosts.map((name) => {
                const host = document.createElement('span');
                host.textContent = name;
                this.bindHostHold(host, name);
                return host;
            })
        );

        this.renderAddedHosts();
        this.renderRemovedHosts();

        this.updateEmptyHint(allHosts.length === 0);

        requestAnimationFrame(() => {
            this.optimizeLayouts();
        });
    }

    updateEmptyHint(isEmpty) {
        if (!this.elements.hostsEmptyHint) return;

        // Clear any existing timer
        if (this.state.emptyHintTimer) {
            clearTimeout(this.state.emptyHintTimer);
            this.state.emptyHintTimer = null;
        }

        if (isEmpty && this.hasEverAddedHost()) {
            // If empty and in user mode, wait 4s before showing the hint
            this.state.emptyHintTimer = setTimeout(() => {
                this.elements.hostsEmptyHint.classList.remove('is-hidden');
                this.state.emptyHintTimer = null;
            }, 3000);
        } else {
            // Hide immediately if not empty or not in user mode
            this.elements.hostsEmptyHint.classList.add('is-hidden');
        }
    }

    getHostSortKey(name) {
        const significantParts = name
            .trim()
            .split(/\s+/)
            .filter((part) => !TITLE_FILTER_WORDS.has(part.toLowerCase()));

        if (significantParts.length === 0) {
            return name.toLowerCase();
        }

        return significantParts.at(-1).toLowerCase();
    }

    renderAddedHosts() {
        if (this.state.addedHosts.length === 0) {
            this.elements.addedHostsList.classList.add('is-hidden');
            this.elements.addedHostsItems.replaceChildren();
            this.updateFocusableElements();
            return;
        }

        const rows = this.state.addedHosts.map((name, index) => {
            const row = document.createElement('div');
            row.className = 'added-host-row';

            const label = document.createElement('span');
            label.className = 'added-host-name';
            label.textContent = name;

            const button = document.createElement('button');
            button.className = 'btn-remove-host';
            button.dataset.index = String(index);
            button.type = 'button';
            button.textContent = 'Remove';

            row.append(label, button);
            return row;
        });

        this.elements.addedHostsItems.replaceChildren(...rows);
        // In user mode the section is always labelled "Your Hosts"; hide the
        // section header only when the list is empty (handled above).
        this.elements.addedHostsList.classList.remove('is-hidden');
        this.updateFocusableElements();
    }

    renderRemovedHosts() {
        // In user mode, Recently Removed only shows user-added names (never base/sample names).
        const displayedRemoved = this.hasEverAddedHost()
            ? this.state.removedHosts.filter(name => !this.baseHosts.includes(name))
            : this.state.removedHosts;

        if (displayedRemoved.length === 0) {
            this.elements.removedHostsList.classList.add('is-hidden');
            this.elements.removedHostsItems.replaceChildren();
            this.updateFocusableElements();
            return;
        }

        const rows = displayedRemoved.map((name) => {
            const row = document.createElement('div');
            row.className = 'added-host-row';

            const label = document.createElement('span');
            label.className = 'added-host-name';
            label.textContent = name;

            const button = document.createElement('button');
            button.className = 'btn-put-back-host';
            button.dataset.name = name;
            button.type = 'button';
            button.textContent = 'Put Back';

            row.append(label, button);
            return row;
        });

        this.elements.removedHostsItems.replaceChildren(...rows);
        this.elements.removedHostsList.classList.remove('is-hidden');
        this.updateFocusableElements();
    }

    bindHostHold(element, name) {
        let holdTimer = null;

        const startHold = (e) => {
            if (e.button !== undefined && e.button !== 0) return; // Only left click

            element.style.transition = 'transform 2s ease-out';
            element.style.transform = 'scale(1.08)';

            holdTimer = setTimeout(() => {
                element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                element.style.opacity = '0';
                element.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    this.removeHost(name);
                }, 300);
            }, 2000);
        };

        const cancelHold = () => {
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;

                element.style.transition = 'transform 0.3s ease';
                element.style.transform = '';
            }
        };

        element.addEventListener('pointerdown', startHold);
        element.addEventListener('pointerup', cancelHold);
        element.addEventListener('pointercancel', cancelHold);
        element.addEventListener('pointerleave', cancelHold);
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        element.style.userSelect = 'none';
        element.style.cursor = 'default';
    }

    removeHost(name) {
        if (this.baseHosts.includes(name)) {
            if (!this.hasEverAddedHost() && !this.state.removedHosts.includes(name)) {
                // Sample mode only: track removed base hosts so they can be put back.
                this.state.removedHosts.push(name);
                this.persistRemovedHosts();
            }
            // User mode: base/sample hosts aren't displayed — nothing to track.
        } else {
            // It's a user-added host.
            if (this.hasEverAddedHost()) {
                // User mode: move to Recently Removed for undo capability.
                if (!this.state.removedHosts.includes(name)) {
                    this.state.removedHosts.push(name);
                    this.persistRemovedHosts();
                }
            }
            this.state.addedHosts = this.state.addedHosts.filter(h => h !== name);
            this.persistAddedHosts();
        }
        this.renderHosts();
    }

    bindSlider(id, valueId, callback) {
        const slider = document.getElementById(id);
        const display = document.getElementById(valueId);
        let rafId = null;

        const startSlide = () => {
            this.body.classList.add('is-sliding');
        };

        slider.addEventListener('pointerdown', startSlide);

        slider.addEventListener('input', (event) => {
            const value = event.target.value;

            // Throttle UI updates to requestAnimationFrame for 60fps stability
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const result = callback(value);
                display.textContent = result ?? value;
                rafId = null;
            });
        });

        // Save settings and restore transitions only when sliding finishes
        const endSlide = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            this.body.classList.remove('is-sliding');
            this.saveSettings();
        };

        slider.addEventListener('change', endSlide);
        slider.addEventListener('pointerup', endSlide);
        slider.addEventListener('pointercancel', endSlide);
    }

    openAddHostForm() {
        this.elements.addHostForm.classList.remove('is-hidden');
        this.elements.addHostButton.classList.add('is-hidden');
        this.clearAddHostError();
        this.elements.addHostInput.focus();
        this.updateFocusableElements();
        this.currentIndex = this.focusableElements.indexOf(this.elements.addHostInput);
        this.applyKeyboardFocus();
    }

    closeAddHostForm() {
        this.elements.addHostForm.classList.add('is-hidden');
        this.elements.addHostButton.classList.remove('is-hidden');
        this.elements.addHostInput.value = '';
        this.elements.addHostConfirm.disabled = true;
        this.clearAddHostError();
        this.updateFocusableElements();
    }

    isAddHostFormOpen() {
        return !this.elements.addHostForm.classList.contains('is-hidden');
    }

    isHostManagementOpen() {
        return this.elements.hostManagementDetails?.open ?? false;
    }

    isCustomizeOpen() {
        return this.elements.appearanceDetails?.open ?? false;
    }

    openCustomize() {
        const details = this.elements.appearanceDetails;
        if (!details || details.open) {
            return;
        }

        details.open = true;
        this.updateFocusableElements();
        this.currentIndex = this.focusableElements.indexOf(this.elements.advancedSummary);
        this.applyKeyboardFocus();
    }

    closeCustomize() {
        const details = this.elements.appearanceDetails;
        if (!details || !details.open) {
            return;
        }

        details.open = false;
        this.updateFocusableElements();
        this.currentIndex = this.focusableElements.indexOf(this.elements.advancedSummary);
        this.applyKeyboardFocus();
    }

    openHostManagement() {
        const details = this.elements.hostManagementDetails;
        if (!details || details.open) return;

        details.open = true;
        this.openAddHostForm();
        this.updateFocusableElements();
        this.currentIndex = this.focusableElements.indexOf(this.elements.addHostInput);
        this.applyKeyboardFocus();
    }

    closeHostManagement() {
        // Also close the add form if it was open inside
        if (this.isAddHostFormOpen()) {
            this.closeAddHostForm();
        }
        const details = this.elements.hostManagementDetails;
        if (!details || !details.open) return;

        details.open = false;
        this.updateFocusableElements();
        this.currentIndex = this.focusableElements.indexOf(this.elements.hostManagementSummary);
        this.applyKeyboardFocus();
    }

    toggleAddHostShortcut() {
        // [A] toggles the host management panel.
        if (this.isHostManagementOpen()) {
            this.closeHostManagement();
            return;
        }

        this.openHostManagement();
    }

    toggleCustomizeShortcut() {
        if (this.isCustomizeOpen()) {
            this.closeCustomize();
            return;
        }

        this.openCustomize();
    }

    updateFocusableElements() {
        const isCustomizeOpen = this.isCustomizeOpen();
        const customizeControls = [
            'slider-max-petals',
            'slider-gust-freq',
            'slider-fall-speed',
            'slider-tumble-speed',
            'slider-gust-strength',
            'btn-pause-petals',
            'btn-pause-bg',
            'slider-host-text-size',
            'slider-host-max-width',
            'slider-backdrop-opacity',
            'slider-inset-v',
            'slider-inset-h',
            'check-hide-ui',
            'check-hide-logo',
            'check-hide-title',
            'check-hide-date',
            'check-hide-host',
            'check-qr-soiree',
            'check-qr-membership',
            'check-hide-border',
            'btn-reset-defaults'
        ];

        const hostControls = [
            'btn-show-add-host',
            'input-host-title',
            'btn-cancel-add-host',
            'btn-confirm-add-host'
        ];

        const potential = [
            this.elements.advancedSummary,
            this.elements.hostManagementSummary,
            ...customizeControls.map((id) => document.getElementById(id)),
            ...hostControls.map((id) => document.getElementById(id)),
            ...document.querySelectorAll('.btn-remove-host'),
            ...document.querySelectorAll('.btn-put-back-host')
        ];

        this.focusableElements = potential.filter((element) => {
            if (!element) {
                return false;
            }

            if (element.classList.contains('is-hidden')) {
                return false;
            }

            if (element.closest('.is-hidden')) {
                return false;
            }

            if (isCustomizeOpen) {
                if (element === this.elements.addHostButton || this.elements.addedHostsList?.contains(element)) {
                    return false;
                }
            }

            // When Add Host form is open, lock keyboard focus to only that form
            if (this.isAddHostFormOpen()) {
                const isHostFormControl =
                    element === this.elements.addHostInput ||
                    element === this.elements.addHostCancel ||
                    element === this.elements.addHostConfirm;
                if (!isHostFormControl) {
                    return false;
                }
            }

            if (element.tagName === 'SUMMARY') {
                return true;
            }

            const details = element.closest('details');
            return !(details && !details.open);
        });

        if (this.currentIndex >= this.focusableElements.length) {
            this.currentIndex = this.focusableElements.length > 0 ? this.focusableElements.length - 1 : -1;
        }
    }

    initKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            if (!this.isControlsPanelVisible()) {
                return;
            }

            const isAddMode = this.isAddHostFormOpen();

            if (isAddMode) {
                if (event.key === 'Enter') {
                    if (!this.elements.addHostConfirm.disabled) {
                        this.elements.addHostConfirm.click();
                        event.preventDefault();
                    }
                    return;
                }

                if (event.target.id === 'input-host-title') {
                    return;
                }
            }

            this.updateFocusableElements();

            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                if (isAddMode) {
                    return;
                }

                event.preventDefault();
                if (this.currentIndex === -1) {
                    this.currentIndex = 0;
                } else {
                    this.currentIndex += event.key === 'ArrowDown' ? 1 : -1;
                    if (this.currentIndex < 0) {
                        this.currentIndex = this.focusableElements.length - 1;
                    }
                    if (this.currentIndex >= this.focusableElements.length) {
                        this.currentIndex = 0;
                    }
                }

                this.state.isKeyboardUser = true;
                this.applyKeyboardFocus();
            }

            if (this.currentIndex === -1) {
                return;
            }

            const activeElement = this.focusableElements[this.currentIndex];

            if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && this.isRangeInput(activeElement)) {
                event.preventDefault();
                const step = Number.parseFloat(activeElement.step) || 1;
                const currentValue = Number.parseFloat(activeElement.value);
                const nextValue = event.key === 'ArrowRight' ? currentValue + step : currentValue - step;
                activeElement.value = String(nextValue);
                activeElement.dispatchEvent(new Event('input'));
            }

            if (event.key === ' ' || event.key === 'Enter') {
                if (event.key === ' ' && this.isTextInput(event.target)) {
                    return;
                }

                event.preventDefault();
                if (activeElement.id === 'check-fullscreen') {
                    return;
                }

                if (this.isClickableKeyboardTarget(activeElement)) {
                    activeElement.click();
                    if (activeElement.tagName === 'SUMMARY') {
                        setTimeout(() => {
                            this.updateFocusableElements();
                            this.applyKeyboardFocus();
                        }, 50);
                    }
                }
            }
        });

        document.addEventListener('click', (event) => {
            this.updateFocusableElements();
            const directIndex = this.focusableElements.indexOf(event.target);
            if (directIndex !== -1) {
                this.currentIndex = directIndex;
                this.applyKeyboardFocus();
                return;
            }

            const checkbox = event.target.closest('.check-control, .toggle-control')?.querySelector('input[type="checkbox"]');
            if (!checkbox) {
                return;
            }

            const checkboxIndex = this.focusableElements.indexOf(checkbox);
            if (checkboxIndex !== -1) {
                this.currentIndex = checkboxIndex;
                this.applyKeyboardFocus();
            }
        });
    }

    applyKeyboardFocus() {
        document.querySelectorAll('.keyboard-focused').forEach((element) => {
            element.classList.remove('keyboard-focused');
        });

        if (!this.state.isKeyboardUser) {
            return;
        }

        if (this.currentIndex < 0 || this.currentIndex >= this.focusableElements.length) {
            return;
        }

        const element = this.focusableElements[this.currentIndex];
        if (element.type === 'checkbox') {
            const wrapper = element.closest('.toggle-control') || element.closest('.check-control');
            wrapper?.classList.add('keyboard-focused');
        } else {
            element.classList.add('keyboard-focused');
        }

        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    isRangeInput(element) {
        return element?.tagName === 'INPUT' && element.type === 'range';
    }

    isClickableKeyboardTarget(element) {
        return element?.tagName === 'BUTTON' || element?.tagName === 'SUMMARY' || element?.type === 'checkbox';
    }

    adjustAmbientPetals() {
        const currentCount = this.state.petals.length;
        if (currentCount > this.state.maxPetals) {
            const toRemove = currentCount - this.state.maxPetals;
            for (let index = 0; index < toRemove; index += 1) {
                const petal = this.state.petals.pop();
                petal?.element?.remove();
            }
            return;
        }

        if (currentCount < this.state.maxPetals) {
            const toAdd = this.state.maxPetals - currentCount;
            for (let index = 0; index < toAdd; index += 1) {
                this.state.petals.push(this.createPetal());
            }
        }
    }

    createPetal() {
        const container = this.getRandomLayer();
        const element = document.createElement('div');
        element.className = 'petal';

        const size = Math.random() * 12 + 10;
        const type = this.getRandomPetalType();

        element.style.width = `${size}px`;
        element.style.height = `${size * 1.25}px`;
        element.style.background = `linear-gradient(135deg, ${type.color}, ${type.gradient})`;
        element.style.borderRadius = type.type === 'leaf' ? '50% 0 50% 0' : '50% 10% 50% 10%';

        // Depth of field simulation:
        // Use scale and a fixed 'is-blurred' class for background petals.
        // Static CSS classes are more performant than inline filter styles.
        if (Math.random() > 0.7) {
            element.classList.add('is-blurred');
            element.style.opacity = '0.6';
        }

        container.appendChild(element);

        return {
            element,
            x: Math.random() * 120 - 10,
            y: Math.random() * 140 - 20,
            mass: Math.random() * 0.8 + 0.4,
            aero: Math.random() * 0.5 + 0.5,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 100,
            baseFallSpeed: Math.random() * 15 + 5,
            naturalDrift: (Math.random() - 0.5) * 5,
        };
    }

    getRandomPetalType() {
        const random = Math.random() * 100;
        if (random < 5) {
            return this.petalTypes[3];
        }
        if (random < 25) {
            return this.petalTypes[2];
        }
        if (random < 45) {
            return this.petalTypes[4];
        }
        return Math.random() > 0.5 ? this.petalTypes[0] : this.petalTypes[1];
    }

    getRandomLayer() {
        const random = Math.random() * 100;
        if (random < 15) {
            return this.layers.mid;
        }
        if (random < 65) {
            return this.layers.front;
        }
        return this.layers.back;
    }

    updatePhysics(dt) {
        const windiness = this.state.windiness; // 0 to 1000

        let targetWindSpeed = 0;

        if (this.state.downtimeTimer > 0) {
            this.state.downtimeTimer -= dt;
            // During downtime, wind drops to near zero
            targetWindSpeed = 0.2;
        } else {
            // Intensity scale: 100 is the old 1000. 1000 is comically strong.
            // 0 -> gentle breeze (0.5 vw/s)
            // 100 -> storm (40 vw/s)
            // 1000 -> hurricane (395.5 vw/s)
            targetWindSpeed = 0.5 + windiness * 0.395;

            // Random downtime chance, more frequent at lower windiness
            const downtimeChance = Math.max(0, 0.003 - (windiness / 1000) * 0.003);
            if (Math.random() < downtimeChance) {
                this.state.downtimeTimer = 1.5 + Math.random() * 3.5; // 1.5 to 5s of downtime
            }

            // Randomly trigger a gust occasionally
            if (Math.random() < 0.005 + (windiness / 1000) * 0.02) {
                // Gust intensity scaled up
                this.state.gustForce += Math.random() * (10 + windiness * 0.3);
            }
        }

        // Randomly shift global wind direction (mostly stays prevailing right/left, but can drift)
        if (Math.random() < 0.002) {
            this.state.targetWindDirection = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5);
        }

        // Decay gust smoothly
        this.state.gustForce *= 0.95;

        // Smoothly interpolate current wind to target wind speed
        this.state.currentWind += (targetWindSpeed - this.state.currentWind) * (1 - Math.exp(-dt * 2));

        // Smoothly interpolate wind direction
        this.state.windDirection += (this.state.targetWindDirection - this.state.windDirection) * (1 - Math.exp(-dt * 0.5));

        const totalWind = (this.state.currentWind + this.state.gustForce) * this.state.windDirection;

        this.state.petals.forEach(p => {
            const gravityEffect = p.baseFallSpeed * p.mass * this.state.fallSpeed;

            // Wind pushes them. Lighter petals catch more wind
            const windEffect = totalWind * (p.aero / p.mass);

            p.x += (windEffect + p.naturalDrift) * dt;
            p.y += gravityEffect * dt;

            // Tumbling is affected by speed and tumbleSpeed slider
            const speedFactor = Math.abs(windEffect) / 10 + 1;
            p.rotation += p.rotSpeed * this.state.tumbleSpeed * speedFactor * dt;

            // Screen wrapping
            if (p.y > 110) {
                p.y = -10;
                p.x = Math.random() * 120 - 10;
            } else if (p.y < -20) {
                p.y = 110;
            }

            if (p.x > 110) {
                p.x = -10;
            } else if (p.x < -20) {
                p.x = 110;
            }

            p.element.style.transform = `translate3d(${p.x}vw, ${p.y}vh, 0) rotate(${p.rotation}deg)`;
        });
    }

    startAnimationLoop() {
        const loop = (now) => {
            const dt = Math.min((now - this.state.lastPhysicsTime) / 1000, 0.1);
            this.state.lastPhysicsTime = now;
            this.state.frameCount += 1;

            if (now > this.state.lastFrameTime + 1000) {
                const elapsedMs = now - this.state.lastFrameTime;
                const fps = Math.round((this.state.frameCount * 1000) / elapsedMs);
                this.updateFPS(fps);
                this.state.lastFrameTime = now;
                this.state.frameCount = 0;
                this.elements.timer.textContent = this.formatFullscreenTimer();
            }

            if (!this.state.isPetalsPaused) {
                this.updatePhysics(dt);
            }

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    updateFPS(fps) {
        const el = this.elements.fps;
        el.textContent = String(fps);

        el.classList.remove('fps-good', 'fps-warn', 'fps-bad');

        if (fps >= 60) {
            el.classList.add('fps-good');
        } else if (fps >= 30) {
            el.classList.add('fps-warn');
        } else {
            el.classList.add('fps-bad');
        }
    }

    updateScreenSize() {
        if (!this.elements.screenSize) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.elements.screenSize.textContent = `${w} × ${h}`;
    }

    formatFullscreenTimer() {
        if (this.state.totalFullscreenSeconds === null && !this.state.fullscreenStartTime) {
            return "-:--";
        }

        let elapsed = this.state.totalFullscreenSeconds || 0;
        if (this.state.fullscreenStartTime) {
            elapsed = Math.floor((Date.now() - this.state.fullscreenStartTime) / 1000);
        }
        return `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
    }

    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.state.wakeLock = await navigator.wakeLock.request('screen');

                this.state.wakeLockActive = true;
                this.state.wakeLockMode = 'api';

                this.state.wakeLock.addEventListener('release', () => {
                    this.state.wakeLock = null;
                    this.state.wakeLockActive = false;
                    this.state.wakeLockMode = 'none';
                    this.updateSleepStatus('error');
                });

                this.updateSleepStatus('api');
                return;
            } catch (error) {
                console.warn('WakeLock API failed', error);
            }
        }

        try {
            const video = this.elements.wakeLockVideo;
            if (!video.srcObject) {
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                const context = canvas.getContext('2d');

                this.state.fallbackInterval = window.setInterval(() => {
                    context.fillStyle = `rgb(${Math.random() * 255}, 0, 0)`;
                    context.fillRect(0, 0, 1, 1);
                }, 1000);

                video.srcObject = canvas.captureStream(1);
            }

            await video.play();
            this.state.wakeLockActive = false;
            this.state.wakeLockMode = 'fallback';
            this.updateSleepStatus('fallback');
        } catch {
            this.updateSleepStatus('error');
        }
    }

    startWakeLockHeartbeat() {
        this.state.heartbeatInterval = setInterval(async () => {
            if (
                this.elements.fullscreenToggle.checked &&
                document.fullscreenElement &&
                !this.state.wakeLock
            ) {
                await this.requestWakeLock();
            }
        }, 30000);
    }

    updateSleepStatus(state) {
        const el = this.elements.sleepStatus;

        el.classList.remove('sleep-good', 'sleep-bad');

        if (state === 'api') {
            el.textContent = 'Awake';
            el.classList.add('sleep-good');
        } else if (state === 'fallback') {
            el.textContent = 'Fallback';
            el.classList.add('sleep-good');
        } else if (state === 'error') {
            el.textContent = 'Failed';
            el.classList.add('sleep-bad');
        } else {
            el.textContent = 'Inactive';
        }
    }

    releaseWakeLock() {
        if (this.state.wakeLock) {
            this.state.wakeLock.release();
            this.state.wakeLock = null;
        }

        if (this.state.fallbackInterval) {
            clearInterval(this.state.fallbackInterval);
            this.state.fallbackInterval = null;
        }

        this.elements.wakeLockVideo.pause();
        this.updateSleepStatus('off');
    }

    checkWakeLockSupport() {
        const el = this.elements.wakeLockStatus;
        if (window.isSecureContext) {
            el.textContent = '';
            el.classList.add('status-ok');
            el.classList.remove('status-error');
            return;
        }

        el.textContent = 'Insecure Context (WakeLock may fail)';
        el.classList.add('status-error');
        el.classList.remove('status-ok');
    }

    resetDefaults() {
        // 1. Reset all state values from DEFAULTS (single source of truth)
        Object.keys(DEFAULTS).forEach((key) => {
            this.state[key] = DEFAULTS[key];
        });

        // 2. Do NOT reset persistent user content
        // (host names remain intact by design)

        // 3. Clear runtime-generated petals
        this.state.petals.forEach((p) => p.element?.remove());
        this.state.petals = [];

        // 4. Rebuild system based on reset state
        this.adjustAmbientPetals();

        // 5. Persist reset state
        this.saveSettings();

        // 6. Re-render entire UI from state (single authority)
        this.applyStateToUI();
        // Ensure UI disabled-state system is re-synced after reset
        this.applyHideUiState(this.state.hideUi);
    }

    handleFactoryResetKeyDown(event) {
        if (event.repeat) {
            if (this.state.factoryResetStartTime) {
                const elapsed = Date.now() - this.state.factoryResetStartTime;
                const duration = 2000; // 2 seconds hold
                const progress = Math.min((elapsed / duration) * 100, 100);

                if (this.elements.factoryResetProgress) {
                    this.elements.factoryResetProgress.style.width = `${progress}%`;
                }

                if (elapsed >= duration) {
                    this.showFactoryResetConfirmation();
                }
            }
            return;
        }

        // Don't start holding if modal is already open
        if (!this.elements.factoryResetModal.classList.contains('is-hidden')) return;

        this.state.factoryResetStartTime = Date.now();
        if (this.elements.factoryResetOverlay) {
            this.elements.factoryResetOverlay.classList.remove('is-hidden');
        }
        if (this.elements.factoryResetProgress) {
            this.elements.factoryResetProgress.style.width = '0%';
        }
    }

    handleFactoryResetKeyUp() {
        this.state.factoryResetStartTime = null;
        if (this.elements.factoryResetOverlay) {
            this.elements.factoryResetOverlay.classList.add('is-hidden');
        }
        if (this.elements.factoryResetProgress) {
            this.elements.factoryResetProgress.style.width = '0%';
        }
    }

    showFactoryResetConfirmation() {
        this.state.factoryResetStartTime = null; // Stop holding logic
        this.elements.factoryResetOverlay?.classList.add('is-hidden');
        this.elements.btnResetCancel?.classList.remove('is-hidden');
        this.elements.factoryResetModal?.classList.remove('is-hidden');
    }

    hideFactoryResetConfirmation() {
        this.elements.factoryResetModal?.classList.add('is-hidden');
    }

    performFactoryReset() {
        // Clear all local storage keys
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });

        if (this.elements.btnResetCancel) {
            this.elements.btnResetCancel.classList.add('is-hidden');
        }

        if (this.elements.btnResetConfirm) {
            this.elements.btnResetConfirm.textContent = 'Resetting...';
            this.elements.btnResetConfirm.classList.add('button--solid-gold');
        }

        const modalBox = this.elements.factoryResetModal?.querySelector('.reset-modal-box');
        if (modalBox) {
            const text = modalBox.querySelector('p');
            if (text) {
                text.textContent = 'Clearing all data and refreshing...';
                text.style.color = 'var(--color-accent)';
            }
        }

        setTimeout(() => {
            window.location.reload();
        }, 800);
    }

    autoGrowTextarea(el) {
        if (!el || el.tagName !== 'TEXTAREA') return;
        el.style.height = '40px'; // Reset to 1 line height
        const newHeight = Math.min(el.scrollHeight, 64); // Cap at max-height
        el.style.height = newHeight + 'px';
    }

    // ─── Poster Text ────────────────────────────────────────────────────────────

    loadPosterText() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.posterText) || 'null');
            return { ...POSTER_TEXT_DEFAULTS, ...(stored || {}) };
        } catch {
            return { ...POSTER_TEXT_DEFAULTS };
        }
    }

    savePosterText() {
        localStorage.setItem(STORAGE_KEYS.posterText, JSON.stringify(this.state.posterText));
    }

    applyPosterText() {
        const pt = this.state.posterText;

        // Logo
        const mode = pt.logoMode || 'image';
        const logoImg = this.elements.logoImg;
        const logoTextEl = this.elements.logoTextEl;
        const logoBanner = this.elements.logoBanner;

        if (mode === 'image') {
            if (logoImg && pt.logoImageData) {
                logoImg.src = pt.logoImageData;
                logoImg.classList.remove('is-hidden');
            } else {
                logoImg?.classList.add('is-hidden');
            }
            logoTextEl?.classList.add('is-hidden');
            logoBanner?.classList.remove('is-hidden');
        } else if (mode === 'text') {
            logoImg?.classList.add('is-hidden');
            if (logoTextEl) {
                logoTextEl.textContent = pt.logoText || '';
                logoTextEl.classList.remove('is-hidden');
            }
            logoBanner?.classList.remove('is-hidden');
        } else { // hidden
            logoBanner?.classList.add('is-hidden');
        }

        // Hosts title
        if (this.elements.hostsTitleEl) {
            this.elements.hostsTitleEl.textContent = pt.hostsTitle || '';
            // Use visibility so layout is preserved when title is cleared
            this.elements.hostsTitleEl.style.opacity = pt.hostsTitle ? '' : '0';
            this.elements.hostsTitleEl.style.pointerEvents = pt.hostsTitle ? '' : 'none';
        }

        // Event footer fields
        const setText = (el, value) => {
            if (!el) return;
            el.textContent = value || '';
            el.classList.toggle('is-hidden', !value);
        };
        setText(this.elements.eventTopLabelEl, pt.eventTopLabel);
        setText(this.elements.eventTitleEl, pt.eventTitle);
        setText(this.elements.eventSubtitleEl, pt.eventSubtitle);
        setText(this.elements.eventDateEl, pt.eventDate);

        // QR images — update src but don't change visibility (that's handled by qrSoiree/qrMembership toggles)
        if (this.elements.qrSoireeImg) {
            if (pt.qrLeftData) {
                this.elements.qrSoireeImg.src = pt.qrLeftData;
            } else {
                this.elements.qrSoireeImg.src = '';
            }
        }
        if (this.elements.qrMembershipImg) {
            if (pt.qrRightData) {
                this.elements.qrMembershipImg.src = pt.qrRightData;
            } else {
                this.elements.qrMembershipImg.src = '';
            }
        }

        // Sync panel inputs
        this.syncEditPanelInputs();

        // Re-run layout after text changes
        requestAnimationFrame(() => this.optimizeLayouts());
    }

    syncEditPanelInputs() {
        const pt = this.state.posterText;

        // Logo mode radios
        this.elements.logoModeRadios?.forEach(r => {
            r.checked = (r.value === pt.logoMode);
        });
        this.applyLogoModeUI(pt.logoMode);

        // Logo image preview
        if (pt.logoImageData) {
            if (this.elements.logoImgThumb) this.elements.logoImgThumb.src = pt.logoImageData;
            this.elements.logoImgPreview?.classList.remove('is-hidden');
        } else {
            this.elements.logoImgPreview?.classList.add('is-hidden');
        }

        // Logo text
        if (this.elements.inputLogoText) {
            this.elements.inputLogoText.value = pt.logoText || '';
            this.autoGrowTextarea(this.elements.inputLogoText);
        }

        // Hosts title
        if (this.elements.inputHostsTitle) this.elements.inputHostsTitle.value = pt.hostsTitle || '';

        // Event fields
        if (this.elements.inputEventTopLabel) this.elements.inputEventTopLabel.value = pt.eventTopLabel || '';
        if (this.elements.inputEventTitle) this.elements.inputEventTitle.value = pt.eventTitle || '';
        if (this.elements.inputEventSubtitle) this.elements.inputEventSubtitle.value = pt.eventSubtitle || '';
        if (this.elements.inputEventDate) this.elements.inputEventDate.value = pt.eventDate || '';

        // QR previews
        if (pt.qrLeftData) {
            if (this.elements.qrLeftThumb) this.elements.qrLeftThumb.src = pt.qrLeftData;
            this.elements.qrLeftPreview?.classList.remove('is-hidden');
        } else {
            this.elements.qrLeftPreview?.classList.add('is-hidden');
        }
        if (pt.qrRightData) {
            if (this.elements.qrRightThumb) this.elements.qrRightThumb.src = pt.qrRightData;
            this.elements.qrRightPreview?.classList.remove('is-hidden');
        } else {
            this.elements.qrRightPreview?.classList.add('is-hidden');
        }
    }

    applyLogoModeUI(mode) {
        const showImage = mode === 'image';
        const showText = mode === 'text';
        this.elements.logoImageControls?.classList.toggle('is-hidden', !showImage);
        this.elements.logoTextControls?.classList.toggle('is-hidden', !showText);
    }

    bindAccordionBehavior() {
        const detailsElements = [
            this.elements.appearanceDetails,
            this.elements.editPosterDetails,
            this.elements.hostManagementDetails,
            this.elements.helpDetails
        ];

        detailsElements.forEach(details => {
            if (!details) return;
            details.addEventListener('toggle', () => {
                if (details.open) {
                    detailsElements.forEach(other => {
                        if (other && other !== details && other.open) {
                            other.open = false;
                        }
                    });
                    // Reset inactivity timer when a section is opened
                    this.resetInactivityTimer();
                }
                
                const anyOpen = detailsElements.some(el => el?.open);
                this.elements.controlsPanel.classList.toggle('has-open-section', anyOpen);
            });
        });
    }

    bindEditPoster() {
        // Logo mode radio changes
        this.elements.logoModeRadios?.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (!e.target.checked) return;
                this.state.posterText.logoMode = e.target.value;
                this.savePosterText();
                this.applyPosterText();
            });
        });

        // Upload logo image
        this.elements.btnUploadLogo?.addEventListener('click', () => {
            this.elements.inputLogoFile?.click();
        });
        this.elements.inputLogoFile?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            this.readFileAsDataURL(file, (data) => {
                this.state.posterText.logoImageData = data;
                this.savePosterText();
                this.applyPosterText();
            });
            e.target.value = '';
        });
        this.elements.btnClearLogoImg?.addEventListener('click', () => {
            this.state.posterText.logoImageData = null;
            if (this.elements.inputLogoFile) this.elements.inputLogoFile.value = '';
            // When clearing image, default back to text mode
            this.state.posterText.logoMode = 'text';
            this.savePosterText();
            this.applyPosterText();
        });

        // Logo text input
        this.elements.inputLogoText?.addEventListener('input', (e) => {
            this.autoGrowTextarea(e.target);
            this.state.posterText.logoText = e.target.value;
            this.savePosterText();
            this.applyPosterText();
        });
        this.elements.btnClearLogoText?.addEventListener('click', () => {
            this.state.posterText.logoText = '';
            if (this.elements.inputLogoText) {
                this.elements.inputLogoText.value = '';
                this.autoGrowTextarea(this.elements.inputLogoText);
            }
            this.savePosterText();
            this.applyPosterText();
        });

        // Hosts title
        this.elements.inputHostsTitle?.addEventListener('input', (e) => {
            this.state.posterText.hostsTitle = e.target.value;
            this.savePosterText();
            this.applyPosterText();
        });
        this.elements.btnClearHostsTitle?.addEventListener('click', () => {
            this.state.posterText.hostsTitle = '';
            if (this.elements.inputHostsTitle) this.elements.inputHostsTitle.value = '';
            this.savePosterText();
            this.applyPosterText();
        });

        // Event text fields helper
        const bindTextField = (inputEl, clearBtn, key) => {
            inputEl?.addEventListener('input', (e) => {
                this.state.posterText[key] = e.target.value;
                this.savePosterText();
                this.applyPosterText();
            });
            clearBtn?.addEventListener('click', () => {
                this.state.posterText[key] = '';
                if (inputEl) inputEl.value = '';
                this.savePosterText();
                this.applyPosterText();
            });
        };

        bindTextField(this.elements.inputEventTopLabel, this.elements.btnClearEventTopLabel, 'eventTopLabel');
        bindTextField(this.elements.inputEventTitle, this.elements.btnClearEventTitle, 'eventTitle');
        bindTextField(this.elements.inputEventSubtitle, this.elements.btnClearEventSubtitle, 'eventSubtitle');
        bindTextField(this.elements.inputEventDate, this.elements.btnClearEventDate, 'eventDate');

        // QR Left upload / clear
        this.elements.btnUploadQrLeft?.addEventListener('click', () => {
            this.elements.inputQrLeftFile?.click();
        });
        this.elements.inputQrLeftFile?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            this.readFileAsDataURL(file, (data) => {
                this.state.posterText.qrLeftData = data;
                this.state.qrSoiree = true;
                this.controls.qrSoiree.checked = true;
                this.elements.qrSoiree.classList.remove('qr-hidden');
                this.savePosterText();
                this.saveSettings();
                this.applyPosterText();
            });
            e.target.value = '';
        });
        this.elements.btnClearQrLeft?.addEventListener('click', () => {
            this.state.posterText.qrLeftData = null;
            if (this.elements.inputQrLeftFile) this.elements.inputQrLeftFile.value = '';
            this.state.qrSoiree = false;
            this.controls.qrSoiree.checked = false;
            this.elements.qrSoiree.classList.add('qr-hidden');
            this.savePosterText();
            this.saveSettings();
            this.applyPosterText();
        });

        // QR Right upload / clear
        this.elements.btnUploadQrRight?.addEventListener('click', () => {
            this.elements.inputQrRightFile?.click();
        });
        this.elements.inputQrRightFile?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            this.readFileAsDataURL(file, (data) => {
                this.state.posterText.qrRightData = data;
                this.state.qrMembership = true;
                this.controls.qrMembership.checked = true;
                this.elements.qrMembership.classList.remove('qr-hidden');
                this.savePosterText();
                this.saveSettings();
                this.applyPosterText();
            });
            e.target.value = '';
        });
        this.elements.btnClearQrRight?.addEventListener('click', () => {
            this.state.posterText.qrRightData = null;
            if (this.elements.inputQrRightFile) this.elements.inputQrRightFile.value = '';
            this.state.qrMembership = false;
            this.controls.qrMembership.checked = false;
            this.elements.qrMembership.classList.add('qr-hidden');
            this.savePosterText();
            this.saveSettings();
            this.applyPosterText();
        });
    }

    readFileAsDataURL(file, callback) {
        // Limits for localStorage safety and performance
        const MAX_SIZE = 1.5 * 1024 * 1024; // 1.5MB
        const MAX_RES = 2048; // px

        if (file.size > MAX_SIZE) {
            alert(`Image is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Please use an image under 1.5MB to ensure it can be saved.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            
            // Check resolution
            const img = new Image();
            img.onload = () => {
                if (img.width > MAX_RES || img.height > MAX_RES) {
                    alert(`Image resolution is too high (${img.width}x${img.height}). Please use an image smaller than ${MAX_RES}x${MAX_RES}px.`);
                    return;
                }
                callback(dataUrl);
            };
            img.onerror = () => {
                alert("Could not read image file. Please try a different image.");
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    }

    isEditPosterOpen() {
        return this.elements.editPosterDetails?.open ?? false;
    }

    openEditPoster() {
        const details = this.elements.editPosterDetails;
        if (!details || details.open) return;
        details.open = true;
        this.syncEditPanelInputs();
        this.updateFocusableElements();
        this.currentIndex = this.focusableElements.indexOf(this.elements.editPosterSummary);
        this.applyKeyboardFocus();
    }

    closeEditPoster() {
        const details = this.elements.editPosterDetails;
        if (!details || !details.open) return;
        details.open = false;
        this.updateFocusableElements();
        this.currentIndex = this.focusableElements.indexOf(this.elements.editPosterSummary);
        this.applyKeyboardFocus();
    }

    toggleEditPosterShortcut() {
        if (this.isEditPosterOpen()) {
            this.closeEditPoster();
        } else {
            if (!this.isControlsPanelVisible()) this.toggleControlsPanel();
            this.openEditPoster();
        }
    }

    isHelpOpen() {
        return this.elements.helpDetails?.open ?? false;
    }

    openHelp() {
        const details = this.elements.helpDetails;
        if (!details || details.open) return;
        details.open = true;
        this.updateFocusableElements();
        this.currentIndex = this.focusableElements.indexOf(this.elements.helpSummary);
        this.applyKeyboardFocus();
    }

    closeHelp() {
        const details = this.elements.helpDetails;
        if (!details || !details.open) return;
        details.open = false;
        this.updateFocusableElements();
        this.currentIndex = this.focusableElements.indexOf(this.elements.helpSummary);
        this.applyKeyboardFocus();
    }

    toggleHelpShortcut() {
        if (this.isHelpOpen()) {
            this.closeHelp();
        } else {
            if (!this.isControlsPanelVisible()) this.toggleControlsPanel();
            this.openHelp();
        }
    }
}

window.addEventListener('load', () => {
    window.app = new EventPoster();
});