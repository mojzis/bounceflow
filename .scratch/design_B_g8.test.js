import { it } from 'vitest';
import { search, R } from './design_B_gen.js';
const base = { propertyPattern: 'static', cycleSpeed: 0, trueElasticity: true, steadyHook: true, hint: '' };
function t8() {
  const sx = R(600, 820), sy = R(100, 260);
  return { ...base, id: 8, name: 'Pinball', ballStart: { x: 150, y: 80 }, ballElasticity: 0.6,
    surfaces: [ { x: 160, y: 460, width: 170, angle: -15, locked: false },
                { x: R(380, 700), y: R(560, 660), width: R(160, 220), angle: R(-15, 15), locked: true, material: 'trampoline' } ],
    bumpers: [ { x: R(300, 560), y: R(220, 460), radius: 28 }, { x: R(450, 800), y: R(250, 480), radius: 26 } ],
    targets: [ { x: sx, y: sy, fixed: true } ] };
}
it('g', () => { search(t8, ['bumpers', 'materials'], { tries: Number(process.env.T || 40) }); }, 3600000);
