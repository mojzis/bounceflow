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
            WON: 'won'
        };
        this.currentState = this.states.MENU;
        this.currentLevel = 1;
        this.attempts = 0;

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
        this.restartButton = document.getElementById('restartButton');
        this.levelNumber = document.getElementById('level-number');
        this.hintText = document.getElementById('hint-text');
        this.elasticityFill = document.getElementById('elasticity-fill');

        // Button handlers
        this.playButton.addEventListener('click', () => this.startPlay());
        this.restartButton.addEventListener('click', () => this.restart());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                this.restart();
            } else if (e.key === ' ' && this.currentState === this.states.MENU) {
                this.startPlay();
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

        // Create targets
        level.targets.forEach(targetData => {
            const target = new Target(targetData.x, targetData.y);
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

    startPlay() {
        if (this.currentState === this.states.MENU) {
            this.ball.activate();
            this.currentState = this.states.PLAYING;
            this.attempts++;
            this.playButton.textContent = 'Playing...';
            this.playButton.disabled = true;
        }
    }

    restart() {
        const level = getLevel(this.currentLevel);
        this.ball.reset(level.ballStart.x, level.ballStart.y);
        this.currentState = this.states.MENU;
        this.playButton.textContent = 'Play';
        this.playButton.disabled = false;

        // Reset targets
        this.targets.forEach(target => {
            target.collected = false;
            target.particles = [];
        });
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
        alert(`Level ${this.currentLevel} Complete!\n\nAttempts: ${this.attempts}\n\nPress OK for next level`);
        this.nextLevel();
    }

    showGameComplete() {
        alert('Congratulations! You completed all levels!');
    }

    update(deltaTime) {
        // Update physics with fixed timestep (16.67ms = 60Hz)
        // This prevents tunneling issues
        const fixedTimeStep = 1000 / 60;
        Matter.Engine.update(this.engine, fixedTimeStep);

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

        // Render ball
        if (this.ball) {
            this.ball.render(this.ctx);
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
