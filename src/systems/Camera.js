import { particles } from './ParticleSystem.js';
import { assets } from './AssetsManager.js';

export class Camera {
    constructor(canvasHeight, logicWidth) {
        this.height = canvasHeight;
        this.logicWidth = logicWidth;
        this.y = 0;
    
        this.startOffsetRatio = 0.75; 
        this.scrollThresholdRatio = 0.45;
        this.lerpSpeed = 5; 

        this.dangerZoneHeight = 32;
    }

    reset(targetY) {
        this.y = targetY - (this.height * this.startOffsetRatio);
    }

    update(targetY, dt) {
        const thresholdLine = this.y + (this.height * this.scrollThresholdRatio);

        if (targetY < thresholdLine) {
            const targetCamY = targetY - (this.height * this.scrollThresholdRatio);
            this.y += (targetCamY - this.y) * this.lerpSpeed * dt;
        }

        if (Math.random() < 0.1) {
            particles.emitLine('lava_fumes', 0, this.height, this.logicWidth, this.height, 5);
        }
    }

    draw(ctx, canvasWidth) {
        const realHeight = ctx.canvas.height;

        const gradient = ctx.createLinearGradient(
            0, realHeight - this.dangerZoneHeight, 
            0, realHeight
        );

        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)');

        ctx.fillStyle = gradient;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillRect(0, realHeight - this.dangerZoneHeight, ctx.canvas.width, this.dangerZoneHeight);
        ctx.restore();
    }

    drawHUD(ctx, player) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        let uiX = 20;
        let uiY = 20;
        const barMaxWidth = 100;
        const barHeight = 10;

        for (const effectName in player.activeEffects) {
            const effect = player.activeEffects[effectName];
            const sprite = assets.getSprite(`powerup_${effectName.toLowerCase()}`);
            
            if (sprite) {
                sprite.draw(ctx, uiX, uiY, 24, 24);
            }

            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.roundRect(uiX + 35, uiY + 8, barMaxWidth, barHeight, 4);
            ctx.fill();

            const width = barMaxWidth * effect.visualProgress;
            const barColor = effect.visualProgress < 0.3 ? '#ff4444' : (name === 'totem' ? '#FFD700' : '#44ff44');
            
            ctx.fillStyle = barColor;
            if (width > 2) {
                ctx.beginPath();
                ctx.roundRect(uiX + 35, uiY + 8, width, barHeight, 4);
                ctx.fill();
            }

            if (effect.visualProgress < 0.2 && Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.strokeRect(uiX + 35, uiY + 8, barMaxWidth, barHeight);
            }

            uiY += 35;
        }

        ctx.restore();
    }

    get bottom() {
        return this.y + this.height;
    }
}