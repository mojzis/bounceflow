import { it, vi } from 'vitest';
import { getLevel } from './levels.js';
import { simulateLevel } from './game/simulateLevel.js';
vi.spyOn(console, 'warn').mockImplementation(() => {});
const IDS = (process.env.IDS || '').split(',').map(Number);
it('probe', () => {
  for (const id of IDS) {
    const level = getLevel(id);
    let hits = 0, N = 2000, robust = 0, checked = 0;
    for (let n = 0; n < N; n++) {
      const surfaces = level.surfaces.map(s => s.locked ? {} : {
        x: Math.round(60 + Math.random() * 760), y: Math.round(level.ballStart.y + 40 + Math.random() * 500), angle: Math.round(-70 + Math.random() * 140) });
      const r = simulateLevel(level, { surfaces, maxFrames: 600 });
      if (r.success) { hits++;
        if (checked < 5) { checked++; let ok = 0;
          for (let k = 0; k < 10; k++) {
            const p = surfaces.map(s => s.x === undefined ? s : { x: s.x + Math.round((Math.random()-0.5)*10), y: s.y + Math.round((Math.random()-0.5)*10), angle: s.angle + Math.round((Math.random()-0.5)*6) });
            if (simulateLevel(level, { surfaces: p, maxFrames: 600 }).success) ok++; }
          robust += ok; } }
    }
    console.error(`L${id} ${level.name}: ${(100*hits/N).toFixed(1)}% random wins; nudge(±5px,±3°) survival ${checked ? (10*robust/checked).toFixed(0) : '-'}%`);
  }
}, 900000);
