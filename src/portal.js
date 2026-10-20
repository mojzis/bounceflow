/**
 * Portal pair: the ball goes into one end and comes out of the other with
 * the same speed and direction. Works both ways.
 */

import { PORTAL_RADIUS } from './mechanics.js';

const COLORS = ['#FF9F43', '#54A0FF']; // orange in, blue out (both work)

export class Portal {
    /**
     * @param {{x:number,y:number}} a - first end
     * @param {{x:number,y:number}} b - second end
     */
    constructor(a, b) {
        this.ends = [{ x: a.x, y: a.y }, { x: b.x, y: b.y }];
        this.radius = PORTAL_RADIUS;
        // End the ball just came out of; it can't re-enter until it leaves
        this.cooldownEnd = -1;
        this.flash = 0;
        this.anim = 0;
    }

    /**
     * Index of the end the ball is entering, or -1.
     */
    entering(px, py) {
        for (let i = 0; i < 2; i++) {
            const e = this.ends[i];
            const inside = Math.hypot(px - e.x, py - e.y) <= this.radius;
            if (i === this.cooldownEnd) {
                if (!inside) this.cooldownEnd = -1;
                continue;
            }
            if (inside) return i;
        }
        return -1;
    }

    reset() {
        this.cooldownEnd = -1;
    }

    update(deltaTime) {
        this.anim += deltaTime * 0.003;
        if (this.flash > 0) this.flash = Math.max(0, this.flash - deltaTime / 500);
    }

    render(ctx) {
        const [a, b] = this.ends;

        // Faint dotted link so kids can see which ends belong together
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 10]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();

        this.ends.forEach((e, i) => this.renderEnd(ctx, e, COLORS[i], i === 0 ? 1 : -1));
    }

    renderEnd(ctx, e, color, spin) {
        const r = this.radius * (1 + this.flash * 0.2);
        ctx.save();
        ctx.translate(e.x, e.y);

        // Dark hole
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
        g.addColorStop(0, 'rgba(20, 10, 40, 0.95)');
        g.addColorStop(0.7, 'rgba(40, 20, 80, 0.8)');
        g.addColorStop(1, color);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
        ctx.fill();

        // Swirl
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (let k = 0; k < 3; k++) {
            const start = spin * this.anim * 2 + (k * Math.PI * 2) / 3;
            ctx.beginPath();
            ctx.arc(0, 0, r * (0.45 + k * 0.15), start, start + 1.6);
            ctx.stroke();
        }

        // Rim
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
