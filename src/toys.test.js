/**
 * Toy levels (trampolines, glass, fans, power stars, gates...): each one has
 * a known solution, and removing the level's key mechanic breaks that
 * solution (so the mechanic really matters).
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
    // World 1: one new toy at a time
    3: [{ x: 84, y: 227, angle: 39 }],
    5: [{ x: 67, y: 324, angle: 20 }],
    7: [{ x: 100, y: 434, angle: 27 }],
    9: [{ x: 121, y: 353, angle: 25 }],
    12: [{ x: 89, y: 230, angle: 40 }],
    // World 3: toys combined
    25: [{ x: 374, y: 317, angle: -2 }],
    26: [{ x: 566, y: 362, angle: -10 }, { x: 605, y: 174, angle: -27 }],
    27: [{ x: 227, y: 264, angle: 15 }],
    28: [{ x: 160, y: 468, angle: 15 }, { x: 611, y: 203, angle: 53 }]
};

// What to take away to show the level needs its mechanic
const CONTROLS = {
    3: 'materials', 5: 'effects', 7: 'effects', 9: 'effects', 12: 'materials',
    25: 'materials', 26: 'materials', 27: 'effects', 28: 'materials'
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

const toyLevels = LEVELS.filter(l => l.trueElasticity);

describe('Toy levels', () => {
    it('has a world intro for World 3', () => {
        expect(getWorldStartingAt(25)).toBe(WORLDS.find(w => w.id === 3));
        expect(getWorldStartingAt(26)).toBeNull();
    });

    it('introduces toys in World 1', () => {
        expect(toyLevels.filter(l => l.id < 15).length).toBeGreaterThanOrEqual(4);
    });

    it('has a known solution for every level', () => {
        expect(toyLevels.map(l => l.id).sort((a, b) => a - b)).toEqual(Object.keys(SOLUTIONS).map(Number));
    });

    toyLevels.forEach(level => {
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
