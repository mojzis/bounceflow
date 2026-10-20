/**
 * Ball entity with dynamic properties for BounceFlow
 */

import * as Matter from 'matter-js';
import { lerpColor } from './utils.js';
import { WEIGHTS, clampElasticity } from './mechanics.js';

export class Ball {
    constructor(x, y, radius = 20, physicsWorld) {
        this.radius = radius;
        this.physicsWorld = physicsWorld;

        // Create physics body, then freeze it until released.
        // Created dynamic first so Matter.js stores its real mass; a body
        // created with isStatic: true has no mass to restore on release.
        this.body = Matter.Bodies.circle(x, y, radius, {
            restitution: 0.95,
            friction: 0,
            frictionAir: 0,
            density: 0.001,
            label: 'ball'
        });
        Matter.Body.setStatic(this.body, true);

        Matter.World.add(physicsWorld, this.body);

        // Property system
        this.baseElasticity = 0.9;
        this.currentElasticity = 0.9;
        this.elasticityPhase = 0;
        this.cycleSpeed = 0.001; // Radians per frame
        this.propertyPattern = 'static'; // 'static', 'wave', 'pulse'
        this.elasticityShift = 0; // Added by trampolines, sponges, stars
        this.weight = 'normal'; // 'normal', 'heavy', 'light'

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

    setBaseElasticity(value) {
        this.baseElasticity = value;
        this.currentElasticity = value;
        this.updateColor();
    }

    /**
     * Change elasticity on top of the time-based pattern (e.g. trampoline hit).
     */
    adjustElasticity(delta) {
        // Keep the shift within what the pattern can actually reach
        const pattern = this.getPatternElasticity();
        this.currentElasticity = clampElasticity(pattern + this.elasticityShift + delta);
        this.elasticityShift = this.currentElasticity - pattern;
        Matter.Body.set(this.body, 'restitution', this.currentElasticity);
        this.updateColor();
    }

    setWeight(weight) {
        this.weight = WEIGHTS[weight] ? weight : 'normal';
        // Static bodies have infinite mass; weight is applied on activate()
        if (!this.body.isStatic) this.applyWeight();
    }

    applyWeight() {
        const w = WEIGHTS[this.weight];
        Matter.Body.setDensity(this.body, w.density);
        this.body.frictionAir = w.frictionAir;
    }

    getPatternElasticity() {
        if (this.propertyPattern === 'wave') {
            // Sine wave: oscillates between 0.2 and 0.8
            return 0.5 + Math.sin(this.elasticityPhase) * 0.3;
        } else if (this.propertyPattern === 'pulse') {
            // Pulse pattern: sudden spikes
            const pulseValue = Math.max(0, Math.sin(this.elasticityPhase));
            return 0.3 + pulseValue * 0.5;
        }
        return this.baseElasticity;
    }

    activate() {
        this.isActive = true;
        // Make ball dynamic (unfreeze it)
        Matter.Body.setStatic(this.body, false);
        this.applyWeight();
    }

    reset(x, y) {
        // Freeze ball again
        this.weight = 'normal';
        Matter.Body.setStatic(this.body, true);
        Matter.Body.setPosition(this.body, { x, y });
        Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(this.body, 0);
        this.isActive = false;
        this.elasticityPhase = 0;
        this.elasticityShift = 0;
        this.currentElasticity = this.baseElasticity;
        this.trailPoints = [];
        this.updateColor();
    }

    update(deltaTime) {
        if (!this.isActive) return;

        // Ball corruption is detected one level up in Game.update(), which
        // routes through stateController.recover() — see src/game/index.js.

        // Update property based on pattern ('static' doesn't change)
        if (this.propertyPattern !== 'static') {
            this.elasticityPhase += this.cycleSpeed * deltaTime;
        }
        this.currentElasticity = clampElasticity(this.getPatternElasticity() + this.elasticityShift);

        // Update physics body
        Matter.Body.set(this.body, 'restitution', this.currentElasticity);

        // Update visual feedback
        this.updateColor();
        this.updateTrail();

        // Safety cap to prevent physics instability (very high limit)
        const maxVelocity = 100;
        const velocity = this.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > maxVelocity) {
            console.warn(`Ball velocity too high (${speed.toFixed(1)}), capping to ${maxVelocity}`);
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

    renderWeight(ctx, pos) {
        if (this.weight === 'heavy') {
            // Thick metal rim with bolts
            ctx.strokeStyle = '#3A3A48';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.radius - 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#3A3A48';
            for (let i = 0; i < 4; i++) {
                const a = this.body.angle + i * Math.PI / 2 + Math.PI / 4;
                ctx.beginPath();
                ctx.arc(pos.x + Math.cos(a) * this.radius * 0.55, pos.y + Math.sin(a) * this.radius * 0.55, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.weight === 'light') {
            // Airy dashed halo
            ctx.save();
            ctx.setLineDash([4, 5]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.radius + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    getElasticityRatio() {
        // Return 0-1 ratio for UI display
        return (this.currentElasticity - 0.2) / 0.8;
    }

    render(ctx) {
        const pos = this.body.position;

        // Safety check: don't render if position is invalid
        if (!isFinite(pos.x) || !isFinite(pos.y)) {
            console.warn('Ball position is invalid (NaN or Infinity), skipping render');
            return;
        }

        // Draw trail - optimized to reduce canvas state changes
        if (this.isActive && this.trailPoints.length > 1) {
            ctx.lineCap = 'round';
            // Draw trail as single path with gradient alpha for better performance
            ctx.strokeStyle = this.color; // Use current color instead of per-segment
            for (let i = 0; i < this.trailPoints.length - 1; i++) {
                const alpha = i / this.trailPoints.length;
                const point = this.trailPoints[i];

                ctx.globalAlpha = alpha * 0.3;
                ctx.lineWidth = this.radius * 0.5 * alpha;

                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(this.trailPoints[i + 1].x, this.trailPoints[i + 1].y);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        // Draw glow - simplified without gradient for better performance
        ctx.fillStyle = this.color + '40'; // Add alpha hex (25% opacity)
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

        this.renderWeight(ctx, pos);

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
