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
    maxPetals: 20,
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
    isAppRunning: false,
    bgColor: '#032858',
    accentColor: null,
    activeTheme: 'spring'
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
