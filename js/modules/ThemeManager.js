/**
 * ThemeManager handles theme switching, color synchronization, and swatch management.
 */
window.ThemeManager = class ThemeManager {
    constructor(poster) {
        this.poster = poster;
    }

    get state() { return this.poster.state; }
    get elements() { return this.poster.elements; }
    get root() { return document.documentElement; }
    get body() { return document.body; }

    applyTheme(themeId, skipOverrides = false) {
        if (this.state.isApplyingTheme) return;
        this.state.isApplyingTheme = true;

        const prevTheme = this.poster.theme;
        const theme = THEMES[themeId] || THEMES.spring;
        
        // Handle contextual default labels
        if (prevTheme && prevTheme.defaults && theme.defaults) {
            const pt = this.state.posterText;
            if (pt.eventTitle === prevTheme.defaults.eventTitle) pt.eventTitle = theme.defaults.eventTitle;
            if (pt.eventSubtitle === prevTheme.defaults.eventSubtitle) pt.eventSubtitle = theme.defaults.eventSubtitle;
            if (pt.eventTopLabel === prevTheme.defaults.eventTopLabel) pt.eventTopLabel = theme.defaults.eventTopLabel;
            // Handle current defaults and the legacy global default
            if (pt.hostsTitle === prevTheme.defaults.hostsTitle || 
                pt.hostsTitle === 'Thanks To Our Hosts' || 
                pt.hostsTitle === 'Thanks to our hosts' || 
                pt.hostsTitle === 'Our Host Committee') {
                pt.hostsTitle = theme.defaults.hostsTitle;
            }
            this.poster.applyPosterText();
            this.poster.savePosterText();
            this.poster.ui.syncPosterTextInputs();
        }

        this.poster.theme = theme;
        this.poster.petalTypes = theme.particles;
        this.state.activeTheme = themeId;
        if (!skipOverrides) this.state.accentColor = null;
        
        if (theme.overrides && !skipOverrides) {
            Object.keys(theme.overrides).forEach(key => {
                if (key in this.state) this.state[key] = theme.overrides[key];
            });
            this.poster.applyStateToUI();
            this.poster.syncLayout();
            this.syncWind();
        }
        
        if (this.elements.themeFrame) {
            Object.values(THEMES).forEach(t => {
                if (t.frameClass) this.elements.themeFrame.classList.remove(t.frameClass);
                this.body.classList.remove(`theme-${t.id}`);
            });
            if (theme.frameClass) this.elements.themeFrame.classList.add(theme.frameClass);
            this.body.classList.add(`theme-${themeId}`);
            if (this.elements.logoBanner) {
                const disp = this.elements.logoBanner.style.display;
                this.elements.logoBanner.style.display = 'none';
                this.elements.logoBanner.offsetHeight;
                this.elements.logoBanner.style.display = disp;
            }
        }
        
        Object.values(this.poster.layers).forEach(layer => layer.innerHTML = '');
        this.state.petals = [];
        this.poster.particleEngine?.adjustAmbientPetals();
        
        this.syncUI(); // Handle expensive label/font updates once
        this.syncBackdrop(); // Handle color/opacity sync
        
        this.initSwatches();
        this.poster.saveSettings();
        this.state.isApplyingTheme = false;
    }

    /**
     * Expensive UI updates that only need to happen when the THEME changes.
     */
    syncUI() {
        const theme = this.poster.theme;

        // Update Fonts
        this.root.style.setProperty('--font-primary', theme.fonts.primary);
        this.root.style.setProperty('--font-display', theme.fonts.display);
        this.root.style.setProperty('--font-heading', theme.fonts.heading);

        // Update Assets
        this.root.style.setProperty('--img-border', theme.assets.border);
        this.root.style.setProperty('--img-sway-1', theme.assets.sway1);
        this.root.style.setProperty('--img-sway-2', theme.assets.sway2);
        this.root.style.setProperty('--img-sway-3', theme.assets.sway3);
        this.root.style.setProperty('--img-sway-4', theme.assets.sway4);
        this.root.style.setProperty('--img-sway-side', theme.assets.swaySide);

        // Update Labels
        const uiLabels = theme.uiLabels || {
            particlesPlural: 'Particles',
            particlesSingular: 'Particle',
            borderToggle: 'Hide background motif',
            gustStrength: 'Frame Intensity'
        };

        const pLabel = uiLabels.particlesPlural;
        const spLabel = uiLabels.particlesSingular;
        
        document.querySelectorAll('.panel-sub-section-title').forEach(el => {
            const txt = el.textContent;
            if (txt === 'Flowers' || txt === 'Particles' || txt === 'Snowflakes') {
                el.textContent = pLabel;
            }
        });

        const cntLabel = document.querySelector('label[for="slider-max-petals"]') || document.querySelector('#slider-max-petals')?.parentElement.querySelector('label');
        if (cntLabel) cntLabel.firstChild.textContent = `${spLabel} Count `;

        const bLabel = document.getElementById('check-hide-border')?.parentElement;
        if (bLabel) bLabel.lastChild.textContent = ` ${uiLabels.borderToggle}`;

        const wLabel = document.querySelector('label[for="slider-gust-strength"]') || document.querySelector('#slider-gust-strength')?.parentElement.querySelector('label');
        if (wLabel) wLabel.firstChild.textContent = `${uiLabels.gustStrength} `;
    }

    /**
     * High-frequency synchronization for color and opacity sliders.
     */
    syncBackdrop() {
        const opacity = this.state.backdropOpacity / 100;
        const color = this.state.bgColor || this.poster.theme.colors.primary;
        const theme = this.poster.theme;

        const rgb = window.PosterUtils.hexToRgb(color);
        if (!rgb) return;
        
        const rgbStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
        const accentColor = this.state.accentColor || theme.colors.accent;
        const accentRgb = window.PosterUtils.hexToRgb(accentColor);
        const accentRgbStr = accentRgb ? `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}` : rgbStr;
        
        // Update Core Colors
        this.root.style.setProperty('--color-primary', color);
        this.root.style.setProperty('--color-primary-rgb', rgbStr);
        this.root.style.setProperty('--color-brand', color);
        this.root.style.setProperty('--color-accent', accentColor);
        this.root.style.setProperty('--color-accent-rgb', accentRgbStr);
        this.root.style.setProperty('--color-panel-accent', theme.colors.accent);
        this.root.style.setProperty('--color-panel-brand', theme.colors.primary);
        this.root.style.setProperty('--color-text', theme.colors.text);
        this.root.style.setProperty('--color-dark-text', theme.colors.darkText || '#1a1c1e');
        
        // Luminance check for text contrast class (only toggle if state changes)
        const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
        const isLight = luminance > 0.5;
        if (this.body.classList.contains('is-light-bg') !== isLight) {
            this.body.classList.toggle('is-light-bg', isLight);
        }

        // Backdrop Overlays
        const target = this.poster.containers.wrapper || this.root;
        target.style.setProperty('--backdrop-opacity', opacity.toString());
        target.style.setProperty('--overlay-dark', `rgba(${rgbStr}, ${0.95 * opacity})`);
        target.style.setProperty('--overlay-mid', `rgba(${rgbStr}, ${0.7 * opacity})`);
        target.style.setProperty('--overlay-clear', `rgba(${rgbStr}, 0)`);

        // Sync particle colors if using a dynamic theme like Digital Grid
        if (this.poster.theme.id === 'digital-grid') {
            this.poster.particleEngine?.updateParticleColors();
        }
    }

    initSwatches() {
        if (!this.elements.swatchGrid) return;
        this.elements.swatchGrid.querySelectorAll('.swatch:not(.swatch--custom)').forEach(s => s.remove());
        const swatches = this.poster.theme.swatches || [];
        swatches.forEach(colorObj => {
            const btn = document.createElement('button');
            btn.className = 'swatch';
            btn.style.backgroundColor = colorObj.hex;
            btn.dataset.color = colorObj.hex;
            btn.title = colorObj.name;
            btn.addEventListener('click', () => {
                this.state.bgColor = colorObj.hex;
                this.state.accentColor = colorObj.accent || null;
                if (this.elements.bgColorPicker) this.elements.bgColorPicker.value = colorObj.hex;
                if (this.elements.bgColorVal) this.elements.bgColorVal.textContent = colorObj.hex.toUpperCase();
                this.syncBackdrop(); this.updateSwatchActiveState(); this.poster.saveSettings();
            });
            this.elements.swatchGrid.insertBefore(btn, this.elements.btnCustomColor);
        });
        this.updateSwatchActiveState();
    }

    updateSwatchActiveState() {
        if (!this.elements.swatchGrid) return;
        const swatches = this.elements.swatchGrid.querySelectorAll('.swatch:not(.swatch--custom)');
        let found = false;
        swatches.forEach(s => {
            const swatchColor = (s.dataset.color || '').trim().toLowerCase();
            const currentColor = (this.state.bgColor || '').trim().toLowerCase();
            const isActive = swatchColor === currentColor && swatchColor !== '';
            s.classList.toggle('active', isActive);
            if (isActive) found = true;
        });
        if (this.elements.btnCustomColor) {
            this.elements.btnCustomColor.classList.toggle('active', !found);
            if (!found) {
                this.elements.btnCustomColor.style.backgroundColor = this.state.bgColor;
                this.elements.btnCustomColor.style.color = window.PosterUtils.isDark(this.state.bgColor) ? '#fff' : '#000';
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

    syncWind() {
        const impact = this.state.gustStrength / 10;
        this.root.style.setProperty('--gust-impact', impact);
        this.root.style.setProperty('--gust-speed', 0.5 + impact * 0.5);
        this.root.style.setProperty('--frame-intensity', this.state.gustStrength / 100);
    }
};
