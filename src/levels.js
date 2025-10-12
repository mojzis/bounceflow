/**
 * Level definitions for BounceFlow prototype
 */

export const LEVELS = [
    {
        id: 1,
        name: "First Bounce",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 200, y: 500, width: 300, angle: 0, locked: true },
            { x: 500, y: 400, width: 250, angle: 30, locked: false }
        ],
        targets: [
            { x: 600, y: 200 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Tab to select • Q/E or ←/→ to rotate • WASD/arrows to move"
    },
    {
        id: 2,
        name: "Timing is Everything",
        ballStart: { x: 100, y: 100 },
        surfaces: [
            { x: 150, y: 500, width: 200, angle: 0, locked: true },
            { x: 400, y: 450, width: 180, angle: -20, locked: false },
            { x: 650, y: 400, width: 150, angle: 15, locked: false }
        ],
        targets: [
            { x: 700, y: 150 }
        ],
        propertyPattern: 'wave',
        cycleSpeed: 0.0015,
        hint: "Watch the elasticity change - timing matters!"
    },
    {
        id: 3,
        name: "The Climb",
        ballStart: { x: 100, y: 450 },
        surfaces: [
            { x: 150, y: 550, width: 250, angle: 0, locked: true },
            { x: 350, y: 400, width: 200, angle: 45, locked: false },
            { x: 550, y: 250, width: 180, angle: -30, locked: false }
        ],
        targets: [
            { x: 650, y: 100 }
        ],
        propertyPattern: 'wave',
        cycleSpeed: 0.002,
        hint: "Use high bounce to climb upward!"
    },
    {
        id: 4,
        name: "Double Target",
        ballStart: { x: 400, y: 100 },
        surfaces: [
            { x: 300, y: 450, width: 250, angle: 0, locked: false },
            { x: 550, y: 350, width: 150, angle: -45, locked: false },
            { x: 200, y: 300, width: 180, angle: 30, locked: false }
        ],
        targets: [
            { x: 150, y: 200 },
            { x: 650, y: 180 }
        ],
        propertyPattern: 'wave',
        cycleSpeed: 0.0018,
        hint: "Collect both stars - plan your path!"
    },
    {
        id: 5,
        name: "Rapid Changes",
        ballStart: { x: 100, y: 200 },
        surfaces: [
            { x: 150, y: 550, width: 200, angle: 0, locked: true },
            { x: 350, y: 450, width: 180, angle: 20, locked: false },
            { x: 550, y: 380, width: 160, angle: -25, locked: false },
            { x: 400, y: 250, width: 140, angle: 45, locked: false }
        ],
        targets: [
            { x: 300, y: 150 },
            { x: 600, y: 150 },
            { x: 450, y: 80 }
        ],
        propertyPattern: 'wave',
        cycleSpeed: 0.003,
        hint: "Properties change fast - adapt quickly!"
    }
];

/**
 * Get level by ID
 */
export function getLevel(levelId) {
    return LEVELS.find(level => level.id === levelId) || LEVELS[0];
}

/**
 * Get total number of levels
 */
export function getTotalLevels() {
    return LEVELS.length;
}
