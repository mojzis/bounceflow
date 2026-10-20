import { simulateLevel } from '../src/game/simulateLevel.js';
console.warn = () => {};
export function rnd(level) {
  return level.surfaces.map(s => s.locked ? {} : {
    x: Math.round(60 + Math.random() * 840),
    y: Math.round(level.ballStart.y + 40 + Math.random() * Math.max(50, 640 - level.ballStart.y)),
    angle: Math.round(-70 + Math.random() * 140)
  });
}
export function toOv(level, sol) { let k = 0; return level.surfaces.map(s => s.locked ? {} : sol[k++]); }
export function win(level, ov, height = 800) { return simulateLevel(level, { surfaces: ov, height }).success; }
export function without(level, kind) {
  const c = structuredClone(level);
  if (kind === 'materials') c.surfaces.forEach(s => { if (s.material !== 'glass') delete s.material; });
  else if (kind === 'effects') c.targets.forEach(t => delete t.effect);
  else delete c[kind];
  return c;
}
// Random search; returns {rate, wins: [sol]}
export function survey(level, N) {
  const wins = [];
  for (let i = 0; i < N; i++) {
    const o = rnd(level);
    if (win(level, o)) wins.push(o.filter(x => x.x !== undefined));
  }
  return { rate: 100 * wins.length / N, wins };
}
// Score a candidate solution: both heights, control fails, nudge robustness
export function evaluate(level, sol, control) {
  const ov = toOv(level, sol);
  const h = [800, 1100].every(H => win(level, ov, H));
  const ctrl = control ? [800, 1100].every(H => !win(without(level, control), ov, H)) : true;
  let ok = 0, n = 0;
  for (const s of sol.keys()) for (const [dx, dy, da] of [[2,0,0],[-2,0,0],[0,2,0],[0,-2,0],[0,0,1],[0,0,-1]]) {
    const s2 = sol.map((p, i) => i === s ? { x: p.x + dx, y: p.y + dy, angle: p.angle + da } : p);
    n++; if (win(level, toOv(level, s2))) ok++;
  }
  const start = [800, 1100].some(H => simulateLevel(level, { height: H }).success);
  return { heights: h, control: ctrl, nudge: ok / n, startWins: start };
}
export function best(level, wins, control) {
  let bestR = null;
  for (const w of wins) {
    const e = evaluate(level, w, control);
    if (!e.heights || !e.control) continue;
    if (!bestR || e.nudge > bestR.e.nudge) bestR = { sol: w, e };
    if (e.nudge === 1) break;
  }
  return bestR;
}
