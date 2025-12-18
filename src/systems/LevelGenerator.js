import { Platform } from '../entities/Platform.js';
import { PLATFORM_TYPE } from '../enums.js';
import { TimeManager } from '../utils/TimeManager.js';

export class LevelGenerator {
    constructor(canvasWidth, canvasHeight, player, biomesManager) {
        this.platforms = [];
        this.width = canvasWidth;
        this.height = canvasHeight; 
        this.player = player;
        this.biomesManager = biomesManager;

        const gravity = 1500;
        const jumpForceMultiplier = 40;
        const maxInputForce = 26;

        const maxVel = maxInputForce * jumpForceMultiplier;
        this.maxJumpHeight = (maxVel * maxVel) / (2 * gravity);
        const timeInAir = 2 * (maxVel / gravity);
        this.maxJumpDistanceX = (maxVel * timeInAir) * 0.55; 

        this.N = 3; 
        
        this.rowSpacing = Math.floor(this.maxJumpHeight / this.N); 

        this.lastY = 0;
        const tileHeight = 32;
        this.platforms.push(new Platform(0, 0, canvasWidth, tileHeight, PLATFORM_TYPE.DEFAULT));
        for (let currentY = tileHeight; currentY < canvasHeight; currentY += tileHeight) {
            this.platforms.push(new Platform(0, currentY, canvasWidth, tileHeight, PLATFORM_TYPE.FLOOR));
        }

        this.generateChunk(-1200);
    }

    generateChunk(targetY) {
        while (this.lastY > targetY) {
            this.createNextRow();
        }
    }

    createNextRow() {
        this.lastY -= this.rowSpacing;
        const prevPlatform = this.platforms[this.platforms.length - 1];
        const prevCenter = prevPlatform ? (prevPlatform.x + prevPlatform.width / 2) : (this.width / 2);
        const heightFactor = Math.min(1, Math.abs(this.lastY) / 100000);

        const width = 90 + Math.random() * 60 - (30 * heightFactor);
            
        let minX = Math.max(0, prevCenter - this.maxJumpDistanceX);
        let maxX = Math.min(this.width - width, prevCenter + this.maxJumpDistanceX);

        const x = minX + Math.random() * (maxX - minX);

        this.addPlatform(x, this.lastY, width);
    }

    addPlatform(x, y, w) {
        const type = this.biomesManager.getPlatformType(y);

        const p = new Platform(x, y, w, 30, type);
        this.platforms.push(p);
    }
    
    update(cameraTopY, cameraBottomY) {
        const generationHorizon = cameraTopY - 800; 
        if (this.lastY > generationHorizon) {
            this.generateChunk(generationHorizon - 500);
        }

        if (cameraBottomY !== undefined) {
            const cleanupLine = cameraBottomY + 1000;
            if (this.platforms.length > 20 && this.platforms[0].y > cleanupLine) {
                 this.platforms.shift();
            }
        }
        
        let dt = TimeManager.deltaTime;
        this.platforms.forEach(p => p.update(dt, this.width));
    }

    draw(ctx) {
        for (const p of this.platforms) {
            p.draw(ctx);
        }
    }
}