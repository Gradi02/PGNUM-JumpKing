import { Player } from './entities/Player.js';
import { LevelGenerator } from './systems/LevelGenerator.js';
import { Camera } from './systems/Camera.js';
import { GAME_STATE } from './enums.js';
import { BiomesManager } from './systems/BiomesManager.js';
import { particles } from './systems/ParticleSystem.js';    
import { ScreenShake } from './utils/screenShake.js';
import { saveHighScore, getLeaderboard, loginWithGoogle, getCurrentUser, onAuthUpdate, getUserBestScore, logout } from './firebase.js';

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
        this.highScore = parseInt(localStorage.getItem('jumpking_highscore')) || 0;
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
            menuBtn: document.getElementById('menu-btn'),

            rankBtn: document.getElementById('rank-btn'),
            closeRankBtn: document.getElementById('close-rank-btn'),
            leaderboardUI: document.getElementById('leaderboard-ui'),
            leaderboardList: document.getElementById('leaderboard-list'),
            loginBtn: document.getElementById('login-btn'),
            authSection: document.getElementById('auth-section'),
            userInfo: document.getElementById('user-info'),
            userName: document.getElementById('user-name'),
            logoutLink: document.getElementById('logout-link'),
        };

        this.ui.highScore.innerText = Math.floor(this.highScore);
        this.resize(); 
        this.initGameWorld();
        this.bindEvents();
        this.initParticles();

        onAuthUpdate(async (user) => {
            if (user) {
                this.ui.loginBtn.classList.add('hidden');
                this.ui.userInfo.classList.remove('hidden');
                this.ui.userName.innerText = user.displayName ? user.displayName.split(' ')[0] : 'User';

                const onlineBest = await getUserBestScore(user.uid);
                const localBest = parseInt(localStorage.getItem('jumpking_highscore')) || 0;

                if (onlineBest !== null) {
                    if (localBest > onlineBest) {
                        await saveHighScore(localBest);
                        this.highScore = localBest;
                    } else {
                        this.highScore = onlineBest;
                        localStorage.setItem('jumpking_highscore', this.highScore);
                    }
                } else if (localBest > 0) {
                    await saveHighScore(localBest);
                    this.highScore = localBest;
                }
                
                this.ui.highScore.innerText = Math.floor(this.highScore);

            } else {
                this.ui.loginBtn.classList.remove('hidden');
                this.ui.userInfo.classList.add('hidden');
                
                this.ui.loginBtn.disabled = false;
                this.ui.loginBtn.innerText = "LOGIN TO SAVE RESULT";
                
                this.ui.logoutLink.innerText = "Logout";

                localStorage.removeItem('jumpking_highscore');
                this.highScore = 0;
                this.ui.highScore.innerText = '0';
            }
        });
    }

    initGameWorld() {
        this.camera = new Camera(this.virtualHeight, this.virtualWidth);
        this.player = new Player(this.virtualWidth / 2, -50);
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

        this.ui.rankBtn.addEventListener(evt, async () => {
            this.ui.leaderboardUI.classList.remove('hidden');
            this.showLeaderboard();
        });

        this.ui.closeRankBtn.addEventListener(evt, () => {
            this.ui.leaderboardUI.classList.add('hidden');
        });

        this.ui.loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (this.ui.loginBtn.disabled) return;

            this.ui.loginBtn.disabled = true;
            this.ui.loginBtn.innerText = "LOGIN...";

            try {
                const user = await loginWithGoogle();
                
                if (!user) {
                    this.ui.loginBtn.disabled = false;
                    this.ui.loginBtn.innerText = "LOGIN TO SAVE RESULT";
                }
            } catch (err) {
                console.error("Critical login error", err);
                this.ui.loginBtn.disabled = false;
                this.ui.loginBtn.innerText = "LOGIN ERROR";
            }
        });

        this.ui.logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            
            this.ui.logoutLink.innerText = "Logging out...";
            
            const success = await logout();
            
            if (!success) {
                this.ui.logoutLink.innerText = "Logout (Error)";
                setTimeout(() => { this.ui.logoutLink.innerText = "Logout"; }, 2000);
            }
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

    async showLeaderboard() {
        this.ui.leaderboardList.innerHTML = "LOADING...";
        try {
            const scores = await getLeaderboard();
            if (scores.length === 0) {
                this.ui.leaderboardList.innerHTML = "NO SCORES YET";
                return;
            }
            let html = "";
            scores.forEach((entry, index) => {
                html += `<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; gap: 10px">
                    <span style="min-width: 20px">${index + 1}.</span>
                    <img src="${entry.photo || 'images/default-cat.png'}" style="width:20px; height:20px; border-radius:50%">
                    <span style="flex-grow:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${entry.name}</span>
                    <span style="color:var(--primary)">${entry.score}M</span>
                </div>`;
            });
            this.ui.leaderboardList.innerHTML = html;
        } catch (e) {
            this.ui.leaderboardList.innerHTML = "FAILED TO LOAD";
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

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('jumpking_highscore', this.highScore);
            
            if (getCurrentUser()) {
                saveHighScore(this.score);
            }
        }

        setTimeout(() => {
            this.ui.gameOver.classList.remove('hidden');
            this.ui.pauseBtn.classList.add('pause-hidden');
            this.ui.finalScore.innerText = this.score;
            this.ui.highScore.innerText = this.highScore;
        }, 1500); 
    }
}