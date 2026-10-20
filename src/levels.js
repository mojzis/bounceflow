/**
 * Level definitions for BounceFlow prototype
 *
 * Optional toy fields (see mechanics.js), used from World 1 on:
 * - surfaces[].material: 'normal' | 'trampoline' | 'sponge' | 'glass' | 'cloud'
 * - targets[].effect: 'bouncy' | 'soft' | 'heavy' | 'light' (power star)
 * - targets[].fixed: true to skip position randomization (stars in boxes)
 * - gates: [{ x, y, width, angle, type: 'cyan' | 'red' }]
 * - fans: [{ x, y, width, height, dir: 'up'|'down'|'left'|'right', strength }]
 * - bumpers: [{ x, y, radius }] (kick the ball away at a fixed speed)
 * - portals: [{ a: { x, y }, b: { x, y } }] (in one end, out the other)
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
        propertyPattern: "static",
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        id: 2,
        name: "Bonk!",
        ballStart: { x: 150, y: 100 },
        ballElasticity: 0.6,
        surfaces: [
            { x: 560, y: 520, width: 200, angle: 10, locked: false }
        ],
        bumpers: [
            { x: 300, y: 420, radius: 44 }
        ],
        targets: [
            { x: 420, y: 260 }
        ],
        hint: "Pink bumpers kick the ball away - BONK! Roll the ball into the bumper to reach the high star."
    },
    {
        propertyPattern: "static",
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        id: 3,
        name: "Boing!",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 250, y: 380, width: 220, angle: 20, locked: false },
            { x: 500, y: 500, width: 240, angle: 0, locked: true, material: "trampoline" }
        ],
        targets: [
            { x: 660, y: 200 }
        ],
        ballElasticity: 0.6,
        hint: "The blue trampoline is extra springy - bounce the ball onto it to reach the star!"
    },
    {
        propertyPattern: "static",
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        id: 4,
        name: "Cloud Hop",
        ballStart: { x: 150, y: 100 },
        ballElasticity: 0.75,
        surfaces: [
            { x: 250, y: 300, width: 180, angle: 20, locked: false },
            { x: 560, y: 450, width: 220, angle: 0, locked: true, material: "cloud" },
            { x: 440, y: 520, width: 130, angle: 90, locked: true },
            { x: 680, y: 520, width: 130, angle: 90, locked: true },
            { x: 560, y: 590, width: 260, angle: 0, locked: true },
            { x: 680, y: 330, width: 180, angle: 90, locked: true }
        ],
        targets: [
            { x: 380, y: 330 },
            { x: 560, y: 530, fixed: true }
        ],
        hint: "Clouds hold the ball for just one bounce - then POOF! Grab the first star, bounce on the cloud, and drop into the box."
    },
    {
        propertyPattern: "static",
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        id: 5,
        name: "Heavy Metal",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 300, y: 450, width: 200, angle: -15, locked: false },
            { x: 540, y: 400, width: 180, angle: 0, locked: true, material: "glass" },
            { x: 450, y: 465, width: 120, angle: 90, locked: true },
            { x: 630, y: 465, width: 120, angle: 90, locked: true },
            { x: 540, y: 530, width: 200, angle: 0, locked: true }
        ],
        targets: [
            { x: 220, y: 280, effect: "heavy" },
            { x: 540, y: 470, fixed: true }
        ],
        ballElasticity: 0.8,
        hint: "Stars with a ring change the ball. Grab the heavy star, then smash the glass box!"
    },
    {
        propertyPattern: "static",
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        id: 6,
        name: "Portal",
        ballStart: { x: 150, y: 100 },
        ballElasticity: 0.6,
        surfaces: [
            { x: 300, y: 420, width: 200, angle: 15, locked: false },
            { x: 720, y: 100, width: 160, angle: 0, locked: true },
            { x: 640, y: 175, width: 150, angle: 90, locked: true },
            { x: 800, y: 175, width: 150, angle: 90, locked: true },
            { x: 720, y: 250, width: 160, angle: 0, locked: true }
        ],
        portals: [
            { a: { x: 600, y: 600 }, b: { x: 720, y: 150 } }
        ],
        targets: [
            { x: 720, y: 200, fixed: true }
        ],
        hint: "Go into one portal and pop out of the other! The star is locked in a box - can you get in?"
    },
    {
        propertyPattern: "static",
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        id: 7,
        name: "Feather Float",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 300, y: 420, width: 220, angle: 20, locked: false }
        ],
        fans: [
            { x: 500, y: 320, width: 200, height: 480, dir: "up", strength: 1.3 }
        ],
        targets: [
            { x: 150, y: 260, effect: "light" },
            { x: 520, y: 120 }
        ],
        ballElasticity: 0.6,
        hint: "Fans blow light things away. Grab the feather star and ride the wind up!"
    },
    {
        id: 8,
        name: "Pinball",
        ballStart: { x: 150, y: 80 },
        surfaces: [
            { x: 330, y: 520, width: 160, angle: 20, locked: false },
            { x: 236, y: 653, width: 191, angle: 4, locked: true, material: "trampoline" },
            { x: 517, y: 453.5, width: 493, angle: 90, locked: true },
            { x: 720, y: 660, width: 400, angle: 0, locked: true }
        ],
        bumpers: [
            { x: 339, y: 356, radius: 28 }
        ],
        targets: [
            { x: 797, y: 445, fixed: true }
        ],
        propertyPattern: "static",
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        ballElasticity: 0.6,
        hint: "Pinball! Bounce on the trampoline and let the pink bumper flick the ball over the wall."
    },
    {
        propertyPattern: "static",
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        id: 9,
        name: "Power Star",
        ballStart: { x: 150, y: 100 },
        surfaces: [
            { x: 260, y: 460, width: 240, angle: 20, locked: false }
        ],
        targets: [
            { x: 150, y: 260, effect: "bouncy" },
            { x: 530, y: 370 }
        ],
        ballElasticity: 0.5,
        hint: "This ball is soft. Grab the bouncy star first, then bounce over to the other star!"
    },
    {
        id: 10,
        name: "Cloud Lid",
        ballStart: { x: 150, y: 80 },
        surfaces: [
            { x: 160, y: 460, width: 170, angle: -15, locked: false },
            { x: 459, y: 418, width: 170, angle: 0, locked: true, material: "cloud" },
            { x: 374, y: 508, width: 160, angle: 90, locked: true },
            { x: 544, y: 508, width: 160, angle: 90, locked: true },
            { x: 459, y: 588, width: 190, angle: 0, locked: true }
        ],
        portals: [
            { a: { x: 677, y: 557 }, b: { x: 402, y: 194 } }
        ],
        targets: [
            { x: 459, y: 518, fixed: true }
        ],
        propertyPattern: "static",
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        ballElasticity: 0.62,
        hint: "The star is under a cloud lid! Clouds puff away after one bounce - pop it, then take the portal back over the top."
    },
    {
        id: 11,
        name: "Updraft",
        ballStart: { x: 120, y: 80 },
        surfaces: [
            { x: 330, y: 600, width: 170, angle: -15, locked: false }
        ],
        bumpers: [
            { x: 286, y: 524, radius: 28 }
        ],
        fans: [
            { x: 594, y: 420, width: 189, height: 480, dir: "up", strength: 1.3 }
        ],
        targets: [
            { x: 120, y: 210, effect: "light", fixed: true },
            { x: 611, y: 121, fixed: true }
        ],
        propertyPattern: "static",
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        ballElasticity: 0.6,
        hint: "Get light as a feather, then let the bumper bonk the ball over to the fan!"
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
        propertyPattern: "static",
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        id: 13,
        name: "Chain Reaction",
        ballStart: { x: 120, y: 120 },
        surfaces: [
            { x: 250, y: 470, width: 180, angle: -15, locked: false },
            { x: 420, y: 620, width: 260, angle: -5, locked: true, material: "trampoline" },
            { x: 750, y: 60, width: 280, angle: 0, locked: true },
            { x: 620, y: 165, width: 210, angle: 90, locked: true },
            { x: 880, y: 165, width: 210, angle: 90, locked: true },
            { x: 750, y: 280, width: 240, angle: 0, locked: true, material: "cloud" }
        ],
        portals: [
            { a: { x: 540, y: 290 }, b: { x: 680, y: 110 } }
        ],
        targets: [
            { x: 750, y: 230, fixed: true },
            { x: 750, y: 470, fixed: true }
        ],
        ballElasticity: 0.35,
        hint: "Bounce on the trampoline into the orange portal. The cloud floor only holds for one bounce!"
    },
    {
        propertyPattern: "static",
        cycleSpeed: 0,
        trueElasticity: true,
        steadyHook: true,
        id: 14,
        name: "Grand Finale",
        ballStart: { x: 700, y: 120 },
        surfaces: [
            { x: 560, y: 450, width: 160, angle: 20, locked: false },
            { x: 760, y: 380, width: 140, angle: -20, locked: false },
            { x: 520, y: 630, width: 240, angle: 5, locked: true, material: "trampoline" },
            { x: 170, y: 60, width: 280, angle: 0, locked: true },
            { x: 40, y: 165, width: 210, angle: 90, locked: true },
            { x: 300, y: 165, width: 210, angle: 90, locked: true },
            { x: 170, y: 280, width: 240, angle: 0, locked: true, material: "cloud" },
            { x: 170, y: 520, width: 200, angle: 0, locked: true, material: "glass" },
            { x: 80, y: 585, width: 130, angle: 90, locked: true },
            { x: 260, y: 585, width: 130, angle: 90, locked: true },
            { x: 170, y: 650, width: 200, angle: 0, locked: true }
        ],
        bumpers: [
            { x: 380, y: 450, radius: 30 }
        ],
        portals: [
            { a: { x: 380, y: 260 }, b: { x: 240, y: 110 } }
        ],
        targets: [
            { x: 120, y: 230, effect: "heavy", fixed: true },
            { x: 170, y: 590, fixed: true }
        ],
        ballElasticity: 0.35,
        hint: "Everything at once: trampoline, portal, heavy star... then smash the glass!"
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
            { x: 160, y: 430, width: 160, angle: 15, locked: true, material: "trampoline" },
            { x: 420, y: 450, width: 160, angle: -15, locked: false, material: "trampoline" },
            { x: 600, y: 300, width: 140, angle: 30, locked: false },
            { x: 770, y: 125, width: 150, angle: 0, locked: true },
            { x: 770, y: 275, width: 150, angle: 0, locked: true },
            { x: 845, y: 200, width: 150, angle: 90, locked: true }
        ],
        gates: [
            { x: 700, y: 200, width: 140, angle: 90, type: "cyan" }
        ],
        targets: [
            { x: 760, y: 200, fixed: true }
        ],
        propertyPattern: "static",
        cycleSpeed: 0,
        trueElasticity: true,
        ballElasticity: 0.3,
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
