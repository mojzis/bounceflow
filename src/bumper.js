/**
 * Bumper: a round pinball bumper. Whatever speed the ball hits it with,
 * it kicks the ball straight away from its center at the same speed.
 */

import * as Matter from 'matter-js';

export class Bumper {
    constructor(x, y, radius, physicsWorld) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.physicsWorld = physicsWorld;
        this.flash = 0; // Lights up after a hit
        this.anim = 0;

        this.body = Matter.Bodies.circle(x, y, radius, {
            isStatic: true,
            friction: 0,
            restitution: 0,
            label: 'bumper'
        });
        Matter.World.add(physicsWorld, this.body);
    }

    hit() {
        this.flash = 1;
    }

    update(deltaTime) {
        this.anim += deltaTime * 0.003;
        if (this.flash > 0) this.flash = Math.max(0, this.flash - deltaTime / 350);
    }

    remove() {
        Matter.World.remove(this.physicsWorld, this.body);
    }

    render(ctx) {
        const r = this.radius * (1 + this.flash * 0.15);
        ctx.save();
        ctx.translate(this.x, this.y);

        // Glow after a hit
        if (this.flash > 0) {
            ctx.fillStyle = `rgba(255, 230, 109, ${this.flash * 0.5})`;
            ctx.beginPath();
            ctx.arc(0, 0, r + 14 * this.flash, 0, Math.PI * 2);
            ctx.fill();
        }

        // Outer ring
        ctx.fillStyle = '#FF6BB5';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2D2D2D';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Spinning dots around the ring
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        for (let i = 0; i < 8; i++) {
            const a = this.anim + (i * Math.PI) / 4;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Center cap
        ctx.fillStyle = this.flash > 0 ? '#FFE66D' : '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2D2D2D';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}
