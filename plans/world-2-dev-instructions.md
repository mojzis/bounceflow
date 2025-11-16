# World 2 Developer Agent Instructions

## Your Mission
Implement World 2: Elasticity (Levels 16-25) based on the detailed plan in `plans/world-2-elasticity-plan.md`.

## Primary Tasks

### 1. Add 10 New Levels to levels.js
- Add levels 16-25 with exact specifications from the plan
- Each level includes:
  - `id`, `name`, `ballStart`, `surfaces`, `targets`
  - `propertyPattern` ('wave' or 'pulse')
  - `cycleSpeed` (0.0008 to 0.0016 range)
  - `hint` text for players

### 2. World Transition Screen
- Add transition screen after Level 15 completion
- Display: "WORLD 2: ELASTICITY" with brief description
- Show new mechanics: Wave Pattern and Pulse Pattern
- Add START button to begin Level 16

### 3. UI Enhancements (Optional - do if time permits)
- Enhanced elasticity bar with wave preview (5 seconds ahead)
- Color-coded zones on property indicator (Red/Yellow/Cyan)
- Pulse warning indicator (flashes before pulse spike)

### 4. Tutorial Overlay for Level 16
- One-time overlay on first entry to Level 16
- Message: "Watch the ball's color change! Red = Low Bounce | Cyan = High Bounce. Time your release for the right bounce!"
- Dismisses after 5 seconds or on first interaction
- Store dismissed state in localStorage to not show again

## Implementation Guidelines

### Code Style
- Follow existing patterns in `src/levels.js`
- Use existing game architecture (no major refactoring)
- Maintain consistency with World 1 level structure

### Level Data Format
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
    cycleSpeed: 0.0008,
    hint: "Watch the ball's color! Release when it's cyan (bouncy) to reach the high target."
}
```

### Testing Your Implementation
- Verify all 10 levels load without errors
- Check that `getTotalLevels()` returns 25 (was 15, now 25)
- Ensure property patterns work (wave/pulse already implemented in ball.js)
- Test level progression from 15 → 16 transition

### Files to Modify
- **src/levels.js** - Add 10 new level objects (primary task)
- **src/game/StateController.js** or **src/game/index.js** - World transition logic
- **src/game/UIManager.js** - Tutorial overlay logic (if implementing)
- **src/styles/style.css** - Styling for world transition screen

### Files to Reference (Don't Modify)
- **plans/world-2-elasticity-plan.md** - Complete level specifications
- **src/ball.js** - Property pattern system (already implemented)
- **src/game/LevelManager.js** - Level loading system

## Success Criteria

### Must Have
✅ All 10 levels (16-25) added to LEVELS array
✅ Each level has correct propertyPattern and cycleSpeed
✅ Level progression works (can advance from 15 → 16 → ... → 25)
✅ No console errors when loading levels
✅ getTotalLevels() returns 25

### Should Have
✅ World transition screen appears after Level 15
✅ Transition screen is visually consistent with game style
✅ Levels follow exact specifications from plan

### Nice to Have
✅ Tutorial overlay on Level 16 (first time only)
✅ Enhanced property indicator with wave preview
✅ Pulse warning indicator

## Development Process

1. **Read the plan** - Fully review `plans/world-2-elasticity-plan.md`
2. **Read existing code** - Understand current level structure and game flow
3. **Implement levels** - Add all 10 levels to levels.js
4. **Test locally** - Use `npm run dev` to test in browser
5. **Add UI enhancements** - World transition screen at minimum
6. **Final verification** - All levels load and progress correctly
7. **Commit your work** - Clear commit message describing changes

## Helpful Context

### Existing Property System
The ball.js already implements:
- `propertyPattern: 'static'` - No changes (World 1)
- `propertyPattern: 'wave'` - Sine wave oscillation
- `propertyPattern: 'pulse'` - Sudden spikes

You just need to specify the pattern in level data - the physics already works!

### Canvas Dimensions
- Width: ~800px
- Height: ~500px
- Use these bounds when verifying level coordinates

### Cycle Speed Guide
- 0.0008 = ~12.5 second full cycle (slowest, easiest)
- 0.001 = ~10 second cycle (World 2 default)
- 0.0016 = ~6.25 second cycle (fastest, hardest)

## Questions to Consider

- Do all level coordinates fit within canvas bounds?
- Are locked vs unlocked surfaces clearly indicated?
- Do cycle speeds progress logically (easier → harder)?
- Are hints helpful but not spoilers?

## When You're Done

1. **Create a summary** of what you implemented
2. **List any issues** encountered or deviations from plan
3. **Note any suggestions** for the Tester or Reviewer agents
4. **Commit your changes** with descriptive message
5. **Report completion** with file paths modified

---

**Remember**: Your goal is solid implementation, not perfection. The Tester will validate gameplay and the Reviewer will check code quality. Focus on accurate implementation of the plan.

Good luck! 🚀
