/**
 * World 3 levels: each one has a known solution, and removing the level's
 * key mechanic breaks that solution (so the mechanic really matters).
 *
 * Solutions were found with a random search over the movable surfaces
 * and checked to tolerate small nudges. They run at two window heights
 * so no solution relies on bouncing off the bottom of the screen.
 */

import { describe, it, expect, vi } from 'vitest';
import { LEVELS, WORLDS, getWorldStartingAt } from './levels.js';
import { simulateLevel } from './game/simulateLevel.js';

vi.spyOn(console, 'warn').mockImplementation(() => {});

// Movable surface positions, in order of the level's unlocked surfaces
const SOLUTIONS = {
    26: [{ x: 175, y: 324, angle: 26 }],
    27: [{ x: 374, y: 317, angle: -2 }],
    28: [{ x: 566, y: 362, angle: -10 }, { x: 605, y: 174, angle: -27 }],
    29: [{ x: 210, y: 362, angle: 23 }],
    30: [{ x: 185, y: 306, angle: 26 }],
    31: [{ x: 153, y: 294, angle: 34 }],
    32: [{ x: 227, y: 264, angle: 15 }],
    33: [{ x: 160, y: 468, angle: 15 }, { x: 611, y: 203, angle: 53 }]
};

// What to take away to show the level needs its mechanic
const CONTROLS = {
    26: 'materials', 27: 'materials', 28: 'materials', 29: 'effects',
    30: 'effects', 31: 'effects', 32: 'effects', 33: 'materials'
};

const HEIGHTS = [800, 1100];

function toOverrides(level, solution) {
    let k = 0;
    return level.surfaces.map(s => (s.locked ? {} : solution[k++]));
}

function withoutMechanic(level, kind) {
    const copy = structuredClone(level);
    if (kind === 'materials') {
        copy.surfaces.forEach(s => { if (s.material !== 'glass') delete s.material; });
    } else {
        copy.targets.forEach(t => delete t.effect);
    }
    return copy;
}

const world3 = LEVELS.filter(l => l.id >= 26);

describe('World 3 levels', () => {
    it('has a world intro for World 3', () => {
        expect(getWorldStartingAt(26)).toBe(WORLDS.find(w => w.id === 3));
        expect(getWorldStartingAt(27)).toBeNull();
    });

    it('has a known solution for every level', () => {
        expect(world3.map(l => l.id).sort()).toEqual(Object.keys(SOLUTIONS).map(Number));
    });

    world3.forEach(level => {
        const overrides = toOverrides(level, SOLUTIONS[level.id]);

        it(`level ${level.id} (${level.name}) can be solved`, () => {
            HEIGHTS.forEach(height => {
                const result = simulateLevel(level, { surfaces: overrides, height });
                expect(result.success, `height ${height}`).toBe(true);
            });
        });

        it(`level ${level.id} (${level.name}) needs its ${CONTROLS[level.id]}`, () => {
            const control = withoutMechanic(level, CONTROLS[level.id]);
            HEIGHTS.forEach(height => {
                const result = simulateLevel(control, { surfaces: overrides, height });
                expect(result.success, `height ${height}`).toBe(false);
            });
        });
    });
});
