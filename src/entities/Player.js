import { PLATFORM_TYPE } from '../enums.js';

export class Player {
    constructor(x, y) {
        this.pos = { x: x, y: y };
        this.vel = { x: 0, y: 0 };
        this.size = 30;
        this.isGrounded = true;

        this.currentFriction = 0.8; 
        this.friction = 0.90;
        this.airResistance = 0.99;
        this.gravity = 1500;
        this.jumpForce = 40;

        this.wallBounciness = 0.6; 
        this.doubleJumpAvailable = true;
    }

    handleInput(joyShot) {
        if (joyShot.force && (joyShot.force.x !== 0 || joyShot.force.y !== 0) && !joyShot.active) {
            if((this.doubleJumpAvailable && !this.isGrounded)){
                this.doubleJumpAvailable = false;
                this.performJump(joyShot);
                return;
            }

            if (this.isGrounded && (Math.abs(this.vel.x) < 10 && Math.abs(this.vel.y) < 10)) {
                this.isGrounded = false;
                this.performJump(joyShot);
            }
            joyShot.resetForce(); 
        }
    }

    performJump(joyShot) {
        this.vel.x = joyShot.force.x * this.jumpForce;
        this.vel.y = joyShot.force.y * this.jumpForce;
        if (navigator.vibrate) navigator.vibrate(50);
        joyShot.resetForce();
    }

    update(dt, canvasWidth) {
        this.vel.y += this.gravity * dt;

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
        if (this.vel.y <= 0) return false;

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

    draw(ctx) {
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(this.pos.x, this.pos.y, this.size, this.size);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.pos.x, this.pos.y, this.size, this.size);
    }
}