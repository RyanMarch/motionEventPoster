// Motion Poster docs are dark only. Pin the theme (and overwrite any stored
// "light" choice from before) so the shared toggle and the system-theme
// listener in docs-components.js never switch it.
(function () {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.removeAttribute('data-theme-mode');
    try { localStorage.setItem('theme', 'dark'); } catch (e) { /* storage unavailable */ }
})();
