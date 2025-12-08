export class LevelGenerator {
    constructor(canvasWidth) {
        this.platforms = [];
        this.width = canvasWidth;
        this.lastY = 0;
        this.jumpHeight = 250;
        
        this.platforms.push({ x: 0, y: 0, w: canvasWidth, h: 40, type: 'floor' });
        
        this.generateChunk(-1000);
    }

    generateChunk(targetY) {
        while (this.lastY > targetY) {
            this.lastY -= (this.jumpHeight / 2 + Math.random() * (this.jumpHeight / 2));
            const count = Math.random() > 0.7 ? 2 : 1;
            
            for(let i=0; i<count; i++) {
                const w = 60 + Math.random() * 80;
                const x = Math.random() * (this.width - w);
                
                this.platforms.push({
                    x: x,
                    y: this.lastY,
                    w: w,
                    h: 20,
                    type: 'normal'
                });
            }
        }
    }
    
    update(cameraY) {
        const generationHorizon = cameraY - 1000; 
        if (this.lastY > generationHorizon) {
            this.generateChunk(generationHorizon - 1000);
        }

        // Usuwaj platformy, które spadły daleko w dół (optymalizacja)
        // Uwaga: W Jump Kingu spadanie na sam dół jest kluczowe, 
        // więc nie możemy usuwać platform, chyba że chcemy zresetować poziom przy upadku.
        // Jeśli robimy 'nieskończony' runner, usuwamy. Jeśli 'Tower', trzymamy.
        // Wymagania mówią: "climb as high as possible... falling causes long fall".
        // Wniosek: NIE USUWAĆ PLATFORM (lub usuwać bardzo nisko, np. 5000px pod kamerą).
    }

    draw(ctx) {
        ctx.fillStyle = '#654321';
        for (const p of this.platforms) {
            ctx.fillRect(p.x, p.y, p.w, p.h);
            ctx.fillStyle = '#44aa44';
            ctx.fillRect(p.x, p.y, p.w, 4);
            ctx.fillStyle = '#654321';
        }
    }
}