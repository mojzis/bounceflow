import { simulateLevel } from '../src/game/simulateLevel.js';
import { rnd, both, nudges, without } from './design_B_lib.js';
console.warn = () => {};
export const R = (a, b) => Math.round(a + Math.random() * (b - a));
const win = (level, o, h = 800) => simulateLevel(level, { surfaces: o, height: h }).success;
export function rate(level, N) {
  let w = 0; const sols = [];
  for (let i = 0; i < N; i++) { const o = rnd(level); if (win(level, o)) { w++; sols.push(o); } }
  return { rate: 100 * w / N, sols };
}
export function search(template, kinds, { tries = 60, N1 = 250, N2 = 900, lo = 0.4, hi = 1.6 } = {}) {
  const out = [];
  for (let t = 0; t < tries; t++) {
    const level = template();
    if (win(level) || win(level, undefined, 1100)) continue;
    const r1 = rate(level, N1);
    if (r1.rate === 0 || r1.rate > hi * 2.5) continue;
    const r2 = rate(level, N2);
    const all = r1.sols.concat(r2.sols);
    const rt = 100 * all.length / (N1 + N2);
    if (rt < lo || rt > hi) continue;
    // control rates: solutions found must not work without each kind
    const ctrl = {};
    for (const k of kinds) { const c = without(level, k); ctrl[k] = all.filter(o => win(c, o)).length / all.length; }
    if (Object.values(ctrl).some(v => v > 0.25)) continue;
    let best = null;
    for (const o of all.slice(0, 25)) {
      if (!both(level, o)) continue;
      if (kinds.some(k => { const c = without(level, k); return win(c, o) || win(c, o, 1100); })) continue;
      const rob = nudges(level, o);
      if (!best || rob > best.rob) best = { o: o.filter(s => s.x !== undefined), rob };
    }
    if (!best || best.rob < 0.6) continue;
    out.push({ level, rate: rt, ctrl, best });
    process.stdout.write(`\nHIT rate:${rt.toFixed(2)} ctrl:${JSON.stringify(ctrl)} rob:${best.rob.toFixed(2)} sol:${JSON.stringify(best.o)}\nLEVEL ${JSON.stringify(level)}\n`);
  }
  return out;
}
