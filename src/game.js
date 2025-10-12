/**
 * Main game class for BounceFlow
 */

import * as Matter from 'matter-js';
import { Ball } from './ball.js';
import { Surface } from './surface.js';
import { Target } from './target.js';
import { getLevel, getTotalLevels } from './levels.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game state
        this.states = {
            MENU: 'menu',
            PLAYING: 'playing',
            PAUSED: 'paused',
            WON: 'won',
            REPLAY: 'replay'
        };
        this.currentState = this.states.MENU;
        this.currentLevel = 1;
        this.attempts = 0;
        this.showAngles = false; // Toggle for showing surface angles
        this.showHints = false; // Toggle for showing solution hints

        // Replay recording
        this.isRecording = false;
        this.replayData = [];
        this.collisionData = []; // Store collision/impact data
        this.replayIndex = 0;
        this.replaySpeed = 1;

        // Physics setup
        this.setupPhysics();

        // Game entities
        this.ball = null;
        this.surfaces = [];
        this.targets = [];
        this.selectedSurfaceIndex = -1; // For keyboard control

        // Input handling
        this.mousePos = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.isRightClick = false;
        this.touches = new Map();

        // UI elements
        this.setupUI();

        // Load first level
        this.loadLevel(this.currentLevel);

        // Animation
        this.lastTime = performance.now();
        this.isRunning = false;
    }

    setupPhysics() {
        // Create Matter.js engine
        this.engine = Matter.Engine.create({
            enableSleeping: false,
            positionIterations: 10,
            velocityIterations: 10
        });
        this.world = this.engine.world;

        // Configure gravity (scale for better gameplay)
        this.world.gravity.y = 0.5;

        // Disable air resistance
        this.world.gravity.scale = 0.001;

        // Create walls
        const wallOptions = { isStatic: true, friction: 0, restitution: 0.99 };
        this.walls = [
            Matter.Bodies.rectangle(this.canvas.width / 2, -25, this.canvas.width, 50, wallOptions), // Top
            Matter.Bodies.rectangle(this.canvas.width / 2, this.canvas.height + 25, this.canvas.width, 50, wallOptions), // Bottom
            Matter.Bodies.rectangle(-25, this.canvas.height / 2, 50, this.canvas.height, wallOptions), // Left
            Matter.Bodies.rectangle(this.canvas.width + 25, this.canvas.height / 2, 50, this.canvas.height, wallOptions) // Right
        ];

        Matter.World.add(this.world, this.walls);

        // Set up collision detection for recording impacts
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            this.handleCollisions(event.pairs);
        });
    }

    setupUI() {
        // Get UI elements
        this.playButton = document.getElementById('playButton');
        this.dropButton = document.getElementById('dropButton');
        this.restartButton = document.getElementById('restartButton');
        this.levelNumber = document.getElementById('level-number');
        this.hintText = document.getElementById('hint-text');
        this.elasticityFill = document.getElementById('elasticity-fill');
        this.helpOverlay = document.getElementById('help-overlay');
        this.helpButton = document.getElementById('helpButton');
        this.hintButton = document.getElementById('hintButton');
        this.closeHelpButton = document.getElementById('close-help');
        this.victoryOverlay = document.getElementById('victory-overlay');
        this.victoryMessage = document.getElementById('victory-message');
        this.replayButton = document.getElementById('replayButton');

        // Button handlers
        this.playButton.addEventListener('click', () => this.startPlay());
        this.dropButton.addEventListener('click', () => this.dropBall());
        this.restartButton.addEventListener('click', () => this.restart());
        this.replayButton.addEventListener('click', () => this.startReplay());
        this.hintButton.addEventListener('click', () => this.toggleHints());
        this.helpButton.addEventListener('click', () => this.toggleHelp());
        this.closeHelpButton.addEventListener('click', () => this.hideHelp());

        // Click outside to close help
        this.helpOverlay.addEventListener('click', (e) => {
            if (e.target === this.helpOverlay) {
                this.hideHelp();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Help toggle
            if (e.key === 'h' || e.key === 'H') {
                this.toggleHelp();
                e.preventDefault();
                return;
            } else if (e.key === 'Escape') {
                this.hideHelp();
                e.preventDefault();
                return;
            }

            // Don't process other keys if help is showing
            if (!this.helpOverlay.classList.contains('hidden')) {
                return;
            }

            if (e.key === 'r' || e.key === 'R') {
                this.restart();
            } else if (e.key === ' ') {
                if (this.currentState === this.states.MENU) {
                    this.startPlay();
                } else if (this.currentState === this.states.PLAYING) {
                    this.dropBall();
                }
                e.preventDefault();
            } else if (e.key === 'Tab') {
                this.selectNextSurface();
                e.preventDefault();
            } else if (e.key === 'q' || e.key === 'Q' || e.key === 'ArrowLeft') {
                this.rotateSelectedSurface(-5);
                e.preventDefault();
            } else if (e.key === 'e' || e.key === 'E' || e.key === 'ArrowRight') {
                this.rotateSelectedSurface(5);
                e.preventDefault();
            } else if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
                this.moveSelectedSurface(0, -5);
                e.preventDefault();
            } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
                this.moveSelectedSurface(0, 5);
                e.preventDefault();
            } else if (e.key === 'a' || e.key === 'A') {
                this.moveSelectedSurface(-5, 0);
                e.preventDefault();
            } else if (e.key === 'd' || e.key === 'D') {
                this.moveSelectedSurface(5, 0);
                e.preventDefault();
            } else if (e.key === 'v' || e.key === 'V') {
                // Toggle angle display
                this.showAngles = !this.showAngles;
                e.preventDefault();
            } else if (e.key === '?' || e.key === '/') {
                // Toggle hint display
                this.showHints = !this.showHints;
                e.preventDefault();
            }
        });
    }

    loadLevel(levelId) {
        const level = getLevel(levelId);
        if (!level) {
            console.error(`Level ${levelId} not found`);
            return;
        }

        // Clear existing entities
        this.clearLevel();

        // Hide replay button when loading new level
        this.replayButton.style.display = 'none';

        // Update UI
        this.levelNumber.textContent = levelId;
        this.hintText.textContent = level.hint;

        // Create ball
        this.ball = new Ball(level.ballStart.x, level.ballStart.y, 20, this.world);
        this.ball.setPropertyPattern(level.propertyPattern, level.cycleSpeed);

        // Create surfaces
        level.surfaces.forEach(surfaceData => {
            const surface = new Surface(
                surfaceData.x,
                surfaceData.y,
                surfaceData.width,
                surfaceData.angle,
                surfaceData.locked,
                this.world
            );
            this.surfaces.push(surface);
        });

        // Create targets with slight randomization
        level.targets.forEach(targetData => {
            // Add random offset: +/- 30 pixels in each direction
            const randomX = targetData.x + (Math.random() - 0.5) * 60;
            const randomY = targetData.y + (Math.random() - 0.5) * 60;
            const target = new Target(randomX, randomY);
            this.targets.push(target);
        });

        // Reset state
        this.currentState = this.states.MENU;
        this.attempts = 0;
    }

    clearLevel() {
        // Remove ball
        if (this.ball) {
            Matter.World.remove(this.world, this.ball.body);
            this.ball = null;
        }

        // Remove surfaces
        this.surfaces.forEach(surface => {
            Matter.World.remove(this.world, surface.body);
        });
        this.surfaces = [];
        this.selectedSurfaceIndex = -1;

        // Clear targets
        this.targets = [];
    }

    selectNextSurface() {
        const movableSurfaces = this.surfaces.filter(s => !s.locked);
        if (movableSurfaces.length === 0) return;

        // Deselect current
        if (this.selectedSurfaceIndex >= 0 && this.selectedSurfaceIndex < this.surfaces.length) {
            this.surfaces[this.selectedSurfaceIndex].selected = false;
        }

        // Find next movable surface
        let nextIndex = this.selectedSurfaceIndex + 1;
        while (nextIndex < this.surfaces.length && this.surfaces[nextIndex].locked) {
            nextIndex++;
        }

        // Wrap around
        if (nextIndex >= this.surfaces.length) {
            nextIndex = this.surfaces.findIndex(s => !s.locked);
        }

        this.selectedSurfaceIndex = nextIndex;
        if (this.selectedSurfaceIndex >= 0) {
            this.surfaces[this.selectedSurfaceIndex].selected = true;
        }
    }

    rotateSelectedSurface(degrees) {
        if (this.selectedSurfaceIndex >= 0 && this.selectedSurfaceIndex < this.surfaces.length) {
            this.surfaces[this.selectedSurfaceIndex].rotate(degrees);
        }
    }

    moveSelectedSurface(dx, dy) {
        if (this.selectedSurfaceIndex >= 0 && this.selectedSurfaceIndex < this.surfaces.length) {
            this.surfaces[this.selectedSurfaceIndex].move(dx, dy);
        }
    }

    toggleHelp() {
        this.helpOverlay.classList.toggle('hidden');
    }

    hideHelp() {
        this.helpOverlay.classList.add('hidden');
    }

    toggleHints() {
        this.showHints = !this.showHints;
        // Update button text
        this.hintButton.textContent = this.showHints ? 'Hide Hint (?)' : 'Show Hint (?)';
    }

    startPlay() {
        if (this.currentState === this.states.REPLAY) {
            // Exit replay mode
            this.stopReplay();
            return;
        }

        if (this.currentState === this.states.MENU) {
            this.ball.activate();
            this.currentState = this.states.PLAYING;
            this.attempts++;
            this.playButton.textContent = 'Playing...';
            this.playButton.disabled = true;

            // Start recording for replay
            this.replayData = [];
            this.collisionData = [];
            this.isRecording = true;
            this.replayButton.style.display = 'none';
        }
    }

    restart() {
        const level = getLevel(this.currentLevel);
        this.ball.reset(level.ballStart.x, level.ballStart.y);
        this.currentState = this.states.MENU;
        this.playButton.textContent = 'Play';
        this.playButton.disabled = false;
        this.isRecording = false;

        // Show replay button if we have data
        console.log('Restart: replay data length =', this.replayData.length);
        if (this.replayData.length > 0) {
            this.replayButton.style.display = 'block';
            console.log('Replay button shown');
        }

        // Reset targets
        this.targets.forEach(target => {
            target.collected = false;
            target.particles = [];
        });
    }

    dropBall() {
        // Only works if ball is active
        if (this.currentState !== this.states.PLAYING) return;

        const level = getLevel(this.currentLevel);
        this.ball.reset(level.ballStart.x, level.ballStart.y);
        this.ball.activate();
        this.attempts++;

        // Continue recording - clear previous data
        this.replayData = [];
        this.collisionData = [];
    }

    startReplay() {
        if (this.replayData.length === 0) return;

        this.currentState = this.states.REPLAY;
        this.replayIndex = 0;
        this.playButton.textContent = 'Exit Replay';
        this.playButton.disabled = false;
        this.replayButton.style.display = 'none';

        // Reset ball to start
        const level = getLevel(this.currentLevel);
        this.ball.reset(level.ballStart.x, level.ballStart.y);
    }

    stopReplay() {
        this.currentState = this.states.MENU;
        this.playButton.textContent = 'Play';
        this.replayButton.style.display = 'block';

        const level = getLevel(this.currentLevel);
        this.ball.reset(level.ballStart.x, level.ballStart.y);
    }

    nextLevel() {
        if (this.currentLevel < getTotalLevels()) {
            this.currentLevel++;
            this.loadLevel(this.currentLevel);
        } else {
            // Game completed!
            this.showGameComplete();
        }
    }

    checkWinCondition() {
        if (this.currentState !== this.states.PLAYING) return;

        const allCollected = this.targets.every(target => target.collected);
        if (allCollected && this.targets.length > 0) {
            this.currentState = this.states.WON;
            setTimeout(() => {
                this.showVictory();
            }, 500);
        }
    }

    showVictory() {
        this.victoryMessage.textContent = `Attempts: ${this.attempts}`;
        this.victoryOverlay.classList.remove('hidden');
        this.isRecording = false;

        console.log('Victory! Replay data length:', this.replayData.length);

        // Show replay button for completed level
        if (this.replayData.length > 0) {
            this.replayButton.style.display = 'block';
            console.log('Replay button should now be visible');
        }

        // Auto-advance to next level after 3 seconds
        // Replay button stays visible even after overlay closes
        setTimeout(() => {
            this.victoryOverlay.classList.add('hidden');
        }, 2000);

        // Hide replay button and advance after 5 seconds total
        setTimeout(() => {
            this.replayButton.style.display = 'none';
            this.nextLevel();
        }, 5000);
    }

    showGameComplete() {
        this.victoryMessage.textContent = `All ${getTotalLevels()} levels complete!`;
        this.victoryOverlay.querySelector('h1').textContent = '🏆 Congratulations!';
        this.victoryOverlay.querySelector('.victory-footer').textContent = 'You beat the game!';
        this.victoryOverlay.classList.remove('hidden');
    }

    update(deltaTime) {
        if (this.currentState === this.states.REPLAY) {
            // Replay mode - just advance through recorded data
            this.replayIndex += this.replaySpeed;
            return;
        }

        // Update physics with fixed timestep (16.67ms = 60Hz)
        // This prevents tunneling issues
        const fixedTimeStep = 1000 / 60;
        Matter.Engine.update(this.engine, fixedTimeStep);

        // Record ball state if recording
        if (this.isRecording && this.ball && this.ball.isActive) {
            const velocity = this.ball.body.velocity;
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

            this.replayData.push({
                x: this.ball.body.position.x,
                y: this.ball.body.position.y,
                vx: velocity.x,
                vy: velocity.y,
                speed: speed,
                timestamp: Date.now()
            });
        }

        // Update entities
        if (this.ball) {
            this.ball.update(deltaTime);
        }

        this.targets.forEach(target => {
            target.update(deltaTime);
            if (this.ball) {
                target.checkCollection(this.ball);
            }
        });

        this.surfaces.forEach(surface => {
            surface.handleMouseMove(this.mousePos.x, this.mousePos.y);
        });

        // Update UI
        this.updateUI();

        // Check win condition
        this.checkWinCondition();
    }

    handleCollisions(pairs) {
        if (!this.isRecording || !this.ball) return;

        pairs.forEach(pair => {
            // Check if ball collided with a surface
            const ballBody = this.ball.body;
            const isBallCollision = pair.bodyA === ballBody || pair.bodyB === ballBody;

            if (!isBallCollision) return;

            // Find which body is the surface
            const otherBody = pair.bodyA === ballBody ? pair.bodyB : pair.bodyA;

            // Find the surface object
            const surface = this.surfaces.find(s => s.body === otherBody);
            if (!surface) return; // Only record surface collisions, not walls

            // Get collision point
            const collision = pair.collision;
            const contactPoint = collision.supports[0] || { x: ballBody.position.x, y: ballBody.position.y };

            // Calculate normal vector (perpendicular to surface)
            const normal = collision.normal;

            // Get velocities before and after
            const velocityBefore = { x: ballBody.velocity.x, y: ballBody.velocity.y };

            // Calculate impact force magnitude (approximation based on velocity change)
            const impactSpeed = Math.sqrt(velocityBefore.x * velocityBefore.x + velocityBefore.y * velocityBefore.y);

            // Store collision data
            this.collisionData.push({
                x: contactPoint.x,
                y: contactPoint.y,
                normalX: normal.x,
                normalY: normal.y,
                velocityBeforeX: velocityBefore.x,
                velocityBeforeY: velocityBefore.y,
                impactSpeed: impactSpeed,
                surfaceAngle: surface.body.angle * (180 / Math.PI), // Convert to degrees
                timestamp: Date.now()
            });
        });
    }

    updateUI() {
        if (this.ball) {
            const ratio = this.ball.getElasticityRatio();
            this.elasticityFill.style.width = `${ratio * 100}%`;
            this.elasticityFill.style.background = this.ball.color;
        }
    }

    render() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render surfaces (show angles in replay mode or if toggled on)
        const isReplay = this.currentState === this.states.REPLAY;
        const displayAngles = isReplay || this.showAngles;
        this.surfaces.forEach(surface => surface.render(this.ctx, displayAngles));

        // Render targets
        this.targets.forEach(target => target.render(this.ctx));

        // Show angle toggle indicator
        if (this.showAngles && !isReplay) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, this.canvas.height - 50, 150, 40);
            this.ctx.fillStyle = '#FFE66D';
            this.ctx.font = 'bold 14px sans-serif';
            this.ctx.fillText('Angles: ON (V)', 20, this.canvas.height - 25);
        }

        // Render hint surfaces
        if (this.showHints && !isReplay) {
            this.renderHints();
        }

        // Render replay mode
        if (this.currentState === this.states.REPLAY) {
            this.renderReplay();
        } else {
            // Render ball normally
            if (this.ball) {
                this.ball.render(this.ctx);
            }
        }
    }

    renderHints() {
        const level = getLevel(this.currentLevel);
        if (!level || !level.solution) return;

        const ctx = this.ctx;

        // Draw hint indicator
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, this.canvas.height - 100, 180, 40);
        ctx.fillStyle = '#4ECDC4';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('💡 Solution Hint (? )', 20, this.canvas.height - 75);

        // Draw ghost surfaces at solution positions
        level.solution.forEach(solutionSurface => {
            const angleRad = (solutionSurface.angle * Math.PI) / 180;
            const halfWidth = solutionSurface.width / 2;

            const x1 = solutionSurface.x - Math.cos(angleRad) * halfWidth;
            const y1 = solutionSurface.y - Math.sin(angleRad) * halfWidth;
            const x2 = solutionSurface.x + Math.cos(angleRad) * halfWidth;
            const y2 = solutionSurface.y + Math.sin(angleRad) * halfWidth;

            // Draw ghost surface with dashed line
            ctx.save();
            ctx.strokeStyle = '#4ECDC4';
            ctx.lineWidth = 20;
            ctx.globalAlpha = 0.4;
            ctx.setLineDash([10, 10]);
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Draw center point
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#4ECDC4';
            ctx.beginPath();
            ctx.arc(solutionSurface.x, solutionSurface.y, 6, 0, Math.PI * 2);
            ctx.fill();

            // Draw angle label
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(solutionSurface.x - 30, solutionSurface.y - 35, 60, 22);
            ctx.fillStyle = '#4ECDC4';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${solutionSurface.angle.toFixed(0)}°`, solutionSurface.x, solutionSurface.y - 18);

            ctx.restore();
        });

        ctx.textAlign = 'left';
    }

    renderReplay() {
        if (this.replayData.length === 0) return;

        const ctx = this.ctx;
        const currentIndex = Math.floor(this.replayIndex);

        // Draw full path as a trail
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < this.replayData.length; i++) {
            const point = this.replayData[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();

        // Draw collision/impact points with force vectors
        this.collisionData.forEach((collision, index) => {
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
        for (let i = 0; i < Math.min(currentIndex, this.replayData.length); i += 10) {
            const point = this.replayData[i];
            this.drawVelocityVector(ctx, point.x, point.y, point.vx, point.vy, point.speed);
        }

        // Draw current position with larger vector
        if (currentIndex < this.replayData.length) {
            const current = this.replayData[currentIndex];

            // Draw ball at current position
            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath();
            ctx.arc(current.x, current.y, 20, 0, Math.PI * 2);
            ctx.fill();

            // Draw velocity vector
            this.drawVelocityVector(ctx, current.x, current.y, current.vx, current.vy, current.speed, true);
        }

        // If replay finished, loop or stop
        if (currentIndex >= this.replayData.length) {
            this.replayIndex = 0; // Loop
        }

        // Draw replay UI with legend
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, 10, 280, 140);

        // Progress
        ctx.fillStyle = 'white';
        ctx.font = '16px sans-serif';
        ctx.fillText(`Replay: ${Math.floor((currentIndex / this.replayData.length) * 100)}%`, 20, 30);
        ctx.font = '12px sans-serif';
        ctx.fillText(`Impacts recorded: ${this.collisionData.length}`, 20, 50);

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

    // Input handling
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.isMouseDown = true;
        this.isRightClick = e.button === 2;
        this.mousePos = { x, y };

        // Check surface interactions
        for (const surface of this.surfaces) {
            if (surface.handleMouseDown(x, y, this.isRightClick)) {
                this.canvas.classList.add('dragging');
                break;
            }
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    handleMouseUp(e) {
        this.isMouseDown = false;
        this.canvas.classList.remove('dragging');

        this.surfaces.forEach(surface => surface.handleMouseUp());
    }

    handleTouchStart(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();

        for (const touch of e.changedTouches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.touches.set(touch.identifier, { x, y });

            // Check surface interactions
            for (const surface of this.surfaces) {
                if (surface.handleTouchStart(x, y)) {
                    break;
                }
            }
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();

        for (const touch of e.changedTouches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.touches.set(touch.identifier, { x, y });
            this.mousePos = { x, y };

            this.surfaces.forEach(surface => surface.handleTouchMove(x, y));
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            this.touches.delete(touch.identifier);
        }

        this.surfaces.forEach(surface => surface.handleTouchEnd());
    }

    // Main game loop
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    stop() {
        this.isRunning = false;
    }

    // Handle canvas resize
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;

        // Recreate walls with new dimensions
        Matter.World.remove(this.world, this.walls);
        const wallOptions = { isStatic: true, friction: 0, restitution: 0.99 };
        this.walls = [
            Matter.Bodies.rectangle(width / 2, -25, width, 50, wallOptions),
            Matter.Bodies.rectangle(width / 2, height + 25, width, 50, wallOptions),
            Matter.Bodies.rectangle(-25, height / 2, 50, height, wallOptions),
            Matter.Bodies.rectangle(width + 25, height / 2, 50, height, wallOptions)
        ];
        Matter.World.add(this.world, this.walls);
    }
}
