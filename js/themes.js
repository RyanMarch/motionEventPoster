/**
 * THEMES CONFIGURATION
 * 
 * This file contains all visual identities for the Motion Backdrop Engine.
 */

(function () {
    /**
     * Helper to define a theme and minimize color repetition.
     * Only requires 'primary' and 'accent' to be defined once.
     */
    const defineTheme = (config) => {
        const { primary, accent, secondary, swatchName, ...rest } = config;

        return {
            ...rest,
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
                maxPetals: 80,
                windiness: 5,
                hostMaxWidth: 120,
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
                { hex: '#F0F4F8', name: 'Business Blue Rev', accent: '#005FB8' },
                { hex: '#e3f0fdff', name: 'Sky Blue Rev', accent: '#56CCF2' },
                { hex: '#BCE29E', name: 'Onyx & Lime Rev', accent: '#192b57ff' },
                { hex: '#41baacff', name: 'Tech Teal Rev', accent: '#111827' },
                { hex: '#A5F3FC', name: 'Carbon Cyan Rev', accent: '#171717' },
                { hex: '#D9F99D', name: 'Deep Forest Rev', accent: '#064E3B' },
                { hex: '#FDE68A', name: 'Onyx Gold Rev', accent: '#18181B' },
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
        })
    };
})();
