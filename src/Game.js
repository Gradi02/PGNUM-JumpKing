import { Player } from './entities/Player.js';
import { LevelGenerator } from './systems/LevelGenerator.js';
import { Camera } from './systems/Camera.js';
import { GAME_STATE } from './enums.js';
import { BiomesManager } from './systems/BiomesManager.js';

export class Game {
    constructor(canvas, shotController) {
        this.canvas = canvas;
        this.shotController = shotController;

        this.player = null;
        this.biomesManager = new BiomesManager();
        this.level = null;
        this.camera = new Camera(canvas.height);
        
        this.score = 0;
        this.highScore = localStorage.getItem('jumpking_highscore') || 0;
        this.state = GAME_STATE.MENU;

        this.ui = {
            menu: document.getElementById('main-menu'),
            pauseMenu: document.getElementById('pause-menu'),
            gameOver: document.getElementById('game-over'),
            
            score: document.getElementById('score-val'),
            highScore: document.getElementById('high-score-val'),
            finalScore: document.getElementById('final-score'),
            
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            quitBtn: document.getElementById('quit-btn'),
            menuBtn: document.getElementById('menu-btn')
        };

        this.ui.highScore.innerText = Math.floor(this.highScore);
        this.initGameWorld();
        this.bindEvents();
    }

    initGameWorld() {
        this.camera.height = this.canvas.height;
        this.player = new Player(this.canvas.width / 2, -100);
        this.level = new LevelGenerator(this.canvas.width, this.canvas.height, this.player, this.biomesManager, this.camera);

        this.camera.reset(this.player.pos.y);
        this.level.update(this.camera.y, this.camera.bottom);
        
        this.score = 0;
        this.ui.score.innerText = '0';
    }

    bindEvents() {
        const evt = 'click';

        this.ui.startBtn.addEventListener(evt, (e) => { 
            e.preventDefault(); 
            this.startGame(); 
        });

        this.ui.restartBtn.addEventListener(evt, (e) => { 
            e.preventDefault(); 
            this.initGameWorld();
            this.startGame(); 
        });

        if(this.ui.menuBtn) {
            this.ui.menuBtn.addEventListener(evt, (e) => {
                e.preventDefault();
                this.goToMenu();
            });
        }

        this.ui.pauseBtn.addEventListener(evt, (e) => {
            e.preventDefault();
            this.togglePause();
        });

        this.ui.resumeBtn.addEventListener(evt, (e) => {
            e.preventDefault();
            this.togglePause();
        });

        this.ui.quitBtn.addEventListener(evt, (e) => {
            e.preventDefault();
            this.goToMenu();
        });
    }

    startGame() {
        this.state = GAME_STATE.PLAYING;
        
        this.ui.menu.classList.add('hidden');
        this.ui.gameOver.classList.add('hidden');
        this.ui.pauseMenu.classList.add('hidden');
        
        this.ui.pauseBtn.classList.remove('pause-hidden');
    }

    goToMenu() {
        this.state = GAME_STATE.MENU;
        this.initGameWorld();

        this.ui.menu.classList.remove('hidden');
        this.ui.pauseMenu.classList.add('hidden');
        this.ui.gameOver.classList.add('hidden');
        this.ui.pauseBtn.classList.add('pause-hidden');
    }

    togglePause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
            this.ui.pauseMenu.classList.remove('hidden');
            this.ui.pauseBtn.classList.add('pause-hidden');
        } else if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
            this.ui.pauseMenu.classList.add('hidden');
            this.ui.pauseBtn.classList.remove('pause-hidden');
            
            this.shotController.resetForce(); 
        }
    }

    update(dt) {
        if(this.state === GAME_STATE.GAMEOVER) {
            this.player.update(dt, this.canvas.width);
        }

        if (this.state !== GAME_STATE.PLAYING) return;

        this.player.handleInput(this.shotController);
        this.player.update(dt, this.canvas.width);
        this.player.isGrounded = false;

        for (const p of this.level.platforms) {
            this.player.resolvePlatformCollision(p, dt);
        }

        this.camera.update(this.player.pos.y, dt);
        this.biomesManager.update(this.player.pos.y);
        this.level.update(this.camera.y, this.camera.bottom);

        const currentHeight = Math.max(0, Math.floor(-this.player.pos.y / 10));
        if (currentHeight > this.score) {
            this.score = currentHeight;
            this.ui.score.innerText = this.score;
        }

        const deathLine = this.camera.bottom - this.player.size;
        if (this.player.pos.y > deathLine) {
            this.gameOver();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.fillStyle = this.biomesManager.getCurrentBgColor(this.player.pos.y);
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();

        ctx.save();
        ctx.translate(0, -Math.floor(this.camera.y));

        this.level.draw(ctx);
        this.player.draw(ctx);

        ctx.restore();

        if (this.state === GAME_STATE.PLAYING) {
            this.shotController.draw(ctx);
        }
    }

    gameOver() {
        this.state = GAME_STATE.GAMEOVER;
        
        if (this.player) {
            this.player.onDead();
        }

        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('jumpking_highscore', this.highScore);
        }

        setTimeout(() => {
            this.ui.gameOver.classList.remove('hidden');
            this.ui.pauseBtn.classList.add('pause-hidden');
            this.ui.finalScore.innerText = this.score;
            this.ui.highScore.innerText = this.highScore;

        }, 1500); 
    }
}