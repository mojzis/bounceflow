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

        // Replay recording
        this.isRecording = false;
        this.replayData = [];
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
        this.closeHelpButton = document.getElementById('close-help');
        this.victoryOverlay = document.getElementById('victory-overlay');
        this.victoryMessage = document.getElementById('victory-message');
        this.replayButton = document.getElementById('replayButton');

        // Button handlers
        this.playButton.addEventListener('click', () => this.startPlay());
        this.dropButton.addEventListener('click', () => this.dropBall());
        this.restartButton.addEventListener('click', () => this.restart());
        this.replayButton.addEventListener('click', () => this.startReplay());
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

    startPlay() {
        if (this.currentState === this.states.MENU) {
            this.ball.activate();
            this.currentState = this.states.PLAYING;
            this.attempts++;
            this.playButton.textContent = 'Playing...';
            this.playButton.disabled = true;

            // Start recording for replay
            this.replayData = [];
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
        if (this.replayData.length > 0) {
            this.replayButton.style.display = 'block';
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

        // Continue recording
        this.replayData = [];
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

        // Auto-advance to next level after 2 seconds
        setTimeout(() => {
            this.victoryOverlay.classList.add('hidden');
            this.nextLevel();
        }, 2000);
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

        // Render surfaces
        this.surfaces.forEach(surface => surface.render(this.ctx));

        // Render targets
        this.targets.forEach(target => target.render(this.ctx));

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

        // Draw replay UI
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 40);
        ctx.fillStyle = 'white';
        ctx.font = '16px sans-serif';
        ctx.fillText(`Replay: ${Math.floor((currentIndex / this.replayData.length) * 100)}%`, 20, 35);
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
