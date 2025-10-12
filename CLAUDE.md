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
```

## Git Commit Convention

Use git log as a chronicle of changes. Commit messages should be:
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

### Entity-Component System

The game follows an entity pattern where each game object (Ball, Surface, Target) manages both its physics body and rendering:

- **Game Loop**: `game.js` contains the main game loop (`update()` → `render()` cycle) and orchestrates all entities
- **Physics Integration**: Each entity creates and updates its own Matter.js body but delegates collision detection to the game
- **State Management**: Game states (MENU, PLAYING, PAUSED, WON, REPLAY) control interaction and rendering behavior

### Core Modules

**`game.js`** (1382 lines) - Main game controller
- Manages Matter.js physics engine and world
- Handles all game states and transitions
- Input handling (mouse, touch, keyboard)
- Built-in solver system for finding level solutions
- Replay system that records and plays back ball trajectories with collision visualization
- UI management and keyboard shortcuts

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

**`levels.js`** - Level definitions array
- Each level specifies: ball start position, surface configurations, target positions, property pattern
- `getLevel(id)` and `getTotalLevels()` helpers

**`target.js`** - Collectible star targets
- Collision detection with ball
- Pulse animation for uncollected targets
- Particle burst celebration on collection

**`utils.js`** - Math and geometry utilities
- Color interpolation (`lerpColor`)
- Geometry helpers (`pointNearLine`, `pointInCircle`)
- Angle conversion (`degToRad`, `radToDeg`)

### Physics Configuration

Matter.js engine settings (in `game.js:setupPhysics()`):
- Gravity: `world.gravity.y = 0.5` (scaled for gameplay feel)
- Position/velocity iterations: 10 each for stability
- Fixed timestep: 16.67ms (60Hz) in `update()` to prevent tunneling
- All physics bodies use low friction (0) and high restitution (0.95-0.99) for bouncy gameplay

### Key Systems

**Solver System** (`game.js:startSolver()`)
- Generates random surface configurations attempting to reach targets
- Runs physics simulations in a temporary engine (300 frames)
- Visualizes attempts as ghost trajectories overlaid on the game
- Shows solution as cyan dashed surfaces with angle labels
- Tracks best attempt when no solution found within 50 attempts

**Replay System** (`game.js:startReplay()`)
- Records ball position, velocity, and collision data during gameplay
- Replay mode visualizes:
  - Full trajectory path
  - Impact points with red markers
  - Force vectors (green = normal force, red = impact velocity, yellow = ball velocity)
  - Surface angles and impact speeds at collision points
- Always displays surface angles during replay

**Input System**
- Mouse: Left-click drag (move), right-click drag (rotate surfaces)
- Touch: Single touch drag (move), handles mobile
- Keyboard shortcuts:
  - `Space` - Release ball
  - `R` - Restart level
  - `V` - Toggle angle display
  - `?` - Toggle solver/hints
  - `H` - Toggle help overlay
  - `Tab` - Select next surface
  - `Q/E` or `Arrow Left/Right` - Rotate selected surface (Shift for 5° increments)
  - `WASD` or `Arrow keys` - Move selected surface (Shift for 5px increments)

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
- `locked: true` - Fixed surface, provides structural constraints
- `locked: false` - Interactive surface, player must position/angle these

Target positions use randomization (`±30px`) to add variety between plays (see `game.js:loadLevel()`).

## Development Philosophy

From README.md: "This game is built with love for kids to discover the joy of physics through play. No ads, no manipulative mechanics, no forced purchases - just pure learning through fun."

**The best educational games are the ones kids don't realize are educational.**

## File Organization

```
src/
├── main.js          # Entry point, canvas setup, event binding
├── game.js          # Game loop, state management, solver, replay
├── ball.js          # Ball entity with dynamic elasticity
├── surface.js       # Interactive surface entity
├── target.js        # Star collection targets
├── levels.js        # Level definitions array
├── utils.js         # Math/geometry utilities
└── styles/
    └── style.css    # UI styling
```

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

**Test file location:** Place test files next to source files with `.test.js` suffix (e.g., `utils.test.js` next to `utils.js`)

### Manual Testing

Manual testing workflow for gameplay:
1. Start dev server: `npm run dev`
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
