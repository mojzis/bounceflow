/**
 * Handles all game rendering
 */
import { getLevel } from '../levels.js';

export class RenderingSystem {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.canvas = game.canvas;
    }

    render() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render surfaces (show angles in replay mode or if toggled on)
        const isReplay = this.game.currentState === this.game.states.REPLAY;
        const displayAngles = isReplay || this.game.showAngles;
        this.game.surfaces.forEach(surface => surface.render(this.ctx, displayAngles));

        // Render targets
        this.game.targets.forEach(target => target.render(this.ctx));

        // Render bird obstacle
        if (this.game.bird) {
            this.game.bird.render(this.ctx);
        }

        // Show angle toggle indicator
        if (this.game.showAngles && !isReplay && !this.game.showHints && !this.game.solver.running) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, this.canvas.height - 50, 150, 40);
            this.ctx.fillStyle = '#FFE66D';
            this.ctx.font = 'bold 14px sans-serif';
            this.ctx.fillText('Angles: ON (V)', 20, this.canvas.height - 25);
        }

        // Render hint surfaces and solver visualization
        // In debug mode, show hints even during replay
        if ((this.game.debugMode || !isReplay) && (this.game.showHints || this.game.solver.running)) {
            this.renderHints();
        }

        // Render replay mode
        if (this.game.currentState === this.game.states.REPLAY) {
            this.renderReplay();
        } else {
            // Render ball normally
            if (this.game.ball) {
                this.game.ball.render(this.ctx);
            }

            // Render hook in MENU state or during release animation
            if (this.game.currentState === this.game.states.MENU || this.game.hookReleasing) {
                this.renderHook();
            }
        }

        // Show debug mode indicator
        if (this.game.debugMode) {
            this.ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
            this.ctx.fillRect(10, this.canvas.height - 180, 150, 40);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px sans-serif';
            this.ctx.fillText('DEBUG MODE (B)', 20, this.canvas.height - 155);
        }
    }

    renderHook() {
        if (!this.game.ball) return;

        const ctx = this.ctx;
        const ballPos = this.game.ball.body.position;
        const ballRadius = this.game.ball.radius;

        // Calculate hook position with sway and release animation
        let hookX = ballPos.x + this.game.hookSwayOffset;
        let hookY = ballPos.y - ballRadius - 8;

        // During release, move hook upward
        if (this.game.hookReleasing) {
            hookY -= this.game.hookReleaseProgress * 80;
        }

        // Draw cable/rope from top of screen (friendlier color)
        ctx.save();
        ctx.strokeStyle = 'rgba(120, 140, 160, 0.7)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        // Draw cable with slight curve
        ctx.beginPath();
        ctx.moveTo(hookX, 0);
        const controlY = hookY * 0.3;
        ctx.quadraticCurveTo(hookX + this.game.hookSwayOffset * 0.5, controlY, hookX, hookY);
        ctx.stroke();

        // Crab claw parameters
        const clawRadius = 15; // Radius of the rounded claw
        const clawThickness = 8; // Thickness of the claw
        const closedDistance = ballRadius + 5; // Start close to ball sides
        const openDistance = this.game.hookReleasing
            ? closedDistance + (this.game.hookReleaseProgress * 35) // Open further when releasing
            : closedDistance;

        // Draw robot hand base (top connector)
        ctx.fillStyle = '#7B8FA3';
        ctx.fillRect(hookX - 20, hookY - 22, 40, 16);

        // Rounded corners for base
        ctx.beginPath();
        ctx.arc(hookX - 20, hookY - 14, 8, Math.PI, Math.PI * 1.5);
        ctx.arc(hookX + 20, hookY - 14, 8, Math.PI * 1.5, 0);
        ctx.fill();

        ctx.fillStyle = '#95B8D1';
        ctx.strokeStyle = '#6B8BA3';
        ctx.lineWidth = 2.5;

        // LEFT CRAB CLAW (rounded pincer on left side of ball)
        const leftClawX = hookX - openDistance;
        const leftClawY = ballPos.y; // Align with ball center

        // Draw left arm connecting to base
        ctx.fillRect(leftClawX, hookY - 6, openDistance - closedDistance + 12, 12);

        // Draw left rounded claw (C-shape opening to the right)
        ctx.beginPath();
        // Outer arc
        ctx.arc(leftClawX, leftClawY, clawRadius, Math.PI * 0.6, Math.PI * 1.4, false);
        // Inner arc (smaller, creating thickness)
        ctx.arc(leftClawX, leftClawY, clawRadius - clawThickness, Math.PI * 1.4, Math.PI * 0.6, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Upper pincer tip
        ctx.beginPath();
        ctx.arc(leftClawX + clawRadius * Math.cos(Math.PI * 0.6),
                leftClawY + clawRadius * Math.sin(Math.PI * 0.6),
                clawThickness / 2, 0, Math.PI * 2);
        ctx.fill();

        // Lower pincer tip
        ctx.beginPath();
        ctx.arc(leftClawX + clawRadius * Math.cos(Math.PI * 1.4),
                leftClawY + clawRadius * Math.sin(Math.PI * 1.4),
                clawThickness / 2, 0, Math.PI * 2);
        ctx.fill();

        // Grip pad on left claw
        ctx.fillStyle = '#FFE66D';
        ctx.beginPath();
        ctx.arc(leftClawX + clawRadius - 6, leftClawY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Joint detail on left arm
        ctx.fillStyle = '#5A7A8A';
        ctx.beginPath();
        ctx.arc(leftClawX + 8, hookY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // RIGHT CRAB CLAW (rounded pincer on right side of ball)
        const rightClawX = hookX + openDistance;
        const rightClawY = ballPos.y; // Align with ball center

        // Draw right arm connecting to base
        ctx.fillStyle = '#95B8D1';
        ctx.fillRect(hookX, hookY - 6, openDistance - closedDistance + 12, 12);

        // Draw right rounded claw (backwards C-shape opening to the left)
        ctx.beginPath();
        // Outer arc
        ctx.arc(rightClawX, rightClawY, clawRadius, Math.PI * 1.6, Math.PI * 0.4, false);
        // Inner arc (smaller, creating thickness)
        ctx.arc(rightClawX, rightClawY, clawRadius - clawThickness, Math.PI * 0.4, Math.PI * 1.6, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Upper pincer tip
        ctx.beginPath();
        ctx.arc(rightClawX + clawRadius * Math.cos(Math.PI * 1.6),
                rightClawY + clawRadius * Math.sin(Math.PI * 1.6),
                clawThickness / 2, 0, Math.PI * 2);
        ctx.fill();

        // Lower pincer tip
        ctx.beginPath();
        ctx.arc(rightClawX + clawRadius * Math.cos(Math.PI * 0.4),
                rightClawY + clawRadius * Math.sin(Math.PI * 0.4),
                clawThickness / 2, 0, Math.PI * 2);
        ctx.fill();

        // Grip pad on right claw
        ctx.fillStyle = '#FFE66D';
        ctx.beginPath();
        ctx.arc(rightClawX - clawRadius + 6, rightClawY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Joint detail on right arm
        ctx.fillStyle = '#5A7A8A';
        ctx.beginPath();
        ctx.arc(rightClawX - 8, hookY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Add cute robot eye on the base
        if (!this.game.hookReleasing || this.game.hookReleaseProgress < 0.5) {
            ctx.fillStyle = '#4ECDC4';
            ctx.beginPath();
            ctx.arc(hookX, hookY - 14, 4, 0, Math.PI * 2);
            ctx.fill();
            // Add highlight for eye
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(hookX - 1, hookY - 15, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Add joint screws/rivets for detail
        ctx.fillStyle = '#5A7A8A';
        [-11, 11].forEach(xOffset => {
            ctx.beginPath();
            ctx.arc(hookX + xOffset, hookY - 12, 2.5, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    renderHints() {
        // Only render if solver is actually running or we have results to show
        if (!this.game.solver.running && !this.game.solver.bestConfig) return;

        const ctx = this.ctx;

        // Draw solver status
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, this.canvas.height - 120, 300, 60);
        ctx.fillStyle = '#4ECDC4';
        ctx.font = 'bold 14px sans-serif';

        if (this.game.solver.running) {
            const text = `🔬 Experimenting... (${this.game.solver.currentAttempt} tries)`;
            ctx.fillText(text, 20, this.canvas.height - 95);
        } else if (this.game.solver.bestConfig) {
            if (this.game.solver.foundSolution) {
                ctx.fillStyle = '#4ECDC4';
                ctx.fillText(`✅ Solution Found!`, 20, this.canvas.height - 95);
            } else {
                ctx.fillStyle = '#FF6B6B';
                ctx.fillText(`❌ No Solution (best try shown)`, 20, this.canvas.height - 95);
            }
        }

        // Show attempts count
        if (this.game.solver.attempts.length > 0) {
            ctx.font = '12px sans-serif';
            ctx.fillStyle = 'white';
            ctx.fillText(`Failed: ${this.game.solver.attempts.filter(a => !a.success).length}`, 20, this.canvas.height - 75);
        }

        // Draw last 20 failed attempts as visible trajectories
        const failedAttempts = this.game.solver.attempts.filter(a => !a.success).slice(-20);
        failedAttempts.forEach((attempt, index) => {
            // More visible - opacity from 0.2 to 0.5
            ctx.strokeStyle = `rgba(255, 100, 100, ${0.2 + (index / 20) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();

            attempt.trajectory.forEach((point, i) => {
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.stroke();
        });

        // Draw current attempt being tested (if solver is running)
        if (this.game.solver.running && this.game.solver.attempts.length > 0) {
            const currentAttempt = this.game.solver.attempts[this.game.solver.attempts.length - 1];

            // Show surfaces being tested
            const level = getLevel(this.game.currentLevel);
            currentAttempt.config.forEach((configSurface, index) => {
                if (configSurface.locked) return;

                const angleRad = (configSurface.angle * Math.PI) / 180;
                const halfWidth = configSurface.width / 2;

                const x1 = configSurface.x - Math.cos(angleRad) * halfWidth;
                const y1 = configSurface.y - Math.sin(angleRad) * halfWidth;
                const x2 = configSurface.x + Math.cos(angleRad) * halfWidth;
                const y2 = configSurface.y + Math.sin(angleRad) * halfWidth;

                // Draw testing surface
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)';
                ctx.lineWidth = 18;
                ctx.setLineDash([5, 5]);
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                ctx.restore();
            });

            // Show trajectory
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();

            currentAttempt.trajectory.forEach((point, i) => {
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw best/successful configuration if found
        if (this.game.solver.bestConfig && this.game.showHints) {
            const config = this.game.solver.bestConfig;
            const successfulAttempt = this.game.solver.attempts.find(a => a.success);
            const bestAttempt = successfulAttempt || this.game.solver.attempts.find(a => a.config === this.game.solver.bestConfig);

            // Draw successful trajectory if exists
            if (successfulAttempt) {
                ctx.strokeStyle = 'rgba(78, 205, 196, 0.6)';
                ctx.lineWidth = 3;
                ctx.beginPath();

                successfulAttempt.trajectory.forEach((point, i) => {
                    if (i === 0) {
                        ctx.moveTo(point.x, point.y);
                    } else {
                        ctx.lineTo(point.x, point.y);
                    }
                });
                ctx.stroke();
            }

            // Draw collision/impact points with force vectors
            if (bestAttempt && bestAttempt.collisionData) {
                bestAttempt.collisionData.forEach((collision) => {
                    // Draw impact point
                    ctx.fillStyle = 'rgba(78, 205, 196, 0.8)';
                    ctx.beginPath();
                    ctx.arc(collision.x, collision.y, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Draw normal force vector (perpendicular to surface)
                    const normalScale = 80;
                    this.drawForceVector(
                        ctx,
                        collision.x,
                        collision.y,
                        collision.normalX * normalScale,
                        collision.normalY * normalScale,
                        '#00FF00',
                        'Normal Force'
                    );

                    // Draw incoming velocity vector
                    const velScale = 3;
                    this.drawForceVector(
                        ctx,
                        collision.x,
                        collision.y,
                        -collision.velocityBeforeX * velScale,
                        -collision.velocityBeforeY * velScale,
                        '#4ECDC4',
                        'Impact'
                    );

                    // Draw surface angle and speed label
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.fillRect(collision.x + 15, collision.y - 45, 100, 40);
                    ctx.fillStyle = '#4ECDC4';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText(`Angle: ${collision.surfaceAngle.toFixed(1)}°`, collision.x + 20, collision.y - 30);
                    ctx.fillStyle = 'white';
                    ctx.font = '11px sans-serif';
                    ctx.fillText(`Speed: ${collision.impactSpeed.toFixed(1)}`, collision.x + 20, collision.y - 15);
                });
            }

            // Draw ghost surfaces at solution positions
            const level = getLevel(this.game.currentLevel);
            level.surfaces.forEach((originalSurface, index) => {
                if (originalSurface.locked) return;

                const configSurface = Array.isArray(config) ? config[index] : config;
                if (!configSurface) return;

                const angleRad = (configSurface.angle * Math.PI) / 180;
                const halfWidth = configSurface.width / 2;

                const x1 = configSurface.x - Math.cos(angleRad) * halfWidth;
                const y1 = configSurface.y - Math.sin(angleRad) * halfWidth;
                const x2 = configSurface.x + Math.cos(angleRad) * halfWidth;
                const y2 = configSurface.y + Math.sin(angleRad) * halfWidth;

                // Draw ghost surface with dashed line
                ctx.save();
                ctx.strokeStyle = '#4ECDC4';
                ctx.lineWidth = 20;
                ctx.globalAlpha = 0.5;
                ctx.setLineDash([10, 10]);
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                // Draw center point
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = '#4ECDC4';
                ctx.beginPath();
                ctx.arc(configSurface.x, configSurface.y, 6, 0, Math.PI * 2);
                ctx.fill();

                // Draw angle label
                ctx.globalAlpha = 0.9;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(configSurface.x - 30, configSurface.y - 35, 60, 22);
                ctx.fillStyle = '#4ECDC4';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${configSurface.angle.toFixed(0)}°`, configSurface.x, configSurface.y - 18);

                ctx.restore();
            });

            ctx.textAlign = 'left';
        }
    }

    renderReplay() {
        if (this.game.replayData.length === 0) return;

        const ctx = this.ctx;
        const currentIndex = Math.floor(this.game.replayIndex);

        // Draw full path as a trail
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < this.game.replayData.length; i++) {
            const point = this.game.replayData[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();

        // Draw collision/impact points with force vectors
        this.game.collisionData.forEach((collision, index) => {
            // Draw impact point
            ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.beginPath();
            ctx.arc(collision.x, collision.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw normal force vector (perpendicular to surface)
            const normalScale = 80; // Scale for visibility
            this.drawForceVector(
                ctx,
                collision.x,
                collision.y,
                collision.normalX * normalScale,
                collision.normalY * normalScale,
                '#00FF00', // Green for normal force
                'Normal Force'
            );

            // Draw incoming velocity vector
            const velScale = 3;
            this.drawForceVector(
                ctx,
                collision.x,
                collision.y,
                -collision.velocityBeforeX * velScale, // Negative to show incoming direction
                -collision.velocityBeforeY * velScale,
                '#FF6B6B', // Red for incoming
                'Impact'
            );

            // Draw surface angle label
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(collision.x + 15, collision.y - 45, 100, 40);
            ctx.fillStyle = '#FFE66D';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`Angle: ${collision.surfaceAngle.toFixed(1)}°`, collision.x + 20, collision.y - 30);
            ctx.fillStyle = 'white';
            ctx.font = '11px sans-serif';
            ctx.fillText(`Speed: ${collision.impactSpeed.toFixed(1)}`, collision.x + 20, collision.y - 15);
        });

        // Draw velocity vectors at key points (every 10 frames)
        for (let i = 0; i < Math.min(currentIndex, this.game.replayData.length); i += 10) {
            const point = this.game.replayData[i];
            this.drawVelocityVector(ctx, point.x, point.y, point.vx, point.vy, point.speed);
        }

        // Draw current position with larger vector
        if (currentIndex < this.game.replayData.length) {
            const current = this.game.replayData[currentIndex];

            // Draw ball at current position
            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath();
            ctx.arc(current.x, current.y, 20, 0, Math.PI * 2);
            ctx.fill();

            // Draw velocity vector
            this.drawVelocityVector(ctx, current.x, current.y, current.vx, current.vy, current.speed, true);
        }

        // If replay finished, loop or stop
        if (currentIndex >= this.game.replayData.length) {
            this.game.replayIndex = 0; // Loop
        }

        // Draw replay UI with legend
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, 10, 280, 140);

        // Progress
        ctx.fillStyle = 'white';
        ctx.font = '16px sans-serif';
        ctx.fillText(`Replay: ${Math.floor((currentIndex / this.game.replayData.length) * 100)}%`, 20, 30);
        ctx.font = '12px sans-serif';
        ctx.fillText(`Impacts recorded: ${this.game.collisionData.length}`, 20, 50);

        // Legend
        ctx.fillStyle = '#FFE66D';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('Legend:', 20, 75);

        ctx.font = '11px sans-serif';

        // Red vector
        ctx.fillStyle = '#FF6B6B';
        ctx.fillText('● Red = Impact velocity', 30, 92);

        // Green vector
        ctx.fillStyle = '#00FF00';
        ctx.fillText('● Green = Normal force', 30, 107);

        // Yellow vector
        ctx.fillStyle = '#FFE66D';
        ctx.fillText('● Yellow = Ball velocity', 30, 122);

        // Impact marker
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.fillText('● Impact points', 30, 137);
    }

    drawForceVector(ctx, x, y, fx, fy, color, label = '') {
        const endX = x + fx;
        const endY = y + fy;

        // Vector line
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(fy, fx);
        const arrowSize = 12;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Label
        if (label) {
            ctx.fillStyle = color;
            ctx.font = 'bold 11px sans-serif';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 3;
            ctx.fillText(label, endX + 5, endY - 5);
            ctx.shadowBlur = 0;
        }
    }

    drawVelocityVector(ctx, x, y, vx, vy, speed, isLarge = false) {
        const scale = isLarge ? 3 : 2;
        const endX = x + vx * scale;
        const endY = y + vy * scale;

        // Vector line
        ctx.strokeStyle = isLarge ? '#FFE66D' : 'rgba(255, 230, 109, 0.6)';
        ctx.lineWidth = isLarge ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(vy, vx);
        const arrowSize = isLarge ? 12 : 8;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Speed label for large vectors
        if (isLarge) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(`${speed.toFixed(1)} px/s`, endX + 10, endY - 10);
        }
    }
}
