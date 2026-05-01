/**
 * UIController handles interactions, event listeners, and visibility toggles.
 */
window.UIController = class UIController {
    constructor(poster) {
        this.poster = poster;
        this.currentIndex = -1;
        this.focusableElements = [];
    }

    get state() { return this.poster.state; }
    get elements() { return this.poster.elements; }
    get controls() { return this.poster.controls; }
    get body() { return document.body; }

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
        this.bindThemeSelector();
        this.bindPanelInactivity();
        this.bindOutsideClickDismiss();
        this.bindHoldHotspot();

        window.addEventListener('resize', () => {
            requestAnimationFrame(() => {
                if (this.state.isAppRunning) {
                    this.poster.optimizeLayouts();
                    this.poster.updateScreenSize();
                } else {
                    this.poster.updateMobileScreenSizeInfo();
                }
            });
        });

        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'hidden') {
                this.state.wakeLockActive = false;
                this.poster.updateSleepStatus('error');
                return;
            }
            if (document.visibilityState === 'visible' && this.elements.fullscreenToggle.checked && document.fullscreenElement && !this.state.wakeLock) {
                await this.poster.requestWakeLock();
            }
        });

        if (document.fonts) {
            document.fonts.ready.then(() => {
                requestAnimationFrame(() => this.poster.optimizeLayouts());
            });
        }
    }

    toggleControlsPanel() {
        const panel = this.elements.controlsPanel;
        if (!panel) return;
        const isDismissed = panel.classList.contains('is-dismissed');
        if (isDismissed) {
            this.resetInactivityTimer();
            this.elements.keyboardHint?.classList.remove('is-visible');
            return;
        }
        const isVisible = panel.classList.toggle('is-visible');
        if (isVisible) {
            this.resetInactivityTimer();
            this.elements.keyboardHint?.classList.remove('is-visible');
            this.updateFocusableElements();
        } else {
            this.clearInactivityTimers();
            panel.classList.remove('is-dimmed', 'is-dismissed');
        }
    }

    bindGlobalShortcuts() {
        document.addEventListener('keydown', (event) => {
            const key = event.key;
            if (key === '\\' && !this.isTextInput(event.target)) {
                this.poster.handleFactoryResetKeyDown(event);
                return;
            }
            if (key === 'Escape') {
                let handled = false;
                if (this.poster.isAddHostFormOpen()) {
                    this.poster.closeAddHostForm();
                    handled = true;
                } else if (this.poster.isControlsPanelVisible()) {
                    this.toggleControlsPanel();
                    handled = true;
                }
                if (handled) {
                    event.preventDefault(); event.stopPropagation(); return;
                }
            }
            if (this.isTextInput(event.target)) return;
            const lowerKey = key.toLowerCase();
            if (lowerKey === 'q' && !event.repeat) { this.toggleControlsPanel(); return; }
            if (lowerKey === 'e' && !event.repeat) { this.poster.toggleEditPosterShortcut(); event.preventDefault(); return; }
            if ((key === '?' || key === '/') && !event.repeat) { this.poster.toggleHelpShortcut(); event.preventDefault(); return; }
            if (lowerKey === 'f' && !event.repeat) { if (!document.fullscreenElement) this.elements.fullscreenToggle.click(); return; }
            if (event.code === 'KeyS' && event.altKey) { event.preventDefault(); this.poster.reloadStyles(); return; }
            if (!this.poster.isControlsPanelVisible() || event.repeat) return;
            if (lowerKey === 'a') { this.poster.toggleAddHostShortcut(); event.preventDefault(); }
            if (lowerKey === 'c') { this.poster.toggleCustomizeShortcut(); event.preventDefault(); }
            if (lowerKey === 'r') { if (this.poster.isCustomizeOpen()) { event.preventDefault(); this.poster.resetDefaults(); } }
        });
        document.addEventListener('keyup', (event) => { if (event.key === '\\') this.poster.handleFactoryResetKeyUp(); });
    }

    isTextInput(target) {
        if (!target) return false;
        return (target.tagName === 'INPUT' && (target.type === 'text' || target.type === 'search')) || 
               target.tagName === 'TEXTAREA' || target.isContentEditable;
    }

    bindSliders() {
        const bind = (id, valId, callback) => {
            const slider = document.getElementById(id);
            const display = document.getElementById(valId);
            if (!slider) return;
            let rafId = null;
            const startSlide = () => this.body.classList.add('is-sliding');
            const endSlide = () => { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } this.body.classList.remove('is-sliding'); this.poster.saveSettings(); };
            slider.addEventListener('pointerdown', startSlide);
            slider.addEventListener('input', (e) => {
                const v = e.target.value;
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                    const label = callback(v);
                    if (display) display.textContent = label ?? v;
                    rafId = null;
                });
            });
            slider.addEventListener('change', endSlide);
            slider.addEventListener('pointerup', endSlide);
            slider.addEventListener('pointercancel', endSlide);
        };
        bind('slider-max-petals', 'val-max-petals', (v) => { this.state.maxPetals = parseInt(v, 10); this.poster.particleEngine?.adjustAmbientPetals(); });
        bind('slider-gust-freq', 'val-gust-freq', (v) => { this.state.windiness = parseFloat(v); });
        bind('slider-fall-speed', 'val-fall-speed', (v) => { this.state.fallSpeed = parseFloat(v); return `${v}x`; });
        bind('slider-tumble-speed', 'val-tumble-speed', (v) => { this.state.tumbleSpeed = parseFloat(v); return `${v}x`; });
        bind('slider-gust-strength', 'val-gust-strength', (v) => { this.state.gustStrength = parseFloat(v); this.poster.themeManager?.syncWind(); return v; });
        bind('slider-host-text-size', 'val-host-text-size', (v) => { this.state.hostTextSize = parseFloat(v); this.poster.syncLayout(); return `${v}x`; });
        bind('slider-host-max-width', 'val-host-max-width', (v) => { this.state.hostMaxWidth = parseFloat(v); this.poster.syncLayout(); return `${v}%`; });
        bind('slider-backdrop-opacity', 'val-backdrop-opacity', (v) => { this.state.backdropOpacity = parseFloat(v); this.poster.themeManager?.syncBackdrop(); return `${v}%`; });
        bind('slider-inset-v', 'val-inset-v', (v) => { this.state.insetV = parseFloat(v); this.poster.syncLayout(); return `${v}px`; });
        bind('slider-inset-h', 'val-inset-h', (v) => { this.state.insetH = parseInt(v, 10); this.poster.syncLayout(); return `${v}px`; });
    }

    bindToggles() {
        this.controls.hostLayoutRadios?.forEach(radio => {
            radio.addEventListener('change', (e) => { if (e.target.checked) { this.state.hostLayout = e.target.value; this.poster.applyHostLayout(this.state.hostLayout); this.poster.saveSettings(); } });
        });
        const bindToggle = (ctrl, key, callback) => {
            ctrl?.addEventListener('change', (e) => { this.state[key] = e.target.checked; callback?.(e.target.checked); this.poster.saveSettings(); });
        };
        bindToggle(this.controls.hideUi, 'hideUi', (v) => this.poster.applyHideUiState(v));
        bindToggle(this.controls.hideLogo, 'hideLogo', (v) => { this.body.classList.toggle('logo-hidden', v); setTimeout(() => this.poster.optimizeLayouts(), 50); });
        bindToggle(this.controls.hideDate, 'hideDate', (v) => { this.body.classList.toggle('date-hidden', v); setTimeout(() => this.poster.optimizeLayouts(), 50); });
        bindToggle(this.controls.hideTitle, 'hideTitle', (v) => { this.body.classList.toggle('title-hidden', v); setTimeout(() => this.poster.optimizeLayouts(), 50); });
        bindToggle(this.controls.hideHost, 'hideHost', (v) => { this.body.classList.toggle('host-hidden', v); setTimeout(() => this.poster.optimizeLayouts(), 50); });
        bindToggle(this.controls.hideBorder, 'hideBorder', (v) => this.body.classList.toggle('border-hidden', v));
        bindToggle(this.controls.qrSoiree, 'qrSoiree', (v) => this.elements.qrSoiree.classList.toggle('qr-hidden', !v));
        bindToggle(this.controls.qrMembership, 'qrMembership', (v) => this.elements.qrMembership.classList.toggle('qr-hidden', !v));
        bindToggle(this.controls.disableAutoFullscreen, 'disableAutoFullscreen');
    }

    bindColorPicker() {
        this.elements.bgColorPicker?.addEventListener('input', (e) => {
            const color = e.target.value;
            this.state.bgColor = color;
            this.state.accentColor = this.poster.deriveAccentColor(color);
            if (this.elements.bgColorVal) this.elements.bgColorVal.textContent = color.toUpperCase();
            this.poster.themeManager?.syncBackdrop();
            this.poster.themeManager?.updateSwatchActiveState();
        });
        this.elements.bgColorPicker?.addEventListener('change', () => this.poster.saveSettings());
    }

    bindButtons() {
        this.elements.pausePetalsButton?.addEventListener('click', () => { this.state.isPetalsPaused = !this.state.isPetalsPaused; this.poster.syncPauseStates(); this.poster.saveSettings(); });
        this.elements.pauseBgButton?.addEventListener('click', () => { this.state.isBgPaused = !this.state.isBgPaused; this.poster.syncPauseStates(); this.poster.saveSettings(); });
        this.elements.resetDefaultsButton?.addEventListener('click', () => this.poster.resetDefaults());
        this.elements.closePanelBtn?.addEventListener('click', () => { if (this.poster.isControlsPanelVisible()) this.toggleControlsPanel(); });
        this.elements.btnResetCancel?.addEventListener('click', () => this.poster.hideFactoryResetConfirmation());
        this.elements.btnResetConfirm?.addEventListener('click', () => this.poster.performFactoryReset());
        this.elements.hintFullscreenBtn?.addEventListener('click', () => { this.elements.fullscreenToggle.click(); this.elements.keyboardHint.classList.remove('is-visible'); });
        this.elements.hintOptionsBtn?.addEventListener('click', () => { this.toggleControlsPanel(); this.elements.keyboardHint.classList.remove('is-visible'); });
        this.elements.hintHelpBtn?.addEventListener('click', () => { if (!this.poster.isControlsPanelVisible()) this.toggleControlsPanel(); this.poster.toggleHelpShortcut(); this.elements.keyboardHint.classList.remove('is-visible'); });
        this.elements.cancelFullscreenBtn?.addEventListener('click', () => this.poster.cancelFullscreenCountdown());
    }

    bindHostManagement() {
        this.elements.addHostButton?.addEventListener('click', () => this.poster.openAddHostForm());
        this.elements.addHostCancel?.addEventListener('click', () => this.poster.closeAddHostForm());
        this.elements.addHostInput?.addEventListener('input', (e) => {
            const hasValue = e.target.value.trim().length > 0;
            this.elements.addHostConfirm.disabled = !hasValue;
            if (hasValue) this.poster.clearAddHostError();
        });
        this.elements.addHostInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !this.elements.addHostConfirm.disabled) { e.preventDefault(); this.poster.submitAddHost(); } });
        this.elements.addHostConfirm?.addEventListener('click', () => this.poster.submitAddHost());
    }

    bindEditPoster() {
        this.elements.logoModeRadios?.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.state.posterText.logoMode = e.target.value;
                    this.poster.savePosterText();
                    this.poster.applyPosterText();
                }
            });
        });

        const bindTF = (input, clear, key) => {
            input?.addEventListener('input', (e) => {
                if (input.tagName === 'TEXTAREA') this.poster.autoGrowTextarea(input);
                this.state.posterText[key] = e.target.value;
                this.poster.savePosterText(); this.poster.applyPosterText();
            });
            clear?.addEventListener('click', () => {
                this.state.posterText[key] = '';
                if (input) { input.value = ''; if (input.tagName === 'TEXTAREA') this.poster.autoGrowTextarea(input); }
                this.poster.savePosterText(); this.poster.applyPosterText();
            });
        };
        bindTF(this.elements.inputLogoText, this.elements.btnClearLogoText, 'logoText');
        bindTF(this.elements.inputHostsTitle, this.elements.btnClearHostsTitle, 'hostsTitle');
        bindTF(this.elements.inputEventTopLabel, this.elements.btnClearEventTopLabel, 'eventTopLabel');
        bindTF(this.elements.inputEventTitle, this.elements.btnClearEventTitle, 'eventTitle');
        bindTF(this.elements.inputEventSubtitle, this.elements.btnClearEventSubtitle, 'eventSubtitle');
        bindTF(this.elements.inputEventDate, this.elements.btnClearEventDate, 'eventDate');

        this.elements.btnUploadLogo?.addEventListener('click', () => this.elements.inputLogoFile?.click());
        this.elements.inputLogoFile?.addEventListener('change', (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            window.PosterUtils.readFileAsDataURL(file, (data) => {
                this.state.posterText.logoImageData = data; this.poster.savePosterText(); this.poster.applyPosterText();
            });
            e.target.value = '';
        });
        this.elements.btnClearLogoImg?.addEventListener('click', () => { this.state.posterText.logoImageData = null; this.state.posterText.logoMode = 'text'; this.poster.savePosterText(); this.poster.applyPosterText(); });

        const bindQR = (btn, input, dataKey, stateKey, ctrl, el) => {
            btn?.addEventListener('click', () => input?.click());
            input?.addEventListener('change', (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                window.PosterUtils.readFileAsDataURL(file, (data) => {
                    this.state.posterText[dataKey] = data; this.state[stateKey] = true; if (ctrl) ctrl.checked = true;
                    el?.classList.remove('qr-hidden'); this.poster.savePosterText(); this.poster.saveSettings(); this.poster.applyPosterText();
                });
                e.target.value = '';
            });
        };
        bindQR(this.elements.btnUploadQrLeft, this.elements.inputQrLeftFile, 'qrLeftData', 'qrSoiree', this.controls.qrSoiree, this.elements.qrSoiree);
        bindQR(this.elements.btnUploadQrRight, this.elements.inputQrRightFile, 'qrRightData', 'qrMembership', this.controls.qrMembership, this.elements.qrMembership);
        
        this.elements.btnClearQrLeft?.addEventListener('click', () => {
            this.state.posterText.qrLeftData = null; this.state.qrSoiree = false; this.controls.qrSoiree.checked = false; this.elements.qrSoiree.classList.add('qr-hidden');
            this.poster.savePosterText(); this.poster.saveSettings(); this.poster.applyPosterText();
        });
        this.elements.btnClearQrRight?.addEventListener('click', () => {
            this.state.posterText.qrRightData = null; this.state.qrMembership = false; this.controls.qrMembership.checked = false; this.elements.qrMembership.classList.add('qr-hidden');
            this.poster.savePosterText(); this.poster.saveSettings(); this.poster.applyPosterText();
        });
    }

    syncPosterTextInputs() {
        const pt = this.state.posterText;
        if (this.elements.inputLogoText) this.elements.inputLogoText.value = pt.logoText;
        if (this.elements.inputHostsTitle) this.elements.inputHostsTitle.value = pt.hostsTitle;
        if (this.elements.inputEventTopLabel) this.elements.inputEventTopLabel.value = pt.eventTopLabel;
        if (this.elements.inputEventTitle) this.elements.inputEventTitle.value = pt.eventTitle;
        if (this.elements.inputEventSubtitle) this.elements.inputEventSubtitle.value = pt.eventSubtitle;
        if (this.elements.inputEventDate) this.elements.inputEventDate.value = pt.eventDate;
        
        // Handle auto-grow for textareas
        [this.elements.inputLogoText].forEach(el => {
            if (el && el.tagName === 'TEXTAREA') this.poster.autoGrowTextarea(el);
        });
    }

    bindFullscreenControls() {
        this.elements.fullscreenToggle?.addEventListener('click', async () => {
            if (this.elements.fullscreenToggle.checked) {
                localStorage.setItem(window.STORAGE_KEYS.fullscreenIntent, 'true');
                await this.poster.requestWakeLock();
                this.poster.requestFullscreenMode();
            } else {
                localStorage.setItem(window.STORAGE_KEYS.fullscreenIntent, 'false');
                this.poster.exitFullscreenMode();
                this.poster.releaseWakeLock();
            }
        });
        document.addEventListener('fullscreenchange', () => {
            const isFS = !!document.fullscreenElement;
            this.body.classList.toggle('is-fullscreen', isFS);
            if (isFS) { this.state.fullscreenStartTime = Date.now(); this.state.totalFullscreenSeconds = 0; if (this.elements.fullscreenLabel) this.elements.fullscreenLabel.textContent = 'Fullscreen'; this.poster.cancelFullscreenCountdown(false); }
            else { if (this.state.fullscreenStartTime) { this.state.totalFullscreenSeconds = Math.floor((Date.now() - this.state.fullscreenStartTime) / 1000); this.state.fullscreenStartTime = null; }
                this.elements.fullscreenToggle.checked = false; if (this.elements.fullscreenLabel) this.elements.fullscreenLabel.textContent = '[F]ullscreen'; this.poster.releaseWakeLock(); localStorage.setItem(window.STORAGE_KEYS.fullscreenIntent, 'false'); }
        });
    }

    bindAccordionBehavior() {
        const details = [this.elements.appearanceDetails, this.elements.editPosterDetails, this.elements.hostManagementDetails, this.elements.helpDetails];
        details.forEach(el => {
            if (!el) return;
            el.addEventListener('toggle', () => {
                if (el.open) { details.forEach(other => { if (other && other !== el && other.open) other.open = false; }); this.resetInactivityTimer(); }
                this.elements.controlsPanel?.classList.toggle('has-open-section', details.some(d => d?.open));
                this.updateFocusableElements();
            });
        });
    }

    bindThemeSelector() {
        if (!this.controls.themeSelectContainer) return;

        this.controls.themeSelectTrigger?.addEventListener('click', () => {
            this.controls.themeSelectContainer.classList.toggle('is-open');
        });

        this.controls.themeSelectTrigger?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.controls.themeSelectContainer.classList.toggle('is-open');
            }
        });

        document.addEventListener('click', (e) => {
            if (!this.controls.themeSelectContainer.contains(e.target)) {
                this.controls.themeSelectContainer.classList.remove('is-open');
            }
        });

        this.controls.themeSelectOptions?.forEach(opt => {
            const selectOpt = () => {
                this.poster.themeManager?.applyTheme(opt.dataset.value);
                this.controls.themeSelectContainer.classList.remove('is-open');
                this.controls.themeSelectTrigger?.focus();
            };
            opt.addEventListener('click', selectOpt);
            opt.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectOpt();
                }
            });
        });
    }

    bindPanelInactivity() {
        const reset = () => this.resetInactivityTimer();
        ['mouseenter', 'mousemove', 'mousedown', 'keydown', 'input', 'change'].forEach(e => { this.elements.controlsPanel?.addEventListener(e, reset, { passive: true }); });
    }

    bindOutsideClickDismiss() {
        document.addEventListener('pointerdown', (e) => {
            if (!this.poster.isControlsPanelVisible()) return;
            const panel = this.elements.controlsPanel;
            if (panel.contains(e.target)) return;
            if (panel.classList.contains('is-dismissed')) { panel.classList.remove('is-visible', 'is-dimmed', 'is-dismissed'); this.clearInactivityTimers(); }
            else this.toggleControlsPanel();
        });
    }

    bindHoldHotspot() {
        const HOLD_TIME = 700; const SIZE = 120;
        let timer = null; let active = false;
        const inSpot = (e) => e.clientX >= window.innerWidth - SIZE && e.clientY <= SIZE;
        const start = (e) => { if (!inSpot(e)) return; active = true; timer = setTimeout(() => { this.toggleControlsPanel(); active = false; }, HOLD_TIME); };
        const cancel = () => { active = false; if (timer) { clearTimeout(timer); timer = null; } };
        document.addEventListener('pointerdown', start); document.addEventListener('pointerup', cancel); document.addEventListener('pointercancel', cancel);
        document.addEventListener('pointerleave', cancel); document.addEventListener('pointermove', (e) => { if (active && !inSpot(e)) cancel(); });
        document.addEventListener('pointerdown', () => { this.state.isKeyboardUser = false; }, { capture: true });
    }

    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') { this.state.isKeyboardUser = true; this.body.classList.remove('no-focus-outline'); }
            if (!this.poster.isControlsPanelVisible()) return;
            const isAddMode = this.poster.isAddHostFormOpen();
            if (isAddMode && e.key === 'Enter' && !this.elements.addHostConfirm.disabled) { this.elements.addHostConfirm.click(); e.preventDefault(); return; }
            if (isAddMode && e.target.id === 'input-host-title') return;
            this.updateFocusableElements();
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                if (isAddMode) return;
                e.preventDefault(); if (this.currentIndex === -1) this.currentIndex = 0;
                else { this.currentIndex += (e.key === 'ArrowDown' ? 1 : -1); if (this.currentIndex < 0) this.currentIndex = this.focusableElements.length - 1; if (this.currentIndex >= this.focusableElements.length) this.currentIndex = 0; }
                this.state.isKeyboardUser = true; this.applyKeyboardFocus();
            }
            if (this.currentIndex === -1) return;
            const el = this.focusableElements[this.currentIndex];
            if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && el?.tagName === 'INPUT' && el.type === 'range') {
                e.preventDefault(); const step = parseFloat(el.step) || 1; const next = parseFloat(el.value) + (e.key === 'ArrowRight' ? step : -step); el.value = next; el.dispatchEvent(new Event('input'));
            }
            if (e.key === ' ' || e.key === 'Enter') {
                if (e.key === ' ' && this.isTextInput(e.target)) return;
                e.preventDefault(); if (el.id === 'check-fullscreen') return;
                if (el.tagName === 'BUTTON' || el.tagName === 'SUMMARY' || el.type === 'checkbox') { el.click(); if (el.tagName === 'SUMMARY') setTimeout(() => { this.updateFocusableElements(); this.applyKeyboardFocus(); }, 50); }
            }
        });
    }

    resetInactivityTimer() {
        this.clearInactivityTimers();
        const panel = this.elements.controlsPanel;
        if (!panel) return;
        panel.classList.remove('is-dimmed', 'is-dismissed');
        if (!this.poster.isControlsPanelVisible()) return;
        this.poster.inactivityTimer = setTimeout(() => panel.classList.add('is-dimmed'), 30000);
        this.poster.dismissTimer = setTimeout(() => panel.classList.add('is-dismissed'), 60000);
    }

    clearInactivityTimers() {
        if (this.poster.inactivityTimer) clearTimeout(this.poster.inactivityTimer);
        if (this.poster.dismissTimer) clearTimeout(this.poster.dismissTimer);
        this.poster.inactivityTimer = null; this.poster.dismissTimer = null;
    }

    updateFocusableElements() {
        const potential = [this.elements.appearanceDetails?.querySelector('summary'), this.elements.hostManagementDetails?.querySelector('summary'), this.elements.editPosterDetails?.querySelector('summary'), this.elements.helpDetails?.querySelector('summary'), ...Array.from(document.querySelectorAll('#controls-panel input, #controls-panel button, #controls-panel summary'))];
        this.focusableElements = potential.filter(el => {
            if (!el || el.offsetParent === null) return false;
            if (this.poster.isAddHostFormOpen()) return el === this.elements.addHostInput || el === this.elements.addHostCancel || el === this.elements.addHostConfirm;
            return true;
        });
    }

    applyKeyboardFocus() {
        document.querySelectorAll('.keyboard-focused').forEach(el => el.classList.remove('keyboard-focused'));
        if (!this.state.isKeyboardUser || this.currentIndex < 0 || this.currentIndex >= this.focusableElements.length) return;
        const el = this.focusableElements[this.currentIndex];
        if (el.type === 'checkbox') (el.closest('.toggle-control') || el.closest('.check-control'))?.classList.add('keyboard-focused');
        else el.classList.add('keyboard-focused');
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};
