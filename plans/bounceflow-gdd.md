# BounceFlow - Game Design Document
*Version 1.0 - Living Document*

## Executive Summary

**BounceFlow** is a physics-based puzzle game where players guide an ever-changing bouncing ball to targets by manipulating the environment rather than the ball itself. As the ball's physical properties (weight, elasticity, friction) shift dynamically over time, players must adapt their surface configurations in real-time, creating an evolving puzzle that teaches physics principles through playful experimentation.

Created as a passion project for kids to learn physics through play, BounceFlow is completely free with no ads - just pure, educational fun.

**Core Hook:** "What if the solution to a puzzle kept changing while you were solving it?"

---

## Game Overview

### Genre
Physics Puzzle / Educational Casual

### Platform
Primary: Mobile (iOS/Android)  
Secondary: Web Browser, Steam

### Target Audience
- **Primary:** Kids aged 8-14 who love experimenting and discovering
- **Secondary:** Parents looking for screen time that's actually beneficial
- **Tertiary:** Teachers seeking engaging ways to demonstrate physics
- **Bonus:** Adults who just love good puzzle games

### Unique Selling Points
1. **Dynamic Physics Evolution** - Ball properties change during gameplay, not just between levels
2. **Indirect Control Mastery** - Manipulate the environment, not the object
3. **Stealth Learning** - Physics concepts taught through play, never through instruction
4. **Emergent Solutions** - Multiple valid approaches emerge from physics interactions
5. **Vibrant Feedback System** - Every physics change visible through color, sound, and animation

---

## Core Gameplay

### Primary Mechanic
Players **adjust floor surfaces** (angle, position, material properties) to guide a **continuously bouncing ball** with **dynamically changing properties** toward targets while avoiding hazards.

### The Three Pillars

#### 1. The Ball - Autonomous Agent
- Bounces continuously once released
- Properties change on predictable cycles:
  - **Elasticity** (bounciness): 0.3 → 0.9 over 10 seconds
  - **Weight** (mass): Light → Heavy over 15 seconds  
  - **Friction** (grip): Slippery → Sticky over 12 seconds
- Visual states clearly communicate current properties
- Never directly controlled by the player

#### 2. The Surfaces - Player's Tools
Players can:
- **Rotate** surfaces (0-360°)
- **Position** surfaces (drag to move)
- **Modify** surface materials:
  - Rubber (high bounce, high friction)
  - Ice (low friction, normal bounce)
  - Foam (absorbs energy, low bounce)
  - Spring (amplifies bounce)
  - Conveyor (adds horizontal momentum)
- **Activate** special elements:
  - Bounce pads (fixed elastic boost)
  - Gravity wells (attraction points)
  - Wind zones (directional force)

#### 3. The Goals - Success Metrics
- **Primary:** Guide ball through all star pickups
- **Secondary:** Complete within time/bounce limits
- **Tertiary:** Achieve perfect trajectory bonus

### Control Scheme

**Mobile:**
- Tap & drag to move surfaces
- Two-finger rotate for angles
- Tap material icons to cycle types
- Pinch to zoom camera
- Play button releases the ball

**Desktop:**
- Click & drag surfaces
- Right-click + drag to rotate
- Number keys select materials
- Scroll wheel zooms
- Spacebar releases ball

---

## Physics System

### Ball Properties

| Property | Range | Default | Change Rate | Visual Indicator |
|----------|-------|---------|-------------|------------------|
| Elasticity | 0.2 - 1.0 | 0.5 | ±0.1/second | Color gradient (red→blue) |
| Mass | 0.5 - 5.0 | 1.0 | ±0.3/second | Size scaling + glow intensity |
| Friction | 0.1 - 0.9 | 0.5 | ±0.08/second | Surface texture (smooth→rough) |
| Gravity Scale | 0.5 - 2.0 | 1.0 | Special levels only | Particle trail density |

### Property Change Patterns

**Wave Pattern (Default)**
- Smooth sine wave transitions
- Predictable peaks and valleys
- Period: 10-20 seconds

**Pulse Pattern**  
- Sudden property spikes
- Returns to baseline gradually
- Creates timing challenges

**Cascade Pattern**
- Properties change in sequence
- One peaks as another valleys
- Requires multi-property planning

### Surface Materials

| Material | Elasticity | Friction | Special Effect |
|----------|------------|----------|----------------|
| Rubber | 0.8 | 0.9 | Slight grip delay |
| Ice | 0.5 | 0.05 | Acceleration zones |
| Foam | 0.2 | 0.6 | Energy absorption |
| Spring | 1.5 | 0.5 | Directional boost |
| Metal | 0.4 | 0.3 | Predictable angles |
| Conveyor | 0.5 | 0.7 | Constant velocity add |

### Physics Rules
- Gravity: -9.81 m/s² (adjustable per level)
- Max velocity: 20 m/s (prevents uncontrolled speeds)
- Angular momentum: Preserved through bounces
- Energy loss: 5% per collision (unless perfect elastic)
- Collision detection: Continuous for ball, discrete for environment

---

## Visual Design

### Art Direction
**Style:** Vibrant Minimalist Physics Playground
- Clean geometric shapes with soft edges
- High contrast between interactive and static elements
- Particle effects emphasize physics changes
- UI elements float with subtle parallax

### Color Philosophy
- **Ball States:** Gradient shifts communicate properties
  - Heavy: Deep purple/red (#8B2F55 → #4A1942)
  - Light: Bright cyan/green (#4ECDC4 → #95E1D3)
  - Bouncy: Electric blue/yellow (#3D5AFE → #FFE66D)
  - Sticky: Orange/pink (#FF6B6B → #FF8CC3)
  
- **Surfaces:** Distinct material recognition
  - Rubber: Matte black (#2D2D2D)
  - Ice: Translucent blue (#E3F2FD + transparency)
  - Foam: Soft yellow (#FFF3B8)
  - Spring: Metallic green (#76FF03)
  
- **Environment:** Calming backdrop
  - Gradient backgrounds shift with progress
  - Subtle geometric patterns suggest physics grids
  - 30% opacity for non-interactive elements

### Visual Feedback Hierarchy

1. **Property Changes (Highest Priority)**
   - Color morphing over 2 seconds
   - Size pulsing for mass changes
   - Particle burst at transition points
   - Trail effects match current state

2. **Collision Events**
   - Screen shake scaled to impact force
   - Ripple effects from contact points
   - Spark particles colored by surface material
   - Squash/stretch deformation

3. **Success States**
   - Star collection: Rainbow burst
   - Level complete: Confetti cascade
   - Perfect run: Aurora effect overlay

### Character Design
**The Ball - "Bounce"**
- Simple circle with subtle face (two dots for eyes)
- Eyes track trajectory for anticipation
- Expressions change with property states:
  - Heavy: Sleepy/struggling
  - Light: Alert/excited
  - Bouncy: Wide-eyed/surprised
  - Sticky: Focused/determined

---

## Audio Design

### Dynamic Audio System
Audio responds to both ball properties and player actions:

**Ball Property Sonification**
- Mass: Pitch decreases as weight increases (C5 → C2)
- Elasticity: Reverb/echo increases with bounciness
- Friction: Static/texture sounds for high friction

**Collision Sounds**
- Frequency = f(mass) × f(velocity)
- Material-specific timbres:
  - Rubber: "Thump" with quick decay
  - Ice: "Clink" with sustain
  - Foam: "Puff" with no resonance
  - Spring: "Boing" with pitch bend

**Musical Progression**
- Ambient track builds with level completion
- Successful bounces add musical notes
- Property changes trigger instrument switches
- Perfect runs unlock melody layers

---

## Level Design

### Teaching Progression

**World 1: Foundations (Levels 1-15)**
- Static ball properties
- Introduce surface types individually
- Focus: Angle and position mastery

**World 2: Elasticity (Levels 16-30)**
- Ball elasticity changes predictably
- Surfaces remain simple
- Focus: Timing bouncy/non-bouncy phases

**World 3: Mass Matters (Levels 31-45)**
- Weight changes affect trajectory
- Introduce momentum puzzles
- Focus: Heavy/light state exploitation

**World 4: Friction Forces (Levels 46-60)**
- Sliding vs gripping challenges
- Conveyor and ice combinations
- Focus: Horizontal momentum control

**World 5: Everything Changes (Levels 61-75)**
- All properties shift simultaneously
- Complex surface combinations
- Focus: Multi-variable planning

**World 6: Chaos Theory (Levels 76-90)**
- Rapid property changes
- Environmental hazards (wind, magnets)
- Focus: Adaptation and recovery

### Level Structure Template

```
Level [Number]: [Name]
Teaching Goal: [Physics concept]
Properties: [Which change and how]
New Element: [If any]
Par: [Target bounces/time]
Stars:
- ⭐ Complete level
- ⭐⭐ Collect all bonuses
- ⭐⭐⭐ Under par + perfect trajectory
```

### Difficulty Curve
- Introduce ONE new concept per 3 levels
- Every 5th level is a "breather" (easier)
- Every 10th level combines all recent concepts
- Boss levels (every 15) add unique mechanics

---

## Progression Systems

### Unlock Structure
- Linear world progression (complete 80% to unlock next)
- Stars unlock bonus levels within worlds
- Hidden levels found through perfect completions
- Daily challenges independent of main progression

### Player Rewards

**Immediate Rewards**
- Stars (1-3 per level)
- Score based on efficiency
- New surface materials
- Ball cosmetics (trails, particles)

**Meta Rewards**
- World completion medals
- Achievement badges (hidden objectives)
- Leaderboard positions
- Gallery unlocks (concept art, physics facts)

### Support Model (Pay-What-You-Want)

**Philosophy:**
- Completely free to play forever
- No ads, no commercial interruptions
- Optional support for those who love it
- Built with love for kids to learn and play

**Optional Support Tiers:**
- "Coffee Tip" ($2.99) - Thank you message + special ball trail
- "Pizza Fund" ($5.99) - Unlock fun cosmetic pack + behind-the-scenes gallery
- "High Five" ($9.99) - All cosmetics + your name in credits
- "Super Friend" ($19.99) - Everything + early access to new worlds

**All gameplay content is always free** - supporters just get fun visual extras and our eternal gratitude!

---

## Educational Integration

### Physics Concepts (Taught Implicitly)

**Newton's Laws**
- Inertia through momentum preservation
- F=ma through weight changes
- Action/reaction in collisions

**Energy**
- Kinetic/potential conversion
- Conservation with perfect elasticity
- Energy loss through friction

**Forces**
- Gravity effects on different masses
- Normal force on angled surfaces
- Friction types and coefficients

**Waves & Oscillation**
- Periodic motion patterns
- Resonance in timing puzzles
- Wave interference in complex bounces

### Stealth Assessment
Track player understanding through:
- Solution efficiency metrics
- Material choice patterns
- Angle precision improvement
- Adaptation speed to property changes

### Parent/Teacher Portal
- Progress tracking dashboard
- Physics concepts map
- Printable activity extensions
- Classroom competition modes

---

## Technical Specifications

### Engine
Unity 2023.2 LTS (cross-platform compatibility)

### Physics
- Box2D for 2D physics simulation
- 60 Hz physics update rate
- Interpolation for smooth visuals

### Target Performance
- 60 FPS on devices from 2019+
- Load time <3 seconds per level
- Battery life: 3+ hours continuous play

### Minimum Requirements
- **iOS:** iPhone 8 / iOS 13+
- **Android:** 3GB RAM / Android 8.0+
- **Web:** WebGL 2.0 support
- **Storage:** 200MB initial, 500MB full

---

## Development Milestones

### Prototype Phase (Month 1-2)
- Core physics prototype
- Property change system
- 5 test levels
- Kids playtesting for fun factor

### Core Build (Month 3-4)
- World 1 complete (15 levels)
- Tutorial that doesn't feel like a tutorial
- Basic UI/UX
- Sound system

### Content Creation (Month 5-6)
- Worlds 2-3 complete
- Star rating system
- Difficulty tested with actual kids
- Particle effects that spark joy

### Polish Phase (Month 7-8)
- Worlds 4-6 complete
- All visual feedback systems
- Performance optimization
- Family & friends beta testing

### Release (Month 9)
- Share with the world for free
- Post in parenting/education communities
- Open source considerations
- Gather feedback for improvements

### Living Game (Ongoing)
- Add levels based on player feedback
- Community-suggested features
- Maybe level editor if kids want to create
- Keep it free, keep it fun

---

## Success Metrics

### Engagement Targets
- Day 1 Retention: 40%
- Day 7 Retention: 20%  
- Day 30 Retention: 10%
- Average Session: 12 minutes
- Sessions per Day: 2.3
- Levels attempted before hints: 3+

### Joy & Learning Goals
- Kids play without frustration
- Parents play together with kids
- Players discover physics principles naturally
- 4.5+ happiness rating
- Positive feedback from educators
- Kids asking "can we play BounceFlow?"

---

## Risk Analysis

### Design Risks
- **Complexity overwhelming casual players**
  - Mitigation: Extensive playtesting, optional hints
- **Property changes feeling arbitrary**
  - Mitigation: Visual predictors, consistent patterns

### Technical Risks  
- **Physics inconsistency across devices**
  - Mitigation: Fixed timestep, deterministic physics
- **Performance on low-end devices**
  - Mitigation: Scalable quality settings

### Market Risks
- **Standing out among many free games**
  - Mitigation: Word-of-mouth from happy families
- **Reaching parents and educators**
  - Mitigation: Share in parenting/education communities

---

## Appendices

### A. Competitor Analysis
- Angry Birds: Trajectory prediction
- Peggle: Celebration moments
- Cut the Rope: Character appeal
- World of Goo: Emergent solutions
- Monument Valley: Visual polish

### B. Accessibility Features
- Colorblind modes (symbols + patterns)
- Difficulty assists (slow-motion, hints)
- One-handed play options
- Screen reader support for menus
- Subtitles for audio cues

### C. Localization Plan
- Launch: English, Spanish, Portuguese
- Month 2: French, German, Italian  
- Month 4: Japanese, Korean, Simplified Chinese
- Month 6: Russian, Arabic, Hindi

### D. Community Features
- Level editor (when kids ask for it)
- Solution sharing via replay codes
- Weekly family challenges
- Open source possibility after stable release
- Community contributions welcome

### E. Open Development Philosophy
- Share development progress openly
- Kids can suggest features
- Teachers can request specific physics concepts
- Consider open-sourcing for educational use
- Build it together with the community

---

*This document is maintained as a living reference and will be updated weekly during development to reflect design evolution and playtesting insights.*

## Development Philosophy

This game is being built with love for kids to discover the joy of physics through play. No ads, no manipulative mechanics, no forced purchases - just pure learning through fun. If families love it and want to support it, that's wonderful. But the real success is seeing kids' eyes light up when they figure out how to use momentum to reach that tricky star, or when they realize they can predict when the ball will be bouncy enough to make that impossible jump.

**Because the best educational games are the ones kids don't realize are educational.**