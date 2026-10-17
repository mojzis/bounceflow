/**
 * Target (star) entity for BounceFlow
 */

import { STAR_EFFECTS } from './mechanics.js';

export class Target {
    constructor(x, y, radius = 25, effect = null) {
        this.effect = STAR_EFFECTS[effect] ? effect : null;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.collected = false;
        this.pulseAnimation = 0;
        this.particles = [];
    }

    update(deltaTime) {
        if (!this.collected) {
            // Pulse animation for uncollected targets
            this.pulseAnimation += deltaTime * 0.003;
        } else {
            // Update celebration particles
            this.particles = this.particles.filter(p => {
                p.life -= deltaTime * 0.001;
                p.x += p.vx * deltaTime * 0.1;
                p.y += p.vy * deltaTime * 0.1;
                p.vy += 0.02; // Gravity on particles
                return p.life > 0;
            });
        }
    }

    checkCollection(ball) {
        if (this.collected) return false;

        const dx = ball.body.position.x - this.x;
        const dy = ball.body.position.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius + ball.radius) {
            this.collected = true;
            this.createParticleBurst();
            return true;
        }

        return false;
    }

    createParticleBurst() {
        // Create celebration particles
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: this.getRandomColor()
            });
        }
    }

    getRandomColor() {
        const colors = ['#FFE66D', '#4ECDC4', '#FF6B6B', '#95E1D3', '#FF8CC3'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    render(ctx) {
        if (!this.collected) {
            // Draw pulsing star
            const pulse = Math.sin(this.pulseAnimation) * 0.2 + 1;
            const size = this.radius * pulse;

            ctx.save();
            ctx.translate(this.x, this.y);

            // Draw glow
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
            gradient.addColorStop(0, 'rgba(255, 230, 109, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 230, 109, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(-size * 1.5, -size * 1.5, size * 3, size * 3);

            // Power stars get a colored ring showing their effect
            if (this.effect) {
                const fx = STAR_EFFECTS[this.effect];
                ctx.strokeStyle = fx.color;
                ctx.lineWidth = 4;
                ctx.setLineDash([6, 4]);
                ctx.lineDashOffset = -this.pulseAnimation * 10;
                ctx.beginPath();
                ctx.arc(0, 0, size * 1.15, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Draw star
            this.drawStar(ctx, 0, 0, 5, size, size * 0.5);
            ctx.fillStyle = '#FFE66D';
            ctx.fill();
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.stroke();

            if (this.effect) {
                this.drawEffectIcon(ctx, size);
            }

            ctx.restore();
        } else {
            // Draw celebration particles
            this.particles.forEach(particle => {
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.life;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            });
        }
    }

    drawEffectIcon(ctx, size) {
        const r = size * 0.32;
        const fx = STAR_EFFECTS[this.effect];
        ctx.fillStyle = fx.color;
        ctx.strokeStyle = '#2D2D2D';
        ctx.lineWidth = 1.5;
        if (this.effect === 'heavy') {
            // Little weight block
            ctx.beginPath();
            ctx.moveTo(-r, r * 0.8);
            ctx.lineTo(r, r * 0.8);
            ctx.lineTo(r * 0.7, -r * 0.5);
            ctx.lineTo(-r * 0.7, -r * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.effect === 'light') {
            // Feather
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 0.45, r * 1.1, Math.PI / 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            // Ball in the effect's color
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }

        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    }
}
