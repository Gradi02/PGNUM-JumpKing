export class Animator {
    constructor(config) {
        this.ctx = config.ctx;
        this.spritesheet = new Image();
        this.spritesheetPath = config.spritesheetPath;
        this.frameWidth = config.frameWidth;
        this.frameHeight = config.frameHeight;
        this.animations = config.animations;

        this.currentAnimation = null;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.isLoaded = false;
    }

    load() {
        return new Promise((resolve, reject) => {
            this.spritesheet.onload = () => {
                this.isLoaded = true;
                if (Object.keys(this.animations).length > 0) {
                    this.setAnimation(Object.keys(this.animations)[0]);
                }
                resolve();
            };
            this.spritesheet.onerror = () => {
                reject(`Animator: Nie udało się załadować arkusza: ${this.spritesheetPath}`);
            };
            this.spritesheet.src = this.spritesheetPath;
        });
    }

    setAnimation(name) {
        if (this.animations[name] && this.currentAnimation !== name) {
            this.currentAnimation = name;
            this.currentFrame = 0;
            this.frameTimer = 0;
        }
    }

    update(deltaTime) {
        if (!this.isLoaded || !this.currentAnimation) return;

        const anim = this.animations[this.currentAnimation];
        this.frameTimer += deltaTime;

        if (this.frameTimer >= anim.duration) {
            this.frameTimer -= anim.duration;
            this.currentFrame = (this.currentFrame + 1) % anim.frames;
        }
    }

    draw(x, y, width, height) {
        if (!this.isLoaded || !this.currentAnimation) return;

        const anim = this.animations[this.currentAnimation];
        const sx = this.currentFrame * this.frameWidth;
        const sy = anim.row * this.frameHeight;

        this.ctx.drawImage(
            this.spritesheet,
            sx, sy,
            this.frameWidth, this.frameHeight,
            x, y,
            width, height
        );
    }
}
