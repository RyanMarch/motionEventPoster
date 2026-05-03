/**
 * THEMES CONFIGURATION
 * 
 * This file contains all visual identities for the Motion Backdrop Engine.
 */

(function() {
    /**
     * Helper to define a theme and minimize color repetition.
     * Only requires 'primary' and 'accent' to be defined once.
     */
    const defineTheme = (config) => {
        const { primary, accent, swatchName, ...rest } = config;
        
        return {
            ...rest,
            colors: {
                primary,
                accent,
                text: rest.colors?.text || '#ffffff',
                darkText: rest.colors?.darkText || '#1a1c1e'
            },
            swatches: [
                { hex: primary, name: swatchName || 'Original', accent },
                ...(rest.swatches || [])
            ],
            overrides: {
                // Note: bgColor and accentColor fall back to primary/accent 
                // in ThemeManager if omitted here.
                ...rest.overrides
            }
        };
    };

    window.THEMES = {
        spring: defineTheme({
            id: 'spring',
            name: 'Spring Blossom',
            icon: '🌸',
            primary: '#032858',
            accent: '#f9d783',
            swatchName: 'Original Navy',
            colors: {
                darkText: '#1a1c1e'
            },
            swatches: [
                { hex: '#1B363C', name: 'Deep Teal', accent: '#81D4FA' },
                { hex: '#3B4D35', name: 'Deep Moss', accent: '#C5E1A5' },
                { hex: '#4E3541', name: 'Deep Plum', accent: '#CE93D8' },
                { hex: '#2B2D31', name: 'Charcoal', accent: '#90CAF9' },
                { hex: '#8FA382', name: 'Sage Green', accent: '#ffffff' },
                { hex: '#F5F2EB', name: 'Warm Cream', accent: '#3b58a8' }
            ],
            fonts: {
                primary: "'Montserrat', system-ui, sans-serif",
                display: "'Cinzel Decorative', Georgia, serif",
                heading: "'Cinzel', Georgia, serif"
            },
            assets: {
                border: "url('assets/images/flower_border_transparent.svg')",
                sway1: "url('assets/images/pink-blooms-1.png')",
                sway2: "url('assets/images/pink-blooms-with-stem.png')",
                sway3: "url('assets/images/leafy-stem.png')",
                sway4: "url('assets/images/pink-blooms.png')",
                swaySide: "url('assets/images/pink-blooms-2.png')"
            },
            particles: [
                { color: '#d28282', gradient: '#b56363', type: 'petal', weight: 30, shape: '50% 10% 50% 10%' },
                { color: '#e6a4a4', gradient: '#c98585', type: 'petal', weight: 30, shape: '50% 10% 50% 10%' },
                { color: '#789c8a', gradient: '#5a7d6c', type: 'leaf', weight: 20, shape: '50% 0 50% 0' },
                { color: '#f9d783', gradient: '#dcb760', type: 'petal', weight: 10, shape: '50% 10% 50% 10%' },
                { color: '#ffffff', gradient: '#e0e0e0', type: 'petal', weight: 10, shape: '50% 10% 50% 10%' }
            ],
            frameClass: '',
            overrides: {
                insetV: 60,
                insetH: 80,
                fallSpeed: 0.6,
                maxPetals: 20,
                windiness: 20,
                hostTextSize: 1.0
            },
            defaults: {
                hostsTitle: "Thanks to our hosts",
                eventTitle: "Spring Soiree",
                eventSubtitle: "fundraiser",
                eventTopLabel: "Annual"
            },
            uiLabels: {
                particlesPlural: 'Flowers',
                particlesSingular: 'Petal',
                borderToggle: 'Hide flower border',
                gustStrength: 'Wave Strength',
                frameName: 'Floral Sway'
            }
        }),

        'digital-grid': defineTheme({
            id: 'digital-grid',
            name: 'Digital Grid',
            icon: '⚡',
            primary: '#001D39',
            accent: '#7ff9ff',
            swatchName: 'Midnight',
            colors: {
                text: '#e0e0ff',
                darkText: '#001a1a'
            },
            swatches: [
                { hex: '#250e3d', name: 'Deep Purple', accent: '#ff00ff' },
                { hex: '#2a0a1a', name: 'Cosmic Red', accent: '#ff4d4d' },
                { hex: '#000000', name: 'True Black', accent: '#ffffff' },
                { hex: '#0a2a1a', name: 'Deep Emerald', accent: '#00ff9f' },
                { hex: '#2d3436', name: 'Stardust', accent: '#ffeaa7' },
                { hex: '#F0F4F8', name: 'Solar White', accent: '#102A43' }
            ],
            fonts: {
                primary: "'Outfit', sans-serif",
                display: "'Orbitron', sans-serif",
                heading: "'Exo 2', sans-serif"
            },
            assets: {
                border: "none",
                sway1: "none",
                sway2: "none",
                sway3: "none",
                sway4: "none",
                swaySide: "none"
            },
            particles: [
                { color: '#7fffd4', gradient: '#40e0d0', type: 'star', weight: 40, shape: '50%', accentShift: 0 },
                { color: '#ff00ff', gradient: '#800080', type: 'dust', weight: 20, shape: '0%', accentShift: 120 },
                { color: '#00ffff', gradient: '#008b8b', type: 'star', weight: 30, shape: '50%', accentShift: 0 },
                { color: '#ffffff', gradient: '#cccccc', type: 'star', weight: 10, shape: '50%', isWhite: true }
            ],
            frameClass: 'theme-frame--digital-grid',
            flags: { syncParticleColors: true },
            overrides: {
                insetV: 40,
                insetH: 40,
                fallSpeed: 0.6,
                maxPetals: 20,
                windiness: 20,
                hostTextSize: 0.9,
                opacity: 0.25,
                gustStrength: 25
            },
            defaults: {
                hostsTitle: "Featured Speakers",
                eventTitle: "Global Summit",
                eventSubtitle: "Tech Conference",
                eventTopLabel: "Worldwide"
            },
            uiLabels: {
                particlesPlural: 'Particles',
                particlesSingular: 'Particle',
                borderToggle: 'Hide background frame',
                gustStrength: 'Frame Intensity',
                frameName: 'Frame'
            }
        }),

        'alpine-winter': defineTheme({
            id: 'alpine-winter',
            name: 'Alpine Winter',
            icon: '❄️',
            primary: '#1B3B57',
            accent: '#AADDFF',
            swatchName: 'Glacier Deep',
            colors: {
                darkText: '#0A1520'
            },
            swatches: [
                { hex: '#505B67', name: 'Frozen Granite', accent: '#E0E1DD' },
                { hex: '#101820', name: 'Midnight Peak', accent: '#778DA9' },
                { hex: '#4682B4', name: 'Steel Ice', accent: '#F0F4F8' },
                { hex: '#5C4B40', name: 'Alpine Cedar', accent: '#E6BE8A' },
                { hex: '#0D3B33', name: 'Evergreen Mist', accent: '#A2D9CE' },
                { hex: '#dce3e6', name: 'Snowdrift', accent: '#1B3B57' }
            ],
            fonts: {
                primary: "'Alegreya Sans', sans-serif",
                display: "Georgia, serif",
                heading: "'Alegreya Sans', sans-serif"
            },
            assets: {
                border: "none",
                sway1: "none",
                sway2: "none",
                sway3: "none",
                sway4: "none",
                swaySide: "none"
            },
            particles: [
                { color: '#FFFFFF', gradient: '#E0F7FA', type: 'star', weight: 40, shape: '50%', isWhite: true },
                { color: '#BDEFFF', gradient: '#88CCFF', type: 'star', weight: 30, shape: '50%', isWhite: true },
                { color: '#FFFFFF', gradient: '#F0F8FF', type: 'dust', weight: 20, shape: '50%', isWhite: true },
                { color: '#AADDFF', gradient: '#77BBEE', type: 'dust', weight: 10, shape: '50%', isWhite: true }
            ],
            frameClass: 'theme-frame--alpine-winter',
            overrides: {
                insetV: 50,
                insetH: 60,
                hostTextSize: 1.0,
                gustStrength: 15,
                fallSpeed: 0.4,
                maxPetals: 100,
                windiness: 5
            },
            defaults: {
                hostsTitle: "Our Host Committee",
                eventTitle: "Winter Gala",
                eventSubtitle: "Seasonal Celebration",
                eventTopLabel: "Annual"
            },
            uiLabels: {
                particlesPlural: 'Snowflakes',
                particlesSingular: 'Snowflake',
                borderToggle: 'Hide window frame',
                gustStrength: 'Frost Intensity',
                frameName: 'Frost'
            }
        }),

        'vintage-radio': defineTheme({
            id: 'vintage-radio',
            name: 'Vintage Radio',
            icon: '📻',
            primary: '#ffcc66',
            accent: '#ff0000',
            swatchName: 'Amber Glow',
            colors: {
                text: '#EADBB5',
                darkText: '#332200'
            },
            swatches: [
                { hex: '#ff9500', name: 'Radio Orange', accent: '#ff0000' },
                { hex: '#f44336', name: 'Signal Red', accent: '#ffffff' },
                { hex: '#9e9e9e', name: 'Steel Chassis', accent: '#ff0000' },
                { hex: '#e2e2e2', name: 'Lunar White', accent: '#ff0000' },
                { hex: '#7b1b1b', name: 'Bakelite', accent: '#ffcc66' },
                { hex: '#4db6ac', name: 'Tuning Teal', accent: '#ff3d00' }
            ],
            fonts: {
                primary: "'Courier New', Courier, monospace",
                display: "Impact, 'Anton', 'Oswald', sans-serif",
                heading: "'Bebas Neue', sans-serif"
            },
            assets: {
                border: "none",
                sway1: "none",
                sway2: "none",
                sway3: "none",
                sway4: "none",
                swaySide: "none"
            },
            particles: [
                { color: '#ffcc66', gradient: '#ffaa00', type: 'dust', weight: 40, shape: '50%', isWhite: true },
                { color: '#ffaa00', gradient: '#cc7700', type: 'dust', weight: 30, shape: '50%', isWhite: true },
                { color: '#ffffff', gradient: '#ffcc66', type: 'dust', weight: 20, shape: '50%', isWhite: true },
                { color: '#cc7700', gradient: '#aa4400', type: 'dust', weight: 10, shape: '50%', isWhite: true }
            ],
            frameClass: 'theme-frame--vintage-radio',
            overrides: {
                insetV: 50,
                insetH: 50,
                hostTextSize: 0.95,
                gustStrength: 30,
                fallSpeed: 0.3,
                maxPetals: 10,
                windiness: 5,
                backdropOpacity: 25
            },
            defaults: {
                hostsTitle: "OUR SPONSORS",
                eventTitle: "RADIOTHON",
                eventSubtitle: "24 HOURS OF LIVE BROADCASTING",
                eventTopLabel: "PRESENTS"
            },
            uiLabels: {
                particlesPlural: 'Dust Motes',
                particlesSingular: 'Mote',
                borderToggle: 'Hide wood cabinet',
                gustStrength: 'Tuning Intensity',
                frameName: 'Signal'
            }
        }),

        'corporate': defineTheme({
            id: 'corporate',
            name: 'Corporate Pro',
            icon: '🏢',
            primary: '#005FB8',
            accent: '#F0F4F8',
            swatchName: 'Business Blue',
            colors: {
                text: '#102A43',
                darkText: '#05021e'
            },
            swatches: [
                { hex: '#56CCF2', name: 'Sky Blue',      accent: '#e3f0fdff' },
                { hex: '#192b57ff', name: 'Onyx & Lime', accent: '#BCE29E' },
                { hex: '#111827', name: 'Tech Teal',     accent: '#41baacff' },
                { hex: '#171717', name: 'Carbon Cyan',   accent: '#A5F3FC' },
                { hex: '#064E3B', name: 'Deep Forest',   accent: '#D9F99D' },
                { hex: '#18181B', name: 'Onyx Gold',     accent: '#FDE68A' },
                { hex: '#1E1B4B', name: 'Midnight Rose', accent: '#FFE4E6' },
                { hex: '#451A03', name: 'Warm Espresso', accent: '#FFEDD5' },
                { hex: '#F0F4F8', name: 'Business Blue Rev', accent: '#005FB8' },
                { hex: '#e3f0fdff', name: 'Sky Blue Rev',      accent: '#56CCF2' },
                { hex: '#BCE29E', name: 'Onyx & Lime Rev', accent: '#192b57ff' },
                { hex: '#41baacff', name: 'Tech Teal Rev',   accent: '#111827' },
                { hex: '#A5F3FC', name: 'Carbon Cyan Rev',   accent: '#171717' },
                { hex: '#D9F99D', name: 'Deep Forest Rev',   accent: '#064E3B' },
                { hex: '#FDE68A', name: 'Onyx Gold Rev',     accent: '#18181B' },
            // { hex: '#FFEDD5', name: 'Warm Espresso Rev', accent: '#451A03' },
                { hex: '#FFE4E6', name: 'Midnight Rose Rev', accent: '#1E1B4B' }
            ],
            fonts: {
                primary: "'Inter', sans-serif",
                display: "'Inter', sans-serif",
                heading: "'Inter', sans-serif"
            },
            assets: {
                border: "none",
                sway1: "none",
                sway2: "none",
                sway3: "none",
                sway4: "none",
                swaySide: "none"
            },
            particles: [
                { useThemePrimary: true, type: 'dust', weight: 60, shape: '50%', isWhite: false },
                { useThemeAccent: true, type: 'dust', weight: 40, shape: '50%', isWhite: false }
            ],
            frameClass: 'theme-frame--corporate',
            flags: { useAccentAsBackground: true, syncParticleColors: true },
            overrides: {
                insetV: 60,
                insetH: 80,
                hostTextSize: 1.0,
                gustStrength: 75,
                fallSpeed: 0.3,
                maxPetals: 18,
                windiness: 10,
                backdropOpacity: 85
            },
            defaults: {
                hostsTitle: "PARTNERS",
                eventTitle: "Corporate Event",
                eventSubtitle: "Strategy Session",
                eventTopLabel: "Annual"
            },
            uiLabels: {
                particlesPlural: 'Particles',
                particlesSingular: 'Particle',
                borderToggle: 'Hide Background Swooshes',
                gustStrength: 'Swoosh Intensity',
                frameName: 'Swooshes'
            }
        })
    };
})();
