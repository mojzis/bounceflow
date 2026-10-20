import { simulateLevel } from '../src/game/simulateLevel.js';
console.warn = () => {};
export function rnd(level) {
  return level.surfaces.map(s => s.locked ? {} : {
    x: Math.round(60 + Math.random() * 840),
    y: Math.round(level.ballStart.y + 40 + Math.random() * Math.max(50, 640 - level.ballStart.y)),
    angle: Math.round(-70 + Math.random() * 140)
  });
}
export function without(level, kind) {
  const c = structuredClone(level);
  if (kind === 'materials') c.surfaces.forEach(s => { if (s.material !== 'glass') delete s.material; });
  else if (kind === 'effects') c.targets.forEach(t => delete t.effect);
  else delete c[kind];
  return c;
}
const wins = (level, o, h = 800) => simulateLevel(level, { surfaces: o, height: h }).success;
export function nudgeRate(level, o) {
  let ok = 0, n = 0;
  o.forEach((s, i) => { if (s.x === undefined) return;
    for (const [k, d] of [['x', 2], ['x', -2], ['y', 2], ['y', -2], ['angle', 1], ['angle', -1]]) {
      const c = o.map(z => ({ ...z })); c[i][k] += d; n++; if (wins(level, c)) ok++;
    } });
  return ok / n;
}
export function randTargetsRate(level, o, k = 8) {
  let ok = 0;
  for (let i = 0; i < k; i++) {
    const t = level.targets.map(t => t.fixed ? t : { x: t.x + (Math.random() - 0.5) * 80, y: t.y + (Math.random() - 0.5) * 50 });
    if (simulateLevel(level, { surfaces: o, targets: t }).success) ok++;
  }
  return ok / k;
}
export function evaluate(level, control, N = 600) {
  const def = wins(level, undefined, 800) || wins(level, undefined, 1100);
  let w = 0; const good = [];
  const ctl = without(level, control);
  for (let i = 0; i < N; i++) {
    const o = rnd(level);
    if (!wins(level, o)) continue;
    w++;
    if (good.length < 6 && wins(level, o, 1100) && !wins(ctl, o) && !wins(ctl, o, 1100)) {
      const nr = nudgeRate(level, o);
      good.push({ o: o.filter(z => z.x !== undefined), nudge: nr, tgt: randTargetsRate(level, o) });
    }
  }
  good.sort((a, b) => (b.nudge + b.tgt) - (a.nudge + a.tgt));
  return { def, rate: 100 * w / N, good };
}
