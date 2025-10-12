/**
 * Main game class for BounceFlow
 */

import * as Matter from 'matter-js';
import { Ball } from './ball.js';
import { Surface } from './surface.js';
import { Target } from './target.js';
import { Bird } from './bird.js';
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

        // Solver state
        this.solverRunning = false;
        this.solverAttempts = [];
        this.solverBestConfig = null;
        this.solverBestDistance = Infinity;
        this.solverCurrentAttempt = 0;
        this.solverFoundSolution = false;
        this.solverTemperature = 1.0; // 1.0 = hot (wild exploration), 0.0 = cold (precise)
        this.solverErrorVectors = []; // Track failed attempt directions for learning
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
        this.mousePos = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.isRightClick = false;
        this.touches = new Map();

        // Keyboard acceleration for surface control
        this.heldKeys = new Set();
        this.keyHoldDuration = new Map(); // Track how long each key has been held

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
        this.levelDisplay = document.getElementById('level-display');
        this.levelName = document.getElementById('level-name');
        this.hintText = document.getElementById('hint-text');
        this.elasticityFill = document.getElementById('elasticity-fill');
        this.helpOverlay = document.getElementById('help-overlay');
        this.helpButton = document.getElementById('helpButton');
        this.hintButton = document.getElementById('hintButton');
        this.refineButton = document.getElementById('refineButton');
        this.closeHelpButton = document.getElementById('close-help');
        this.victoryOverlay = document.getElementById('victory-overlay');
        this.victoryMessage = document.getElementById('victory-message');
        this.replayButton = document.getElementById('replayButton');
        this.scoreTime = document.getElementById('score-time');
        this.scoreAttempts = document.getElementById('score-attempts');
        this.scorePoints = document.getElementById('score-points');

        // Button handlers
        this.playButton.addEventListener('click', () => this.startPlay());
        this.dropButton.addEventListener('click', () => this.dropBall());
        this.restartButton.addEventListener('click', () => this.restart());
        this.replayButton.addEventListener('click', () => this.startReplay());
        this.hintButton.addEventListener('click', () => this.toggleHints());
        this.refineButton.addEventListener('click', () => this.startRefineSolver());
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

            // Prevent key repeat for held keys - only start tracking on first press
            const isMovementKey = ['w', 'W', 'a', 'A', 's', 'S', 'd', 'D', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'q', 'Q', 'e', 'E'].includes(e.key);

            if (isMovementKey) {
                if (!e.repeat && !this.heldKeys.has(e.key)) {
                    // Start tracking this key
                    this.heldKeys.add(e.key);
                    this.keyHoldDuration.set(e.key, { startTime: Date.now(), shiftKey: e.shiftKey });
                }
                e.preventDefault();
                return;
            }

            // Non-movement keys: process immediately
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
            } else if (e.key === 'v' || e.key === 'V') {
                // Toggle angle display
                this.showAngles = !this.showAngles;
                e.preventDefault();
            } else if (e.key === '?' || e.key === '/') {
                // Toggle solver (same as clicking button)
                this.toggleHints();
                e.preventDefault();
            } else if (e.key === 'b' || e.key === 'B') {
                // Toggle debug mode
                this.debugMode = !this.debugMode;
                console.log('Debug mode:', this.debugMode ? 'ON' : 'OFF');
                e.preventDefault();
            }
        });

        // Keyup handler to clear held keys
        document.addEventListener('keyup', (e) => {
            if (this.heldKeys.has(e.key)) {
                this.heldKeys.delete(e.key);
                this.keyHoldDuration.delete(e.key);
            }
        });
    }

    loadLevel(levelId) {
        const level = getLevel(levelId);
        if (!level) {
            console.error(`Level ${levelId} not found`);
            return;
        }

        // CRITICAL: Stop any running solver before clearing
        if (this.solverRunning) {
            this.stopSolver();
        }

        // CRITICAL: Clear victory timers when loading new level
        if (this.victoryHideTimer) {
            clearTimeout(this.victoryHideTimer);
            this.victoryHideTimer = null;
        }
        if (this.victoryAdvanceTimer) {
            clearTimeout(this.victoryAdvanceTimer);
            this.victoryAdvanceTimer = null;
        }

        // Clear existing entities
        this.clearLevel();

        // CRITICAL: Clear replay data from previous level
        this.replayData = [];
        this.collisionData = [];
        this.isRecording = false;
        this.replayIndex = 0;
        this.replayButton.style.display = 'none';

        // Clear solver state
        this.solverRunning = false;
        this.solverAttempts = [];
        this.solverBestConfig = null;
        this.solverBestDistance = Infinity;
        this.solverCurrentAttempt = 0;
        this.solverFoundSolution = false;
        this.solverTemperature = 1.0;
        this.solverErrorVectors = [];
        this.solverMode = 'explore';
        this.solverUserConfig = null;
        this.showHints = false;
        this.hintButton.textContent = 'Show Hint (?)';
        this.hintButton.disabled = false;
        this.refineButton.textContent = 'Refine My Setup';
        this.refineButton.disabled = false;

        // Update UI
        this.levelDisplay.textContent = `Level ${levelId}`;
        this.levelName.textContent = level.name;
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

        // Create targets with slight randomization, ensuring they don't overlap
        level.targets.forEach(targetData => {
            const targetRadius = 25; // From target.js
            const minDistance = targetRadius * 2 + 10; // Targets must be at least 60px apart
            const maxAttempts = 10;
            let randomX, randomY, validPosition, attempts = 0;

            do {
                // Add random offset: +/- 30 pixels in each direction
                randomX = targetData.x + (Math.random() - 0.5) * 60;
                randomY = targetData.y + (Math.random() - 0.5) * 60;

                // Check if this position overlaps with existing targets
                validPosition = true;
                for (const existingTarget of this.targets) {
                    const dx = randomX - existingTarget.x;
                    const dy = randomY - existingTarget.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < minDistance) {
                        validPosition = false;
                        break;
                    }
                }

                attempts++;
            } while (!validPosition && attempts < maxAttempts);

            // If we couldn't find a valid position, use base position
            if (!validPosition) {
                randomX = targetData.x;
                randomY = targetData.y;
            }

            const target = new Target(randomX, randomY);
            this.targets.push(target);
        });

        // Create bird obstacle
        this.bird = new Bird(this.canvas.width, this.canvas.height);
        this.birdSpawnTimer = 0;
        this.birdSpawnInterval = 5000 + Math.random() * 5000; // Random 5-10 seconds

        // Reset state
        this.currentState = this.states.MENU;
        this.attempts = 0;

        // Reset scoring for new level
        this.levelStartTime = 0;
        this.levelTime = 0;
        this.usedSolver = false;
        this.currentScore = 0;

        // Reset hook animation
        this.hookReleasing = false;
        this.hookReleaseProgress = 0;
        this.hookSwayOffset = 0;
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
        if (!this.solverRunning) {
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
        console.log('🚀 Starting solver in', this.solverMode, 'mode...');

        // Mark that solver was used (affects scoring)
        this.usedSolver = true;

        // Clear all previous solver state (important for retries)
        this.solverRunning = true;
        this.solverAttempts = [];
        this.solverBestConfig = null;
        this.solverBestDistance = Infinity;
        this.solverCurrentAttempt = 0;
        this.solverFoundSolution = false;
        this.showHints = false; // Clear visualization from previous run
        this.solverErrorVectors = []; // Clear learning from previous run

        // Set initial temperature based on mode
        if (this.solverMode === 'refine') {
            this.solverTemperature = 0.2; // Start cool for refinement
        } else {
            this.solverTemperature = 1.0; // Start hot for exploration
        }

        if (this.solverMode === 'refine') {
            this.hintButton.textContent = 'Solving...';
            this.refineButton.textContent = 'Refining...';
            this.refineButton.disabled = true;
            this.hintButton.disabled = true;
        } else {
            this.hintButton.textContent = 'Solving...';
            this.hintButton.disabled = true;
            this.refineButton.disabled = true;
        }

        console.log('Solver state:', {
            running: this.solverRunning,
            mode: this.solverMode,
            temperature: this.solverTemperature,
            attempts: this.solverAttempts.length,
            currentAttempt: this.solverCurrentAttempt
        });

        // Start solver loop
        this.runSolverStep();
    }

    stopSolver() {
        this.solverRunning = false;
        this.hintButton.textContent = 'Show Hint (?)';
        this.hintButton.disabled = false;
        this.refineButton.textContent = 'Refine My Setup';
        this.refineButton.disabled = false;
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

    runSolverStep() {
        if (!this.solverRunning) return;

        let config, result;
        try {
            const level = getLevel(this.currentLevel);

            // Update temperature (cool down linearly in explore mode)
            const maxAttempts = this.solverMode === 'refine' ? 30 : 50;
            if (this.solverMode === 'explore') {
                this.solverTemperature = 1.0 - (this.solverCurrentAttempt / maxAttempts);
                this.solverTemperature = Math.max(0, this.solverTemperature);
            }

            // Generate a random configuration based on initial setup
            config = this.generateRandomConfig(level);
            console.log('Solver attempt', this.solverCurrentAttempt + 1, 'temp:', this.solverTemperature.toFixed(2), 'config:', config);

            // Simulate physics with this configuration
            result = this.simulateConfiguration(config, level);
            console.log('Result:', result.success ? 'SUCCESS!' : 'failed', 'closest distance:', result.closestDistance.toFixed(1));

            // Store attempt
            this.solverAttempts.push({
                config: config,
                trajectory: result.trajectory,
                success: result.success,
                closestDistance: result.closestDistance,
                collisionData: result.collisionData
            });

            // Track error vector for failed attempts (learning)
            if (!result.success && result.trajectory.length > 0) {
                const ballFinalPos = result.trajectory[result.trajectory.length - 1];

                // Find nearest target
                let nearestTarget = this.targets[0];
                let minDist = Infinity;
                this.targets.forEach(target => {
                    const dx = target.x - ballFinalPos.x;
                    const dy = target.y - ballFinalPos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestTarget = target;
                    }
                });

                // Calculate error vector (direction from ball to target)
                const errorVector = {
                    dx: nearestTarget.x - ballFinalPos.x,
                    dy: nearestTarget.y - ballFinalPos.y,
                    magnitude: minDist
                };
                this.solverErrorVectors.push(errorVector);

                console.log('Error vector:', errorVector.dx.toFixed(1), errorVector.dy.toFixed(1), 'magnitude:', errorVector.magnitude.toFixed(1));
            }

            this.solverCurrentAttempt++;
        } catch (error) {
            console.error('Solver error:', error);
            this.stopSolver();
            this.hintButton.textContent = 'Solver Error';
            alert('Solver encountered an error. Check browser console for details.');
            return;
        }

        // Check if we found a solution
        if (result.success) {
            console.log('✅ SOLUTION FOUND after', this.solverCurrentAttempt, 'attempts!');
            this.solverBestConfig = config;
            this.solverFoundSolution = true;
            this.solverRunning = false;
            this.showHints = true;
            if (this.solverMode === 'refine') {
                this.refineButton.textContent = `Solution Found! (${this.solverCurrentAttempt} attempts)`;
                this.refineButton.disabled = false;
            } else {
                this.hintButton.textContent = `Solution Found! (${this.solverCurrentAttempt} attempts)`;
                this.hintButton.disabled = false;
            }
            return;
        }

        // Keep track of best attempt
        if (!this.solverBestConfig || result.closestDistance < this.solverBestDistance) {
            this.solverBestConfig = config;
            this.solverBestDistance = result.closestDistance;
        }

        // Limit attempts based on mode
        const maxAttempts = this.solverMode === 'refine' ? 30 : 50;
        if (this.solverCurrentAttempt >= maxAttempts) {
            this.solverRunning = false;
            this.showHints = true;
            if (this.solverMode === 'refine') {
                this.refineButton.textContent = `Best Try (${this.solverCurrentAttempt} attempts)`;
                this.refineButton.disabled = false;
            } else {
                this.hintButton.textContent = `Best Try (${this.solverCurrentAttempt} attempts)`;
                this.hintButton.disabled = false;
            }
            return;
        }

        // Continue in next frame (slower for visibility)
        setTimeout(() => this.runSolverStep(), 100);
    }

    generateRandomConfig(level) {
        // Calculate average target position for smarter angle generation
        const avgTargetX = this.targets.reduce((sum, t) => sum + t.x, 0) / this.targets.length;
        const avgTargetY = this.targets.reduce((sum, t) => sum + t.y, 0) / this.targets.length;

        // Calculate error bias from recent failures (last 10 attempts)
        let errorBiasX = 0, errorBiasY = 0;
        if (this.solverErrorVectors.length > 0) {
            const recentErrors = this.solverErrorVectors.slice(-10);
            errorBiasX = recentErrors.reduce((sum, e) => sum + e.dx, 0) / recentErrors.length;
            errorBiasY = recentErrors.reduce((sum, e) => sum + e.dy, 0) / recentErrors.length;

            // Bias strength decreases with temperature (more learning when hot, less when cold)
            const biasStrength = 0.3 * (1 - this.solverTemperature);
            errorBiasX *= biasStrength;
            errorBiasY *= biasStrength;
        }

        // Temperature-based variation ranges
        // Hot (temp=1.0): ±200px, ±80° - WILD exploration
        // Medium (temp=0.5): ±100px, ±40° - moderate
        // Cold (temp=0.0): ±30px, ±15° - fine-tuning
        const posVariation = 30 + this.solverTemperature * 170; // 30-200px
        const angleVariation = 15 + this.solverTemperature * 65; // 15-80°

        // Determine base configuration
        let baseConfig;
        if (this.solverMode === 'refine' && this.solverUserConfig) {
            // Use user's current configuration as base
            baseConfig = this.solverUserConfig;
        } else {
            // Use level's initial configuration
            baseConfig = level.surfaces;
        }

        // Generate random surface positions based on base config
        const config = baseConfig.map((surface, index) => {
            // Skip locked surfaces - keep them at original position
            if (surface.locked) {
                return {
                    x: surface.x,
                    y: surface.y,
                    width: surface.width,
                    angle: surface.angle,
                    locked: true
                };
            }

            let baseX, baseY, baseAngle;

            // In explore mode, use smart initial calculations
            if (this.solverMode === 'explore') {
                if (index === 0) {
                    // First surface: smart placement to catch falling ball
                    const ballX = level.ballStart.x;
                    const ballY = level.ballStart.y;

                    // Calculate horizontal and vertical distance to target
                    const horizontalDistToTarget = Math.abs(avgTargetX - ballX);
                    const verticalDistToTarget = Math.abs(avgTargetY - ballY);

                    // Smart intercept distance based on target geometry
                    let interceptDistance;
                    if (horizontalDistToTarget > 400) {
                        // Far target: catch early to preserve energy
                        interceptDistance = 80 + Math.random() * 60;
                    } else if (horizontalDistToTarget > 200) {
                        // Medium distance
                        interceptDistance = 120 + Math.random() * 80;
                    } else {
                        // Close target: can fall further
                        interceptDistance = 150 + Math.random() * 100;
                    }

                    // If target is above us, catch earlier to redirect upward
                    if (avgTargetY < ballY) {
                        interceptDistance *= 0.6;
                    }

                    // Place surface below ball
                    baseX = ballX;
                    baseY = ballY + interceptDistance;

                    // Smart angle toward target
                    const directionToTarget = avgTargetX - ballX;
                    if (directionToTarget > 0) {
                        // Target right: positive angle
                        baseAngle = 10 + Math.random() * 60; // 10-70°
                    } else {
                        // Target left: negative angle
                        baseAngle = -70 + Math.random() * 60; // -70 to -10°
                    }
                } else {
                    // Subsequent surfaces: place along predicted path
                    baseX = surface.x;
                    baseY = surface.y;

                    // Angle toward target
                    const directionToTarget = avgTargetX - baseX;
                    if (Math.abs(directionToTarget) < 50) {
                        baseAngle = surface.angle; // Keep similar
                    } else if (directionToTarget > 0) {
                        baseAngle = 30; // Aim right
                    } else {
                        baseAngle = -30; // Aim left
                    }
                }
            } else {
                // Refine mode: use current surface position as base
                baseX = surface.x;
                baseY = surface.y;
                baseAngle = surface.angle;
            }

            // Apply temperature-based variation
            const xVar = (Math.random() - 0.5) * posVariation * 2;
            const yVar = (Math.random() - 0.5) * posVariation * 2;
            const angleVar = (Math.random() - 0.5) * angleVariation * 2;

            // Apply error bias (learning from failures)
            const finalX = baseX + xVar + errorBiasX;
            const finalY = baseY + yVar + errorBiasY;
            const finalAngle = baseAngle + angleVar;

            return {
                x: finalX,
                y: finalY,
                width: surface.width,
                angle: finalAngle,
                locked: false
            };
        });

        return config;
    }

    simulateConfiguration(config, level) {
        // Create a temporary physics engine
        const tempEngine = Matter.Engine.create({
            enableSleeping: false,
            positionIterations: 10,
            velocityIterations: 10
        });
        const tempWorld = tempEngine.world;
        tempWorld.gravity.y = 0.5;
        tempWorld.gravity.scale = 0.001;

        // Create walls
        const wallOptions = { isStatic: true, friction: 0, restitution: 0.99 };
        Matter.World.add(tempWorld, [
            Matter.Bodies.rectangle(this.canvas.width / 2, -25, this.canvas.width, 50, wallOptions),
            Matter.Bodies.rectangle(this.canvas.width / 2, this.canvas.height + 25, this.canvas.width, 50, wallOptions),
            Matter.Bodies.rectangle(-25, this.canvas.height / 2, 50, this.canvas.height, wallOptions),
            Matter.Bodies.rectangle(this.canvas.width + 25, this.canvas.height / 2, 50, this.canvas.height, wallOptions)
        ]);

        // Create ball
        const ball = Matter.Bodies.circle(level.ballStart.x, level.ballStart.y, 20, {
            restitution: 0.95,
            friction: 0,
            frictionAir: 0,
            density: 0.001,
            label: 'ball'
        });
        Matter.World.add(tempWorld, ball);

        // Create surfaces (including locked ones for accurate simulation)
        const surfaceBodies = [];
        config.forEach(surfaceConfig => {
            const angleRad = (surfaceConfig.angle * Math.PI) / 180;
            const surface = Matter.Bodies.rectangle(
                surfaceConfig.x,
                surfaceConfig.y,
                surfaceConfig.width,
                20,
                {
                    isStatic: true,
                    angle: angleRad,
                    friction: 0,
                    restitution: 0.99,
                    label: 'surface'
                }
            );
            surfaceBodies.push(surface);
            Matter.World.add(tempWorld, surface);
        });

        // Track collision data
        const collisionData = [];
        Matter.Events.on(tempEngine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                // Check if ball collided with a surface
                const isBallCollision = pair.bodyA === ball || pair.bodyB === ball;
                if (!isBallCollision) return;

                // Find which body is the surface
                const otherBody = pair.bodyA === ball ? pair.bodyB : pair.bodyA;

                // Only record surface collisions, not walls
                const surfaceIndex = surfaceBodies.indexOf(otherBody);
                if (surfaceIndex === -1) return;

                // Get collision point
                const collision = pair.collision;
                const contactPoint = collision.supports[0] || { x: ball.position.x, y: ball.position.y };

                // Calculate normal vector (perpendicular to surface)
                const normal = collision.normal;

                // Get velocity before collision
                const velocityBefore = { x: ball.velocity.x, y: ball.velocity.y };

                // Calculate impact speed
                const impactSpeed = Math.sqrt(velocityBefore.x * velocityBefore.x + velocityBefore.y * velocityBefore.y);

                // Store collision data
                collisionData.push({
                    x: contactPoint.x,
                    y: contactPoint.y,
                    normalX: normal.x,
                    normalY: normal.y,
                    velocityBeforeX: velocityBefore.x,
                    velocityBeforeY: velocityBefore.y,
                    impactSpeed: impactSpeed,
                    surfaceAngle: config[surfaceIndex].angle
                });
            });
        });

        // Simulate for 300 frames (5 seconds at 60fps)
        const trajectory = [];
        let closestDistance = Infinity;
        let success = false;

        for (let i = 0; i < 300; i++) {
            Matter.Engine.update(tempEngine, 1000 / 60);

            // Safety cap to match actual game and prevent physics instability
            const maxVelocity = 100;
            const velocity = ball.velocity;
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            if (speed > maxVelocity) {
                const scale = maxVelocity / speed;
                Matter.Body.setVelocity(ball, {
                    x: velocity.x * scale,
                    y: velocity.y * scale
                });
            }

            trajectory.push({
                x: ball.position.x,
                y: ball.position.y
            });

            // Check distance to all targets
            this.targets.forEach(target => {
                if (!target.collected) {
                    const dx = ball.position.x - target.x;
                    const dy = ball.position.y - target.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                    }

                    // Target collection radius
                    if (distance < 30) {
                        success = true;
                    }
                }
            });

            if (success) break;
        }

        // Clean up
        Matter.World.clear(tempWorld);
        Matter.Engine.clear(tempEngine);

        return {
            trajectory,
            success,
            closestDistance,
            collisionData
        };
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

            // Calculate hook swing velocity to transfer to ball (only for levels with swinging)
            // Sway is: Math.sin(Date.now() / 800) * 10
            // Velocity is derivative: cos(t/800) * (10/800) * 1000 = cos(t/800) * 12.5
            const hasSwinging = this.currentLevel >= 4;
            const swayVelocity = hasSwinging ? Math.cos(Date.now() / 800) * 12.5 : 0;

            // Delay ball activation for hook animation
            setTimeout(() => {
                this.ball.activate();

                // Transfer swing momentum to ball (horizontal velocity)
                Matter.Body.setVelocity(this.ball.body, {
                    x: swayVelocity * 0.15, // Scale down for gameplay feel (0 for early levels)
                    y: 0
                });

                this.currentState = this.states.PLAYING;
                this.hookReleasing = false;
            }, 300); // 300ms animation

            this.attempts++;
            this.playButton.textContent = 'Playing...';
            this.playButton.disabled = true;

            // Start time tracking on first attempt
            if (this.attempts === 1) {
                this.levelStartTime = Date.now();
            }

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

        // Reset hook animation
        this.hookReleasing = false;
        this.hookReleaseProgress = 0;
        this.hookSwayOffset = 0;

        // Reset bird
        if (this.bird) {
            this.bird.active = false;
            this.birdSpawnTimer = 0;
            this.birdSpawnInterval = 5000 + Math.random() * 5000;
        }

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
        if (this.replayData.length === 0) {
            console.warn('Cannot start replay: no replay data available');
            return;
        }

        // CRITICAL: Cancel victory screen auto-advance timers
        if (this.victoryHideTimer) {
            clearTimeout(this.victoryHideTimer);
            this.victoryHideTimer = null;
        }
        if (this.victoryAdvanceTimer) {
            clearTimeout(this.victoryAdvanceTimer);
            this.victoryAdvanceTimer = null;
            console.log('✅ Cancelled auto-advance to next level');
        }

        // Ensure we're not in a bad state
        if (this.currentState === this.states.PLAYING) {
            console.log('Stopping active game before replay');
            this.restart();
        }

        this.currentState = this.states.REPLAY;
        this.replayIndex = 0;
        this.playButton.textContent = 'Exit Replay';
        this.playButton.disabled = false;
        this.replayButton.style.display = 'none';

        // Reset ball to start
        const level = getLevel(this.currentLevel);
        if (this.ball) {
            this.ball.reset(level.ballStart.x, level.ballStart.y);
        }
    }

    stopReplay() {
        console.log('Stopping replay, returning to MENU');
        this.currentState = this.states.MENU;
        this.playButton.textContent = 'Play';
        this.playButton.disabled = false;

        // Only show replay button if we have data for current level
        if (this.replayData.length > 0) {
            this.replayButton.style.display = 'block';
        }

        const level = getLevel(this.currentLevel);
        if (this.ball && level) {
            this.ball.reset(level.ballStart.x, level.ballStart.y);
        }
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

            // Calculate final time
            if (this.levelStartTime > 0) {
                this.levelTime = (Date.now() - this.levelStartTime) / 1000; // Convert to seconds
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
        const fixedTimeStep = 1000 / 60;
        Matter.Engine.update(this.engine, fixedTimeStep);

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
            surface.handleMouseMove(this.mousePos.x, this.mousePos.y);
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
        // Skip if no surface selected
        if (this.selectedSurfaceIndex < 0 || this.selectedSurfaceIndex >= this.surfaces.length) {
            return;
        }

        const now = Date.now();

        // Process each held key
        for (const [key, data] of this.keyHoldDuration.entries()) {
            const holdDuration = now - data.startTime;

            // Calculate acceleration based on hold duration
            // 0-200ms: 1px/frame (fine control)
            // 200-1000ms: ramp from 1 to 5px/frame (acceleration)
            // 1000ms+: 5px/frame (max speed)
            let speed;
            if (holdDuration < 200) {
                speed = 1;
            } else if (holdDuration < 1000) {
                // Linear ramp from 1 to 5 over 800ms
                speed = 1 + ((holdDuration - 200) / 800) * 4;
            } else {
                speed = 5;
            }

            // Apply movement or rotation based on key
            const shiftMultiplier = data.shiftKey ? 5 : 1;
            const movementAmount = speed * shiftMultiplier;

            // Rotation uses fixed increments (no acceleration)
            const rotationAmount = data.shiftKey ? 5 : 1;

            // Movement keys
            if (key === 'w' || key === 'W' || key === 'ArrowUp') {
                this.moveSelectedSurface(0, -movementAmount);
            } else if (key === 's' || key === 'S' || key === 'ArrowDown') {
                this.moveSelectedSurface(0, movementAmount);
            } else if (key === 'a' || key === 'A') {
                this.moveSelectedSurface(-movementAmount, 0);
            } else if (key === 'd' || key === 'D') {
                this.moveSelectedSurface(movementAmount, 0);
            } else if (key === 'ArrowLeft') {
                if (data.shiftKey) {
                    // Shift + Left Arrow = Rotate left
                    this.rotateSelectedSurface(-rotationAmount);
                } else {
                    // Left Arrow alone = Move left
                    this.moveSelectedSurface(-movementAmount, 0);
                }
            } else if (key === 'ArrowRight') {
                if (data.shiftKey) {
                    // Shift + Right Arrow = Rotate right
                    this.rotateSelectedSurface(rotationAmount);
                } else {
                    // Right Arrow alone = Move right
                    this.moveSelectedSurface(movementAmount, 0);
                }
            }
            // Rotation keys (Q/E) - fixed increments, no acceleration
            else if (key === 'q' || key === 'Q') {
                this.rotateSelectedSurface(-rotationAmount);
            } else if (key === 'e' || key === 'E') {
                this.rotateSelectedSurface(rotationAmount);
            }
        }
    }

    updateUI() {
        if (this.ball) {
            const ratio = this.ball.getElasticityRatio();
            this.elasticityFill.style.width = `${ratio * 100}%`;
            this.elasticityFill.style.background = this.ball.color;
        }

        // Update score display
        this.scoreAttempts.textContent = this.attempts;

        // Update time if playing
        if (this.currentState === this.states.PLAYING && this.levelStartTime > 0) {
            const currentTime = (Date.now() - this.levelStartTime) / 1000;
            this.scoreTime.textContent = `${currentTime.toFixed(1)}s`;

            // Calculate live score preview
            const liveScore = this.calculateLiveScore(currentTime);
            this.scorePoints.textContent = liveScore;

            // Change color if solver was used
            if (this.usedSolver) {
                this.scorePoints.style.color = '#999';
                this.scorePoints.textContent = 'N/A';
            } else {
                this.scorePoints.style.color = '#333';
            }
        } else if (this.currentState === this.states.MENU) {
            // Reset to initial values when in menu
            if (this.attempts === 0) {
                this.scoreTime.textContent = '0s';
                this.scorePoints.textContent = '1000';
                this.scorePoints.style.color = '#333';
            }
        }
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

        // Render bird obstacle
        if (this.bird) {
            this.bird.render(this.ctx);
        }

        // Show angle toggle indicator
        if (this.showAngles && !isReplay && !this.showHints && !this.solverRunning) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, this.canvas.height - 50, 150, 40);
            this.ctx.fillStyle = '#FFE66D';
            this.ctx.font = 'bold 14px sans-serif';
            this.ctx.fillText('Angles: ON (V)', 20, this.canvas.height - 25);
        }

        // Render hint surfaces and solver visualization
        // In debug mode, show hints even during replay
        if ((this.debugMode || !isReplay) && (this.showHints || this.solverRunning)) {
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

            // Render hook in MENU state or during release animation
            if (this.currentState === this.states.MENU || this.hookReleasing) {
                this.renderHook();
            }
        }

        // Show debug mode indicator
        if (this.debugMode) {
            this.ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
            this.ctx.fillRect(10, this.canvas.height - 180, 150, 40);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px sans-serif';
            this.ctx.fillText('DEBUG MODE (B)', 20, this.canvas.height - 155);
        }
    }

    renderHook() {
        if (!this.ball) return;

        const ctx = this.ctx;
        const ballPos = this.ball.body.position;
        const ballRadius = this.ball.radius;

        // Calculate hook position with sway and release animation
        let hookX = ballPos.x + this.hookSwayOffset;
        let hookY = ballPos.y - ballRadius - 8;

        // During release, move hook upward
        if (this.hookReleasing) {
            hookY -= this.hookReleaseProgress * 80;
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
        ctx.quadraticCurveTo(hookX + this.hookSwayOffset * 0.5, controlY, hookX, hookY);
        ctx.stroke();

        // Crab claw parameters
        const clawRadius = 15; // Radius of the rounded claw
        const clawThickness = 8; // Thickness of the claw
        const closedDistance = ballRadius + 5; // Start close to ball sides
        const openDistance = this.hookReleasing
            ? closedDistance + (this.hookReleaseProgress * 35) // Open further when releasing
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
        if (!this.hookReleasing || this.hookReleaseProgress < 0.5) {
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
        if (!this.solverRunning && !this.solverBestConfig) return;

        const ctx = this.ctx;

        // Draw solver status
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, this.canvas.height - 120, 300, 60);
        ctx.fillStyle = '#4ECDC4';
        ctx.font = 'bold 14px sans-serif';

        if (this.solverRunning) {
            const text = `🔬 Experimenting... (${this.solverCurrentAttempt} tries)`;
            ctx.fillText(text, 20, this.canvas.height - 95);
        } else if (this.solverBestConfig) {
            if (this.solverFoundSolution) {
                ctx.fillStyle = '#4ECDC4';
                ctx.fillText(`✅ Solution Found!`, 20, this.canvas.height - 95);
            } else {
                ctx.fillStyle = '#FF6B6B';
                ctx.fillText(`❌ No Solution (best try shown)`, 20, this.canvas.height - 95);
            }
        }

        // Show attempts count
        if (this.solverAttempts.length > 0) {
            ctx.font = '12px sans-serif';
            ctx.fillStyle = 'white';
            ctx.fillText(`Failed: ${this.solverAttempts.filter(a => !a.success).length}`, 20, this.canvas.height - 75);
        }

        // Draw last 20 failed attempts as visible trajectories
        const failedAttempts = this.solverAttempts.filter(a => !a.success).slice(-20);
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
        if (this.solverRunning && this.solverAttempts.length > 0) {
            const currentAttempt = this.solverAttempts[this.solverAttempts.length - 1];

            // Show surfaces being tested
            const level = getLevel(this.currentLevel);
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
        if (this.solverBestConfig && this.showHints) {
            const config = this.solverBestConfig;
            const successfulAttempt = this.solverAttempts.find(a => a.success);
            const bestAttempt = successfulAttempt || this.solverAttempts.find(a => a.config === this.solverBestConfig);

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
            const level = getLevel(this.currentLevel);
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
