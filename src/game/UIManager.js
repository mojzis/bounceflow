/**
 * UIManager - Manages DOM UI elements and event handlers
 *
 * Responsibilities:
 * - Initialize and cache references to DOM elements
 * - Set up button click handlers
 * - Set up keyboard shortcuts
 * - Update UI elements each frame (score, time, elasticity bar)
 *
 * Public API:
 * - constructor(game): Set up UI elements and event handlers
 * - updateUI(): Update dynamic UI elements (called each frame)
 *
 * Keyboard Shortcuts:
 * - Space: Play/drop ball
 * - R: Restart level
 * - V: Toggle angle display
 * - ?: Toggle solver hints
 * - H: Toggle help overlay
 * - B: Toggle debug mode
 * - Tab: Select next surface
 * - WASD/Arrows: Move selected surface (Shift for 5x speed)
 * - Q/E or Arrows with Shift: Rotate selected surface
 * - Escape: Close help
 *
 * DOM Elements:
 * - playButton, dropButton, restartButton, replayButton
 * - hintButton, refineButton, helpButton
 * - levelDisplay, levelName, hintText
 * - scoreTime, scoreAttempts, scorePoints
 * - elasticityFill (progress bar)
 * - helpOverlay, victoryOverlay
 */
export class UIManager {
    constructor(game) {
        this.game = game;
        this.setupUI();
    }

    setupUI() {
        // Get UI elements
        this.playButton = document.getElementById('playButton');
        this.dropButton = document.getElementById('dropButton');
        this.restartButton = document.getElementById('restartButton');
        this.levelDisplay = document.getElementById('level-display');
        this.levelName = document.getElementById('level-name');
        this.hintText = document.getElementById('hint-text');
        this.elasticityFill = document.getElementById('elasticity-fill');
        this.helpOverlay = document.getElementById('help-overlay');
        this.helpButton = document.getElementById('helpButton');
        this.hintButton = document.getElementById('hintButton');
        this.refineButton = document.getElementById('refineButton');
        this.closeHelpButton = document.getElementById('close-help');
        this.victoryOverlay = document.getElementById('victory-overlay');
        this.victoryMessage = document.getElementById('victory-message');
        this.replayButton = document.getElementById('replayButton');
        this.scoreTime = document.getElementById('score-time');
        this.scoreAttempts = document.getElementById('score-attempts');
        this.scorePoints = document.getElementById('score-points');

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Button handlers
        this.playButton.addEventListener('click', () => this.game.startPlay());
        this.dropButton.addEventListener('click', () => this.game.dropBall());
        this.restartButton.addEventListener('click', () => this.game.restart());
        this.replayButton.addEventListener('click', () => this.game.startReplay());
        this.hintButton.addEventListener('click', () => this.game.toggleHints());
        this.refineButton.addEventListener('click', () => this.game.startRefineSolver());
        this.helpButton.addEventListener('click', () => this.game.toggleHelp());
        this.closeHelpButton.addEventListener('click', () => this.game.hideHelp());

        // Click outside to close help
        this.helpOverlay.addEventListener('click', (e) => {
            if (e.target === this.helpOverlay) {
                this.game.hideHelp();
            }
        });

        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Help toggle
            if (e.key === 'h' || e.key === 'H') {
                this.game.toggleHelp();
                e.preventDefault();
                return;
            } else if (e.key === 'Escape') {
                this.game.hideHelp();
                e.preventDefault();
                return;
            }

            if (!this.helpOverlay.classList.contains('hidden')) {
                return;
            }

            const isMovementKey = ['w', 'W', 'a', 'A', 's', 'S', 'd', 'D', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'q', 'Q', 'e', 'E'].includes(e.key);

            if (isMovementKey) {
                if (!e.repeat && !this.game.input.heldKeys.has(e.key)) {
                    this.game.input.trackKeyDown(e.key, e.shiftKey);
                }
                e.preventDefault();
                return;
            }

            // Non-movement keys
            if (e.key === 'r' || e.key === 'R') {
                this.game.restart();
            } else if (e.key === ' ') {
                if (this.game.currentState === this.game.states.MENU) {
                    this.game.startPlay();
                } else if (this.game.currentState === this.game.states.PLAYING) {
                    this.game.dropBall();
                }
                e.preventDefault();
            } else if (e.key === 'Tab') {
                this.game.selectNextSurface();
                e.preventDefault();
            } else if (e.key === 'v' || e.key === 'V') {
                this.game.showAngles = !this.game.showAngles;
                e.preventDefault();
            } else if (e.key === '?' || e.key === '/') {
                this.game.toggleHints();
                e.preventDefault();
            } else if (e.key === 'b' || e.key === 'B') {
                this.game.debugMode = !this.game.debugMode;
                console.log('Debug mode:', this.game.debugMode ? 'ON' : 'OFF');
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.game.input.heldKeys.has(e.key)) {
                this.game.input.trackKeyUp(e.key);
            }
        });
    }

    updateUI() {
        if (this.game.ball) {
            const ratio = this.game.ball.getElasticityRatio();
            this.elasticityFill.style.width = `${ratio * 100}%`;
            this.elasticityFill.style.background = this.game.ball.color;
        }

        this.scoreAttempts.textContent = this.game.attempts;

        if (this.game.currentState === this.game.states.PLAYING && this.game.levelStartTime > 0) {
            const currentTime = (Date.now() - this.game.levelStartTime) / 1000;
            this.scoreTime.textContent = `${currentTime.toFixed(1)}s`;

            const liveScore = this.game.calculateLiveScore(currentTime);
            this.scorePoints.textContent = liveScore;

            if (this.game.usedSolver) {
                this.scorePoints.style.color = '#999';
                this.scorePoints.textContent = 'N/A';
            } else {
                this.scorePoints.style.color = '#333';
            }
        } else if (this.game.currentState === this.game.states.MENU) {
            if (this.game.attempts === 0) {
                this.scoreTime.textContent = '0s';
                this.scorePoints.textContent = '1000';
                this.scorePoints.style.color = '#333';
            }
        }
    }
}
