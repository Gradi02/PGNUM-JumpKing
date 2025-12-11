import { Platform } from '../entities/Platform.js';

export class LevelGenerator {
    constructor(canvasWidth) {
        this.platforms = [];
        this.width = canvasWidth;
        
        this.maxJumpHeight = 250; 
        
        this.lastY = 0;
        this.platforms.push(new Platform(0, 0, canvasWidth, 40, 'floor'));
        this.generateChunk(-1200);
    }

    generateChunk(targetY) {
        while (this.lastY > targetY) {
            this.createNextRow();
        }
    }

    createNextRow() {
        const gapY = 70 + Math.random() * 50; 
        this.lastY -= gapY;

        const heightFactor = Math.min(1, Math.abs(this.lastY) / 20000);
        const minWidth = 60 - (heightFactor * 40);
        const widthVar = 60 - (heightFactor * 30);

        // KROK 3: Decyzja - 1 długa czy 2 krótsze?
        // 30% szans na rozdwojenie ścieżki
        const isSplitPath = Math.random() > 0.7;

        if (isSplitPath) {
            // --- Dwie platformy (lewa i prawa) ---
            const w1 = minWidth + Math.random() * widthVar;
            const w2 = minWidth + Math.random() * widthVar;

            // Lewa strona (z marginesem od ściany)
            const x1 = Math.random() * (this.width / 2 - w1);
            
            // Prawa strona
            const x2 = (this.width / 2) + Math.random() * (this.width / 2 - w2);

            this.addPlatform(x1, this.lastY, w1);
            this.addPlatform(x2, this.lastY, w2);

        } else {
            // --- Pojedyncza platforma ---
            const w = minWidth + Math.random() * widthVar + 20; // Nieco szersze niż przy split
            
            // Unikaj generowania platformy idealnie na środku cały czas
            // Losuj pozycję, ale z marginesem od ścian
            let x = Math.random() * (this.width - w);
            
            this.addPlatform(x, this.lastY, w);
        }
    }

    addPlatform(x, y, w) {
        let type = 'normal';
        if (Math.random() > 0.65) type = 'ice'; 
        if (Math.random() > 0.88) type = 'bouncy';

        const p = new Platform(x, y, w, 20, type);
        this.platforms.push(p);
    }
    
    update(cameraTopY, cameraBottomY) {
        const generationHorizon = cameraTopY - 800; 
        if (this.lastY > generationHorizon) {
            this.generateChunk(generationHorizon - 500);
        }

        if (cameraBottomY !== undefined) {
            const cleanupLine = cameraBottomY + 1500;
            if (this.platforms.length > 0 && this.platforms[0].y > cleanupLine) {
                 this.platforms = this.platforms.filter(p => p.y <= cleanupLine);
            }
        }
        
        this.platforms.forEach(p => p.update());
    }

    draw(ctx) {
        for (const p of this.platforms) {
            p.draw(ctx);
        }
    }
}