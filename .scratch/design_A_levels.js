const base = { propertyPattern: 'static', cycleSpeed: 0, trueElasticity: true, steadyHook: true };
export const L = {
  2: { ...base, id: 2, name: 'Bonk!', ballStart: { x: 150, y: 100 }, ballElasticity: 0.6,
    surfaces: [ { x: 300, y: 450, width: 200, angle: -15, locked: false } ],
    bumpers: [ { x: 500, y: 430, radius: 30 } ],
    targets: [ { x: 680, y: 180 } ],
    hint: 'Pink bumpers kick the ball away - BONK! Roll the ball into the bumper to reach the high star.' },
  4: { ...base, id: 4, name: 'Cloud Hop', ballStart: { x: 150, y: 100 }, ballElasticity: 0.6,
    surfaces: [
      { x: 250, y: 300, width: 180, angle: 20, locked: false },
      { x: 560, y: 450, width: 150, angle: 0, locked: true, material: 'cloud' },
      { x: 480, y: 520, width: 130, angle: 90, locked: true },
      { x: 640, y: 520, width: 130, angle: 90, locked: true },
      { x: 560, y: 590, width: 180, angle: 0, locked: true }
    ],
    targets: [ { x: 380, y: 330 }, { x: 560, y: 530, fixed: true } ],
    hint: 'Clouds hold the ball for just one bounce - then POOF! Grab the first star, then bounce off the cloud lid.' },
  6: { ...base, id: 6, name: 'Portal', ballStart: { x: 150, y: 100 }, ballElasticity: 0.6,
    surfaces: [
      { x: 300, y: 420, width: 200, angle: 15, locked: false },
      { x: 720, y: 100, width: 160, angle: 0, locked: true },
      { x: 640, y: 175, width: 150, angle: 90, locked: true },
      { x: 800, y: 175, width: 150, angle: 90, locked: true },
      { x: 720, y: 250, width: 160, angle: 0, locked: true }
    ],
    portals: [ { a: { x: 520, y: 560 }, b: { x: 720, y: 150 } } ],
    targets: [ { x: 720, y: 200, fixed: true } ],
    hint: 'Go into one portal and pop out of the other! The star is locked in a box - can you get in?' }
};
