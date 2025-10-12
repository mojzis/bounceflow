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
 * - processHeldKeys(): Update movement/rotation from held keys with acceleration
 * - trackKeyDown(key, shiftKey): Start tracking a held key
 * - trackKeyUp(key): Stop tracking a held key
 *
 * Properties:
 * - mousePos: Current mouse position {x, y}
 * - heldKeys: Set of currently held keys
 * - keyHoldDuration: Map of key hold start times for acceleration
 */
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

    handleMouseUp(e) {
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
        // Skip if no surface selected
        if (this.game.selectedSurfaceIndex < 0 || this.game.selectedSurfaceIndex >= this.game.surfaces.length) {
            return;
        }

        const now = Date.now();

        // Process each held key
        for (const [key, data] of this.keyHoldDuration.entries()) {
            const holdDuration = now - data.startTime;

            // Calculate acceleration
            let speed;
            if (holdDuration < 200) {
                speed = 1;
            } else if (holdDuration < 1000) {
                speed = 1 + ((holdDuration - 200) / 800) * 4;
            } else {
                speed = 5;
            }

            const shiftMultiplier = data.shiftKey ? 5 : 1;
            const movementAmount = speed * shiftMultiplier;
            const rotationAmount = data.shiftKey ? 5 : 1;

            // Movement keys
            if (key === 'w' || key === 'W' || key === 'ArrowUp') {
                this.game.moveSelectedSurface(0, -movementAmount);
            } else if (key === 's' || key === 'S' || key === 'ArrowDown') {
                this.game.moveSelectedSurface(0, movementAmount);
            } else if (key === 'a' || key === 'A') {
                this.game.moveSelectedSurface(-movementAmount, 0);
            } else if (key === 'd' || key === 'D') {
                this.game.moveSelectedSurface(movementAmount, 0);
            } else if (key === 'ArrowLeft') {
                if (data.shiftKey) {
                    this.game.rotateSelectedSurface(-rotationAmount);
                } else {
                    this.game.moveSelectedSurface(-movementAmount, 0);
                }
            } else if (key === 'ArrowRight') {
                if (data.shiftKey) {
                    this.game.rotateSelectedSurface(rotationAmount);
                } else {
                    this.game.moveSelectedSurface(movementAmount, 0);
                }
            } else if (key === 'q' || key === 'Q') {
                this.game.rotateSelectedSurface(-rotationAmount);
            } else if (key === 'e' || key === 'E') {
                this.game.rotateSelectedSurface(rotationAmount);
            }
        }
    }

    trackKeyDown(key, shiftKey) {
        if (!this.heldKeys.has(key)) {
            this.heldKeys.add(key);
            this.keyHoldDuration.set(key, { startTime: Date.now(), shiftKey });
        }
    }

    trackKeyUp(key) {
        this.heldKeys.delete(key);
        this.keyHoldDuration.delete(key);
    }
}
