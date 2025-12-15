import { PLATFORM_TYPE } from "../enums.js";

export class Platform {
    constructor(x, y, width, height, type = PLATFORM_TYPE.DEFAULT) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.friction = 0.9;

        this.setVisuals();
    }

    setVisuals() {
        switch (this.type) {
            case PLATFORM_TYPE.DEFAULT:
                this.colorBody = '#654321';
                this.colorTop = '#44aa44';
                this.hasGrass = true;
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
        }
    }

    update(dt) {

    }

    special_action(player) {
        if (this.type === PLATFORM_TYPE.BOUNCY) {
            player.vel.y = -1600; 
            player.isGrounded = false;
            player.doubleJumpAvailable = true;
        }
    }

    draw(ctx) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#2d1b0e';

        ctx.fillStyle = this.colorBody;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = this.colorTop;
        const topHeight = this.hasGrass ? 6 : 4;
        ctx.fillRect(this.x, this.y, this.width, topHeight);

        ctx.strokeRect(this.x, this.y, this.width, this.height);
        if (this.type === PLATFORM_TYPE.BOUNCY) {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 5, 0, Math.PI*2);
            ctx.fill();
        }
    }
    
    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}