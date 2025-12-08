import { vJoyShot } from './utils/vJoyShot.js';
import { TimeManager } from './utils/TimeManager.js'; 
import { ScreenShake } from './utils/screenShake.js';
import { Game } from './Game.js';

// Engine
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
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
  const rect = canvas.parentNode.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  context.scale(dpr, dpr);
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
    requestAnimationFrame(loop);
}

main();
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);