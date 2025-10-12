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
        ballStart: { x: 100, y: 340 },
        surfaces: [
            { x: 350, y: 420, width: 200, angle: 45, locked: false },
            { x: 550, y: 350, width: 180, angle: -30, locked: false }
        ],
        targets: [
            { x: 650, y: 380 }
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
        ballStart: { x: 100, y: 150 },
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
    },
    {
        id: 6,
        name: "Obstacle Course",
        ballStart: { x: 200, y: 100 },
        surfaces: [
            { x: 300, y: 300, width: 250, angle: 0, locked: true },  // Locked obstacle
            { x: 400, y: 450, width: 200, angle: 30, locked: false },
            { x: 600, y: 350, width: 180, angle: -20, locked: false }
        ],
        targets: [
            { x: 700, y: 250 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Gray surfaces are locked - work around them!"
    },
    {
        id: 7,
        name: "Pinball",
        ballStart: { x: 100, y: 150 },
        surfaces: [
            { x: 250, y: 400, width: 160, angle: 45, locked: false },
            { x: 450, y: 450, width: 180, angle: -30, locked: true },
            { x: 600, y: 350, width: 140, angle: 60, locked: false },
            { x: 350, y: 250, width: 150, angle: -45, locked: true }
        ],
        targets: [
            { x: 200, y: 250 },
            { x: 700, y: 200 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Navigate through the pinball machine!"
    },
    {
        id: 8,
        name: "Narrow Gap",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 280, y: 350, width: 180, angle: 0, locked: true },
            { x: 520, y: 350, width: 180, angle: 0, locked: true },
            { x: 400, y: 450, width: 150, angle: 40, locked: false },
            { x: 650, y: 250, width: 120, angle: -25, locked: false }
        ],
        targets: [
            { x: 700, y: 180 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Thread the needle between the locked surfaces!"
    },
    {
        id: 9,
        name: "Chain Reaction",
        ballStart: { x: 100, y: 50 },
        surfaces: [
            { x: 250, y: 450, width: 180, angle: 35, locked: false },
            { x: 450, y: 380, width: 160, angle: -30, locked: false },
            { x: 600, y: 300, width: 150, angle: 45, locked: false },
            { x: 400, y: 200, width: 140, angle: -40, locked: false }
        ],
        targets: [
            { x: 250, y: 150 },
            { x: 550, y: 150 },
            { x: 400, y: 80 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Create a perfect chain of bounces!"
    },
    {
        id: 10,
        name: "Grand Finale",
        ballStart: { x: 400, y: 100 },
        surfaces: [
            { x: 280, y: 300, width: 180, angle: 0, locked: true },
            { x: 520, y: 300, width: 180, angle: 0, locked: true },
            { x: 200, y: 450, width: 180, angle: 50, locked: false },
            { x: 400, y: 450, width: 150, angle: 0, locked: false },
            { x: 600, y: 450, width: 180, angle: -50, locked: false },
            { x: 350, y: 200, width: 120, angle: -30, locked: false }
        ],
        targets: [
            { x: 150, y: 250 },
            { x: 300, y: 250 },
            { x: 650, y: 250 },
            { x: 500, y: 130 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "The ultimate challenge - collect all four stars!"
    },
    {
        id: 11,
        name: "Zigzag",
        ballStart: { x: 100, y: 80 },
        surfaces: [
            { x: 200, y: 200, width: 140, angle: -45, locked: true },
            { x: 380, y: 280, width: 140, angle: 45, locked: true },
            { x: 560, y: 360, width: 140, angle: -45, locked: true },
            { x: 300, y: 400, width: 120, angle: 30, locked: false },
            { x: 500, y: 450, width: 120, angle: -30, locked: false }
        ],
        targets: [
            { x: 680, y: 420 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Navigate the zigzag obstacle course!"
    },
    {
        id: 12,
        name: "The Catapult",
        ballStart: { x: 150, y: 80 },
        surfaces: [
            { x: 250, y: 470, width: 200, angle: 65, locked: false },
            { x: 500, y: 200, width: 180, angle: -20, locked: false },
            { x: 650, y: 350, width: 140, angle: 45, locked: false }
        ],
        targets: [
            { x: 700, y: 150 },
            { x: 400, y: 120 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Launch high with steep angles!"
    },
    {
        id: 13,
        name: "Precision Strike",
        ballStart: { x: 400, y: 100 },
        surfaces: [
            { x: 220, y: 280, width: 160, angle: 15, locked: true },
            { x: 580, y: 280, width: 160, angle: -15, locked: true },
            { x: 400, y: 420, width: 100, angle: 0, locked: false },
            { x: 300, y: 350, width: 80, angle: 30, locked: false },
            { x: 500, y: 350, width: 80, angle: -30, locked: false }
        ],
        targets: [
            { x: 400, y: 200 },
            { x: 250, y: 380 },
            { x: 550, y: 380 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Thread through tight gaps with precise angles!"
    },
    {
        id: 14,
        name: "Multi-Layer",
        ballStart: { x: 100, y: 100 },
        surfaces: [
            { x: 200, y: 200, width: 180, angle: 0, locked: true },
            { x: 200, y: 320, width: 180, angle: 0, locked: true },
            { x: 200, y: 440, width: 180, angle: 0, locked: true },
            { x: 450, y: 250, width: 120, angle: 45, locked: false },
            { x: 450, y: 380, width: 120, angle: -45, locked: false },
            { x: 650, y: 300, width: 100, angle: 30, locked: false }
        ],
        targets: [
            { x: 700, y: 150 },
            { x: 700, y: 350 },
            { x: 700, y: 450 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Bounce between the layers to collect all stars!"
    },
    {
        id: 15,
        name: "The Gauntlet",
        ballStart: { x: 50, y: 100 },
        surfaces: [
            { x: 150, y: 300, width: 140, angle: 50, locked: false },
            { x: 280, y: 450, width: 120, angle: -30, locked: true },
            { x: 420, y: 350, width: 140, angle: 40, locked: false },
            { x: 560, y: 250, width: 100, angle: -50, locked: true },
            { x: 680, y: 380, width: 120, angle: 35, locked: false },
            { x: 400, y: 180, width: 100, angle: 0, locked: false }
        ],
        targets: [
            { x: 200, y: 200 },
            { x: 450, y: 250 },
            { x: 680, y: 200 },
            { x: 750, y: 320 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        hint: "Master the gauntlet - precision and patience required!"
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
