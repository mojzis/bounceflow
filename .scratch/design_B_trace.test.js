import { it } from 'vitest';
import { simulateLevel } from '../src/game/simulateLevel.js';
console.warn = () => {};
const base = { propertyPattern: 'static', cycleSpeed: 0, trueElasticity: true, steadyHook: true, hint: '', targets: [{ x: 1200, y: 50, fixed: true }] };
const L = { ...base, id: 8, name: 't', ballStart: { x: 150, y: 80 }, ballElasticity: 0.6,
  surfaces: [ { x: 1000, y: 700, width: 50, angle: 0, locked: true } ],
  bumpers: [ { x: 165, y: 350, radius: 28 } ] };
it('t', () => {
  const r = simulateLevel(L, { maxFrames: 200 });
  process.stdout.write('\nEV ' + r.events.join(',') + '\n' + r.path.filter((p, i) => i % 8 === 0).map(p => `${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(' ') + '\n');
});
