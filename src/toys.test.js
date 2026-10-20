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
    // World 1: a toy on every level after the first, combined from level 8
    2: [{ x: 162, y: 249, angle: 20 }],
    3: [{ x: 147, y: 275, angle: 25 }],
    4: [{ x: 190, y: 589, angle: 12 }],
    5: [{ x: 163, y: 439, angle: 15 }],
    6: [{ x: 169, y: 507, angle: 21 }],
    7: [{ x: 204, y: 308, angle: 18 }],
    8: [{ x: 408, y: 360, angle: -50 }],
    9: [{ x: 135, y: 390, angle: 22 }],
    10: [{ x: 185, y: 141, angle: 11 }],
    11: [{ x: 86, y: 285, angle: 49 }],
    12: [{ x: 89, y: 230, angle: 40 }],
    13: [{ x: 156, y: 298, angle: 38 }],
    14: [{ x: 555, y: 191, angle: -21 }, { x: 771, y: 311, angle: 41 }],
    // World 3: toys combined
    25: [{ x: 374, y: 317, angle: -2 }],
    26: [{ x: 231, y: 290, angle: 17 }, { x: 321, y: 476, angle: 14 }],
    27: [{ x: 227, y: 264, angle: 15 }],
    28: [{ x: 160, y: 468, angle: 15 }, { x: 611, y: 203, angle: 53 }]
};

// What to take away to show the level needs its mechanic
const CONTROLS = {
    2: 'bumpers', 3: 'materials', 4: 'materials', 5: 'effects', 6: 'portals',
    7: 'effects', 8: 'bumpers', 9: 'effects', 10: 'portals', 11: 'bumpers',
    12: 'materials', 13: 'portals', 14: 'portals',
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
    } else if (kind === 'effects') {
        copy.targets.forEach(t => delete t.effect);
    } else {
        // 'bumpers', 'portals', 'fans', 'gates': take them away
        delete copy[kind];
    }
    return copy;
}

const toyLevels = LEVELS.filter(l => l.trueElasticity);

describe('Toy levels', () => {
    it('has a world intro for World 3', () => {
        expect(getWorldStartingAt(25)).toBe(WORLDS.find(w => w.id === 3));
        expect(getWorldStartingAt(26)).toBeNull();
    });

    it('has a toy on every World 1 level after the first', () => {
        expect(toyLevels.filter(l => l.id < 15).map(l => l.id)).toEqual(
            Array.from({ length: 13 }, (_, i) => i + 2)
        );
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

        it(`level ${level.id} (${level.name}) isn't won by its starting layout`, () => {
            HEIGHTS.forEach(height => {
                expect(simulateLevel(level, { height }).success, `height ${height}`).toBe(false);
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
