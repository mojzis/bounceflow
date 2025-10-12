# Game.js Refactoring Implementation Plan

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/subagent-driven-development/SKILL.md` to implement this plan task-by-task.
>
> **Execution Method:** Subagent-Driven Development - dispatch fresh subagent per task, with code review between tasks.

**Goal:** Refactor monolithic game.js (2220 lines) into focused modules to improve maintainability, reduce context usage, and enable better testing.

**Architecture:** Extract self-contained systems (Solver, Input, Rendering, Physics) into separate classes. Main Game class becomes orchestrator that delegates to specialized managers. Each module has single responsibility and clear interfaces.

**Tech Stack:** Vite, Matter.js, vanilla JavaScript ES6 modules

---

## Module Breakdown

```
src/game/
├── index.js              # Main Game class (orchestrator)
├── PhysicsManager.js     # Matter.js setup, collision detection
├── SolverSystem.js       # AI solver logic
├── InputManager.js       # Mouse, touch, keyboard handling
├── RenderingSystem.js    # Core rendering + specialized renders
├── UIManager.js          # DOM elements, buttons, score
└── LevelManager.js       # Load/clear levels, progression
```

---

## Task 1: Extract PhysicsManager

**Files:**
- Create: `src/game/PhysicsManager.js`
- Modify: `src/game.js` (will rename to `src/game/index.js` in Task 7)

**Step 1: Create PhysicsManager.js with Matter.js setup**

Create `src/game/PhysicsManager.js`:

```javascript
/**
 * Manages Matter.js physics engine and collision detection
 */
import * as Matter from 'matter-js';

export class PhysicsManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.setupPhysics();
        this.collisionCallbacks = [];
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

        // Set up collision detection
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            this.collisionCallbacks.forEach(callback => callback(event.pairs));
        });
    }

    update(deltaTime) {
        // Update physics with fixed timestep (16.67ms = 60Hz)
        const fixedTimeStep = 1000 / 60;
        Matter.Engine.update(this.engine, fixedTimeStep);
    }

    onCollision(callback) {
        this.collisionCallbacks.push(callback);
    }

    resize(width, height) {
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
```

**Step 2: Test PhysicsManager by modifying game.js to use it**

In `src/game.js`, add import at top:
```javascript
import { PhysicsManager } from './game/PhysicsManager.js';
```

Replace `setupPhysics()` method with:
```javascript
setupPhysics() {
    this.physics = new PhysicsManager(this.canvas);
    this.engine = this.physics.engine;
    this.world = this.physics.world;
    this.walls = this.physics.walls;

    // Register collision handler
    this.physics.onCollision((pairs) => this.handleCollisions(pairs));
}
```

Update `update()` method to use PhysicsManager:
Find line ~1190: `Matter.Engine.update(this.engine, fixedTimeStep);`
Replace with: `this.physics.update(deltaTime);`

Update `resize()` method:
Find line ~2204, replace body with:
```javascript
this.canvas.width = width;
this.canvas.height = height;
this.physics.resize(width, height);
this.walls = this.physics.walls;
```

**Step 3: Test in browser**

Run: `npm run dev`
Expected: Game works identically, physics behaves the same

**Step 4: Commit**

```bash
git add src/game/PhysicsManager.js src/game.js
git commit -m "refactor: extract PhysicsManager from game.js

- Create PhysicsManager class for Matter.js setup
- Delegate physics update and collision detection
- Reduce game.js by ~130 lines"
```

---

## Task 2: Extract InputManager

**Files:**
- Create: `src/game/InputManager.js`
- Modify: `src/game.js`

**Step 1: Create InputManager.js**

Create `src/game/InputManager.js`:

```javascript
/**
 * Manages all user input: mouse, touch, keyboard
 */
export class InputManager {
    constructor(game) {
        this.game = game;
        this.mousePos = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.isRightClick = false;
        this.touches = new Map();

        // Keyboard state
        this.heldKeys = new Set();
        this.keyHoldDuration = new Map();
    }

    handleMouseDown(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.isMouseDown = true;
        this.isRightClick = e.button === 2;
        this.mousePos = { x, y };

        // Check surface interactions
        for (const surface of this.game.surfaces) {
            if (surface.handleMouseDown(x, y, this.isRightClick)) {
                this.game.canvas.classList.add('dragging');
                break;
            }
        }
    }

    handleMouseMove(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        this.mousePos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    handleMouseUp(e) {
        this.isMouseDown = false;
        this.game.canvas.classList.remove('dragging');
        this.game.surfaces.forEach(surface => surface.handleMouseUp());
    }

    handleTouchStart(e) {
        e.preventDefault();
        const rect = this.game.canvas.getBoundingClientRect();

        for (const touch of e.changedTouches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.touches.set(touch.identifier, { x, y });

            // Check surface interactions
            for (const surface of this.game.surfaces) {
                if (surface.handleTouchStart(x, y)) {
                    break;
                }
            }
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        const rect = this.game.canvas.getBoundingClientRect();

        for (const touch of e.changedTouches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.touches.set(touch.identifier, { x, y });
            this.mousePos = { x, y };

            this.game.surfaces.forEach(surface => surface.handleTouchMove(x, y));
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            this.touches.delete(touch.identifier);
        }

        this.game.surfaces.forEach(surface => surface.handleTouchEnd());
    }

    processHeldKeys() {
        // Skip if no surface selected
        if (this.game.selectedSurfaceIndex < 0 || this.game.selectedSurfaceIndex >= this.game.surfaces.length) {
            return;
        }

        const now = Date.now();

        // Process each held key
        for (const [key, data] of this.keyHoldDuration.entries()) {
            const holdDuration = now - data.startTime;

            // Calculate acceleration
            let speed;
            if (holdDuration < 200) {
                speed = 1;
            } else if (holdDuration < 1000) {
                speed = 1 + ((holdDuration - 200) / 800) * 4;
            } else {
                speed = 5;
            }

            const shiftMultiplier = data.shiftKey ? 5 : 1;
            const movementAmount = speed * shiftMultiplier;
            const rotationAmount = data.shiftKey ? 5 : 1;

            // Movement keys
            if (key === 'w' || key === 'W' || key === 'ArrowUp') {
                this.game.moveSelectedSurface(0, -movementAmount);
            } else if (key === 's' || key === 'S' || key === 'ArrowDown') {
                this.game.moveSelectedSurface(0, movementAmount);
            } else if (key === 'a' || key === 'A') {
                this.game.moveSelectedSurface(-movementAmount, 0);
            } else if (key === 'd' || key === 'D') {
                this.game.moveSelectedSurface(movementAmount, 0);
            } else if (key === 'ArrowLeft') {
                if (data.shiftKey) {
                    this.game.rotateSelectedSurface(-rotationAmount);
                } else {
                    this.game.moveSelectedSurface(-movementAmount, 0);
                }
            } else if (key === 'ArrowRight') {
                if (data.shiftKey) {
                    this.game.rotateSelectedSurface(rotationAmount);
                } else {
                    this.game.moveSelectedSurface(movementAmount, 0);
                }
            } else if (key === 'q' || key === 'Q') {
                this.game.rotateSelectedSurface(-rotationAmount);
            } else if (key === 'e' || key === 'E') {
                this.game.rotateSelectedSurface(rotationAmount);
            }
        }
    }

    trackKeyDown(key, shiftKey) {
        if (!this.heldKeys.has(key)) {
            this.heldKeys.add(key);
            this.keyHoldDuration.set(key, { startTime: Date.now(), shiftKey });
        }
    }

    trackKeyUp(key) {
        this.heldKeys.delete(key);
        this.keyHoldDuration.delete(key);
    }
}
```

**Step 2: Integrate InputManager into game.js**

Add import:
```javascript
import { InputManager } from './game/InputManager.js';
```

In constructor, after `this.touches = new Map();`, replace with:
```javascript
this.input = new InputManager(this);
```

Delete these properties from constructor (InputManager handles them):
```javascript
// DELETE THESE:
this.mousePos = { x: 0, y: 0 };
this.isMouseDown = false;
this.isRightClick = false;
this.touches = new Map();
this.heldKeys = new Set();
this.keyHoldDuration = new Map();
```

Update references throughout:
- `this.mousePos` → `this.input.mousePos`
- `this.heldKeys` → `this.input.heldKeys`
- `this.keyHoldDuration` → `this.input.keyHoldDuration`

Replace method bodies to delegate:
```javascript
handleMouseDown(e) { this.input.handleMouseDown(e); }
handleMouseMove(e) { this.input.handleMouseMove(e); }
handleMouseUp(e) { this.input.handleMouseUp(e); }
handleTouchStart(e) { this.input.handleTouchStart(e); }
handleTouchMove(e) { this.input.handleTouchMove(e); }
handleTouchEnd(e) { this.input.handleTouchEnd(e); }
processHeldKeys() { this.input.processHeldKeys(); }
```

In `setupUI()` keydown handler, replace:
```javascript
this.heldKeys.add(e.key);
this.keyHoldDuration.set(e.key, { startTime: Date.now(), shiftKey: e.shiftKey });
```
With:
```javascript
this.input.trackKeyDown(e.key, e.shiftKey);
```

In keyup handler, replace:
```javascript
if (this.heldKeys.has(e.key)) {
    this.heldKeys.delete(e.key);
    this.keyHoldDuration.delete(e.key);
}
```
With:
```javascript
if (this.input.heldKeys.has(e.key)) {
    this.input.trackKeyUp(e.key);
}
```

**Step 3: Test in browser**

Run: `npm run dev`
Expected: All input (mouse, touch, keyboard) works identically

**Step 4: Commit**

```bash
git add src/game/InputManager.js src/game.js
git commit -m "refactor: extract InputManager from game.js

- Create InputManager for mouse, touch, keyboard
- Centralize input state and processing
- Reduce game.js by ~250 lines"
```

---

## Task 3: Extract SolverSystem (Largest Module)

**Files:**
- Create: `src/game/SolverSystem.js`
- Modify: `src/game.js`

**Step 1: Create SolverSystem.js with all solver logic**

Create `src/game/SolverSystem.js`:

```javascript
/**
 * AI solver system that finds solutions to levels
 */
import * as Matter from 'matter-js';
import { getLevel } from '../levels.js';

export class SolverSystem {
    constructor(game) {
        this.game = game;

        // Solver state
        this.running = false;
        this.attempts = [];
        this.bestConfig = null;
        this.bestDistance = Infinity;
        this.currentAttempt = 0;
        this.foundSolution = false;
        this.temperature = 1.0;
        this.errorVectors = [];
        this.mode = 'explore'; // 'explore' or 'refine'
        this.userConfig = null;
    }

    start(mode = 'explore', userConfig = null) {
        console.log('🚀 Starting solver in', mode, 'mode...');

        this.mode = mode;
        this.userConfig = userConfig;

        // Clear previous state
        this.running = true;
        this.attempts = [];
        this.bestConfig = null;
        this.bestDistance = Infinity;
        this.currentAttempt = 0;
        this.foundSolution = false;
        this.errorVectors = [];

        // Set initial temperature
        this.temperature = mode === 'refine' ? 0.2 : 1.0;

        console.log('Solver state:', {
            running: this.running,
            mode: this.mode,
            temperature: this.temperature
        });

        // Start solver loop
        this.runStep();
    }

    stop() {
        this.running = false;
    }

    runStep() {
        if (!this.running) return;

        let config, result;
        try {
            const level = getLevel(this.game.currentLevel);

            // Update temperature (cool down linearly in explore mode)
            const maxAttempts = this.mode === 'refine' ? 30 : 50;
            if (this.mode === 'explore') {
                this.temperature = 1.0 - (this.currentAttempt / maxAttempts);
                this.temperature = Math.max(0, this.temperature);
            }

            // Generate configuration
            config = this.generateRandomConfig(level);
            console.log('Solver attempt', this.currentAttempt + 1, 'temp:', this.temperature.toFixed(2));

            // Simulate
            result = this.simulateConfiguration(config, level);
            console.log('Result:', result.success ? 'SUCCESS!' : 'failed', 'distance:', result.closestDistance.toFixed(1));

            // Store attempt
            this.attempts.push({
                config: config,
                trajectory: result.trajectory,
                success: result.success,
                closestDistance: result.closestDistance,
                collisionData: result.collisionData
            });

            // Track error vector for learning
            if (!result.success && result.trajectory.length > 0) {
                const ballFinalPos = result.trajectory[result.trajectory.length - 1];
                let nearestTarget = this.game.targets[0];
                let minDist = Infinity;

                this.game.targets.forEach(target => {
                    const dx = target.x - ballFinalPos.x;
                    const dy = target.y - ballFinalPos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestTarget = target;
                    }
                });

                this.errorVectors.push({
                    dx: nearestTarget.x - ballFinalPos.x,
                    dy: nearestTarget.y - ballFinalPos.y,
                    magnitude: minDist
                });
            }

            this.currentAttempt++;
        } catch (error) {
            console.error('Solver error:', error);
            this.stop();
            alert('Solver encountered an error. Check browser console.');
            return;
        }

        // Check success
        if (result.success) {
            console.log('✅ SOLUTION FOUND after', this.currentAttempt, 'attempts!');
            this.bestConfig = config;
            this.foundSolution = true;
            this.running = false;
            return;
        }

        // Track best
        if (!this.bestConfig || result.closestDistance < this.bestDistance) {
            this.bestConfig = config;
            this.bestDistance = result.closestDistance;
        }

        // Check limit
        const maxAttempts = this.mode === 'refine' ? 30 : 50;
        if (this.currentAttempt >= maxAttempts) {
            this.running = false;
            return;
        }

        // Continue
        setTimeout(() => this.runStep(), 100);
    }

    generateRandomConfig(level) {
        const avgTargetX = this.game.targets.reduce((sum, t) => sum + t.x, 0) / this.game.targets.length;
        const avgTargetY = this.game.targets.reduce((sum, t) => sum + t.y, 0) / this.game.targets.length;

        // Error bias from recent failures
        let errorBiasX = 0, errorBiasY = 0;
        if (this.errorVectors.length > 0) {
            const recentErrors = this.errorVectors.slice(-10);
            errorBiasX = recentErrors.reduce((sum, e) => sum + e.dx, 0) / recentErrors.length;
            errorBiasY = recentErrors.reduce((sum, e) => sum + e.dy, 0) / recentErrors.length;
            const biasStrength = 0.3 * (1 - this.temperature);
            errorBiasX *= biasStrength;
            errorBiasY *= biasStrength;
        }

        // Temperature-based variation
        const posVariation = 30 + this.temperature * 170;
        const angleVariation = 15 + this.temperature * 65;

        // Base config
        const baseConfig = (this.mode === 'refine' && this.userConfig)
            ? this.userConfig
            : level.surfaces;

        // Generate config
        const config = baseConfig.map((surface, index) => {
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

            if (this.mode === 'explore') {
                if (index === 0) {
                    // First surface: smart placement
                    const ballX = level.ballStart.x;
                    const ballY = level.ballStart.y;
                    const horizontalDistToTarget = Math.abs(avgTargetX - ballX);

                    let interceptDistance;
                    if (horizontalDistToTarget > 400) {
                        interceptDistance = 80 + Math.random() * 60;
                    } else if (horizontalDistToTarget > 200) {
                        interceptDistance = 120 + Math.random() * 80;
                    } else {
                        interceptDistance = 150 + Math.random() * 100;
                    }

                    if (avgTargetY < ballY) {
                        interceptDistance *= 0.6;
                    }

                    baseX = ballX;
                    baseY = ballY + interceptDistance;

                    const directionToTarget = avgTargetX - ballX;
                    baseAngle = directionToTarget > 0
                        ? 10 + Math.random() * 60
                        : -70 + Math.random() * 60;
                } else {
                    baseX = surface.x;
                    baseY = surface.y;
                    const directionToTarget = avgTargetX - baseX;
                    if (Math.abs(directionToTarget) < 50) {
                        baseAngle = surface.angle;
                    } else {
                        baseAngle = directionToTarget > 0 ? 30 : -30;
                    }
                }
            } else {
                baseX = surface.x;
                baseY = surface.y;
                baseAngle = surface.angle;
            }

            // Apply variation
            const xVar = (Math.random() - 0.5) * posVariation * 2;
            const yVar = (Math.random() - 0.5) * posVariation * 2;
            const angleVar = (Math.random() - 0.5) * angleVariation * 2;

            let finalX = baseX + xVar + errorBiasX;
            let finalY = baseY + yVar + errorBiasY;
            const finalAngle = baseAngle + angleVar;

            // CONSTRAINT: First surface below ball
            if (this.mode === 'explore' && index === 0) {
                const ballY = level.ballStart.y;
                finalY = Math.max(ballY - 20, finalY);
            }

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
        // Create temporary physics
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
            Matter.Bodies.rectangle(this.game.canvas.width / 2, -25, this.game.canvas.width, 50, wallOptions),
            Matter.Bodies.rectangle(this.game.canvas.width / 2, this.game.canvas.height + 25, this.game.canvas.width, 50, wallOptions),
            Matter.Bodies.rectangle(-25, this.game.canvas.height / 2, 50, this.game.canvas.height, wallOptions),
            Matter.Bodies.rectangle(this.game.canvas.width + 25, this.game.canvas.height / 2, 50, this.game.canvas.height, wallOptions)
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

        // Create surfaces
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

        // Track collisions
        const collisionData = [];
        Matter.Events.on(tempEngine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                const isBallCollision = pair.bodyA === ball || pair.bodyB === ball;
                if (!isBallCollision) return;

                const otherBody = pair.bodyA === ball ? pair.bodyB : pair.bodyA;
                const surfaceIndex = surfaceBodies.indexOf(otherBody);
                if (surfaceIndex === -1) return;

                const collision = pair.collision;
                const contactPoint = collision.supports[0] || { x: ball.position.x, y: ball.position.y };
                const normal = collision.normal;
                const velocityBefore = { x: ball.velocity.x, y: ball.velocity.y };
                const impactSpeed = Math.sqrt(velocityBefore.x * velocityBefore.x + velocityBefore.y * velocityBefore.y);

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

        // Simulate
        const trajectory = [];
        let closestDistance = Infinity;
        let success = false;

        for (let i = 0; i < 300; i++) {
            Matter.Engine.update(tempEngine, 1000 / 60);

            // Velocity cap
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

            // Check targets
            this.game.targets.forEach(target => {
                if (!target.collected) {
                    const dx = ball.position.x - target.x;
                    const dy = ball.position.y - target.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                    }

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
}
```

**Step 2: Integrate SolverSystem into game.js**

Add import:
```javascript
import { SolverSystem } from './game/SolverSystem.js';
```

In constructor, replace solver state properties with:
```javascript
this.solver = new SolverSystem(this);
// Keep these for backward compatibility:
this.solverRunning = false;
this.solverAttempts = [];
this.solverBestConfig = null;
this.solverFoundSolution = false;
```

Update all solver property references to use `this.solver.*`:
- `this.solverRunning` → `this.solver.running`
- `this.solverAttempts` → `this.solver.attempts`
- `this.solverBestConfig` → `this.solver.bestConfig`
- `this.solverFoundSolution` → `this.solver.foundSolution`
- etc.

Replace `startSolver()`, `stopSolver()`, `runSolverStep()`, `generateRandomConfig()`, `simulateConfiguration()` with delegations:
```javascript
startSolver() {
    this.usedSolver = true;
    this.solver.start(this.solverMode, this.solverUserConfig);
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
```

**Step 3: Test solver in browser**

Run: `npm run dev`
Test: Press "?" to trigger solver, verify it finds solutions

**Step 4: Commit**

```bash
git add src/game/SolverSystem.js src/game.js
git commit -m "refactor: extract SolverSystem from game.js

- Create SolverSystem for AI level solving
- Encapsulate solver state and logic
- Reduce game.js by ~400 lines"
```

---

## Task 4: Extract RenderingSystem

**Files:**
- Create: `src/game/RenderingSystem.js`
- Modify: `src/game.js`

**Step 1: Create RenderingSystem.js**

Create `src/game/RenderingSystem.js`:

```javascript
/**
 * Handles all game rendering
 */
export class RenderingSystem {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.canvas = game.canvas;
    }

    render() {
        // Clear with gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render surfaces
        const isReplay = this.game.currentState === this.game.states.REPLAY;
        const displayAngles = isReplay || this.game.showAngles;
        this.game.surfaces.forEach(surface => surface.render(this.ctx, displayAngles));

        // Render targets
        this.game.targets.forEach(target => target.render(this.ctx));

        // Render bird
        if (this.game.bird) {
            this.game.bird.render(this.ctx);
        }

        // Angle indicator
        if (this.game.showAngles && !isReplay && !this.game.showHints && !this.game.solver.running) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, this.canvas.height - 50, 150, 40);
            this.ctx.fillStyle = '#FFE66D';
            this.ctx.font = 'bold 14px sans-serif';
            this.ctx.fillText('Angles: ON (V)', 20, this.canvas.height - 25);
        }

        // Solver hints
        if ((this.game.debugMode || !isReplay) && (this.game.showHints || this.game.solver.running)) {
            this.renderHints();
        }

        // Replay or normal
        if (isReplay) {
            this.renderReplay();
        } else {
            if (this.game.ball) {
                this.game.ball.render(this.ctx);
            }
            if (this.game.currentState === this.game.states.MENU || this.game.hookReleasing) {
                this.renderHook();
            }
        }

        // Debug indicator
        if (this.game.debugMode) {
            this.ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
            this.ctx.fillRect(10, this.canvas.height - 180, 150, 40);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px sans-serif';
            this.ctx.fillText('DEBUG MODE (B)', 20, this.canvas.height - 155);
        }
    }

    renderHook() {
        // [Copy entire renderHook method from game.js lines 1514-1674]
        // (Too long to include in plan, copy verbatim)
    }

    renderHints() {
        // [Copy entire renderHints method from game.js lines 1676-1895]
        // (Too long to include in plan, copy verbatim)
    }

    renderReplay() {
        // [Copy entire renderReplay method from game.js lines 1897-2021]
        // (Too long to include in plan, copy verbatim)
    }

    drawForceVector(ctx, x, y, fx, fy, color, label = '') {
        // [Copy from game.js lines 2023-2061]
    }

    drawVelocityVector(ctx, x, y, vx, vy, speed, isLarge = false) {
        // [Copy from game.js lines 2063-2099]
    }
}
```

**Step 2: Integrate RenderingSystem**

Add import:
```javascript
import { RenderingSystem } from './game/RenderingSystem.js';
```

In constructor:
```javascript
this.renderer = new RenderingSystem(this);
```

Replace `render()`, `renderHook()`, `renderHints()`, `renderReplay()`, `drawForceVector()`, `drawVelocityVector()` with:
```javascript
render() {
    this.renderer.render();
}
```

Delete the other render methods (they're now in RenderingSystem).

**Step 3: Test rendering**

Run: `npm run dev`
Test: All visuals render correctly (hook, solver hints, replay)

**Step 4: Commit**

```bash
git add src/game/RenderingSystem.js src/game.js
git commit -m "refactor: extract RenderingSystem from game.js

- Create RenderingSystem for all rendering logic
- Consolidate hook, hints, replay rendering
- Reduce game.js by ~500 lines"
```

---

## Task 5: Extract UIManager

**Files:**
- Create: `src/game/UIManager.js`
- Modify: `src/game.js`

**Step 1: Create UIManager.js**

Create `src/game/UIManager.js`:

```javascript
/**
 * Manages DOM UI elements and event handlers
 */
export class UIManager {
    constructor(game) {
        this.game = game;
        this.setupUI();
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

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Button handlers
        this.playButton.addEventListener('click', () => this.game.startPlay());
        this.dropButton.addEventListener('click', () => this.game.dropBall());
        this.restartButton.addEventListener('click', () => this.game.restart());
        this.replayButton.addEventListener('click', () => this.game.startReplay());
        this.hintButton.addEventListener('click', () => this.game.toggleHints());
        this.refineButton.addEventListener('click', () => this.game.startRefineSolver());
        this.helpButton.addEventListener('click', () => this.game.toggleHelp());
        this.closeHelpButton.addEventListener('click', () => this.game.hideHelp());

        // Click outside to close help
        this.helpOverlay.addEventListener('click', (e) => {
            if (e.target === this.helpOverlay) {
                this.game.hideHelp();
            }
        });

        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Help toggle
            if (e.key === 'h' || e.key === 'H') {
                this.game.toggleHelp();
                e.preventDefault();
                return;
            } else if (e.key === 'Escape') {
                this.game.hideHelp();
                e.preventDefault();
                return;
            }

            if (!this.helpOverlay.classList.contains('hidden')) {
                return;
            }

            const isMovementKey = ['w', 'W', 'a', 'A', 's', 'S', 'd', 'D', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'q', 'Q', 'e', 'E'].includes(e.key);

            if (isMovementKey) {
                if (!e.repeat && !this.game.input.heldKeys.has(e.key)) {
                    this.game.input.trackKeyDown(e.key, e.shiftKey);
                }
                e.preventDefault();
                return;
            }

            // Non-movement keys
            if (e.key === 'r' || e.key === 'R') {
                this.game.restart();
            } else if (e.key === ' ') {
                if (this.game.currentState === this.game.states.MENU) {
                    this.game.startPlay();
                } else if (this.game.currentState === this.game.states.PLAYING) {
                    this.game.dropBall();
                }
                e.preventDefault();
            } else if (e.key === 'Tab') {
                this.game.selectNextSurface();
                e.preventDefault();
            } else if (e.key === 'v' || e.key === 'V') {
                this.game.showAngles = !this.game.showAngles;
                e.preventDefault();
            } else if (e.key === '?' || e.key === '/') {
                this.game.toggleHints();
                e.preventDefault();
            } else if (e.key === 'b' || e.key === 'B') {
                this.game.debugMode = !this.game.debugMode;
                console.log('Debug mode:', this.game.debugMode ? 'ON' : 'OFF');
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.game.input.heldKeys.has(e.key)) {
                this.game.input.trackKeyUp(e.key);
            }
        });
    }

    updateUI() {
        if (this.game.ball) {
            const ratio = this.game.ball.getElasticityRatio();
            this.elasticityFill.style.width = `${ratio * 100}%`;
            this.elasticityFill.style.background = this.game.ball.color;
        }

        this.scoreAttempts.textContent = this.game.attempts;

        if (this.game.currentState === this.game.states.PLAYING && this.game.levelStartTime > 0) {
            const currentTime = (Date.now() - this.game.levelStartTime) / 1000;
            this.scoreTime.textContent = `${currentTime.toFixed(1)}s`;

            const liveScore = this.game.calculateLiveScore(currentTime);
            this.scorePoints.textContent = liveScore;

            if (this.game.usedSolver) {
                this.scorePoints.style.color = '#999';
                this.scorePoints.textContent = 'N/A';
            } else {
                this.scorePoints.style.color = '#333';
            }
        } else if (this.game.currentState === this.game.states.MENU) {
            if (this.game.attempts === 0) {
                this.scoreTime.textContent = '0s';
                this.scorePoints.textContent = '1000';
                this.scorePoints.style.color = '#333';
            }
        }
    }
}
```

**Step 2: Integrate UIManager**

Add import:
```javascript
import { UIManager } from './game/UIManager.js';
```

In constructor, replace `this.setupUI();` with:
```javascript
this.ui = new UIManager(this);
// Keep references for backward compatibility
this.playButton = this.ui.playButton;
this.hintButton = this.ui.hintButton;
this.refineButton = this.ui.refineButton;
this.replayButton = this.ui.replayButton;
this.victoryOverlay = this.ui.victoryOverlay;
this.victoryMessage = this.ui.victoryMessage;
// ... etc for other UI elements
```

Replace `setupUI()` and `updateUI()` with:
```javascript
updateUI() {
    this.ui.updateUI();
}
```

Delete `setupUI()` method.

**Step 3: Test UI**

Run: `npm run dev`
Test: All buttons work, keyboard shortcuts work, score updates

**Step 4: Commit**

```bash
git add src/game/UIManager.js src/game.js
git commit -m "refactor: extract UIManager from game.js

- Create UIManager for DOM elements and events
- Centralize keyboard shortcut handling
- Reduce game.js by ~200 lines"
```

---

## Task 6: Extract LevelManager

**Files:**
- Create: `src/game/LevelManager.js`
- Modify: `src/game.js`

**Step 1: Create LevelManager.js**

Create `src/game/LevelManager.js`:

```javascript
/**
 * Manages level loading, progression, and state
 */
import * as Matter from 'matter-js';
import { Ball } from '../ball.js';
import { Surface } from '../surface.js';
import { Target } from '../target.js';
import { Bird } from '../bird.js';
import { getLevel, getTotalLevels } from '../levels.js';

export class LevelManager {
    constructor(game) {
        this.game = game;
    }

    loadLevel(levelId) {
        const level = getLevel(levelId);
        if (!level) {
            console.error(`Level ${levelId} not found`);
            return;
        }

        // Stop solver
        if (this.game.solver.running) {
            this.game.solver.stop();
        }

        // Clear victory timers
        if (this.game.victoryHideTimer) {
            clearTimeout(this.game.victoryHideTimer);
            this.game.victoryHideTimer = null;
        }
        if (this.game.victoryAdvanceTimer) {
            clearTimeout(this.game.victoryAdvanceTimer);
            this.game.victoryAdvanceTimer = null;
        }

        // Clear existing
        this.clearLevel();

        // Clear replay
        this.game.replayData = [];
        this.game.collisionData = [];
        this.game.isRecording = false;
        this.game.replayIndex = 0;
        this.game.ui.replayButton.style.display = 'none';

        // Reset solver state
        this.game.solver.running = false;
        this.game.solver.attempts = [];
        this.game.solver.bestConfig = null;
        this.game.solver.bestDistance = Infinity;
        this.game.solver.currentAttempt = 0;
        this.game.solver.foundSolution = false;
        this.game.solver.temperature = 1.0;
        this.game.solver.errorVectors = [];
        this.game.solver.mode = 'explore';
        this.game.solver.userConfig = null;
        this.game.showHints = false;
        this.game.ui.hintButton.textContent = 'Show Hint (?)';
        this.game.ui.hintButton.disabled = false;
        this.game.ui.refineButton.textContent = 'Refine My Setup';
        this.game.ui.refineButton.disabled = false;

        // Update UI
        this.game.ui.levelDisplay.textContent = `Level ${levelId}`;
        this.game.ui.levelName.textContent = level.name;
        this.game.ui.hintText.textContent = level.hint;

        // Create ball
        this.game.ball = new Ball(level.ballStart.x, level.ballStart.y, 20, this.game.physics.world);
        this.game.ball.setPropertyPattern(level.propertyPattern, level.cycleSpeed);

        // Create surfaces
        level.surfaces.forEach(surfaceData => {
            const surface = new Surface(
                surfaceData.x,
                surfaceData.y,
                surfaceData.width,
                surfaceData.angle,
                surfaceData.locked,
                this.game.physics.world
            );
            this.game.surfaces.push(surface);
        });

        // Create targets with randomization
        level.targets.forEach(targetData => {
            const targetRadius = 25;
            const minDistance = targetRadius * 2 + 10;
            const maxAttempts = 10;
            let randomX, randomY, validPosition, attempts = 0;

            do {
                randomX = targetData.x + (Math.random() - 0.5) * 60;
                randomY = targetData.y + (Math.random() - 0.5) * 60;

                validPosition = true;
                for (const existingTarget of this.game.targets) {
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

            if (!validPosition) {
                randomX = targetData.x;
                randomY = targetData.y;
            }

            const target = new Target(randomX, randomY);
            this.game.targets.push(target);
        });

        // Create bird
        this.game.bird = new Bird(this.game.canvas.width, this.game.canvas.height);
        this.game.birdSpawnTimer = 0;
        this.game.birdSpawnInterval = 5000 + Math.random() * 5000;

        // Reset state
        this.game.currentState = this.game.states.MENU;
        this.game.attempts = 0;
        this.game.levelStartTime = 0;
        this.game.levelTime = 0;
        this.game.usedSolver = false;
        this.game.currentScore = 0;
        this.game.hookReleasing = false;
        this.game.hookReleaseProgress = 0;
        this.game.hookSwayOffset = 0;
    }

    clearLevel() {
        if (this.game.ball) {
            Matter.World.remove(this.game.physics.world, this.game.ball.body);
            this.game.ball = null;
        }

        this.game.surfaces.forEach(surface => {
            Matter.World.remove(this.game.physics.world, surface.body);
        });
        this.game.surfaces = [];
        this.game.selectedSurfaceIndex = -1;

        this.game.targets = [];
    }

    nextLevel() {
        if (this.game.currentLevel < getTotalLevels()) {
            this.game.currentLevel++;
            this.loadLevel(this.game.currentLevel);
        } else {
            this.showGameComplete();
        }
    }

    showGameComplete() {
        this.game.ui.victoryMessage.textContent = `All ${getTotalLevels()} levels complete!`;
        this.game.ui.victoryOverlay.querySelector('h1').textContent = '🏆 Congratulations!';
        this.game.ui.victoryOverlay.querySelector('.victory-footer').textContent = 'You beat the game!';
        this.game.ui.victoryOverlay.classList.remove('hidden');
    }
}
```

**Step 2: Integrate LevelManager**

Add import:
```javascript
import { LevelManager } from './game/LevelManager.js';
```

In constructor:
```javascript
this.levelManager = new LevelManager(this);
```

Replace `loadLevel()`, `clearLevel()`, `nextLevel()`, `showGameComplete()` with:
```javascript
loadLevel(levelId) {
    this.levelManager.loadLevel(levelId);
}

clearLevel() {
    this.levelManager.clearLevel();
}

nextLevel() {
    this.levelManager.nextLevel();
}

showGameComplete() {
    this.levelManager.showGameComplete();
}
```

**Step 3: Test level loading**

Run: `npm run dev`
Test: Level progression works, restart works

**Step 4: Commit**

```bash
git add src/game/LevelManager.js src/game.js
git commit -m "refactor: extract LevelManager from game.js

- Create LevelManager for level loading and progression
- Centralize entity creation and cleanup
- Reduce game.js by ~200 lines"
```

---

## Task 7: Move game.js to game/index.js

**Files:**
- Move: `src/game.js` → `src/game/index.js`
- Modify: `src/main.js`

**Step 1: Move file**

```bash
mv src/game.js src/game/index.js
```

**Step 2: Update import in main.js**

In `src/main.js`, change:
```javascript
import { Game } from './game.js';
```
To:
```javascript
import { Game } from './game/index.js';
```

**Step 3: Update imports in game/index.js**

In `src/game/index.js`, update relative imports:
```javascript
import { Ball } from '../ball.js';
import { Surface } from '../surface.js';
import { Target } from '../target.js';
import { Bird } from '../bird.js';
import { getLevel, getTotalLevels } from '../levels.js';
```

**Step 4: Test everything**

Run: `npm run dev`
Test: Everything works, Vite resolves paths correctly

**Step 5: Commit**

```bash
git add src/game/index.js src/main.js
git rm src/game.js
git commit -m "refactor: reorganize game.js as game/index.js

- Move game.js to game/ directory
- Game now serves as orchestrator for modules
- Update imports in main.js"
```

---

## Task 8: Final Cleanup and Verification

**Files:**
- Modify: `src/game/index.js`

**Step 1: Clean up game/index.js**

Review `src/game/index.js` and verify:
- All major logic delegated to modules
- Constructor is clean and organized
- Only orchestration logic remains
- File is ~300-400 lines (down from 2220)

**Step 2: Add JSDoc comments to modules**

Add documentation header to each module explaining its purpose and public API.

**Step 3: Run full test suite**

```bash
npm run test:run
```

Expected: All tests pass

**Step 4: Test all features**

Manual test checklist:
- [ ] Level loads correctly
- [ ] Mouse/touch input works
- [ ] Keyboard controls work
- [ ] Physics simulates correctly
- [ ] Solver finds solutions
- [ ] Replay system works
- [ ] All UI buttons work
- [ ] Level progression works
- [ ] Victory screen appears
- [ ] Game completes properly

**Step 5: Final commit**

```bash
git add .
git commit -m "refactor: complete game.js modularization

- Reduced game/index.js from 2220 to ~350 lines
- Created 6 focused modules with single responsibilities
- Improved testability and maintainability
- Reduced context usage when working with specific systems"
```

---

## Summary

**Before:**
- `src/game.js`: 2220 lines (monolithic)

**After:**
- `src/game/index.js`: ~350 lines (orchestrator)
- `src/game/PhysicsManager.js`: ~100 lines
- `src/game/InputManager.js`: ~200 lines
- `src/game/SolverSystem.js`: ~400 lines
- `src/game/RenderingSystem.js`: ~500 lines
- `src/game/UIManager.js`: ~200 lines
- `src/game/LevelManager.js`: ~200 lines

**Total:** ~1950 lines across 7 focused modules

**Benefits:**
- Each module has single responsibility
- Easier to test in isolation
- Reduced context usage (only load what you need)
- Better code organization
- Clearer dependencies
