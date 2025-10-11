# BounceFlow - Prototype

A physics-based puzzle game where kids learn through play. Guide a bouncing ball with dynamically changing properties by manipulating the environment.

## About

BounceFlow is a passion project designed to teach kids physics principles through playful experimentation. The ball's properties (elasticity, weight, friction) change dynamically over time, creating evolving puzzles that adapt as you solve them.

**Core Hook:** "What if the solution to a puzzle kept changing while you were solving it?"

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Controls

**Desktop:**
- **Left-click + drag** - Move surfaces
- **Right-click + drag** - Rotate surfaces
- **Spacebar** - Release the ball
- **R key** - Restart level

**Mobile:**
- **Tap + drag** - Move surfaces
- **Two-finger rotate** - Rotate surfaces (coming soon)
- **Play button** - Release the ball

## Current Prototype Features

- ✅ Dynamic ball elasticity that changes over time
- ✅ Interactive surfaces (drag and rotate)
- ✅ 5 test levels with increasing difficulty
- ✅ Visual feedback for property changes (color, trails)
- ✅ Target collection system
- ✅ Touch controls for mobile
- ✅ Responsive canvas

## Tech Stack

- **Vite** - Modern build tool and dev server
- **Matter.js** - 2D physics engine
- **Canvas API** - Rendering
- **Vanilla JavaScript** - No framework overhead

## Project Structure

```
bounceflow/
├── src/
│   ├── main.js           # Entry point
│   ├── game.js           # Main game loop and state
│   ├── ball.js           # Ball entity with dynamic properties
│   ├── surface.js        # Interactive surface entities
│   ├── target.js         # Goal/star collection
│   ├── levels.js         # Level definitions
│   ├── utils.js          # Utility functions
│   └── styles/
│       └── style.css     # UI styling
├── index.html
└── package.json
```

## Development Philosophy

This game is built with love for kids to discover the joy of physics through play. No ads, no manipulative mechanics, no forced purchases - just pure learning through fun.

**The best educational games are the ones kids don't realize are educational.**

## Next Steps

- [ ] Add mass and friction property changes
- [ ] Create more levels (World 1-6)
- [ ] Add sound effects and music
- [ ] Implement particle effects
- [ ] Add proper menus and UI polish
- [ ] Playtest with kids
- [ ] Add "pay what you want" support option
- [ ] Consider open sourcing

## License

This is a passion project for educational purposes. More details coming soon.

## Credits

Created with ❤️ for kids who love to experiment and learn.
