/**
 * Bird obstacle that flies across the screen
 */

export class Bird {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.speed = 2; // Slow speed
        this.size = 30;
        this.direction = 1; // 1 for right, -1 for left
        this.wingAngle = 0;
    }

    spawn() {
        // Random height (avoid top 100px and bottom 100px)
        this.y = 100 + Math.random() * (this.canvasHeight - 200);

        // Random direction
        this.direction = Math.random() > 0.5 ? 1 : -1;

        // Start from offscreen
        if (this.direction > 0) {
            this.x = -this.size * 2;
        } else {
            this.x = this.canvasWidth + this.size * 2;
        }

        this.active = true;
        this.wingAngle = 0;
    }

    update(deltaTime) {
        if (!this.active) return;

        // Move horizontally
        this.x += this.speed * this.direction * (deltaTime / 16.67); // Normalize to 60fps

        // Animate wings
        this.wingAngle += deltaTime * 0.01;

        // Deactivate when offscreen
        if (this.direction > 0 && this.x > this.canvasWidth + this.size * 2) {
            this.active = false;
        } else if (this.direction < 0 && this.x < -this.size * 2) {
            this.active = false;
        }
    }

    checkCollision(ball) {
        if (!this.active) return false;

        const dx = ball.body.position.x - this.x;
        const dy = ball.body.position.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Collision radius (bird size + ball radius)
        return distance < (this.size / 2 + ball.radius);
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Flip horizontally if flying left
        if (this.direction < 0) {
            ctx.scale(-1, 1);
        }

        // Draw body (ellipse)
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.6, this.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw wings (flapping animation)
        const wingFlap = Math.sin(this.wingAngle) * 0.3;

        // Top wing
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.3, 0);
        ctx.quadraticCurveTo(
            -this.size * 0.7,
            -this.size * 0.5 + wingFlap * this.size,
            -this.size * 0.3,
            -this.size * 0.3
        );
        ctx.fill();

        // Bottom wing
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.3, 0);
        ctx.quadraticCurveTo(
            -this.size * 0.7,
            this.size * 0.5 - wingFlap * this.size,
            -this.size * 0.3,
            this.size * 0.3
        );
        ctx.fill();

        // Draw head
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(this.size * 0.4, 0, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Draw eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.size * 0.5, -this.size * 0.1, this.size * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Draw beak
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(this.size * 0.6, 0);
        ctx.lineTo(this.size * 0.8, this.size * 0.05);
        ctx.lineTo(this.size * 0.6, this.size * 0.1);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
