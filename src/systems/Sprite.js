export class Sprite {
    constructor(image, sx, sy, sw, sh) {
        this.image = image;
        this.sx = sx;
        this.sy = sy;
        this.sw = sw;
        this.sh = sh;
    }

    draw(ctx, x, y, w = this.sw, h = this.sh) {
        ctx.drawImage(
            this.image, 
            this.sx, this.sy, this.sw, this.sh,
            x, y, w, h
        );
    }
}