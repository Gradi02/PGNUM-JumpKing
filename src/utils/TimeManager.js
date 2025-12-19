export class TimeManager {
    static #lastTime = 0;
    static #timeScale = 1.0;
    static #maxDeltaTime = 0.05;

    static deltaTime = 0;
    static unscaledDeltaTime = 0;

    static update(now) {
        if (this.#lastTime === 0) {
            this.#lastTime = now;
        }

        const rawDeltaTime = (now - this.#lastTime) / 1000;
        const cappedDeltaTime = Math.min(rawDeltaTime, this.#maxDeltaTime);

        this.unscaledDeltaTime = cappedDeltaTime; 
        
        this.deltaTime = cappedDeltaTime * this.#timeScale;
        this.#lastTime = now;
    }

    static setTimeScale(scale) {
        this.#timeScale = Math.max(0, Math.min(1, scale));
    }

    static getTimeScale() {
        return this.#timeScale;
    }
}