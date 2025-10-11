/**
 * Ball entity with dynamic properties for BounceFlow
 */

import * as Matter from 'matter-js';
import { lerpColor, clamp } from './utils.js';

export class Ball {
    constructor(x, y, radius = 20, physicsWorld) {
        this.radius = radius;
        this.physicsWorld = physicsWorld;

        // Create physics body
        this.body = Matter.Bodies.circle(x, y, radius, {
            restitution: 0.8,
            friction: 0.001,
            frictionAir: 0.001,
            density: 0.001,
            label: 'ball'
        });

        Matter.World.add(physicsWorld, this.body);

        // Property system
        this.baseElasticity = 0.5;
        this.currentElasticity = 0.5;
        this.elasticityPhase = 0;
        this.cycleSpeed = 0.001; // Radians per frame
        this.propertyPattern = 'static'; // 'static', 'wave', 'pulse'

        // Visual properties
        this.color = '#FF6B6B';
        this.trailPoints = [];
        this.maxTrailLength = 20;

        // State
        this.isActive = false;
    }

    setPropertyPattern(pattern, cycleSpeed = 0.001) {
        this.propertyPattern = pattern;
        this.cycleSpeed = cycleSpeed;
    }

    activate() {
        this.isActive = true;
    }

    reset(x, y) {
        Matter.Body.setPosition(this.body, { x, y });
        Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(this.body, 0);
        this.isActive = false;
        this.elasticityPhase = 0;
        this.currentElasticity = this.baseElasticity;
        this.trailPoints = [];
        this.updateColor();
    }

    update(deltaTime) {
        if (!this.isActive) return;

        // Update property based on pattern
        if (this.propertyPattern === 'wave') {
            this.elasticityPhase += this.cycleSpeed * deltaTime;
            // Sine wave: oscillates between 0.2 and 0.8
            this.currentElasticity = 0.5 + Math.sin(this.elasticityPhase) * 0.3;
        } else if (this.propertyPattern === 'pulse') {
            this.elasticityPhase += this.cycleSpeed * deltaTime;
            // Pulse pattern: sudden spikes
            const pulseValue = Math.max(0, Math.sin(this.elasticityPhase));
            this.currentElasticity = 0.3 + pulseValue * 0.5;
        }
        // 'static' pattern doesn't change

        // Clamp elasticity
        this.currentElasticity = clamp(this.currentElasticity, 0.2, 1.0);

        // Update physics body
        Matter.Body.set(this.body, 'restitution', this.currentElasticity);

        // Update visual feedback
        this.updateColor();
        this.updateTrail();

        // Cap velocity to prevent crazy speeds
        const maxVelocity = 20;
        const velocity = this.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > maxVelocity) {
            const scale = maxVelocity / speed;
            Matter.Body.setVelocity(this.body, {
                x: velocity.x * scale,
                y: velocity.y * scale
            });
        }
    }

    updateColor() {
        // Interpolate color based on elasticity
        // Low elasticity (0.2) = red, High elasticity (1.0) = cyan
        const ratio = (this.currentElasticity - 0.2) / 0.8;
        this.color = lerpColor('#FF6B6B', '#4ECDC4', ratio);
    }

    updateTrail() {
        // Add current position to trail
        this.trailPoints.push({
            x: this.body.position.x,
            y: this.body.position.y,
            color: this.color
        });

        // Limit trail length
        if (this.trailPoints.length > this.maxTrailLength) {
            this.trailPoints.shift();
        }
    }

    getElasticityRatio() {
        // Return 0-1 ratio for UI display
        return (this.currentElasticity - 0.2) / 0.8;
    }

    render(ctx) {
        const pos = this.body.position;

        // Draw trail
        if (this.isActive && this.trailPoints.length > 1) {
            for (let i = 0; i < this.trailPoints.length - 1; i++) {
                const alpha = i / this.trailPoints.length;
                const point = this.trailPoints[i];

                ctx.strokeStyle = point.color;
                ctx.globalAlpha = alpha * 0.3;
                ctx.lineWidth = this.radius * 0.5 * alpha;
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(this.trailPoints[i + 1].x, this.trailPoints[i + 1].y);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        // Draw glow
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, this.radius * 1.5);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw ball body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw subtle outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw simple eyes for character
        if (!this.isActive) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(pos.x - this.radius * 0.3, pos.y - this.radius * 0.2, this.radius * 0.15, 0, Math.PI * 2);
            ctx.arc(pos.x + this.radius * 0.3, pos.y - this.radius * 0.2, this.radius * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
