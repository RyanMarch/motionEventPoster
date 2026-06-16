/**
 * ThemeManager handles theme switching, color synchronization, and swatch management.
 */
window.ThemeManager = class ThemeManager {
    constructor(poster) {
        this.poster = poster;
    }

    get state() { return this.poster.state; }
    get elements() { return this.poster.elements; }
    get controls() { return this.poster.controls; }
    get root() { return document.documentElement; }
    get body() { return document.body; }

    applyTheme(themeId, skipOverrides = false) {
        if (this.state.isApplyingTheme) return;

        const theme = THEMES[themeId] || THEMES.spring;

        if (this.state.activeTheme && this.state.activeTheme !== theme.id) {
            const url = new URL(window.location.href);
            if (url.searchParams.has('theme')) {
                url.searchParams.delete('theme');
                const newUrl = url.pathname + url.search + url.hash;
                window.history.replaceState(null, '', newUrl);
            }
        }

        this.state.isApplyingTheme = true;

        const prevTheme = this.poster.theme;
        
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
        if (!skipOverrides) {
            this.state.accentColor = null;
            this.state.bgColor = null;
            this.state.secondaryColor = null;
        }
        
        if (theme.overrides && !skipOverrides) {
            Object.keys(theme.overrides).forEach(key => {
                if (key in this.state) this.state[key] = theme.overrides[key];
            });
            this.poster.applyStateToUI();
            this.poster.syncLayout();
            this.syncWind();
        }
        
        Object.values(THEMES).forEach(t => {
            this.body.classList.remove(`theme-${t.id}`);
        });
        this.body.classList.add(`theme-${themeId}`);

        if (this.elements.themeFrame) {
            Object.values(THEMES).forEach(t => {
                if (t.frameClass) this.elements.themeFrame.classList.remove(t.frameClass);
            });
            if (theme.frameClass) this.elements.themeFrame.classList.add(theme.frameClass);
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
        this.updateThemeSelectorActiveState();
        this.state.isApplyingTheme = false;
        // Remote sync
        if (!window.remoteManager?._applying) {
            window.remoteManager?.send({ type: 'theme', id: themeId });
        }
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
        const resolveAsset = (val) => {
            if (!val || val === 'none') return 'none';
            const match = val.match(/url\(['"]?([^'"]+?)['"]?\)/);
            if (match && match[1]) {
                const path = match[1];
                // Resolve path relative to document URL to avoid relative-path resolution issues in dynamic CSS variables
                const absoluteUrl = new URL(path, window.location.href).href;
                return `url('${absoluteUrl}')`;
            }
            return val;
        };

        this.root.style.setProperty('--img-border', resolveAsset(theme.assets.border));
        this.root.style.setProperty('--img-sway-1', resolveAsset(theme.assets.sway1));
        this.root.style.setProperty('--img-sway-2', resolveAsset(theme.assets.sway2));
        this.root.style.setProperty('--img-sway-3', resolveAsset(theme.assets.sway3));
        this.root.style.setProperty('--img-sway-4', resolveAsset(theme.assets.sway4));
        this.root.style.setProperty('--img-sway-side', resolveAsset(theme.assets.swaySide));

        // Update Labels
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

        const cntLabel = document.querySelector('label[for="slider-max-petals"]') || document.querySelector('#slider-max-petals')?.parentElement.querySelector('label');
        if (cntLabel) cntLabel.firstChild.textContent = `${spLabel} Count `;

        const bLabel = document.getElementById('check-hide-border')?.closest('label');
        if (bLabel) {
            const labelSpan = bLabel.querySelector('.toggle-label');
            if (labelSpan) labelSpan.textContent = uiLabels.borderToggle;
        }

        const wLabel = document.querySelector('label[for="slider-gust-strength"]') || document.querySelector('#slider-gust-strength')?.parentElement.querySelector('label');
        if (wLabel) wLabel.firstChild.textContent = `${uiLabels.gustStrength} `;
        
        // Update Theme Selector Trigger
        if (this.controls.themeSelectIcon) this.controls.themeSelectIcon.textContent = theme.icon || '✨';
        if (this.controls.themeSelectLabel) this.controls.themeSelectLabel.textContent = theme.name;
        
        // Sync pause buttons in case labels changed
        if (this.poster.syncPauseStates) this.poster.syncPauseStates();
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

        const secondaryColor = this.state.secondaryColor || theme.colors.secondary || '#ffffff';
        const secondaryRgb = window.PosterUtils.hexToRgb(secondaryColor);
        const secondaryRgbStr = secondaryRgb ? `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}` : rgbStr;
        
        // Update Core Colors
        this.root.style.setProperty('--color-primary', color);
        this.root.style.setProperty('--color-primary-rgb', rgbStr);
        this.root.style.setProperty('--color-accent', accentColor);
        this.root.style.setProperty('--color-accent-rgb', accentRgbStr);
        this.root.style.setProperty('--color-secondary', secondaryColor);
        this.root.style.setProperty('--color-secondary-rgb', secondaryRgbStr);
        this.root.style.setProperty('--color-text', theme.colors.text);
        this.root.style.setProperty('--color-dark-text', theme.colors.darkText || '#1a1c1e');
        
        const textRgb = window.PosterUtils.hexToRgb(theme.colors.text);
        const darkTextRgb = window.PosterUtils.hexToRgb(theme.colors.darkText || '#1a1c1e');
        if (textRgb) {
            this.root.style.setProperty('--color-text-rgb', `${textRgb.r}, ${textRgb.g}, ${textRgb.b}`);
        }
        if (darkTextRgb) {
            this.root.style.setProperty('--color-dark-text-rgb', `${darkTextRgb.r}, ${darkTextRgb.g}, ${darkTextRgb.b}`);
        }
        
        // Dynamic Bunting color SVG generation
        const buntingSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 35' width='50' height='35'><path d='M0,0 Q25,8 50,0 L50,2 L25,32 L0,2 Z' fill='${encodeURIComponent(accentColor)}' opacity='0.85'/><path d='M0,0 Q25,8 50,0 L42,0 L25,24 L8,0 Z' fill='${encodeURIComponent(secondaryColor)}' opacity='0.95'/></svg>")`;
        this.root.style.setProperty('--bunting-image', buntingSvg);
        
        // Stable theme-defined colors (non-swapped reference)
        const themePrimaryRgb = window.PosterUtils.hexToRgb(theme.colors.primary);
        const themeAccentRgb = window.PosterUtils.hexToRgb(theme.colors.accent);
        if (themePrimaryRgb) {
            this.root.style.setProperty('--color-theme-primary', theme.colors.primary);
            this.root.style.setProperty('--color-theme-primary-rgb', `${themePrimaryRgb.r}, ${themePrimaryRgb.g}, ${themePrimaryRgb.b}`);
        }
        if (themeAccentRgb) {
            this.root.style.setProperty('--color-theme-accent', theme.colors.accent);
            this.root.style.setProperty('--color-theme-accent-rgb', `${themeAccentRgb.r}, ${themeAccentRgb.g}, ${themeAccentRgb.b}`);
        }

        // Luminance check for text contrast class (only toggle if state changes)
        const checkRgb = theme.flags?.useAccentAsBackground ? (accentRgb || rgb) : rgb;
        const luminance = (0.2126 * checkRgb.r + 0.7152 * checkRgb.g + 0.0722 * checkRgb.b) / 255;
        const isLight = luminance > 0.5;
        if (this.body.classList.contains('is-light-bg') !== isLight) {
            this.body.classList.toggle('is-light-bg', isLight);
        }

        // Backdrop Overlays
        const target = this.root;
        target.style.setProperty('--backdrop-opacity', opacity.toString());
        
        const overlayColorStr = theme.flags?.useAccentAsBackground ? accentRgbStr : rgbStr;
        
        if (!theme.flags?.useAccentAsBackground) {
            target.style.setProperty('--overlay-dark', `rgba(${overlayColorStr}, ${0.95 * opacity})`);
            target.style.setProperty('--overlay-mid', `rgba(${overlayColorStr}, ${0.7 * opacity})`);
            target.style.setProperty('--overlay-clear', `rgba(${overlayColorStr}, 0)`);
        } else {
            target.style.removeProperty('--overlay-dark');
            target.style.removeProperty('--overlay-mid');
            target.style.removeProperty('--overlay-clear');
        }

        // Sync particle colors for themes that derive particle colors from swatches
        if (theme.flags?.syncParticleColors) {
            this.poster.particleEngine?.updateParticleColors();
        }
    }

    initSwatches() {
        if (!this.elements.swatchGrid) return;
        this.elements.swatchGrid.querySelectorAll('.swatch:not(.swatch--custom)').forEach(s => s.remove());
        const swatches = this.poster.theme.swatches || [];
        swatches.forEach(colorObj => {
            const btn = document.createElement('span');
            btn.className = 'swatch';
            btn.setAttribute('role', 'button');
            btn.tabIndex = 0;
            const showAccent = this.poster.theme.flags?.showAccentAsSwatch;
            const showSecondary = this.poster.theme.flags?.showSecondaryAsSwatch;
            if (showSecondary && colorObj.secondary) {
                btn.style.backgroundColor = colorObj.secondary;
            } else if (showAccent && colorObj.accent) {
                btn.style.backgroundColor = colorObj.accent;
            } else {
                btn.style.backgroundColor = colorObj.hex;
            }
            btn.dataset.color = colorObj.hex;
            btn.title = colorObj.name;
            btn.addEventListener('click', () => {
                this.state.bgColor = colorObj.hex;
                this.state.accentColor = colorObj.accent || null;
                this.state.secondaryColor = colorObj.secondary || null;
                
                const isAccentBg = this.poster.theme.flags?.useAccentAsBackground;
                const displayColor = isAccentBg ? (this.state.accentColor || this.poster.theme.colors.accent) : this.state.bgColor;
                
                if (this.elements.bgColorPicker) this.elements.bgColorPicker.value = displayColor;
                if (this.elements.bgColorVal) this.elements.bgColorVal.textContent = this.resolveColorLabel(colorObj.name);
                
                this.syncBackdrop(); this.updateSwatchActiveState(); this.poster.saveSettings();
                // Remote sync
                if (!window.remoteManager?._applying) {
                    window.remoteManager?.send({ type: 'swatch', color: colorObj.hex, accent: colorObj.accent || null, secondary: colorObj.secondary || null });
                }
            });
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
            this.elements.swatchGrid.insertBefore(btn, this.elements.btnCustomColor);
        });
        this.updateSwatchActiveState();
    }

    initThemeSelector() {
        const container = document.getElementById('theme-select-options');
        if (!container) return;

        container.innerHTML = '';

        // Identify existing/built themes by checking stylesheet link tags in the document
        const existingThemeIds = new Set();
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes('css/themes/theme-')) {
                const urlPath = href.split('?')[0];
                const filename = urlPath.substring(urlPath.lastIndexOf('/') + 1);
                if (filename.startsWith('theme-') && filename.endsWith('.css')) {
                    const themeId = filename.substring(6, filename.length - 4);
                    existingThemeIds.add(themeId);
                }
            }
        });

        // 1. Render Sticky Jump Links at the top of the dropdown container
        const jumpLinksDiv = document.createElement('div');
        jumpLinksDiv.className = 'custom-select-jump-links';
        jumpLinksDiv.setAttribute('role', 'navigation');
        jumpLinksDiv.setAttribute('aria-label', 'Jump to theme pack');
        
        Object.entries(window.THEME_PACKS || {}).forEach(([packId, packInfo]) => {
            const packThemes = Object.values(THEMES).filter(t => t.pack === packId && existingThemeIds.has(t.id));
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
            // Filter themes belonging to this pack and check if CSS exists
            const packThemes = Object.values(THEMES).filter(t => t.pack === packId && existingThemeIds.has(t.id));
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
                opt.dataset.icon = theme.icon || '✨';
                opt.setAttribute('role', 'option');
                opt.setAttribute('aria-selected', 'false');
                opt.tabIndex = -1; // Managed programmatically via arrow keys

                const iconSpan = document.createElement('span');
                iconSpan.className = 'option-icon';
                iconSpan.textContent = opt.dataset.icon;

                const labelSpan = document.createElement('span');
                labelSpan.className = 'option-label';
                labelSpan.textContent = theme.name;

                opt.appendChild(iconSpan);
                opt.appendChild(labelSpan);

                const selectTheme = () => {
                    this.applyTheme(theme.id);
                    this.poster.controls.themeSelectContainer.classList.remove('is-open');
                    this.poster.controls.themeSelectTrigger?.setAttribute('aria-expanded', 'false');
                    this.poster.controls.themeSelectTrigger?.focus();
                };

                opt.addEventListener('click', selectTheme);
                opt.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectTheme();
                    }
                });

                groupDiv.appendChild(opt);
            });

            container.appendChild(groupDiv);
        });

        // Re-cache options in EventPoster
        this.poster.controls.themeSelectOptions = container.querySelectorAll('.custom-select-option');
        this.updateThemeSelectorActiveState();
    }

    /**
     * Highlights the currently active theme in the dropdown.
     */
    updateThemeSelectorActiveState() {
        if (!this.poster.controls.themeSelectOptions) return;
        this.poster.controls.themeSelectOptions.forEach(opt => {
            const isSelected = opt.dataset.value === this.state.activeTheme;
            opt.classList.toggle('selected', isSelected);
            opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });
    }

    updateSwatchActiveState() {
        if (!this.elements.swatchGrid) return;
        const swatches = this.elements.swatchGrid.querySelectorAll('.swatch:not(.swatch--custom)');
        let found = false;
        swatches.forEach(s => {
            const swatchColor = (s.dataset.color || '').trim().toLowerCase();
            const currentColor = (this.state.bgColor || this.poster.theme.colors.primary).trim().toLowerCase();
            
            // For themes that swap roles, we also need to verify the accent color matches 
            // to distinguish between 'Normal' and 'Reversed' swatches.
            const currentAccent = (this.state.accentColor || this.poster.theme.colors.accent).trim().toLowerCase();
            const swatchAccent = (s.title && this.poster.theme.swatches.find(sw => sw.name === s.title)?.accent || '').trim().toLowerCase();
            
            const isActive = swatchColor === currentColor && (swatchAccent === '' || swatchAccent === currentAccent);
            
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

    /**
     * Returns the display text for the color scheme span (the part after "Color Scheme: ").
     * Shows the named swatch name when one matches, otherwise the hex value.
     */
    resolveColorLabel(swatchName) {
        if (swatchName) return swatchName;
        // Look up current bgColor against the active theme's swatches
        const currentBg = (this.state.bgColor || this.poster.theme.colors.primary).toLowerCase();
        const currentAccent = (this.state.accentColor || this.poster.theme.colors.accent || '').toLowerCase();
        const match = (this.poster.theme.swatches || []).find(sw => {
            const swHex = sw.hex.toLowerCase();
            const swAccent = (sw.accent || '').toLowerCase();
            return swHex === currentBg && (!swAccent || swAccent === currentAccent);
        });
        if (match) return match.name;
        // Custom color — fall back to hex
        const isAccentBg = this.poster.theme.flags?.useAccentAsBackground;
        const displayColor = isAccentBg
            ? (this.state.accentColor || this.poster.theme.colors.accent)
            : (this.state.bgColor || this.poster.theme.colors.primary);
        return displayColor.toUpperCase();
    }

    syncWind() {
        const strength = this.state.gustStrength; // 0-100
        const impact = strength / 10;
        
        // Lower the floor for speed. 
        // We want it very calm at low numbers (0-10) and faster at high numbers.
        // Quadratic curve: at 0 -> 0.12, at 10 -> 0.17, at 50 -> 0.77, at 100 -> 2.62
        // This gives a much wider range of "calmness" at the low end.
        const speed = 0.12 + (strength * strength / 4000);
        
        this.root.style.setProperty('--gust-impact', impact);
        this.root.style.setProperty('--gust-speed', speed.toFixed(3));
        this.root.style.setProperty('--frame-intensity', (strength / 100).toFixed(3));
        this.root.style.setProperty('--grid-play-state', strength === 0 ? 'paused' : 'running');
    }
};
