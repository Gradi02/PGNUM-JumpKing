import { Platform } from '../entities/Platform.js';
import { PLATFORM_TYPE } from '../enums.js';
import { TimeManager } from '../utils/TimeManager.js';
import { PowerUp } from '../entities/PowerUp.js';
import { assets } from '../systems/AssetsManager.js';

export class LevelGenerator {
    constructor(canvasWidth, canvasHeight, player, biomesManager, camera) {
        this.platforms = [];
        this.bgElements = [];
        this.powerups = [];

        this.width = canvasWidth;
        this.height = canvasHeight; 
        this.player = player;
        this.biomesManager = biomesManager;
        this.camera = camera;

        const gravity = 1500;
        const jumpForceMultiplier = 40;
        const maxInputForce = 26;
        this.powerupBaseChance = 0.01;
        this.powerupCurrentChance = this.powerupBaseChance;
        this.powerupIncrement = 0.02;

        const maxVel = maxInputForce * jumpForceMultiplier;
        this.maxJumpHeight = (maxVel * maxVel) / (2 * gravity);
        const timeInAir = 2 * (maxVel / gravity);
        this.maxJumpDistanceX = (maxVel * timeInAir) * 0.55; 

        this.N = 3; 
        this.rowSpacing = Math.floor(this.maxJumpHeight / this.N - 10); 

        this.lastY = 0;
        this.bgLastY = canvasHeight;
        
        const tileHeight = 32;
        this.platforms.push(new Platform(0, 0, canvasWidth, tileHeight, PLATFORM_TYPE.DEFAULT));
        for (let currentY = tileHeight; currentY < canvasHeight; currentY += tileHeight) {
            this.platforms.push(new Platform(0, currentY, canvasWidth, tileHeight, PLATFORM_TYPE.FLOOR));
        }

        this.generateChunk(-1200);
    }

    generateChunk(targetY) {
        this.generateBackgroundTo(targetY - 1000);
        while (this.lastY > targetY) {
            this.createNextRow();
        }
    }

    generateBackgroundTo(targetY) {       
        const startX = -(this.width * 0.25);
        const endX = this.width * 1.25;
        const distance = Math.abs(this.bgLastY - targetY);
        const density = Math.floor(distance / 40);

        for(let i = 0; i < density; i++) {
            const x = Math.random() * (endX - startX) + startX;
            const y = Math.random() * (targetY - this.bgLastY) + this.bgLastY;

            const rand = Math.random();
            let element = { x, y };
            if (rand < 0.05) {
                element.type = 'NEBULA';
                element.depth = 0.05 + Math.random() * 0.05;
                element.size = 200 + Math.random() * 400;
                element.color = this.getRandomCosmicColor(0.07);
            } 
            else {
                element.type = 'STAR';
                element.depth = 0.1 + Math.random() * 0.2;
                element.size = element.depth * 5 + 2;
                element.r = Math.floor(Math.random() * 255);
                element.g = Math.floor(Math.random() * 255);
                element.b = Math.floor(Math.random() * 255);
                element.a = element.depth * 0.4;
            }
            this.bgElements.push(element);
        }
        this.bgLastY = targetY;
    }

    getRandomCosmicColor(alpha) {
        const colors = [
            `rgba(100, 50, 200, ${alpha})`,
            `rgba(50, 150, 250, ${alpha})`,
            `rgba(250, 50, 150, ${alpha})`,
            `rgba(50, 250, 200, ${alpha})`
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createNextRow() {
        this.lastY -= this.rowSpacing;
        const prevPlatform = this.platforms[this.platforms.length - 1];
        const prevCenter = prevPlatform ? (prevPlatform.x + prevPlatform.width / 2) : (this.width / 2);
        const heightFactor = Math.min(1, Math.abs(this.lastY) / 10000);

        const width = 110 + Math.random() * 20 - (30 * heightFactor);
            
        let minX = Math.max(0, prevCenter - this.maxJumpDistanceX);
        let maxX = Math.min(this.width - width, prevCenter + this.maxJumpDistanceX);

        const x = minX + Math.random() * (maxX - minX);

        this.addPlatform(x, this.lastY, width);
    }

    addPlatform(x, y, w) {
        const type = this.biomesManager.getPlatformType(y);
        const p = new Platform(x, y, w, 30, type);
        this.platforms.push(p);

        if (y < -200) {
            this.trySpawnPowerUp(x, y, w);
        }
    }
    
    trySpawnPowerUp(x, y, platformWidth) {
        const roll = Math.random();

        if (roll < this.powerupCurrentChance) {
            const types = ['JETPACK', 'STRENGTH']; 
            const randomType = types[Math.floor(Math.random() * types.length)];
            
            const pX = x + (platformWidth / 2) - 16;
            const pY = y - 40; 

            const sprite = assets.getSprite(`powerup_${randomType.toLowerCase()}`);
            this.powerups.push(new PowerUp(pX, pY, randomType, sprite));

            this.powerupCurrentChance = this.powerupBaseChance;
        } else {
            this.powerupCurrentChance += this.powerupIncrement;
            if (this.powerupCurrentChance > 1.0) this.powerupCurrentChance = 1.0;
        }
    }

    update(cameraTopY, cameraBottomY) {
        const generationHorizon = cameraTopY - 800; 
        if (this.lastY > generationHorizon) {
            this.generateChunk(generationHorizon - 800);
        }

        const cleanupLine = cameraBottomY + 1200;

        if (this.platforms.length > 20 && this.platforms[0].y > cleanupLine) {
            this.platforms.shift();
        }
        this.powerups = this.powerups.filter(p => p.y < cleanupLine && !p.isCollected);


        if (this.bgElements.length > 100 && this.bgElements[0].y > cleanupLine + 2000) {
            this.bgElements = this.bgElements.filter(el => el.y < cleanupLine);
        }
        
        let dt = TimeManager.deltaTime;
        this.platforms.forEach(p => p.update(dt, this.width));
        this.powerups.forEach(p => p.update(dt, this.player));
    }

    drawParallaxBackground(ctx) {
        const playerOffsetX = (this.player.pos.x - (this.width / 2));
        const scrollSpeedY = 0.5; 
        ctx.save();

        this.bgElements.forEach(el => {
            const moveX = playerOffsetX * 0.2 * el.depth;
            const drawX = el.x - moveX;
            const drawY = el.y - (this.camera.y * el.depth * scrollSpeedY);
            
            if(el.type === "STAR") {
                const glowRadius = el.size * 3;

                const gradient = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, glowRadius);
                const colorPrefix = `${el.r}, ${el.g}, ${el.b}`;
                gradient.addColorStop(0, `rgba(${colorPrefix}, ${el.a})`);
                gradient.addColorStop(1, `rgba(${colorPrefix}, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(drawX, drawY, glowRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `rgba(${el.r}, ${el.g}, ${el.b}, ${el.a + 0.2})`;
                ctx.fillRect(
                    drawX - el.size / 2, 
                    drawY - el.size / 2, 
                    el.size, 
                    el.size
                );
            }
            else if (el.type === "NEBULA") {
                const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, el.size);
                grad.addColorStop(0, el.color);
                grad.addColorStop(1, 'transparent');

                ctx.save();
                ctx.fillStyle = grad;
                ctx.globalCompositeOperation = 'screen';
                ctx.beginPath();
                ctx.arc(drawX, drawY, el.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });

        ctx.restore();
    }

    draw(ctx) {
        this.drawParallaxBackground(ctx);

        for (const p of this.platforms) {
            p.draw(ctx);
        }

        for (const p of this.powerups) {
            p.draw(ctx);
        }
    }
}