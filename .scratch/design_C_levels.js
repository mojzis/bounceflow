const base = { propertyPattern: 'static', cycleSpeed: 0, trueElasticity: true, steadyHook: true };
export const L5a = { control: 'effects', level: { ...base, id: 5, name: 'Heavy Metal', ballStart: { x: 150, y: 100 },
  surfaces: [
    { x: 230, y: 400, width: 200, angle: 20, locked: false },
    { x: 620, y: 400, width: 160, angle: 0, locked: true, material: 'glass' },
    { x: 540, y: 465, width: 120, angle: 90, locked: true },
    { x: 700, y: 465, width: 120, angle: 90, locked: true },
    { x: 620, y: 530, width: 180, angle: 0, locked: true }
  ],
  targets: [ { x: 360, y: 300, effect: 'heavy' }, { x: 620, y: 470, fixed: true } ],
  ballElasticity: 0.8, hint: '' } };
export const L5b = { control: 'effects', level: { ...L5a.level,
  targets: [ { x: 380, y: 230, effect: 'heavy' }, { x: 620, y: 470, fixed: true } ] } };
export const L5c = { control: 'effects', level: { ...L5a.level,
  surfaces: [ ...L5a.level.surfaces, { x: 450, y: 330, width: 120, angle: 90, locked: true } ],
  targets: [ { x: 300, y: 260, effect: 'heavy' }, { x: 620, y: 470, fixed: true } ] } };
const L5s = (hx, hy, bx = 620) => ({ control: 'effects', level: { ...L5a.level,
  surfaces: [
    { x: 230, y: 400, width: 200, angle: 20, locked: false },
    { x: bx, y: 400, width: 180, angle: 0, locked: true, material: 'glass' },
    { x: bx - 90, y: 465, width: 120, angle: 90, locked: true },
    { x: bx + 90, y: 465, width: 120, angle: 90, locked: true },
    { x: bx, y: 530, width: 200, angle: 0, locked: true }
  ],
  targets: [ { x: hx, y: hy, effect: 'heavy' }, { x: bx, y: 470, fixed: true } ] } });
export const L5d = L5s(300, 280);
export const L5e = L5s(260, 300, 580);
export const L5f = L5s(330, 250, 600);
export const L5g = L5s(250, 260, 620);
