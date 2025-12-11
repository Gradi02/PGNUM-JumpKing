export class Platform {
    constructor(x, y, width, height, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;

        this.setVisuals();
    }

    setVisuals() {
        this.colorBody = '#654321';
        this.colorTop = '#44aa44';
        this.hasGrass = true;

        switch (this.type) {
            case 'floor':
                this.colorBody = '#222';
                this.colorTop = '#555';
                this.hasGrass = false;
                break;
            
            case 'ice':
                this.colorBody = '#aaccff';
                this.colorTop = '#fff';
                this.hasGrass = false;
                break;
                
            case 'bouncy':
                this.colorBody = '#ff66aa';
                this.colorTop = '#ff99cc';
                this.hasGrass = false;
                break;
        }
    }

    update(dt) {

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
        if (this.type === 'bouncy') {
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