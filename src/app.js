import { vJoyShot } from './utils/vJoyShot.js';
import { TimeManager } from './utils/TimeManager.js'; 
import { ScreenShake } from './utils/screenShake.js';
import { Game } from './Game.js';

// Engine
const container = document.getElementById('game-container');
const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');

const shotController = new vJoyShot(canvas);
const game = new Game(canvas, shotController);

function resizeCanvas() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;

        if (game && game.camera) {
            game.camera.height = height;
        }

        if (shotController.onResize) {
            shotController.onResize(); 
        }

        game.draw(context);
    }
}


function loop(now){
    TimeManager.update(now);
    const dt = TimeManager.deltaTime;
    ScreenShake.update(dt);
    
    game.update(dt);
    ScreenShake.apply(context);

    context.fillStyle = '#111';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
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
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 100);
});
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 200);
});