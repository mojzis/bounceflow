/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import {
    lerp,
    lerpColor,
    clamp,
    distance,
    pointInCircle,
    pointNearLine,
    degToRad,
    radToDeg
} from './utils.js';

describe('lerp', () => {
    it('should interpolate between two numbers', () => {
        expect(lerp(0, 10, 0.5)).toBe(5);
        expect(lerp(0, 10, 0)).toBe(0);
        expect(lerp(0, 10, 1)).toBe(10);
        expect(lerp(10, 20, 0.25)).toBe(12.5);
    });

    it('should handle negative numbers', () => {
        expect(lerp(-10, 10, 0.5)).toBe(0);
        expect(lerp(-5, 5, 0)).toBe(-5);
    });
});

describe('lerpColor', () => {
    it('should interpolate between two hex colors', () => {
        // Red to blue at 50% should be purple
        // 255 * 0.5 = 127.5, rounds to 128 (0x80)
        const result = lerpColor('#FF0000', '#0000FF', 0.5);
        expect(result).toBe('#800080');
    });

    it('should return start color at t=0', () => {
        const result = lerpColor('#FF6B6B', '#4ECDC4', 0);
        expect(result).toBe('#ff6b6b');
    });

    it('should return end color at t=1', () => {
        const result = lerpColor('#FF6B6B', '#4ECDC4', 1);
        expect(result).toBe('#4ecdc4');
    });
});

describe('clamp', () => {
    it('should clamp values within range', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge cases', () => {
        expect(clamp(0, 0, 10)).toBe(0);
        expect(clamp(10, 0, 10)).toBe(10);
    });
});

describe('distance', () => {
    it('should calculate distance between two points', () => {
        expect(distance(0, 0, 3, 4)).toBe(5); // 3-4-5 triangle
        expect(distance(0, 0, 0, 0)).toBe(0);
        expect(distance(1, 1, 4, 5)).toBe(5);
    });

    it('should handle negative coordinates', () => {
        expect(distance(-3, -4, 0, 0)).toBe(5);
    });
});

describe('pointInCircle', () => {
    it('should detect point inside circle', () => {
        expect(pointInCircle(5, 5, 5, 5, 10)).toBe(true); // Point at center
        expect(pointInCircle(10, 5, 5, 5, 10)).toBe(true); // Point at edge
        expect(pointInCircle(0, 0, 5, 5, 10)).toBe(true); // Point inside
    });

    it('should detect point outside circle', () => {
        expect(pointInCircle(20, 20, 5, 5, 10)).toBe(false);
        expect(pointInCircle(16, 5, 5, 5, 10)).toBe(false);
    });
});

describe('pointNearLine', () => {
    it('should detect point near horizontal line', () => {
        expect(pointNearLine(5, 5, 0, 5, 10, 5, 1)).toBe(true);
        expect(pointNearLine(5, 10, 0, 5, 10, 5, 1)).toBe(false);
    });

    it('should detect point near vertical line', () => {
        expect(pointNearLine(5, 5, 5, 0, 5, 10, 1)).toBe(true);
        expect(pointNearLine(10, 5, 5, 0, 5, 10, 1)).toBe(false);
    });

    it('should respect threshold distance', () => {
        expect(pointNearLine(5, 8, 0, 5, 10, 5, 5)).toBe(true);
        expect(pointNearLine(5, 8, 0, 5, 10, 5, 2)).toBe(false);
    });
});

describe('degToRad', () => {
    it('should convert degrees to radians', () => {
        expect(degToRad(0)).toBe(0);
        expect(degToRad(180)).toBeCloseTo(Math.PI);
        expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
        expect(degToRad(360)).toBeCloseTo(2 * Math.PI);
    });

    it('should handle negative angles', () => {
        expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2);
    });
});

describe('radToDeg', () => {
    it('should convert radians to degrees', () => {
        expect(radToDeg(0)).toBe(0);
        expect(radToDeg(Math.PI)).toBeCloseTo(180);
        expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
        expect(radToDeg(2 * Math.PI)).toBeCloseTo(360);
    });

    it('should handle negative angles', () => {
        expect(radToDeg(-Math.PI / 2)).toBeCloseTo(-90);
    });
});
