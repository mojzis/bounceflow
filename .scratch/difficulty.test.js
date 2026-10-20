import { it } from 'vitest';
import { LEVELS } from '../src/levels.js';
import { simulateLevel } from '../src/game/simulateLevel.js';
console.warn = () => {};
const N = Number(process.env.N || 400);
const ids = (process.env.IDS || '').split(',').filter(Boolean).map(Number);
const levels = ids.length ? LEVELS.filter(l => ids.includes(l.id)) : LEVELS.filter(l => l.id < 15 || l.trueElasticity);
function rnd(level) {
  return level.surfaces.map(s => s.locked ? {} : {
    x: Math.round(60 + Math.random() * 840),
    y: Math.round(level.ballStart.y + 40 + Math.random() * Math.max(50, 640 - level.ballStart.y)),
    angle: Math.round(-70 + Math.random() * 140)
  });
}
it('difficulty', () => {
  const out = [];
  for (const level of levels) {
    const def = simulateLevel(level).success;
    let wins = 0; let best = null;
    for (let i = 0; i < N; i++) {
      const o = rnd(level);
      const r = simulateLevel(level, { surfaces: o });
      if (r.success) { wins++; if (!best) best = o.filter(x => x.x !== undefined); }
    }
    out.push(`L${level.id} ${level.name.padEnd(20)} default:${def ? 'WIN ' : 'no  '} random:${(100 * wins / N).toFixed(1)}%  ${best ? JSON.stringify(best) : ''}`);
  }
  process.stdout.write('\n' + out.join('\n') + '\n');
}, 3600000);
