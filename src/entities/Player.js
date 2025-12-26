import { PLATFORM_TYPE } from '../enums.js';
import { Animator } from '../systems/animator.js';
import { assets } from '../systems/AssetsManager.js';
import { particles } from '../systems/ParticleSystem.js';
import { PowerUpTypes } from './PowerUp.js';

export class Player {
    constructor(x, y) {
        this.pos = { x: x, y: y };
        this.vel = { x: 0, y: 0 };
        this.size = 32;

        this.defultVuisualScale = 3;
        this.strengthVisualScale = 4;
        this.visualScale = 3; 
        
        this.isGrounded = true;
        this.isDead = false;

        this.activeEffects = {};
        this.lastTotem = null;
        this.lastTotemElapsed = 0;

        this.facingLeft = false;
        this.animator = new Animator();
        const frameSize = 32; 
        const idleFrames = assets.getAnimationStrip('player', 0, 0, frameSize, frameSize, 4);
        const riseFrames = assets.getAnimationStrip('player', 0, 8 * frameSize, frameSize, frameSize, 3);
        const fallFrames = assets.getAnimationStrip('player', 3 * frameSize, 9 * frameSize, frameSize, frameSize, 4);
        const deadFrames = assets.getAnimationStrip('player', 0, 6 * frameSize, frameSize, frameSize, 4);
        this.animator.add('idle', idleFrames, 4, true);
        this.animator.add('rise', riseFrames, 10, false);
        this.animator.add('fall', fallFrames, 10, false);
        this.animator.add('dead', deadFrames, 4, false);
        this.animator.play('idle');

        this.currentFriction = 0.8; 
        this.friction = 0.90;
        this.airResistance = 0.99;
        this.gravity = 1500;
        this.jumpForce = 40;

        this.wallBounciness = 0.6; 
        this.doubleJumpAvailable = true;
    }

    handleInput(joyShot) {
        if(this.isDead) return;

        if (joyShot.force && (joyShot.force.x !== 0 || joyShot.force.y !== 0) && !joyShot.active) {
            if((this.doubleJumpAvailable && !this.isGrounded)){
                this.doubleJumpAvailable = false;
                this.performJump(joyShot);
                return;
            }

            if (this.isGrounded && (Math.abs(this.vel.x) < 30 && Math.abs(this.vel.y) < 30)) {
                this.isGrounded = false;
                this.performJump(joyShot);
            }
            joyShot.resetForce(); 
        }
    }

    performJump(joyShot) {
        particles.emit('dust', this.pos.x + this.size/2, this.pos.y + this.size, 15);

        this.vel.x = joyShot.force.x * this.jumpForce;
        this.vel.y = joyShot.force.y * this.jumpForce;
        joyShot.resetForce();
    }

    addEffect(name, duration) {
        this.activeEffects[name] = {
            remainingTime: duration,
            totalTime: duration,
            visualProgress: 1.0
        };
    }

    hasEffect(name) {
        return this.activeEffects[name] !== undefined;
    }

    removeEffect(name) {
        if (this.activeEffects[name]) {
            PowerUpTypes[name.toUpperCase()].onExpire(this);
            delete this.activeEffects[name];
        }
    }

    update(dt, canvasWidth) {
        this.vel.y += this.gravity * dt;
        this.facingLeft = this.vel.x < 0;
    
        if(!this.isDead){
            if (this.isGrounded) {
                this.animator.play('idle');
                if(this.lastTotem !== null) {
                    this.lastTotem = null;
                    this.lastTotemElapsed = 0;
                }
            } else {
                particles.emit('trail', this.pos.x + this.size/2, this.pos.y, 1);
                if (this.vel.y < -1) {
                    this.animator.play('rise');
                } else if (this.vel.y > 1) {
                    this.animator.play('fall');
                }
            }
        }

        this.visualScale = this.hasEffect('strength') ? this.strengthVisualScale : this.defultVuisualScale;
        this.animator.update(dt);

        if(this.lastTotem !== null) {
            this.lastTotemElapsed = Date.now() - this.lastTotem;
        }

        for (const name in this.activeEffects) {
            const effect = this.activeEffects[name];
            effect.remainingTime -= dt * 1000;

            const targetProgress = Math.max(0, effect.remainingTime / effect.totalTime);
            const lerpSpeed = 10; 
            effect.visualProgress += (targetProgress - effect.visualProgress) * (lerpSpeed * dt);

            if (effect.remainingTime <= 0) {
                this.removeEffect(name);
            }
        }

        if(this.hasEffect('strength') && Math.random() < 0.2) {
            particles.emit('strength', this.pos.x + this.size/2, this.pos.y + this.size/2, 20);
        }

        if (this.isGrounded) {
            this.vel.x *= this.currentFriction;
            this.doubleJumpAvailable = true;
        } else {
            this.vel.x *= this.airResistance;
        }

        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        if (this.pos.x < 0) {
            this.pos.x = 0;
            this.vel.x = -this.vel.x * this.wallBounciness;
        } 
        else if (this.pos.x + this.size > canvasWidth) {
            this.pos.x = canvasWidth - this.size;
            this.vel.x = -this.vel.x * this.wallBounciness;
        }
    }

    resolvePlatformCollision(platform, dt) {
        if (this.vel.y <= 0 || this.isDead) return false;

        if (platform.isBroken) {
            return false;
        }

        const overlapsX = 
            this.pos.x + this.size > platform.x && 
            this.pos.x < platform.x + platform.width;

        if (!overlapsX) return false;

        const feetPos = this.pos.y + this.size;
        const prevFeetPos = feetPos - (this.vel.y * dt); 
        const collisionTolerance = 5;
        const platformTop = platform.y;

        if (feetPos >= platformTop && prevFeetPos <= platformTop + collisionTolerance) {
            this.pos.y = platformTop - this.size;
            this.vel.y = 0;
            this.isGrounded = true;
            
            this.currentFriction = platform.friction;
            platform.special_action(this);

            if (platform.type === PLATFORM_TYPE.MOVING_X) {
                this.pos.x += platform.getVelX(dt) * dt;
            }

            return true;
        }
        
        return false;
    }

    onDead() {
        this.isDead = true;
        this.animator.play('dead', true);

        this.vel.y = -600;
        particles.emit('blood', this.pos.x + this.size/2, this.pos.y + this.size/2, 50);
    }

    draw(ctx) {
        ctx.imageSmoothingEnabled = false; 
        const drawWidth = this.size * this.visualScale;
        const drawHeight = this.size * this.visualScale;

        const offsetX = (drawWidth - this.size) / 2;
        const offsetY = (drawHeight - this.size);

        if (this.hasEffect('totem')) {
            ctx.beginPath();
            ctx.arc(this.pos.x + this.size / 2, this.pos.y + this.size / 2, this.size, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(Date.now() * 0.01) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        this.animator.draw(
            ctx, 
            this.pos.x - offsetX,
            this.pos.y - offsetY,
            drawWidth,
            drawHeight,
            this.facingLeft
        );
    }
}