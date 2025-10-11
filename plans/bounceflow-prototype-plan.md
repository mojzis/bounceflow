# BounceFlow Prototype Implementation Plan
*JavaScript/HTML5 Canvas Implementation*

## Why JavaScript Works Perfectly

✅ **Cross-platform from day one** - Test on phones, tablets, computers immediately  
✅ **No installation needed** - Kids can play instantly via browser link  
✅ **Easy iteration** - Change code, refresh, test with kids  
✅ **Great physics engines** - Matter.js, Box2D, or Planck.js  
✅ **Visual libraries** - Canvas/WebGL with PIXI.js or Phaser  
✅ **Free hosting** - GitHub Pages, Netlify, or Vercel  
✅ **Mobile-ready** - Touch events work natively  
✅ **Later options** - Can wrap with Capacitor/Electron for app stores  

---

## Tech Stack Recommendation

### Core Engine Option 1: **Phaser 3** (Recommended for Prototype)
```javascript
// Why Phaser?
- Built-in physics (Matter.js or Arcade)
- Excellent touch/mouse handling
- Particle systems included
- Sound management built-in
- Active community & documentation
- Free and open source
```

### Core Engine Option 2: **Custom with Matter.js**
```javascript
// If you want more control
- Matter.js for physics
- Canvas/WebGL for rendering
- Howler.js for sound
- GSAP for property animations
```

### Development Setup
```bash
# Simple local setup
- VS Code with Live Server extension
- Chrome DevTools for debugging
- Git for version control
- Parcel or Vite for bundling (optional for prototype)
```

---

## Prototype Scope (Week 1-2)

### Core Features to Prove Concept
1. **Ball with changing elasticity** (just one property first)
2. **3-5 adjustable surface pieces**
3. **Visual feedback for property changes**
4. **Basic goal/target system**
5. **5 test levels**
6. **Simple restart mechanism**

### What to Skip in Prototype
- Fancy graphics (use solid colors)
- Sound effects (add later)
- Menus/UI (just keyboard shortcuts)
- Score system
- Multiple properties changing

---

## Implementation Plan

## Week 1: Core Mechanics

### Day 1-2: Project Setup & Basic Physics
```javascript
// Basic structure
project/
├── index.html
├── js/
│   ├── game.js         // Main game loop
│   ├── ball.js         // Ball entity with properties
│   ├── surface.js      // Surface entities
│   └── levels.js       // Level data
├── assets/
│   └── (empty for now - using shapes)
└── css/
    └── style.css
```

**Milestone:** Ball bouncing on static surfaces

### Day 3-4: Dynamic Ball Properties
```javascript
// Ball.js - Property system
class Ball {
    constructor() {
        this.baseElasticity = 0.5;
        this.currentElasticity = 0.5;
        this.elasticityPhase = 0;
        this.cycleSpeed = 0.001; // Radians per frame
    }
    
    update() {
        // Sine wave property change
        this.elasticityPhase += this.cycleSpeed;
        this.currentElasticity = 0.5 + Math.sin(this.elasticityPhase) * 0.3;
        
        // Visual feedback
        this.updateColor();
        this.updateTrail();
    }
    
    updateColor() {
        // Interpolate between red (low) and blue (high bounce)
        const ratio = (this.currentElasticity - 0.2) / 0.6;
        this.color = lerpColor('#FF6B6B', '#4ECDC4', ratio);
    }
}
```

**Milestone:** Ball elasticity changes visibly over time

### Day 5-6: Surface Manipulation
```javascript
// Surface.js - Interactive surfaces
class Surface {
    constructor(x, y, width, angle) {
        this.startX = x;
        this.startY = y;
        this.width = width;
        this.angle = angle;
        this.isDragging = false;
        this.isRotating = false;
    }
    
    handleMouseDown(mx, my) {
        if (this.containsPoint(mx, my)) {
            this.isDragging = true;
            this.dragOffset = {x: mx - this.x, y: my - this.y};
        }
    }
    
    handleMouseMove(mx, my) {
        if (this.isDragging) {
            this.x = mx - this.dragOffset.x;
            this.y = my - this.dragOffset.y;
            this.updatePhysicsBody();
        }
    }
}
```

**Milestone:** Players can drag and rotate surfaces

### Day 7: Property Visualization System
```javascript
// PropertyIndicator.js
class PropertyIndicator {
    constructor(ball) {
        this.ball = ball;
        this.particles = [];
    }
    
    render(ctx) {
        // Draw prediction curve
        this.drawBouncePrediction(ctx);
        
        // Draw property bar
        this.drawPropertyBar(ctx);
        
        // Update particles
        this.updateParticles(ctx);
    }
    
    drawPropertyBar(ctx) {
        // Visual bar showing current property state
        const barWidth = 200;
        const ratio = (this.ball.currentElasticity - 0.2) / 0.6;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 10, barWidth, 20);
        
        ctx.fillStyle = this.ball.color;
        ctx.fillRect(10, 10, barWidth * ratio, 20);
    }
}
```

**Milestone:** Clear visual feedback for property states

---

## Week 2: Playability & Testing

### Day 8-9: Level System
```javascript
// levels.js
const LEVELS = [
    {
        name: "First Bounce",
        ballStart: {x: 100, y: 100},
        surfaces: [
            {x: 200, y: 300, width: 150, angle: 0, locked: true},
            {x: 400, y: 400, width: 100, angle: 45, locked: false}
        ],
        targets: [
            {x: 500, y: 200, radius: 30}
        ],
        propertyPattern: 'static', // or 'wave', 'pulse'
        hint: "Drag the surface to guide the ball to the star!"
    }
];

class LevelManager {
    loadLevel(levelIndex) {
        const level = LEVELS[levelIndex];
        this.clearLevel();
        this.spawnSurfaces(level.surfaces);
        this.spawnTargets(level.targets);
        this.setBallProperties(level.propertyPattern);
    }
}
```

**Milestone:** 5 playable test levels

### Day 10-11: Goals & Win Conditions
```javascript
// Target.js
class Target {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.collected = false;
        this.pulseAnimation = 0;
    }
    
    checkCollection(ball) {
        const dist = distance(ball.x, ball.y, this.x, this.y);
        if (dist < this.radius + ball.radius) {
            this.collected = true;
            this.triggerCollection();
        }
    }
    
    triggerCollection() {
        // Visual celebration
        createParticleBurst(this.x, this.y);
        // Check win condition
        if (allTargetsCollected()) {
            showWinState();
        }
    }
}
```

**Milestone:** Complete game loop with win conditions

### Day 12-13: Polish & Kid Testing
- Add restart button (R key)
- Add property prediction indicator
- Add trail effects to ball
- Create simple start screen
- **Test with kids!**

### Day 14: Iterate Based on Kid Feedback
- Adjust difficulty
- Fix confusing elements  
- Add more visual feedback where needed
- Simplify controls if necessary

---

## Code Architecture

### Game State Management
```javascript
class GameState {
    constructor() {
        this.states = {
            MENU: 'menu',
            PLAYING: 'playing',
            PAUSED: 'paused',
            WON: 'won'
        };
        this.current = this.states.MENU;
        this.level = 0;
        this.attempts = 0;
    }
    
    update(deltaTime) {
        switch(this.current) {
            case this.states.PLAYING:
                this.updatePhysics(deltaTime);
                this.updateProperties(deltaTime);
                this.checkCollisions();
                this.checkWinCondition();
                break;
        }
    }
}
```

### Physics Integration (with Matter.js)
```javascript
// Initialize Matter.js
const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;

class PhysicsWorld {
    constructor() {
        this.engine = Engine.create();
        this.engine.world.gravity.y = 1; // Adjust for feel
        
        // Create ball body
        this.ballBody = Bodies.circle(100, 100, 20, {
            restitution: 0.5,
            friction: 0.1,
            density: 0.001
        });
        
        World.add(this.engine.world, this.ballBody);
    }
    
    updateBallProperties(elasticity) {
        Body.set(this.ballBody, 'restitution', elasticity);
    }
    
    update(delta) {
        Engine.update(this.engine, delta);
    }
}
```

---

## Prototype Testing Plan

### Week 2 Testing Goals
1. **Can kids figure out the core mechanic?** (without explanation)
2. **Do they understand property changes?** (visual feedback working?)
3. **Is dragging surfaces intuitive?** (touch/mouse controls)
4. **Do they want to keep playing?** (fun factor)
5. **What's confusing?** (note everything they struggle with)

### Testing Setup
```javascript
// Simple analytics for testing
class TestAnalytics {
    constructor() {
        this.events = [];
    }
    
    log(event, data) {
        this.events.push({
            time: Date.now(),
            event: event,
            data: data
        });
        
        // Log to console for immediate feedback
        console.log(`[TEST] ${event}:`, data);
    }
    
    // Track key metrics
    trackLevelAttempt(level, success, time) {
        this.log('level_attempt', {level, success, time});
    }
    
    trackSurfaceInteraction(type) {
        this.log('surface_interaction', {type});
    }
}
```

---

## Deployment for Testing

### Quick Hosting Options
```bash
# Option 1: GitHub Pages (Recommended)
# 1. Create repository
# 2. Push code
# 3. Enable Pages in settings
# URL: https://[username].github.io/bounceflow

# Option 2: Local Network
# Run locally and access from devices on same WiFi
npx http-server -p 8080
# Access at: http://[your-computer-ip]:8080

# Option 3: Netlify Drop
# Just drag folder to netlify.com/drop
# Instant URL for testing
```

### Mobile Testing Considerations
```javascript
// Touch controls
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

// Viewport setup for mobile
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

// Responsive canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Adjust game scale
    gameScale = Math.min(canvas.width / 800, canvas.height / 600);
}
```

---

## Success Criteria for Prototype

✅ **Technical Success**
- Ball physics feel good
- Property changes are smooth
- Surface manipulation is responsive
- Runs at 60fps on phones

✅ **Gameplay Success**  
- Kids understand without instruction
- They can complete level 1 in <3 attempts
- They want to play level 2
- Parents understand the physics teaching

✅ **Learning Success**
- Kids notice property patterns
- They predict when to release ball
- They experiment with different solutions
- They talk about bouncing/physics

---

## Next Steps After Prototype

If prototype succeeds:
1. Add more properties (weight, friction)
2. Create 15 levels for World 1
3. Add sound and particle effects
4. Implement full visual polish
5. Create proper menus/UI
6. Add the "pay if you love it" support option
7. Beta test with more families
8. Consider open sourcing

If prototype needs work:
1. Identify core confusion points
2. Simplify or amplify feedback
3. Adjust difficulty curve
4. Try different control schemes
5. Test alternative property change rates

---

## Resources & Learning

### Phaser Tutorials
- [Official Phaser 3 Tutorial](https://phaser.io/tutorials/making-your-first-phaser-3-game)
- [Phaser 3 Physics Examples](https://phaser.io/examples/v3/category/physics/matterjs)

### Matter.js Documentation  
- [Matter.js Demos](https://brm.io/matter-js/demo/)
- [Matter.js Docs](https://brm.io/matter-js/docs/)

### Kids Game Design
- [Designing Games for Children](https://www.nngroup.com/articles/childrens-websites-usability-issues/)
- [PBS Kids Game Design Principles](https://pbskids.org/lab/)

### Similar Games for Inspiration
- [Algodoo](https://www.algodoo.com/) - Physics sandbox
- [Happy Glass](https://www.crazygames.com/game/happy-glass) - Simple physics puzzler

---

*Remember: The goal is to validate the core concept - is changing properties while solving puzzles fun? Everything else can be polished later!*