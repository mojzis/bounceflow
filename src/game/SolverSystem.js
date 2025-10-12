/**
 * SolverSystem - AI solver that finds solutions to levels using simulated annealing
 *
 * Responsibilities:
 * - Generate random surface configurations using smart heuristics
 * - Simulate ball physics in temporary physics world
 * - Track best configurations and successful solutions
 * - Use temperature-based exploration (simulated annealing)
 * - Support two modes: explore (from scratch) and refine (from user config)
 * - Learn from failures using error vectors
 *
 * Public API:
 * - start(mode, userConfig): Start solver in 'explore' or 'refine' mode
 * - stop(): Stop the solver loop
 * - runStep(): Execute one solver iteration (called internally)
 *
 * Properties:
 * - running: Boolean indicating if solver is active
 * - attempts: Array of all simulation attempts with trajectories
 * - bestConfig: Best surface configuration found
 * - foundSolution: Boolean indicating if solution was found
 * - temperature: Current temperature for simulated annealing (1.0 to 0.0)
 * - mode: 'explore' or 'refine'
 *
 * Algorithm:
 * - Uses simulated annealing with temperature cooling
 * - First surface gets smart placement below ball toward target
 * - Learns from errors using recent failure vectors
 * - Explores widely at high temperature, refines at low temperature
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

            // Use StateController recovery if available
            if (this.game.stateController) {
                this.game.stateController.recover();
            } else {
                // Fallback for backward compatibility
                alert('Solver encountered an error. Check browser console.');
            }
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
