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
            // Update solver UI to reflect stopped state
            if (g.updateSolverUI) {
                g.updateSolverUI();
            }
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

        // Reset UI flags (but keep showHints if solver has results)
        if (!g.solver.bestConfig) {
            g.showHints = false;
        }

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
        if (g.solver) {
            g.solver.stop();
            // Update solver UI
            if (g.updateSolverUI) {
                g.updateSolverUI();
            }
        }
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
