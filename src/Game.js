import { Player } from './entities/Player.js';
import { LevelGenerator } from './systems/LevelGenerator.js';
import { Camera } from './systems/Camera.js';

export class Game {
    constructor(canvas, shotController) {
        this.canvas = canvas;
        this.shotController = shotController;
        this.player = null;
        this.level = null;
        this.camera = { y: 0 }; 
        
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
        ['click', 'touchstart'].forEach(evt => {
            this.ui.startBtn.addEventListener(evt, (e) => { e.preventDefault(); this.start(); });
            this.ui.restartBtn.addEventListener(evt, (e) => { e.preventDefault(); this.start(); });
        });
    }

    start() {
        this.player = new Player(this.canvas.width / 2, -100);
        
        this.level = new LevelGenerator(this.canvas.width);
        
        this.camera.y = this.player.pos.y - (this.canvas.height * 0.7);
        
        const viewTop = this.camera.y - this.canvas.height;
        this.level.update(viewTop);

        this.state = 'PLAYING';
        this.ui.menu.style.display = 'none';
        this.ui.gameOver.style.display = 'none';
        this.score = 0;
        this.ui.score.innerText = '0';
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

        const targetCamY = this.player.pos.y - this.canvas.height * 0.6;
        
        const lerpSpeed = 5 * dt;
        const potentialNewY = this.camera.y + (targetCamY - this.camera.y) * lerpSpeed;

        if (potentialNewY < this.camera.y) {
            this.camera.y = potentialNewY;
        }
        
        const cameraBottom = this.camera.y + this.canvas.height;
        this.level.update(this.camera.y, cameraBottom);

        const currentHeight = Math.max(0, Math.floor(-this.player.pos.y / 10));
        if (currentHeight > this.score) {
            this.score = currentHeight;
            this.ui.score.innerText = this.score;
        }

        const deathLine = this.camera.y + this.canvas.height + 50;
        
        if (this.player.pos.y > deathLine) {
            this.gameOver();
        }
    }

    draw(ctx) {
        if (this.state !== 'PLAYING') return;

        ctx.save();
        ctx.translate(0, -Math.floor(this.camera.y));

        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const startY = Math.floor(this.camera.y / 100) * 100;
        const endY = startY + this.canvas.height + 200;

        for(let y = startY; y < endY; y += 100) {
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
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
        this.ui.finalScore.innerText = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('jumpking_highscore', this.highScore);
            this.ui.highScore.innerText = this.highScore;
        }
        
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
}