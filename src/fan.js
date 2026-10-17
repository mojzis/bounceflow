/**
 * Fan: a zone of moving air that pushes the ball. The push is the same
 * for every ball, so light balls get blown far and heavy balls barely move.
 */

import { FAN_FORCE, fanDirection } from './mechanics.js';

export class Fan {
    /**
     * @param {number} x - zone center x
     * @param {number} y - zone center y
     * @param {number} width - zone width
     * @param {number} height - zone height
     * @param {string} dir - 'up' | 'down' | 'left' | 'right'
     * @param {number} strength - force multiplier
     */
    constructor(x, y, width, height, dir = 'up', strength = 1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.dir = dir;
        this.strength = strength;
        this.anim = 0;
    }

    contains(px, py) {
        return Math.abs(px - this.x) <= this.width / 2 && Math.abs(py - this.y) <= this.height / 2;
    }

    getForce() {
        const d = fanDirection(this.dir);
        return { x: d.x * FAN_FORCE * this.strength, y: d.y * FAN_FORCE * this.strength };
    }

    update(deltaTime) {
        this.anim += deltaTime * 0.001 * this.strength;
    }

    render(ctx) {
        const d = fanDirection(this.dir);
        const left = this.x - this.width / 2;
        const top = this.y - this.height / 2;

        ctx.save();

        // Air zone
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(left, top, this.width, this.height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 1;
        ctx.strokeRect(left, top, this.width, this.height);
        ctx.setLineDash([]);

        // Moving wind streaks
        ctx.beginPath();
        ctx.rect(left, top, this.width, this.height);
        ctx.clip();
        const along = d.x !== 0 ? this.width : this.height;
        const across = d.x !== 0 ? this.height : this.width;
        const lanes = Math.max(3, Math.floor(across / 30));
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < lanes; i++) {
            const a = (i + 0.5) / lanes * across - across / 2;
            for (let k = 0; k < 3; k++) {
                const phase = ((this.anim * 120 + k * along / 3 + i * 37) % along) - along / 2;
                const len = 18;
                const sx = this.x + (d.x !== 0 ? phase * d.x : a);
                const sy = this.y + (d.y !== 0 ? phase * d.y : a);
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + d.x * len, sy + d.y * len);
                ctx.stroke();
            }
        }
        ctx.restore();

        // Fan unit at the back side of the zone
        const fx = this.x - d.x * (this.width / 2);
        const fy = this.y - d.y * (this.height / 2);
        ctx.save();
        ctx.translate(fx, fy);
        ctx.fillStyle = '#2D2D2D';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFE66D';
        ctx.rotate(this.anim * 25);
        for (let i = 0; i < 3; i++) {
            ctx.rotate((Math.PI * 2) / 3);
            ctx.beginPath();
            ctx.ellipse(0, -7, 4, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
