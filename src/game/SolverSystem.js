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
import { getLevel } from '../levels.js';
import { simulateLevel } from './simulateLevel.js';
import { surfaceAngle } from '../utils.js';

const EXPLORE_ATTEMPTS = 300;
const REFINE_ATTEMPTS = 120;
const ATTEMPTS_PER_TICK = 5;
// Share of explore attempts that ignore the heuristics and try anywhere
const WILD_GUESS_RATE = 0.3;

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

        // Start solver loop
        this.runStep();
    }

    stop() {
        this.running = false;
    }

    maxAttempts() {
        return this.mode === 'refine' ? REFINE_ATTEMPTS : EXPLORE_ATTEMPTS;
    }

    runStep() {
        if (!this.running) return;

        try {
            // A few simulations per tick: quick enough to find solutions
            // on harder levels, slow enough to watch the attempts
            for (let i = 0; i < ATTEMPTS_PER_TICK && this.running; i++) {
                this.tryOneConfig();
            }
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

        if (this.running) {
            setTimeout(() => this.runStep(), 100);
        }
    }

    tryOneConfig() {
        const level = getLevel(this.game.currentLevel);
        const maxAttempts = this.maxAttempts();

        // Update temperature (cool down linearly in explore mode)
        if (this.mode === 'explore') {
            this.temperature = Math.max(0, 1.0 - (this.currentAttempt / maxAttempts));
        }

        const config = this.generateRandomConfig(level);
        const result = this.simulateConfiguration(config, level);

        this.attempts.push({
            config: config,
            trajectory: result.trajectory,
            success: result.success,
            closestDistance: result.closestDistance,
            collisionData: result.collisionData
        });
        // Only recent attempts are drawn; don't keep hundreds of paths
        if (this.attempts.length > 40) {
            const keep = this.attempts.filter(a => a.config === this.bestConfig);
            this.attempts = [...keep, ...this.attempts.slice(-30).filter(a => !keep.includes(a))];
        }

        // Track error vector for learning
        if (!result.success && result.trajectory.length > 0) {
            const ballFinalPos = result.trajectory[result.trajectory.length - 1];
            let nearestTarget = this.game.targets[0];
            let minDist = Infinity;

            this.game.targets.forEach(target => {
                const dist = Math.hypot(target.x - ballFinalPos.x, target.y - ballFinalPos.y);
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

        if (result.success) {
            console.log('✅ SOLUTION FOUND after', this.currentAttempt, 'attempts!');
            this.bestConfig = config;
            this.foundSolution = true;
            this.running = false;
            return;
        }

        if (!this.bestConfig || result.closestDistance < this.bestDistance) {
            this.bestConfig = config;
            this.bestDistance = result.closestDistance;
        }

        if (this.currentAttempt >= maxAttempts) {
            this.running = false;
        }
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
        // Smart placement goes to the first surface the player can move
        // (on some levels the first surface is a locked obstacle)
        const firstMovable = baseConfig.findIndex(s => !s.locked);
        const wildGuess = this.mode === 'explore' && Math.random() < WILD_GUESS_RATE;

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

            if (wildGuess) {
                return this.wildSurface(surface, level);
            }

            let baseX, baseY, baseAngle;

            if (this.mode === 'explore') {
                if (index === firstMovable) {
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
            if (this.mode === 'explore' && index === firstMovable) {
                const ballY = level.ballStart.y;
                finalY = Math.max(ballY - 20, finalY);
            }

            // Whole pixels and degrees, so the player can copy the hint exactly
            return {
                x: Math.round(finalX),
                y: Math.round(finalY),
                width: surface.width,
                angle: surfaceAngle(finalAngle),
                locked: false
            };
        });

        return config;
    }

    /**
     * Anywhere between the ball's height and the bottom of the level area
     */
    wildSurface(surface, level) {
        const width = Math.min(this.game.canvas.width, 900);
        const height = Math.min(this.game.canvas.height, 700);
        const top = level.ballStart.y + 40;
        return {
            x: Math.round(60 + Math.random() * (width - 120)),
            y: Math.round(top + Math.random() * Math.max(50, height - 60 - top)),
            width: surface.width,
            angle: surfaceAngle(-70 + Math.random() * 140),
            locked: false
        };
    }

    /**
     * Plays the config with the game's own entities and mechanics, so a
     * solution found here also works when the player copies it. The hook
     * stays steady once the solver is used (see Game.hookSways).
     */
    simulateConfiguration(config, level) {
        const targets = this.game.targets;
        const result = simulateLevel(level, {
            surfaces: config.map(s => (s.locked ? {} : { x: s.x, y: s.y, angle: s.angle })),
            targets: targets.map(t => ({ x: t.x, y: t.y })),
            width: this.game.canvas.width,
            height: this.game.canvas.height,
            maxFrames: 420
        });

        // Score: stars missed count most, then how close the ball came to one
        let closest = 0;
        const missed = targets.filter((t, i) => !result.collected.includes(i));
        if (missed.length > 0) {
            closest = Infinity;
            result.path.forEach(p => missed.forEach(t => {
                closest = Math.min(closest, Math.hypot(p.x - t.x, p.y - t.y));
            }));
        }

        return {
            trajectory: result.path,
            success: result.success,
            closestDistance: closest + missed.length * 1000,
            collisionData: result.impacts
        };
    }
}
