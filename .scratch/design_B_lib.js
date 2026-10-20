import { simulateLevel } from '../src/game/simulateLevel.js';
console.warn = () => {};
export function rnd(level) {
  return level.surfaces.map(s => s.locked ? {} : {
    x: Math.round(60 + Math.random() * 840),
    y: Math.round(level.ballStart.y + 40 + Math.random() * Math.max(50, 640 - level.ballStart.y)),
    angle: Math.round(-70 + Math.random() * 140)
  });
}
const win = (level, o, h = 800) => simulateLevel(level, { surfaces: o, height: h }).success;
export function both(level, o) { return win(level, o, 800) && win(level, o, 1100); }
export function nudges(level, o) {
  let ok = 0, n = 0;
  const idx = o.map((s, i) => s.x !== undefined ? i : -1).filter(i => i >= 0);
  for (const i of idx) for (const [dx, dy, da] of [[2,0,0],[-2,0,0],[0,2,0],[0,-2,0],[0,0,1],[0,0,-1],[1,1,1],[-1,-1,-1]]) {
    const c = o.map(s => ({ ...s })); c[i] = { x: c[i].x + dx, y: c[i].y + dy, angle: c[i].angle + da };
    n++; if (win(level, c)) ok++;
  }
  return ok / n;
}
export function without(level, kind) {
  const copy = structuredClone(level);
  if (kind === 'materials') copy.surfaces.forEach(s => { if (s.material !== 'glass') delete s.material; });
  else if (kind === 'effects') copy.targets.forEach(t => delete t.effect);
  else delete copy[kind];
  return copy;
}
export function evaluate(level, { N = 600, kinds = [] } = {}) {
  const def = win(level, undefined, 800) || win(level, undefined, 1100);
  let wins = 0; const sols = [];
  for (let i = 0; i < N; i++) { const o = rnd(level); if (win(level, o)) { wins++; sols.push(o); } }
  // score solutions
  let best = null;
  for (const o of sols.slice(0, 30)) {
    if (!both(level, o)) continue;
    const ctrl = Object.fromEntries(kinds.map(k => [k, win(without(level, k), o, 800) || win(without(level, k), o, 1100)]));
    if (Object.values(ctrl).some(v => v)) continue;
    const rob = nudges(level, o);
    if (!best || rob > best.rob) best = { o, rob, ctrl };
  }
  return { def, rate: 100 * wins / N, found: sols.length, best };
}
export function fmt(id, r) {
  return `L${id} default:${r.def} rate:${r.rate.toFixed(2)}% found:${r.found} best:${r.best ? JSON.stringify(r.best.o.filter(s => s.x !== undefined)) + ' rob:' + r.best.rob.toFixed(2) : 'none'}`;
}
