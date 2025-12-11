export class Camera {
    constructor() {
        this.y = 0;
        this.offsetY = 0;
    }

    update(targetY, canvasHeight, dt, levelHeight = null) {
        // Celujemy tak, aby gracz był w 60% wysokości ekranu
        const targetCamY = targetY - (canvasHeight * 0.6);
        
        // Płynne podążanie (Lerp)
        if (targetCamY > this.y) {
            this.y += (targetCamY - this.y) * 5 * dt; 
        } else {
            this.y += (targetCamY - this.y) * 10 * dt;
        }

        // 1. Ograniczenie DOLNE (podłoga) - nie pokazujemy nic poniżej 0
        if (this.y < 0) this.y = 0;

        // 2. Ograniczenie GÓRNE (sufit) - nie pokazujemy nic powyżej końca poziomu
        if (levelHeight !== null) {
            // Kamera nie może wyjechać wyżej niż (WysokośćPoziomu - WysokośćEkranu)
            // Dzięki temu góra poziomu będzie przyklejona do góry ekranu
            const maxCamY = levelHeight - canvasHeight;
            
            // Jeśli poziom jest mniejszy niż ekran, centrujemy lub trzymamy na dole (zabezpieczenie)
            if (maxCamY < 0) {
                this.y = 0; 
            } else if (this.y > maxCamY) {
                this.y = maxCamY;
            }
        }
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(0, -Math.floor(this.y));
    }
}