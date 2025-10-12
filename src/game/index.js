/**
 * Game - Main orchestrator class for BounceFlow
 *
 * Architecture:
 * This class acts as the central coordinator, delegating responsibilities to specialized managers:
 * - PhysicsManager: Matter.js engine, collision detection
 * - InputManager: Mouse, touch, keyboard input
 * - SolverSystem: AI level solver with simulated annealing
 * - RenderingSystem: All rendering including hook, hints, replay
 * - UIManager: DOM elements, buttons, keyboard shortcuts
 * - LevelManager: Level loading, progression, entity creation
 *
 * Responsibilities:
 * - Manage game state (MENU, PLAYING, PAUSED, WON, REPLAY)
 * - Orchestrate main game loop (update → render cycle)
 * - Coordinate between managers (e.g., input → physics → render)
 * - Handle game flow (play, restart, victory, replay)
 * - Track scoring and timing
 * - Manage game entities (ball, surfaces, targets, bird)
 *
 * Public API:
 * - start(): Begin game loop
 * - stop(): Stop game loop
 * - update(deltaTime): Update game state and entities
 * - render(): Render current frame
 * - resize(width, height): Handle canvas resize
 *
 * Game States:
 * - MENU: Ball on hook, surfaces adjustable
 * - PLAYING: Ball active, physics running
 * - PAUSED: Not currently used
 * - WON: Level complete, showing victory screen
 * - REPLAY: Playing back recorded ball trajectory
 *
 * Note: This file is now ~750 lines (down from 2220), with most logic
 * delegated to specialized managers in the game/ directory.
 */

import * as Matter from 'matter-js';
import { Ball } from '../ball.js';
import { Surface } from '../surface.js';
import { Target } from '../target.js';
import { Bird } from '../bird.js';
import { getLevel, getTotalLevels } from '../levels.js';
import { PhysicsManager } from './PhysicsManager.js';
import { InputManager } from './InputManager.js';
import { SolverSystem } from './SolverSystem.js';
import { RenderingSystem } from './RenderingSystem.js';
import { UIManager } from './UIManager.js';
import { LevelManager } from './LevelManager.js';
import { StateController } from './StateController.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // State management
        this.stateController = new StateController(this);

        // DEPRECATED: Keep for backward compatibility
        this.states = {
            MENU: 'MENU',
            PLAYING: 'PLAYING',
            PAUSED: 'PAUSED',
            WON: 'WON',
            REPLAY: 'REPLAY'
        };

        // Getter that reads from StateController
        Object.defineProperty(this, 'currentState', {
            get: () => this.stateController.state,
            configurable: true
        });
        this.currentLevel = 1;
        this.attempts = 0;
        this.showAngles = false; // Toggle for showing surface angles
        this.showHints = false; // Toggle for showing solution hints
        this.debugMode = false; // Debug mode: show solver + replay together

        // Scoring system
        this.levelStartTime = 0;
        this.levelTime = 0; // Time in seconds
        this.usedSolver = false; // Track if player used solver
        this.currentScore = 0;

        // Hook animation
        this.hookReleasing = false;
        this.hookReleaseProgress = 0;
        this.hookSwayOffset = 0;

        // Solver system
        this.solver = new SolverSystem(this);
        // Keep backward compatibility properties
        this.solverMode = 'explore'; // 'explore' or 'refine'
        this.solverUserConfig = null; // Stores user's config for refine mode

        // Replay recording
        this.isRecording = false;
        this.replayData = [];
        this.collisionData = []; // Store collision/impact data
        this.replayIndex = 0;
        this.replaySpeed = 1;

        // Victory screen timers (need to be cleared when entering replay)
        this.victoryHideTimer = null;
        this.victoryAdvanceTimer = null;

        // Bird obstacle
        this.bird = null;
        this.birdSpawnTimer = 0;
        this.birdSpawnInterval = 5000 + Math.random() * 5000; // Random 5-10 seconds

        // Physics setup
        this.setupPhysics();

        // Game entities
        this.ball = null;
        this.surfaces = [];
        this.targets = [];
        this.selectedSurfaceIndex = -1; // For keyboard control

        // Input handling
        this.input = new InputManager(this);

        // Rendering system
        this.renderer = new RenderingSystem(this);

        // UI elements
        this.ui = new UIManager(this);
        // Keep references for backward compatibility
        this.playButton = this.ui.playButton;
        this.dropButton = this.ui.dropButton;
        this.restartButton = this.ui.restartButton;
        this.levelDisplay = this.ui.levelDisplay;
        this.levelName = this.ui.levelName;
        this.hintText = this.ui.hintText;
        this.elasticityFill = this.ui.elasticityFill;
        this.helpOverlay = this.ui.helpOverlay;
        this.helpButton = this.ui.helpButton;
        this.hintButton = this.ui.hintButton;
        this.refineButton = this.ui.refineButton;
        this.closeHelpButton = this.ui.closeHelpButton;
        this.victoryOverlay = this.ui.victoryOverlay;
        this.victoryMessage = this.ui.victoryMessage;
        this.replayButton = this.ui.replayButton;
        this.scoreTime = this.ui.scoreTime;
        this.scoreAttempts = this.ui.scoreAttempts;
        this.scorePoints = this.ui.scorePoints;

        // Level management
        this.levelManager = new LevelManager(this);

        // Load first level
        this.loadLevel(this.currentLevel);

        // Animation
        this.lastTime = performance.now();
        this.isRunning = false;
    }

    setupPhysics() {
        this.physics = new PhysicsManager(this.canvas);
        this.engine = this.physics.engine;
        this.world = this.physics.world;
        this.walls = this.physics.walls;

        // Register collision handler
        this.physics.onCollision((pairs) => this.handleCollisions(pairs));
    }

    loadLevel(levelId) {
        this.levelManager.loadLevel(levelId);
    }

    clearLevel() {
        this.levelManager.clearLevel();
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
        if (!this.solver.running) {
            // Reset to explore mode (in case refine was used before)
            this.solverMode = 'explore';
            this.solverUserConfig = null;
            // Start the solver
            this.startSolver();
        } else {
            // Stop the solver
            this.stopSolver();
        }
    }

    startSolver() {
        // Mark that solver was used (affects scoring)
        this.usedSolver = true;

        // Start solver with current mode and config
        this.solver.start(this.solverMode, this.solverUserConfig);

        // Update UI
        this.updateSolverUI();
    }

    stopSolver() {
        this.solver.stop();
        this.updateSolverUI();
    }

    updateSolverUI() {
        if (this.solverMode === 'refine') {
            if (this.solver.running) {
                this.hintButton.textContent = 'Solving...';
                this.refineButton.textContent = 'Refining...';
                this.refineButton.disabled = true;
                this.hintButton.disabled = true;
            } else if (this.solver.foundSolution) {
                this.refineButton.textContent = `Solution Found! (${this.solver.currentAttempt} attempts)`;
                this.refineButton.disabled = false;
                this.showHints = true;
            } else {
                this.refineButton.textContent = `Best Try (${this.solver.currentAttempt} attempts)`;
                this.refineButton.disabled = false;
                this.showHints = true;
            }
        } else {
            if (this.solver.running) {
                this.hintButton.textContent = 'Solving...';
                this.hintButton.disabled = true;
                this.refineButton.disabled = true;
            } else if (this.solver.foundSolution) {
                this.hintButton.textContent = `Solution Found! (${this.solver.currentAttempt} attempts)`;
                this.hintButton.disabled = false;
                this.showHints = true;
            } else {
                this.hintButton.textContent = `Best Try (${this.solver.currentAttempt} attempts)`;
                this.hintButton.disabled = false;
                this.showHints = true;
            }
        }
    }

    startRefineSolver() {
        console.log('🔧 Starting refine solver...');

        // Capture user's current surface configuration
        this.solverUserConfig = this.surfaces.map(s => ({
            x: s.body.position.x,
            y: s.body.position.y,
            width: s.width,
            angle: s.body.angle * (180 / Math.PI), // Convert to degrees
            locked: s.locked
        }));

        console.log('Captured user config:', this.solverUserConfig);

        // Set mode to refine
        this.solverMode = 'refine';

        // Start the solver (which will use the user config)
        this.startSolver();
    }


    startPlay() {
        if (this.currentState === this.states.REPLAY) {
            // Exit replay mode
            this.stopReplay();
            return;
        }

        if (this.currentState === this.states.MENU) {
            // Start hook release animation
            this.hookReleasing = true;
            this.hookReleaseProgress = 0;

            // Calculate hook swing velocity to transfer to ball
            const hasSwinging = this.currentLevel >= 4;
            const swayVelocity = hasSwinging ? Math.cos(Date.now() / 800) * 12.5 : 0;

            // Delay ball activation for hook animation
            setTimeout(() => {
                try {
                    this.ball.activate();

                    // Transfer swing momentum to ball
                    Matter.Body.setVelocity(this.ball.body, {
                        x: swayVelocity * 0.15,
                        y: 0
                    });

                    // Use StateController for transition
                    this.stateController.transitionTo('PLAYING');
                    this.hookReleasing = false;

                } catch (error) {
                    console.error('Failed to start playing:', error);
                    this.stateController.recover();
                }
            }, 300);

            this.attempts++;

            // Start time tracking on first attempt
            if (this.attempts === 1) {
                this.levelStartTime = Date.now();
            }
        }
    }

    restart() {
        const level = getLevel(this.currentLevel);
        if (this.ball && level) {
            this.ball.reset(level.ballStart.x, level.ballStart.y);
        }

        // StateController handles cleanup
        this.stateController.transitionTo('MENU');

        // Reset targets
        this.targets.forEach(target => {
            target.collected = false;
            target.particles = [];
        });

        // Reset bird
        if (this.bird) {
            this.bird.active = false;
            this.birdSpawnTimer = 0;
            this.birdSpawnInterval = 5000 + Math.random() * 5000;
        }

        // Show replay button if we have data
        if (this.replayData.length > 0) {
            this.replayButton.style.display = 'block';
        }
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
        if (this.replayData.length === 0) {
            console.warn('Cannot start replay: no replay data available');
            return;
        }

        // Ensure we're not in a bad state
        if (this.currentState === this.states.PLAYING) {
            console.log('Stopping active game before replay');
            this.restart();
        }

        // StateController handles cleanup including victory timers
        this.stateController.transitionTo('REPLAY');

        // Reset ball to start
        const level = getLevel(this.currentLevel);
        if (this.ball && level) {
            this.ball.reset(level.ballStart.x, level.ballStart.y);
        }
    }

    stopReplay() {
        console.log('Stopping replay, returning to MENU');

        // StateController handles transition
        this.stateController.transitionTo('MENU');

        const level = getLevel(this.currentLevel);
        if (this.ball && level) {
            this.ball.reset(level.ballStart.x, level.ballStart.y);
        }
    }

    nextLevel() {
        this.levelManager.nextLevel();
    }

    checkWinCondition() {
        if (this.currentState !== this.states.PLAYING) return;

        const allCollected = this.targets.every(target => target.collected);
        if (allCollected && this.targets.length > 0) {
            // Use StateController for transition
            this.stateController.transitionTo('WON');

            // Calculate final time
            if (this.levelStartTime > 0) {
                this.levelTime = (Date.now() - this.levelStartTime) / 1000;
            }

            // Calculate score
            this.currentScore = this.calculateScore();

            setTimeout(() => {
                this.showVictory();
            }, 500);
        }
    }

    calculateScore() {
        // No score if solver was used
        if (this.usedSolver) {
            return 0;
        }

        // Base score: 1000 points
        let score = 1000;

        // Penalty for time: -10 points per second (max penalty 500)
        const timePenalty = Math.min(this.levelTime * 10, 500);
        score -= timePenalty;

        // Penalty for attempts: -100 points per extra attempt beyond first
        const attemptPenalty = (this.attempts - 1) * 100;
        score -= attemptPenalty;

        // Minimum score is 0
        return Math.max(0, Math.round(score));
    }

    showVictory() {
        if (this.usedSolver) {
            this.victoryMessage.textContent = `Time: ${this.levelTime.toFixed(1)}s | Attempts: ${this.attempts} | Score: N/A (Used Hint)`;
        } else {
            this.victoryMessage.textContent = `Time: ${this.levelTime.toFixed(1)}s | Attempts: ${this.attempts} | Score: ${this.currentScore}`;
        }
        this.victoryOverlay.classList.remove('hidden');
        this.isRecording = false;

        console.log('Victory! Replay data length:', this.replayData.length);

        // Show replay button for completed level
        if (this.replayData.length > 0) {
            this.replayButton.style.display = 'block';
            console.log('Replay button should now be visible');
        }

        // Clear any existing timers to prevent double-advance
        if (this.victoryHideTimer) clearTimeout(this.victoryHideTimer);
        if (this.victoryAdvanceTimer) clearTimeout(this.victoryAdvanceTimer);

        // Auto-advance to next level after 3 seconds
        // Replay button stays visible even after overlay closes
        this.victoryHideTimer = setTimeout(() => {
            this.victoryOverlay.classList.add('hidden');
        }, 2000);

        // Hide replay button and advance after 5 seconds total
        this.victoryAdvanceTimer = setTimeout(() => {
            this.replayButton.style.display = 'none';
            this.nextLevel();
        }, 5000);
    }

    showGameComplete() {
        this.levelManager.showGameComplete();
    }

    update(deltaTime) {
        if (this.currentState === this.states.REPLAY) {
            // Replay mode - just advance through recorded data
            this.replayIndex += this.replaySpeed;
            return;
        }

        // Safety check: verify ball is in valid state before physics update
        if (this.ball && this.ball.isActive) {
            const pos = this.ball.body.position;
            const vel = this.ball.body.velocity;
            if (!isFinite(pos.x) || !isFinite(pos.y) || !isFinite(vel.x) || !isFinite(vel.y)) {
                console.error('⚠️ Detected corrupted ball in update loop - forcing restart');
                this.restart();
                return;
            }
        }

        // Update physics with fixed timestep (16.67ms = 60Hz)
        // This prevents tunneling issues
        this.physics.update(deltaTime);

        // Record ball state if recording
        if (this.isRecording && this.ball && this.ball.isActive) {
            const velocity = this.ball.body.velocity;
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

            // Double-check validity before recording
            if (isFinite(velocity.x) && isFinite(velocity.y)) {
                this.replayData.push({
                    x: this.ball.body.position.x,
                    y: this.ball.body.position.y,
                    vx: velocity.x,
                    vy: velocity.y,
                    speed: speed,
                    timestamp: Date.now()
                });
            }
        }

        // Update hook animation
        if (this.hookReleasing) {
            this.hookReleaseProgress += deltaTime / 300; // 300ms animation
            if (this.hookReleaseProgress > 1) {
                this.hookReleaseProgress = 1;
            }
        }

        // Update hook sway (idle animation)
        // Introduce swinging mechanic starting from level 4
        if (this.currentState === this.states.MENU && this.currentLevel >= 4) {
            this.hookSwayOffset = Math.sin(Date.now() / 800) * 10; // Gentle sway

            // Move ball with the hook sway
            if (this.ball) {
                const level = getLevel(this.currentLevel);
                const swayX = level.ballStart.x + this.hookSwayOffset;
                Matter.Body.setPosition(this.ball.body, {
                    x: swayX,
                    y: level.ballStart.y
                });
            }
        } else if (this.currentState === this.states.MENU) {
            // Keep ball and hook static for early levels
            this.hookSwayOffset = 0;
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
            surface.handleMouseMove(this.input.mousePos.x, this.input.mousePos.y);
        });

        // Update bird obstacle
        if (this.bird && this.currentState === this.states.PLAYING) {
            // Update bird spawn timer
            if (!this.bird.active) {
                this.birdSpawnTimer += deltaTime;
                if (this.birdSpawnTimer >= this.birdSpawnInterval) {
                    this.bird.spawn();
                    this.birdSpawnTimer = 0;
                    this.birdSpawnInterval = 5000 + Math.random() * 5000; // Next spawn in 5-10 seconds
                }
            }

            // Update bird position
            this.bird.update(deltaTime);

            // Check collision with ball
            if (this.ball && this.ball.isActive && this.bird.checkCollision(this.ball)) {
                // Bird hit the ball - restart level
                this.restart();
            }
        }

        // Process held keys with acceleration
        this.processHeldKeys();

        // Update UI
        this.updateUI();

        // Show replay button in MENU state if we have replay data
        if (this.currentState === this.states.MENU && this.replayData.length > 0) {
            this.replayButton.style.display = 'block';
        }

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

    processHeldKeys() {
        this.input.processHeldKeys();
    }

    updateUI() {
        this.ui.updateUI();
    }

    calculateLiveScore(currentTime) {
        if (this.usedSolver) {
            return 'N/A';
        }

        let score = 1000;
        const timePenalty = Math.min(currentTime * 10, 500);
        score -= timePenalty;
        const attemptPenalty = (this.attempts - 1) * 100;
        score -= attemptPenalty;

        return Math.max(0, Math.round(score));
    }

    render() {
        this.renderer.render();
    }

    // Input handling - delegate to InputManager
    handleMouseDown(e) {
        this.input.handleMouseDown(e);
    }

    handleMouseMove(e) {
        this.input.handleMouseMove(e);
    }

    handleMouseUp(e) {
        this.input.handleMouseUp(e);
    }

    handleTouchStart(e) {
        this.input.handleTouchStart(e);
    }

    handleTouchMove(e) {
        this.input.handleTouchMove(e);
    }

    handleTouchEnd(e) {
        this.input.handleTouchEnd(e);
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
        this.physics.resize(width, height);
        this.walls = this.physics.walls;
    }
}
