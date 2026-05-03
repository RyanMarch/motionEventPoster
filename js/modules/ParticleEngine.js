/**
 * ParticleEngine handles the physics and rendering of background particles.
 */
window.ParticleEngine = class ParticleEngine {
    constructor(poster) {
        this.poster = poster;
    }

    get state() { return this.poster.state; }
    get layers() { return this.poster.layers; }
    get elements() { return this.poster.elements; }
    get petalTypes() { return this.poster.petalTypes; }

    adjustAmbientPetals() {
        const currentCount = this.state.petals.length;
        if (currentCount > this.state.maxPetals) {
            const toRemove = currentCount - this.state.maxPetals;
            for (let index = 0; index < toRemove; index += 1) {
                const petal = this.state.petals.pop();
                petal?.element?.remove();
            }
            return;
        }
        if (currentCount < this.state.maxPetals) {
            const toAdd = this.state.maxPetals - currentCount;
            for (let index = 0; index < toAdd; index += 1) {
                this.state.petals.push(this.createPetal());
            }
        }
    }

    createPetal() {
        const container = this.getRandomLayer();
        const element = document.createElement('div');
        element.className = 'petal';
        const size = Math.random() * 12 + 10;
        const type = this.getRandomPetalType();
        element.style.width = `${size}px`;
        element.style.height = `${size * (type.type === 'star' || type.type === 'dust' ? 1.0 : 1.25)}px`;
        
        let color = type.color;
        let gradient = type.gradient;

        // Dynamic adaptation for theme particles
        if (type.useThemePrimary) {
            color = this.state.bgColor || this.poster.theme.colors.primary;
            const rgb = window.PosterUtils.hexToRgb(color);
            const { h, s, l } = window.PosterUtils.rgbToHsl(rgb.r, rgb.g, rgb.b);
            gradient = window.PosterUtils.hslToHex(h, s, l * 0.7);
        } else if (type.useThemeAccent) {
            color = this.state.accentColor || this.poster.theme.colors.accent;
            const rgb = window.PosterUtils.hexToRgb(color);
            const { h, s, l } = window.PosterUtils.rgbToHsl(rgb.r, rgb.g, rgb.b);
            gradient = window.PosterUtils.hslToHex(h, s, l * 0.7);
        } else if (this.poster.theme.id === 'digital-grid') {
            const accent = this.state.accentColor || this.poster.theme.colors.accent;
            if (type.isWhite) {
                // Keep whites/grays as neutral accents
            } else if (type.accentShift !== undefined) {
                const rgb = window.PosterUtils.hexToRgb(accent);
                let { h, s, l } = window.PosterUtils.rgbToHsl(rgb.r, rgb.g, rgb.b);
                
                // Shift hue by the theme-defined amount
                h = (h + type.accentShift) % 360;
                
                // Ensure it stays vibrant even if background is dark/muted
                s = Math.max(s, 0.8);
                l = Math.max(l, 0.6);
                
                color = window.PosterUtils.hslToHex(h, s, l);
                gradient = window.PosterUtils.hslToHex(h, s, l * 0.7);
            }
        }

        element.style.background = `linear-gradient(135deg, ${color}, ${gradient})`;
        element.style.borderRadius = type.shape || '50%';
        if (type.isWhite) {
            element.classList.add('is-white');
        }
        if (Math.random() > 0.7) {
            element.classList.add('is-blurred');
            element.style.opacity = '0.6';
        }
        container.appendChild(element);
        return {
            element,
            accentShift: type.accentShift,
            useThemePrimary: type.useThemePrimary,
            useThemeAccent: type.useThemeAccent,
            isWhite: type.isWhite,
            x: Math.random() * 120 - 10,
            y: Math.random() * 140 - 20,
            mass: Math.random() * 0.8 + 0.4,
            aero: Math.random() * 0.5 + 0.5,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 100,
            baseFallSpeed: Math.random() * 15 + 5,
            naturalDrift: (Math.random() - 0.5) * 5,
        };
    }

    getRandomPetalType() {
        const totalWeight = this.petalTypes.reduce((sum, t) => sum + (t.weight || 1), 0);
        let random = Math.random() * totalWeight;
        for (const type of this.petalTypes) {
            if (random < (type.weight || 1)) return type;
            random -= (type.weight || 1);
        }
        return this.petalTypes[0];
    }

    getRandomLayer() {
        const random = Math.random() * 100;
        if (random < 15) return this.layers.mid;
        if (random < 65) return this.layers.front;
        return this.layers.back;
    }

    updatePhysics(dt) {
        const windiness = this.state.windiness;
        let targetWindSpeed = 0;
        if (this.state.downtimeTimer > 0) {
            this.state.downtimeTimer -= dt;
            targetWindSpeed = 0.2;
        } else {
            targetWindSpeed = 0.5 + windiness * 0.395;
            if (Math.random() < Math.max(0, 0.003 - (windiness / 1000) * 0.003)) {
                this.state.downtimeTimer = 1.5 + Math.random() * 3.5;
            }
            if (Math.random() < 0.005 + (windiness / 1000) * 0.02) {
                this.state.gustForce += Math.random() * (10 + windiness * 0.3);
            }
        }
        if (Math.random() < 0.002) {
            this.state.targetWindDirection = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5);
        }
        this.state.gustForce *= 0.95;
        this.state.currentWind += (targetWindSpeed - this.state.currentWind) * (1 - Math.exp(-dt * 2));
        this.state.windDirection += (this.state.targetWindDirection - this.state.windDirection) * (1 - Math.exp(-dt * 0.5));
        const totalWind = (this.state.currentWind + this.state.gustForce) * this.state.windDirection;
        this.state.petals.forEach(p => {
            const gravityEffect = p.baseFallSpeed * p.mass * this.state.fallSpeed;
            const windEffect = totalWind * (p.aero / p.mass);
            p.x += (windEffect + p.naturalDrift) * dt;
            p.y += gravityEffect * dt;
            const speedFactor = Math.abs(windEffect) / 10 + 1;
            p.rotation += p.rotSpeed * this.state.tumbleSpeed * speedFactor * dt;
            if (p.y > 110) { p.y = -10; p.x = Math.random() * 120 - 10; }
            else if (p.y < -20) p.y = 110;
            if (p.x > 110) p.x = -10;
            else if (p.x < -20) p.x = 110;
            p.element.style.transform = `translate3d(${p.x}vw, ${p.y}vh, 0) rotate(${p.rotation}deg)`;
        });
    }

    updateParticleColors() {
        const theme = this.poster.theme;
        const primary = this.state.bgColor || theme.colors.primary;
        const accent = this.state.accentColor || theme.colors.accent;
        
        const pRgb = window.PosterUtils.hexToRgb(primary);
        const { h: pH, s: pS, l: pL } = window.PosterUtils.rgbToHsl(pRgb.r, pRgb.g, pRgb.b);
        
        const aRgb = window.PosterUtils.hexToRgb(accent);
        const { h: aH, s: aS, l: aL } = window.PosterUtils.rgbToHsl(aRgb.r, aRgb.g, aRgb.b);

        this.state.petals.forEach(p => {
            if (p.isWhite) return;
            
            let color, gradient;
            
            if (p.useThemePrimary) {
                color = primary;
                gradient = window.PosterUtils.hslToHex(pH, pS, pL * 0.7);
            } else if (p.useThemeAccent) {
                color = accent;
                gradient = window.PosterUtils.hslToHex(aH, aS, aL * 0.7);
            } else if (theme.id === 'digital-grid' && p.accentShift !== undefined) {
                const h = (aH + p.accentShift) % 360;
                const s = Math.max(aS, 0.8);
                const l = Math.max(aL, 0.6);
                color = window.PosterUtils.hslToHex(h, s, l);
                gradient = window.PosterUtils.hslToHex(h, s, l * 0.7);
            } else {
                return;
            }
            
            p.element.style.background = `linear-gradient(135deg, ${color}, ${gradient})`;
        });
    }

    startAnimationLoop() {
        const loop = (now) => {
            if (!this.state.lastPhysicsTime) this.state.lastPhysicsTime = now;
            const dt = Math.min((now - this.state.lastPhysicsTime) / 1000, 0.1);
            this.state.lastPhysicsTime = now;
            this.state.frameCount += 1;
            if (now > this.state.lastFrameTime + 1000) {
                this.updateFPS(Math.round((this.state.frameCount * 1000) / (now - this.state.lastFrameTime)));
                this.state.lastFrameTime = now;
                this.state.frameCount = 0;
                if (this.poster.updateTimerDisplay) this.poster.updateTimerDisplay();
            }
            if (!this.state.isPetalsPaused) this.updatePhysics(dt);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    updateFPS(fps) {
        const el = this.elements.fps;
        if (!el) return;
        el.textContent = String(fps);
        el.classList.remove('fps-good', 'fps-warn', 'fps-bad');
        if (fps >= 60) el.classList.add('fps-good');
        else if (fps >= 30) el.classList.add('fps-warn');
        else el.classList.add('fps-bad');
    }
};
