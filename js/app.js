import { vJoyShot } from './vJoyShot.js';
import { TimeManager } from './TimeManager.js'; 
import { ScreenShake } from './screenShake.js';

// Engine
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const shotController = new vJoyShot(canvas, { 
    maxForce: 50,
    slowMotionScale: 0.1,

    visualScale: 3.0,
    minLineWidth: 3,
    maxLineWidth: 10,
    arrowMinColor: 'rgba(0, 204, 219, 0.7)', 
    arrowMaxColor: 'rgba(255, 50, 50, 1.0)',
    maxRangeColor: 'rgba(192, 0, 0, 0.02)',

    easingFactor: 1
});

const state = {
    objects: [],
};

function update(dt){
    // for (const b of state.objects) {
    //     b.updatePosition(dt);
    //     b.collider.checkForStaticCollisions(canvas.width,canvas.height);
    // }

    // for (let i = 0; i < state.objects.length; i++) {
    //     for (let j = i + 1; j < state.objects.length; j++) {
    //         state.objects[i].collider.isCollidingWith(state.objects[j]) && (() => {
    //             state.objects[i].collider.applyCollisionResponse(state.objects[i], state.objects[j]);
    //         })();
    //     }
    // }
}

function handleInputs(dt){
    // if(state.currentPlayer != null){
    //     state.currentPlayer.handleInputs(dt, shotController);
    //     state.currentPlayer.handleVelocityLimit();
    //     return;
    // }
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  canvas.scale(dpr, dpr);
}

function render(){
    ScreenShake.apply(context);
    context.clearRect(0,0,canvas.width,canvas.height);

    for (const b of state.objects) {
        b.draw(context);
    }

    shotController.draw(context);
    ScreenShake.restore(context);
}

function loop(now){
    TimeManager.update(now);
    const dt = TimeManager.deltaTime;

    ScreenShake.update(dt);
    handleInputs(dt);
    update(dt);
    render();

    requestAnimationFrame(loop);
}

async function main() {
    requestAnimationFrame(loop);
}

main();
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);