/**
 * Unit tests for level definitions
 */

import { describe, it, expect } from 'vitest';
import { LEVELS, getLevel, getTotalLevels } from './levels.js';

describe('Level definitions', () => {
    it('should have at least one level', () => {
        expect(LEVELS.length).toBeGreaterThan(0);
    });

    it('should have consecutive IDs starting from 1', () => {
        LEVELS.forEach((level, index) => {
            expect(level.id).toBe(index + 1);
        });
    });

    it('should have all required properties', () => {
        LEVELS.forEach(level => {
            expect(level).toHaveProperty('id');
            expect(level).toHaveProperty('name');
            expect(level).toHaveProperty('ballStart');
            expect(level).toHaveProperty('surfaces');
            expect(level).toHaveProperty('targets');
            expect(level).toHaveProperty('propertyPattern');
            expect(level).toHaveProperty('cycleSpeed');
            expect(level).toHaveProperty('hint');
        });
    });

    it('should have valid ball start positions', () => {
        LEVELS.forEach(level => {
            expect(level.ballStart.x).toBeGreaterThan(0);
            expect(level.ballStart.y).toBeGreaterThan(0);
            expect(typeof level.ballStart.x).toBe('number');
            expect(typeof level.ballStart.y).toBe('number');
        });
    });

    it('should have at least one surface', () => {
        LEVELS.forEach(level => {
            expect(level.surfaces.length).toBeGreaterThan(0);
        });
    });

    it('should have at least one target', () => {
        LEVELS.forEach(level => {
            expect(level.targets.length).toBeGreaterThan(0);
        });
    });

    it('should have targets far enough apart to avoid overlap after randomization', () => {
        const targetRadius = 25; // From target.js
        const randomizationRange = 30; // From game.js: ±30 pixels
        const minSafeDistance = (targetRadius * 2) + (randomizationRange * 2); // 110px minimum

        LEVELS.forEach(level => {
            // Check each pair of targets
            for (let i = 0; i < level.targets.length; i++) {
                for (let j = i + 1; j < level.targets.length; j++) {
                    const t1 = level.targets[i];
                    const t2 = level.targets[j];

                    const dx = t2.x - t1.x;
                    const dy = t2.y - t1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < minSafeDistance) {
                        console.error(`Level ${level.id} (${level.name}): Targets ${i} and ${j} too close (${distance.toFixed(1)}px < ${minSafeDistance}px)`);
                        console.error('  Target 1:', t1);
                        console.error('  Target 2:', t2);
                    }

                    expect(distance).toBeGreaterThanOrEqual(minSafeDistance);
                }
            }
        });
    });

    it('should have valid surface definitions', () => {
        LEVELS.forEach(level => {
            level.surfaces.forEach(surface => {
                expect(surface).toHaveProperty('x');
                expect(surface).toHaveProperty('y');
                expect(surface).toHaveProperty('width');
                expect(surface).toHaveProperty('angle');
                expect(surface).toHaveProperty('locked');
                expect(typeof surface.width).toBe('number');
                expect(surface.width).toBeGreaterThan(0);
            });
        });
    });

    it('should not have overlapping surfaces', () => {
        LEVELS.forEach(level => {
            // Check each pair of surfaces for overlap
            for (let i = 0; i < level.surfaces.length; i++) {
                for (let j = i + 1; j < level.surfaces.length; j++) {
                    const s1 = level.surfaces[i];
                    const s2 = level.surfaces[j];

                    const overlaps = checkSurfaceOverlap(s1, s2);

                    if (overlaps) {
                        console.error(`Level ${level.id} (${level.name}): Surface ${i} overlaps with surface ${j}`);
                        console.error('  Surface 1:', s1);
                        console.error('  Surface 2:', s2);
                    }

                    expect(overlaps).toBe(false);
                }
            }
        });
    });
});

describe('Level helpers', () => {
    it('getLevel should return correct level', () => {
        const level1 = getLevel(1);
        expect(level1).toBeDefined();
        expect(level1.id).toBe(1);
    });

    it('getLevel should return first level for invalid ID', () => {
        const level = getLevel(999);
        expect(level).toBeDefined();
        expect(level.id).toBe(1);
    });

    it('getTotalLevels should return correct count', () => {
        expect(getTotalLevels()).toBe(LEVELS.length);
    });
});

/**
 * Check if two surfaces overlap
 * Uses oriented bounding box (OBB) collision detection
 */
function checkSurfaceOverlap(s1, s2) {
    const thickness = 20; // Surface thickness from surface.js

    // Get corners of both surfaces
    const corners1 = getSurfaceCorners(s1, thickness);
    const corners2 = getSurfaceCorners(s2, thickness);

    // Use Separating Axis Theorem (SAT)
    // Check if rectangles are separated along any axis
    const axes = [
        getPerpendicularAxis(s1.angle),
        getPerpendicularAxis(s1.angle + 90),
        getPerpendicularAxis(s2.angle),
        getPerpendicularAxis(s2.angle + 90)
    ];

    for (const axis of axes) {
        const projection1 = projectOntoAxis(corners1, axis);
        const projection2 = projectOntoAxis(corners2, axis);

        // If projections don't overlap, surfaces are separated
        if (projection1.max < projection2.min || projection2.max < projection1.min) {
            return false;
        }
    }

    // No separating axis found, surfaces overlap
    return true;
}

/**
 * Get the four corners of a surface
 */
function getSurfaceCorners(surface, thickness) {
    const angleRad = (surface.angle * Math.PI) / 180;
    const halfWidth = surface.width / 2;
    const halfThickness = thickness / 2;

    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Calculate corners relative to center, then add center position
    return [
        {
            x: surface.x + cos * halfWidth - sin * halfThickness,
            y: surface.y + sin * halfWidth + cos * halfThickness
        },
        {
            x: surface.x + cos * halfWidth + sin * halfThickness,
            y: surface.y + sin * halfWidth - cos * halfThickness
        },
        {
            x: surface.x - cos * halfWidth + sin * halfThickness,
            y: surface.y - sin * halfWidth - cos * halfThickness
        },
        {
            x: surface.x - cos * halfWidth - sin * halfThickness,
            y: surface.y - sin * halfWidth + cos * halfThickness
        }
    ];
}

/**
 * Get perpendicular axis for a given angle
 */
function getPerpendicularAxis(angleDeg) {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
        x: Math.cos(angleRad),
        y: Math.sin(angleRad)
    };
}

/**
 * Project corners onto an axis and return min/max
 */
function projectOntoAxis(corners, axis) {
    let min = Infinity;
    let max = -Infinity;

    for (const corner of corners) {
        const projection = corner.x * axis.x + corner.y * axis.y;
        min = Math.min(min, projection);
        max = Math.max(max, projection);
    }

    return { min, max };
}
