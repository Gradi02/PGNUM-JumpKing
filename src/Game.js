import { Player } from './entities/Player.js';
import { LevelGenerator } from './systems/LevelGenerator.js';
import { Camera } from './systems/Camera.js';
import { GAME_STATE } from './enums.js';
import { BiomesManager } from './systems/BiomesManager.js';
import { particles } from './systems/ParticleSystem.js';    
import { ScreenShake } from './utils/screenShake.js';

export class Game {
    constructor(canvas, shotController) {
        this.canvas = canvas;
        this.shotController = shotController;

        this.DESIGN_WIDTH = 500; 
        this.scale = 1;
        this.virtualWidth = this.DESIGN_WIDTH;
        this.virtualHeight = this.canvas.height;

        this.player = null;
        this.biomesManager = new BiomesManager();
        this.level = null;
        this.camera = null;
        
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
        this.resize(); 
        this.initGameWorld();
        this.bindEvents();
        this.initParticles();
    }

    initGameWorld() {
        this.camera = new Camera(this.virtualHeight, this.virtualWidth);
        this.player = new Player(this.virtualWidth / 2, -100);
        this.level = new LevelGenerator(this.virtualWidth, this.virtualHeight, this.player, this.biomesManager, this.camera);

        this.camera.reset(this.player.pos.y);
        this.level.update(this.camera.y, this.camera.bottom);
        
        this.score = 0;
        this.ui.score.innerText = '0';
    }

    initParticles() {

        // Player Death
        particles.addPreset('blood', {
            color: ['#ff0000', '#8a0303', '#ff4d4d'],
            size: { min: 4, max: 8 },
            speed: { min: 600, max: 1000 },
            angle: { min: 0, max: 360 },
            life: { min: 1, max: 1.5 },
            gravity: 1000,
            friction: 0.95,
            spread: 10,
            shrink: true
        });

        // Player Jump
        particles.addPreset('dust', {
            color: ['#dddddd', '#999999'],
            size: { min: 5, max: 8 },
            speed: { min: 10, max: 40 },
            angle: { min: 200, max: 340 },
            life: { min: 0.2, max: 0.5 },
            gravity: -100,
            spread: 10,
            fade: true,
            layer: -1
        });
        
        // Player Trail
        particles.addPreset('trail', {
            color: ['#eeeeee4d'],
            size: { min: 3, max: 5 },
            speed: { min: 5, max: 20 },
            angle: { min: 200, max: 340 },
            life: { min: 0.1, max: 0.25 },
            gravity: -100,
            spread: 5,
            fade: true,
            layer: -1
        });

        // Lava Fumes
        particles.addPreset('lava_fumes', {
            color: ['#ff4d4d80', '#ffaa0080', '#cc202080'], 
            size: { min: 2, max: 6 },
            speed: { min: 20, max: 50 },
            angle: { min: 260, max: 280 },
            life: { min: 1.0, max: 2.0 },
            gravity: -50,
            friction: 0.98,
            fade: true,
            shrink: true,
            ui: true,
        });

        // Breaking
        particles.addPreset('breaking', {
            color: ['#ffde4d80', '#ffaa0080', '#cc812080', '#66220080', '#33110080'], 
            size: { min: 2, max: 6 },
            speed: { min: 20, max: 50 },
            angle: { min: 0, max: 360 },
            life: { min: 0.25, max: 1.0 },
            gravity: 600,
            friction: 0.98,
            fade: true,
            shrink: true,
            layer: -2
        });
        
        // Collect Item
        particles.addPreset('sparkle', {
            color: '#FFFF00',
            size: { min: 2, max: 3 },
            speed: { min: 60, max: 220 },
            angle: { min: 0, max: 360 },
            life: { min: 0.5, max: 1.0 },
            friction: 0.9,
            layer: -1
        });

        // Item
        particles.addPreset('sparkle_aura', {
            color: '#ffff009f',
            size: { min: 2, max: 3 },
            speed: { min: 20, max: 120 },
            angle: { min: 0, max: 360 },
            life: { min: 0.2, max: 0.5 },
            friction: 0.9,
            spread: 20,
            layer: -1
        });

        // Strength Effect
        particles.addPreset('strength', {
            color: ['#ff00dd9f', '#dd00ff9f', '#aa00ff9f'],
            size: { min: 1, max: 2 },
            speed: { min: 10, max: 40 },
            angle: { min: 0, max: 360 },
            life: { min: 0.5, max: 1 },
            gravity: -200,
            spread: 5,
            fade: true,
            shrink: true,
            layer: -1
        });
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

    resize() {
        const width = this.canvas.width;
        
        if (width === 0) return;

        this.scale = width / this.DESIGN_WIDTH;
        this.virtualHeight = this.canvas.height / this.scale;

        if (this.camera) {
            this.camera.height = this.virtualHeight;
        }

        if(this.shotController && this.shotController.onResize) {
            this.shotController.onResize(this.virtualWidth, this.virtualHeight); 
        }
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
            this.player.update(dt, this.virtualWidth);
            particles.update();
        }

        if (this.state !== GAME_STATE.PLAYING) return;

        this.player.handleInput(this.shotController);
        this.player.update(dt, this.virtualWidth);
        particles.update();
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
        ctx.scale(this.scale, this.scale);
        ctx.translate(0, -Math.floor(this.camera.y));

        particles.draw(ctx, this.camera, -2);
        this.level.draw(ctx);
        particles.draw(ctx, this.camera, -1);
        this.player.draw(ctx);
        particles.draw(ctx, this.camera);

        ctx.restore();

        if (this.state === GAME_STATE.PLAYING) {
            this.shotController.draw(ctx, this.player, this.camera, this.scale);
        }

        if(this.camera !== undefined) {
            this.camera.drawHUD(ctx, this.player); 
        }
    }

    gameOver() {
        this.state = GAME_STATE.GAMEOVER;
        ScreenShake.shake(0.5, 10);
        
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