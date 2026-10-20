/**
 * Level definitions for BounceFlow prototype
 *
 * Optional toy fields (see mechanics.js), used from World 1 on:
 * - surfaces[].material: 'normal' | 'trampoline' | 'sponge' | 'glass'
 * - targets[].effect: 'bouncy' | 'soft' | 'heavy' | 'light' (power star)
 * - targets[].fixed: true to skip position randomization (stars in boxes)
 * - gates: [{ x, y, width, angle, type: 'cyan' | 'red' }]
 * - fans: [{ x, y, width, height, dir: 'up'|'down'|'left'|'right', strength }]
 * - trueElasticity: bounce uses the ball's real elasticity
 * - ballElasticity: starting elasticity for static levels
 * - steadyHook: the hook doesn't sway before release (World 2+; World 1 never sways)
 */

export const LEVELS = [
    // WORLD 1: BOUNCING - Levels 1-14 (a new toy every other level)
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
        name: "Boing!",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 250, y: 380, width: 220, angle: 20, locked: false },
            { x: 500, y: 500, width: 260, angle: 0, locked: true, material: 'trampoline' }
        ],
        targets: [
            { x: 640, y: 260 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        ballElasticity: 0.6,
        hint: "The blue trampoline is extra springy - bounce the ball onto it to reach the star!"
    },
    {
        id: 4,
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
        id: 5,
        name: "Heavy Metal",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 230, y: 400, width: 220, angle: 20, locked: false },
            { x: 520, y: 400, width: 180, angle: 0, locked: true, material: 'glass' },
            { x: 440, y: 465, width: 120, angle: 90, locked: true },
            { x: 600, y: 465, width: 120, angle: 90, locked: true },
            { x: 520, y: 530, width: 180, angle: 0, locked: true }
        ],
        targets: [
            { x: 150, y: 260, effect: 'heavy' },
            { x: 520, y: 470, fixed: true }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        ballElasticity: 0.8,
        hint: "Stars with a ring change the ball. Grab the heavy star, then smash the glass!"
    },
    {
        id: 6,
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
        id: 7,
        name: "Feather Float",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 300, y: 420, width: 220, angle: 20, locked: false }
        ],
        fans: [
            { x: 470, y: 340, width: 260, height: 440, dir: 'up', strength: 1.3 }
        ],
        targets: [
            { x: 150, y: 260, effect: 'light' },
            { x: 480, y: 150 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        ballElasticity: 0.6,
        hint: "Fans blow light things away. Become light as a feather and ride the wind up!"
    },
    {
        id: 8,
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
        id: 9,
        name: "Power Star",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 260, y: 460, width: 240, angle: 20, locked: false }
        ],
        targets: [
            { x: 150, y: 260, effect: 'bouncy' },
            { x: 450, y: 350 }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        ballElasticity: 0.5,
        hint: "This ball is soft. Grab the bouncy star first, then bounce up to the other star!"
    },
    {
        id: 10,
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
        id: 11,
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
        id: 12,
        name: "Toy Box",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 260, y: 420, width: 200, angle: 20, locked: false },
            { x: 470, y: 560, width: 220, angle: -10, locked: true, material: 'trampoline' },
            { x: 650, y: 280, width: 160, angle: 0, locked: true, material: 'glass' },
            { x: 580, y: 340, width: 110, angle: 90, locked: true },
            { x: 720, y: 340, width: 110, angle: 90, locked: true },
            { x: 650, y: 400, width: 160, angle: 0, locked: true }
        ],
        targets: [
            { x: 150, y: 250, effect: 'heavy' },
            { x: 650, y: 350, fixed: true }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        ballElasticity: 0.6,
        hint: "Get heavy, bounce off the trampoline, and smash into the glass box!"
    },
    {
        id: 13,
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
        id: 14,
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
    // WORLD 2: ELASTICITY - Levels 15-24
    {
        id: 15,
        name: "The Wave Begins",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 400, y: 450, width: 300, angle: 0, locked: false }
        ],
        targets: [
            { x: 650, y: 200 }
        ],
        propertyPattern: 'wave',
        cycleSpeed: 0.0008,
        hint: "Watch the ball's color! Release when it's cyan (bouncy) to reach the high target."
    },
    {
        id: 16,
        name: "Low and High",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 300, y: 420, width: 250, angle: 0, locked: false },
            { x: 550, y: 350, width: 200, angle: 15, locked: false }
        ],
        targets: [
            { x: 400, y: 380 },
            { x: 680, y: 150 }
        ],
        propertyPattern: 'wave',
        cycleSpeed: 0.001,
        hint: "Collect the low star while red (low bounce), then wait for cyan to reach the high star!"
    },
    {
        id: 17,
        name: "Bounce Rhythm",
        ballStart: { x: 100, y: 150 },
        surfaces: [
            { x: 250, y: 450, width: 180, angle: 20, locked: false },
            { x: 450, y: 400, width: 180, angle: -15, locked: false },
            { x: 650, y: 350, width: 160, angle: 25, locked: false }
        ],
        targets: [
            { x: 350, y: 300 },
            { x: 650, y: 200 }
        ],
        propertyPattern: 'wave',
        cycleSpeed: 0.0012,
        hint: "Create a rhythm - each bounce happens at a different elasticity!"
    },
    {
        id: 18,
        name: "The Pulse",
        ballStart: { x: 200, y: 100 },
        surfaces: [
            { x: 400, y: 460, width: 280, angle: 5, locked: false },
            { x: 600, y: 300, width: 160, angle: -30, locked: false }
        ],
        targets: [
            { x: 700, y: 150 }
        ],
        propertyPattern: 'pulse',
        cycleSpeed: 0.001,
        hint: "Wait for the pulse! The ball briefly becomes super bouncy."
    },
    {
        id: 19,
        name: "Locked Rhythm",
        ballStart: { x: 150, y: 80 },
        surfaces: [
            { x: 300, y: 350, width: 200, angle: 0, locked: true },
            { x: 550, y: 350, width: 200, angle: 0, locked: true },
            { x: 425, y: 440, width: 150, angle: 45, locked: false },
            { x: 650, y: 250, width: 120, angle: -20, locked: false }
        ],
        targets: [
            { x: 500, y: 220 },
            { x: 730, y: 180 }
        ],
        propertyPattern: 'wave',
        cycleSpeed: 0.0011,
        hint: "Navigate through the gap - high elasticity helps you climb!"
    },
    {
        id: 20,
        name: "Double Pulse",
        ballStart: { x: 100, y: 100 },
        surfaces: [
            { x: 250, y: 420, width: 200, angle: 30, locked: false },
            { x: 450, y: 380, width: 180, angle: -25, locked: false },
            { x: 620, y: 320, width: 160, angle: 35, locked: false }
        ],
        targets: [
            { x: 350, y: 250 },
            { x: 550, y: 180 },
            { x: 700, y: 150 }
        ],
        propertyPattern: 'pulse',
        cycleSpeed: 0.0013,
        hint: "Three stars, multiple pulses - timing is everything!"
    },
    {
        id: 21,
        name: "Wave Maze",
        ballStart: { x: 400, y: 100 },
        surfaces: [
            { x: 250, y: 280, width: 180, angle: 20, locked: true },
            { x: 550, y: 280, width: 180, angle: -20, locked: true },
            { x: 200, y: 440, width: 160, angle: 50, locked: false },
            { x: 400, y: 450, width: 140, angle: 0, locked: false },
            { x: 600, y: 440, width: 160, angle: -50, locked: false }
        ],
        targets: [
            { x: 150, y: 220 },
            { x: 400, y: 200 },
            { x: 650, y: 220 }
        ],
        propertyPattern: 'wave',
        cycleSpeed: 0.0012,
        hint: "Plan your path through the maze - elasticity determines which route works!"
    },
    {
        id: 22,
        name: "Cascade Timing",
        ballStart: { x: 100, y: 50 },
        surfaces: [
            { x: 250, y: 200, width: 140, angle: -40, locked: true },
            { x: 400, y: 300, width: 140, angle: 40, locked: true },
            { x: 550, y: 400, width: 140, angle: -40, locked: true },
            { x: 300, y: 450, width: 120, angle: 35, locked: false },
            { x: 500, y: 470, width: 120, angle: -30, locked: false }
        ],
        targets: [
            { x: 180, y: 280 },
            { x: 480, y: 350 },
            { x: 680, y: 440 }
        ],
        propertyPattern: 'wave',
        cycleSpeed: 0.0014,
        hint: "The cascade creates a rhythm - flow with it!"
    },
    {
        id: 23,
        name: "Pulse Precision",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 280, y: 320, width: 180, angle: 0, locked: true },
            { x: 520, y: 320, width: 180, angle: 0, locked: true },
            { x: 250, y: 460, width: 180, angle: 55, locked: false },
            { x: 450, y: 440, width: 140, angle: -10, locked: false },
            { x: 650, y: 240, width: 120, angle: 25, locked: false }
        ],
        targets: [
            { x: 400, y: 240 },
            { x: 700, y: 150 }
        ],
        propertyPattern: 'pulse',
        cycleSpeed: 0.0015,
        hint: "Thread the needle during the pulse - precision required!"
    },
    {
        id: 24,
        name: "Elasticity Mastery",
        ballStart: { x: 50, y: 100 },
        surfaces: [
            { x: 180, y: 250, width: 160, angle: 40, locked: true },
            { x: 350, y: 350, width: 140, angle: -35, locked: true },
            { x: 520, y: 250, width: 160, angle: 30, locked: true },
            { x: 250, y: 460, width: 140, angle: 50, locked: false },
            { x: 420, y: 450, width: 120, angle: -15, locked: false },
            { x: 600, y: 400, width: 140, angle: 40, locked: false },
            { x: 400, y: 180, width: 100, angle: 0, locked: false }
        ],
        targets: [
            { x: 120, y: 200 },
            { x: 350, y: 280 },
            { x: 580, y: 180 },
            { x: 720, y: 320 }
        ],
        propertyPattern: 'wave',
        cycleSpeed: 0.0016,
        hint: "The ultimate elasticity challenge - use everything you've learned!"
    },
    // WORLD 3: MATERIALS & MASS - Levels 25-28
    {
        id: 25,
        name: "Squish",
        ballStart: { x: 150, y: 80 },
        surfaces: [
            { x: 200, y: 250, width: 160, angle: 30, locked: true, material: 'sponge' },
            { x: 400, y: 430, width: 180, angle: -20, locked: false },
            { x: 570, y: 420, width: 120, angle: 90, locked: true },
            { x: 730, y: 420, width: 120, angle: 90, locked: true },
            { x: 650, y: 490, width: 180, angle: 0, locked: true }
        ],
        gates: [
            { x: 650, y: 360, width: 150, angle: 0, type: 'red' }
        ],
        targets: [
            { x: 650, y: 430, fixed: true }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        trueElasticity: true,
        ballElasticity: 0.7,
        steadyHook: true,
        hint: "Red gates only open for soft balls. Squish the ball on the sponge first!"
    },
    {
        id: 26,
        name: "Charge Up",
        ballStart: { x: 120, y: 100 },
        surfaces: [
            { x: 160, y: 430, width: 160, angle: 15, locked: true, material: 'trampoline' },
            { x: 420, y: 450, width: 160, angle: -15, locked: false, material: 'trampoline' },
            { x: 600, y: 300, width: 140, angle: 30, locked: false },
            { x: 770, y: 125, width: 150, angle: 0, locked: true },
            { x: 770, y: 275, width: 150, angle: 0, locked: true },
            { x: 845, y: 200, width: 150, angle: 90, locked: true }
        ],
        gates: [
            { x: 700, y: 200, width: 140, angle: 90, type: 'cyan' }
        ],
        targets: [
            { x: 760, y: 200, fixed: true }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        trueElasticity: true,
        ballElasticity: 0.45,
        steadyHook: true,
        hint: "Cyan gates only open for bouncy balls. Each trampoline bounce charges the ball up!"
    },
    {
        id: 27,
        name: "Against the Wind",
        ballStart: { x: 150, y: 80 },
        surfaces: [
            { x: 250, y: 400, width: 180, angle: 25, locked: false },
            { x: 560, y: 515, width: 140, angle: 0, locked: true },
            { x: 480, y: 480, width: 70, angle: 90, locked: true },
            { x: 640, y: 480, width: 70, angle: 90, locked: true }
        ],
        fans: [
            { x: 560, y: 320, width: 420, height: 240, dir: 'left', strength: 1.5 }
        ],
        targets: [
            { x: 150, y: 230, effect: 'heavy' },
            { x: 560, y: 470, fixed: true }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        trueElasticity: true,
        ballElasticity: 0.7,
        steadyHook: true,
        hint: "The wind pushes the ball back. A heavy ball can punch right through it!"
    },
    {
        id: 28,
        name: "Materials Mastery",
        ballStart: { x: 120, y: 80 },
        surfaces: [
            { x: 180, y: 450, width: 170, angle: -10, locked: false, material: 'trampoline' },
            { x: 520, y: 380, width: 150, angle: 20, locked: false },
            { x: 400, y: 720, width: 440, angle: 90, locked: true },
            { x: 680, y: 420, width: 150, angle: 0, locked: true, material: 'glass' },
            { x: 600, y: 485, width: 120, angle: 90, locked: true },
            { x: 760, y: 485, width: 120, angle: 90, locked: true },
            { x: 680, y: 550, width: 180, angle: 0, locked: true }
        ],
        gates: [
            { x: 400, y: 250, width: 500, angle: 90, type: 'cyan' }
        ],
        targets: [
            { x: 520, y: 200, effect: 'heavy' },
            { x: 680, y: 490, fixed: true }
        ],
        propertyPattern: 'static',
        cycleSpeed: 0,
        trueElasticity: true,
        ballElasticity: 0.6,
        steadyHook: true,
        hint: "Charge up, pass the gate, get heavy, smash the glass. Use everything you know!"
    }
];

/**
 * Worlds and the intro screen shown before their first level.
 * World 1 starts the game, so it has no intro screen.
 */
export const WORLDS = [
    {
        id: 2,
        startLevel: 15,
        title: 'ELASTICITY',
        subtitle: 'When Bouncy Becomes a Variable',
        description: "The ball's bounce changes with time. Watch the colors, feel the rhythm, master the timing!",
        mechanics: [
            { name: 'Wave Pattern', text: 'Smooth oscillation between low and high elasticity' },
            { name: 'Pulse Pattern', text: 'Sudden spikes of super bounciness' }
        ]
    },
    {
        id: 3,
        startLevel: 25,
        title: 'MATERIALS & MASS',
        subtitle: 'Mix All the Toys',
        description: 'Remember the trampolines, glass, fans and power stars? Now they work together, with some new friends!',
        mechanics: [
            { name: 'Sponges (new)', text: 'Sponges soak up the bounce and make the ball soft' },
            { name: 'Color Gates (new)', text: 'Cyan gates let bouncy balls through, red gates let soft balls through' },
            { name: 'Trampolines', text: 'Each trampoline bounce charges the ball up' },
            { name: 'Power Stars, Glass & Fans', text: 'Heavy balls smash glass; light balls ride the wind' }
        ]
    }
];

/**
 * World 1 keeps the hook still so a good setup always works the same way.
 * From World 2 on it sways unless the level says steadyHook.
 */
export function hookSways(level) {
    return level.id >= WORLDS[0].startLevel && !level.steadyHook;
}

/**
 * World whose first level is levelId, or null.
 */
export function getWorldStartingAt(levelId) {
    return WORLDS.find(w => w.startLevel === levelId) || null;
}

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
