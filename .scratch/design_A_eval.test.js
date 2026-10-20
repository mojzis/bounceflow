import { it } from 'vitest';
import { L } from './design_A_levels.js';
import { evaluate } from './design_A_lib.js';
const ctl = { 2: 'bumpers', 4: 'materials', 6: 'portals' };
it('eval', () => {
  for (const id of (process.env.IDS || '2,4,6').split(',').map(Number)) {
    const r = evaluate(L[id], ctl[id], Number(process.env.N || 600));
    process.stdout.write(`\nL${id} default:${r.def} rate:${r.rate.toFixed(2)}%\n` + r.good.map(g => '  ' + JSON.stringify(g)).join('\n') + '\n');
  }
}, 3600000);
