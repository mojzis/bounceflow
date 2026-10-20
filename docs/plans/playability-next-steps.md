# Playability: Next Steps

Ideas to make the early game more fun for kids, after the October 2026
playability pass (toys moved into World 1, copyable hints, level picker).

## Where we are

- World 1 (levels 1-14) brings in a toy every other level: trampoline (3),
  heavy star + glass (5), light star + fan (7), bouncy star (9), combo (12).
- The claw stays still in World 1, so a good setup always works the same way.
- Hints use the game's real physics (`simulateLevel`) and solve levels 1-12
  every time in testing. A tap is exactly one step (1°, Shift 5°).
- Rough difficulty measure: share of random setups that win.
  Level 1 is about 8%, and most World 1 levels are 2-5%.
  Chain Reaction (13) and Grand Finale (14) are still hard (under 0.5%).

## 1. Trajectory preview (easy mode) - recommended first

Draw a dotted line showing where the ball will go while the player moves
a surface, before pressing Play.

- Run `simulateLevel()` with the current surface positions when a surface
  moves (throttled, e.g. at most every 100 ms; one run takes about 2 ms).
- Draw the path as a dotted line, fading out along its length.
- Easy mode: show the whole path. Normal mode: show only up to the first
  bounce, or the first second. Hard mode / later worlds: no preview.
- Toggle with a button and a key (e.g. `P`), remembered in localStorage
  next to the saved level (`src/progress.js`).
- Don't show it on World 2 (dynamic elasticity) levels unless we simulate
  the release time too, or it will lie.
- Optional: mark the stars the predicted path collects.

Why: kids learn by seeing cause and effect right away, instead of
release, miss, reset, guess again.

## 2. Sound effects

Short, cheerful sounds, generated with the Web Audio API (no files needed):

- Bounce: soft "boop", pitch going up with impact speed.
- Trampoline: "boing" (pitch slide up).
- Glass smash: noise burst plus a high tinkle.
- Star collected: rising chime; power star: a different chime per effect.
- Level complete: short fanfare.
- Mute button plus `M` key, remembered in localStorage.

Hook into `MechanicsSystem` events (already emitted for trampoline, sponge,
smash, star) and the ball-surface collision handler in `game/index.js`.
The browser only allows audio after the first click or key press, so
create the AudioContext then.

## 3. More sparkle (smaller ideas)

- Screen shake and a particle burst on glass smash and big trampoline hits.
- Stars wobble or sparkle when the ball passes close but misses ("so close!").
- Celebration that scales with stars collected and attempts used
  (1-3 stars per level, shown in the level picker).
- Collected-stars counter per world in the level picker.
- Re-check Chain Reaction (13) and Grand Finale (14): make them a bit
  easier or move them later, since World 1 should end on a high, not a wall.

## Testing notes

- `toys.test.js` checks every toy level has a sturdy solution and needs
  its toy. Add a solution there for any new toy level.
- To measure a level's difficulty, run `simulateLevel()` on a few
  thousand random setups of the movable surfaces and count the wins.
