import { TimeManager } from './TimeManager.js';
import { ScreenShake } from './screenShake.js';

export class vJoyShot {
    constructor(canvas, options = {}) {
        this.canvas = canvas;

        this.maxForce = options.maxForce || 20;
        this.visualScale = options.visualScale || 3.0;
        this.maxRangeColor = options.maxRangeColor || 'rgba(100, 100, 100, 0.2)';
        this.maxPowerColor = options.maxPowerColor || 'rgba(0, 255, 255, 1.0)';
        
        this.minLineWidth = options.minLineWidth || 3;
        this.maxLineWidth = options.maxLineWidth || 8;

        this.arrowMinColor = options.arrowMinColor || 'rgba(255, 255, 255, 0.7)';
        this.arrowMaxColor = options.arrowMaxColor || 'rgba(255, 80, 80, 1.0)';
        
        this.slowMotionScale = options.slowMotionScale || 0.15;
        this.easingFactor = options.easingFactor || 0.5;

        this.active = false;
        this.start = { x: 0, y: 0 };
        this.current = { x: 0, y: 0 };

        this.force = { x: 0, y: 0 };
        this.isMaxPower = false;
        this.timeAtMaxPower = 0;

        this._setupEventListeners();
    }

    _setupEventListeners() {
        this.canvas.addEventListener("touchstart", this.handleStart.bind(this), { passive: false });
        this.canvas.addEventListener("touchmove", this.handleMove.bind(this), { passive: false });
        this.canvas.addEventListener("touchend", this.handleEnd.bind(this), { passive: false });
        
        this.canvas.addEventListener("mousedown", this.handleStart.bind(this), false);
        this.canvas.addEventListener("mousemove", this.handleMove.bind(this), false);
        this.canvas.addEventListener("mouseup", this.handleEnd.bind(this), false);
        this.canvas.addEventListener("mouseleave", this.handleEnd.bind(this), false);
    }

    _getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        const pointer = event.touches?.[0] || event.changedTouches?.[0] || event;

        const cssX = pointer.clientX - rect.left;
        const cssY = pointer.clientY - rect.top;

        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return { x: cssX * scaleX, y: cssY * scaleY };
    }

    getTouchPos(event) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = event.touches?.[0] || event.changedTouches?.[0] || event;

        const cssX = touch.clientX - rect.left;
        const cssY = touch.clientY - rect.top;

        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return { x: cssX * scaleX, y: cssY * scaleY };
    }

    handleStart(event) {
        if (this.active) return;
        event.preventDefault();
        
        this.active = true;
        this.start = this._getCanvasCoordinates(event);
        this.current = this.start;
        this.force = { x: 0, y: 0 };
        TimeManager.setTimeScale(this.slowMotionScale);
    }

    handleMove(event) {
        if (!this.active) return;
        event.preventDefault();
        this.current = this._getCanvasCoordinates(event);

        const visualMaxRadius = this.maxForce * this.visualScale;
        const dragDistance = Math.sqrt((this.current.x - this.start.x) ** 2 + (this.current.y - this.start.y) ** 2);

        if (dragDistance >= visualMaxRadius && !this.isMaxPower) {
            this.isMaxPower = true;
            this.timeAtMaxPower = 0;
            ScreenShake.shake(0.2, 3);
        } else if (dragDistance < visualMaxRadius && this.isMaxPower) {
            this.isMaxPower = false;
        }
    }

    handleEnd(event) {
        if (!this.active) return;
        event.preventDefault();
        TimeManager.setTimeScale(1.0);

        const dx = this.start.x - this.current.x;
        const dy = this.start.y - this.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 1) {
            this.active = false;
            return;
        }

        const linearForceRatio = this.maxForce > 0 ? Math.min(distance / this.maxForce, 1.0) : 0;
        const easedForceRatio = Math.sqrt(linearForceRatio);
        const forceMagnitude = easedForceRatio * this.maxForce;
        const angle = Math.atan2(dy, dx);
        
        this.force = { 
            x: Math.cos(angle) * forceMagnitude, 
            y: Math.sin(angle) * forceMagnitude 
        };
        this.active = false;

        if (this.isMaxPower) {
            this.force.isOverpowered = true;
            ScreenShake.shake(0.4, 8);
        }

        this.isMaxPower = false;
        this.active = false;
    }

    resetForce() {
        this.force = { x: 0, y: 0 };
    }

    _lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    draw(ctx) {
        if (!this.active) return;

        if (this.start.x === this.current.x && this.start.y === this.current.y) {
            ctx.save();
            const initialVisualRadius = this.maxForce * this.visualScale;
            ctx.beginPath();
            ctx.arc(this.start.x, this.start.y, initialVisualRadius, 0, Math.PI * 2);
            ctx.fillStyle = this.maxRangeColor;
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.save();
        
        const visualMaxRadius = this.maxForce * this.visualScale;

        ctx.beginPath();
        ctx.arc(this.start.x, this.start.y, visualMaxRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.maxRangeColor;
        ctx.fill();

        const dragVector = { x: this.current.x - this.start.x, y: this.current.y - this.start.y };
        const dragDistance = Math.sqrt(dragVector.x ** 2 + dragVector.y ** 2);
        
        if (dragDistance < 1) {
            ctx.restore();
            return;
        }

        const linearRatio = visualMaxRadius > 0 ? Math.min(dragDistance / visualMaxRadius, 1.0) : 0;
        const powerRatio = Math.pow(linearRatio, this.easingFactor);

        const displayVector = { x: dragVector.x, y: dragVector.y };
        if (dragDistance > visualMaxRadius) {
            const scale = visualMaxRadius / dragDistance;
            displayVector.x *= scale;
            displayVector.y *= scale;
        }

        const arrowEndPoint = { x: this.start.x - displayVector.x, y: this.start.y - displayVector.y };
        const currentLineWidth = this._lerp(this.minLineWidth, this.maxLineWidth, powerRatio);
        
        const minColor = this.arrowMinColor.match(/\d+(\.\d+)?/g).map(Number);
        const maxColor = this.arrowMaxColor.match(/\d+(\.\d+)?/g).map(Number);
        
        const r = Math.round(this._lerp(minColor[0], maxColor[0], powerRatio));
        const g = Math.round(this._lerp(minColor[1], maxColor[1], powerRatio));
        const b = Math.round(this._lerp(minColor[2], maxColor[2], powerRatio));
        const a = this._lerp(minColor[3] ?? 1, maxColor[3] ?? 1, powerRatio).toFixed(2);
        const currentColor = `rgba(${r}, ${g}, ${b}, ${a})`;

        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentLineWidth;

        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(arrowEndPoint.x, arrowEndPoint.y);
        ctx.stroke();

        const angle = Math.atan2(arrowEndPoint.y - this.start.y, arrowEndPoint.x - this.start.x);
        const arrowHeadSize = this._lerp(15, 25, powerRatio);
        
        ctx.beginPath();
        ctx.moveTo(arrowEndPoint.x, arrowEndPoint.y);
        ctx.lineTo(arrowEndPoint.x - arrowHeadSize * Math.cos(angle - Math.PI / 6), arrowEndPoint.y - arrowHeadSize * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(arrowEndPoint.x, arrowEndPoint.y);
        ctx.lineTo(arrowEndPoint.x - arrowHeadSize * Math.cos(angle + Math.PI / 6), arrowEndPoint.y - arrowHeadSize * Math.sin(angle + Math.PI / 6));
        ctx.stroke();

        ctx.restore();
    }
}