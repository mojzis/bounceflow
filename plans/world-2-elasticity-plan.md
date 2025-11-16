# World 2: Elasticity - Design Plan

*BounceFlow World 2 - "When Bouncy Becomes a Variable"*

## World Overview

**Theme**: Dynamic Elasticity
**Core Learning**: Timing and prediction based on changing ball bounciness
**Levels**: 10 (IDs 16-25)
**Difficulty Progression**: Gentle introduction → timing mastery → complex predictions

### World 2 Philosophy

World 1 taught players spatial reasoning with static physics. World 2 introduces **time as a critical dimension** - the ball's elasticity now changes while bouncing, requiring players to:

1. **Observe patterns** - Recognize wave/pulse cycles
2. **Predict outcomes** - Anticipate future bounce heights
3. **Time releases** - Launch at optimal elasticity phases
4. **Adapt mid-flight** - Adjust surfaces during ball movement

**Key Teaching Goal**: "The right solution at the wrong time fails. Timing matters as much as positioning."

---

## Property Pattern Mechanics

### Wave Pattern (Smooth Transitions)
```javascript
propertyPattern: 'wave'
cycleSpeed: 0.001 // Default: ~10 second full cycle
```
- Elasticity smoothly oscillates between 0.2 (red, low bounce) and 0.8 (cyan, high bounce)
- Predictable sine wave pattern
- Visual: Color gradient provides instant feedback
- Teaching: Rhythm and pattern recognition

### Pulse Pattern (Sudden Changes)
```javascript
propertyPattern: 'pulse'
cycleSpeed: 0.001
```
- Elasticity spikes suddenly, then gradually returns to baseline
- Creates timing windows requiring precision
- Visual: Rapid color flashes
- Teaching: React to sudden changes, exploit brief windows

---

## Level Progression Strategy

### Early Levels (16-18): Discovery
- Introduce wave pattern in safe, forgiving scenarios
- Single obvious path, but timing matters
- Visual emphasis on property indicator
- Longer cycle times for easier prediction

### Mid Levels (19-21): Application
- Multiple surfaces requiring sequential timing
- Mix of locked and movable surfaces
- Introduce pulse pattern for variety
- Faster cycle speeds increase challenge

### Late Levels (22-25): Mastery
- Complex multi-bounce sequences
- Elasticity changes mid-trajectory affect outcome
- Combine wave and pulse patterns
- Obstacles (bird) require perfect timing

---

## Level Designs

### Level 16: "The Wave Begins"
**Teaching Goal**: Introduce wave pattern in simplest form

```javascript
{
    id: 16,
    name: "The Wave Begins",
    ballStart: { x: 150, y: 100 },
    surfaces: [
        { x: 400, y: 450, width: 300, angle: 0, locked: false }
    ],
    targets: [
        { x: 650, y: 200 }
    ],
    propertyPattern: 'wave',
    cycleSpeed: 0.0008, // Slower cycle for introduction
    hint: "Watch the ball's color! Release when it's cyan (bouncy) to reach the high target."
}
```

**Design Notes**:
- Single surface, single high target
- Target positioned high enough to require good elasticity
- Slow cycle speed gives time to observe pattern
- Teaches: Wait for high elasticity = high bounce

**Expected Solution**:
- Position surface below ball
- Wait for cyan (high elasticity)
- Release → single bounce → target

---

### Level 17: "Low and High"
**Teaching Goal**: Timing different elasticity phases for different targets

```javascript
{
    id: 17,
    name: "Low and High",
    ballStart: { x: 150, y: 100 },
    surfaces: [
        { x: 300, y: 420, width: 250, angle: 0, locked: false },
        { x: 550, y: 350, width: 200, angle: 15, locked: false }
    ],
    targets: [
        { x: 400, y: 380 }, // Low target
        { x: 680, y: 150 }  // High target
    ],
    propertyPattern: 'wave',
    cycleSpeed: 0.001,
    hint: "Collect the low star while red (low bounce), then wait for cyan to reach the high star!"
}
```

**Design Notes**:
- Two targets at different heights
- Requires collecting low target first while less bouncy
- Then adjusting surfaces during second bounce to reach high target
- Teaches: Different elasticity phases enable different paths

**Expected Solution**:
- Release at low elasticity
- Collect low target with controlled bounce
- Ball elasticity increases during flight
- Second bounce (now high elasticity) reaches high target

---

### Level 18: "Bounce Rhythm"
**Teaching Goal**: Multiple bounces with changing elasticity

```javascript
{
    id: 18,
    name: "Bounce Rhythm",
    ballStart: { x: 100, y: 150 },
    surfaces: [
        { x: 250, y: 450, width: 180, angle: 20, locked: false },
        { x: 450, y: 400, width: 180, angle: -15, locked: false },
        { x: 650, y: 350, width: 160, angle: 25, locked: false }
    ],
    targets: [
        { x: 350, y: 300 },
        { x: 650, y: 200 }
    ],
    propertyPattern: 'wave',
    cycleSpeed: 0.0012, // Slightly faster
    hint: "Create a rhythm - each bounce happens at a different elasticity!"
}
```

**Design Notes**:
- Three surfaces create bounce sequence
- Elasticity changes between bounces
- Targets positioned to reward good timing
- Teaches: Plan for future elasticity states

**Expected Solution**:
- Position surfaces to create bounce chain
- Release timing determines which targets are reachable
- Mid-wave release catches both targets as elasticity rises

---

### Level 19: "The Pulse"
**Teaching Goal**: Introduce pulse pattern and timing windows

```javascript
{
    id: 19,
    name: "The Pulse",
    ballStart: { x: 200, y: 100 },
    surfaces: [
        { x: 400, y: 460, width: 280, angle: 5, locked: false },
        { x: 600, y: 300, width: 160, angle: -30, locked: false }
    ],
    targets: [
        { x: 700, y: 150 }
    ],
    propertyPattern: 'pulse',
    cycleSpeed: 0.001,
    hint: "Wait for the pulse! The ball briefly becomes super bouncy."
}
```

**Design Notes**:
- First pulse pattern level
- High target requires catching the elasticity spike
- Visual: Dramatic color flash during pulse
- Teaches: Exploit brief high-elasticity windows

**Expected Solution**:
- Wait for pulse (sudden elasticity spike)
- Release during spike
- High bounce reaches target
- Timing window is narrow but clear

---

### Level 20: "Locked Rhythm"
**Teaching Goal**: Work with constraints while timing elasticity

```javascript
{
    id: 20,
    name: "Locked Rhythm",
    ballStart: { x: 150, y: 80 },
    surfaces: [
        { x: 300, y: 350, width: 200, angle: 0, locked: true },
        { x: 550, y: 350, width: 200, angle: 0, locked: true },
        { x: 425, y: 440, width: 150, angle: 45, locked: false },
        { x: 650, y: 250, width: 120, angle: -20, locked: false }
    ],
    targets: [
        { x: 500, y: 220 },
        { x: 730, y: 180 }
    ],
    propertyPattern: 'wave',
    cycleSpeed: 0.0011,
    hint: "Navigate through the gap - high elasticity helps you climb!"
}
```

**Design Notes**:
- Similar to World 1's "Narrow Gap" but with wave pattern
- Locked surfaces create constraints
- Timing determines if ball clears the gap
- Teaches: Combine spatial and temporal planning

**Expected Solution**:
- Position movable surface to direct ball through gap
- Release when elasticity is rising
- High bounce between locked surfaces reaches targets

---

### Level 21: "Double Pulse"
**Teaching Goal**: Multiple pulse timing opportunities

```javascript
{
    id: 21,
    name: "Double Pulse",
    ballStart: { x: 100, y: 100 },
    surfaces: [
        { x: 250, y: 420, width: 200, angle: 30, locked: false },
        { x: 450, y: 380, width: 180, angle: -25, locked: false },
        { x: 620, y: 320, width: 160, angle: 35, locked: false }
    ],
    targets: [
        { x: 350, y: 250 },
        { x: 550, y: 180 },
        { x: 700, y: 150 }
    ],
    propertyPattern: 'pulse',
    cycleSpeed: 0.0013, // Faster pulses
    hint: "Three stars, multiple pulses - timing is everything!"
}
```

**Design Notes**:
- Three targets at increasing heights
- Pulse pattern with faster cycles
- Each bounce can potentially catch a pulse
- Teaches: React to multiple timing windows

**Expected Solution**:
- Release during or near a pulse
- Surfaces create bounce sequence
- Timing determines which targets are collected
- May require restart if pulse timing is off

---

### Level 22: "Wave Maze"
**Teaching Goal**: Complex spatial + temporal puzzle

```javascript
{
    id: 22,
    name: "Wave Maze",
    ballStart: { x: 400, y: 100 },
    surfaces: [
        { x: 250, y: 280, width: 180, angle: 20, locked: true },
        { x: 550, y: 280, width: 180, angle: -20, locked: true },
        { x: 200, y: 440, width: 160, angle: 50, locked: false },
        { x: 400, y: 450, width: 140, angle: 0, locked: false },
        { x: 600, y: 440, width: 160, angle: -50, locked: false }
    ],
    targets: [
        { x: 150, y: 220 },
        { x: 400, y: 200 },
        { x: 650, y: 220 }
    ],
    propertyPattern: 'wave',
    cycleSpeed: 0.0012,
    hint: "Plan your path through the maze - elasticity determines which route works!"
}
```

**Design Notes**:
- Symmetrical locked obstacles create multiple paths
- Three movable surfaces at bottom
- Targets at different positions require different timing
- Teaches: Choose path based on current elasticity phase

**Expected Solution**:
- High elasticity: Bounce high over obstacles to center target
- Mid elasticity: Angle to side targets
- Requires reading wave position before release

---

### Level 23: "Cascade Timing"
**Teaching Goal**: Precise sequential timing with mixed patterns

```javascript
{
    id: 23,
    name: "Cascade Timing",
    ballStart: { x: 100, y: 50 },
    surfaces: [
        { x: 250, y: 200, width: 140, angle: -40, locked: true },
        { x: 400, y: 300, width: 140, angle: 40, locked: true },
        { x: 550, y: 400, width: 140, angle: -40, locked: true },
        { x: 300, y: 450, width: 120, angle: 35, locked: false },
        { x: 500, y: 470, width: 120, angle: -30, locked: false }
    ],
    targets: [
        { x: 180, y: 280 },
        { x: 480, y: 350 },
        { x: 680, y: 440 }
    ],
    propertyPattern: 'wave',
    cycleSpeed: 0.0014, // Faster wave
    hint: "The cascade creates a rhythm - flow with it!"
}
```

**Design Notes**:
- Diagonal cascade of locked surfaces
- Ball bounces down the cascade
- Elasticity changes during descent
- Targets positioned along cascade path
- Teaches: Adapt to changing physics during complex sequences

**Expected Solution**:
- Position movable surfaces to complement locked cascade
- Release timing determines trajectory down cascade
- Elasticity changes affect which targets are reachable

---

### Level 24: "Pulse Precision"
**Teaching Goal**: Mastery of pulse pattern with obstacles

```javascript
{
    id: 24,
    name: "Pulse Precision",
    ballStart: { x: 150, y: 100 },
    surfaces: [
        { x: 280, y: 320, width: 180, angle: 0, locked: true },
        { x: 520, y: 320, width: 180, angle: 0, locked: true },
        { x: 250, y: 460, width: 180, angle: 55, locked: false },
        { x: 450, y: 440, width: 140, angle: -10, locked: false },
        { x: 650, y: 240, width: 120, angle: 25, locked: false }
    ],
    targets: [
        { x: 400, y: 240 }, // Between locked surfaces
        { x: 700, y: 150 }
    ],
    propertyPattern: 'pulse',
    cycleSpeed: 0.0015, // Fast pulses
    hint: "Thread the needle during the pulse - precision required!"
}
```

**Design Notes**:
- Narrow gap between locked surfaces (like Level 8)
- But now pulse pattern makes timing critical
- Must catch pulse to bounce high enough
- Teaches: Combine spatial precision with temporal precision

**Expected Solution**:
- Wait for pulse
- Position surfaces for narrow gap shot
- Release during pulse for high bounce
- Thread between locked surfaces to reach targets

---

### Level 25: "Elasticity Mastery"
**Teaching Goal**: World 2 finale - everything together

```javascript
{
    id: 25,
    name: "Elasticity Mastery",
    ballStart: { x: 50, y: 100 },
    surfaces: [
        { x: 180, y: 250, width: 160, angle: 40, locked: true },
        { x: 350, y: 350, width: 140, angle: -35, locked: true },
        { x: 520, y: 250, width: 160, angle: 30, locked: true },
        { x: 250, y: 460, width: 140, angle: 50, locked: false },
        { x: 420, y: 450, width: 120, angle: -15, locked: false },
        { x: 600, y: 400, width: 140, angle: 40, locked: false },
        { x: 400, y: 180, width: 100, angle: 0, locked: false }
    ],
    targets: [
        { x: 120, y: 200 },
        { x: 350, y: 280 },
        { x: 580, y: 180 },
        { x: 720, y: 320 }
    ],
    propertyPattern: 'wave',
    cycleSpeed: 0.0016, // Fastest wave yet
    hint: "The ultimate elasticity challenge - use everything you've learned!"
}
```

**Design Notes**:
- Four targets across the field
- Mix of locked and movable surfaces
- Complex bounce paths required
- Fast wave cycle demands quick decision-making
- Optional: Bird obstacle spawns for extra challenge
- Teaches: Synthesis of all World 2 skills

**Expected Solution**:
- Multiple valid paths exist
- Optimal solution requires understanding wave timing
- Collecting all four targets needs 2-3 attempts to learn pattern
- Mastery feels rewarding - clear progression from Level 16

---

## Visual & UI Enhancements for World 2

### Enhanced Property Indicator
```javascript
// Larger, more prominent elasticity bar
// Show wave/pulse pattern preview (5 seconds ahead)
// Pulse indicator flashes to warn of upcoming spike
// Color-coded zones: Red (low), Yellow (mid), Cyan (high)
```

### World 2 Intro Screen
```
╔══════════════════════════════════════╗
║     WORLD 2: ELASTICITY              ║
║                                       ║
║  "The ball's bounce changes with     ║
║   time. Watch the colors, feel       ║
║   the rhythm, master the timing!"    ║
║                                       ║
║  New Mechanic: Dynamic Elasticity    ║
║  • Wave Pattern: Smooth cycles       ║
║  • Pulse Pattern: Sudden spikes      ║
║                                       ║
║         [START WORLD 2]               ║
╚══════════════════════════════════════╝
```

### Tutorial Overlay (Level 16 only)
```javascript
// First time entering Level 16, show brief overlay:
// "⚡ Watch the ball's color change!
//  Red = Low Bounce | Cyan = High Bounce
//  Time your release for the right bounce!"
//
// Dismiss after 5 seconds or on first interaction
```

---

## Difficulty Calibration

### Elasticity Ranges
- **Wave Pattern**: 0.2 (red) ↔ 0.8 (cyan)
- **Pulse Pattern**: 0.3 (baseline) → 0.9 (peak spike)

### Cycle Speed Progression
- Level 16: 0.0008 (12.5 second full cycle)
- Level 17-18: 0.001 (10 second cycle)
- Level 19-21: 0.0011-0.0013 (8-9 second cycle)
- Level 22-24: 0.0012-0.0015 (6.7-8.3 second cycle)
- Level 25: 0.0016 (6.25 second cycle)

### Target Positioning Philosophy
- **High targets** (y < 200): Require high elasticity (cyan phase)
- **Mid targets** (y 200-350): Flexible, teachable moments
- **Low targets** (y > 350): Easier with low elasticity (controlled bounces)

---

## Playtesting Success Criteria

### Level 16-18 (Discovery)
- ✅ Players notice color changes within 10 seconds
- ✅ 60%+ complete Level 16 in <5 attempts
- ✅ Players verbalize "wait for blue" or similar timing language

### Level 19-21 (Application)
- ✅ Players understand pulse pattern after 2-3 attempts
- ✅ Players adjust surfaces *during* ball flight (advanced skill)
- ✅ Completion time decreases (learning curve working)

### Level 22-25 (Mastery)
- ✅ Players plan multi-bounce sequences before release
- ✅ Players express satisfaction at complex solutions
- ✅ Less than 30% request solver hints (mastery without help)

### Overall World 2
- ✅ Elasticity becomes intuitive concept, not confusing mechanic
- ✅ Players want to continue to World 3
- ✅ Parents/educators see physics learning happening

---

## Connection to Future Worlds

### World 3: Mass Matters
- Build on timing skills from World 2
- Add mass changes (affects gravity/momentum)
- Heavier ball = different trajectory even at same elasticity
- Combined elasticity + mass = exponential complexity

### World 4: Friction Forces
- Elasticity (vertical) + Friction (horizontal)
- Players now manage two properties simultaneously
- Wave patterns can be offset (elasticity peaks while friction valleys)

### World 5+
- All properties change simultaneously
- World 2's timing mastery becomes foundational skill
- Players who mastered World 2 can handle multi-property chaos

---

## Technical Implementation Notes

### Code Changes Needed
```javascript
// levels.js
// Add 10 new level objects (IDs 16-25) with structure above

// game/index.js or StateController.js
// Add world transition screen after level 15 completion
if (currentLevel === 15 && victory) {
    showWorldTransition(2); // "World 2: Elasticity"
}

// No physics changes needed - wave/pulse already implemented in ball.js

// UI updates:
// - Enhance property indicator for wave preview
// - Add world intro screen
// - Tutorial overlay for Level 16 (one-time)
```

### Performance Considerations
- Wave pattern calculation is lightweight (sin function)
- No additional physics bodies needed
- Should maintain 60fps on all target devices

---

## Alternative Variations (Future Consideration)

### Easier Mode: "Elasticity Lite"
- Slower cycle speeds across all levels
- Visual prediction line shows future bounce height
- For younger players or accessibility

### Harder Mode: "Elasticity Chaos"
- Faster cycles (0.002+ speed)
- Random pattern switches mid-level
- For speedrunners and mastery seekers

### Challenge Mode Ideas
- "Fixed Timing": Ball released automatically after 5 seconds
- "Reverse Wave": Elasticity starts high, goes low
- "Double Wave": Two overlapping wave patterns

---

## Solver AI Considerations

The existing `SolverSystem` will need awareness of time dimension:

```javascript
// When simulating solutions for World 2 levels:
// - Try multiple release timings (not just surface positions)
// - Simulate starting at different elasticity phases
// - Find timing windows where solution works
// - Visualize: "Release when cyan" hint on solver display
```

This can be Phase 2 enhancement - initial World 2 release can show static solutions with timing hints in text.

---

## Sound Design Recommendations

### Elasticity Audio Cues
- **High elasticity**: Higher pitch bounce sound (C5-E5)
- **Low elasticity**: Lower pitch bounce sound (C3-E3)
- **Wave pattern**: Ambient wave-like background tone that cycles
- **Pulse pattern**: Sudden "whoosh" sound during spike
- **Color change**: Subtle "shimmer" sound at transitions

### Success Sounds
- Level completion: Upward arpeggio matching final elasticity
- All targets collected: Layered chimes at different elasticities

---

## Marketing & Educational Messaging

### For Parents
*"World 2 teaches kids to recognize patterns and predict outcomes - core skills in mathematics and science. By timing their actions to changing conditions, they're learning experimental thinking without realizing it!"*

### For Kids
*"The ball is alive! Watch it change colors and figure out when to let it go. Can you master the rhythm and collect all the stars?"*

### For Educators
*"World 2 introduces students to periodic functions (sine waves) and timing-dependent systems. Great bridge to discussions about oscillation, waves, and time-varying phenomena in physics."*

---

## Success Metrics

### Technical Metrics
- All 10 levels functional and balanced
- No physics bugs with property changes
- Smooth 60fps on target devices
- UI clearly communicates property state

### Gameplay Metrics
- Average attempts per level: 3-7 (challenging but fair)
- World 2 completion rate: >70% of players who start it
- Hint usage: <40% (most players can solve without AI)
- Level 16-25 completion time: 15-25 minutes for average player

### Learning Metrics
- Players demonstrate timing awareness in later worlds
- Positive feedback on "pattern recognition" from educators
- Kids describe mechanics using physics language spontaneously

---

## Final Notes

World 2 represents the critical second step in BounceFlow's learning journey. World 1 taught "where" - World 2 teaches "when". Together, they prepare players for the multi-dimensional challenges ahead.

**Core Philosophy**: Every level should have an "aha!" moment where timing clicks. The color feedback system is crucial - if players aren't watching the ball's color by Level 18, something needs adjustment.

**Playtesting Focus**: Watch for moments when kids say "wait..." before releasing the ball. That's the timing awareness we're building. If they're button-mashing without observation, difficulty needs adjustment or feedback needs amplification.

**The ultimate success**: Kids internalize that *timing transforms possibility* - a lesson that extends far beyond BounceFlow.

---

**Ready to implement when approved. Estimated development time: 4-6 hours for level data + UI enhancements + testing.**
