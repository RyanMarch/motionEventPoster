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
        const type = this.getRandomPetalType();
        element.className = `petal petal--${type.type || 'dust'}`;
        if (type.type) {
            element.dataset.type = type.type;
        }
        const size = (Math.random() * 12 + 10) * (type.sizeMultiplier || 1.0);
        element.style.width = `${size}px`;
        const isBubble = type.type && type.type.includes('bubble');
        element.style.height = `${size * (type.type === 'star' || type.type === 'dust' || isBubble ? 1.0 : 1.25)}px`;
        
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
        } else if (type.useThemeSecondary) {
            color = this.state.secondaryColor || this.poster.theme.colors.secondary || '#ffffff';
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
        if (type.type && type.type.includes('star')) {
            element.style.setProperty('--star-delay', `${Math.random() * -5}s`);
        }
        container.appendChild(element);
        return {
            element,
            type: type.type,
            accentShift: type.accentShift,
            useThemePrimary: type.useThemePrimary,
            useThemeAccent: type.useThemeAccent,
            useThemeSecondary: type.useThemeSecondary,
            isWhite: type.isWhite,
            x: Math.random() * 120 - 10,
            y: Math.random() * 140 - 20,
            mass: (Math.random() * 0.8 + 0.4) * (type.massMultiplier !== undefined ? type.massMultiplier : 1.0),
            aero: Math.random() * 0.5 + 0.5,
            rotation: (type.type && type.type.includes('balloon')) ? (Math.random() * 20 - 10) : (type.type && type.type.includes('bubble')) ? 0 : (Math.random() * 360),
            rotSpeed: (type.type && (type.type.includes('reflection') || type.type.includes('bubble'))) ? 0 : ((Math.random() - 0.5) * 100 * (type.rotSpeedMultiplier !== undefined ? type.rotSpeedMultiplier : 1.0)),
            baseFallSpeed: (Math.random() * 15 + 5) * (type.speedMultiplier !== undefined ? type.speedMultiplier : 1.0),
            naturalDrift: (Math.random() - 0.5) * 5 * (type.driftMultiplier !== undefined ? type.driftMultiplier : 1.0),
            horizontalSpeed: (type.type && type.type.includes('reflection')) ? -(Math.random() * 6 + 3) : 0,
            verticalDrift: (type.type && type.type.includes('reflection')) ? (Math.random() - 0.5) * 0.8 : 0
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
        const isSpace = this.poster.theme?.id === 'space-odyssey';
        const totalWind = isSpace ? 0 : (this.state.currentWind + this.state.gustForce) * this.state.windDirection;
        this.state.petals.forEach(p => {
            if (p.type && p.type.includes('reflection')) {
                // Reflections sweep horizontally without gravity, wind, or tumbling
                p.x += p.horizontalSpeed * dt;
                p.y += p.verticalDrift * dt;
            } else if (p.type === 'shooting-star') {
                // Shooting stars move fast diagonally in randomized angles/directions
                if (p.horizontalSpeed === undefined || p.horizontalSpeed === 0) {
                    const goLeft = Math.random() > 0.5;
                    const angleDeg = goLeft ? (120 + Math.random() * 30) : (30 + Math.random() * 30);
                    const angleRad = angleDeg * Math.PI / 180;
                    const speed = p.baseFallSpeed * 2.0;
                    p.horizontalSpeed = speed * Math.cos(angleRad);
                    p.verticalSpeed = speed * Math.sin(angleRad);
                    p.rotation = angleDeg + 180;
                    p.rotSpeed = 0;
                    // Distribute initially across screen
                    p.y = Math.random() * 80 - 20;
                    p.x = Math.random() * 120 - 10;
                    p.spawnDelay = Math.random() * 12;
                }
                
                if (p.spawnDelay > 0) {
                    p.spawnDelay -= dt;
                    p.element.style.display = 'none';
                } else {
                    p.element.style.display = '';
                    p.x += p.horizontalSpeed * dt * this.state.fallSpeed;
                    p.y += p.verticalSpeed * dt * this.state.fallSpeed;
                }
            } else {
                const gravityEffect = p.baseFallSpeed * p.mass * this.state.fallSpeed;
                const windEffect = totalWind * (p.aero / p.mass);
                p.x += (windEffect + p.naturalDrift) * dt;
                p.y += gravityEffect * dt;
                
                // Skip rotation calculations for circular particles (stars, dust, and bubbles)
                if (p.type !== 'space-star' && p.type !== 'space-dust-accent' && p.type !== 'space-dust-secondary' && p.type !== 'dust' && !(p.type && p.type.includes('bubble'))) {
                    const speedFactor = Math.abs(windEffect) / 10 + 1;
                    p.rotation += p.rotSpeed * this.state.tumbleSpeed * speedFactor * dt;
                }
            }

            // Boundary wrapping
            if (p.type === 'shooting-star') {
                if (p.y > 110 || p.x < -25 || p.x > 125) {
                    const goLeft = Math.random() > 0.5;
                    const angleDeg = goLeft ? (120 + Math.random() * 30) : (30 + Math.random() * 30);
                    const angleRad = angleDeg * Math.PI / 180;
                    const speed = p.baseFallSpeed * 2.0;
                    p.horizontalSpeed = speed * Math.cos(angleRad);
                    p.verticalSpeed = speed * Math.sin(angleRad);
                    p.rotation = angleDeg + 180;
                    p.y = -20;
                    p.x = goLeft ? (Math.random() * 60 + 50) : (Math.random() * 60 - 10);
                    p.spawnDelay = 6 + Math.random() * 14;
                    p.element.style.display = 'none';
                }
            } else {
                if (p.y > 110) { p.y = -10; p.x = Math.random() * 120 - 10; }
                else if (p.y < -20) p.y = 110;
                if (p.x > 110) p.x = -10;
                else if (p.x < -20) p.x = 110;
            }

            // Skip rotation transform for circular particles to optimize GPU matrix operations
            if (p.type === 'space-star' || p.type === 'space-dust-accent' || p.type === 'space-dust-secondary' || p.type === 'dust') {
                p.element.style.transform = `translate3d(${p.x}vw, ${p.y}vh, 0)`;
            } else {
                p.element.style.transform = `translate3d(${p.x}vw, ${p.y}vh, 0) rotate(${p.rotation}deg)`;
            }
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
            } else if (p.useThemeSecondary) {
                const secondary = this.state.secondaryColor || theme.colors.secondary || '#ffffff';
                const sRgb = window.PosterUtils.hexToRgb(secondary);
                const { h: sH, s: sS, l: sL } = window.PosterUtils.rgbToHsl(sRgb.r, sRgb.g, sRgb.b);
                color = secondary;
                gradient = window.PosterUtils.hslToHex(sH, sS, sL * 0.7);
            } else if (theme.id === 'memphis-pop') {
                const luminance = (0.2126 * pRgb.r + 0.7152 * pRgb.g + 0.0722 * pRgb.b) / 255;
                const isLight = luminance > 0.5;
                if (p.type === 'memphis-zigzag') {
                    color = isLight ? '#111111' : '#FCEEB5';
                    gradient = isLight ? '#333333' : '#D2C38C';
                } else if (p.type === 'memphis-dot') {
                    color = isLight ? '#111111' : '#ffffff';
                    gradient = isLight ? '#000000' : '#e0e0e0';
                } else {
                    return;
                }
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

    updateBackgroundShapesFade(now) {
        if (!this.poster.swayLayers || !this.poster.swayLayerBases) return;
        if (!this.poster.theme?.flags?.enableBackgroundFade) return;

        const strength = this.state.gustStrength; // 0 to 100
        
        // If the background animations are paused, don't update opacity
        if (this.state.isBgPaused) return;

        // Fading frequency scales with intensity:
        // at 0: very slow cycle (e.g. 0.05 Hz, 20s period)
        // at 100: faster cycle (e.g. 0.3 Hz, 3.3s period)
        const frequency = 0.05 + (strength / 100) * 0.25;

        // Fading intensity/amplitude scales with intensity:
        // at 0: 0 (no fading, static base opacity)
        // at 100: 0.35 (subtle but noticeable fading)
        const amplitude = (strength / 100) * 0.35;

        this.poster.swayLayers.forEach((el, i) => {
            const baseOpacity = this.poster.swayLayerBases[i] || 0.85;
            
            // If the base opacity is 0 (hidden or not used), keep it as is
            if (baseOpacity === 0) return;

            // Desynchronize the shapes using a phase offset
            const phaseOffset = i * 1.7;
            const sine = Math.sin((now / 1000) * frequency * 2 * Math.PI + phaseOffset);

            // Compute dynamic opacity: base opacity modulated by the sine wave
            // Using a multiplier ensures it scales proportionally to the theme's default opacity
            const dynamicOpacity = baseOpacity * (1 + sine * amplitude);

            // Clamp between 0 and 1
            el.style.opacity = Math.max(0, Math.min(1, dynamicOpacity)).toFixed(3);
        });
    }

    startAnimationLoop() {
        const loop = (now) => {
            requestAnimationFrame(loop);
            
            if (!this.state.lastPhysicsTime) this.state.lastPhysicsTime = now;
            
            // FPS Capping Logic
            const targetFPS = this.state.fpsCap || 0;
            if (targetFPS > 0) {
                const interval = 1000 / targetFPS;
                if (!this.state.lastFrameExecutionTime) this.state.lastFrameExecutionTime = now;
                
                const elapsed = now - this.state.lastFrameExecutionTime;
                
                // If not enough time has passed, skip this frame
                // We use interval - 0.1 to account for slight browser timing jitter
                if (elapsed < interval - 0.1) return;
                
                // Adjust lastFrameExecutionTime to maintain steady rhythm
                this.state.lastFrameExecutionTime = now - (elapsed % interval);
            }

            const dt = Math.min((now - this.state.lastPhysicsTime) / 1000, 0.1);
            this.state.lastPhysicsTime = now;
            this.state.frameCount += 1;

            if (now > this.state.lastFrameTime + 1000) {
                const actualFPS = Math.round((this.state.frameCount * 1000) / (now - this.state.lastFrameTime));
                this.updateFPS(actualFPS);
                this.state.lastFrameTime = now;
                this.state.frameCount = 0;
                if (this.poster.updateTimerDisplay) this.poster.updateTimerDisplay();
            }

            if (!this.state.isPetalsPaused) this.updatePhysics(dt);
            this.updateBackgroundShapesFade(now);
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
