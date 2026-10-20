/**
 * Color gate: a barrier that lets the ball through only when its
 * elasticity matches the gate color (cyan = bouncy, red = soft).
 */

import * as Matter from 'matter-js';
import { degToRad } from './utils.js';
import { GATES, gateIsOpen } from './mechanics.js';

export class Gate {
    constructor(x, y, width, angle, type, physicsWorld) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.angle = angle;
        this.type = GATES[type] ? type : 'cyan';
        this.physicsWorld = physicsWorld;
        this.thickness = 14;
        this.openForBall = false; // Updated each frame for rendering
        this.flash = 0; // Flash when the ball passes or is blocked
        this.anim = 0;

        this.body = Matter.Bodies.rectangle(x, y, width, this.thickness, {
            isStatic: true,
            angle: degToRad(angle),
            friction: 0,
            restitution: 0,
            label: 'gate'
        });
        Matter.World.add(physicsWorld, this.body);
    }

    isOpenFor(elasticity) {
        return gateIsOpen(this.type, elasticity);
    }

    update(deltaTime, ball) {
        this.anim += deltaTime * 0.004;
        this.openForBall = ball ? this.isOpenFor(ball.currentElasticity) : false;
        if (this.flash > 0) this.flash = Math.max(0, this.flash - deltaTime / 400);
    }

    remove() {
        Matter.World.remove(this.physicsWorld, this.body);
    }

    render(ctx) {
        const color = GATES[this.type].color;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(degToRad(this.angle));

        const len = this.width;
        const t = this.thickness;

        // Posts at both ends
        ctx.fillStyle = '#2D2D2D';
        ctx.fillRect(-len / 2 - 6, -t, 8, t * 2);
        ctx.fillRect(len / 2 - 2, -t, 8, t * 2);

        if (this.openForBall) {
            // Open: faint dashed beam
            ctx.globalAlpha = 0.5 + Math.sin(this.anim * 2) * 0.15;
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 8]);
            ctx.lineDashOffset = -this.anim * 20;
            ctx.beginPath();
            ctx.moveTo(-len / 2, 0);
            ctx.lineTo(len / 2, 0);
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            // Closed: solid striped bar
            ctx.fillStyle = color;
            ctx.fillRect(-len / 2, -t / 2, len, t);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            for (let x = -len / 2; x < len / 2; x += 16) {
                ctx.beginPath();
                ctx.moveTo(x, t / 2);
                ctx.lineTo(Math.min(x + 8, len / 2), -t / 2);
                ctx.lineTo(Math.min(x + 14, len / 2), -t / 2);
                ctx.lineTo(Math.min(x + 6, len / 2), t / 2);
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        if (this.flash > 0) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.flash})`;
            ctx.lineWidth = 3;
            ctx.strokeRect(-len / 2 - 4, -t / 2 - 4, len + 8, t + 8);
        }

        ctx.restore();
    }
}
