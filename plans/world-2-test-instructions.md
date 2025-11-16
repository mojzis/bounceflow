# World 2 Tester Agent Instructions

## Your Mission
Thoroughly test World 2: Elasticity (Levels 16-25) for gameplay quality, physics accuracy, and educational effectiveness.

## Primary Tasks

### 1. Functional Testing
- Verify all 10 levels load without errors
- Test level progression (15 → 16 → 17 → ... → 25)
- Confirm property patterns work correctly (wave/pulse)
- Check collision detection with targets
- Validate win conditions trigger properly

### 2. Gameplay Testing
- Test each level's solvability
- Verify difficulty progression (easier → harder)
- Check that hints are helpful and accurate
- Ensure timing windows are fair (not impossible)
- Test restart functionality (R key)

### 3. Physics Validation
- Confirm elasticity changes visually (color shifts)
- Verify wave pattern cycles correctly
- Test pulse pattern spikes at right times
- Check cycle speeds match specifications
- Ensure ball physics feel consistent

### 4. User Experience Testing
- Test world transition screen (after Level 15)
- Verify tutorial overlay on Level 16 (if implemented)
- Check property indicator shows correct state
- Test keyboard controls (Space, R, V, ?)
- Validate solver hints work for World 2 levels

### 5. Edge Case Testing
- Test boundary conditions (ball off-screen)
- Verify behavior at elasticity extremes (0.2 and 0.8)
- Test rapid level transitions
- Check browser console for errors/warnings
- Test on different screen sizes if possible

## Testing Process

### Setup
1. Start dev server: `npm run dev`
2. Open browser to localhost
3. Open browser console for errors
4. Progress to Level 16 (or use dev tools to skip)

### For Each Level (16-25)

#### Automated Checks
```javascript
// In browser console, verify level data:
console.log(getLevel(16)); // Check structure
console.log(getTotalLevels()); // Should be 25
```

#### Manual Gameplay Tests
1. **Load Level** - No errors, all elements appear
2. **Property Pattern** - Ball color changes correctly
3. **Solvability** - Can you solve it in <10 attempts?
4. **Difficulty** - Appropriate for position in progression?
5. **Hint Quality** - Is hint helpful without spoiling?
6. **Targets** - All collectible, proper hit detection
7. **Surfaces** - Correct angles, locked/unlocked as specified
8. **Win Condition** - Victory screen triggers correctly

#### Physics Checks
- **Wave Pattern** (16-18, 20, 22-23, 25):
  - Color smoothly transitions red → cyan → red
  - Full cycle time matches specification
  - Visual indicator reflects actual elasticity

- **Pulse Pattern** (19, 21, 24):
  - Sudden color flash indicates spike
  - Baseline elasticity between pulses
  - Timing windows are catchable (not too fast)

### Specific Level Tests

**Level 16: "The Wave Begins"**
- Tutorial overlay appears (first time)
- Single surface is easily manipulated
- High target reachable with high elasticity
- Teaches basic timing concept clearly

**Level 19: "The Pulse"**
- First pulse level introduces pattern clearly
- Pulse timing window is fair (~1-2 seconds)
- Visual feedback distinct from wave pattern

**Level 25: "Elasticity Mastery"**
- Most complex World 2 level
- All 4 targets are reachable (solution exists)
- Requires skills from earlier levels
- Feels like satisfying conclusion to world

### Difficulty Progression Check
Plot subjective difficulty (1-10 scale):
- Level 16: Should be ~3/10 (introduction)
- Level 20: Should be ~5/10 (midpoint)
- Level 25: Should be ~7/10 (mastery, but not unfair)

Progression should feel steady, not spiky.

### Educational Effectiveness
- Do levels teach timing awareness?
- Can you predict outcomes based on color?
- Does wave pattern become intuitive?
- Would kids understand the mechanics?

## Testing Checklist

### Must Pass
- [ ] All 10 levels load without errors
- [ ] All levels are solvable (solution exists)
- [ ] Property patterns work correctly (wave/pulse)
- [ ] Level progression 15→16→...→25 works
- [ ] No physics bugs (infinite velocity, stuck ball, etc.)
- [ ] Win conditions trigger correctly
- [ ] Restart (R) works on all levels

### Should Pass
- [ ] World transition screen appears after Level 15
- [ ] Difficulty progression feels smooth
- [ ] Hints are helpful and accurate
- [ ] Timing windows are fair (not frustrating)
- [ ] Visual feedback clearly shows elasticity state
- [ ] Each level teaches something new

### Nice to Pass
- [ ] Tutorial overlay on Level 16 (first time)
- [ ] Enhanced property indicator with preview
- [ ] Solver hints work for World 2 levels
- [ ] No console warnings or errors
- [ ] Responsive on different screen sizes

## Bug Reporting Format

If you find issues, report clearly:

```markdown
### Bug: [Short Description]
**Level**: [Number]
**Severity**: Critical / Major / Minor
**Steps to Reproduce**:
1. Load Level X
2. Do Y
3. Observe Z

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Screenshot/Console Error**: [If applicable]
**Suggested Fix**: [If obvious]
```

## Performance Testing

### Frame Rate
- Check FPS stays near 60fps during gameplay
- Test with multiple bounces and particles active
- Note any slowdown on complex levels

### Memory
- Watch browser memory usage over time
- Check for memory leaks during repeated plays
- Test rapid level transitions

## Accessibility Testing

- Can you play without sound (visual cues sufficient)?
- Are color changes visible to colorblind players?
- Are timing windows forgiving enough for varying skill levels?

## Test Results Document

Create a summary with:

### Overall Assessment
- **Solvability**: X/10 levels fully solvable
- **Difficulty**: Progression feels [smooth/spiky/too easy/too hard]
- **Physics**: [Working perfectly / Minor issues / Major bugs]
- **UX**: [Polished / Functional / Needs work]

### Level-by-Level Summary
| Level | Solvable | Difficulty | Physics | Notes |
|-------|----------|------------|---------|-------|
| 16 | ✅ | Easy | ✅ | Good intro |
| 17 | ✅ | Medium | ✅ | ... |
| ... | ... | ... | ... | ... |

### Bugs Found
- List all bugs with severity
- Critical bugs block release
- Major bugs need fixing before review
- Minor bugs can be noted for future

### Recommendations
- What needs fixing before ship?
- What could be improved?
- What worked really well?

## Success Criteria

✅ **All 10 levels are solvable** (critical)
✅ **No game-breaking bugs** (critical)
✅ **Property patterns work correctly** (critical)
✅ **Difficulty progression is smooth** (important)
✅ **Timing is fair, not frustrating** (important)
✅ **Educational goals are met** (nice to have clear)

## When You're Done

1. **Complete the test results document**
2. **List all bugs found** with severity ratings
3. **Provide gameplay feedback** (too easy/hard/just right?)
4. **Suggest improvements** for Developer to address
5. **Give go/no-go recommendation** for code review

---

**Remember**: You're the quality gatekeeper. Be thorough but fair. The goal is shippable World 2 content, not perfection. Focus on critical bugs and gameplay feel.

Happy testing! 🎮
