/**
 * Entry point for BounceFlow prototype
 */

import { Game } from './game/index.js';
import { getTotalLevels } from './levels.js';
import { loadSavedLevel } from './progress.js';

// ?level=N in the URL wins, then the level played last, then level 1
function getStartLevel() {
    const valid = n => Number.isInteger(n) && n >= 1 && n <= getTotalLevels();
    const fromUrl = parseInt(new URLSearchParams(window.location.search).get('level'), 10);
    if (valid(fromUrl)) return fromUrl;
    const saved = loadSavedLevel();
    return valid(saved) ? saved : 1;
}

// Initialize the game when DOM is loaded
function init() {
    const canvas = document.getElementById('gameCanvas');
    let game = null;

    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        if (game) {
            game.resize(canvas.width, canvas.height);
        }
    }

    // Initial resize
    resizeCanvas();

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);

    // Create game instance
    game = new Game(canvas, getStartLevel());

    // Setup input handlers
    canvas.addEventListener('mousedown', (e) => game.handleMouseDown(e));
    canvas.addEventListener('mousemove', (e) => game.handleMouseMove(e));
    canvas.addEventListener('mouseup', (e) => game.handleMouseUp(e));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent right-click menu

    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => game.handleTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => game.handleTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', (e) => game.handleTouchEnd(e), { passive: false });

    // Start game loop
    game.start();

    console.log('🎮 BounceFlow prototype started!');
    console.log('Controls:');
    console.log('- Click and drag surfaces to move them');
    console.log('- Right-click and drag to rotate surfaces');
    console.log('- Press R to restart level');
    console.log('- Press Space or click Play to start');
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
