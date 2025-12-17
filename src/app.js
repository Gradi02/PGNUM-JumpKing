import { vJoyShot } from './utils/vJoyShot.js';
import { TimeManager } from './utils/TimeManager.js'; 
import { ScreenShake } from './utils/screenShake.js';
import { Game } from './Game.js';

const container = document.getElementById('game-container');
const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');

let shotController;
let game;

function resizeCanvas() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;

        if (game && game.camera) {
            game.camera.height = height;
        }

        if (shotController && shotController.onResize) {
            shotController.onResize(); 
        }

        if (game) {
            game.draw(context);
        }
    }
}

function loop(now){
    TimeManager.update(now);
    const dt = TimeManager.deltaTime;
    ScreenShake.update(dt);
    
    if (game) {
        game.update(dt);
    }
    ScreenShake.apply(context);

    context.fillStyle = '#111';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    if (game) {
        game.draw(context);
    }
    
    ScreenShake.restore(context);

    requestAnimationFrame(loop);
}

async function main() {
    resizeCanvas();
    
    shotController = new vJoyShot(canvas);
    game = new Game(canvas, shotController);
    game.initGameWorld(); 

    requestAnimationFrame(loop);
}

document.addEventListener('DOMContentLoaded', () => {
    main();
});

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 100);
});
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 200);
});