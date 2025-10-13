/**
 * LevelManager - Manages level loading, progression, and state
 *
 * Responsibilities:
 * - Load level data and create game entities (ball, surfaces, targets, bird)
 * - Clear/cleanup level entities and physics bodies
 * - Handle level progression (next level, game complete)
 * - Reset solver and replay state between levels
 * - Randomize target positions for variety
 *
 * Public API:
 * - loadLevel(levelId): Load and initialize a level
 * - clearLevel(): Clean up current level entities
 * - nextLevel(): Progress to next level or show game complete
 * - showGameComplete(): Display victory screen for beating all levels
 *
 * Features:
 * - Target randomization: spreads targets ±40px horizontal, ±25-49px vertical
 *   with physics-aware correlation (right = down, left = up) to maintain reachability
 * - Validates target spacing to prevent overlap
 * - Clears victory timers to prevent auto-advance conflicts
 * - Resets all game state (attempts, time, scoring, solver, replay)
 * - Creates bird obstacle with random spawn interval (5-10s)
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

        // Debug: log ball start position
        console.log(`Ball starts at (${level.ballStart.x.toFixed(1)}, ${level.ballStart.y.toFixed(1)})`);

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
                // Physics-aware randomization: create a "reachable zone"
                // If target moves right, it should move down (easier to reach with gravity)
                // If target moves left, it can move up (closer, more energy available)

                const xOffset = (Math.random() - 0.5) * 80; // ±40px horizontal

                // Calculate y offset based on x offset for physics realism
                // Moving right (+x) = should move down (+y)
                // Moving left (-x) = can move up (-y)
                const baseYOffset = (Math.random() - 0.5) * 50; // ±25px base
                const physicsCorrection = xOffset * 0.6; // Correlate y with x (60% correlation)

                randomX = targetData.x + xOffset;
                randomY = targetData.y + baseYOffset + physicsCorrection;

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

            // Debug: log target coordinates
            console.log(`Target created at (${randomX.toFixed(1)}, ${randomY.toFixed(1)}) - offset from base: (${(randomX - targetData.x).toFixed(1)}, ${(randomY - targetData.y).toFixed(1)})`);
        });

        // Create bird
        this.game.bird = new Bird(this.game.canvas.width, this.game.canvas.height);
        this.game.birdSpawnTimer = 0;
        this.game.birdSpawnInterval = 5000 + Math.random() * 5000;

        // Reset state using StateController
        this.game.stateController.transitionTo('MENU');
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
