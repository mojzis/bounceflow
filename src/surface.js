/**
 * Interactive surface entity for BounceFlow
 */

import * as Matter from 'matter-js';
import { pointNearLine, degToRad, radToDeg } from './utils.js';

export class Surface {
    constructor(x, y, width, angle = 0, locked = false, physicsWorld) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.angle = angle;
        this.locked = locked;
        this.physicsWorld = physicsWorld;
        this.thickness = 10;

        // Interaction state
        this.isDragging = false;
        this.isRotating = false;
        this.dragOffset = { x: 0, y: 0 };
        this.rotationStartAngle = 0;
        this.hovered = false;

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
                restitution: 0.99,
                label: 'surface'
            }
        );

        Matter.World.add(this.physicsWorld, this.body);
    }

    handleMouseDown(mx, my, isRightClick = false) {
        if (this.locked) return false;

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
        if (this.locked) return;

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
        Matter.Body.setPosition(this.body, { x: this.x, y: this.y });
        Matter.Body.setAngle(this.body, degToRad(this.angle));
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

    render(ctx) {
        const endpoints = this.getEndpoints();

        ctx.save();

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
        } else if (this.hovered) {
            ctx.strokeStyle = '#95E1D3';
            ctx.lineWidth = this.thickness + 2;
        } else {
            ctx.strokeStyle = '#2D2D2D';
            ctx.lineWidth = this.thickness;
        }

        ctx.lineCap = 'round';
        ctx.stroke();

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

        ctx.restore();
    }
}
