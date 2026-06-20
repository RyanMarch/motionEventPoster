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
        
        // Set the body classes, frames, and assets so the DOM styles are correctly loaded first
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

        // Apply state overrides and sync layout measurements with correct fonts/classes active
        if (theme.overrides && !skipOverrides) {
            Object.keys(theme.overrides).forEach(key => {
                if (key in this.state) this.state[key] = theme.overrides[key];
            });
            this.poster.applyStateToUI();
            this.poster.syncLayout();
            this.syncWind();
        }

        this.initSwatches();
        this.poster.saveSettings();
        this.updateThemeSelectorActiveState();
        this.state.isApplyingTheme = false;
        this.poster.cacheSwayLayers();

        // Defer font ready listener by a frame so browser registers the style changes first
        requestAnimationFrame(() => {
            if (document.fonts) {
                document.fonts.ready.then(() => {
                    requestAnimationFrame(() => {
                        this.poster.optimizeLayouts();
                    });
                });
            }
        });

        // Progressive fail-safe reflows to handle fonts/images loading asynchronously
        setTimeout(() => this.poster.optimizeLayouts(), 50);
        setTimeout(() => this.poster.optimizeLayouts(), 250);
        setTimeout(() => this.poster.optimizeLayouts(), 600);

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

        const fLabel = document.querySelector('label[for="slider-fall-speed"]') || document.querySelector('#slider-fall-speed')?.parentElement.querySelector('label');
        if (fLabel) fLabel.firstChild.textContent = `${uiLabels.fallSpeed || 'Fall Speed'} `;
         const windinessControl = document.getElementById('slider-gust-freq')?.closest('.control');
        if (windinessControl) {
            windinessControl.style.display = theme.id === 'space-odyssey' ? 'none' : '';
        }

        const tumbleControl = document.getElementById('slider-tumble-speed')?.closest('.control');
        if (tumbleControl) {
            tumbleControl.style.display = theme.id === 'space-odyssey' ? 'none' : '';
        }

        const backdropControl = document.getElementById('slider-backdrop-opacity')?.closest('.control');
        if (backdropControl) {
            backdropControl.style.display = theme.id === 'memphis-pop' ? 'none' : '';
        }
        
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

        // Mid-Century Theme dynamic SVGs & contrast calculation
        if (theme.id === 'atomic-mid-century') {
            const lineStroke = encodeURIComponent(theme.colors.text); // '#2A1B14'
            const centerCircleFill = encodeURIComponent(secondaryColor);
            const diagonalCirclesFill = encodeURIComponent(secondaryColor);
            const nsewCirclesFill = encodeURIComponent(accentColor);
            const diamondFill = encodeURIComponent(accentColor);

            const starburstSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='8' fill='${centerCircleFill}'/><g stroke='${lineStroke}' stroke-width='1.5'><line x1='50' y1='50' x2='50' y2='10'/><line x1='50' y1='50' x2='50' y2='90'/><line x1='50' y1='50' x2='10' y2='50'/><line x1='50' y1='50' x2='90' y2='50'/><line x1='50' y1='50' x2='22' y2='22'/><line x1='50' y1='50' x2='78' y2='78'/><line x1='50' y1='50' x2='22' y2='78'/><line x1='50' y1='50' x2='78' y2='22'/></g><circle cx='50' cy='10' r='5' fill='${nsewCirclesFill}'/><circle cx='50' cy='90' r='5' fill='${nsewCirclesFill}'/><circle cx='10' cy='50' r='5' fill='${nsewCirclesFill}'/><circle cx='90' cy='50' r='5' fill='${nsewCirclesFill}'/><circle cx='22' cy='22' r='5' fill='${diagonalCirclesFill}'/><circle cx='78' cy='78' r='5' fill='${diagonalCirclesFill}'/><circle cx='22' cy='78' r='5' fill='${diagonalCirclesFill}'/><circle cx='78' cy='22' r='5' fill='${diagonalCirclesFill}'/><polygon points='50,40 52,47 59,50 52,53 50,60 48,53 41,50 48,47' fill='${diamondFill}'/></svg>")`;
            this.root.style.setProperty('--atomic-starburst-image', starburstSvg);

            const starSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><polygon points='50,5 54,44 95,50 54,56 50,95 46,56 5,50 46,44' fill='${nsewCirclesFill}'/><polygon points='50,20 52,46 78,32 53,49 80,50 53,51 78,68 52,54 50,80 48,54 22,68 47,51 20,50 47,49 22,32 48,46' fill='${centerCircleFill}' opacity='0.75'/><circle cx='50' cy='50' r='4' fill='${diamondFill}'/></svg>")`;
            this.root.style.setProperty('--atomic-star-image', starSvg);

            const separatorSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 10'><path d='M 10 5 Q 30 2, 50 5 T 90 5' fill='none' stroke='${centerCircleFill}' stroke-width='1.5'/><circle cx='50' cy='5' r='2' fill='${nsewCirclesFill}'/></svg>")`;
            this.root.style.setProperty('--atomic-separator-image', separatorSvg);

            const textureSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'><g><line x1='15' y1='15' x2='105' y2='105' stroke='${centerCircleFill}' stroke-width='0.4' opacity='0.12'/><line x1='105' y1='15' x2='15' y2='105' stroke='${centerCircleFill}' stroke-width='0.4' opacity='0.12'/><g stroke='${centerCircleFill}' stroke-width='0.8' opacity='0.22'><line x1='35' y1='35' x2='35' y2='55'/><line x1='25' y1='45' x2='45' y2='45'/><line x1='28' y1='38' x2='42' y2='52'/><line x1='42' y1='38' x2='28' y2='52'/><circle cx='35' cy='35' r='2' fill='${nsewCirclesFill}' stroke='none'/><circle cx='35' cy='55' r='2' fill='${nsewCirclesFill}' stroke='none'/><circle cx='25' cy='45' r='2' fill='${nsewCirclesFill}' stroke='none'/><circle cx='45' cy='45' r='2' fill='${nsewCirclesFill}' stroke='none'/></g><path d='M 65 52 Q 80 20, 82 20 Q 85 20, 100 52 Q 82 37, 65 52 Z' fill='${nsewCirclesFill}' fill-opacity='0.1' stroke='${nsewCirclesFill}' stroke-width='0.8' opacity='0.3'/><path d='M 80 80 L 90 80 M 85 75 L 85 85' stroke='${centerCircleFill}' stroke-width='0.6' opacity='0.22'/><circle cx='25' cy='85' r='3.5' fill='${centerCircleFill}' fill-opacity='0.15' stroke='none'/></g><g transform='translate(120,0)'><line x1='15' y1='15' x2='105' y2='105' stroke='${centerCircleFill}' stroke-width='0.4' opacity='0.12'/><line x1='105' y1='15' x2='15' y2='105' stroke='${centerCircleFill}' stroke-width='0.4' opacity='0.12'/><g stroke='${centerCircleFill}' stroke-width='0.8' opacity='0.22'><line x1='35' y1='35' x2='35' y2='55'/><line x1='25' y1='45' x2='45' y2='45'/><line x1='28' y1='38' x2='42' y2='52'/><line x1='42' y1='38' x2='28' y2='52'/><circle cx='35' cy='35' r='2' fill='${nsewCirclesFill}' stroke='none'/><circle cx='35' cy='55' r='2' fill='${nsewCirclesFill}' stroke='none'/><circle cx='25' cy='45' r='2' fill='${nsewCirclesFill}' stroke='none'/><circle cx='45' cy='45' r='2' fill='${nsewCirclesFill}' stroke='none'/></g><path d='M 82.5 17.5 Q 82.5 35, 100 35 Q 82.5 35, 82.5 52.5 Q 82.5 35, 65 35 Q 82.5 35, 82.5 17.5 Z' fill='${nsewCirclesFill}' fill-opacity='0.1' stroke='${nsewCirclesFill}' stroke-width='0.8' opacity='0.35'/><path d='M 80 80 L 90 80 M 85 75 L 85 85' stroke='${centerCircleFill}' stroke-width='0.6' opacity='0.22'/><circle cx='25' cy='85' r='3.5' fill='${centerCircleFill}' fill-opacity='0.15' stroke='none'/></g><g transform='translate(0,120)'><line x1='15' y1='15' x2='105' y2='105' stroke='${centerCircleFill}' stroke-width='0.4' opacity='0.12'/><line x1='105' y1='15' x2='15' y2='105' stroke='${centerCircleFill}' stroke-width='0.4' opacity='0.12'/><g stroke='${centerCircleFill}' stroke-width='0.8' opacity='0.22'><line x1='35' y1='35' x2='35' y2='55'/><line x1='25' y1='45' x2='45' y2='45'/><line x1='28' y1='38' x2='42' y2='52'/><line x1='42' y1='38' x2='28' y2='52'/><circle cx='35' cy='35' r='2' fill='${nsewCirclesFill}' stroke='none'/><circle cx='35' cy='55' r='2' fill='${nsewCirclesFill}' stroke='none'/><circle cx='25' cy='45' r='2' fill='${nsewCirclesFill}' stroke='none'/><circle cx='45' cy='45' r='2' fill='${nsewCirclesFill}' stroke='none'/></g><path d='M 82.5 17.5 Q 82.5 35, 100 35 Q 82.5 35, 82.5 52.5 Q 82.5 35, 65 35 Q 82.5 35, 82.5 17.5 Z' fill='${nsewCirclesFill}' fill-opacity='0.1' stroke='${nsewCirclesFill}' stroke-width='0.8' opacity='0.35'/><path d='M 80 80 L 90 80 M 85 75 L 85 85' stroke='${centerCircleFill}' stroke-width='0.6' opacity='0.22'/><circle cx='25' cy='85' r='3.5' fill='${centerCircleFill}' fill-opacity='0.15' stroke='none'/></g><g transform='translate(120,120)'><line x1='15' y1='15' x2='105' y2='105' stroke='${centerCircleFill}' stroke-width='0.4' opacity='0.12'/><line x1='105' y1='15' x2='15' y2='105' stroke='${centerCircleFill}' stroke-width='0.4' opacity='0.12'/><g stroke='${centerCircleFill}' stroke-width='0.8' opacity='0.22'><line x1='35' y1='35' x2='35' y2='55'/><line x1='25' y1='45' x2='45' y2='45'/><line x1='28' y1='38' x2='42' y2='52'/><line x1='42' y1='38' x2='28' y2='52'/><circle cx='35' cy='35' r='2' fill='${nsewCirclesFill}' stroke='none'/><circle cx='35' cy='55' r='2' fill='${nsewCirclesFill}' stroke='none'/><circle cx='25' cy='45' r='2' fill='${nsewCirclesFill}' stroke='none'/><circle cx='45' cy='45' r='2' fill='${nsewCirclesFill}' stroke='none'/></g><path d='M 65 52 Q 80 20, 82 20 Q 85 20, 100 52 Q 82 37, 65 52 Z' fill='${nsewCirclesFill}' fill-opacity='0.1' stroke='${nsewCirclesFill}' stroke-width='0.8' opacity='0.3'/><path d='M 80 80 L 90 80 M 85 75 L 85 85' stroke='${centerCircleFill}' stroke-width='0.6' opacity='0.22'/><circle cx='25' cy='85' r='3.5' fill='${centerCircleFill}' fill-opacity='0.15' stroke='none'/></g></svg>")`;
            this.root.style.setProperty('--atomic-texture-image', textureSvg);

            // Calculate banner text contrast based on the background color of the logo banner.
            const bannerBgColor = isLight ? secondaryColor : color;
            const bannerBgRgb = window.PosterUtils.hexToRgb(bannerBgColor);
            const bannerBgLuminance = bannerBgRgb ? (0.2126 * bannerBgRgb.r + 0.7152 * bannerBgRgb.g + 0.0722 * bannerBgRgb.b) / 255 : 0;
            const isBannerBgLight = bannerBgLuminance > 0.5;

            const logoTextColor = isBannerBgLight ? theme.colors.text : theme.colors.darkText;
            const logoBorderColor = isBannerBgLight ? theme.colors.text : accentColor;

            this.root.style.setProperty('--atomic-logo-text-color', logoTextColor);
            this.root.style.setProperty('--atomic-logo-border-color', logoBorderColor);
        }

        // Memphis Pop Theme dynamic SVGs & contrast calculation
        if (theme.id === 'memphis-pop') {
            const textColor = isLight ? '#111111' : '#ffffff';
            const escTextColor = encodeURIComponent(textColor);
            const escAccentColor = encodeURIComponent(accentColor);
            const escSecondaryColor = encodeURIComponent(secondaryColor);

            // Calculate banner text contrast based on the background color of the logo banner (secondaryColor)
            const secRgb = window.PosterUtils.hexToRgb(secondaryColor);
            const secLuminance = secRgb ? (0.2126 * secRgb.r + 0.7152 * secRgb.g + 0.0722 * secRgb.b) / 255 : 0;
            const logoTextColor = secLuminance > 0.5 ? '#111111' : '#ffffff';
            this.root.style.setProperty('--memphis-logo-text-color', logoTextColor);

            // 1. Dynamic SVG separator line (zigzag squiggle)
            const separatorSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 20'><path d='M 5 10 L 20 4 L 35 16 L 50 4 L 65 16 L 80 4 L 95 10' fill='none' stroke='${escAccentColor}' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/></svg>")`;
            this.root.style.setProperty('--memphis-separator-image', separatorSvg);

            // 2. Dynamic SVG background grid image
            const gridColor = isLight ? 'rgba(17, 17, 17, 0.12)' : 'rgba(255, 255, 255, 0.12)';
            const gridSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><rect width='80' height='80' fill='none'/><path d='M 80 0 L 0 0 0 80' fill='none' stroke='${encodeURIComponent(gridColor)}' stroke-width='1.5'/></svg>")`;
            this.root.style.setProperty('--memphis-grid-image', gridSvg);

            // 3. Dynamic Sway Layers corners
            // Top-Left corner SVG composition
            const topLeftSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><polygon points='30,30 110,30 70,110' fill='black' opacity='0.85'/><polygon points='20,20 100,20 60,100' fill='${escSecondaryColor}' stroke='${escTextColor}' stroke-width='4' stroke-linejoin='bevel'/><polygon points='40,40 80,40 60,80' fill='none' stroke='${escTextColor}' stroke-width='3'/><circle cx='100' cy='70' r='30' fill='${escAccentColor}' stroke='${escTextColor}' stroke-width='4'/><path d='M 120 20 L 120 60 M 130 20 L 130 60 M 140 20 L 140 60 M 110 30 L 150 30 M 110 40 L 150 40 M 110 50 L 150 50' stroke='${escTextColor}' stroke-width='2' opacity='0.7'/><path d='M 20 110 Q 40 90, 60 110 T 100 110 T 140 110' fill='none' stroke='${escTextColor}' stroke-width='6' stroke-linecap='round'/><circle cx='40' cy='60' r='4' fill='${escTextColor}'/><circle cx='55' cy='50' r='4' fill='${escTextColor}'/><circle cx='70' cy='65' r='4' fill='${escTextColor}'/><circle cx='30' cy='90' r='5' fill='${escAccentColor}'/><circle cx='130' cy='120' r='8' fill='${escSecondaryColor}' stroke='${escTextColor}' stroke-width='2'/></svg>")`;
            this.root.style.setProperty('--memphis-sway-top-left', topLeftSvg);

            // Top-Right corner SVG composition
            const topRightSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><g fill='none' stroke='${escTextColor}' stroke-width='3'><line x1='60' y1='10' x2='140' y2='10'/><line x1='60' y1='20' x2='140' y2='20'/><line x1='60' y1='30' x2='140' y2='30'/><line x1='60' y1='40' x2='140' y2='40'/><line x1='60' y1='50' x2='140' y2='50'/></g><rect x='30' y='50' width='70' height='70' rx='5' fill='black' opacity='0.85'/><rect x='20' y='40' width='70' height='70' rx='5' fill='${escSecondaryColor}' stroke='${escTextColor}' stroke-width='4'/><polygon points='90,80 130,120 70,120' fill='${escAccentColor}' stroke='${escTextColor}' stroke-width='4'/><circle cx='120' cy='90' r='18' fill='none' stroke='${escTextColor}' stroke-width='5'/><path d='M 20 130 Q 40 110, 60 130 T 100 130' fill='none' stroke='${escAccentColor}' stroke-width='4' stroke-linecap='round'/><circle cx='80' cy='25' r='5' fill='${escSecondaryColor}'/><circle cx='150' cy='70' r='3.5' fill='${escTextColor}'/></svg>")`;
            this.root.style.setProperty('--memphis-sway-top-right', topRightSvg);

            // Bottom-Left corner SVG composition
            const bottomLeftSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><circle cx='60' cy='90' r='35' fill='black' opacity='0.85'/><circle cx='50' cy='80' r='35' fill='${escAccentColor}' stroke='${escTextColor}' stroke-width='4'/><polygon points='80,30 130,70 90,110' fill='${escSecondaryColor}' stroke='${escTextColor}' stroke-width='4'/><path d='M 10 50 L 30 30 L 50 70 L 70 30 L 90 70' fill='none' stroke='${escTextColor}' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/><path d='M 10 60 L 30 40 L 50 80 L 70 40 L 90 80' fill='none' stroke='${escAccentColor}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' opacity='0.75'/><circle cx='130' cy='130' r='14' fill='none' stroke='${escTextColor}' stroke-width='4'/><g stroke='${escTextColor}' stroke-width='3'><line x1='120' y1='25' x2='130' y2='25'/><line x1='125' y1='20' x2='125' y2='30'/></g><g stroke='${escTextColor}' stroke-width='3'><line x1='20' y1='130' x2='30' y2='130'/><line x1='25' y1='125' x2='25' y2='135'/></g></svg>")`;
            this.root.style.setProperty('--memphis-sway-bottom-left', bottomLeftSvg);

            // Bottom-Right corner SVG composition
            const bottomRightSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><circle cx='105' cy='85' r='30' fill='none' stroke='black' stroke-width='16' opacity='0.85'/><circle cx='95' cy='75' r='30' fill='none' stroke='${escSecondaryColor}' stroke-width='16'/><polygon points='30,30 70,10 50,50' fill='${escAccentColor}' stroke='${escTextColor}' stroke-width='3' stroke-linejoin='round'/><g fill='none' stroke='${escAccentColor}' stroke-width='4'><line x1='20' y1='60' x2='60' y2='20'/><line x1='30' y1='70' x2='70' y2='30'/><line x1='40' y1='80' x2='80' y2='40'/><line x1='50' y1='90' x2='90' y2='50'/></g><path d='M 30 110 Q 60 80, 90 120 T 150 100' fill='none' stroke='${escTextColor}' stroke-width='5' stroke-linecap='round'/><circle cx='120' cy='30' r='6' fill='${escSecondaryColor}' stroke='${escTextColor}' stroke-width='2'/><g stroke='${escTextColor}' stroke-width='2.5'><line x1='75' y1='115' x2='85' y2='115'/><line x1='80' y1='110' x2='80' y2='120'/></g></svg>")`;
            this.root.style.setProperty('--memphis-sway-bottom-right', bottomRightSvg);

            // Side layers SVG compositions
            const leftSideSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><rect x='35' y='25' width='30' height='90' rx='15' fill='black' opacity='0.85'/><rect x='25' y='15' width='30' height='90' rx='15' fill='${escAccentColor}' stroke='${escTextColor}' stroke-width='4'/><path d='M 70 30 L 70 80 M 80 30 L 80 80 M 90 30 L 90 80 M 60 40 L 100 40 M 60 50 L 100 50 M 60 60 L 100 60 M 60 70 L 100 70' stroke='${escTextColor}' stroke-width='1.5' opacity='0.6'/><path d='M 20 120 Q 45 100, 70 120 T 120 120' fill='none' stroke='${escSecondaryColor}' stroke-width='5' stroke-linecap='round'/><circle cx='110' cy='30' r='12' fill='none' stroke='${escTextColor}' stroke-width='3'/><circle cx='110' cy='70' r='4' fill='${escTextColor}'/></svg>")`;
            this.root.style.setProperty('--memphis-sway-left-side', leftSideSvg);

            const rightSideSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><polygon points='50,30 110,10 90,90 30,70' fill='black' opacity='0.85'/><polygon points='40,20 100,0 80,80 20,60' fill='${escSecondaryColor}' stroke='${escTextColor}' stroke-width='4' stroke-linejoin='round'/><circle cx='110' cy='110' r='20' fill='none' stroke='${escAccentColor}' stroke-width='6'/><g fill='none' stroke='${escTextColor}' stroke-width='3'><line x1='20' y1='100' x2='60' y2='100'/><line x1='20' y1='110' x2='60' y2='110'/><line x1='20' y1='120' x2='60' y2='120'/></g><g stroke='${escTextColor}' stroke-width='2.5'><line x1='125' y1='45' x2='135' y2='45'/><line x1='130' y1='40' x2='130' y2='50'/></g><circle cx='130' cy='75' r='5' fill='${escTextColor}'/></svg>")`;
            this.root.style.setProperty('--memphis-sway-right-side', rightSideSvg);
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

        // Space Odyssey Swirl visibility & resource controls
        if (strength < 47) {
            this.root.style.setProperty('--space-swirl-opacity-factor', '0');
            this.root.style.setProperty('--space-swirl-display', 'none');
            this.root.style.setProperty('--space-swirl-play-state', 'paused');
        } else {
            const factor = (strength - 47) / (100 - 47);
            this.root.style.setProperty('--space-swirl-opacity-factor', factor.toFixed(4));
            this.root.style.setProperty('--space-swirl-display', 'block');
            this.root.style.setProperty('--space-swirl-play-state', 'running');
        }
    }
};
