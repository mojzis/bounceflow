/**
 * Unit tests for toy mechanics rules and their physics behavior
 */

import { describe, it, expect, vi } from 'vitest';
import * as Matter from 'matter-js';
import {
    contactRestitution,
    gateIsOpen,
    breaksGlass,
    LEGACY_RESTITUTION
} from './mechanics.js';
import { Ball } from './ball.js';
import { simulateLevel } from './game/simulateLevel.js';

vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('contactRestitution', () => {
    it('keeps old levels at the legacy bounce', () => {
        expect(contactRestitution(0.3, 'normal', false)).toBe(LEGACY_RESTITUTION);
    });

    it('uses the ball elasticity in true-elasticity levels', () => {
        expect(contactRestitution(0.3, 'normal', true)).toBe(0.3);
        expect(contactRestitution(0.8, 'glass', true)).toBe(0.8);
    });

    it('gives trampolines and sponges their own bounce', () => {
        expect(contactRestitution(0.3, 'trampoline', true)).toBeGreaterThan(1);
        expect(contactRestitution(0.9, 'sponge', true)).toBeLessThan(0.3);
    });
});

describe('gates and glass', () => {
    it('opens cyan gates only for bouncy balls', () => {
        expect(gateIsOpen('cyan', 0.75)).toBe(true);
        expect(gateIsOpen('cyan', 0.6)).toBe(false);
    });

    it('opens red gates only for soft balls', () => {
        expect(gateIsOpen('red', 0.45)).toBe(true);
        expect(gateIsOpen('red', 0.6)).toBe(false);
    });

    it('lets only heavy balls break glass', () => {
        expect(breaksGlass('heavy')).toBe(true);
        expect(breaksGlass('normal')).toBe(false);
        expect(breaksGlass('light')).toBe(false);
    });
});

describe('Ball', () => {
    const makeBall = () => {
        const engine = Matter.Engine.create();
        return { engine, ball: new Ball(100, 100, 20, engine.world) };
    };

    it('moves after release (finite mass, no NaN)', () => {
        const { engine, ball } = makeBall();
        ball.activate();
        for (let i = 0; i < 10; i++) Matter.Engine.update(engine, 1000 / 60);
        expect(Number.isFinite(ball.body.mass)).toBe(true);
        expect(Number.isFinite(ball.body.position.y)).toBe(true);
        expect(ball.body.position.y).toBeGreaterThan(100);
    });

    it('keeps elasticity within range when adjusted', () => {
        const { ball } = makeBall();
        ball.activate();
        ball.adjustElasticity(5);
        expect(ball.currentElasticity).toBe(1);
        ball.adjustElasticity(-5);
        expect(ball.currentElasticity).toBeCloseTo(0.2);
    });

    it('applies weight on release and resets it on reset', () => {
        const { ball } = makeBall();
        const normalMass = (() => { ball.activate(); return ball.body.mass; })();
        ball.setWeight('heavy');
        expect(ball.body.mass).toBeCloseTo(normalMass * 4);

        ball.reset(100, 100);
        expect(ball.weight).toBe('normal');
        ball.activate();
        expect(ball.body.mass).toBeCloseTo(normalMass);
    });
});

// Small test rooms built from level definitions
const room = (extra) => ({
    id: 99,
    name: 'Test room',
    ballStart: { x: 300, y: 100 },
    propertyPattern: 'static',
    cycleSpeed: 0,
    trueElasticity: true,
    ballElasticity: 0.6,
    steadyHook: true,
    surfaces: [],
    targets: [{ x: 1200, y: 50, fixed: true }], // out of reach: run all frames
    hint: '',
    ...extra
});

const run = (level, frames = 120) => simulateLevel(level, { maxFrames: frames });

describe('MechanicsSystem in physics', () => {
    it('trampoline bounces higher and charges the ball', () => {
        const floor = material => room({
            surfaces: [{ x: 300, y: 400, width: 300, angle: 0, locked: true, material }]
        });
        const peakAfterBounce = r => {
            const hit = r.path.findIndex((p, i) => i > 0 && p.y < r.path[i - 1].y);
            return Math.min(...r.path.slice(hit).map(p => p.y));
        };

        const normal = run(floor('normal'), 150);
        const tramp = run(floor('trampoline'), 150);
        expect(peakAfterBounce(tramp)).toBeLessThan(peakAfterBounce(normal) - 50);
        expect(tramp.events).toContain('trampoline');
        expect(tramp.path.at(-1).e).toBeCloseTo(0.75);
    });

    it('sponge soaks up the bounce', () => {
        const r = run(room({
            surfaces: [{ x: 300, y: 400, width: 300, angle: 0, locked: true, material: 'sponge' }]
        }), 150);
        expect(r.events).toContain('sponge');
        // First hit drains 0.25; the ball keeps resting on it after that
        const firstChange = r.path.find(p => p.e !== 0.6);
        expect(firstChange.e).toBeCloseTo(0.35);
    });

    it('heavy ball smashes glass, normal ball bounces off', () => {
        const glassRoom = (targets = [{ x: 1200, y: 50, fixed: true }]) => room({
            surfaces: [{ x: 300, y: 400, width: 300, angle: 0, locked: true, material: 'glass' }],
            targets
        });
        const heavyStar = [{ x: 300, y: 200, effect: 'heavy', fixed: true }, { x: 1200, y: 50, fixed: true }];

        const heavy = run(glassRoom(heavyStar), 150);
        expect(heavy.events).toContain('smash');
        expect(heavy.path.at(-1).y).toBeGreaterThan(450);

        const normal = run(glassRoom(), 150);
        expect(normal.events).not.toContain('smash');
        expect(normal.path.at(-1).y).toBeLessThan(400);
    });

    it('red gate blocks a bouncy ball and lets a soft ball through', () => {
        const gateRoom = e => room({
            ballElasticity: e,
            gates: [{ x: 300, y: 400, width: 200, angle: 0, type: 'red' }]
        });
        expect(run(gateRoom(0.9), 120).path.at(-1).y).toBeLessThan(400);
        expect(run(gateRoom(0.4), 120).path.at(-1).y).toBeGreaterThan(420);
    });

    it('fan pushes a light ball much further than a heavy one', () => {
        const fanRoom = effect => room({
            ballStart: { x: 300, y: 100 },
            // Wind starts below the power star so the weight is set first
            fans: [{ x: 300, y: 450, width: 600, height: 500, dir: 'right', strength: 1 }],
            targets: [{ x: 300, y: 160, effect, fixed: true }, { x: 1200, y: 50, fixed: true }]
        });
        const drift = r => r.path.at(-1).x - 300;
        const light = drift(run(fanRoom('light'), 90));
        const heavy = drift(run(fanRoom('heavy'), 90));
        expect(light).toBeGreaterThan(heavy * 4);
    });

    it('heavy and light balls fall equally fast without air', () => {
        const dropRoom = effect => room({
            targets: [{ x: 300, y: 105, effect, fixed: true }, { x: 1200, y: 50, fixed: true }]
        });
        // Light balls have air drag, so compare heavy with normal
        const heavy = run(dropRoom('heavy'), 40).path.at(-1).y;
        const normal = run(dropRoom(undefined), 40).path.at(-1).y;
        expect(heavy).toBeCloseTo(normal, 0);
    });
});
