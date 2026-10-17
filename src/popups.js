/**
 * Short floating text bursts ("Boing!", "SMASH!") for game feedback.
 */
export class Popups {
    constructor() {
        this.items = [];
    }

    add(x, y, text, color = '#FFFFFF', size = 22) {
        this.items.push({ x, y, text, color, size, life: 1 });
    }

    clear() {
        this.items = [];
    }

    update(deltaTime) {
        this.items = this.items.filter(p => {
            p.life -= deltaTime / 1200;
            p.y -= deltaTime * 0.04;
            return p.life > 0;
        });
    }

    render(ctx) {
        this.items.forEach(p => {
            const pop = p.life > 0.85 ? 1 + (p.life - 0.85) * 2 : 1;
            ctx.save();
            ctx.globalAlpha = Math.min(1, p.life * 1.5);
            ctx.font = `bold ${Math.round(p.size * pop)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.strokeText(p.text, p.x, p.y);
            ctx.fillStyle = p.color;
            ctx.fillText(p.text, p.x, p.y);
            ctx.restore();
        });
    }
}
