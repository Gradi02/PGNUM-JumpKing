import { PLATFORM_TYPE } from "../enums.js";

export class Platform {
    constructor(x, y, width, height, type = PLATFORM_TYPE.DEFAULT) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.friction = 0.9;

        if (this.type === undefined || this.type === null) {
            console.warn("Uwaga: Typ platformy to undefined! Ustawiam 'default'. Sprawdź importy w Platform.js");
            this.type = 'default'; 
        }

        this.initialX = x;
        this.moveRange = 100;
        this.moveSpeed = 0.2;
        this.prevX = x;
        this.hasAdjustedBounds = false;
        this.movePhaseOffset = Math.random() * Math.PI * 2; 

        this.hadBreakingStarted = false;
        this.isBroken = false;

        this.shakeTimer = 0;
        this.shakeDuration = 1.5;
        this.shakeIntensity = 5;

        this.setVisuals();
    }

    setVisuals() {
        this.hasGrass = true; 

        switch (this.type) {
            case PLATFORM_TYPE.DEFAULT:
                this.colorBody = '#654321';
                this.colorTop = '#44aa44';
                this.friction = 0.8;
                break;

            case PLATFORM_TYPE.FLOOR:
                this.colorBody = '#222';
                this.colorTop = '#555';
                this.hasGrass = false;
                this.friction = 0.8;
                break;
            
            case PLATFORM_TYPE.ICE:
                this.colorBody = '#aaccff';
                this.colorTop = '#fff';
                this.hasGrass = false;
                this.friction = 0.98;
                break;
                
            case PLATFORM_TYPE.BOUNCY:
                this.colorBody = '#ff66aa';
                this.colorTop = '#ff99cc';
                this.hasGrass = false;
                this.friction = 0;
                break;

            case PLATFORM_TYPE.MOVING_X:
                this.colorBody = '#4a2c5a';
                this.colorTop = '#7b4d8c';
                this.hasGrass = false;
                this.friction = 0.7;
                break;

            case PLATFORM_TYPE.BREAKABLE:
                this.colorBody = '#8b4513';
                this.colorTop = '#d2b48c';
                this.hasGrass = true;
                this.friction = 0.7;
                break;

            default:
                this.colorBody = '#654321';
                this.colorTop = '#44aa44';
        }
    }

    update(dt, canvasWidth) {
        this.prevX = this.x;

        if(this.type === PLATFORM_TYPE.MOVING_X) {
            if (canvasWidth && !this.hasAdjustedBounds) {
                const maxPossibleRange = (canvasWidth - this.width) / 2;
                
                if (this.moveRange > maxPossibleRange) {
                    this.moveRange = maxPossibleRange; 
                }

                if (this.initialX - this.moveRange < 0) {
                    this.initialX = this.moveRange; 
                }

                if (this.initialX + this.moveRange + this.width > canvasWidth) {
                    this.initialX = canvasWidth - this.width - this.moveRange;
                }

                this.hasAdjustedBounds = true;
            }

            this.x = this.initialX + Math.sin(Date.now() * this.moveSpeed * 0.01 + this.movePhaseOffset) * this.moveRange;
        }
        
        if (this.type === PLATFORM_TYPE.BREAKABLE) {
            if (this.hadBreakingStarted && !this.isBroken) {
                this.shakeTimer += dt;

                if (this.shakeTimer >= this.shakeDuration) {
                    this.isBroken = true;
                    this.shakeTimer = 0;
                }
            }
        }
    }

    special_action(player) {
        if (this.type === PLATFORM_TYPE.BOUNCY) {
            player.vel.y = -1600; 
            player.isGrounded = false;
            player.doubleJumpAvailable = true;
        } else if (this.type === PLATFORM_TYPE.BREAKABLE) {
            if (!this.isBroken && !this.hadBreakingStarted) {
                this.hadBreakingStarted = true;
                this.shakeTimer = 0;
            }
        }
    }

    getVelX(dt) {
        if (this.type === PLATFORM_TYPE.MOVING_X) {
            return (this.x - this.prevX) / dt;
        }
        return 0;
    }

    draw(ctx) {
        if (this.type === PLATFORM_TYPE.BREAKABLE && this.isBroken) {
            return;
        }

        let offsetX = 0;
        let offsetY = 0;
        let opacity = 1;

        if (this.type === PLATFORM_TYPE.BREAKABLE && this.hadBreakingStarted) {
            const progress = this.shakeTimer / this.shakeDuration;
            
            const currentShake = this.shakeIntensity;
            offsetX = (Math.random() - 0.5) * currentShake * 2;
            offsetY = (Math.random() - 0.5) * currentShake * 2;

            if (progress > 0.8) {
                opacity = 1 - ((progress - 0.8) * 5);
                if (opacity < 0) opacity = 0;
            }
        }

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#2d1b0e';

        ctx.fillStyle = this.colorBody;
        ctx.fillRect(this.x + offsetX, this.y + offsetY, this.width, this.height);

        ctx.fillStyle = this.colorTop;
        const topHeight = this.hasGrass ? 6 : 4;
        ctx.fillRect(this.x + offsetX, this.y + offsetY, this.width, topHeight);

        ctx.strokeRect(this.x + offsetX, this.y + offsetY, this.width, this.height);
        
        if (this.type === PLATFORM_TYPE.BOUNCY) {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2 + offsetX, this.y + this.height/2 + offsetY, 5, 0, Math.PI*2);
            ctx.fill();
        } else if (this.type === PLATFORM_TYPE.MOVING_X) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2 + offsetX, this.y + this.height/2 + offsetY, 8, 0, Math.PI*2);
            ctx.fill();
        } else if (this.type === PLATFORM_TYPE.BREAKABLE) {
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.moveTo(this.x + 10 + offsetX, this.y + 10 + offsetY);
            ctx.lineTo(this.x + this.width/2 + offsetX, this.y + this.height - 10 + offsetY);
            ctx.stroke();
        }

        ctx.restore();
    }
    
    getBounds() {
        if (this.type === PLATFORM_TYPE.BREAKABLE && this.isBroken) {
            return {
                left: -99999,
                right: -99999,
                top: -99999,
                bottom: -99999
            };
        }
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}