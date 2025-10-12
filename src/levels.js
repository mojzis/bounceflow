/**
 * Level definitions for BounceFlow prototype
 */

export const LEVELS = [
    {
        id: 1,
        name: "First Bounce",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 400, y: 450, width: 300, angle: 20, locked: false }
        ],
        targets: [
            { x: 650, y: 350 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Position the surface, then press Space to release the ball!"
    },
    {
        id: 2,
        name: "Double Bounce",
        ballStart: { x: 100, y: 100 },
        surfaces: [
            { x: 300, y: 400, width: 200, angle: -20, locked: false },
            { x: 600, y: 350, width: 180, angle: 15, locked: false }
        ],
        targets: [
            { x: 700, y: 250 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Use multiple surfaces to reach the target!"
    },
    {
        id: 3,
        name: "The Climb",
        ballStart: { x: 100, y: 450 },
        surfaces: [
            { x: 350, y: 400, width: 200, angle: 45, locked: false },
            { x: 550, y: 300, width: 180, angle: -30, locked: false }
        ],
        targets: [
            { x: 650, y: 280 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Angle surfaces to bounce upward to the target!"
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
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Collect both stars - adjust surfaces between bounces!"
    },
    {
        id: 5,
        name: "Triple Challenge",
        ballStart: { x: 100, y: 200 },
        surfaces: [
            { x: 350, y: 450, width: 180, angle: 20, locked: false },
            { x: 550, y: 380, width: 160, angle: -25, locked: false },
            { x: 400, y: 300, width: 140, angle: 45, locked: false }
        ],
        targets: [
            { x: 300, y: 250 },
            { x: 600, y: 250 },
            { x: 450, y: 180 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Three stars! Master surface control to collect them all!"
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
