import { Player } from './entities/Player.js';
import { LevelGenerator } from './systems/LevelGenerator.js';
import { Camera } from './systems/Camera.js';
import { GAME_STATE } from './enums.js';
import { BiomesManager } from './systems/BiomesManager.js';
import { particles } from './systems/ParticleSystem.js';    
import { ScreenShake } from './utils/screenShake.js';
import {
  saveHighScore,
  getLeaderboard,
  loginWithGoogle,
  getCurrentUser,
  onAuthUpdate,
  getUserBestScore,
  logout,
  saveFish,
  getUserFish
} from './firebase.js';

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
        this.totalFish = parseInt(localStorage.getItem('fish_total')) || 0;
        this.runFish = 0;

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

            updateBanner: document.getElementById('update-banner'),
            updateBtn: document.getElementById('update-btn'),

            fishHud: document.getElementById('fish-hud'),   
            fishMenu: document.getElementById('fish-menu'),     
            fishGameOver: document.getElementById('fish-gameover'),
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

                const onlineFish = await getUserFish(user.uid);
                const localFish = parseInt(localStorage.getItem('fish_total')) || 0;

                if (onlineFish !== null) {
                    if (localFish > onlineFish) {
                        await saveFish(localFish);
                        this.totalFish = localFish;
                    } else {
                        this.totalFish = onlineFish;
                        localStorage.setItem('fish_total', this.totalFish);
                    }
                } else if (localFish > 0) {
                    await saveFish(localFish);
                    this.totalFish = localFish;
                }

                this.updateFishUI();
            } else {
                this.ui.loginBtn.classList.remove('hidden');
                this.ui.userInfo.classList.add('hidden');
                
                this.ui.loginBtn.disabled = false;
                this.ui.loginBtn.innerText = "LOGIN TO SAVE RESULT";
                
                this.ui.logoutLink.innerText = "Logout";

                localStorage.removeItem('jumpking_highscore');
                this.highScore = 0;
                this.ui.highScore.innerText = '0';

                localStorage.removeItem('fish_total');
                this.totalFish = 0;
                this.updateFishUI();
            }
        });
    }

    updateFishUI() {
        if (this.ui.fishHud) {
            this.ui.fishHud.innerText = this.runFish;
        }
        if (this.ui.fishMenu) {
            this.ui.fishMenu.innerText = this.totalFish;
        }
        if (this.ui.fishGameOver) {
            this.ui.fishGameOver.innerText = `+${this.runFish}`;
        }
    }

    saveFish() {
        this.totalFish += this.runFish;
        localStorage.setItem('fish_total', this.totalFish);
    }

    showUpdateBanner() {
        if (this.state === GAME_STATE.MENU) {
            this.ui.updateBanner.classList.remove('hidden');
        }
    }

    initGameWorld() {
        this.camera = new Camera(this.virtualHeight, this.virtualWidth);
        this.player = new Player(this.virtualWidth / 2, -30);
        this.level = new LevelGenerator(this.virtualWidth, this.virtualHeight, this.player, this.biomesManager, this.camera, this);

        this.camera.reset(this.player.pos.y);
        this.level.update(this.camera.y, this.camera.bottom);
        
        this.score = 0;
        this.ui.score.innerText = '0';

        this.runFish = 0;
        this.updateFishUI();
    }

    addFish(amount = 1) {
        this.runFish += amount;
        this.updateFishUI();
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

        // Collect Item fish
        particles.addPreset('sparkle_white', {
            color: '#ffffffa8',
            size: { min: 1, max: 2 },
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

        // Item fish
        particles.addPreset('sparkle_aura_white', {
            color: '#ffffffa8',
            size: { min: 1, max: 2 },
            speed: { min: 20, max: 100 },
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

        // shoes Effect
        particles.addPreset('shoes', {
            color: ['#f6ff009f', '#ffc4009f', '#ffd5009f'],
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

        // Bounce Platform
        particles.addPreset('bounce_platform', {
            color: ['#ff4de7b6', '#b902c0b0', '#c63ef4d0'], 
            size: { min: 1, max: 2 },
            speed: { min: 10, max: 40 },
            angle: { min: 260, max: 280 },
            life: { min: 1.0, max: 2.0 },
            gravity: -50,
            friction: 0.98,
            fade: true,
            shrink: true,
            spread: 2,
            layer: -2,
        });

        // Ice Platform
        particles.addPreset('ice_platform', {
            color: ['#4da3ffb6', '#02b7c0b0', '#3ed9f4d0', '#1de8f3d6', '#83f9edd0'], 
            size: { min: 0.7, max: 1.5 },
            speed: { min: 10, max: 40 },
            angle: { min: 0, max: 360 },
            life: { min: 1.0, max: 2.0 },
            gravity: 0,
            friction: 0.98,
            fade: true,
            shrink: true,
            spread: 2,
            layer: -2,
        });

        particles.addPreset('jetpack_fire', {
            color: ['#fff700', '#ff8c00', '#ff4d4d'], 
            size: { min: 3, max: 7 },
            speed: { min: 150, max: 300 },
            angle: { min: 60, max: 120 },
            life: { min: 0.1, max: 0.35 },
            gravity: 100,
            friction: 0.9,
            spread: 4,
            fade: true,
            shrink: true,
            layer: -1
        });

        particles.addPreset('jetpack_smoke', {
            color: ['#88888880', '#bbbbbb60', '#eeeeee40'],
            size: { min: 5, max: 9 },
            speed: { min: 50, max: 100 },
            angle: { min: 0, max: 360 },
            life: { min: 0.5, max: 1 },
            gravity: 20,
            friction: 0.96,
            fade: true,
            layer: -2,
            spread: 5,
        });

        //hazard
        particles.addPreset('hazard', {
            color: ['#ff4d4db6', '#c00202b0', '#f43e3ed0', '#f3321dd6', '#f98383d0'], 
            size: { min: 1, max: 1.5 },
            speed: { min: 20, max: 50 },
            angle: { min: 0, max: 360 },
            life: { min: 1.0, max: 2.0 },
            gravity: 0,
            friction: 0.99,
            fade: true,
            shrink: true,
            spread: 5,
            layer: -2,
        });

        //hazard destroy
        particles.addPreset('hazard_destroy', {
            color: ['#ff4d4db6', '#c00202b0', '#f43e3ed0', '#00c8ffff', '#002244ff', '#8be9ffff'], 
            size: { min: 1, max: 1.5 },
            speed: { min: 80, max: 120 },
            angle: { min: 0, max: 360 },
            life: { min: 3.0, max: 5.0 },
            gravity: 0,
            friction: 0.99,
            fade: true,
            shrink: true,
            spread: 5,
            layer: -2,
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

        this.ui.updateBtn?.addEventListener('click', () => {
            location.reload();
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
        this.updateFishUI();

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
            const user = getCurrentUser();

            let html = `<div style="text-align:center; margin-bottom:10px; opacity:0.8">
                TOP 10 BEST PLAYERS<br>
                <span style="font-size:0.45rem">(Only top scores are shown)</span>
            </div>`;

            if (scores.length === 0) {
                this.ui.leaderboardList.innerHTML = html + "NO SCORES YET";
                return;
            }

            scores.forEach((entry, index) => {
                html += `
                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    margin-bottom:8px;
                    gap:6px;
                    ${user && entry.uid === user.uid ? 'background:rgba(255,255,255,0.1); padding:4px;' : ''}
                ">
                    <span style="width:18px">${index + 1}.</span>
                    <img src="${entry.photo || 'images/default-cat.png'}"
                        style="width:18px; height:18px; border-radius:50%">
                    <span style="flex:1; overflow:hidden; white-space:nowrap; text-overflow:ellipsis">
                        ${entry.name}
                    </span>
                    <span style="color:var(--primary)">${entry.score}M</span>
                    <span style="display:flex; align-items:center; gap:4px">
                        <img src="images/fish.png" style="width:12px; height:12px; image-rendering:pixelated">
                        ${entry.fish ?? 0}
                    </span>
                </div>`;
            });

            if (user && !scores.find(e => e.uid === user.uid)) {
                html += `
                <hr style="margin:10px 0; opacity:0.3">
                <div style="opacity:0.8; font-size:0.55rem; text-align:center">
                    YOUR RESULT
                </div>
                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    margin-top:6px;
                    gap:6px;
                    background:rgba(255,255,255,0.08);
                    padding:4px;
                ">
                    <span>—</span>
                    <img src="${user.photoURL || 'images/default-cat.png'}"
                        style="width:18px; height:18px; border-radius:50%">
                    <span style="flex:1">${user.displayName.split(' ')[0]}</span>
                    <span style="color:var(--primary)">${this.highScore}M</span>
                    <span>🐟 ${this.totalFish}</span>
                </div>`;
            }

            this.ui.leaderboardList.innerHTML = html;

        } catch (e) {
            console.error(e);
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

    async gameOver() {
        if (this.state === GAME_STATE.GAMEOVER) return;

        this.state = GAME_STATE.GAMEOVER;
        ScreenShake.shake(0.5, 10);
        
        if (this.player) {
            this.player.onDead();
        }

        if (this.score > this.highScore) {
            console.log(`New High Score detected: ${this.score} (Old: ${this.highScore})`);
            
            this.highScore = this.score;
            localStorage.setItem('jumpking_highscore', this.highScore);
            
            const user = getCurrentUser();
            if (user) {
                try {
                    console.log("Saving score to database...");
                    await saveHighScore(this.score);
                    console.log("Score saved successfully!");
                } catch (error) {
                    console.error("FAILED to save score to DB:", error);
                }
            } else {
                console.warn("User not logged in - score saved only locally.");
            }
        }

        this.saveFish();
        const user = getCurrentUser();
        if (user) {
            await saveFish(this.totalFish);
        }
        this.updateFishUI();

        setTimeout(() => {
            this.ui.gameOver.classList.remove('hidden');
            this.ui.pauseBtn.classList.add('pause-hidden');
            this.ui.finalScore.innerText = this.score;
            this.ui.highScore.innerText = this.highScore;
        }, 1500); 
    }
}