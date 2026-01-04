import { PLATFORM_TYPE } from '../enums.js';
import { Animator } from '../systems/animator.js';
import { assets } from '../systems/AssetsManager.js';
import { particles } from '../systems/ParticleSystem.js';
import { PowerUpTypes } from './PowerUp.js';
import { ScreenShake } from '../utils/screenShake.js';

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
        this.hazardRezistance = false;
        this.hazardGraceTime = 0;
        this.hazardGraceMaxTime = 1500;
        this.hazardSpeedThreshold = -1500;
        this.activeInputs = true;

        this.activeEffects = {};

        this.facingLeft = false;
        this.animator = new Animator();
        const frameSize = 32; 
        const idleFrames = assets.getAnimationStrip('player', 0, 0, frameSize, frameSize, 4);
        const riseFrames = assets.getAnimationStrip('player', 0, 8 * frameSize, frameSize, frameSize, 3);
        const fallFrames = assets.getAnimationStrip('player', 3 * frameSize, 8 * frameSize, frameSize, frameSize, 2);
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
        this.lastPlatform = null;

        this.wallBounciness = 0.9; 
        this.doubleJumpAvailable = false;
        this.wingsSprite = assets.getSprite('wings');
    }

    handleInput(joyShot) {
        if(this.isDead || !this.activeInputs) return;

        if (joyShot.force && (joyShot.force.x !== 0 || joyShot.force.y !== 0) && !joyShot.active) {
            if((this.doubleJumpAvailable && !this.isGrounded)){
                this.doubleJumpAvailable = false;
                this.performJump(joyShot);
                return;
            }

            if (this.isGrounded && (Math.abs(this.vel.x) < 200 && Math.abs(this.vel.y) < 200)) {
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

        if(joyShot.force.shake) ScreenShake.shake(0.3, 5);

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
                this.doubleJumpAvailable = false;
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

        if(this.hasEffect('jetpack')) {
            this.vel.y = -1000;
            this.vel.x = 0;

            particles.emit('jetpack_fire', this.pos.x + this.size/2, this.pos.y + this.size/2, 5);
            particles.emit('jetpack_smoke', this.pos.x + this.size/2, this.pos.y + this.size/2, 10);
        }

        if(this.hasEffect('strength') && Math.random() < 0.2) {
            particles.emit('strength', this.pos.x + this.size/2, this.pos.y + this.size/2, 20);
        }

        if(this.hasEffect('shoes')) {
            this.currentFriction = 0;

            if(Math.random() < 0.2)
                particles.emit('shoes', this.pos.x + this.size/2, this.pos.y + this.size/2, 20);
        }

        if (this.isGrounded) {
            this.vel.x *= this.currentFriction;
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

        if (this.hasEffect('jetpack')) {
            this.activateHazardResistance(this.hazardGraceMaxTime);
        }

        if(this.hasEffect('strength')) {
            this.activateHazardResistance(this.hazardGraceMaxTime * 0.5);
        }

        if (this.vel.y < this.hazardSpeedThreshold) {
            this.activateHazardResistance(this.hazardGraceMaxTime * 0.7);
        }

        if (
            this.lastPlatform &&
            this.lastPlatform.type === PLATFORM_TYPE.BOUNCY &&
            this.doubleJumpAvailable &&
            this.vel.y < -600
        ) {
            this.activateHazardResistance(this.hazardGraceMaxTime * 0.5);
        }

        if(this.doubleJumpAvailable) {
            this.activateHazardResistance(this.hazardGraceMaxTime * 0.5);
        }

        if (this.hazardGraceTime > 0) {
            this.hazardGraceTime -= dt * 1000;
            this.hazardRezistance = true;
        } else {
            this.hazardRezistance = false;
        }
    }

    activateHazardResistance(durationMs) {
        this.hazardGraceTime = Math.max(this.hazardGraceTime, durationMs);
        this.hazardRezistance = true;
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
            this.lastPlatform = platform;
            
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

        const centerX = this.pos.x + this.size / 2;
        const centerY = this.pos.y + this.size / 2;
        const glowRadius = this.size;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);

        if(this.doubleJumpAvailable) {
            gradient.addColorStop(0, 'rgba(255, 0, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
            ctx.save();
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            this.wingsSprite.draw(
                ctx,
                this.pos.x - this.size,
                this.pos.y - this.size,
                drawWidth * 0.75,
                drawHeight * 0.75,
            );
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