/**
 * InputManager - Manages all user input: mouse, touch, keyboard
 *
 * Responsibilities:
 * - Handle mouse events (down, move, up, right-click)
 * - Handle touch events for mobile devices
 * - Track keyboard state with acceleration for held keys
 * - Forward input events to game entities (surfaces)
 *
 * Public API:
 * - handleMouseDown(e): Process mouse button press
 * - handleMouseMove(e): Process mouse movement
 * - handleMouseUp(e): Process mouse button release
 * - handleTouchStart(e): Process touch start events
 * - handleTouchMove(e): Process touch movement
 * - handleTouchEnd(e): Process touch end events
 * - processHeldKeys(): Repeat movement/rotation for held keys (a tap is one exact step)
 * - trackKeyDown(key, shiftKey): Start tracking a held key
 * - trackKeyUp(key): Stop tracking a held key
 * - releaseAllKeys(): Forget all held keys
 *
 * Properties:
 * - mousePos: Current mouse position {x, y}
 * - heldKeys: Set of currently held keys
 * - keyHoldDuration: Map of key hold start times for acceleration
 */
// Holding a key waits this long before repeating (ms)
const KEY_REPEAT_DELAY = 300;
// While held, rotation starts at one step per 80 ms and speeds up to one
// per frame over about a second (fine taps, fast sweeps)
const ROTATE_REPEAT_SLOW_MS = 80;
const ROTATE_REPEAT_FAST_MS = 15;

export class InputManager {
    constructor(game) {
        this.game = game;
        this.mousePos = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.isRightClick = false;
        this.touches = new Map();

        // Keyboard state
        this.heldKeys = new Set();
        this.keyHoldDuration = new Map();
    }

    handleMouseDown(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.isMouseDown = true;
        this.isRightClick = e.button === 2;
        this.mousePos = { x, y };

        // Check surface interactions
        for (const surface of this.game.surfaces) {
            if (surface.handleMouseDown(x, y, this.isRightClick)) {
                this.game.canvas.classList.add('dragging');
                break;
            }
        }
    }

    handleMouseMove(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        this.mousePos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    handleMouseUp() {
        this.isMouseDown = false;
        this.game.canvas.classList.remove('dragging');
        this.game.surfaces.forEach(surface => surface.handleMouseUp());
    }

    handleTouchStart(e) {
        e.preventDefault();
        const rect = this.game.canvas.getBoundingClientRect();

        for (const touch of e.changedTouches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.touches.set(touch.identifier, { x, y });

            // Check surface interactions
            for (const surface of this.game.surfaces) {
                if (surface.handleTouchStart(x, y)) {
                    break;
                }
            }
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        const rect = this.game.canvas.getBoundingClientRect();

        for (const touch of e.changedTouches) {
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.touches.set(touch.identifier, { x, y });
            this.mousePos = { x, y };

            this.game.surfaces.forEach(surface => surface.handleTouchMove(x, y));
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            this.touches.delete(touch.identifier);
        }

        this.game.surfaces.forEach(surface => surface.handleTouchEnd());
    }

    processHeldKeys() {
        if (!this.hasSelectedSurface()) return;

        const now = Date.now();

        for (const [key, data] of this.keyHoldDuration.entries()) {
            const holdDuration = now - data.startTime;

            // A tap is one exact step (done in trackKeyDown). Holding the
            // key starts repeating after a short pause, like typing.
            if (holdDuration < KEY_REPEAT_DELAY) continue;

            if (this.isRotationKey(key, data.shiftKey)) {
                // Rotation starts slow and countable, then speeds up
                const held = holdDuration - KEY_REPEAT_DELAY;
                const interval = Math.max(ROTATE_REPEAT_FAST_MS, ROTATE_REPEAT_SLOW_MS - held / 15);
                if (now - data.lastRepeat < interval) continue;
                data.lastRepeat = now;
                this.applyKey(key, data.shiftKey, 1);
            } else {
                // Movement speeds up from 1x to 5x while held
                const speed = Math.min(5, 1 + ((holdDuration - KEY_REPEAT_DELAY) / 800) * 4);
                this.applyKey(key, data.shiftKey, speed);
            }
        }
    }

    hasSelectedSurface() {
        return this.game.selectedSurfaceIndex >= 0 && this.game.selectedSurfaceIndex < this.game.surfaces.length;
    }

    isRotationKey(key, shiftKey) {
        return key === 'q' || key === 'e' ||
            (shiftKey && (key === 'ArrowLeft' || key === 'ArrowRight'));
    }

    /**
     * One step for a key: rotation turns 1° (5° with Shift), movement moves
     * `speed` px (x5 with Shift).
     */
    applyKey(key, shiftKey, speed) {
        const move = speed * (shiftKey ? 5 : 1);
        const turn = shiftKey ? 5 : 1;

        if (key === 'w' || key === 'ArrowUp') {
            this.game.moveSelectedSurface(0, -move);
        } else if (key === 's' || key === 'ArrowDown') {
            this.game.moveSelectedSurface(0, move);
        } else if (key === 'a' || (key === 'ArrowLeft' && !shiftKey)) {
            this.game.moveSelectedSurface(-move, 0);
        } else if (key === 'd' || (key === 'ArrowRight' && !shiftKey)) {
            this.game.moveSelectedSurface(move, 0);
        } else if (key === 'q' || key === 'ArrowLeft') {
            this.game.rotateSelectedSurface(-turn);
        } else if (key === 'e' || key === 'ArrowRight') {
            this.game.rotateSelectedSurface(turn);
        }
    }

    // Letter keys are stored lowercase: with Shift, 'd' goes down but comes up
    // as 'D', which used to leave 'd' stuck as held forever.
    normalizeKey(key) {
        return key.length === 1 ? key.toLowerCase() : key;
    }

    isKeyHeld(key) {
        return this.heldKeys.has(this.normalizeKey(key));
    }

    trackKeyDown(key, shiftKey) {
        key = this.normalizeKey(key);
        if (!this.heldKeys.has(key)) {
            this.heldKeys.add(key);
            const now = Date.now();
            this.keyHoldDuration.set(key, { startTime: now, lastRepeat: now, shiftKey });
            if (this.hasSelectedSurface()) this.applyKey(key, shiftKey, 1);
        }
    }

    trackKeyUp(key) {
        key = this.normalizeKey(key);
        this.heldKeys.delete(key);
        this.keyHoldDuration.delete(key);
    }

    // Forget all held keys (window lost focus, level changed)
    releaseAllKeys() {
        this.heldKeys.clear();
        this.keyHoldDuration.clear();
    }
}
