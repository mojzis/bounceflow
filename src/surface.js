/**
 * Interactive surface entity for BounceFlow
 */

import * as Matter from 'matter-js';
import { pointNearLine, degToRad, radToDeg } from './utils.js';
import { getMaterial, LEGACY_RESTITUTION } from './mechanics.js';

export class Surface {
    constructor(x, y, width, angle = 0, locked = false, physicsWorld, material = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.angle = angle;
        this.locked = locked;
        this.physicsWorld = physicsWorld;
        this.thickness = 20; // Thicker for better collision detection
        this.material = material;
        this.broken = false; // Glass only
        this.shards = [];
        this.squash = 0; // Trampoline wobble after a hit (0..1)

        // Interaction state
        this.isDragging = false;
        this.isRotating = false;
        this.dragOffset = { x: 0, y: 0 };
        this.rotationStartAngle = 0;
        this.hovered = false;
        this.selected = false; // For keyboard control

        // Create physics body
        this.createPhysicsBody();
    }

    createPhysicsBody() {
        // Remove old body if it exists
        if (this.body) {
            Matter.World.remove(this.physicsWorld, this.body);
        }

        // Create rectangular body
        this.body = Matter.Bodies.rectangle(
            this.x,
            this.y,
            this.width,
            this.thickness,
            {
                isStatic: true,
                angle: degToRad(this.angle),
                friction: 0,
                // The real bounce is set per contact by MechanicsSystem;
                // keep legacy value for plain surfaces so older levels are unchanged
                restitution: getMaterial(this.material).restitution ?? LEGACY_RESTITUTION,
                label: 'surface'
            }
        );

        Matter.World.add(this.physicsWorld, this.body);
    }

    /**
     * Break glass: remove the physics body and spawn shards.
     */
    shatter() {
        if (this.broken) return;
        this.broken = true;
        Matter.World.remove(this.physicsWorld, this.body);

        const { x1, y1, x2, y2 } = this.getEndpoints();
        const count = Math.max(8, Math.round(this.width / 12));
        for (let i = 0; i < count; i++) {
            const t = Math.random();
            this.shards.push({
                x: x1 + (x2 - x1) * t,
                y: y1 + (y2 - y1) * t,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 2 - 1,
                rot: Math.random() * Math.PI,
                vr: (Math.random() - 0.5) * 0.3,
                size: 4 + Math.random() * 6,
                life: 1
            });
        }
    }

    bounceFeedback() {
        if (this.material === 'trampoline' || this.material === 'sponge') {
            this.squash = 1;
        }
    }

    update(deltaTime) {
        if (this.squash > 0) {
            this.squash = Math.max(0, this.squash - deltaTime / 300);
        }
        if (this.shards.length > 0) {
            const k = deltaTime / 16.67;
            this.shards = this.shards.filter(s => {
                s.vy += 0.25 * k;
                s.x += s.vx * k;
                s.y += s.vy * k;
                s.rot += s.vr * k;
                s.life -= deltaTime / 1500;
                return s.life > 0;
            });
        }
    }

    handleMouseDown(mx, my, isRightClick = false) {
        if (this.locked || this.broken) return false;

        const hitThreshold = 15;
        const endpoints = this.getEndpoints();

        if (pointNearLine(mx, my, endpoints.x1, endpoints.y1, endpoints.x2, endpoints.y2, hitThreshold)) {
            if (isRightClick) {
                this.isRotating = true;
                this.rotationStartAngle = Math.atan2(my - this.y, mx - this.x);
            } else {
                this.isDragging = true;
                this.dragOffset = { x: mx - this.x, y: my - this.y };
            }
            return true;
        }

        return false;
    }

    handleMouseMove(mx, my) {
        if (this.locked || this.broken) return;

        if (this.isDragging) {
            this.x = mx - this.dragOffset.x;
            this.y = my - this.dragOffset.y;
            this.updatePhysicsBody();
        } else if (this.isRotating) {
            const currentAngle = Math.atan2(my - this.y, mx - this.x);
            const angleDiff = radToDeg(currentAngle - this.rotationStartAngle);
            this.angle += angleDiff;
            this.rotationStartAngle = currentAngle;
            this.updatePhysicsBody();
        } else {
            // Check for hover
            const hitThreshold = 15;
            const endpoints = this.getEndpoints();
            this.hovered = pointNearLine(mx, my, endpoints.x1, endpoints.y1, endpoints.x2, endpoints.y2, hitThreshold);
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.isRotating = false;
    }

    handleTouchStart(tx, ty) {
        return this.handleMouseDown(tx, ty, false);
    }

    handleTouchMove(tx, ty) {
        this.handleMouseMove(tx, ty);
    }

    handleTouchEnd() {
        this.handleMouseUp();
    }

    updatePhysicsBody() {
        if (this.broken) return;
        Matter.Body.setPosition(this.body, { x: this.x, y: this.y });
        Matter.Body.setAngle(this.body, degToRad(this.angle));
    }

    rotate(degrees) {
        if (this.locked) return;
        this.angle += degrees;
        this.updatePhysicsBody();
    }

    move(dx, dy) {
        if (this.locked) return;
        this.x += dx;
        this.y += dy;
        this.updatePhysicsBody();
    }

    getEndpoints() {
        const angleRad = degToRad(this.angle);
        const halfWidth = this.width / 2;

        return {
            x1: this.x - Math.cos(angleRad) * halfWidth,
            y1: this.y - Math.sin(angleRad) * halfWidth,
            x2: this.x + Math.cos(angleRad) * halfWidth,
            y2: this.y + Math.sin(angleRad) * halfWidth
        };
    }

    render(ctx, showAngle = false) {
        const endpoints = this.getEndpoints();

        if (this.broken) {
            this.renderShards(ctx);
            return;
        }

        ctx.save();

        // Material base layer, drawn under the normal interaction styling
        if (this.material !== 'normal') {
            this.renderMaterial(ctx, endpoints);
        }

        // Draw surface line
        ctx.beginPath();
        ctx.moveTo(endpoints.x1, endpoints.y1);
        ctx.lineTo(endpoints.x2, endpoints.y2);

        if (this.locked) {
            ctx.strokeStyle = '#555';
            ctx.lineWidth = this.thickness;
        } else if (this.isDragging || this.isRotating) {
            ctx.strokeStyle = '#4ECDC4';
            ctx.lineWidth = this.thickness + 4;
        } else if (this.selected) {
            ctx.strokeStyle = '#FFE66D'; // Yellow for keyboard selection
            ctx.lineWidth = this.thickness + 4;
        } else if (this.hovered) {
            ctx.strokeStyle = '#95E1D3';
            ctx.lineWidth = this.thickness + 2;
        } else {
            ctx.strokeStyle = '#2D2D2D';
            ctx.lineWidth = this.thickness;
        }

        ctx.lineCap = 'round';
        // Material surfaces show their own color; only draw the outline-style
        // highlight when interacting with them
        const interacting = this.isDragging || this.isRotating || this.selected || this.hovered;
        if (this.material === 'normal' || (interacting && !this.locked)) {
            if (this.material !== 'normal') {
                ctx.globalAlpha = 0.45;
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Draw control handles if not locked
        if (!this.locked) {
            // Center handle
            ctx.fillStyle = this.isDragging ? '#4ECDC4' : (this.hovered ? '#95E1D3' : '#fff');
            ctx.beginPath();
            ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#2D2D2D';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Rotation handles at endpoints
            if (this.hovered || this.isRotating) {
                ctx.fillStyle = this.isRotating ? '#FFE66D' : 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath();
                ctx.arc(endpoints.x1, endpoints.y1, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(endpoints.x2, endpoints.y2, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Show angle label during replay
        if (showAngle && !this.locked) {
            const normalizedAngle = ((this.angle % 360) + 360) % 360; // Normalize to 0-360
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(this.x - 35, this.y - 40, 70, 25);
            ctx.fillStyle = '#FFE66D';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${normalizedAngle.toFixed(0)}°`, this.x, this.y - 20);
            ctx.textAlign = 'left';
        }

        ctx.restore();
    }

    renderMaterial(ctx, endpoints) {
        const { x1, y1, x2, y2 } = endpoints;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const len = this.width;
        const t = this.thickness;
        const mat = getMaterial(this.material);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        if (this.material === 'trampoline') {
            // Legs + springy mat that dips after a hit
            const dip = Math.sin(this.squash * Math.PI) * 8;
            ctx.strokeStyle = '#2D2D2D';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-len / 2 + 6, 0); ctx.lineTo(-len / 2 + 14, t);
            ctx.moveTo(len / 2 - 6, 0); ctx.lineTo(len / 2 - 14, t);
            ctx.stroke();
            ctx.strokeStyle = mat.color;
            ctx.lineWidth = t * 0.6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-len / 2, 0);
            ctx.quadraticCurveTo(0, dip * 2, len / 2, 0);
            ctx.stroke();
            // Zigzag spring hint
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = -len / 2 + 10, i = 0; x <= len / 2 - 10; x += 10, i++) {
                const y = (i % 2 === 0 ? -3 : 3) + dip * (1 - (2 * x / len) ** 2);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        } else if (this.material === 'sponge') {
            const squish = 1 - this.squash * 0.35;
            ctx.fillStyle = mat.color;
            ctx.beginPath();
            ctx.roundRect(-len / 2, -t / 2 * squish, len, t * squish, t / 2);
            ctx.fill();
            // Sponge holes
            ctx.fillStyle = 'rgba(150, 60, 30, 0.45)';
            for (let x = -len / 2 + 8, i = 0; x < len / 2 - 4; x += 13, i++) {
                ctx.beginPath();
                ctx.arc(x, (i % 2 === 0 ? -3 : 3) * squish, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.material === 'glass') {
            ctx.fillStyle = 'rgba(190, 233, 255, 0.45)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(-len / 2, -t / 2, len, t);
            ctx.fill();
            ctx.stroke();
            // Shine streaks
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            for (let x = -len / 2 + 15; x < len / 2 - 10; x += 40) {
                ctx.moveTo(x, t / 2 - 3);
                ctx.lineTo(x + 8, -t / 2 + 3);
            }
            ctx.stroke();
        }

        ctx.restore();
    }

    renderShards(ctx) {
        this.shards.forEach(s => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, s.life);
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rot);
            ctx.fillStyle = 'rgba(190, 233, 255, 0.85)';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -s.size / 2);
            ctx.lineTo(s.size / 2, s.size / 2);
            ctx.lineTo(-s.size / 2, s.size / 3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });
    }
}
