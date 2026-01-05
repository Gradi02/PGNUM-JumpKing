import { TimeManager } from '../utils/TimeManager.js'; 

const random = (min, max) => Math.random() * (max - min) + min;
const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

class Particle {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        
        const angle = random(config.angle.min, config.angle.max) * (Math.PI / 180);
        const speed = random(config.speed.min, config.speed.max);
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.life = random(config.life.min, config.life.max);
        this.maxLife = this.life;
        
        this.size = random(config.size.min, config.size.max);
        this.color = Array.isArray(config.color) ? randomPick(config.color) : config.color;
        
        this.gravity = config.gravity || 0;
        this.friction = config.friction || 1;
        this.fade = config.fade ?? true;
        this.shrink = config.shrink ?? false;
        this.ui = config.ui || false; 
        this.layer = config.layer || 0;
    }

    update() {
        const dt = TimeManager.deltaTime;
        
        if (dt === 0) return;

        this.life -= dt;
        
        this.vy += this.gravity * dt;
        this.vx *= this.friction;
        this.vy *= this.friction;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        if (ParticleSystem.instance) {
            return ParticleSystem.instance;
        }
        this.particles = [];
        this.presets = {};
        ParticleSystem.instance = this;
    }

    addPreset(name, config) {
        this.presets[name] = {
            color: config.color || '#FFF',
            speed: config.speed || { min: 50, max: 100 }, 
            angle: config.angle || { min: 0, max: 360 },
            life: config.life || { min: 0.5, max: 1.0 },
            size: config.size || { min: 2, max: 4 },
            gravity: config.gravity || 0,
            friction: config.friction || 1,
            fade: config.fade !== false,
            shrink: config.shrink || false,
            spread: config.spread || 0,
            ui: config.ui || false,
            layer: config.layer || 0
        };
    }

    emit(name, x, y, count = 10) {
        const config = this.presets[name];
        if (!config) {
            console.log(`Particle System: Preset '${name}' not found!`);
            return;
        }

        for (let i = 0; i < count; i++) {
            const spreadX = random(-config.spread, config.spread);
            const spreadY = random(-config.spread, config.spread);

            this.particles.push(new Particle({
                ...config,
                x: x + spreadX,
                y: y + spreadY
            }));
        }
    }

    emitLine(name, x1, y1, x2, y2, count = 10) {
        const config = this.presets[name];
        if (!config) return;

        for (let i = 0; i < count; i++) {
            const t = Math.random();
            
            const lineX = x1 + (x2 - x1) * t;
            const lineY = y1 + (y2 - y1) * t;

            const spreadX = random(-config.spread, config.spread);
            const spreadY = random(-config.spread, config.spread);

            this.particles.push(new Particle({
                ...config,
                x: lineX + spreadX,
                y: lineY + spreadY
            }));
        }
    }

    emitRect(name, x, y, width, height, count = 10) {
        const config = this.presets[name];
        if (!config) return;

        for (let i = 0; i < count; i++) {
            const rectX = x + Math.random() * width;
            const rectY = y + Math.random() * height;

            this.particles.push(new Particle({
                ...config,
                x: rectX,
                y: rectY
            }));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            
            if (p.isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, camera, layer = 0) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        for (const p of this.particles) {
            if(p.layer === layer) {
                let drawX = p.x;
                let drawY = p.y;

                if (p.ui) {
                    drawX += camera.x || 0;
                    drawY += camera.y || 0;
                }

                const progress = Math.max(0, p.life / p.maxLife);
                const alpha = p.fade ? progress : 1;
                const currentSize = p.shrink ? p.size * progress : p.size;

                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.fillRect(
                    Math.floor(drawX - currentSize / 2), 
                    Math.floor(drawY - currentSize / 2), 
                    Math.ceil(currentSize), 
                    Math.ceil(currentSize)
                );
            }
        }
        ctx.restore();
    }
}

export const particles = new ParticleSystem();