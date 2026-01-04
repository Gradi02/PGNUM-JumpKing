import { particles } from "../systems/ParticleSystem.js";  
import { ScreenShake } from "../utils/screenShake.js";

export const PowerUpTypes = {
    JETPACK: {
        name: 'jetpack',
        duration: 1000,
        consumeOnUse: false,
        color: '#FFD700',
        onCollect: (player) => {
            if(player.isDead) return;

            player.addEffect('jetpack', PowerUpTypes.JETPACK.duration);
            player.activeInputs = false;
            ScreenShake.shake(PowerUpTypes.JETPACK.duration/1000, 5);
        },
        onExpire: (player) => {
            player.activeInputs = true;
            player.doubleJumpAvailable = true;
        }
    },
    STRENGTH: {
        name: 'strength',
        duration: 6000,
        consumeOnUse: false,
        color: '#FFD700',
        onCollect: (player) => {
            if(player.isDead) return;
            
            player.addEffect('strength', PowerUpTypes.STRENGTH.duration);
            player.jumpForce = 50;
        },
        onExpire: (player) => {
            player.jumpForce = 40;
        }
    },
    SHOES: {
        name: 'shoes',
        duration: 9000,
        consumeOnUse: false,
        color: '#FFD700',
        onCollect: (player) => {
            if(player.isDead) return;
            
            player.addEffect('shoes', PowerUpTypes.SHOES.duration);
        },
        onExpire: (player) => {
            if(player.lastPlatform !== null)
                player.currentFriction = player.lastPlatform.friction;
        }
    },
};


export class PowerUp {
    constructor(x, y, typeKey, sprite) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.type = PowerUpTypes[typeKey];
        this.sprite = sprite;
        this.width = 32;
        this.height = 32;
        this.isCollected = false;
        
        this.hoverOffset = 0;
        this.hoverTimer = 0;
        this.hoverSpeed = 2; 
        this.hoverAmplitude = 10;
    }

    update(dt, player) {
        if (this.isCollected) return;

        if(Math.random() < 0.3)
            particles.emit('sparkle_aura', this.x + this.width / 2, this.y + this.height / 2, 1);
        
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
        this.type.onCollect(player);
        particles.emit('sparkle', this.x + this.width / 2, this.y + this.height / 2, 20);
    }

    draw(ctx) {
        if (this.isCollected) return;
        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const glowRadius = this.width;
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

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