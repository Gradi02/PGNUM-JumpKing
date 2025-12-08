import { ScreenShake } from '../utils/screenShake.js';

export class Player {
    constructor(x, y) {
        this.pos = { x: x, y: y };
        this.vel = { x: 0, y: 0 };
        this.radius = 15;
        this.isGrounded = true;
        this.friction = 0.98;
        this.gravity = 1500;
        this.bounciness = 0.6;
    }

    handleInput(joyShot) {
        if (joyShot.force && (joyShot.force.x !== 0 || joyShot.force.y !== 0) && !joyShot.active) {
            if (this.isGrounded && 
               (Math.abs(this.vel.x) < 10 && Math.abs(this.vel.y) < 10)) {
                const multiplier = 18; 
                
                this.vel.x = joyShot.force.x * multiplier;
                this.vel.y = joyShot.force.y * multiplier;
                
                this.isGrounded = false;
                
                if (navigator.vibrate) navigator.vibrate(50);
            }
            joyShot.resetForce(); 
        }
    }

    update(dt, canvasWidth) {
        this.vel.y += this.gravity * dt;
        this.vel.x *= this.friction;

        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        if (this.pos.x - this.radius < 0) {
            this.pos.x = this.radius;
            this.vel.x = -this.vel.x * this.bounciness;
            ScreenShake.shake(0.1, 2);
        } else if (this.pos.x + this.radius > canvasWidth) {
            this.pos.x = canvasWidth - this.radius;
            this.vel.x = -this.vel.x * this.bounciness;
            ScreenShake.shake(0.1, 2);
        }
    }

    resolvePlatformCollision(platform) {
        if (this.vel.y > 0) {
            const prevY = this.pos.y - this.vel.y * 0.016;
            
            if (this.pos.x > platform.x && this.pos.x < platform.x + platform.w &&
                this.pos.y + this.radius >= platform.y && 
                prevY + this.radius <= platform.y + 5) {
                
                this.pos.y = platform.y - this.radius;
                this.vel.y = 0;
                this.vel.x = 0;
                this.isGrounded = true;
                
                if (navigator.vibrate) navigator.vibrate(10);
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(-this.radius, -this.radius, this.radius*2, this.radius*2);
        
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.moveTo(-this.radius, -this.radius);
        ctx.lineTo(-this.radius, -this.radius - 10);
        ctx.lineTo(-this.radius/2, -this.radius - 5);
        ctx.lineTo(0, -this.radius - 12);
        ctx.lineTo(this.radius/2, -this.radius - 5);
        ctx.lineTo(this.radius, -this.radius - 10);
        ctx.lineTo(this.radius, -this.radius);
        ctx.fill();

        ctx.fillStyle = 'black';
        const lookDir = Math.sign(this.vel.x) || 1;
        ctx.fillRect(lookDir * 5, -5, 4, 4);

        ctx.restore();
    }
}