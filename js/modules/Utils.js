/**
 * Utility functions attached to window for local file compatibility.
 */
window.PosterUtils = {
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 3, g: 40, b: 88 };
    },

    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s, l };
    },

    hslToHex(h, s, l) {
        h /= 360;
        let r, g, b;
        if (s === 0) { r = g = b = l; } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1; if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
        }
        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    },

    isDark(color) {
        const rgb = this.hexToRgb(color);
        const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
        return luminance < 0.5;
    },

    deriveAccentColor(hex) {
        const rgb = this.hexToRgb(hex);
        let { h, s, l } = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        s = Math.max(s, 0.85);
        l = Math.max(l, 0.75);
        if (s < 0.1) { h = 180; s = 0.8; l = 0.8; }
        return this.hslToHex(h, s, l);
    },

    formatFullscreenTimer(seconds, isStartTime) {
        if (seconds === null && !isStartTime) return "-:--";
        let elapsed = seconds || 0;
        if (isStartTime) elapsed = Math.floor((Date.now() - isStartTime) / 1000);
        return `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
    },

    readFileAsDataURL(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const img = new Image();
            img.onload = () => callback(dataUrl);
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    }
};
