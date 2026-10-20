import { it } from 'vitest';
import { evaluate, fmt } from './design_B_lib.js';
const base = { propertyPattern: 'static', cycleSpeed: 0, trueElasticity: true, steadyHook: true, hint: '' };
const C = {
  a: { ...base, id: 8, name: 'Pinball', ballStart: { x: 150, y: 80 }, ballElasticity: 0.6,
    surfaces: [ { x: 250, y: 420, width: 180, angle: -20, locked: false },
                { x: 600, y: 620, width: 220, angle: 0, locked: true, material: 'trampoline' } ],
    bumpers: [ { x: 420, y: 330, radius: 30 }, { x: 600, y: 200, radius: 26 } ],
    targets: [ { x: 760, y: 140, fixed: true } ] },
  b: { ...base, id: 8, name: 'Pinball', ballStart: { x: 150, y: 80 }, ballElasticity: 0.6,
    surfaces: [ { x: 300, y: 450, width: 180, angle: 20, locked: false },
                { x: 450, y: 620, width: 200, angle: 0, locked: true, material: 'trampoline' },
                { x: 700, y: 300, width: 160, angle: 0, locked: true },
                { x: 620, y: 230, width: 120, angle: 90, locked: true } ],
    bumpers: [ { x: 450, y: 300, radius: 30 } ],
    targets: [ { x: 720, y: 240, fixed: true } ] },
  c: { ...base, id: 8, name: 'Pinball', ballStart: { x: 150, y: 80 }, ballElasticity: 0.5,
    surfaces: [ { x: 260, y: 400, width: 170, angle: 15, locked: false },
                { x: 520, y: 560, width: 160, angle: -15, locked: true, material: 'trampoline' } ],
    bumpers: [ { x: 380, y: 250, radius: 28 }, { x: 640, y: 380, radius: 28 } ],
    targets: [ { x: 380, y: 130, fixed: true }, { x: 780, y: 260, fixed: true } ] },
};
const keys = (process.env.K || Object.keys(C).join('')).split('');
it('eval', () => { for (const k of keys) process.stdout.write('\n' + k + ' ' + fmt(8, evaluate(C[k], { N: Number(process.env.N || 400), kinds: ['bumpers', 'materials'] })) + '\n'); }, 3600000);
