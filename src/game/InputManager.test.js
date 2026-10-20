import { describe, it, expect, vi, afterEach } from 'vitest';
import { InputManager } from './InputManager.js';

function setup() {
    const game = {
        selectedSurfaceIndex: 0,
        surfaces: [{}],
        rotateSelectedSurface: vi.fn(),
        moveSelectedSurface: vi.fn()
    };
    return { game, input: new InputManager(game) };
}

afterEach(() => vi.useRealTimers());

describe('InputManager keys', () => {
    it('a tap rotates exactly one degree, however many frames it lasts', () => {
        vi.useFakeTimers();
        const { game, input } = setup();
        input.trackKeyDown('e', false);
        for (let i = 0; i < 10; i++) {
            vi.advanceTimersByTime(16);
            input.processHeldKeys();
        }
        input.trackKeyUp('e');
        expect(game.rotateSelectedSurface).toHaveBeenCalledTimes(1);
        expect(game.rotateSelectedSurface).toHaveBeenCalledWith(1);
    });

    it('Shift turns 5 degrees per tap', () => {
        const { game, input } = setup();
        input.trackKeyDown('Q', true);
        expect(game.rotateSelectedSurface).toHaveBeenCalledWith(-5);
    });

    it('holding a key repeats, and speeds up the longer it is held', () => {
        vi.useFakeTimers();
        const { game, input } = setup();
        input.trackKeyDown('e', false);
        const countDuring = (ms) => {
            const before = game.rotateSelectedSurface.mock.calls.length;
            for (let t = 0; t < ms; t += 16) {
                vi.advanceTimersByTime(16);
                input.processHeldKeys();
            }
            return game.rotateSelectedSurface.mock.calls.length - before;
        };
        countDuring(300); // initial pause
        const early = countDuring(500);
        countDuring(1000);
        const late = countDuring(500);
        expect(early).toBeGreaterThan(2);
        expect(late).toBeGreaterThan(early * 2);
    });
});
