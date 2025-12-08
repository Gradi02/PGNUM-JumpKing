export class Camera {
    constructor() {
        this.y = 0;
        this.offsetY = 0;
    }

    update(targetY, canvasHeight, dt) {
        const targetCamY = targetY - (canvasHeight * 0.6);
        if (targetCamY > this.y) {
            this.y += (targetCamY - this.y) * 5 * dt; 
        } else {
            this.y += (targetCamY - this.y) * 10 * dt;
        }

        if (this.y < 0) this.y = 0;
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(0, -this.y);
    }
}