import { it } from 'vitest';
import { L } from './design_A_levels.js';
import { rnd } from './design_A_lib.js';
import { simulateLevel } from '../src/game/simulateLevel.js';
it('probe', () => {
  for (const id of [2, 4]) {
    const lv = L[id]; const c = {}; let ev = {}; let minY = [];
    for (let i = 0; i < 600; i++) {
      const r = simulateLevel(lv, { surfaces: rnd(lv) });
      const k = r.collected.join('+') || 'none'; c[k] = (c[k] || 0) + 1;
      new Set(r.events).forEach(e => ev[e] = (ev[e] || 0) + 1);
      if (r.events.includes('bumper')) { const hi = r.events.indexOf('bumper'); minY.push(Math.round(Math.min(...r.path.slice(0).map(p => p.y)))); }
    }
    process.stdout.write(`\nL${id} ${JSON.stringify(c)} ${JSON.stringify(ev)} minYafterBumper ${minY.sort((a,b)=>a-b).slice(0,10)}\n`);
  }
}, 600000);
