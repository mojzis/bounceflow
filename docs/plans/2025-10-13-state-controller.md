# StateController Implementation Plan

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/subagent-driven-development/SKILL.md` to implement this plan task-by-task.
>
> **Execution Method:** Subagent-Driven Development - dispatch fresh subagent per task, with code review between tasks.

**Goal:** Add StateController to manage game state transitions with automatic cleanup and recovery, preventing invalid state combinations that cause UI confusion.

**Architecture:** Create StateController class that enforces cleanup before every state transition and provides recovery mechanism. Integrate into Game class by replacing direct state assignments with controller calls. Add error recovery in critical paths (update loop, solver, transitions).

**Tech Stack:** Vite, Matter.js, vanilla JavaScript ES6 modules, Vitest

---

## Task 1: Create StateController with Tests

**Files:**
- Create: `src/game/StateController.js`
- Create: `src/game/StateController.test.js`

**Step 1: Write failing test for basic state transition**

Create `/home/jonas/git/bounceflow/src/game/StateController.test.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateController } from './StateController.js';

describe('StateController', () => {
    let mockGame;
    let controller;

    beforeEach(() => {
        mockGame = {
            solver: { running: false, stop: vi.fn() },
            victoryHideTimer: null,
            victoryAdvanceTimer: null,
            showHints: false,
            hookReleasing: false,
            hookReleaseProgress: 0,
            isRecording: false,
            playButton: { textContent: '', disabled: false },
            replayButton: { style: { display: 'none' } },
            victoryOverlay: { classList: { add: vi.fn(), remove: vi.fn() } },
            replayData: [],
            replayIndex: 0,
            ball: null,
            currentLevel: 1
        };
        controller = new StateController(mockGame);
    });

    it('should initialize with MENU state', () => {
        expect(controller.state).toBe('MENU');
    });

    it('should transition from MENU to PLAYING', () => {
        controller.transitionTo('PLAYING');
        expect(controller.state).toBe('PLAYING');
        expect(controller.previousState).toBe('MENU');
    });

    it('should call cleanup before transition', () => {
        mockGame.showHints = true;
        controller.transitionTo('PLAYING');
        expect(mockGame.showHints).toBe(false);
    });

    it('should recover to MENU on invalid state', () => {
        controller.transitionTo('INVALID_STATE');
        expect(controller.state).toBe('MENU');
    });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run StateController`
Expected: FAIL with "Cannot find module './StateController.js'"

**Step 3: Create minimal StateController implementation**

Create `/home/jonas/git/bounceflow/src/game/StateController.js`:

```javascript
/**
 * StateController - Manages game state transitions with cleanup and recovery
 *
 * Prevents invalid state combinations by:
 * - Enforcing cleanup before every transition
 * - Providing explicit state initialization
 * - Offering safe recovery to MENU state
 *
 * States: MENU, PLAYING, WON, REPLAY
 */
export class StateController {
    constructor(game) {
        this.game = game;
        this.state = 'MENU';
        this.previousState = null;

        // Valid states
        this.STATES = {
            MENU: 'MENU',
            PLAYING: 'PLAYING',
            WON: 'WON',
            REPLAY: 'REPLAY'
        };
    }

    /**
     * Transition to new state with automatic cleanup
     * @param {string} newState - Target state (MENU, PLAYING, WON, REPLAY)
     */
    transitionTo(newState) {
        if (!this.STATES[newState]) {
            console.error(`❌ Invalid state: ${newState}`);
            return this.recover();
        }

        console.log(`🔄 State: ${this.state} → ${newState}`);

        try {
            // Always cleanup old state first
            this.cleanup();

            // Update state
            this.previousState = this.state;
            this.state = newState;

            // Initialize new state
            this.initialize();

        } catch (error) {
            console.error('❌ State transition failed:', error);
            this.recover();
        }
    }

    /**
     * Universal cleanup - runs BEFORE every state change
     */
    cleanup() {
        const g = this.game; // Shorthand

        // Stop all async operations
        if (g.solver.running) {
            g.solver.stop();
        }

        // Clear all timers
        if (g.victoryHideTimer) {
            clearTimeout(g.victoryHideTimer);
            g.victoryHideTimer = null;
        }
        if (g.victoryAdvanceTimer) {
            clearTimeout(g.victoryAdvanceTimer);
            g.victoryAdvanceTimer = null;
        }

        // Reset UI flags
        g.showHints = false;

        // Reset hook animation
        g.hookReleasing = false;
        g.hookReleaseProgress = 0;

        // State-specific cleanup
        switch (this.state) {
            case 'PLAYING':
                g.isRecording = false;
                break;

            case 'WON':
                if (g.victoryOverlay && g.victoryOverlay.classList) {
                    g.victoryOverlay.classList.add('hidden');
                }
                break;

            case 'REPLAY':
                g.replayIndex = 0;
                break;
        }
    }

    /**
     * State initialization - runs AFTER state change
     */
    initialize() {
        const g = this.game;

        switch (this.state) {
            case 'MENU':
                if (g.playButton) {
                    g.playButton.textContent = 'Play';
                    g.playButton.disabled = false;
                }

                // Show replay button if we have data
                if (g.replayButton && g.replayData && g.replayData.length > 0) {
                    g.replayButton.style.display = 'block';
                }

                // Reset ball to start position
                if (g.ball && g.currentLevel) {
                    // Import will be handled by Game
                }
                break;

            case 'PLAYING':
                if (g.playButton) {
                    g.playButton.textContent = 'Playing...';
                    g.playButton.disabled = true;
                }
                g.isRecording = true;
                g.replayData = [];
                g.collisionData = [];
                if (g.replayButton) {
                    g.replayButton.style.display = 'none';
                }
                break;

            case 'WON':
                // Handled by showVictory() in Game for now
                break;

            case 'REPLAY':
                if (g.playButton) {
                    g.playButton.textContent = 'Exit Replay';
                    g.playButton.disabled = false;
                }
                if (g.replayButton) {
                    g.replayButton.style.display = 'none';
                }
                g.replayIndex = 0;
                break;
        }
    }

    /**
     * Force recovery to safe MENU state
     */
    recover() {
        console.warn('⚠️ Recovering to safe state (MENU)');

        const g = this.game;

        // Brutal cleanup - stop everything
        if (g.solver) g.solver.stop();
        g.isRecording = false;
        g.showHints = false;
        g.hookReleasing = false;

        // Clear ALL timers
        if (g.victoryHideTimer) {
            clearTimeout(g.victoryHideTimer);
            g.victoryHideTimer = null;
        }
        if (g.victoryAdvanceTimer) {
            clearTimeout(g.victoryAdvanceTimer);
            g.victoryAdvanceTimer = null;
        }

        // Hide all overlays
        if (g.victoryOverlay && g.victoryOverlay.classList) {
            g.victoryOverlay.classList.add('hidden');
        }

        // Force to MENU
        this.state = 'MENU';
        this.initialize();
    }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm run test:run StateController`
Expected: 4 tests pass

**Step 5: Commit**

```bash
git add src/game/StateController.js src/game/StateController.test.js
git commit -m "feat: add StateController with cleanup and recovery

- Create StateController class for state management
- Enforce cleanup before every state transition
- Provide recovery mechanism to force MENU state
- Add unit tests for transitions and recovery"
```

---

## Task 2: Integrate StateController into Game Constructor

**Files:**
- Modify: `src/game/index.js:52-66`
- Modify: `src/game/index.js:1` (add import)

**Step 1: Add StateController import and initialization**

In `/home/jonas/git/bounceflow/src/game/index.js`, add import at line 50:

```javascript
import { StateController } from './StateController.js';
```

In constructor (around line 52-66), replace:

```javascript
        // Game state
        this.states = {
            MENU: 'menu',
            PLAYING: 'playing',
            PAUSED: 'paused',
            WON: 'won',
            REPLAY: 'replay'
        };
        this.currentState = this.states.MENU;
```

With:

```javascript
        // State management
        this.stateController = new StateController(this);

        // DEPRECATED: Keep for backward compatibility
        this.states = {
            MENU: 'MENU',
            PLAYING: 'PLAYING',
            PAUSED: 'PAUSED',
            WON: 'WON',
            REPLAY: 'REPLAY'
        };

        // Getter that reads from StateController
        Object.defineProperty(this, 'currentState', {
            get: () => this.stateController.state,
            configurable: true
        });
```

**Step 2: Test in browser**

Run: `npm run dev`
Visit: http://localhost:5174/bounceflow/
Expected: Game loads, starts in MENU state, console shows `🔄 State: MENU → MENU` on load

**Step 3: Commit**

```bash
git add src/game/index.js
git commit -m "feat: integrate StateController into Game

- Add StateController to Game constructor
- Replace direct state assignment with controller
- Keep backward compatibility with states enum
- Use getter for currentState that reads from controller"
```

---

## Task 3: Replace State Assignments in Core Methods

**Files:**
- Modify: `src/game/index.js:301-348` (startPlay)
- Modify: `src/game/index.js:350-382` (restart)
- Modify: `src/game/index.js:398-432` (startReplay)
- Modify: `src/game/index.js:434-449` (stopReplay)
- Modify: `src/game/index.js:455-474` (checkWinCondition)

**Step 1: Update startPlay() method**

Replace `startPlay()` method (around line 301):

```javascript
    startPlay() {
        if (this.currentState === this.states.REPLAY) {
            // Exit replay mode
            this.stopReplay();
            return;
        }

        if (this.currentState === this.states.MENU) {
            // Start hook release animation
            this.hookReleasing = true;
            this.hookReleaseProgress = 0;

            // Calculate hook swing velocity to transfer to ball
            const hasSwinging = this.currentLevel >= 4;
            const swayVelocity = hasSwinging ? Math.cos(Date.now() / 800) * 12.5 : 0;

            // Delay ball activation for hook animation
            setTimeout(() => {
                try {
                    this.ball.activate();

                    // Transfer swing momentum to ball
                    Matter.Body.setVelocity(this.ball.body, {
                        x: swayVelocity * 0.15,
                        y: 0
                    });

                    // Use StateController for transition
                    this.stateController.transitionTo('PLAYING');
                    this.hookReleasing = false;

                } catch (error) {
                    console.error('Failed to start playing:', error);
                    this.stateController.recover();
                }
            }, 300);

            this.attempts++;

            // Start time tracking on first attempt
            if (this.attempts === 1) {
                this.levelStartTime = Date.now();
            }
        }
    }
```

**Step 2: Update restart() method**

Replace `restart()` method (around line 350):

```javascript
    restart() {
        const level = getLevel(this.currentLevel);
        if (this.ball && level) {
            this.ball.reset(level.ballStart.x, level.ballStart.y);
        }

        // StateController handles cleanup
        this.stateController.transitionTo('MENU');

        // Reset targets
        this.targets.forEach(target => {
            target.collected = false;
            target.particles = [];
        });

        // Reset bird
        if (this.bird) {
            this.bird.active = false;
            this.birdSpawnTimer = 0;
            this.birdSpawnInterval = 5000 + Math.random() * 5000;
        }

        // Show replay button if we have data
        if (this.replayData.length > 0) {
            this.replayButton.style.display = 'block';
        }
    }
```

**Step 3: Update startReplay() method**

Replace `startReplay()` method (around line 398):

```javascript
    startReplay() {
        if (this.replayData.length === 0) {
            console.warn('Cannot start replay: no replay data available');
            return;
        }

        // Ensure we're not in a bad state
        if (this.currentState === this.states.PLAYING) {
            console.log('Stopping active game before replay');
            this.restart();
        }

        // StateController handles cleanup including victory timers
        this.stateController.transitionTo('REPLAY');

        // Reset ball to start
        const level = getLevel(this.currentLevel);
        if (this.ball && level) {
            this.ball.reset(level.ballStart.x, level.ballStart.y);
        }
    }
```

**Step 4: Update stopReplay() method**

Replace `stopReplay()` method (around line 434):

```javascript
    stopReplay() {
        console.log('Stopping replay, returning to MENU');

        // StateController handles transition
        this.stateController.transitionTo('MENU');

        const level = getLevel(this.currentLevel);
        if (this.ball && level) {
            this.ball.reset(level.ballStart.x, level.ballStart.y);
        }
    }
```

**Step 5: Update checkWinCondition() method**

Replace `checkWinCondition()` method (around line 455):

```javascript
    checkWinCondition() {
        if (this.currentState !== this.states.PLAYING) return;

        const allCollected = this.targets.every(target => target.collected);
        if (allCollected && this.targets.length > 0) {
            // Use StateController for transition
            this.stateController.transitionTo('WON');

            // Calculate final time
            if (this.levelStartTime > 0) {
                this.levelTime = (Date.now() - this.levelStartTime) / 1000;
            }

            // Calculate score
            this.currentScore = this.calculateScore();

            setTimeout(() => {
                this.showVictory();
            }, 500);
        }
    }
```

**Step 6: Test in browser**

Run: `npm run dev`
Test flow:
1. Start game (MENU → PLAYING) - check console for state transitions
2. Complete level (PLAYING → WON) - verify victory screen
3. Click Replay - verify enters REPLAY mode cleanly
4. Exit Replay - verify returns to MENU
5. Restart during play - verify cleans up properly

Expected: Console shows state transitions with 🔄 emoji, no errors

**Step 7: Commit**

```bash
git add src/game/index.js
git commit -m "refactor: use StateController in core game methods

- Replace direct state assignments in startPlay, restart, checkWinCondition
- Add try/catch with recovery in startPlay
- Use StateController transitions in startReplay, stopReplay
- All state changes now go through controller for cleanup"
```

---

## Task 4: Add Error Recovery in Update Loop

**Files:**
- Modify: `src/game/index.js:535-653` (update method)

**Step 1: Wrap update loop with error recovery**

Replace `update()` method (around line 535):

```javascript
    update(deltaTime) {
        try {
            if (this.currentState === this.states.REPLAY) {
                // Replay mode - just advance through recorded data
                this.replayIndex += this.replaySpeed;
                return;
            }

            // Safety check: verify ball is in valid state before physics update
            if (this.ball && this.ball.isActive) {
                const pos = this.ball.body.position;
                const vel = this.ball.body.velocity;
                if (!isFinite(pos.x) || !isFinite(pos.y) || !isFinite(vel.x) || !isFinite(vel.y)) {
                    console.error('⚠️ Detected corrupted ball state - recovering');
                    this.stateController.recover();
                    return;
                }
            }

            // Update physics with fixed timestep (16.67ms = 60Hz)
            this.physics.update(deltaTime);

            // Record ball state if recording
            if (this.isRecording && this.ball && this.ball.isActive) {
                const velocity = this.ball.body.velocity;
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

                // Double-check validity before recording
                if (isFinite(velocity.x) && isFinite(velocity.y)) {
                    this.replayData.push({
                        x: this.ball.body.position.x,
                        y: this.ball.body.position.y,
                        vx: velocity.x,
                        vy: velocity.y,
                        speed: speed,
                        timestamp: Date.now()
                    });
                }
            }

            // Update hook animation
            if (this.hookReleasing) {
                this.hookReleaseProgress += deltaTime / 300;
                if (this.hookReleaseProgress > 1) {
                    this.hookReleaseProgress = 1;
                }
            }

            // Update hook sway (idle animation)
            if (this.currentState === this.states.MENU && this.currentLevel >= 4) {
                this.hookSwayOffset = Math.sin(Date.now() / 800) * 10;

                // Move ball with the hook sway
                if (this.ball) {
                    const level = getLevel(this.currentLevel);
                    const swayX = level.ballStart.x + this.hookSwayOffset;
                    Matter.Body.setPosition(this.ball.body, {
                        x: swayX,
                        y: level.ballStart.y
                    });
                }
            } else if (this.currentState === this.states.MENU) {
                // Keep ball and hook static for early levels
                this.hookSwayOffset = 0;
            }

            // Update entities
            if (this.ball) {
                this.ball.update(deltaTime);
            }

            this.targets.forEach(target => {
                target.update(deltaTime);
                if (this.ball) {
                    target.checkCollection(this.ball);
                }
            });

            this.surfaces.forEach(surface => {
                surface.handleMouseMove(this.input.mousePos.x, this.input.mousePos.y);
            });

            // Update bird obstacle
            if (this.bird && this.currentState === this.states.PLAYING) {
                if (!this.bird.active) {
                    this.birdSpawnTimer += deltaTime;
                    if (this.birdSpawnTimer >= this.birdSpawnInterval) {
                        this.bird.spawn();
                        this.birdSpawnTimer = 0;
                        this.birdSpawnInterval = 5000 + Math.random() * 5000;
                    }
                }

                this.bird.update(deltaTime);

                if (this.ball && this.ball.isActive && this.bird.checkCollision(this.ball)) {
                    this.restart();
                }
            }

            // Process held keys with acceleration
            this.processHeldKeys();

            // Update UI
            this.updateUI();

            // Show replay button in MENU state if we have replay data
            if (this.currentState === this.states.MENU && this.replayData.length > 0) {
                this.replayButton.style.display = 'block';
            }

            // Check win condition
            this.checkWinCondition();

        } catch (error) {
            console.error('❌ Update loop error:', error);
            this.stateController.recover();
        }
    }
```

**Step 2: Test error recovery**

Run: `npm run dev`

Test recovery scenarios:
1. Play normally - verify no issues
2. Try to trigger corrupted ball state (hard to do manually)
3. Watch console for any ❌ errors with recovery

Expected: If any error occurs in update loop, game recovers to MENU state

**Step 3: Commit**

```bash
git add src/game/index.js
git commit -m "feat: add error recovery to update loop

- Wrap update loop in try/catch with StateController recovery
- Replace manual restart on corrupted ball with StateController.recover()
- Any update loop error now safely returns to MENU state"
```

---

## Task 5: Add Recovery in SolverSystem Errors

**Files:**
- Modify: `src/game/SolverSystem.js:103-141` (runStep method)

**Step 1: Add recovery in solver error handler**

In `/home/jonas/git/bounceflow/src/game/SolverSystem.js`, find the `runStep()` method (around line 103).

Replace the catch block (around line 134):

```javascript
        } catch (error) {
            console.error('Solver error:', error);
            this.stop();

            // Use StateController recovery if available
            if (this.game.stateController) {
                this.game.stateController.recover();
            } else {
                // Fallback for backward compatibility
                alert('Solver encountered an error. Check browser console.');
            }
            return;
        }
```

**Step 2: Test solver error handling**

Run: `npm run dev`

Test solver:
1. Start game
2. Press `?` to start solver
3. Let it run and find solution
4. Verify no errors

Expected: Solver works normally. If errors occur, game recovers to MENU

**Step 3: Commit**

```bash
git add src/game/SolverSystem.js
git commit -m "feat: add StateController recovery to solver errors

- Replace alert() with StateController.recover() on solver errors
- Maintain fallback for backward compatibility
- Solver errors now safely return game to MENU state"
```

---

## Task 6: Update CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md:30-50` (Architecture Overview)
- Modify: `CLAUDE.md:147-165` (File Organization)

**Step 1: Add StateController to architecture documentation**

In `/home/jonas/git/bounceflow/CLAUDE.md`, find the "Architecture Overview" section (around line 30).

Add after the "Entity-Component System" section:

```markdown
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
```

**Step 2: Update file organization section**

In the "File Organization" section (around line 147), update:

```markdown
src/game/
├── index.js              # Main Game class (orchestrator) - 750 lines
├── PhysicsManager.js     # Matter.js setup, collision - 3.1KB
├── InputManager.js       # Mouse, touch, keyboard - 6.0KB
├── SolverSystem.js       # AI solver logic - 15KB
├── RenderingSystem.js    # Core + specialized renders - 26KB
├── UIManager.js          # DOM elements, buttons - 6.8KB
├── LevelManager.js       # Load/clear levels - 6.5KB
└── StateController.js    # State transitions, cleanup, recovery - NEW
```

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document StateController architecture

- Add State Management section explaining StateController
- Document cleanup, recovery, and state transition process
- Explain why StateController prevents invalid state combinations
- Update file organization to include StateController"
```

---

## Task 7: Manual Testing and Verification

**Files:**
- N/A (testing only)

**Test Checklist:**

**Basic Flow:**
- [ ] Start game - verify MENU state, console shows state
- [ ] Click Play - verify smooth MENU → PLAYING transition
- [ ] Complete level - verify PLAYING → WON transition
- [ ] Victory screen appears - verify auto-advance timer set
- [ ] Wait for auto-advance - verify moves to next level

**Replay Testing:**
- [ ] Complete level
- [ ] Click Replay button during victory countdown
- [ ] Verify victory timers cancelled (console: "✅ Cancelled auto-advance")
- [ ] Verify enters REPLAY mode cleanly
- [ ] Watch replay - verify shows trajectory and force vectors
- [ ] Click Exit Replay - verify returns to MENU
- [ ] Verify replay button still visible

**Solver Testing:**
- [ ] In MENU, press `?` key
- [ ] Verify solver starts (console: "🚀 Starting solver...")
- [ ] Let solver run - verify hints display
- [ ] Press `?` again - verify solver stops
- [ ] Click Play while solver running - verify solver stops automatically
- [ ] Verify hints don't show in PLAYING state

**Error Recovery:**
- [ ] Try to cause errors (rapid clicking, state changes)
- [ ] Watch console for ⚠️ recovery messages
- [ ] Verify game always returns to playable MENU state
- [ ] Verify no "stuck" states where UI is unresponsive

**State Transitions:**
- [ ] Test all transitions: MENU↔PLAYING, PLAYING→WON, WON→MENU, MENU↔REPLAY
- [ ] Verify console logs show: `🔄 State: X → Y`
- [ ] Verify cleanup happens (solver stops, timers clear, flags reset)
- [ ] Verify no overlapping states (e.g., can't be PLAYING and REPLAY)

**Edge Cases:**
- [ ] Restart during hook animation - verify cleans up
- [ ] Enter replay immediately after victory - verify works
- [ ] Spam restart button - verify no crashes
- [ ] Start solver, immediately restart - verify solver stops

**Expected Results:**
- All state transitions clean and logged
- No "confused" UI states
- Victory timers always cancelled when entering replay
- Solver hints only show in MENU state
- Any error triggers recovery to MENU
- Console shows clear state transition logs

**Step 1: Perform manual testing**

Run: `npm run dev`
Visit: http://localhost:5174/bounceflow/

Work through checklist, mark each item complete.

**Step 2: Run unit tests**

Run: `npm run test:run`
Expected: All tests pass including new StateController tests

**Step 3: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 4: Document any issues**

If issues found:
- Note which scenario caused the issue
- Check console for error messages
- Determine if it's a StateController issue or existing bug
- File as separate task if needed

---

## Task 8: Final Commit and Summary

**Files:**
- N/A (commit only)

**Step 1: Review all changes**

Run: `git log --oneline HEAD~7..HEAD`

Expected to see 7 commits:
1. Add StateController with tests
2. Integrate StateController into Game
3. Use StateController in core methods
4. Add error recovery to update loop
5. Add StateController recovery to solver
6. Document StateController architecture
7. (This commit will be the summary)

**Step 2: Create summary commit**

```bash
git commit --allow-empty -m "feat: complete StateController implementation

Summary of changes:
- Added StateController class for state management (150 lines)
- Integrated into Game class with backward compatibility
- Replaced 8 direct state assignments with controller transitions
- Added error recovery in update loop and solver
- All state transitions now enforce cleanup
- Safe recovery to MENU on any error
- Comprehensive unit tests for StateController
- Updated documentation

Benefits:
- Prevents invalid state combinations (hints in wrong states, etc.)
- Automatic cleanup of timers, solver, flags before transitions
- Recovery mechanism for corrupted states
- Clear console logging of all state changes
- Eliminates entire class of state confusion bugs

Testing:
- All unit tests pass
- Manual testing covers all state transitions
- Error recovery verified
- Production build succeeds"
```

**Step 3: Push to remote**

```bash
git push origin main
```

Expected: All commits pushed successfully

---

## Summary

**What was built:**
- StateController class with cleanup, initialization, and recovery
- Integration into Game class via constructor
- Replacement of all direct state assignments
- Error recovery in critical paths (update loop, solver)
- Comprehensive tests and documentation

**Files created:**
- `src/game/StateController.js` (150 lines)
- `src/game/StateController.test.js` (50 lines)

**Files modified:**
- `src/game/index.js` (8 state assignments → controller transitions)
- `src/game/SolverSystem.js` (error recovery)
- `CLAUDE.md` (architecture documentation)

**Benefits achieved:**
- ✅ Prevents solver hints showing in wrong states
- ✅ Victory timers automatically cancelled
- ✅ Replay mode cleanly enters/exits
- ✅ Automatic recovery on any error
- ✅ Clear logging of all state changes
- ✅ Eliminates state confusion bugs
