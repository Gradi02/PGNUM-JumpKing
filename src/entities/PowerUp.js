import { particles } from "../systems/ParticleSystem.js";  

export const PowerUpTypes = {
    TOTEM: {
        name: 'totem',
        duration: 5000,
        consumeOnUse: true,
        color: '#FFD700',
        onCollect: (player) => {
            player.addEffect('totem', PowerUpTypes.TOTEM.duration);
        },
        onExpire: (player) => {
        }
    },
    STRENGTH: {
        name: 'strength',
        duration: 6000,
        consumeOnUse: false,
        color: '#FFD700',
        onCollect: (player) => {
            player.addEffect('strength', PowerUpTypes.STRENGTH.duration);
            player.jumpForce = 50;
        },
        onExpire: (player) => {
            player.jumpForce = 40;
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

        if (this.sprite) {
            this.sprite.draw(ctx, this.x, this.y);
        } else {
            ctx.fillStyle = this.type.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}