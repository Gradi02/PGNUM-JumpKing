export class vJoyShot {
    constructor(canvas) {
        this.canvas = canvas;
        this.virtualWidth = null;
        this.virtualHeight = null;
        
        this.baseDragDist = 80; 
        this.maxDragDist = 80; 
        this.maxOutputForce = 26;
        
        this.active = false;
        this.start = { x: 0, y: 0 };
        this.current = { x: 0, y: 0 };
        this.force = { x: 0, y: 0 };
        
        this._bindEvents();
    }

    onResize(virtualWidth, virtualHeight) {
        const scaleFactor = this.canvas.height / virtualHeight; 
        this.maxDragDist = this.baseDragDist * (scaleFactor < 1 ? 1 : scaleFactor);
    }

    _bindEvents() {
        const start = (e) => this.handleStart(e);
        const move = (e) => this.handleMove(e);
        const end = (e) => this.handleEnd(e);

        this.canvas.addEventListener("touchstart", start, { passive: false });
        this.canvas.addEventListener("touchmove", move, { passive: false });
        this.canvas.addEventListener("touchend", end, { passive: false });
        
        this.canvas.addEventListener("mousedown", start);
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", end);
    }

    _getPos(event) {
        const rect = this.canvas.getBoundingClientRect();
        const client = (event.touches && event.touches[0]) ? event.touches[0] : event;
        
        return {
            x: (client.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (client.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    handleStart(event) {
        if(event.type === 'mousedown' && event.button !== 0) return;
        event.preventDefault();
        
        this.active = true;
        this.start = this._getPos(event);
        this.current = { ...this.start };
        this.force = { x: 0, y: 0 };
    }

    handleMove(event) {
        if (!this.active) return;
        event.preventDefault();
        this.current = this._getPos(event);
    }

    handleEnd(event) {
        if (!this.active) return;
        event.preventDefault();
        
        this.active = false;
        let dx = this.start.x - this.current.x;
        let dy = this.start.y - this.current.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 5) return;

        const scale = Math.min(dist, this.maxDragDist) / this.maxDragDist;
        const power = scale * scale; 
        const finalMagnitude = power * this.maxOutputForce;
        const angle = Math.atan2(dy, dx);
        
        this.force = {
            x: Math.cos(angle) * finalMagnitude,
            y: Math.sin(angle) * finalMagnitude,
            shake: power >= 0.95 ? 1 : 0
        };
    }

    resetForce() {
        this.force = { x: 0, y: 0 };
    }

    draw(ctx, player, camera, gameScale) {
        if (!this.active || (!player.isGrounded && !player.doubleJumpAvailable)) return;

        const dx = this.start.x - this.current.x;
        const dy = this.start.y - this.current.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 5) return;

        ctx.save(); 
        const scale = Math.min(dist, this.maxDragDist) / this.maxDragDist;
        const power = scale * scale;

        const angle = Math.atan2(dy, dx);
        const magnitude = power * this.maxOutputForce;

        const vx = Math.cos(angle) * magnitude * player.jumpForce;
        const vy = Math.sin(angle) * magnitude * player.jumpForce;

        const dots = Math.floor(4 + power * 10);
        const maxTime = 0.15 + power * 0.35;
        const color = power > 0.9 ? '255,200,150' : '255,255,255';

        for (let i = 0; i < dots; i++) {
            const t = Math.pow(i / dots, 1.4) * maxTime;

            const startX = player.pos.x + player.size / 2;
            const startY = player.pos.y + player.size;

            let worldX = startX + vx * t;
            let worldY = startY + vy * t + 0.5 * player.gravity * t * t;

            if (power > 0.95) {
                worldX += (Math.random() - 0.5) * 2;
                worldY += (Math.random() - 0.5) * 2;
            }

            const screenX = worldX * gameScale;
            const screenY = (worldY - camera.y) * gameScale;

            const alpha = 0.6 * (1 - i / dots);
            const radius = Math.round(4 - i * 0.1);
            const rv = radius * 0.5;

            ctx.fillStyle = `rgba(${color},${alpha * 0.3})`;
            ctx.fillRect(screenX - radius, screenY - radius, radius * 2, radius * 2);

            ctx.fillStyle = `rgba(${color},${alpha})`;
            ctx.fillRect(screenX - radius/2, screenY - radius/2, radius, radius);
        }
        ctx.restore();
    }
}