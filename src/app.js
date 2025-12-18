import { vJoyShot } from './utils/vJoyShot.js';
import { TimeManager } from './utils/TimeManager.js'; 
import { ScreenShake } from './utils/screenShake.js';
import { Game } from './Game.js';
import { assets } from './systems/AssetsManager.js';

const container = document.getElementById('game-container');
const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
context.mozImageSmoothingEnabled = false;
context.webkitImageSmoothingEnabled = false;
context.msImageSmoothingEnabled = false;

let shotController;
let game;

const gameAssets = {
    'atlas': '../images/assets.png',
    'player': '../images/cat.png'
};

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
    game.camera.draw(context, canvas.width);

    requestAnimationFrame(loop);
}

async function main() {
    await assets.loadAll(gameAssets);

    assets.defineTile('platform_grass_bottom', 'atlas', 1, 2);
    assets.defineTile('platform_grass', 'atlas', 1, 1);
    assets.defineTile('platform_ice', 'atlas', 13, 9);
    assets.defineTile('platform_bounce', 'atlas', 5, 5);
    assets.defineTile('platform_moving', 'atlas', 9, 1);
    assets.defineTile('platform_breakable', 'atlas', 9, 5);

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