import { TimeManager } from './TimeManager.js';
import { ScreenShake } from '../utils/screenShake.js';

export class vJoyShot {
    constructor(canvas) {
        this.canvas = canvas;
        
        this.maxDragDist = 100;
        this.maxOutputForce = 26;
        
        this.active = false;
        this.start = { x: 0, y: 0 };
        this.current = { x: 0, y: 0 };
        this.force = { x: 0, y: 0 };
        
        this._bindEvents();
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
        
        TimeManager.setTimeScale(0.15);
    }

    handleMove(event) {
        if (!this.active) return;
        event.preventDefault();
        this.current = this._getPos(event);
    }

    handleEnd(event) {
        if (!this.active) return;
        event.preventDefault();
        
        TimeManager.setTimeScale(1.0);
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
            y: Math.sin(angle) * finalMagnitude
        };

        if (power >= 0.95) ScreenShake.shake(0.3, 5);
    }

    resetForce() {
        this.force = { x: 0, y: 0 };
    }

   draw(ctx) {
        if (!this.active) return;

        const dx = this.start.x - this.current.x;
        const dy = this.start.y - this.current.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 5) {
            const angle = Math.atan2(dy, dx);
            const drawLen = Math.min(dist, this.maxDragDist) * 2.0;
            
            const endX = this.start.x + Math.cos(angle) * drawLen;
            const endY = this.start.y + Math.sin(angle) * drawLen;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.start.x, this.start.y);
            ctx.lineTo(endX, endY);
            
            ctx.lineWidth = 4 + (dist / this.maxDragDist) * 4;
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + (dist/this.maxDragDist)*0.7})`;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(this.start.x, this.start.y, 10, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
            ctx.restore();
        }
    }
}