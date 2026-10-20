/**
 * Builds the physics entities for a level. Shared by LevelManager (game)
 * and simulateLevel (tests) so both always use the same setup.
 */
import { Ball } from '../ball.js';
import { Surface } from '../surface.js';
import { Target } from '../target.js';
import { Gate } from '../gate.js';
import { Fan } from '../fan.js';
import { Bumper } from '../bumper.js';
import { Portal } from '../portal.js';

/**
 * @param {object} level - level definition
 * @param {object} world - Matter.js world
 * @param {Array<{x:number,y:number}>} targetPositions - final star positions
 * @param {Array<object>} [surfaceOverrides] - optional x/y/angle per surface
 */
export function buildLevelEntities(level, world, targetPositions, surfaceOverrides = null) {
    const ball = new Ball(level.ballStart.x, level.ballStart.y, 20, world);
    ball.setPropertyPattern(level.propertyPattern, level.cycleSpeed);
    if (typeof level.ballElasticity === 'number') {
        ball.setBaseElasticity(level.ballElasticity);
    }

    const surfaces = level.surfaces.map((data, i) => {
        const o = (surfaceOverrides && surfaceOverrides[i]) || {};
        return new Surface(
            o.x ?? data.x,
            o.y ?? data.y,
            data.width,
            o.angle ?? data.angle,
            data.locked,
            world,
            data.material || 'normal'
        );
    });

    const targets = level.targets.map((data, i) =>
        new Target(targetPositions[i].x, targetPositions[i].y, 25, data.effect || null)
    );

    const gates = (level.gates || []).map(g =>
        new Gate(g.x, g.y, g.width, g.angle || 0, g.type, world)
    );

    const fans = (level.fans || []).map(f =>
        new Fan(f.x, f.y, f.width, f.height, f.dir, f.strength ?? 1)
    );

    const bumpers = (level.bumpers || []).map(b =>
        new Bumper(b.x, b.y, b.radius ?? 28, world)
    );

    const portals = (level.portals || []).map(p => new Portal(p.a, p.b));

    return { ball, surfaces, targets, gates, fans, bumpers, portals };
}
