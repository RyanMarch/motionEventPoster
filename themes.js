/**
 * THEMES CONFIGURATION
 * 
 * This file contains all visual identities for the Motion Backdrop Engine.
 * Add a new entry here to create a new theme.
 */

const THEMES = {
    spring: {
        id: 'spring',
        name: 'Spring Blossom',
        colors: {
            primary: '#032858',
            accent: '#f9d783',
            text: '#ffffff',
            darkText: '#1a1c1e'
        },
        swatches: [
            { hex: '#032858', name: 'Original Navy', accent: '#f9d783' },
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
            bgColor: '#032858'
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
    },
    'digital-grid': {
        id: 'digital-grid',
        name: 'Digital Grid',
        colors: {
            primary: '#001D39',
            accent: '#7ff9ff',
            text: '#e0e0ff',
            darkText: '#001a1a'
        },
        swatches: [
            { hex: '#001D39', name: 'Midnight', accent: '#7ff9ff' },
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
        overrides: {
            insetV: 40,
            insetH: 40,
            fallSpeed: 0.6,
            maxPetals: 20,
            windiness: 20,
            hostTextSize: 0.9,
            gustStrength: 25, // Default intensity for the HUD frame
            bgColor: '#001D39'
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
    },
    'alpine-winter': {
        id: 'alpine-winter',
        name: 'Alpine Winter',
        colors: {
            primary: '#1B3B57', // Richer, more vibrant icy blue
            accent: '#AADDFF', // Glowing ice accent
            text: '#FFFFFF',
            darkText: '#0A1520'
        },
        swatches: [
            { hex: '#1B3B57', name: 'Glacier Deep', accent: '#AADDFF' },
            { hex: '#505B67', name: 'Frozen Granite', accent: '#E0E1DD' }, // Silvery gray replacement
            { hex: '#101820', name: 'Midnight Peak', accent: '#778DA9' },
            { hex: '#4682B4', name: 'Steel Ice', accent: '#F0F4F8' },
            { hex: '#5C4B40', name: 'Alpine Cedar', accent: '#E6BE8A' }, // Muted, less red/pink
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
            windiness: 5,
            bgColor: '#1B3B57'
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
    }
};
