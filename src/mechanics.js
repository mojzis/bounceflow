/**
 * Toy mechanics: surface materials, star effects, ball weight, color gates.
 *
 * Pure data + functions (no DOM, no Matter.js) so rules are easy to test
 * and shared by the game and the headless level simulator.
 */

export const ELASTICITY_MIN = 0.2;
export const ELASTICITY_MAX = 1.0;

// Restitution used by plain surfaces/walls in older levels.
// Matter.js takes the higher restitution of the two bodies, so in those
// levels the ball's own elasticity is effectively ignored.
export const LEGACY_RESTITUTION = 0.99;

/**
 * Surface materials.
 * - restitution: fixed bounce for this material (null = use ball elasticity)
 * - charge: how much one hit changes the ball's elasticity
 */
export const MATERIALS = {
    normal:     { restitution: null, charge: 0,     color: '#2D2D2D', label: 'Normal' },
    trampoline: { restitution: 1.05, charge: 0.15,  color: '#4ECDC4', label: 'Trampoline' },
    sponge:     { restitution: 0.15, charge: -0.25, color: '#FF8C69', label: 'Sponge' },
    glass:      { restitution: null, charge: 0,     color: '#BEE9FF', label: 'Glass' },
    // Bounces like a plain surface, then puffs away (one bounce only)
    cloud:      { restitution: null, charge: 0,     color: '#FFFFFF', label: 'Cloud' }
};

/**
 * Ball weights. Gravity pulls every weight the same way (like in real life),
 * but pushes from fans and air drag affect light balls much more.
 */
export const WEIGHTS = {
    normal: { density: 0.001,  frictionAir: 0,     label: 'Normal' },
    heavy:  { density: 0.004,  frictionAir: 0,     label: 'Heavy' },
    light:  { density: 0.0003, frictionAir: 0.01,  label: 'Light' }
};

/**
 * Star effects applied to the ball when collected.
 */
export const STAR_EFFECTS = {
    bouncy: { elasticity: 0.3,  color: '#4ECDC4', text: 'Bouncy!' },
    soft:   { elasticity: -0.3, color: '#FF6B6B', text: 'Soft!' },
    heavy:  { weight: 'heavy',  color: '#8E8E9A', text: 'Heavy!' },
    light:  { weight: 'light',  color: '#F5F5FF', text: 'Light as a feather!' }
};

/**
 * Color gates: open only when the ball's elasticity matches.
 * - cyan gate: ball must be bouncy (elasticity >= 0.7)
 * - red gate: ball must be soft (elasticity <= 0.5)
 */
export const GATES = {
    cyan: { color: '#4ECDC4', test: e => e >= 0.7, text: 'Only bouncy balls pass' },
    red:  { color: '#FF6B6B', test: e => e <= 0.5, text: 'Only soft balls pass' }
};

// Speed a bumper kicks the ball away with (px per physics step),
// no matter how fast the ball hit it
export const BUMPER_SPEED = 10;

// Ball center within this distance of a portal enters it
export const PORTAL_RADIUS = 30;

// Constant fan force; acceleration = force / mass, so light balls fly
export const FAN_FORCE = 0.00038;

export function clampElasticity(e) {
    return Math.min(ELASTICITY_MAX, Math.max(ELASTICITY_MIN, e));
}

export function getMaterial(name) {
    return MATERIALS[name] || MATERIALS.normal;
}

/**
 * Bounce for a ball hitting a surface of the given material.
 * @param {number} ballElasticity - ball's current elasticity
 * @param {string} material - material name
 * @param {boolean} trueElasticity - level uses the ball's real elasticity
 */
export function contactRestitution(ballElasticity, material, trueElasticity) {
    const m = getMaterial(material);
    if (m.restitution !== null) return m.restitution;
    return trueElasticity ? ballElasticity : Math.max(ballElasticity, LEGACY_RESTITUTION);
}

export function gateIsOpen(gateType, ballElasticity) {
    const gate = GATES[gateType];
    return gate ? gate.test(ballElasticity) : false;
}

/**
 * Glass breaks only under a heavy ball.
 */
export function breaksGlass(weight) {
    return weight === 'heavy';
}

/**
 * Clouds puff away after the ball bounces off them once.
 */
export function vanishesAfterBounce(material) {
    return material === 'cloud';
}

/**
 * Velocity after a bumper hit: straight away from the bumper's center.
 */
export function bumperKick(bumper, ballPos, speed = BUMPER_SPEED) {
    const dx = ballPos.x - bumper.x;
    const dy = ballPos.y - bumper.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: (dx / len) * speed, y: (dy / len) * speed };
}

/**
 * Unit direction vector for a fan.
 */
export function fanDirection(dir) {
    switch (dir) {
        case 'down': return { x: 0, y: 1 };
        case 'left': return { x: -1, y: 0 };
        case 'right': return { x: 1, y: 0 };
        default: return { x: 0, y: -1 };
    }
}
