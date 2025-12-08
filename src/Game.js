import { Player } from './entities/Player.js';
import { LevelGenerator } from './systems/LevelGenerator.js';
import { Camera } from './systems/Camera.js';

export class Game {
    constructor(canvas, shotController) {
        this.canvas = canvas;
        this.shotController = shotController;
        this.player = null;
        this.level = null;
        this.camera = new Camera();
        
        this.score = 0;
        this.highScore = localStorage.getItem('jumpking_highscore') || 0;
        this.state = 'MENU';

        this.ui = {
            menu: document.getElementById('main-menu'),
            gameOver: document.getElementById('game-over'),
            score: document.getElementById('score-val'),
            highScore: document.getElementById('high-score-val'),
            finalScore: document.getElementById('final-score'),
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn')
        };

        this.ui.highScore.innerText = Math.floor(this.highScore);
        
        this.bindEvents();
    }

    bindEvents() {
        this.ui.startBtn.addEventListener('click', () => this.start());
        this.ui.restartBtn.addEventListener('click', () => this.start());
    }

    start() {
        this.player = new Player(this.canvas.width / 2, -50);
        
        this.level = new LevelGenerator(this.canvas.width);
        
        this.camera.y = -this.canvas.height; 
        
        this.state = 'PLAYING';
        this.ui.menu.style.display = 'none';
        this.ui.gameOver.style.display = 'none';
        this.score = 0;
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        this.player.handleInput(this.shotController);
        this.player.update(dt, this.canvas.width);

        let onPlatform = false;
        for (const p of this.level.platforms) {
            if (this.player.resolvePlatformCollision(p)) {
                onPlatform = true;
            }
        }

        if (this.player.pos.y > 200) {
            this.gameOver();
        }

        const currentHeight = Math.max(0, -this.player.pos.y);
        if (currentHeight > this.score) {
            this.score = currentHeight;
            this.ui.score.innerText = Math.floor(this.score / 10);
        }

        this.level.update(this.player.pos.y);
        const targetCamY = this.player.pos.y - this.canvas.height * 0.6;
        this.camera.y += (targetCamY - this.camera.y) * 5 * dt;
        
        if (this.camera.y > -this.canvas.height) {
            this.camera.y = -this.canvas.height;
        }
    }

    draw(ctx) {
        if (this.state !== 'PLAYING') return;

        ctx.save();
        ctx.translate(0, -this.camera.y);

        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        for(let i=0; i<20; i++) {
            ctx.moveTo(0, this.camera.y + i * 100);
            ctx.lineTo(this.canvas.width, this.camera.y + i * 100);
        }
        ctx.stroke();

        this.level.draw(ctx);
        this.player.draw(ctx);
        
        ctx.restore();
        this.shotController.draw(ctx);
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.ui.gameOver.style.display = 'block';
        this.ui.finalScore.innerText = Math.floor(this.score / 10);
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('jumpking_highscore', this.highScore);
            this.ui.highScore.innerText = Math.floor(this.highScore / 10);
        }
        
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
}