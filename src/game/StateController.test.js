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
