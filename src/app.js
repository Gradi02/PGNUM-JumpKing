import { vJoyShot } from './utils/vJoyShot.js';
import { TimeManager } from './utils/TimeManager.js'; 
import { ScreenShake } from './utils/screenShake.js';
import { Game } from './Game.js';

// Engine
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const container = document.getElementById('game-container');
const shotController = new vJoyShot(canvas, { 
    maxForce: 40,
    slowMotionScale: 0.1,
    visualScale: 3.0,
    minLineWidth: 3,
    maxLineWidth: 10,
    arrowMinColor: 'rgba(0, 204, 219, 0.7)', 
    arrowMaxColor: 'rgba(255, 50, 50, 1.0)',
    maxRangeColor: 'rgba(192, 0, 0, 0.02)',
    easingFactor: 1
});

const game = new Game(canvas, shotController);

function resizeCanvas() {
    // 1. Pobierz aktualne wymiary kontenera (to co ustawił CSS)
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 2. Ustaw bufor canvasa dokładnie na te wymiary
    // UWAGA: Nie używamy tu window.devicePixelRatio, aby uniknąć problemów z koordynatami
    // Jeśli gra będzie lekko rozmyta na high-end telefonach, to trudno - ważniejsze, że działa.
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        
        console.log(`Resized to: ${width}x${height}`);

        // WAŻNE: Jeśli twoja klasa Game ma metody do aktualizacji rozmiaru (np. kamery), wywołaj je tutaj:
        // if (game.onResize) game.onResize(width, height);
    }
    
    // Wymuś przerysowanie natychmiast po zmianie rozmiaru
    game.draw(context);
}


function loop(now){
    TimeManager.update(now);
    const dt = TimeManager.deltaTime;
    ScreenShake.update(dt);
    
    game.update(dt);

    ScreenShake.apply(context);
    context.clearRect(0, 0, canvas.width / (window.devicePixelRatio||1), canvas.height / (window.devicePixelRatio||1));
    
    context.fillStyle = '#111';
    context.fillRect(0,0, canvas.width, canvas.height);

    game.draw(context);
    
    ScreenShake.restore(context);

    requestAnimationFrame(loop);
}


async function main() {
    resizeCanvas();
    requestAnimationFrame(loop);
}

main();
let resizeTimeout;
window.addEventListener('resize', () => {
    // Debounce - nie odpalaj resize 100 razy na sekundę przy obracaniu telefonu
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 100);
});
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 200);
});