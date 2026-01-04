import { particles } from "../systems/ParticleSystem.js";  
import { ScreenShake } from "../utils/screenShake.js";

export class Fish {
    constructor(x, y, sprite, game) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.sprite = sprite;
        this.game = game;
        this.width = 32;
        this.height = 32;
        this.isCollected = false;
        
        this.hoverOffset = 0;
        this.hoverTimer = 0;
        this.hoverSpeed = 2; 
        this.hoverAmplitude = 5;
    }

    update(dt, player) {
        if (this.isCollected) return;

        if(Math.random() < 0.3)
            particles.emit('sparkle_aura_white', this.x + this.width / 2, this.y + this.height / 2, 1);
        
        this.hoverTimer += dt;
        this.hoverOffset = Math.sin(this.hoverTimer * this.hoverSpeed) * this.hoverAmplitude;
        this.y = this.baseY + this.hoverOffset;

        if (this.checkCollision(player)) {
            this.collect(player);
        }
    }

    checkCollision(player) {
        return (
            player.pos.x < this.x + this.width &&
            player.pos.x + player.size > this.x &&
            player.pos.y < this.y + this.height &&
            player.pos.y + player.size > this.y
        );
    }

    collect(player) {
        this.isCollected = true;
        this.game.addFish();
        particles.emit('sparkle_white', this.x + this.width / 2, this.y + this.height / 2, 20);
    }

    draw(ctx) {
        if (this.isCollected) return;
        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const glowRadius = this.width / 2;
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.globalCompositeOperation = 'source-over';
        if (this.sprite) {
            this.sprite.draw(ctx, this.x, this.y);
        } else {
            ctx.fillStyle = this.type.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}