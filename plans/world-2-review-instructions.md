# World 2 Reviewer Agent Instructions

## Your Mission
Review the World 2 implementation for code quality, plan adherence, educational effectiveness, and maintainability.

## Primary Tasks

### 1. Code Quality Review
- Verify code follows existing patterns and conventions
- Check for potential bugs or edge cases
- Ensure proper error handling
- Review performance implications
- Validate data structure consistency

### 2. Plan Adherence Review
- Compare implementation against `plans/world-2-elasticity-plan.md`
- Verify all 10 levels match specifications
- Check that educational goals are met
- Ensure difficulty progression is correct
- Validate property patterns and cycle speeds

### 3. Educational Effectiveness Review
- Do levels teach timing and prediction?
- Is the learning curve appropriate?
- Are hints pedagogically sound?
- Will kids understand the mechanics?
- Does it build on World 1 concepts?

### 4. Maintainability Review
- Is code easy to understand and modify?
- Are comments helpful and accurate?
- Could future developers extend this?
- Is it consistent with project architecture?
- Any technical debt introduced?

## Review Process

### 1. Read the Plan
Start by thoroughly reading `plans/world-2-elasticity-plan.md` to understand:
- Educational goals for World 2
- Level progression strategy
- Specific level designs
- UI/UX requirements
- Success criteria

### 2. Review Code Changes

#### Primary File: src/levels.js
Check each of the 10 new levels (16-25):

```javascript
// For each level, verify:
✓ Correct id (16-25)
✓ Descriptive name matches plan
✓ ballStart coordinates within bounds
✓ surfaces array has correct count
✓ Each surface has x, y, width, angle, locked
✓ targets array matches plan
✓ propertyPattern is 'wave' or 'pulse'
✓ cycleSpeed matches specification
✓ hint is helpful and accurate
```

#### Level-Specific Checks

**Level 16: "The Wave Begins"**
- ballStart: { x: 150, y: 100 } ✓
- 1 surface, 1 target ✓
- propertyPattern: 'wave' ✓
- cycleSpeed: 0.0008 (slowest) ✓
- Teaching goal: Introduce wave pattern ✓

**Level 19: "The Pulse"**
- First pulse pattern level ✓
- propertyPattern: 'pulse' ✓
- Introduces new mechanic clearly ✓

**Level 25: "Elasticity Mastery"**
- Most complex World 2 level ✓
- 7 surfaces, 4 targets ✓
- cycleSpeed: 0.0016 (fastest) ✓
- Synthesis of all World 2 skills ✓

### 3. Review UI Changes

#### World Transition Screen
- Appears after Level 15 completion ✓
- Displays "WORLD 2: ELASTICITY" ✓
- Explains new mechanics ✓
- Visual design consistent with game ✓
- Can progress to Level 16 ✓

#### Tutorial Overlay (if implemented)
- Shows on first Level 16 entry ✓
- Clear, concise explanation ✓
- Dismisses appropriately ✓
- Doesn't show again (localStorage) ✓

#### Enhanced Property Indicator (if implemented)
- Shows wave/pulse pattern preview ✓
- Color-coded zones (Red/Yellow/Cyan) ✓
- Updates in real-time ✓

### 4. Code Quality Checks

#### Data Structure Consistency
```javascript
// All levels should follow this exact structure:
{
    id: number,
    name: string,
    ballStart: { x: number, y: number },
    surfaces: [
        { x: number, y: number, width: number, angle: number, locked: boolean }
    ],
    targets: [
        { x: number, y: number }
    ],
    propertyPattern: 'static' | 'wave' | 'pulse',
    cycleSpeed: number,
    hint: string
}
```

#### Common Mistakes to Catch
- Missing commas in arrays
- Typos in property names (propertyPatern vs propertyPattern)
- Incorrect locked values (string 'false' vs boolean false)
- Coordinates outside canvas bounds (x: 0-800, y: 0-500)
- Missing closing braces/brackets
- Inconsistent spacing/formatting

#### Performance Considerations
- Are there too many surfaces in any level? (>10 could slow down)
- Are cycleSpeed values reasonable? (0.0005-0.002 range)
- Any level that could cause physics instability?

### 5. Progression Analysis

#### Difficulty Curve
Plot the difficulty based on:
- Number of surfaces
- Number of targets
- Locked vs unlocked surfaces
- Cycle speed (faster = harder)
- Target positions (high targets harder with timing)

Expected progression:
```
Level 16-18: Introduction (3-5 difficulty)
Level 19-21: Application (5-7 difficulty)
Level 22-25: Mastery (7-9 difficulty)
```

Should NOT see spikes or drops - smooth curve.

#### Cycle Speed Progression
Verify speeds increase gradually:
```
16: 0.0008 (12.5s cycle)
17-18: 0.001 (10s)
19-21: 0.0011-0.0013 (8-9s)
22-24: 0.0012-0.0015 (7-8s)
25: 0.0016 (6.25s)
```

#### Teaching Progression
Each level should introduce or reinforce:
- L16: Wave observation
- L17: Different elasticity phases
- L18: Multi-bounce timing
- L19: Pulse pattern introduction
- L20: Constraints + timing
- L21: Multiple pulses
- L22: Spatial + temporal complexity
- L23: Sequential timing
- L24: Pulse precision
- L25: Synthesis

### 6. Educational Review

#### Learning Objectives Met?
- ✓ Pattern recognition (wave cycles)
- ✓ Prediction skills (future elasticity states)
- ✓ Timing awareness (when to release)
- ✓ Adaptation (mid-flight adjustments)
- ✓ Physics intuition (elasticity affects bounce height)

#### Stealth Learning Assessment
- Kids shouldn't feel "taught" - should feel like discovery
- Visual feedback (color) more important than text explanations
- Hints guide without spoiling
- Failure teaches (try different timing)

#### Age Appropriateness (8-14 years)
- Language at appropriate reading level?
- Complexity matches cognitive development?
- Timing windows forgiving enough?
- Frustration level appropriate?

### 7. Maintainability Review

#### Code Readability
- Easy to find and edit specific levels?
- Clear naming conventions?
- Logical organization?
- Comments where needed?

#### Extensibility
- Could World 3 levels be added easily?
- Pattern for adding new propertyPatterns?
- Room for future UI enhancements?
- No hardcoded magic numbers?

#### Technical Debt
- Any shortcuts that need fixing later?
- Code duplication that should be refactored?
- Missing error handling?
- Performance optimizations needed?

## Review Checklist

### Code Quality
- [ ] All levels have correct data structure
- [ ] No syntax errors or typos
- [ ] Coordinates within canvas bounds
- [ ] Consistent code style
- [ ] No console errors/warnings
- [ ] Follows existing patterns in codebase

### Plan Adherence
- [ ] All 10 levels implemented (16-25)
- [ ] Level specs match plan exactly
- [ ] Difficulty progression correct
- [ ] Property patterns as specified
- [ ] Cycle speeds match plan
- [ ] Teaching goals met

### Educational Quality
- [ ] Learning objectives clear
- [ ] Difficulty appropriate for age group
- [ ] Hints helpful but not spoilers
- [ ] Progression supports learning
- [ ] Visual feedback effective
- [ ] Stealth learning achieved

### Maintainability
- [ ] Code is readable and well-organized
- [ ] Easy to add World 3 in future
- [ ] No major technical debt
- [ ] Consistent with architecture
- [ ] Documented where needed

### UI/UX
- [ ] World transition screen implemented
- [ ] Tutorial overlay (if implemented) works well
- [ ] Property indicator enhancements (if any)
- [ ] Visual design consistent
- [ ] User flow intuitive

## Review Report Format

### Executive Summary
Brief overview (2-3 sentences):
- Implementation quality: Excellent / Good / Needs Work
- Plan adherence: 100% / Mostly / Partial
- Educational effectiveness: Strong / Adequate / Weak
- Recommendation: Approve / Approve with Changes / Needs Rework

### Detailed Findings

#### Strengths
- What was done exceptionally well?
- What exceeded expectations?
- What should be highlighted?

#### Issues Found

**Critical Issues** (Must fix before ship)
- Blocks functionality or breaks game
- Data corruption or loss
- Major deviation from plan

**Major Issues** (Should fix before ship)
- Degrades experience significantly
- Unclear educational value
- Maintenance problems

**Minor Issues** (Nice to fix)
- Small inconsistencies
- Edge case bugs
- Style/formatting issues

#### Recommendations
- Specific changes needed
- Priority order for fixes
- Suggestions for improvement

### Level-by-Level Review

| Level | Plan Match | Code Quality | Educational | Issues |
|-------|------------|--------------|-------------|--------|
| 16 | ✅ | ✅ | ✅ | None |
| 17 | ✅ | ✅ | ⚠️ | Hint could be clearer |
| ... | ... | ... | ... | ... |

### Code Samples

For significant issues, provide:
```javascript
// Current code:
{ x: 1000, y: 100 } // Off-screen!

// Suggested fix:
{ x: 700, y: 100 } // Within bounds
```

### Final Recommendation

One of:
1. **APPROVE** - Ship it! Minor issues don't block release
2. **APPROVE WITH CHANGES** - Fix critical/major issues, then ship
3. **NEEDS REWORK** - Significant problems require substantial changes

## Success Criteria

✅ All levels match plan specifications
✅ No critical code quality issues
✅ Educational goals clearly met
✅ Code is maintainable and extensible
✅ Consistent with project architecture
✅ Ready for players (kids 8-14)

## When You're Done

1. **Complete the review report** with detailed findings
2. **List all issues** with severity and recommendations
3. **Provide specific code suggestions** for fixes needed
4. **Give final recommendation** (Approve / Approve with Changes / Needs Rework)
5. **Highlight what worked well** (positive feedback for Developer)

---

**Remember**: Be thorough but constructive. The goal is to ensure World 2 is high quality, educationally sound, and ready for players. Focus on what matters most: does it teach timing through fun gameplay?

Happy reviewing! 📋
