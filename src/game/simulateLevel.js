/**
 * Headless level run: plays a level with a given surface setup using the
 * real entities and mechanics, without any rendering or DOM.
 *
 * Used by tests to prove that every World 3 level can be solved.
 */
import * as Matter from 'matter-js';
import { PhysicsManager } from './PhysicsManager.js';
import { MechanicsSystem } from './MechanicsSystem.js';
import { buildLevelEntities } from './levelEntities.js';
import { LEGACY_RESTITUTION } from '../mechanics.js';

const FRAME_MS = 1000 / 60;

/**
 * @param {object} level - level definition
 * @param {object} [options]
 * @param {Array<object>} [options.surfaces] - x/y/angle overrides per surface
 * @param {number} [options.swayPhase] - hook sway phase (radians) at release
 * @param {Array<{x:number,y:number}>} [options.targets] - star positions
 * @param {number} [options.width] - canvas width
 * @param {number} [options.height] - canvas height
 * @param {number} [options.maxFrames] - frames before giving up
 * @returns {{ success: boolean, collected: number[], frames: number, events: string[], path: Array }}
 */
export function simulateLevel(level, options = {}) {
    const {
        surfaces: overrides = null,
        swayPhase = null,
        targets: targetPositions = level.targets,
        width = 1280,
        height = 800,
        maxFrames = 900
    } = options;

    const physics = new PhysicsManager({ width, height });
    physics.setWallRestitution(level.trueElasticity ? 0 : LEGACY_RESTITUTION);

    const events = [];
    const mechanics = new MechanicsSystem(physics.engine, type => events.push(type));
    const entities = buildLevelEntities(level, physics.world, targetPositions, overrides);
    const { ball, surfaces, targets, gates, fans } = entities;
    mechanics.setLevel({ ball, surfaces, gates, fans, trueElasticity: !!level.trueElasticity });

    // Mirror Game.startPlay(): hook sway (level 4+) offsets the start and
    // gives the ball a sideways push. The ball keeps swaying for the 300 ms
    // release animation, so position is sampled slightly later.
    let x = level.ballStart.x;
    let vx = 0;
    if (swayPhase !== null && level.id >= 4) {
        x += Math.sin(swayPhase + 300 / 800) * 10;
        vx = Math.cos(swayPhase) * 12.5 * 0.15;
    }
    Matter.Body.setPosition(ball.body, { x, y: level.ballStart.y });
    ball.activate();
    Matter.Body.setVelocity(ball.body, { x: vx, y: 0 });

    const collected = [];
    const path = [];
    let frames = 0;
    for (; frames < maxFrames; frames++) {
        mechanics.beforeStep();
        physics.update(FRAME_MS);
        mechanics.afterStep();
        ball.update(FRAME_MS);
        path.push({ x: ball.body.position.x, y: ball.body.position.y, e: ball.currentElasticity, w: ball.weight });

        targets.forEach((t, i) => {
            if (t.checkCollection(ball)) {
                collected.push(i);
                mechanics.applyStarEffect(t);
            }
        });

        if (collected.length === targets.length) break;
    }

    Matter.World.clear(physics.world);
    Matter.Engine.clear(physics.engine);

    return {
        success: collected.length === targets.length,
        collected,
        frames,
        events,
        path
    };
}
