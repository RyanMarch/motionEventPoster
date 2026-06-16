/**
 * THEMES CONFIGURATION
 * 
 * This file contains all visual identities for the Motion Backdrop Engine.
 */

(function () {
    window.THEME_PACKS = {
        standard: { name: 'Standard Pack', icon: '📦' },
        party: { name: 'Party Pack', icon: '🥳' },
        decades: { name: 'Decades Pack', icon: '🪩' },
        specialty: { name: 'Specialty Pack', icon: '🌌' },
        holiday: { name: 'Holiday Pack', icon: '🎃' }
    };

    /**
     * Helper to define a theme and minimize color repetition.
     * Only requires 'primary' and 'accent' to be defined once.
     */
    const defineTheme = (config) => {
        const { primary, accent, secondary, swatchName, pack, ...rest } = config;

        return {
            ...rest,
            pack: pack || 'standard',
            colors: {
                primary,
                accent,
                secondary,
                text: rest.colors?.text || '#ffffff',
                darkText: rest.colors?.darkText || '#1a1c1e'
            },
            swatches: [
                { hex: primary, name: swatchName || 'Original', accent, secondary },
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
            pack: 'standard',
            icon: '🌸',
            primary: '#032858',
            accent: '#f9d783',
            swatchName: 'Navy',
            colors: {
                darkText: '#1a1c1e'
            },
            swatches: [
                { hex: '#1B363C', name: 'Teal', accent: '#81D4FA' },
                { hex: '#3B4D35', name: 'Moss', accent: '#C5E1A5' },
                { hex: '#4E3541', name: 'Plum', accent: '#CE93D8' },
                { hex: '#2B2D31', name: 'Charcoal', accent: '#90CAF9' },
                { hex: '#8FA382', name: 'Sage', accent: '#ffffff' },
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
                hostTextSize: 1.0,
                hostMaxWidth: 115
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
            pack: 'standard',
            icon: '⚡',
            primary: '#001D39',
            accent: '#7ff9ff',
            swatchName: 'Midnight',
            colors: {
                text: '#e0e0ff',
                darkText: '#001a1a'
            },
            swatches: [
                { hex: '#250e3d', name: 'Purple', accent: '#ff00ff' },
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
                hostTextSize: 1.2,
                opacity: 0.25,
                gustStrength: 25,
                hostMaxWidth: 120
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
            pack: 'standard',
            icon: '❄️',
            primary: '#1B3B57',
            accent: '#AADDFF',
            swatchName: 'Glacier',
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
                hostTextSize: 0.95,
                gustStrength: 15,
                fallSpeed: 0.4,
                maxPetals: 80,
                windiness: 5,
                hostMaxWidth: 112,
                backdropOpacity: 65
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
            pack: 'standard',
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
                backdropOpacity: 50
            },
            defaults: {
                hostsTitle: "Musical Guests",
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
            pack: 'standard',
            icon: '🏢',
            primary: '#005FB8',
            accent: '#F0F4F8',
            swatchName: 'Business Blue',
            colors: {
                text: '#0D2034',
                darkText: '#05021e'
            },
            swatches: [
                { hex: '#56CCF2', name: 'Sky Blue', accent: '#e3f0fdff' },
                { hex: '#192b57ff', name: 'Onyx & Lime', accent: '#BCE29E' },
                { hex: '#111827', name: 'Tech Teal', accent: '#41baacff' },
                { hex: '#171717', name: 'Carbon Cyan', accent: '#A5F3FC' },
                { hex: '#064E3B', name: 'Deep Forest', accent: '#D9F99D' },
                { hex: '#18181B', name: 'Onyx Gold', accent: '#FDE68A' },
                { hex: '#1E1B4B', name: 'Midnight Rose', accent: '#FFE4E6' },
                { hex: '#451A03', name: 'Warm Espresso', accent: '#FFEDD5' },
                { hex: '#F0F4F8', name: 'Business Blue Reverse', accent: '#005FB8' },
                { hex: '#e3f0fdff', name: 'Sky Blue Reverse', accent: '#56CCF2' },
                { hex: '#BCE29E', name: 'Onyx & Lime Reverse', accent: '#192b57ff' },
                { hex: '#41baacff', name: 'Tech Teal Reverse', accent: '#111827' },
                { hex: '#A5F3FC', name: 'Carbon Cyan Reverse', accent: '#171717' },
                { hex: '#D9F99D', name: 'Deep Forest Reverse', accent: '#064E3B' },
                { hex: '#FDE68A', name: 'Onyx Gold Reverse', accent: '#18181B' },
                // { hex: '#FFEDD5', name: 'Warm Espresso Reverse', accent: '#451A03' },
                { hex: '#FFE4E6', name: 'Midnight Rose Reverse', accent: '#1E1B4B' }
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
                insetV: 80,
                insetH: 80,
                hostTextSize: 1.15,
                gustStrength: 75,
                fallSpeed: 0.3,
                maxPetals: 18,
                windiness: 10,
                backdropOpacity: 85,
                hostMaxWidth: 143
            },
            defaults: {
                hostsTitle: "PARTNERS",
                eventTitle: "Corporate Event",
                eventSubtitle: "Strategy Session",
                eventTopLabel: "ANNUAL"
            },
            uiLabels: {
                particlesPlural: 'Particles',
                particlesSingular: 'Particle',
                borderToggle: 'Hide Background Shapes',
                gustStrength: 'Shape Movement Intensity',
                frameName: 'Shapes'
            }
        }),

        'retro-wave': defineTheme({
            id: 'retro-wave',
            name: 'Retro Wave',
            pack: 'decades',
            icon: '🌴',
            primary: '#180030',
            accent: '#ff007f',
            secondary: '#00ffff',
            swatchName: 'Neon Pink',
            colors: {
                text: '#ffffff',
                darkText: '#180030'
            },
            swatches: [
                { hex: '#0b111e', name: 'Grid Runner', accent: '#00d2ff', secondary: '#ffb703' },
                { hex: '#002a3a', name: 'Miami', accent: '#00f0ff', secondary: '#ff007f' },
                { hex: '#2b001d', name: 'Sunset', accent: '#ffea00', secondary: '#ff007f' },
                { hex: '#09001b', name: 'Synthwave', accent: '#bd00ff', secondary: '#00ffff' },
                { hex: '#051a05', name: 'Radioactive', accent: '#39ff14', secondary: '#ff007f' },
                { hex: '#0c0c00', name: 'Cyberpunk', accent: '#ffe600', secondary: '#00ffff' },
                { hex: '#0b001a', name: 'Indigo', accent: '#ff00ff', secondary: '#00ffcc' },
                { hex: '#140024', name: 'Arcade', accent: '#ff0055', secondary: '#ffaa00' },
                { hex: '#ffd6e8', name: 'Flamingo', accent: '#ff007f', secondary: '#00ffff' },
                { hex: '#d6fdf6', name: 'Mint', accent: '#009492ff', secondary: '#7b2cbf' },
                { hex: '#e5dbff', name: 'Vapor', accent: '#ff00c8', secondary: '#00d2ff' },
                { hex: '#fdf5e6', name: 'Dunes', accent: '#ff6600', secondary: '#00a8cc' },
                { hex: '#ffe4e6', name: 'Sunset', accent: '#f489faff', secondary: '#ff007f' },
                { hex: '#2c0012', name: 'Overdrive', accent: '#ff0055', secondary: '#00ffcc' },
                { hex: '#18002a', name: 'Supernova', accent: '#ffd700', secondary: '#ff00ff' },
                { hex: '#0d1e0d', name: 'Dream', accent: '#adff2f', secondary: '#ff00ff' }
            ],
            fonts: {
                primary: "'ITC Avant Garde Gothic', 'Avant Garde', 'Century Gothic', 'Futura', 'Jost', sans-serif",
                display: "'Audiowide', sans-serif",
                heading: "'Yellowtail', cursive"
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
                { color: '#ff007f', gradient: '#a80054', type: 'triangle', weight: 35 },
                { color: '#00ffff', gradient: '#00a8a8', type: 'square', weight: 35 },
                { color: '#ffff00', gradient: '#a8a800', type: 'star', weight: 20 },
                { color: '#ffffff', gradient: '#cccccc', type: 'dust', weight: 10, isWhite: true }
            ],
            frameClass: 'theme-frame--retro-wave',
            flags: { syncParticleColors: true },
            overrides: {
                insetV: 40,
                insetH: 40,
                hostTextSize: 1.1,
                gustStrength: 50,
                fallSpeed: 0.5,
                maxPetals: 15,
                windiness: 12,
                backdropOpacity: 70,
                hostMaxWidth: 130
            },
            defaults: {
                hostsTitle: "Vaporwave Visionaries",
                eventTitle: "Retro Wave",
                eventSubtitle: "Neon Nights & Good Vibes",
                eventTopLabel: "Radical"
            },
            uiLabels: {
                particlesPlural: 'Particles',
                particlesSingular: 'Particle',
                borderToggle: 'Hide VHS scanlines & grid',
                gustStrength: 'Glitch Intensity',
                frameName: 'Scanlines'
            }
        }),

        'cinema': defineTheme({
            id: 'cinema',
            name: 'Cinema Premiere',
            pack: 'specialty',
            icon: '🍿',
            primary: '#0A0A0A',
            accent: '#FFD700',
            secondary: '#8B0000',
            swatchName: 'Velvet Premiere',
            colors: {
                text: '#ffffff',
                darkText: '#111111'
            },
            swatches: [
                { hex: '#050B14', name: 'Cosmic', accent: '#00D2FF', secondary: '#16223F' },
                { hex: '#0D0905', name: 'Golden Age', accent: '#F4D068', secondary: '#7C5315' },
                { hex: '#0A0A0A', name: 'Noir', accent: '#ECEFF1', secondary: '#5A2E32' },
                { hex: '#060A07', name: 'Emerald Palace', accent: '#E5BA5C', secondary: '#123C24' },
                { hex: '#0B0612', name: 'Arthouse', accent: '#39FF14', secondary: '#4B1263' },
                { hex: '#0A080D', name: 'Technicolor', accent: '#FF597B', secondary: '#0D3A37' }
            ],
            fonts: {
                primary: "'Bebas Neue', sans-serif",
                display: "'Limelight', Georgia, serif",
                heading: "'Yesteryear', cursive"
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
                { color: '#ffffff', gradient: '#cccccc', type: 'dust', weight: 60, shape: '50%', isWhite: true },
                { color: '#e0e0e0', gradient: '#999999', type: 'dust', weight: 15, shape: '50%', isWhite: true },
                { color: '#fffbec', gradient: '#ffd700', type: 'popcorn', weight: 25, shape: '50%', isWhite: true, speedMultiplier: 3.8, massMultiplier: 2.6, rotSpeedMultiplier: 1.8, sizeMultiplier: 2.8 }
            ],
            frameClass: 'theme-frame--cinema',
            flags: { showSecondaryAsSwatch: true },
            overrides: {
                insetV: 95,
                insetH: 130,
                hostTextSize: 1.0,
                gustStrength: 10,
                fallSpeed: 0.15, // Theatre dust floats slowly
                maxPetals: 20,
                windiness: 1,   // Quiet air inside
                backdropOpacity: 0,
                hostMaxWidth: 110
            },
            defaults: {
                hostsTitle: "Starring",
                eventTitle: "Cinema Premiere",
                eventSubtitle: "Featured Screening",
                eventTopLabel: "Now Showing"
            },
            uiLabels: {
                particlesPlural: 'Motes & Popcorn',
                particlesSingular: 'Particle',
                borderToggle: 'Hide velvet curtains',
                gustStrength: 'Marquee Brightness',
                frameName: 'Marquee Glow'
            }
        }),

        'electric-pulse': defineTheme({
            id: 'electric-pulse',
            name: 'Electric Pulse',
            pack: 'party',
            icon: '🎸',
            primary: '#0B191E',
            accent: '#00FF88',
            secondary: '#FFD700',
            swatchName: 'Echo Forest',
            colors: {
                text: '#ffffff',
                darkText: '#090714'
            },
            swatches: [
                { hex: '#090714', name: 'Main Stage', accent: '#FF1A75', secondary: '#00F2FE' },
                { hex: '#140505', name: 'Twilight', accent: '#FF3C00', secondary: '#FFCC00' },
                { hex: '#0D0B1C', name: 'Aftershock', accent: '#FF7A00', secondary: '#FF1A75' },
                { hex: '#000000', name: 'Rave', accent: '#00FFCC', secondary: '#9600a7ff' },
                { hex: '#160824', name: 'Violet', accent: '#CC00FF', secondary: '#00FFFF' },
                { hex: '#050C1A', name: 'Subzero', accent: '#0084ffff', secondary: '#46dbf5ff' },
                { hex: '#0F081D', name: 'Hyperpop', accent: '#8ACE00', secondary: '#d7ffd7ff' },
                { hex: '#1F3540', name: 'Deep Tech', accent: '#00FFCC', secondary: '#FF007F' },
                { hex: '#32303F', name: 'Steel Pulse', accent: '#FF7A00', secondary: '#00F2FE' },
                { hex: '#FFF5F8', name: 'Dayglow', accent: '#FF1A75', secondary: '#00F2FE' },
                { hex: '#F0F9FF', name: 'Static', accent: '#7B2CBF', secondary: '#FF007F' },
                { hex: '#FDFFE0', name: 'Acid Sun', accent: '#9D00FF', secondary: '#00E5FF' },
                { hex: '#FFF6F0', name: 'Solar Flares', accent: '#FF5E00', secondary: '#FF007F' },
                { hex: '#EFFFFB', name: 'Mint Glitch', accent: '#00B3A6', secondary: '#0066FF' },
                { hex: '#B5B8C0', name: 'Concrete', accent: '#FF1A75', secondary: '#00E5FF' },
                { hex: '#C8B195', name: 'Desert Laser', accent: '#9D00FF', secondary: '#FF3C00' },
            ],
            fonts: {
                primary: "'Archivo Black', sans-serif",
                display: "'Bungee Shade', sans-serif",
                heading: "'Bungee Inline', sans-serif"
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
                { color: '#FF1A75', gradient: '#B30047', type: 'confetti', weight: 40 },
                { color: '#00F2FE', gradient: '#00A8B3', type: 'confetti', weight: 30 },
                { color: '#FFD700', gradient: '#B39600', type: 'confetti', weight: 20 },
                { useThemeAccent: true, type: 'laser', weight: 25 }
            ],
            frameClass: 'theme-frame--electric-pulse',
            flags: { syncParticleColors: true, showAccentAsSwatch: true },
            overrides: {
                insetV: 65,
                insetH: 40,
                hostTextSize: 1.1,
                gustStrength: 45,
                fallSpeed: 0.6,
                maxPetals: 65,
                windiness: 12,
                backdropOpacity: 0,
                hostMaxWidth: 123
            },
            defaults: {
                hostsTitle: "Special Guests",
                eventTitle: "ELECTRIC PULSE",
                eventSubtitle: "LIVE MUSIC FESTIVAL",
                eventTopLabel: "PRESENTS"
            },
            uiLabels: {
                particlesPlural: 'Confetti & Lasers',
                particlesSingular: 'Confetti Piece',
                borderToggle: 'Hide Stage Scaffold',
                gustStrength: 'Light & Stage Motion',
                frameName: 'Stage Movement'
            }
        }),

        'celebration': defineTheme({
            id: 'celebration',
            name: 'Celebration',
            pack: 'party',
            icon: '🎉',
            primary: '#100520', // Vibrant deep night background
            accent: '#FF007F',  // Hot magenta
            secondary: '#00E5FF', // Bright cyan
            swatchName: 'Party Time',
            colors: {
                text: '#ffffff',
                darkText: '#100520'
            },
            swatches: [
                { hex: '#0F1A1C', name: 'Golden Jubilee', accent: '#FFD700', secondary: '#F8F9FA' },
                { hex: '#21092F', name: 'Parade', accent: '#FF5E00', secondary: '#FFC400' },
                { hex: '#0B0C10', name: 'Midnight Sparkler', accent: '#00E5FF', secondary: '#FFD700' },
                { hex: '#071E22', name: 'Festival Glow', accent: '#ADFF2F', secondary: '#FF007F' },
                { hex: '#FFF9E6', name: 'Confetti Pop', accent: '#FF3F80', secondary: '#3F51B5' },
                { hex: '#FFF0F6', name: 'Candy Land', accent: '#9C27B0', secondary: '#00BCD4' },
                { hex: '#FAF5EC', name: 'Champagne Toast', accent: '#D4AF37', secondary: '#5D4037' }
            ],
            fonts: {
                primary: "'Nunito', system-ui, sans-serif",
                display: "'Pacifico', cursive",
                heading: "'Chewy', cursive"
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
                { color: '#FF007F', gradient: '#D00060', type: 'confetti-magenta', weight: 20 },
                { color: '#00E5FF', gradient: '#00B0D0', type: 'confetti-cyan', weight: 20 },
                { color: '#FFD700', gradient: '#D5A600', type: 'confetti-yellow', weight: 20 },
                { color: '#9D00FF', gradient: '#7500C0', type: 'confetti-purple', weight: 15 },
                { color: '#FF6B6B', gradient: '#D04B4B', type: 'confetti-red', weight: 15 },
                { color: '#00FF66', gradient: '#00C850', type: 'confetti-green', weight: 10 },
                // Balloons (floating upwards using negative speedMultiplier - increased weights for higher density)
                { color: '#FF007F', gradient: '#FF66B2', type: 'balloon-magenta', weight: 35, speedMultiplier: -0.65, rotSpeedMultiplier: 0, massMultiplier: 1.5, sizeMultiplier: 2.2 },
                { color: '#00E5FF', gradient: '#66FFFF', type: 'balloon-cyan', weight: 35, speedMultiplier: -0.55, rotSpeedMultiplier: 0, massMultiplier: 1.4, sizeMultiplier: 2.5 },
                { color: '#FFD700', gradient: '#FFE866', type: 'balloon-yellow', weight: 35, speedMultiplier: -0.6, rotSpeedMultiplier: 0, massMultiplier: 1.6, sizeMultiplier: 2.0 }
            ],
            frameClass: 'theme-frame--celebration',
            overrides: {
                insetV: 60,
                insetH: 70,
                hostTextSize: 0.95,
                gustStrength: 40,
                fallSpeed: 0.7,
                maxPetals: 25,
                windiness: 15,
                hostMaxWidth: 115
            },
            defaults: {
                hostsTitle: "Special Guests",
                eventTitle: "Grand Celebration",
                eventSubtitle: "All-Day Party",
                eventTopLabel: "Welcome To Our"
            },
            uiLabels: {
                particlesPlural: 'Party Favors',
                particlesSingular: 'Favor',
                borderToggle: 'Hide decorations',
                gustStrength: 'Wind & Sway',
                frameName: 'Decorations'
            }
        }),

        'summer-cookout': defineTheme({
            id: 'summer-cookout',
            name: 'Summer Cookout',
            pack: 'party',
            icon: '🍔',
            primary: '#22252A',
            accent: '#D32F2F',
            secondary: '#FBC02D',
            swatchName: 'Charcoal Grill',
            colors: {
                text: '#FFF8F0',
                darkText: '#22252A'
            },
            swatches: [
                { hex: '#1A365D', name: 'Gingham Blue', accent: '#D32F2F', secondary: '#E2E8F0' },
                { hex: '#7A1A1A', name: 'Gingham Red', accent: '#D32F2F', secondary: '#F9F6F0' },
                { hex: '#1A3F2A', name: 'Watermelon Slice', accent: '#E91E63', secondary: '#E8F5E9' },
                { hex: '#2A1B14', name: 'Sunset BBQ', accent: '#E65100', secondary: '#FFE0B2' },
                { hex: '#0D3B4C', name: 'Citrus Lemonade', accent: '#FFB300', secondary: '#FFF9C4' },
                { hex: '#1E0F0A', name: 'Campfire Amber', accent: '#D84315', secondary: '#FFB13D' },
                { hex: '#004D40', name: 'Ocean Breeze', accent: '#00BFA5', secondary: '#E0F2F1' },
            ],
            fonts: {
                primary: "'PT Sans', system-ui, sans-serif",
                display: "'Lilita One', cursive, sans-serif",
                heading: "'Alfa Slab One', cursive, sans-serif"
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
                { color: '#FF7043', gradient: '#D32F2F', type: 'cookout-ember', weight: 45, speedMultiplier: -0.65, rotSpeedMultiplier: 1.2, sizeMultiplier: 0.9, massMultiplier: 1.1 },
                { color: '#FBC02D', gradient: '#FF7043', type: 'cookout-spark', weight: 35, speedMultiplier: -0.75, rotSpeedMultiplier: 1.8, sizeMultiplier: 0.7, massMultiplier: 0.9 },
                { color: '#FFF59D', gradient: '#FBC02D', type: 'cookout-firefly', weight: 20, speedMultiplier: 0.2, rotSpeedMultiplier: 0.1, sizeMultiplier: 1.2, massMultiplier: 0.5 }
            ],
            frameClass: 'theme-frame--summer-cookout',
            overrides: {
                insetV: 60,
                insetH: 70,
                hostTextSize: 1.0,
                gustStrength: 30,
                fallSpeed: 0.5,
                maxPetals: 30,
                windiness: 12,
                hostMaxWidth: 120,
                backdropOpacity: 65
            },
            defaults: {
                hostsTitle: "Thanks to our hosts",
                eventTitle: "Backyard Cookout",
                eventSubtitle: "BBQ & Drinks",
                eventTopLabel: "Annual"
            },
            uiLabels: {
                particlesPlural: 'Embers & Fireflies',
                particlesSingular: 'Ember',
                borderToggle: 'Hide string lights',
                gustStrength: 'Wind & Sway',
                frameName: 'String Lights'
            }
        }),

        'tropical-oasis': defineTheme({
            id: 'tropical-oasis',
            name: 'Tropical Oasis',
            pack: 'party',
            icon: '🌊',
            primary: '#028090',
            accent: '#f0a500',
            secondary: '#f26419',
            swatchName: 'Turquoise Water',
            colors: {
                text: '#ffffff',
                darkText: '#012a36'
            },
            swatches: [
                { hex: '#00a896', name: 'Coral Beach', accent: '#fab1a0', secondary: '#e63946' },
                { hex: '#005f73', name: 'Blue Lagoon', accent: '#ee9b00', secondary: '#ca6702' },
                { hex: '#f4a261', name: 'Sunset Pool', accent: '#e76f51', secondary: '#2a9d8f' },
                { hex: '#2ec4b6', name: 'Tropical Mojito', accent: '#c7f9cc', secondary: '#ffbf69' },
                { hex: '#f8f9fa', name: 'Flamingo Pink', accent: '#00b4d8', secondary: '#ff7096' }
            ],
            fonts: {
                primary: "'Quicksand', system-ui, sans-serif",
                display: "'Lilita One', cursive, sans-serif",
                heading: "'Fredoka', sans-serif"
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
                // Bubbles rising (negative speedMultiplier)
                { color: '#ffffff', gradient: '#e0f2f1', type: 'tropical-oasis-bubble', weight: 45, speedMultiplier: -0.55, rotSpeedMultiplier: 0.1, sizeMultiplier: 0.8, massMultiplier: 0.7, isWhite: true },
                { color: '#ffffff', gradient: '#b2dfdb', type: 'tropical-oasis-bubble-large', weight: 20, speedMultiplier: -0.65, rotSpeedMultiplier: 0.1, sizeMultiplier: 1.3, massMultiplier: 0.6, isWhite: true },
                // Beach balls (conic-gradient stripes styled in CSS)
                { color: '#ff5722', gradient: '#ffeb3b', type: 'tropical-oasis-beachball', weight: 12, speedMultiplier: 0.4, rotSpeedMultiplier: 1.5, sizeMultiplier: 2.1, massMultiplier: 1.1 },
                // Fruit slices (lemon, orange, lime)
                { color: '#ffeb3b', gradient: '#fbc02d', type: 'tropical-oasis-fruit-lemon', weight: 10, speedMultiplier: 0.5, rotSpeedMultiplier: 0.8, sizeMultiplier: 1.25, massMultiplier: 0.8 },
                { color: '#ff9800', gradient: '#f57c00', type: 'tropical-oasis-fruit-orange', weight: 8, speedMultiplier: 0.45, rotSpeedMultiplier: 0.7, sizeMultiplier: 1.35, massMultiplier: 0.9 },
                { color: '#4caf50', gradient: '#388e3c', type: 'tropical-oasis-fruit-lime', weight: 7, speedMultiplier: 0.55, rotSpeedMultiplier: 0.9, sizeMultiplier: 1.15, massMultiplier: 0.7 },
                // Splash / ripples on pool water surface
                { color: '#ffffff', gradient: '#e0f2f1', type: 'tropical-oasis-splash', weight: 25, speedMultiplier: 0.08, rotSpeedMultiplier: 0, sizeMultiplier: 1.0, massMultiplier: 0.4, isWhite: true }
            ],
            frameClass: 'theme-frame--tropical-oasis',
            overrides: {
                insetV: 60,
                insetH: 70,
                hostTextSize: 1.0,
                gustStrength: 30,
                fallSpeed: 0.3,
                maxPetals: 65,
                windiness: 2,
                hostMaxWidth: 120,
                backdropOpacity: 65
            },
            defaults: {
                hostsTitle: "Thanks to our hosts",
                eventTitle: "Pool Party",
                eventSubtitle: "Tropical Oasis",
                eventTopLabel: "Annual"
            },
            uiLabels: {
                particlesPlural: 'Pool Floats',
                particlesSingular: 'Float',
                borderToggle: 'Hide decorations',
                gustStrength: 'Water Current',
                frameName: 'Water Current'
            }
        }),

        'disco-fever': defineTheme({
            id: 'disco-fever',
            name: 'Disco Fever',
            pack: 'decades',
            icon: '🪩',
            primary: '#1A052E',
            accent: '#FBC02D',
            secondary: '#E91E63',
            swatchName: 'Original Plum',
            colors: {
                text: '#ffffff',
                darkText: '#1A052E'
            },
            swatches: [
                { hex: '#11001C', name: 'Studio 54', accent: '#FFD700', secondary: '#FAF5EC' },
                { hex: '#2A0845', name: 'Velvet Disco', accent: '#FFEB3B', secondary: '#FF007F' },
                { hex: '#0D0221', name: 'Neon Hustle', accent: '#39FF14', secondary: '#00F0FF' },
                { hex: '#260401', name: 'Boogie Nights', accent: '#FFA500', secondary: '#FF007F' },
                { hex: '#020C1B', name: 'Midnight Roller', accent: '#00FFFF', secondary: '#BD00FF' },
                { hex: '#0A0A0A', name: 'Glitter & Gold', accent: '#FFD700', secondary: '#E5E9EC' }
            ],
            fonts: {
                primary: "'Jost', system-ui, sans-serif",
                display: "'Pacifico', cursive",
                heading: "'Lilita One', cursive, sans-serif"
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
                { color: '#ffffff', gradient: '#fff5dc', type: 'disco-reflection-white', weight: 60, speedMultiplier: 0.3, sizeMultiplier: 0.8, massMultiplier: 0.5, isWhite: true },
                { color: '#FBC02D', gradient: '#FF9800', type: 'disco-reflection-gold', weight: 40, speedMultiplier: 0.3, sizeMultiplier: 0.8, massMultiplier: 0.5 }
            ],
            frameClass: 'theme-frame--disco-fever',
            flags: { syncParticleColors: true },
            overrides: {
                insetV: 60,
                insetH: 70,
                hostTextSize: 1.05,
                gustStrength: 35,
                fallSpeed: 0.4,
                maxPetals: 25,
                windiness: 6,
                hostMaxWidth: 125
            },
            defaults: {
                hostsTitle: "DJ & DANCERS",
                eventTitle: "DISCO FEVER",
                eventSubtitle: "RETRO DANCE PARTY",
                eventTopLabel: "GET DOWN AT THE"
            },
            uiLabels: {
                particlesPlural: 'Reflections',
                particlesSingular: 'Reflection',
                borderToggle: 'Hide dance floor grid',
                gustStrength: 'Spotlight Speed',
                frameName: 'Spotlight Sway'
            }
        }),

        'mardi-gras': defineTheme({
            id: 'mardi-gras',
            name: 'Mardi Gras',
            pack: 'party',
            icon: '🎭',
            primary: '#1E0035',
            accent: '#FFD700',
            secondary: '#00A86B',
            swatchName: 'Royal Night',
            colors: {
                text: '#ffffff',
                darkText: '#1E0035'
            },
            swatches: [
                { hex: '#12001F', name: 'Midnight Court', accent: '#FFD700', secondary: '#00A86B' },
                { hex: '#0A1A08', name: 'Emerald Isle', accent: '#FFD700', secondary: '#9B30FF' },
                { hex: '#1A0012', name: 'Velvet Rose', accent: '#FFD700', secondary: '#E040FB' },
                { hex: '#0D0020', name: 'Deep Indigo', accent: '#FFA500', secondary: '#00BCD4' },
                { hex: '#1A1000', name: 'Bronze Dusk', accent: '#FF8C00', secondary: '#7B68EE' },
                { hex: '#000A12', name: 'Midnight Teal', accent: '#FFD700', secondary: '#26C6DA' }
            ],
            fonts: {
                primary: "'Josefin Sans', system-ui, sans-serif",
                display: "'Cinzel Decorative', Georgia, serif",
                heading: "'Cinzel', Georgia, serif"
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
                // Gold confetti
                { color: '#FFD700', gradient: '#C8960C', type: 'mardi-gras-confetti-gold', weight: 25, speedMultiplier: 0.65, rotSpeedMultiplier: 1.8, sizeMultiplier: 0.85, massMultiplier: 1.0 },
                // Purple confetti
                { color: '#9B30FF', gradient: '#6A00C8', type: 'mardi-gras-confetti-purple', weight: 15, speedMultiplier: 0.55, rotSpeedMultiplier: 2.0, sizeMultiplier: 0.8, massMultiplier: 0.9 },
                // Green confetti
                { color: '#00A86B', gradient: '#007045', type: 'mardi-gras-confetti-green', weight: 15, speedMultiplier: 0.60, rotSpeedMultiplier: 1.6, sizeMultiplier: 0.88, massMultiplier: 1.0 },
                // Carnival beads
                { color: '#FFD700', gradient: '#FFA500', type: 'mardi-gras-bead-gold', weight: 20, speedMultiplier: 0.45, rotSpeedMultiplier: 0.3, sizeMultiplier: 1.1, massMultiplier: 1.3 },
                { color: '#9B30FF', gradient: '#6600BB', type: 'mardi-gras-bead-purple', weight: 15, speedMultiplier: 0.40, rotSpeedMultiplier: 0.3, sizeMultiplier: 1.05, massMultiplier: 1.2 },
                // Feathers – long wispy fall
                { color: '#c040ff', gradient: '#7a00cc', type: 'mardi-gras-feather-purple', weight: 12, speedMultiplier: 0.28, rotSpeedMultiplier: 0.6, sizeMultiplier: 1.4, massMultiplier: 0.5 },
                { color: '#40c060', gradient: '#1a7a30', type: 'mardi-gras-feather-green', weight: 10, speedMultiplier: 0.25, rotSpeedMultiplier: 0.5, sizeMultiplier: 1.5, massMultiplier: 0.45 },
                { color: '#FFD700', gradient: '#C89B00', type: 'mardi-gras-feather-gold', weight: 8, speedMultiplier: 0.22, rotSpeedMultiplier: 0.55, sizeMultiplier: 1.35, massMultiplier: 0.5 },
                // Gold dust sparkles
                { color: '#FFE566', gradient: '#D4A000', type: 'mardi-gras-dust-gold', weight: 20, speedMultiplier: 0.15, rotSpeedMultiplier: 0.1, sizeMultiplier: 0.5, massMultiplier: 0.3, isWhite: false }
            ],
            frameClass: 'theme-frame--mardi-gras',
            overrides: {
                insetV: 65,
                insetH: 75,
                hostTextSize: 1.2,
                gustStrength: 35,
                fallSpeed: 0.55,
                maxPetals: 45,
                windiness: 10,
                hostMaxWidth: 120,
                backdropOpacity: 60
            },
            defaults: {
                hostsTitle: "Our Distinguished Guests",
                eventTitle: "Mardi Gras",
                eventSubtitle: "Masquerade Carnival",
                eventTopLabel: "Laissez les bons temps rouler"
            },
            uiLabels: {
                particlesPlural: 'Beads & Feathers',
                particlesSingular: 'Bead',
                borderToggle: 'Hide carnival frame',
                gustStrength: 'Twirl Speed',
                frameName: 'Gold Frame'
            }
        }),

        'art-deco-gala': defineTheme({
            id: 'art-deco-gala',
            name: 'Art Deco Gala',
            pack: 'decades',
            icon: '🥂',
            primary: '#0B0B0C',
            accent: '#D4AF37',
            secondary: '#C5A059',
            swatchName: 'Roaring Black',
            colors: {
                text: '#ffffff',
                darkText: '#0B0B0C'
            },
            swatches: [
                { hex: '#1C1C1D', name: 'Gilded Onyx', accent: '#E5C158', secondary: '#B39343' },
                { hex: '#0F161E', name: 'Sapphire Deco', accent: '#F3E5AB', secondary: '#D4AF37' },
                { hex: '#220A0A', name: 'Velvet Wine', accent: '#D4AF37', secondary: '#C5A059' },
                { hex: '#0B1A12', name: 'Emerald Court', accent: '#D4AF37', secondary: '#9FC8A0' },
                // { hex: '#180C04', name: 'Midnight Copper', accent: '#B87333', secondary: '#E8C49A' },q
                { hex: '#08101E', name: 'Navy Opulence', accent: '#C0C0C0', secondary: '#A8B8C8' },
                // Light schemes
                { hex: '#F0EAD6', name: 'Parchment', accent: '#7C5C2E', secondary: '#3D2B0F' },
                { hex: '#F5E8E8', name: 'Blush Parlor', accent: '#8B3A3A', secondary: '#5C2020' },
            ],
            fonts: {
                primary: "'Josefin Sans', system-ui, sans-serif",
                display: "'Limelight', Georgia, serif",
                heading: "'Limelight', Georgia, serif"
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
                // Gold Diamonds (floating)
                { color: '#D4AF37', gradient: '#8C6F2D', type: 'art-deco-diamond', weight: 35, speedMultiplier: 0.4, sizeMultiplier: 0.85, massMultiplier: 0.6 },
                // Sparkles (twinkling star/glimmer sparkles)
                { color: '#FFECA0', gradient: '#D4AF37', type: 'art-deco-sparkle', weight: 25, speedMultiplier: 0.25, rotSpeedMultiplier: 0.8, sizeMultiplier: 1.0, massMultiplier: 0.6 },
            ],
            frameClass: 'theme-frame--art-deco-gala',
            overrides: {
                insetV: 60,
                insetH: 80,
                hostTextSize: 1.3,
                gustStrength: 20,
                fallSpeed: 0.5,
                maxPetals: 35,
                windiness: 8,
                hostMaxWidth: 143,
                backdropOpacity: 70
            },
            defaults: {
                hostsTitle: "Distinguished Patrons",
                eventTitle: "Art Deco Gala",
                eventSubtitle: "Charity Soiree",
                eventTopLabel: "The Roaring 20s"
            },
            uiLabels: {
                particlesPlural: 'Stars & Diamonds',
                particlesSingular: 'Star',
                borderToggle: 'Hide geometric frame',
                gustStrength: 'Breeze Intensity',
                frameName: 'Deco Frame'
            }
        }),
        'halloween': defineTheme({
            id: 'halloween',
            name: 'Halloween',
            pack: 'holiday',
            icon: '🎃',
            primary: '#1A0B0C',
            accent: '#FF7518',
            secondary: '#800080',
            swatchName: 'Pumpkin Spice',
            colors: {
                text: '#ffffff',
                darkText: '#1A0B0C'
            },
            swatches: [
                { hex: '#0B1A12', name: 'Toxic Slime', accent: '#39FF14', secondary: '#111111' },
                { hex: '#160824', name: 'Witchy Brew', accent: '#9D00FF', secondary: '#FF7518' },
                { hex: '#2A0808', name: 'Vampire Bite', accent: '#D32F2F', secondary: '#000000' }
            ],
            fonts: {
                primary: "'Creepster', cursive",
                display: "'Creepster', cursive",
                heading: "'Nosifer', cursive"
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
                { color: '#FF7518', gradient: '#CC5500', type: 'dust', weight: 40, speedMultiplier: 0.5, sizeMultiplier: 1.5, massMultiplier: 0.8 },
                { color: '#800080', gradient: '#4B0082', type: 'dust', weight: 30, speedMultiplier: 0.6, sizeMultiplier: 1.2, massMultiplier: 0.7 }
            ],
            frameClass: 'theme-frame--halloween',
            overrides: {
                insetV: 60,
                insetH: 80,
                hostTextSize: 1.2,
                gustStrength: 40,
                fallSpeed: 0.6,
                maxPetals: 40,
                windiness: 15,
                hostMaxWidth: 130,
                backdropOpacity: 80
            },
            defaults: {
                hostsTitle: "Enter If You Dare",
                eventTitle: "Halloween Soiree",
                eventSubtitle: "Costume Party",
                eventTopLabel: "Annual"
            },
            uiLabels: {
                particlesPlural: 'Spirits',
                particlesSingular: 'Spirit',
                borderToggle: 'Hide cobwebs',
                gustStrength: 'Eerie Wind',
                frameName: 'Haunted Frame'
            }
        }),

        // --- STANDARD PACK ---
        'minimal-elegance': defineTheme({
            id: 'minimal-elegance',
            name: 'Minimal Elegance',
            pack: 'standard',
            icon: '🖼️',
            primary: '#F5F5F7',
            accent: '#D4AF37',
            secondary: '#111111',
            swatchName: 'Gallery White',
            colors: {
                text: '#ffffff',
                darkText: '#111111'
            },
            swatches: [
                { hex: '#EBEBEB', name: 'Cool Marble', accent: '#78909C', secondary: '#263238' },
                { hex: '#FAF9F6', name: 'Warm Alabaster', accent: '#A1887F', secondary: '#3E2723' },
                { hex: '#F5F5F5', name: 'White', accent: '#050505', secondary: '#050505' },
                { hex: '#F7F4EB', name: 'Champagne Toast', accent: '#D4AF37', secondary: '#3D352E' },
                { hex: '#E8ECE9', name: 'Sage Studio', accent: '#5A6B5C', secondary: '#2B332D' },
                { hex: '#2C2226', name: 'Plum Gallery', accent: '#D3C2B0', secondary: '#FAF8F5' },
                { hex: '#1F1A17', name: 'Espresso Matte', accent: '#C6B3A1', secondary: '#FDFBF7' },
                { hex: '#212529', name: 'Midnight Navy', accent: '#1A73E8', secondary: '#F8F9FA' },
                { hex: '#111111', name: 'Onyx Black', accent: '#E5C158', secondary: '#F5F5F7' },
                { hex: '#161616', name: 'Black', accent: '#ffffff', secondary: '#ffffff' },
            ],
            fonts: {
                primary: "'Montserrat', sans-serif",
                display: "'Bodoni Moda', serif",
                heading: "'Bodoni Moda', serif"
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
                { useThemeAccent: true, type: 'dust', weight: 65, speedMultiplier: 0.18, sizeMultiplier: 0.7, massMultiplier: 0.4 },
                { useThemeSecondary: true, type: 'dust', weight: 45, speedMultiplier: 0.12, sizeMultiplier: 0.5, massMultiplier: 0.3 },
                // { useThemeAccent: true, type: 'bokeh', weight: 15, speedMultiplier: 0.08, sizeMultiplier: 2.2, massMultiplier: 0.2 }
            ],
            frameClass: 'theme-frame--minimal-elegance',
            flags: { syncParticleColors: true },
            overrides: {
                insetV: 70,
                insetH: 90,
                hostTextSize: 1,
                gustStrength: 10,
                fallSpeed: 0.2,
                maxPetals: 15,
                windiness: 3,
                hostMaxWidth: 150,
                backdropOpacity: 60
            },
            defaults: {
                hostsTitle: "Featured Artists",
                eventTitle: "Gallery Opening",
                eventSubtitle: "Modern Art Exhibition",
                eventTopLabel: "Exclusive"
            },
            uiLabels: {
                particlesPlural: 'Particles',
                particlesSingular: 'Particle',
                borderToggle: 'Hide architectural frame',
                gustStrength: 'Air Current',
                frameName: 'Gallery Frame'
            }
        }),

        // --- PARTY PACK ---
        'pixel-arcade': defineTheme({
            id: 'pixel-arcade',
            name: 'Pixel Arcade',
            pack: 'party',
            icon: '🕹️',
            primary: '#0F0F1A',
            accent: '#39FF14',
            secondary: '#FF007F',
            swatchName: 'CRT Black',
            colors: {
                text: '#ffffff',
                darkText: '#0F0F1A'
            },
            swatches: [
                { hex: '#1C0B2B', name: '16-Bit Plum', accent: '#FFEB3B', secondary: '#00FFFF' },
                { hex: '#002200', name: 'Gameboy Green', accent: '#8BAC0F', secondary: '#0F380F' },
                { hex: '#330000', name: 'Virtual Red', accent: '#FF0000', secondary: '#000000' }
            ],
            fonts: {
                primary: "'Press Start 2P', monospace",
                display: "'Press Start 2P', monospace",
                heading: "'Press Start 2P', monospace"
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
                { color: '#39FF14', gradient: '#00FF00', type: 'square', weight: 40, speedMultiplier: 0.8, sizeMultiplier: 1.5, massMultiplier: 1.2 },
                { color: '#FF007F', gradient: '#D00060', type: 'square', weight: 30, speedMultiplier: 0.9, sizeMultiplier: 1.2, massMultiplier: 1.0 },
                { color: '#00FFFF', gradient: '#00B0D0', type: 'square', weight: 30, speedMultiplier: 0.7, sizeMultiplier: 1.8, massMultiplier: 1.5 }
            ],
            frameClass: 'theme-frame--pixel-arcade',
            flags: { syncParticleColors: true },
            overrides: {
                insetV: 50,
                insetH: 50,
                hostTextSize: 0.8,
                gustStrength: 60,
                fallSpeed: 1.0,
                maxPetals: 35,
                windiness: 0,
                hostMaxWidth: 110,
                backdropOpacity: 40
            },
            defaults: {
                hostsTitle: "High Scores",
                eventTitle: "Retro Tournament",
                eventSubtitle: "Classic Gaming Night",
                eventTopLabel: "Insert Coin"
            },
            uiLabels: {
                particlesPlural: 'Pixels',
                particlesSingular: 'Pixel',
                borderToggle: 'Hide screen bezel',
                gustStrength: 'Glitch Rate',
                frameName: 'CRT Scanlines'
            }
        }),

        // --- DECADES PACK ---
        'atomic-mid-century': defineTheme({
            id: 'atomic-mid-century',
            name: 'Atomic Mid-Century',
            pack: 'decades',
            icon: '🚀',
            primary: '#F3E5AB',
            accent: '#FF7E67',
            secondary: '#00A896',
            swatchName: 'Vanilla Cream',
            colors: {
                text: '#2A1B14',
                darkText: '#F3E5AB'
            },
            swatches: [
                { hex: '#00A896', name: 'Atomic Teal', accent: '#F3E5AB', secondary: '#FF7E67' },
                { hex: '#E29578', name: 'Retro Coral', accent: '#006D77', secondary: '#FFDDD2' },
                { hex: '#83C5BE', name: 'Mint Diner', accent: '#E29578', secondary: '#EDF6F9' }
            ],
            fonts: {
                primary: "'Jost', sans-serif",
                display: "'Lobster Two', cursive",
                heading: "'Lobster Two', cursive"
            },
            assets: { border: "none", sway1: "none", sway2: "none", sway3: "none", sway4: "none", swaySide: "none" },
            particles: [
                { color: '#FF7E67', gradient: '#E25B45', type: 'star', weight: 50, speedMultiplier: 0.4, sizeMultiplier: 1.2, massMultiplier: 0.8 },
                { color: '#00A896', gradient: '#007A6D', type: 'star', weight: 30, speedMultiplier: 0.5, sizeMultiplier: 0.9, massMultiplier: 0.7 }
            ],
            frameClass: 'theme-frame--atomic',
            overrides: { insetV: 60, insetH: 70, hostTextSize: 1.1, gustStrength: 25, fallSpeed: 0.4, maxPetals: 20, windiness: 8, hostMaxWidth: 120, backdropOpacity: 80 },
            defaults: { hostsTitle: "Presented By", eventTitle: "Space Age Soiree", eventSubtitle: "1950s Cocktail Hour", eventTopLabel: "Fabulous" },
            uiLabels: { particlesPlural: 'Starbursts', particlesSingular: 'Starburst', borderToggle: 'Hide retro shapes', gustStrength: 'Breeze', frameName: 'Boomerang Frame' }
        }),

        'memphis-pop': defineTheme({
            id: 'memphis-pop',
            name: 'Memphis Pop',
            pack: 'decades',
            icon: '📺',
            primary: '#FCEEB5',
            accent: '#FF007F',
            secondary: '#00E5FF',
            swatchName: 'Saved By The Bell',
            colors: {
                text: '#111111',
                darkText: '#ffffff'
            },
            swatches: [
                { hex: '#FFFFFF', name: 'White Grid', accent: '#000000', secondary: '#FF007F' },
                { hex: '#FF007F', name: 'Hot Pink', accent: '#00E5FF', secondary: '#FCEEB5' },
                { hex: '#00E5FF', name: 'Electric Cyan', accent: '#FF007F', secondary: '#FCEEB5' }
            ],
            fonts: {
                primary: "'Space Grotesk', sans-serif",
                display: "'Bungee', sans-serif",
                heading: "'Bungee', sans-serif"
            },
            assets: { border: "none", sway1: "none", sway2: "none", sway3: "none", sway4: "none", swaySide: "none" },
            particles: [
                { color: '#FF007F', gradient: '#D00060', type: 'triangle', weight: 30, speedMultiplier: 0.7, sizeMultiplier: 1.5, massMultiplier: 1.0 },
                { color: '#00E5FF', gradient: '#00B0D0', type: 'square', weight: 30, speedMultiplier: 0.8, sizeMultiplier: 1.3, massMultiplier: 1.1 },
                { color: '#111111', gradient: '#000000', type: 'dust', weight: 40, speedMultiplier: 0.6, sizeMultiplier: 1.8, massMultiplier: 0.9 }
            ],
            frameClass: 'theme-frame--memphis',
            flags: { syncParticleColors: true },
            overrides: { insetV: 55, insetH: 65, hostTextSize: 1.0, gustStrength: 45, fallSpeed: 0.8, maxPetals: 30, windiness: 15, hostMaxWidth: 130, backdropOpacity: 90 },
            defaults: { hostsTitle: "Starring", eventTitle: "90s Dance Party", eventSubtitle: "Totally Rad", eventTopLabel: "Like," },
            uiLabels: { particlesPlural: 'Shapes', particlesSingular: 'Shape', borderToggle: 'Hide squiggles', gustStrength: 'Wackiness', frameName: 'Memphis Grid' }
        }),

        'millennium-web': defineTheme({
            id: 'millennium-web',
            name: 'Millennium Web',
            pack: 'decades',
            icon: '🌐',
            primary: '#E0F7FA',
            accent: '#00B4D8',
            secondary: '#81C784',
            swatchName: 'Frutiger Aero',
            colors: {
                text: '#004D40',
                darkText: '#E0F7FA'
            },
            swatches: [
                { hex: '#E8F5E9', name: 'Glossy Grass', accent: '#4CAF50', secondary: '#00B4D8' },
                { hex: '#F3E5F5', name: 'Cyber Grape', accent: '#9C27B0', secondary: '#03A9F4' }
            ],
            fonts: {
                primary: "'Nunito', sans-serif",
                display: "'Righteous', sans-serif",
                heading: "'Varela Round', sans-serif"
            },
            assets: { border: "none", sway1: "none", sway2: "none", sway3: "none", sway4: "none", swaySide: "none" },
            particles: [
                { color: '#ffffff', gradient: '#B2EBF2', type: 'tropical-oasis-bubble', weight: 60, speedMultiplier: -0.4, sizeMultiplier: 1.2, massMultiplier: 0.5, isWhite: true },
                { color: '#ffffff', gradient: '#E0F7FA', type: 'tropical-oasis-bubble-large', weight: 40, speedMultiplier: -0.5, sizeMultiplier: 1.8, massMultiplier: 0.6, isWhite: true }
            ],
            frameClass: 'theme-frame--aero',
            overrides: { insetV: 60, insetH: 70, hostTextSize: 1.1, gustStrength: 20, fallSpeed: 0.3, maxPetals: 40, windiness: 5, hostMaxWidth: 125, backdropOpacity: 60 },
            defaults: { hostsTitle: "Webmasters", eventTitle: "Welcome to 2000", eventSubtitle: "Surfing the Web", eventTopLabel: "Y2K" },
            uiLabels: { particlesPlural: 'Bubbles', particlesSingular: 'Bubble', borderToggle: 'Hide glossy frame', gustStrength: 'Bubble Speed', frameName: 'Aqua Glass' }
        }),

        // --- SPECIALTY PACK ---
        'space-odyssey': defineTheme({
            id: 'space-odyssey',
            name: 'Space Odyssey',
            pack: 'specialty',
            icon: '🌌',
            primary: '#050510',
            accent: '#00E5FF',
            secondary: '#B000FF',
            swatchName: 'Deep Space',
            colors: { text: '#ffffff', darkText: '#050510' },
            swatches: [
                { hex: '#000000', name: 'Event Horizon', accent: '#FF0055', secondary: '#FFAA00' },
                { hex: '#0B1021', name: 'Nebula', accent: '#FF00FF', secondary: '#00FFFF' }
            ],
            fonts: { primary: "'Exo 2', sans-serif", display: "'Orbitron', sans-serif", heading: "'Orbitron', sans-serif" },
            assets: { border: "none", sway1: "none", sway2: "none", sway3: "none", sway4: "none", swaySide: "none" },
            particles: [
                { color: '#ffffff', gradient: '#cccccc', type: 'star', weight: 70, speedMultiplier: 0.1, sizeMultiplier: 0.5, massMultiplier: 0.3, isWhite: true },
                { color: '#00E5FF', gradient: '#008899', type: 'dust', weight: 30, speedMultiplier: 0.2, sizeMultiplier: 0.8, massMultiplier: 0.4 }
            ],
            frameClass: 'theme-frame--space',
            overrides: { insetV: 50, insetH: 60, hostTextSize: 1.0, gustStrength: 10, fallSpeed: 0.15, maxPetals: 60, windiness: 2, hostMaxWidth: 130, backdropOpacity: 20 },
            defaults: { hostsTitle: "Commanders", eventTitle: "Tech Launch", eventSubtitle: "Next Generation", eventTopLabel: "Mission" },
            uiLabels: { particlesPlural: 'Stars', particlesSingular: 'Star', borderToggle: 'Hide HUD', gustStrength: 'Warp Speed', frameName: 'Sci-Fi HUD' }
        }),

        'zen-garden': defineTheme({
            id: 'zen-garden',
            name: 'Zen Garden',
            pack: 'specialty',
            icon: '🪴',
            primary: '#EBE5D9',
            accent: '#7A916F',
            secondary: '#D4A373',
            swatchName: 'Sand & Sage',
            colors: { text: '#2F3E2C', darkText: '#EBE5D9' },
            swatches: [
                { hex: '#F4F1DE', name: 'Pale Bamboo', accent: '#81B29A', secondary: '#E07A5F' },
                { hex: '#CCD5AE', name: 'Matcha', accent: '#FAEDCD', secondary: '#D4A373' }
            ],
            fonts: { primary: "'Lora', serif", display: "'Playfair Display', serif", heading: "'Playfair Display', serif" },
            assets: { border: "none", sway1: "none", sway2: "none", sway3: "none", sway4: "none", swaySide: "none" },
            particles: [
                { color: '#F2D7D5', gradient: '#E6B0AA', type: 'petal', weight: 100, speedMultiplier: 0.3, sizeMultiplier: 0.8, massMultiplier: 0.5 }
            ],
            frameClass: 'theme-frame--zen',
            overrides: { insetV: 60, insetH: 80, hostTextSize: 1.1, gustStrength: 15, fallSpeed: 0.25, maxPetals: 15, windiness: 5, hostMaxWidth: 120, backdropOpacity: 40 },
            defaults: { hostsTitle: "Guides", eventTitle: "Wellness Retreat", eventSubtitle: "Mindfulness Session", eventTopLabel: "Peaceful" },
            uiLabels: { particlesPlural: 'Petals', particlesSingular: 'Petal', borderToggle: 'Hide bamboo frame', gustStrength: 'Gentle Breeze', frameName: 'Bamboo' }
        }),

        'deep-blue': defineTheme({
            id: 'deep-blue',
            name: 'Deep Blue',
            pack: 'specialty',
            icon: '🐟',
            primary: '#011627',
            accent: '#2EC4B6',
            secondary: '#FF9F1C',
            swatchName: 'Ocean Trench',
            colors: { text: '#FDFFFC', darkText: '#011627' },
            swatches: [
                { hex: '#003049', name: 'Coral Reef', accent: '#D62828', secondary: '#F77F00' }
            ],
            fonts: { primary: "'Varela Round', sans-serif", display: "'Baloo 2', cursive", heading: "'Baloo 2', cursive" },
            assets: { border: "none", sway1: "none", sway2: "none", sway3: "none", sway4: "none", swaySide: "none" },
            particles: [
                { color: '#ffffff', gradient: '#E0F7FA', type: 'tropical-oasis-bubble', weight: 80, speedMultiplier: -0.3, sizeMultiplier: 0.9, massMultiplier: 0.6, isWhite: true },
                { color: '#2EC4B6', gradient: '#009688', type: 'dust', weight: 20, speedMultiplier: 0.1, sizeMultiplier: 0.5, massMultiplier: 0.3 }
            ],
            frameClass: 'theme-frame--deep-blue',
            overrides: { insetV: 55, insetH: 70, hostTextSize: 1.0, gustStrength: 20, fallSpeed: 0.2, maxPetals: 40, windiness: 10, hostMaxWidth: 120, backdropOpacity: 50 },
            defaults: { hostsTitle: "Marine Biologists", eventTitle: "Aquarium Gala", eventSubtitle: "Under the Sea", eventTopLabel: "Explore" },
            uiLabels: { particlesPlural: 'Bubbles', particlesSingular: 'Bubble', borderToggle: 'Hide light rays', gustStrength: 'Current', frameName: 'Water Rays' }
        }),

        'cafe-noir': defineTheme({
            id: 'cafe-noir',
            name: 'Café Noir',
            pack: 'specialty',
            icon: '☕',
            primary: '#2B1B17',
            accent: '#D4A373',
            secondary: '#FAEDCD',
            swatchName: 'Espresso',
            colors: { text: '#FAEDCD', darkText: '#2B1B17' },
            swatches: [
                { hex: '#4A3B32', name: 'Latte Macchiato', accent: '#E3D5CA', secondary: '#D5BDAF' }
            ],
            fonts: { primary: "'Cabin', sans-serif", display: "'Abril Fatface', serif", heading: "'Abril Fatface', serif" },
            assets: { border: "none", sway1: "none", sway2: "none", sway3: "none", sway4: "none", swaySide: "none" },
            particles: [
                { color: '#FAEDCD', gradient: '#D4A373', type: 'dust', weight: 100, speedMultiplier: -0.15, sizeMultiplier: 1.5, massMultiplier: 0.4, isWhite: true }
            ],
            frameClass: 'theme-frame--cafe',
            overrides: { insetV: 60, insetH: 75, hostTextSize: 1.0, gustStrength: 10, fallSpeed: 0.1, maxPetals: 25, windiness: 3, hostMaxWidth: 110, backdropOpacity: 60 },
            defaults: { hostsTitle: "Acoustic Acts", eventTitle: "Open Mic Night", eventSubtitle: "Poetry & Music", eventTopLabel: "Local" },
            uiLabels: { particlesPlural: 'Steam & Bokeh', particlesSingular: 'Mote', borderToggle: 'Hide chalkboard', gustStrength: 'Draft', frameName: 'Café Frame' }
        }),

        'steampunk-gears': defineTheme({
            id: 'steampunk-gears',
            name: 'Steampunk Gears',
            pack: 'specialty',
            icon: '⚙️',
            primary: '#2A1A12',
            accent: '#CD7F32',
            secondary: '#A89F91',
            swatchName: 'Oxidized Copper',
            colors: { text: '#F4E8D6', darkText: '#1C110C' },
            swatches: [
                { hex: '#1C110C', name: 'Brass & Soot', accent: '#B5A642', secondary: '#CD7F32' }
            ],
            fonts: { primary: "'Courier New', monospace", display: "'Rye', cursive", heading: "'Rye', cursive" },
            assets: { border: "none", sway1: "none", sway2: "none", sway3: "none", sway4: "none", swaySide: "none" },
            particles: [
                { color: '#CD7F32', gradient: '#8B4513', type: 'dust', weight: 60, speedMultiplier: 0.5, sizeMultiplier: 0.8, massMultiplier: 0.9 },
                { color: '#B5A642', gradient: '#808000', type: 'dust', weight: 40, speedMultiplier: 0.4, sizeMultiplier: 0.7, massMultiplier: 1.0 }
            ],
            frameClass: 'theme-frame--steampunk',
            overrides: { insetV: 60, insetH: 70, hostTextSize: 1.0, gustStrength: 25, fallSpeed: 0.4, maxPetals: 30, windiness: 5, hostMaxWidth: 120, backdropOpacity: 70 },
            defaults: { hostsTitle: "Inventors", eventTitle: "Clockwork Expo", eventSubtitle: "Victorian Futurism", eventTopLabel: "Marvelous" },
            uiLabels: { particlesPlural: 'Sparks', particlesSingular: 'Spark', borderToggle: 'Hide brass piping', gustStrength: 'Steam Pressure', frameName: 'Pipes & Gears' }
        }),

        // --- HOLIDAY PACK ---
        'autumn-harvest': defineTheme({
            id: 'autumn-harvest',
            name: 'Autumn Harvest',
            pack: 'holiday',
            icon: '🍂',
            primary: '#3E1C00',
            accent: '#FF7F00',
            secondary: '#FFC82A',
            swatchName: 'Burnt Maple',
            colors: { text: '#FDF0D5', darkText: '#2B1400' },
            swatches: [
                { hex: '#2C3A20', name: 'Olive Orchard', accent: '#D2691E', secondary: '#DAA520' }
            ],
            fonts: { primary: "'PT Sans', sans-serif", display: "'Rokkitt', serif", heading: "'Rokkitt', serif" },
            assets: { border: "none", sway1: "none", sway2: "none", sway3: "none", sway4: "none", swaySide: "none" },
            particles: [
                { color: '#FF7F00', gradient: '#CC5500', type: 'leaf', weight: 50, speedMultiplier: 0.35, sizeMultiplier: 1.2, massMultiplier: 0.6 },
                { color: '#FFC82A', gradient: '#DAA520', type: 'leaf', weight: 50, speedMultiplier: 0.3, sizeMultiplier: 1.1, massMultiplier: 0.5 }
            ],
            frameClass: 'theme-frame--autumn',
            overrides: { insetV: 60, insetH: 75, hostTextSize: 1.0, gustStrength: 30, fallSpeed: 0.35, maxPetals: 25, windiness: 12, hostMaxWidth: 110, backdropOpacity: 60 },
            defaults: { hostsTitle: "Farm Owners", eventTitle: "Fall Festival", eventSubtitle: "Pumpkin Patch", eventTopLabel: "Annual" },
            uiLabels: { particlesPlural: 'Leaves', particlesSingular: 'Leaf', borderToggle: 'Hide barn wood', gustStrength: 'Autumn Wind', frameName: 'Rustic Wood' }
        }),

        'valentines-romance': defineTheme({
            id: 'valentines-romance',
            name: 'Valentine\'s Romance',
            pack: 'holiday',
            icon: '💝',
            primary: '#4A001F',
            accent: '#FF4D6D',
            secondary: '#FF8FA3',
            swatchName: 'Deep Rose',
            colors: { text: '#FFF0F3', darkText: '#2D0013' },
            swatches: [
                { hex: '#FFF0F3', name: 'Sweetheart Pink', accent: '#C9184A', secondary: '#FF4D6D' }
            ],
            fonts: { primary: "'Nunito', sans-serif", display: "'Playfair Display', serif", heading: "'Playfair Display', serif" },
            assets: { border: "none", sway1: "none", sway2: "none", sway3: "none", sway4: "none", swaySide: "none" },
            particles: [
                { color: '#FF4D6D', gradient: '#C9184A', type: 'heart', weight: 70, speedMultiplier: -0.2, sizeMultiplier: 1.5, massMultiplier: 0.6 },
                { color: '#FF8FA3', gradient: '#FF4D6D', type: 'heart', weight: 30, speedMultiplier: -0.25, sizeMultiplier: 1.0, massMultiplier: 0.5 }
            ],
            frameClass: 'theme-frame--valentine',
            overrides: { insetV: 60, insetH: 70, hostTextSize: 1.05, gustStrength: 15, fallSpeed: 0.2, maxPetals: 20, windiness: 5, hostMaxWidth: 125, backdropOpacity: 50 },
            defaults: { hostsTitle: "Couples", eventTitle: "Sweetheart Dance", eventSubtitle: "Valentine's Gala", eventTopLabel: "Romantic" },
            uiLabels: { particlesPlural: 'Hearts', particlesSingular: 'Heart', borderToggle: 'Hide lace frame', gustStrength: 'Swoon Speed', frameName: 'Lace Border' }
        }),

        'lunar-new-year': defineTheme({
            id: 'lunar-new-year',
            name: 'Lunar New Year',
            pack: 'holiday',
            icon: '🏮',
            primary: '#8B0000',
            accent: '#FFD700',
            secondary: '#FF4500',
            swatchName: 'Dragon Red',
            colors: { text: '#FFF8DC', darkText: '#3B0000' },
            swatches: [
                { hex: '#1A0000', name: 'Midnight Lantern', accent: '#FFA500', secondary: '#FFD700' }
            ],
            fonts: { primary: "'Montserrat', sans-serif", display: "'Cinzel', serif", heading: "'Cinzel', serif" },
            assets: { border: "none", sway1: "none", sway2: "none", sway3: "none", sway4: "none", swaySide: "none" },
            particles: [
                { color: '#FFD700', gradient: '#B8860B', type: 'dust', weight: 60, speedMultiplier: 0.4, sizeMultiplier: 1.2, massMultiplier: 0.8 },
                { color: '#FF4500', gradient: '#8B0000', type: 'confetti', weight: 40, speedMultiplier: 0.5, sizeMultiplier: 1.0, massMultiplier: 0.9 }
            ],
            frameClass: 'theme-frame--lunar',
            overrides: { insetV: 65, insetH: 80, hostTextSize: 1.1, gustStrength: 25, fallSpeed: 0.4, maxPetals: 35, windiness: 8, hostMaxWidth: 130, backdropOpacity: 70 },
            defaults: { hostsTitle: "Honored Guests", eventTitle: "Spring Festival", eventSubtitle: "Lunar Celebration", eventTopLabel: "Prosperous" },
            uiLabels: { particlesPlural: 'Gold & Confetti', particlesSingular: 'Flake', borderToggle: 'Hide lanterns', gustStrength: 'Lantern Sway', frameName: 'Red Envelopes' }
        }),

        'festive-holiday': defineTheme({
            id: 'festive-holiday',
            name: 'Festive Holiday',
            pack: 'holiday',
            icon: '🎄',
            primary: '#0B3B24',
            accent: '#C41E3A',
            secondary: '#D4AF37',
            swatchName: 'Pine & Holly',
            colors: { text: '#F8F9FA', darkText: '#04170E' },
            swatches: [
                { hex: '#0B0B0C', name: 'Silent Night', accent: '#D4AF37', secondary: '#C41E3A' },
                { hex: '#C41E3A', name: 'Santa Red', accent: '#FFFFFF', secondary: '#0B3B24' }
            ],
            fonts: { primary: "'Outfit', sans-serif", display: "'Playfair Display', serif", heading: "'Playfair Display', serif" },
            assets: { border: "none", sway1: "none", sway2: "none", sway3: "none", sway4: "none", swaySide: "none" },
            particles: [
                { color: '#FFFFFF', gradient: '#F0F8FF', type: 'star', weight: 50, speedMultiplier: 0.3, sizeMultiplier: 0.8, massMultiplier: 0.5, isWhite: true },
                { color: '#D4AF37', gradient: '#B8860B', type: 'star', weight: 50, speedMultiplier: 0.25, sizeMultiplier: 1.0, massMultiplier: 0.6 }
            ],
            frameClass: 'theme-frame--festive',
            overrides: { insetV: 60, insetH: 75, hostTextSize: 1.0, gustStrength: 20, fallSpeed: 0.3, maxPetals: 40, windiness: 10, hostMaxWidth: 120, backdropOpacity: 65 },
            defaults: { hostsTitle: "Carolers", eventTitle: "Holiday Party", eventSubtitle: "Jingle & Mingle", eventTopLabel: "Merry" },
            uiLabels: { particlesPlural: 'Snow & Sparkles', particlesSingular: 'Flake', borderToggle: 'Hide garland', gustStrength: 'Winter Breeze', frameName: 'Pine Garland' }
        }),

        'new-years-eve': defineTheme({
            id: 'new-years-eve',
            name: 'New Year\'s Eve',
            pack: 'holiday',
            icon: '🎆',
            primary: '#050510',
            accent: '#FFD700',
            secondary: '#C0C0C0',
            swatchName: 'Midnight Gold',
            colors: { text: '#FFFFFF', darkText: '#000000' },
            swatches: [
                { hex: '#110022', name: 'Royal Countdown', accent: '#00FFFF', secondary: '#FF00FF' }
            ],
            fonts: { primary: "'Jost', sans-serif", display: "'Cinzel', serif", heading: "'Cinzel', serif" },
            assets: { border: "none", sway1: "none", sway2: "none", sway3: "none", sway4: "none", swaySide: "none" },
            particles: [
                { color: '#FFD700', gradient: '#FFF8DC', type: 'confetti', weight: 40, speedMultiplier: 0.6, sizeMultiplier: 1.1, massMultiplier: 1.0 },
                { color: '#C0C0C0', gradient: '#FFFFFF', type: 'confetti', weight: 40, speedMultiplier: 0.65, sizeMultiplier: 1.0, massMultiplier: 0.9 },
                { color: '#FFFFFF', gradient: '#FFD700', type: 'star', weight: 20, speedMultiplier: 0.2, sizeMultiplier: 1.5, massMultiplier: 0.5, isWhite: true }
            ],
            frameClass: 'theme-frame--nye',
            overrides: { insetV: 60, insetH: 70, hostTextSize: 1.1, gustStrength: 35, fallSpeed: 0.5, maxPetals: 50, windiness: 15, hostMaxWidth: 130, backdropOpacity: 85 },
            defaults: { hostsTitle: "VIP Guests", eventTitle: "NYE Countdown", eventSubtitle: "Black Tie Gala", eventTopLabel: "Cheers" },
            uiLabels: { particlesPlural: 'Confetti', particlesSingular: 'Piece', borderToggle: 'Hide fireworks', gustStrength: 'Excitement', frameName: 'Firework Glow' }
        })
    };
})();
