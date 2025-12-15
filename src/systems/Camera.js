export class Camera {
    constructor(canvasHeight) {
        this.height = canvasHeight;
        this.y = 0;
    
        this.startOffsetRatio = 0.75; 
        

        this.scrollThresholdRatio = 0.45;
        
        this.lerpSpeed = 5; 
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

    get bottom() {
        return this.y + this.height;
    }
}