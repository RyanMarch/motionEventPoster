// Globals for file:// protocol compatibility
window.STORAGE_KEYS = {
    addedHosts: 'poster-added-hosts',
    removedHosts: 'poster-removed-hosts',
    fullscreenIntent: 'poster-fullscreen-intent',
    settings: 'poster-settings',
    hasEverAddedHost: 'poster-has-ever-added-host',
    posterText: 'poster-text-content',
};

window.DEFAULTS = {
    maxPetals: 40,
    windiness: 20,
    fallSpeed: 0.6,
    tumbleSpeed: 1,
    gustStrength: 10,
    hostTextSize: 1.0,
    hostMaxWidth: 100,
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
    autoHideMenu: true,
    smoothTransitions: true,
    isAppRunning: false,
    bgColor: null,
    accentColor: null,
    activeTheme: 'spring',
    fpsCap: 90
};

window.POSTER_TEXT_DEFAULTS = {
    logoMode: 'text',
    logoImageData: null,
    logoText: 'Organization Name or Logo Goes Here',
    hostsTitle: 'Thanks to our hosts',
    eventTopLabel: 'Annual',
    eventTitle: 'Spring Soiree',
    eventSubtitle: 'fundraiser',
    eventDate: 'Wednesday, April 1, 2050',
    qrLeftData: null,
    qrRightData: null,
};

window.TITLE_FILTER_WORDS = new Set(['the', 'honorable', 'dr.', 'mr.', 'mrs.', 'ms.']);

window.DEFAULT_HOSTS = [
    "The Honorable Alex Rivera",
    "Jordan & Casey Beaumont",
    "Dr. Morgan Ellis",
    "Sam & Taylor Hendricks",
    "The Honorable Priya Nair",
    "The Meridian Council",
    "Chris & Robin Aldridge",
    "The Honorable Simone Okafor",
    "Jamie & Peyton Walsh",
    "The Honorable Reese Caldwell",
    "Dr. Avery Sinclair",
    "Ted Waltham",
    "William S Grant",
    "Central State Foundation",
    "Blair & Quinn Harmon",
    "The Ashford Family",
    "Finley & Harper Tran",
    "The Honorable Charlie Monroe",
    "Drew & Riley Sutton",
    "The Honorable Sage Whitmore"
];

window.SHORTCUT_CONFIGS = [
    { key: 'q', label: 'Q', desc: 'Toggle Quick Controls', action: 'toggleControls' },
    { key: 'f', label: 'F', desc: 'Enter Fullscreen', action: 'toggleFullscreen' },
    { key: 'e', label: 'E', desc: 'Edit Poster Text', action: 'toggleEdit' },
    { key: 'c', label: 'C', desc: 'Customize Appearance', action: 'toggleCustomize' },
    { key: 'a', label: 'A', desc: 'Add/Remove Names', action: 'toggleHosts' },
    { key: 'r', label: 'R', desc: 'Reset to Defaults', action: 'resetDefaults', condition: 'isCustomizeOpen' },
    { key: '?', label: '?', desc: 'Show Help Menu', action: 'toggleHelp' },
    { key: '/', label: '/', desc: 'Show Help Menu', action: 'toggleHelp' },
    { key: '\\', label: '\\', desc: 'Hold to Factory Reset', action: 'factoryReset' },
    { key: 'Escape', label: 'Esc', desc: 'Close Panel / Exit Fullscreen', action: 'closeAll' }
];

window.SLIDER_CONFIGS = [
    { id: 'backdrop-opacity', label: 'Text Backdrop Strength', min: 0, max: 100, step: 1, stateKey: 'backdropOpacity', suffix: '%', sectionId: 'backdrop-ribbon-row' },
    { id: 'max-petals', label: 'Count', min: 0, max: 1000, step: 1, stateKey: 'maxPetals', sectionId: 'appearance-particles', isHalf: true },
    { id: 'gust-freq', label: 'Windiness', min: 0, max: 1000, step: 1, stateKey: 'windiness', sectionId: 'appearance-particles', isHalf: true },
    { id: 'fall-speed', label: 'Fall Speed', min: 0, max: 5, step: 0.1, stateKey: 'fallSpeed', suffix: 'x', sectionId: 'appearance-particles', isHalf: true },
    { id: 'tumble-speed', label: 'Tumble Speed', min: 0, max: 10, step: 0.5, stateKey: 'tumbleSpeed', suffix: 'x', sectionId: 'appearance-particles', isHalf: true },
    { id: 'gust-strength', label: 'Intensity', min: 0, max: 100, step: 1, stateKey: 'gustStrength', sectionId: 'appearance-intensity' },
    { id: 'host-text-size', label: 'Size', min: 0.5, max: 2, step: 0.05, stateKey: 'hostTextSize', suffix: 'x', sectionId: 'appearance-text-sliders', isHalf: true },
    { id: 'host-max-width', label: 'Max Width', min: 20, max: 200, step: 1, stateKey: 'hostMaxWidth', suffix: '%', sectionId: 'appearance-text-sliders', isHalf: true },
    { id: 'inset-v', label: 'Vertical Spacing', min: 0, max: 200, step: 1, stateKey: 'insetV', suffix: 'px', sectionId: 'appearance-text-sliders', isHalf: true },
    { id: 'inset-h', label: 'Horizontal Spacing', min: 0, max: 200, step: 1, stateKey: 'insetH', suffix: 'px', sectionId: 'appearance-text-sliders', isHalf: true }
];
