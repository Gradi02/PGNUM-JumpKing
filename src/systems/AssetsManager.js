import { Sprite } from './Sprite.js';

class AssetsManager {
    constructor() {
        this.images = new Map();
        this.sprites = new Map();
    }

    getAnimationStrip(sheetKey, x, y, w, h, frameCount) {
        const image = this.images.get(sheetKey);
        if (!image) {
            console.error(`AssetManager: Brak obrazka '${sheetKey}'`);
            return [];
        }

        const frames = [];
        for (let i = 0; i < frameCount; i++) {
            const currentX = x + (i * w);
            
            frames.push(new Sprite(image, currentX, y, w, h));
        }

        return frames;
    }

    getAnimationStripByGrid(sheetKey, startCol, row, frameCount, size = 32) {
        return this.getAnimationStrip(
            sheetKey, 
            startCol * size, // x w pikselach
            row * size,      // y w pikselach
            size,            // szerokość
            size,            // wysokość
            frameCount
        );
    }

    loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                this.images.set(key, img);
                resolve(img);
            };
            img.onerror = reject;
        });
    }

    async loadAll(assetsList) {
        const promises = Object.keys(assetsList).map(key => 
            this.loadImage(key, assetsList[key])
        );
        await Promise.all(promises);
    }

    defineSprite(spriteName, sheetKey, x, y, w, h) {
        const image = this.images.get(sheetKey);
        if (!image) {
            console.error(`Błąd: Nie znaleziono obrazka źródłowego o nazwie '${sheetKey}'`);
            return;
        }
        const sprite = new Sprite(image, x, y, w, h);
        this.sprites.set(spriteName, sprite);
    }

    defineTile(name, sheetKey, col, row, size = 32) {
        const x = col * size;
        const y = row * size;
        this.defineSprite(name, sheetKey, x, y, size, size);
    }

    getSprite(name) {
        return this.sprites.get(name);
    }
}

export const assets = new AssetsManager();