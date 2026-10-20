import { it } from 'vitest';
import * as C from './design_C_levels.js';
import { survey, best, evaluate } from './design_C_lib.js';
import { simulateLevel } from '../src/game/simulateLevel.js';
const N = Number(process.env.N || 400);
const names = (process.env.LV || '').split(',').filter(Boolean);
it('run', () => {
  for (const name of names) {
    const { level, control } = C[name];
    const start = [800, 1100].some(H => simulateLevel(level, { height: H }).success);
    const s = survey(level, N);
    const b = best(level, s.wins, control);
    process.stdout.write(`\n## ${name} start:${start ? 'WIN' : 'no'} rate:${s.rate.toFixed(2)}% wins:${s.wins.length} best:${b ? JSON.stringify(b.sol) + ' ' + JSON.stringify(b.e) : 'none'}\n`);
  }
}, 3600000);
