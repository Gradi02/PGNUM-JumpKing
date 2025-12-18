export class Camera {
    constructor(canvasHeight) {
        this.height = canvasHeight;
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
    }

    draw(ctx, canvasWidth) {
        const gradient = ctx.createLinearGradient(
            0, this.height - this.dangerZoneHeight, 
            0, this.height
        );

        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.4)');

        ctx.fillStyle = gradient;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillRect(0, this.height - this.dangerZoneHeight, canvasWidth, this.dangerZoneHeight);
        ctx.restore();
    }

    get bottom() {
        return this.y + this.height;
    }
}