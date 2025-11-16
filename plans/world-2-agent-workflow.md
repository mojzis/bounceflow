# World 2 Multi-Agent Workflow

## Overview

This document describes how to use three specialized agents to implement, test, and review World 2: Elasticity.

## Agent Roles

### 1. Developer Agent 🛠️
**Purpose**: Implement the 10 levels and UI enhancements
**Instructions**: `plans/world-2-dev-instructions.md`
**Estimated Time**: 2-3 hours
**Output**: Code implementation in `src/levels.js` and UI files

### 2. Tester Agent 🎮
**Purpose**: Validate gameplay, physics, and progression
**Instructions**: `plans/world-2-test-instructions.md`
**Estimated Time**: 1-2 hours
**Output**: Test report with bugs and recommendations

### 3. Reviewer Agent 📋
**Purpose**: Code quality, plan adherence, educational review
**Instructions**: `plans/world-2-review-instructions.md`
**Estimated Time**: 1 hour
**Output**: Review report with approval/changes needed

## Execution Strategy

### Option A: Sequential (Safer)
Best for first-time implementation or if you want tight control.

```
1. Developer Agent (runs first)
   ↓
2. Developer commits code
   ↓
3. Tester Agent + Reviewer Agent (run in parallel)
   ↓
4. Human reviews both reports
   ↓
5. Developer Agent fixes issues (if needed)
```

### Option B: Fully Automated (Faster)
Best if you trust the agents to handle issues independently.

```
1. Developer Agent
   ↓ (auto-commit)
2. Tester + Reviewer (parallel)
   ↓ (auto-create issue list)
3. Developer Agent (fix critical issues)
   ↓ (auto-commit)
4. Final validation
```

## Recommended Approach: Option A (Sequential)

### Step 1: Launch Developer Agent

```bash
# In Claude Code, use the Task tool with:
Subagent Type: general-purpose
Description: Implement World 2 levels
Prompt: |
  Read and follow the instructions in plans/world-2-dev-instructions.md

  Your task is to implement World 2: Elasticity (Levels 16-25) based on:
  - Design specifications in plans/world-2-elasticity-plan.md
  - Development instructions in plans/world-2-dev-instructions.md

  Implement:
  1. All 10 levels in src/levels.js (primary task)
  2. World transition screen after Level 15
  3. Tutorial overlay for Level 16 (if time permits)

  When done:
  - Test locally with npm run dev
  - Commit your changes with clear message
  - Provide summary of what you implemented

  DO NOT push to remote yet - Tester and Reviewer will validate first.
```

### Step 2: Review Developer Output

After Developer Agent completes:
- Check the summary of changes
- Verify files modified (should be src/levels.js at minimum)
- Review the commit message
- Note any issues Developer mentioned

### Step 3: Launch Tester + Reviewer Agents (Parallel)

**Tester Agent:**
```bash
Subagent Type: general-purpose
Description: Test World 2 gameplay
Prompt: |
  Read and follow instructions in plans/world-2-test-instructions.md

  The Developer Agent has implemented World 2 (Levels 16-25).

  Your task:
  1. Start dev server: npm run dev
  2. Test all 10 levels for gameplay, physics, and progression
  3. Check for bugs, balance issues, and educational effectiveness
  4. Create detailed test report

  Focus on:
  - Are all levels solvable?
  - Does difficulty progress smoothly?
  - Do property patterns work correctly?
  - Are there any game-breaking bugs?

  Provide test report with:
  - Overall assessment
  - Level-by-level results
  - Bug list with severity
  - Go/no-go recommendation
```

**Reviewer Agent:**
```bash
Subagent Type: general-purpose
Description: Review World 2 code
Prompt: |
  Read and follow instructions in plans/world-2-review-instructions.md

  The Developer Agent has implemented World 2 (Levels 16-25).

  Your task:
  1. Review code changes in src/levels.js and UI files
  2. Compare against plan specifications
  3. Check code quality, maintainability, and educational goals
  4. Create detailed review report

  Focus on:
  - Do levels match plan exactly?
  - Is code quality good?
  - Are educational goals met?
  - Any technical debt or issues?

  Provide review report with:
  - Strengths and issues (categorized by severity)
  - Level-by-level plan adherence check
  - Final recommendation (Approve/Changes/Rework)
```

### Step 4: Human Decision

Review both reports and decide:

**If both give green light:**
- Merge and push to remote
- Create PR if needed
- Celebrate! 🎉

**If minor issues found:**
- Developer Agent can fix quickly
- Re-test affected areas
- Proceed

**If major issues found:**
- Discuss with Developer Agent's output
- Decide if rework needed
- Potentially re-run Developer Agent with specific fixes

## Agent Launch Commands

### Using Claude Code Task Tool

When you're ready to launch, you can run them like this:

**Sequential Launch:**
```
1. Click Task tool
2. Select "general-purpose" subagent
3. Paste Developer prompt from Step 1
4. Wait for completion
5. Review output
6. Launch Tester + Reviewer (can launch both in one message)
```

**Parallel Launch (Tester + Reviewer):**
In a single message, use two Task tool calls with the respective prompts.

## Success Criteria

### Developer Agent Success
✅ All 10 levels added to src/levels.js
✅ World transition screen working
✅ No console errors on level load
✅ Code committed with clear message

### Tester Agent Success
✅ All levels tested and documented
✅ Solvability confirmed
✅ Bug list created (if any)
✅ Clear go/no-go recommendation

### Reviewer Agent Success
✅ Code quality assessed
✅ Plan adherence verified
✅ Educational goals evaluated
✅ Clear approval recommendation

### Overall Success
✅ High-quality World 2 implementation
✅ Ready for players
✅ Educational goals met
✅ No critical bugs

## Communication Between Agents

Agents don't directly communicate, but they reference each other:

- **Tester** tests what **Developer** built
- **Reviewer** reviews what **Developer** wrote
- **Developer** (in fix cycle) addresses what **Tester** and **Reviewer** found

The human (you) orchestrates this by:
1. Reading all outputs
2. Synthesizing feedback
3. Deciding next steps
4. Launching fix cycles if needed

## Troubleshooting

### If Developer Agent Struggles
- Check if it read the plan correctly
- Verify it has access to src/levels.js
- Simplify task: just levels first, UI later

### If Tester Agent Can't Run Game
- Ensure dev server starts: `npm run dev`
- Check for port conflicts
- Verify all dependencies installed

### If Reviewer Agent Gives Unclear Feedback
- Ask for specific examples
- Request code snippets for issues
- Ask for prioritized list of fixes

## Alternative: Single Mega-Agent

If you prefer, you could run one agent that does everything:

```
Subagent Type: general-purpose
Description: Implement, test, and review World 2
Prompt: |
  Implement World 2: Elasticity following the plan and instructions:
  - plans/world-2-elasticity-plan.md (design)
  - plans/world-2-dev-instructions.md (implementation)
  - plans/world-2-test-instructions.md (testing)
  - plans/world-2-review-instructions.md (review)

  Do all three phases:
  1. Develop the 10 levels
  2. Test them thoroughly
  3. Review your own work

  Provide comprehensive report covering all aspects.
```

**Pros**: Simpler, one agent handles everything
**Cons**: Less specialized, might miss issues that fresh eyes would catch

## Recommended: Three-Agent Approach

The specialized three-agent approach is better because:
- **Separation of concerns**: Each agent focuses on one thing
- **Fresh perspectives**: Tester/Reviewer aren't biased by implementation
- **Parallel execution**: Tester + Reviewer run simultaneously (faster)
- **Higher quality**: Specialization leads to better outputs

## Timeline Estimate

**Sequential Approach:**
- Developer: 2-3 hours
- Tester + Reviewer (parallel): 1-2 hours
- Human review + fixes: 30-60 minutes
- **Total**: 4-6 hours

**With iteration (if issues found):**
- Add 1-2 hours for fix cycle
- **Total**: 5-8 hours

**Human-only (for comparison):**
- Implementation: 3-4 hours
- Testing: 2-3 hours
- Review: 1 hour
- **Total**: 6-8 hours

The agent approach saves time and increases quality through specialization.

## Next Steps

Ready to start? Here's your checklist:

- [ ] Review all instruction files (dev, test, review)
- [ ] Decide on Sequential or Automated approach
- [ ] Launch Developer Agent with prompt from Step 1
- [ ] Wait for completion and review output
- [ ] Launch Tester + Reviewer Agents in parallel
- [ ] Review both reports
- [ ] Make final decision and proceed

Good luck! 🚀
