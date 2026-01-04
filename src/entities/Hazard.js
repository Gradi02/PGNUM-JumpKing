import { particles } from "../systems/ParticleSystem.js";

export class Hazard {
    constructor(x, y, width, height = 12) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.isVertical = this.height > this.width;
        
        this.pulseSpeed = 8.0;
        this.zapInterval = 0.04;
        
        this.timer = 0;
        
        this.zapTimer = 0;
        this.zapPoints = [];

        // normal
        this.colorCoreNormal = '#460000ff';
        this.colorOuterNormal = '#ff1e00ff';
        this.colorZapNormal = '#ff7a5cff';

        // resistance active
        this.colorCoreResist = '#002244ff';
        this.colorOuterResist = '#00c8ffff';
        this.colorZapResist = '#8be9ffff';

        // aktualne
        this.colorCore = this.colorCoreNormal;
        this.colorOuter = this.colorOuterNormal;
        this.colorZap = this.colorZapNormal; 

        this.playerRezistance = false;
        this.playerRezistanceProgress = 0;
        
        this.generateZapPoints();
    }

    update(dt, player) {
        this.timer += dt * this.pulseSpeed;
        this.playerRezistance = player.hazardRezistance;
        this.playerRezistanceProgress = player.hazardGraceTime / player.hazardGraceMaxTime;

        this.zapTimer += dt;
        if (this.zapTimer >= this.zapInterval) {
            this.zapTimer = 0;
            this.generateZapPoints();
        }

        if(Math.random() < 0.3) {
            particles.emitRect('hazard', this.x, this.y, this.width, this.height, 2);
        }

        if (this.playerRezistance) {
            if (this.playerRezistanceProgress < 0.35) {
                const blink = (Math.sin(this.timer * 8) + 1) / 2;

                this.colorOuter = this.lerpColor(
                    this.colorOuterNormal,
                    this.colorOuterResist,
                    blink
                );

                this.colorZap = this.lerpColor(
                    this.colorZapNormal,
                    this.colorZapResist,
                    blink
                );

                this.pulseSpeed = 14;
            }
            else {
                this.colorCore = this.colorCoreResist;
                this.colorOuter = this.colorOuterResist;
                this.colorZap = this.colorZapResist;

                this.pulseSpeed = 6;
            }
        }
        else {
            this.colorCore = this.colorCoreNormal;
            this.colorOuter = this.colorOuterNormal;
            this.colorZap = this.colorZapNormal;

            this.pulseSpeed = 8;
        }
    }

    generateZapPoints() {
        this.zapPoints = [];
        
        if (this.isVertical) {
            const startY = this.y;
            const endY = this.y + this.height;
            const centerX = this.x + this.width / 2;
            
            let currY = startY;
            this.zapPoints.push({ x: centerX, y: currY });

            while(currY < endY) {
                let step = Math.random() * 15 + 5;
                if (currY + step > endY) step = endY - currY;
                currY += step;

                let newX;
                if (currY >= endY) {
                    newX = centerX;
                } else {
                    const offset = (Math.random() - 0.5) * (this.width * 0.8); 
                    newX = centerX + offset;
                }
                this.zapPoints.push({ x: newX, y: currY });
            }
        } 
        else {
            const startX = this.x;
            const endX = this.x + this.width;
            const centerY = this.y + this.height / 2;

            let currX = startX;
            this.zapPoints.push({ x: currX, y: centerY });

            while(currX < endX) {
                let step = Math.random() * 15 + 5;
                if (currX + step > endX) step = endX - currX;
                currX += step;

                let newY;
                if (currX >= endX) {
                    newY = centerY;
                } else {
                    const offset = (Math.random() - 0.5) * (this.height * 0.8); 
                    newY = centerY + offset;
                }
                this.zapPoints.push({ x: currX, y: newY });
            }
        }
    }

    checkCollision(player) {
        const px = player.pos.x;
        const py = player.pos.y;
        const pw = player.size;
        const ph = player.size;
        const margin = 6; 

        return (
            px < this.x + this.width - margin &&
            px + pw > this.x + margin &&
            py < this.y + this.height - margin &&
            py + ph > this.y + margin
        );
    }

    destroyParticle() {
        particles.emitRect('hazard_destroy', this.x, this.y, this.width, this.height, 50);
    }

    lerpColor(a, b, t) {
        const ah = parseInt(a.slice(1), 16);
        const bh = parseInt(b.slice(1), 16);

        const ar = (ah >> 24) & 255;
        const ag = (ah >> 16) & 255;
        const ab = (ah >> 8) & 255;
        const aa = ah & 255;

        const br = (bh >> 24) & 255;
        const bg = (bh >> 16) & 255;
        const bb = (bh >> 8) & 255;
        const ba = bh & 255;

        const rr = ar + (br - ar) * t;
        const rg = ag + (bg - ag) * t;
        const rb = ab + (bb - ab) * t;
        const ra = aa + (ba - aa) * t;

        return `rgba(${rr},${rg},${rb},${ra / 255})`;
    }

    draw(ctx) {
        ctx.save();

        const pulse = Math.sin(this.timer) * 5 + 15; 
        ctx.shadowBlur = pulse;
        ctx.shadowColor = this.colorOuter;

        let gradient;
        if (this.isVertical) {
            gradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        } else {
            gradient = ctx.createLinearGradient(0, this.y, 0, this.y + this.height);
        }

        gradient.addColorStop(0, `rgba(255, 0, 0, 0)`);
        gradient.addColorStop(0.5, `rgba(255, 139, 139, 0.9)`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = this.colorOuter;
        if (this.isVertical) {
            ctx.fillRect(this.x, this.y - 6, this.width, 6);
            ctx.fillRect(this.x, this.y + this.height, this.width, 6);
        } else {
            ctx.fillRect(this.x - 6, this.y, 6, this.height);
            ctx.fillRect(this.x + this.width, this.y, 6, this.height);
        }

        if (this.zapPoints.length > 1) {
            ctx.strokeStyle = this.colorZap;
            ctx.lineWidth = this.playerRezistance ? 2.2 : 1.5;
            ctx.shadowBlur = this.playerRezistance ? 10 : 5;
            
            ctx.beginPath();
            ctx.moveTo(this.zapPoints[0].x, this.zapPoints[0].y);
            for (let i = 1; i < this.zapPoints.length; i++) {
                ctx.lineTo(this.zapPoints[i].x, this.zapPoints[i].y);
            }
            ctx.stroke();
        }

        ctx.restore();
    }
}