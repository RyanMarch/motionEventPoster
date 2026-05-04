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
        this.bindHostListClicks();

        let resizeTimer;
        window.addEventListener('resize', () => {
            this.state.isResizing = true;
            this.body.classList.add('is-resizing');

            // Only update the DOM for the stat box if it's actually visible to the user
            if (this.poster.isControlsPanelVisible()) {
                this.poster.updateScreenSize();
            }

            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.state.isResizing = false;
                this.body.classList.remove('is-resizing');

                requestAnimationFrame(() => {
                    if (this.state.isAppRunning) {
                        // We always optimize layouts so the POSTER looks good, 
                        // but we only update the STAT BOX if it's visible.
                        this.poster.optimizeLayouts();
                        if (this.poster.isControlsPanelVisible()) {
                            this.poster.updateScreenSize();
                        }
                    } else {
                        this.poster.updateMobileScreenSizeInfo();
                    }
                });
            }, 200); 
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

        const globalReset = () => this.resetGlobalInactivityTimer();
        window.addEventListener('mousemove', globalReset, { passive: true });
        window.addEventListener('mousedown', globalReset, { passive: true });
        window.addEventListener('keydown', globalReset, { passive: true });
        window.addEventListener('touchstart', globalReset, { passive: true });
        this.resetGlobalInactivityTimer();
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
            this.poster.updateScreenSize();
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
            const lowerKey = key.toLowerCase();
            
            // Handle Factory Reset specifically (hold behavior)
            if (key === '\\' && !this.isTextInput(event.target)) {
                this.poster.handleFactoryResetKeyDown(event);
                return;
            }

            // Global Escape handling
            if (key === 'Escape') {
                if (this.poster.isAddHostFormOpen()) {
                    this.poster.closeAddHostForm();
                    event.preventDefault(); return;
                } else if (this.poster.isFactoryResetModalVisible()) {
                    this.poster.hideFactoryResetConfirmation();
                    event.preventDefault(); return;
                } else if (this.poster.isControlsPanelVisible()) {
                    this.toggleControlsPanel();
                    event.preventDefault(); return;
                }
            }

            if (this.isTextInput(event.target)) return;

            // Special Case: Alt+S for reload (Developer shortcut, not in config)
            if (event.code === 'KeyS' && event.altKey) { 
                event.preventDefault(); 
                this.poster.reloadStyles(); 
                return;
            }

            // Find matching shortcut config
            const config = window.SHORTCUT_CONFIGS.find(c => c.key === lowerKey || c.key === key);
            if (!config || event.repeat) return;

            // Check condition if present
            if (config.condition && !this.poster[config.condition]()) return;

            // Execute action
            switch (config.action) {
                case 'toggleControls': this.toggleControlsPanel(); break;
                case 'toggleFullscreen': if (!this.elements.fullscreenToggle.checked) this.elements.fullscreenToggle.click(); break;
                case 'toggleEdit': this.poster.toggleEditPosterShortcut(); event.preventDefault(); break;
                case 'toggleCustomize': this.poster.toggleCustomizeShortcut(); event.preventDefault(); break;
                case 'toggleHosts': this.poster.toggleAddHostShortcut(); event.preventDefault(); break;
                case 'toggleHelp': this.poster.toggleHelpShortcut(); event.preventDefault(); break;
                case 'resetDefaults': this.poster.resetDefaults(); event.preventDefault(); break;
            }
        });
        document.addEventListener('keyup', (event) => { if (event.key === '\\') this.poster.handleFactoryResetKeyUp(); });
    }

    initShortcutsUI() {
        const container = document.getElementById('shortcut-list');
        if (!container) return;
        
        container.innerHTML = '';
        // Use a Set to avoid duplicate entries for same action (like ? and /)
        const seenActions = new Set();
        
        window.SHORTCUT_CONFIGS.forEach(config => {
            if (seenActions.has(config.action) || config.action === 'closeAll' || config.action === 'factoryReset') return;
            seenActions.add(config.action);

            const item = document.createElement('div');
            item.className = 'shortcut-item';
            
            const kbd = document.createElement('kbd');
            kbd.textContent = config.label;
            
            const desc = document.createElement('span');
            desc.className = 'shortcut-desc';
            desc.textContent = config.desc;
            
            item.appendChild(kbd);
            item.appendChild(desc);
            container.appendChild(item);
        });
    }

    isTextInput(target) {
        if (!target) return false;
        return (target.tagName === 'INPUT' && (target.type === 'text' || target.type === 'search')) || 
               target.tagName === 'TEXTAREA' || target.isContentEditable;
    }

    bindSliders() {
        const sliderConfigs = window.SLIDER_CONFIGS || [];
        
        sliderConfigs.forEach(config => {
            const slider = document.getElementById(`slider-${config.id}`);
            const display = document.getElementById(`val-${config.id}`);
            if (!slider) return;

            let rafId = null;
            const startSlide = () => this.body.classList.add('is-sliding');
            const endSlide = () => { 
                if (rafId) { cancelAnimationFrame(rafId); rafId = null; } 
                this.body.classList.remove('is-sliding'); 
                this.poster.saveSettings(); 
            };

            slider.addEventListener('pointerdown', startSlide);
            slider.addEventListener('input', (e) => {
                const v = e.target.value;
                const numVal = config.step >= 1 ? parseInt(v, 10) : parseFloat(v);
                
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                    // Update state
                    this.state[config.stateKey] = numVal;
                    
                    // Update display label
                    if (display) display.textContent = `${v}${config.suffix || ''}`;
                    
                    // Execute specific side effects
                    if (config.id === 'max-petals') this.poster.particleEngine?.adjustAmbientPetals();
                    if (config.id === 'gust-strength') this.poster.themeManager?.syncWind();
                    if (['host-text-size', 'host-max-width', 'inset-v', 'inset-h'].includes(config.id)) this.poster.syncLayout();
                    if (config.id === 'backdrop-opacity') this.poster.themeManager?.syncBackdrop();
                    
                    rafId = null;
                });
            });
            slider.addEventListener('change', endSlide);
            slider.addEventListener('pointerup', endSlide);
            slider.addEventListener('pointercancel', endSlide);
        });
    }

    initSlidersUI() {
        const sliderConfigs = window.SLIDER_CONFIGS || [];
        
        sliderConfigs.forEach(config => {
            const section = document.getElementById(config.sectionId);
            if (!section) return;

            // Handle grouping for "isHalf" sliders
            let container = section;
            if (config.isHalf) {
                // Look for or create a control-row at the end of the section
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
            
            // Special case for extra-ribbons control position (if needed)
            if (config.id === 'backdrop-opacity') control.style.marginBottom = '12px';

            const label = document.createElement('label');
            label.htmlFor = `slider-${config.id}`;
            label.textContent = `${config.label} `;
            
            const span = document.createElement('span');
            span.id = `val-${config.id}`;
            span.textContent = '—';
            
            label.appendChild(span);
            
            const input = document.createElement('input');
            input.type = 'range';
            input.id = `slider-${config.id}`;
            input.min = config.min;
            input.max = config.max;
            input.step = config.step || 1;
            
            control.appendChild(label);
            control.appendChild(input);
            
            // Prepend backdrop-opacity to be on the left of extra-ribbons
            if (config.id === 'backdrop-opacity') {
                container.prepend(control);
            } else {
                container.appendChild(control);
            }
        });
    }

    bindToggles() {
        this.controls.hostLayoutRadios?.forEach(radio => {
            radio.addEventListener('change', (e) => { if (e.target.checked) { this.state.hostLayout = e.target.value; this.poster.applyHostLayout(this.state.hostLayout); this.poster.saveSettings(); } });
        });
        
        this.controls.fpsCapRadios?.forEach(radio => {
            radio.addEventListener('change', (e) => { 
                if (e.target.checked) { 
                    this.state.fpsCap = Number(e.target.value); 
                    // Reset timing to prevent sudden jumps or logic drifts
                    this.state.lastFrameExecutionTime = 0;
                    this.state.lastPhysicsTime = 0;
                    this.poster.saveSettings(); 
                } 
            });
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
        bindToggle(this.controls.autoHideMenu, 'autoHideMenu', (v) => { if (!v) this.poster.root.classList.remove('inactivity-hide'); });
        bindToggle(this.controls.smoothTransitions, 'smoothTransitions', (v) => this.poster.root.classList.toggle('no-transitions', !v));
    }

    bindColorPicker() {
        this.elements.bgColorPicker?.addEventListener('input', (e) => {
            const color = e.target.value;
            const isAccentBg = this.poster.theme.flags?.useAccentAsBackground;
            
            if (isAccentBg) {
                this.state.accentColor = color;
                // If they are picking a custom background, we keep the current primary color
            } else {
                this.state.bgColor = color;
                this.state.accentColor = this.poster.deriveAccentColor(color);
            }
            
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
        this.elements.cancelFullscreenBtn?.addEventListener('click', () => this.poster.cancelFullscreenCountdown(false, true));
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
            
            // Ensure screen size stats update immediately after layout stabilizes
            requestAnimationFrame(() => {
                if (this.poster.isControlsPanelVisible()) {
                    this.poster.updateScreenSize();
                }
            });

            if (isFS) { 
                this.state.fullscreenStartTime = Date.now(); 
                this.state.totalFullscreenSeconds = 0; 
                if (this.elements.fullscreenLabel) this.elements.fullscreenLabel.textContent = 'Fullscreen'; 
                this.poster.cancelFullscreenCountdown(false, false); 
            } else { 
                if (this.state.fullscreenStartTime) { 
                    this.state.totalFullscreenSeconds = Math.floor((Date.now() - this.state.fullscreenStartTime) / 1000); 
                    this.state.fullscreenStartTime = null; 
                    this.poster.updateTimerDisplay();
                }
                this.elements.fullscreenToggle.checked = false; 
                if (this.elements.fullscreenLabel) this.elements.fullscreenLabel.textContent = '[F]ullscreen'; 
                this.poster.releaseWakeLock(); 
                
                // Only clear the intent if the page is still active/visible.
                // If it's hidden or unloading, we assume it's a refresh/re-layout 
                // and preserve the intent for auto-recovery.
                if (document.visibilityState === 'visible') {
                    localStorage.setItem(window.STORAGE_KEYS.fullscreenIntent, 'false');
                }
            }
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
    }

    bindPanelInactivity() {
        const reset = () => this.resetInactivityTimer();
        ['mouseenter', 'mousemove', 'mousedown', 'keydown', 'input', 'change'].forEach(e => { this.elements.controlsPanel?.addEventListener(e, reset, { passive: true }); });
    }

    bindOutsideClickDismiss() {
        document.addEventListener('pointerdown', (e) => {
            if (!this.poster.isControlsPanelVisible()) return;
            
            // If auto-hide is OFF, we do NOT dismiss by clicking outside
            if (!this.state.autoHideMenu || this.state.autoHideMenu === 'false') return;

            const panel = this.elements.controlsPanel;
            if (panel.contains(e.target)) return;
            
            // Clicking the close button is handled by its own listener
            if (e.target.closest('#btn-close-panel')) return;

            if (panel.classList.contains('is-dismissed')) { 
                panel.classList.remove('is-visible', 'is-dimmed', 'is-dismissed'); 
                this.clearInactivityTimers(); 
            } else {
                this.toggleControlsPanel();
            }
        });
    }

    bindHostListClicks() {
        this.elements.addedHostsItems?.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-remove-host');
            if (!btn) return;
            const index = parseInt(btn.dataset.index, 10);
            const name = this.state.addedHosts[index];
            this.poster.removeHostByName(name);
        });

        this.elements.removedHostsItems?.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-restore-host');
            if (!btn) return;
            const name = btn.dataset.name;
            this.poster.restoreHostByName(name);
        });
    }

    renderAddedHosts() {
        if (!this.elements.addedHostsItems) return;
        if (this.state.addedHosts.length === 0) {
            this.elements.addedHostsList.classList.add('is-hidden');
            this.elements.addedHostsItems.innerHTML = '';
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
        this.elements.addedHostsList.classList.remove('is-hidden');
        this.updateFocusableElements();
    }

    renderRemovedHosts() {
        if (!this.elements.removedHostsItems) return;
        // Only show hosts that are NOT in the base hosts list (i.e. only user-added hosts)
        const displayedRemoved = this.state.removedHosts.filter(name => !this.poster.baseHosts.includes(name));

        if (displayedRemoved.length === 0) {
            this.elements.removedHostsList.classList.add('is-hidden');
            this.elements.removedHostsItems.innerHTML = '';
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
            button.className = 'btn-restore-host';
            button.dataset.name = name;
            button.type = 'button';
            button.textContent = 'Restore';
            row.append(label, button);
            return row;
        });

        this.elements.removedHostsItems.replaceChildren(...rows);
        this.elements.removedHostsList.classList.remove('is-hidden');
        this.updateFocusableElements();
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
                    this.poster.removeHostByName(name);
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

    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') { this.state.isKeyboardUser = true; this.body.classList.remove('no-focus-outline'); }
            
            // Factory Reset Confirmation Modal handling
            if (this.poster.isFactoryResetModalVisible()) {
                if (e.key === 'Enter') {
                    this.poster.performFactoryReset();
                    e.preventDefault();
                    return;
                }
            }

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

        // Only set inactivity timers if auto-hide is enabled
        if (this.state.autoHideMenu) {
            this.poster.inactivityTimer = setTimeout(() => panel.classList.add('is-dimmed'), 30000);
            this.poster.dismissTimer = setTimeout(() => panel.classList.add('is-dismissed'), 60000);
        }
    }

    clearInactivityTimers() {
        if (this.poster.inactivityTimer) clearTimeout(this.poster.inactivityTimer);
        if (this.poster.dismissTimer) clearTimeout(this.poster.dismissTimer);
        this.poster.inactivityTimer = null; this.poster.dismissTimer = null;
    }

    resetGlobalInactivityTimer() {
        if (this.globalInactivityTimer) clearTimeout(this.globalInactivityTimer);
        this.poster.root.classList.remove('inactivity-hide');
        
        // Only hide if feature is enabled AND panel is NOT currently visible
        const isAutoHideEnabled = this.state.autoHideMenu === true || this.state.autoHideMenu === 'true';
        if (isAutoHideEnabled && !this.poster.isControlsPanelVisible()) {
            this.globalInactivityTimer = setTimeout(() => {
                this.poster.root.classList.add('inactivity-hide');
            }, 6000); 
        }
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
