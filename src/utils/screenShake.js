export class ScreenShake {
    static #duration = 0;
    static #magnitude = 0;
    static #elapsed = 0;

    static shake(duration, magnitude) {
        this.#duration = Math.max(this.#duration, duration);
        this.#magnitude = Math.max(this.#magnitude, magnitude);
        this.#elapsed = 0;
    }

    static update(dt) {
        if (this.#duration > 0) {
            this.#elapsed += dt;
            if (this.#elapsed >= this.#duration) {
                this.#duration = 0;
                this.#magnitude = 0;
            }
        }
    }

    static apply(ctx) {
        if (this.#duration > 0) {
            const progress = this.#elapsed / this.#duration;
            const currentMagnitude = this.#magnitude * (1 - progress);
            
            const x = (Math.random() - 0.5) * 2 * currentMagnitude;
            const y = (Math.random() - 0.5) * 2 * currentMagnitude;
            
            ctx.save();
            ctx.translate(x, y);
        }
    }

    static restore(ctx) {
        if (this.#duration > 0) {
            ctx.restore();
        }
    }
}