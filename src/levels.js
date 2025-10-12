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
        hint: "Position the surface, then press Space to release the ball!",
        solution: [
            // Ball at x:150, surface width 300 extends ±150, so center at x:250 means x:100-400 (catches ball)
            { x: 280, y: 380, width: 300, angle: 28 }
        ]
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
        hint: "Use multiple surfaces to reach the target!",
        solution: [
            // Ball at x:100, width 200 (±100), center at 150 = x:50-250
            { x: 160, y: 350, width: 200, angle: 32 },
            { x: 520, y: 270, width: 180, angle: 22 }
        ]
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
        hint: "Angle surfaces to bounce upward to the target!",
        solution: [
            // Ball at x:100, width 200 (±100), center at 150 = x:50-250
            { x: 170, y: 430, width: 200, angle: 50 },
            { x: 480, y: 340, width: 180, angle: 28 }
        ]
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
        hint: "Collect both stars - adjust surfaces between bounces!",
        solution: [
            // Ball at x:400, width 250 (±125), center at 400 = x:275-525
            { x: 390, y: 390, width: 250, angle: -18 },
            { x: 620, y: 310, width: 150, angle: -28 },
            { x: 220, y: 250, width: 180, angle: 32 }
        ]
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
        hint: "Three stars! Master surface control to collect them all!",
        solution: [
            // Ball at x:100, width 180 (±90), center at 145 = x:55-235
            { x: 150, y: 360, width: 180, angle: 28 },
            { x: 420, y: 300, width: 160, angle: 18 },
            { x: 360, y: 240, width: 140, angle: 22 }
        ]
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
