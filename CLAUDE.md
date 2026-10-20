# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BounceFlow is a physics-based educational puzzle game where kids learn through play. The ball's properties (elasticity, weight, friction) change dynamically over time, creating evolving puzzles. Built with Vite, Matter.js physics engine, and vanilla JavaScript Canvas API.

**Core concept**: "What if the solution to a puzzle kept changing while you were solving it?"

## Development Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint (ESLint, config in eslint.config.js)
npm run lint
npm run lint:fix

# Everything CI runs: lint + tests + build
npm run ci
```

CI (`.github/workflows/ci.yml`) runs lint, tests and build on every push to main and on pull requests.

## Git Commit Convention

**Workflow**: When a feature is complete, commit and push automatically. This is a learning project, so potential hiccups are considered part of the learning process.

Commit messages should be:
- Concise and factual
- Focus on what changed and why
- No grandiose language or cheerleading
- Bullet points only

Example format:
```
Fix solver angle calculation bug

- Change first surface angle range from ±90° to ±70°
- Calculate direction to target before generating angle
- Prevents surfaces from being too steep to catch ball
```

## Architecture Overview

### Modular Design (Refactored October 2025)

The game follows a **manager-based architecture** where the main Game class acts as an orchestrator, delegating specialized responsibilities to focused modules. This reduces complexity and improves testability.

**Architecture Pattern**: Game class (orchestrator) → Manager classes (specialized systems) → Entity classes (game objects)

### Game Managers (src/game/)

**`game/index.js`** (~750 lines) - Main orchestrator
- Coordinates all managers and game flow
- Manages game state (MENU, PLAYING, WON, REPLAY)
- Orchestrates main game loop (update → render cycle)
- Tracks scoring, timing, and attempts
- Manages game entities (ball, surfaces, targets, bird)

**`game/PhysicsManager.js`** (~100 lines)
- Initializes Matter.js engine and world
- Creates and manages boundary walls
- Handles physics updates with fixed timestep (60Hz)
- Manages collision detection callbacks
- Handles canvas resize events

**`game/InputManager.js`** (~200 lines)
- Processes mouse events (down, move, up, right-click)
- Handles touch events for mobile devices
- Tracks keyboard state with acceleration for held keys
- Forwards input events to game entities (surfaces)

**`game/SolverSystem.js`** (~400 lines)
- AI solver using simulated annealing algorithm
- Generates smart surface configurations
- Simulates physics in temporary world
- Two modes: explore (from scratch) and refine (from user config)
- Learns from failures using error vectors
- Temperature-based exploration (1.0 → 0.0)

**`game/RenderingSystem.js`** (~660 lines)
- Renders main game scene with purple gradient background
- Renders robot crab claw holding ball
- Visualizes solver attempts and solutions
- Renders replay mode with force vectors
- Color-coded physics visualization (red=impact, green=normal, yellow=velocity)

**`game/UIManager.js`** (~145 lines)
- Initializes DOM elements and event handlers
- Sets up keyboard shortcuts
- Updates UI each frame (score, time, elasticity bar)
- Manages help overlay and button states

**`game/LevelManager.js`** (~170 lines)
- Loads level data and creates entities
- Clears/cleans up levels
- Handles level progression
- Randomizes target positions (±30px)
- Resets solver and replay state

**`game/MechanicsSystem.js`** (~150 lines)
- Toy rules (materials, gates, fans, star effects) hooked into Matter.js `collisionStart`
- Sets the bounce of every ball contact (materials, true elasticity)
- Trampolines charge elasticity, sponges drain it, heavy balls smash glass
- Color gates let matching balls pass (pair becomes a sensor)
- Applies fan forces before each step and power star effects
- Bumpers kick the ball away at a fixed speed, clouds vanish after one bounce, portals move the ball to their other end (all after each step)
- No DOM access, so tests run the same rules (see `simulateLevel.js`)

**`game/levelEntities.js`** - Builds ball/surfaces/targets/gates/fans from a level definition (shared by LevelManager and tests)

**`game/simulateLevel.js`** - Headless level run with the real entities and mechanics; used by tests to prove levels are solvable

**`game/StateController.js`** (~150 lines)
- Manages game state transitions with automatic cleanup
- Enforces cleanup before every state transition
- Provides safe recovery to MENU state on errors
- States: MENU (adjusting), PLAYING (active), WON (victory), REPLAY (playback)
- Prevents invalid state combinations (e.g., solver hints showing in wrong states)

### State Management

The game uses a **StateController** to manage state transitions:

- **Single Source of Truth**: `StateController.state` is authoritative
- **Automatic Cleanup**: `cleanup()` runs before every state transition
  - Stops solver if running
  - Clears victory timers
  - Resets UI flags (showHints, hookReleasing)
  - State-specific cleanup (recording, overlays, etc.)
- **Safe Recovery**: `recover()` forces return to MENU on any error
  - Handles corrupted ball states
  - Recovers from update loop errors
  - Recovers from solver errors
- **States**: MENU (adjusting), PLAYING (active), WON (victory), REPLAY (playback)

**Why StateController?**
Previous implementation used scattered boolean flags that could get into invalid combinations (e.g., solver hints showing in wrong state, victory timers not cancelled during replay). StateController prevents these issues by enforcing cleanup before every transition.

### Entity Classes (src/)

**`ball.js`** - Ball entity with dynamic properties
- Manages physics body (Matter.js circle)
- Property system: elasticity changes over time based on pattern ('static', 'wave', 'pulse')
- Visual feedback: color interpolation based on elasticity (red = low bounce, cyan = high bounce)
- Trail rendering for motion visualization

**`surface.js`** - Interactive draggable/rotatable surfaces
- Physics body: static rectangular Matter.js body
- Interaction modes: drag to move, right-click to rotate
- Keyboard control support with selection highlighting
- Locked vs. movable surfaces

**`target.js`** - Collectible star targets
- Collision detection with ball
- Pulse animation for uncollected targets
- Particle burst celebration on collection

**`gate.js`** - Color gate (cyan = only bouncy balls pass, red = only soft balls pass)

**`fan.js`** - Air zone that pushes the ball with a constant force (light balls fly, heavy balls barely move)

**`bumper.js`** - Round pinball bumper (kicks the ball away from its center at `BUMPER_SPEED`)

**`portal.js`** - Portal pair; the ball keeps its velocity, can't re-enter the end it came out of until it leaves it

Clouds are a surface material (`material: 'cloud'`): one bounce, then they puff away. They come back when a new ball is released.

**`bird.js`** - Flying obstacle
- Moves across screen periodically
- Collision with ball triggers level restart
- Spawns at random intervals (5-10s)

### Supporting Modules (src/)

**`levels.js`** - Level definitions array
- Each level specifies: ball start position, surface configurations, target positions, property pattern
- Optional toy fields are documented at the top of the file (materials, star effects, gates, fans, `trueElasticity`, `steadyHook`, fixed targets)
- `hookSways(level)`: World 1 keeps the claw still; from World 2 it sways unless `steadyHook`
- `WORLDS` holds the intro screen for each world; `getWorldStartingAt(id)`
- `getLevel(id)` and `getTotalLevels()` helpers
- 28 levels in 3 worlds: Bouncing (1-14), Elasticity (15-24), Materials & Mass (25-28)
- World 1 has a toy on every level after the first: new toys at 2 bumper, 3 trampoline, 4 cloud, 5 heavy star + glass, 6 portal, 7 light star + fan, 9 bouncy star; combos at 8, 10-14 (14 uses almost everything). World 3 adds sponges and gates and mixes everything

**`mechanics.js`** - Toy rules as data + pure functions (materials, weights, star effects, gates, fan force)

**`progress.js`** - Remembers the current level in localStorage (start order: `?level=N`, saved level, level 1)

**`popups.js`** - Floating feedback text ("Boing!", "SMASH!")

**`utils.js`** - Math and geometry utilities
- Color interpolation (`lerpColor`)
- Geometry helpers (`pointNearLine`, `pointInCircle`)
- Angle conversion (`degToRad`, `radToDeg`)

### Physics Configuration

Matter.js engine settings (in `PhysicsManager`):
- Gravity: `world.gravity.y = 0.5` (scaled for gameplay feel)
- Position/velocity iterations: 10 each for stability
- Fixed timestep: 16.67ms (60Hz) to prevent tunneling
- All physics bodies use low friction (0) and high restitution (0.95-0.99) for bouncy gameplay
- Boundary walls positioned 25px outside canvas edges
- Matter.js uses the **higher** restitution of two colliding bodies. On plain levels surfaces are 0.99, so the ball's elasticity barely affects bounces. Toy levels set `trueElasticity: true` and MechanicsSystem sets each contact's bounce so the ball's elasticity really counts.
- **matter-js 0.20**: a body created with `isStatic: true` has no stored mass, so releasing it gives NaN positions. The ball is created dynamic and then made static.

### Key Systems

**Solver System** (`SolverSystem`)
- AI solver using simulated annealing algorithm
- Generates smart surface configurations with heuristics
- First movable surface intelligently placed below ball toward target
- Runs `simulateLevel()` (the game's own entities), so hints work when copied; success = all stars
- Hints use whole pixels/degrees; the ghost turns green when the player's surface matches
- The hook stops swaying once the solver is used on a level
- Visualizes attempts as ghost trajectories (last 20 failures shown)
- Shows solution as cyan dashed surfaces with angle labels
- 300 attempts (5 per tick), 30% of them wild guesses anywhere; best attempt shown if none succeeds
- Two modes:
  - **Explore**: Starts from scratch, wide exploration
  - **Refine**: Uses current player setup, focused refinement
- Temperature cooling: 1.0 → 0.0 for exploration → exploitation
- Learns from errors using recent failure vectors

**Replay System** (`RenderingSystem`)
- Records ball position, velocity, and collision data during gameplay
- Replay mode visualizes:
  - Full trajectory path (white trail)
  - Impact points with red markers
  - Force vectors (green = normal force, red = impact velocity, yellow = ball velocity)
  - Surface angles and impact speeds at collision points
  - Velocity vectors every 10 frames
- Always displays surface angles during replay
- Loops continuously until player exits

**Input System** (`InputManager` + `UIManager`)
- Mouse: Left-click drag (move), right-click drag (rotate surfaces)
- Touch: Single touch drag (move), handles mobile
- Keyboard: a tap is exactly one step (1° / 1px, Shift = 5° / 5px); holding repeats after 300 ms and speeds up
- Surfaces snap to whole pixels and degrees; angles are shown in [-90°, 90°) (`surfaceAngle()` in utils)
- Keyboard shortcuts:
  - `Space` - Release ball
  - `R` - Restart level
  - `V` - Toggle angle display
  - `?` - Toggle solver/hints
  - `H` - Toggle help overlay
  - `B` - Toggle debug mode
  - `Tab` - Select next surface
  - `Q/E` or `Arrow Left/Right` - Rotate selected surface (Shift for 5° increments)
  - `WASD` or `Arrow keys` - Move selected surface (Shift for 5px increments)
  - `Escape` - Close help

## Important Technical Details

### Matter.js Import Configuration

**CRITICAL**: Matter.js must use namespace import pattern for production builds:
```javascript
import * as Matter from 'matter-js';
```

The Vite config includes special handling for Matter.js:
- `optimizeDeps.include: ['matter-js']` - Pre-bundle dependency
- `commonjsOptions.include: [/matter-js/]` - Handle CommonJS properly

### Canvas Rendering

- Gradient background: `#667eea` → `#764ba2` (purple gradient)
- All rendering in `render()` methods - no direct DOM manipulation
- Fixed timestep physics, variable framerate rendering

### Level Design Patterns

Levels use locked/unlocked surfaces to create constraints:
- `locked: true` - Fixed surface (gray), provides structural constraints
- `locked: false` - Interactive surface (white), player must position/angle these

Target positions use randomization (`±30px`) to add variety between plays (see `LevelManager.loadLevel()`). The system validates target spacing to prevent overlap.

## Development Philosophy

From README.md: "This game is built with love for kids to discover the joy of physics through play. No ads, no manipulative mechanics, no forced purchases - just pure learning through fun."

**The best educational games are the ones kids don't realize are educational.**

## File Organization

```
src/
├── main.js                    # Entry point, canvas setup, event binding
├── game/
│   ├── index.js               # Main Game orchestrator (~750 lines)
│   ├── PhysicsManager.js      # Matter.js physics engine (~100 lines)
│   ├── InputManager.js        # Mouse, touch, keyboard input (~200 lines)
│   ├── SolverSystem.js        # AI solver with simulated annealing (~400 lines)
│   ├── RenderingSystem.js     # All rendering logic (~660 lines)
│   ├── UIManager.js           # DOM elements and keyboard shortcuts (~145 lines)
│   ├── LevelManager.js        # Level loading and progression (~170 lines)
│   ├── StateController.js     # State transitions, cleanup, recovery (~150 lines)
│   ├── MechanicsSystem.js     # Toy rules on the physics engine
│   ├── levelEntities.js       # Builds level entities (game + tests)
│   └── simulateLevel.js       # Headless level run for tests
├── ball.js                    # Ball entity with dynamic elasticity
├── surface.js                 # Interactive surface entity
├── target.js                  # Star collection targets
├── gate.js                    # Color gate (cyan/red)
├── fan.js                     # Fan air zone
├── bumper.js                  # Pinball bumper
├── portal.js                  # Portal pair
├── bird.js                    # Flying obstacle
├── mechanics.js               # Toy rules (materials, weight, effects)
├── progress.js                # Saved level (localStorage)
├── popups.js                  # Floating feedback text
├── levels.js                  # Level definitions + world intros (28 levels)
├── utils.js                   # Math/geometry utilities
└── styles/
    └── style.css              # UI styling
```

**Refactoring History**: Originally game.js was a monolithic 2220-line file. Refactored in October 2025 to extract 6 specialized managers, reducing main orchestrator to ~750 lines and improving maintainability.

## Testing Approach

### Unit Tests

The project uses Vitest for unit testing:

```bash
# Run tests in watch mode (auto-reruns on file changes)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui
```

**Current coverage:**
- `utils.test.js` - All utility functions (geometry, math, color)
- `levels.test.js` - Level definition validation
- `mechanics.test.js` - Toy rules and small physics scenarios (trampoline, sponge, glass, gates, fans, bumpers, clouds, portals)
- `toys.test.js` - Every toy level (`trueElasticity`) has a known solution, its starting layout doesn't win, and removing its key mechanic breaks it

When adding a toy level, add a solution to `toys.test.js`. A quick way to find one is a random search over the movable surfaces with `simulateLevel()`. The share of random setups that win is a good difficulty measure: World 1 toy levels sit around 0.3-1.5%, World 3 below 1%.

**Test file location:** Place test files next to source files with `.test.js` suffix (e.g., `utils.test.js` next to `utils.js`)

**Note**: The modular architecture (game managers) makes unit testing easier by isolating concerns. Future work could include tests for individual managers.

### Manual Testing

Manual testing workflow for gameplay:
1. Start dev server: `npm run dev` (the level picker or `?level=25` jumps to a level; reloads resume the last level)
2. Test interactions in browser
3. Verify solver works: Press `?` on any level
4. Test replay: Complete level, verify replay button shows, click to watch replay with force vectors

For production builds:
```bash
npm run build
npm run preview  # Test production build locally
```

## Screenshots and Debugging

Screenshots are stored in `~/Pictures/Screenshots/`. When asked to look at the most recent screenshot:

```bash
# List most recent screenshots
ls -lat ~/Pictures/Screenshots/ | head

# Read the most recent screenshot
# Get the filename from ls output and use Read tool with full path
```
