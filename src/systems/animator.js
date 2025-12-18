export class Animator {
    constructor() {
        this.animations = new Map();
        
        this.currentAnimKey = null;
        this.currentAnim = null;
        
        this.frameIndex = 0;
        this.timer = 0;
        this.isPlaying = false;
    }

    add(key, frames, fps = 10, loop = true, onComplete = null) {
        this.animations.set(key, {
            frames: frames,
            frameDuration: 1 / fps,
            loop: loop,
            onComplete: onComplete
        });
    }

    play(key, forceReset = false) {
        if (this.currentAnimKey === key && !forceReset) return;

        const anim = this.animations.get(key);
        if (!anim) {
            console.warn(`Animator: Próba uruchomienia nieistniejącej animacji '${key}'`);
            return;
        }

        this.currentAnimKey = key;
        this.currentAnim = anim;
        this.frameIndex = 0;
        this.timer = 0;
        this.isPlaying = true;
    }

    update(dt) {
        if (!this.isPlaying || !this.currentAnim) return;

        this.timer += dt;

        if (this.timer >= this.currentAnim.frameDuration) {
            this.timer -= this.currentAnim.frameDuration; 
            
            this.frameIndex++;
            if (this.frameIndex >= this.currentAnim.frames.length) {
                if (this.currentAnim.loop) {
                    this.frameIndex = 0;
                } else {
                    this.frameIndex = this.currentAnim.frames.length - 1;
                    this.isPlaying = false;
                    if (this.currentAnim.onComplete) {
                        this.currentAnim.onComplete();
                    }
                }
            }
        }
    }

    draw(ctx, x, y, w, h, flipX = false) {
        if (!this.currentAnim) return;

        const sprite = this.currentAnim.frames[this.frameIndex];
        
        if (!sprite) return;

        if (flipX) {
            ctx.save();
            ctx.translate(x + w, y);
            ctx.scale(-1, 1);
            sprite.draw(ctx, 0, 0, w, h);
            ctx.restore();
        } else {
            sprite.draw(ctx, x, y, w, h);
        }
    }
    
    getCurrentAnimationName() {
        return this.currentAnimKey;
    }
}