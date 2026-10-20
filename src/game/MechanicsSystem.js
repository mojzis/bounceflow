/**
 * MechanicsSystem - Toy rules (materials, gates, fans, star effects) hooked into the physics engine
 *
 * Responsibilities:
 * - Set the bounce of every ball contact (materials, true elasticity)
 * - Trampolines charge the ball's elasticity, sponges drain it
 * - Heavy balls smash glass
 * - Color gates let matching balls pass through
 * - Fans push the ball (push is the same force for every weight)
 * - Power stars change the ball's elasticity or weight
 * - Bumpers kick the ball away at a fixed speed
 * - Clouds puff away after one bounce
 * - Portals move the ball to their other end, keeping its velocity
 *
 * No DOM access, so the same rules run in the game and in tests
 * (see simulateLevel.js).
 *
 * Public API:
 * - setLevel({ ball, surfaces, gates, fans, bumpers, portals, trueElasticity })
 * - beforeStep(): apply fan forces, call before Engine.update
 * - afterStep(): finish glass breaks, clouds, bumper kicks and portals; call after Engine.update
 * - applyStarEffect(target): call when a star is collected
 * - onEvent(type, data): optional callback for feedback (popups)
 */
import * as Matter from 'matter-js';
import {
    contactRestitution,
    breaksGlass,
    bumperKick,
    vanishesAfterBounce,
    getMaterial,
    STAR_EFFECTS
} from '../mechanics.js';

export class MechanicsSystem {
    constructor(engine, onEvent = null) {
        this.engine = engine;
        this.onEvent = onEvent;
        this.ball = null;
        this.surfaceByBody = new Map();
        this.gateByBody = new Map();
        this.fans = [];
        this.bumperByBody = new Map();
        this.portals = [];
        this.trueElasticity = false;
        this.pendingShatter = [];
        this.pendingVanish = [];
        this.pendingKick = null;
        this.lastGateBlock = new Map();
        this.glassHintShown = false;

        Matter.Events.on(engine, 'collisionStart', (event) => this.handleCollisionStart(event.pairs));
    }

    setLevel({ ball, surfaces = [], gates = [], fans = [], bumpers = [], portals = [], trueElasticity = false }) {
        this.ball = ball;
        this.trueElasticity = trueElasticity;
        this.fans = fans;
        this.bumperByBody = new Map(bumpers.map(b => [b.body, b]));
        this.portals = portals;
        this.pendingVanish = [];
        this.pendingKick = null;
        this.surfaceByBody = new Map(surfaces.map(s => [s.body, s]));
        this.gateByBody = new Map(gates.map(g => [g.body, g]));
        this.pendingShatter = [];
        this.lastGateBlock = new Map();
        this.glassHintShown = false;

        // Matter.js uses the higher restitution of the two bodies on later
        // contact frames, so plain surfaces must not exceed the ball's value
        if (trueElasticity) {
            surfaces.forEach(s => {
                if (getMaterial(s.material).restitution === null) {
                    s.body.restitution = 0;
                }
            });
        }
    }

    emit(type, data) {
        if (this.onEvent) this.onEvent(type, data);
    }

    beforeStep() {
        const ball = this.ball;
        if (!ball || !ball.isActive) return;
        const pos = ball.body.position;
        this.fans.forEach(fan => {
            if (fan.contains(pos.x, pos.y)) {
                Matter.Body.applyForce(ball.body, pos, fan.getForce());
            }
        });
    }

    afterStep() {
        if (this.pendingShatter.length > 0) {
            this.pendingShatter.forEach(surface => surface.shatter());
            this.pendingShatter = [];
        }
        // The ball already bounced off the cloud during this step
        if (this.pendingVanish.length > 0) {
            this.pendingVanish.forEach(surface => surface.vanish());
            this.pendingVanish = [];
        }

        const ball = this.ball;
        if (!ball || !ball.isActive) return;

        if (this.pendingKick) {
            const v = bumperKick(this.pendingKick, ball.body.position);
            Matter.Body.setVelocity(ball.body, v);
            this.pendingKick = null;
        }

        const pos = ball.body.position;
        for (const portal of this.portals) {
            const from = portal.entering(pos.x, pos.y);
            if (from < 0) continue;
            const to = 1 - from;
            const exit = portal.ends[to];
            const v = { x: ball.body.velocity.x, y: ball.body.velocity.y };
            Matter.Body.setPosition(ball.body, { x: exit.x, y: exit.y });
            Matter.Body.setVelocity(ball.body, v);
            portal.cooldownEnd = to;
            portal.flash = 1;
            ball.trailPoints = [];
            this.emit('portal', { portal, x: exit.x, y: exit.y });
            break;
        }
    }

    /**
     * A fresh ball: portals forget the last trip.
     */
    resetBall() {
        this.pendingKick = null;
        this.portals.forEach(p => p.reset());
    }

    handleCollisionStart(pairs) {
        const ball = this.ball;
        if (!ball || !ball.isActive) return;

        pairs.forEach(pair => {
            const ballBody = ball.body;
            if (pair.bodyA !== ballBody && pair.bodyB !== ballBody) return;
            const other = pair.bodyA === ballBody ? pair.bodyB : pair.bodyA;
            const e = ball.currentElasticity;
            const pos = { x: ballBody.position.x, y: ballBody.position.y };

            const gate = this.gateByBody.get(other);
            if (gate) {
                if (gate.isOpenFor(e)) {
                    pair.isSensor = true;
                    gate.flash = 1;
                } else {
                    pair.restitution = contactRestitution(e, 'normal', this.trueElasticity);
                    const now = this.engine.timing.timestamp;
                    if (now - (this.lastGateBlock.get(gate) ?? -Infinity) > 1500) {
                        this.lastGateBlock.set(gate, now);
                        gate.flash = 1;
                        this.emit('gateBlocked', { gate, ...pos });
                    }
                }
                return;
            }

            const bumper = this.bumperByBody.get(other);
            if (bumper) {
                pair.restitution = 0;
                this.pendingKick = bumper;
                bumper.hit();
                this.emit('bumper', { bumper, ...pos });
                return;
            }

            const surface = this.surfaceByBody.get(other);
            if (!surface) {
                // Walls and anything else behave like a plain surface
                pair.restitution = contactRestitution(e, 'normal', this.trueElasticity);
                return;
            }

            if (surface.material === 'glass') {
                if (breaksGlass(ball.weight)) {
                    pair.isSensor = true;
                    if (!this.pendingShatter.includes(surface)) {
                        this.pendingShatter.push(surface);
                        this.emit('smash', { surface, ...pos });
                    }
                    return;
                }
                if (!this.glassHintShown) {
                    this.glassHintShown = true;
                    this.emit('glassClink', { surface, ...pos });
                }
            }

            pair.restitution = contactRestitution(e, surface.material, this.trueElasticity);

            if (vanishesAfterBounce(surface.material) && !surface.broken) {
                if (!this.pendingVanish.includes(surface)) {
                    this.pendingVanish.push(surface);
                    this.emit('cloud', { surface, ...pos });
                }
            }

            const charge = getMaterial(surface.material).charge;
            if (charge !== 0) {
                ball.adjustElasticity(charge);
                surface.bounceFeedback();
                this.emit(surface.material, { surface, ...pos });
            }
        });
    }

    applyStarEffect(target) {
        const fx = STAR_EFFECTS[target.effect];
        if (!fx || !this.ball) return;
        if (fx.elasticity) this.ball.adjustElasticity(fx.elasticity);
        if (fx.weight) this.ball.setWeight(fx.weight);
        this.emit('star', { effect: target.effect, x: target.x, y: target.y });
    }
}
