/**
 * Utility functions for BounceFlow
 */

/**
 * Linear interpolation between two values
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Interpolate between two hex colors
 */
export function lerpColor(color1, color2, t) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    const r = Math.round(lerp(c1.r, c2.r, t));
    const g = Math.round(lerp(c1.g, c2.g, t));
    const b = Math.round(lerp(c1.b, c2.b, t));

    return rgbToHex(r, g, b);
}

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Calculate distance between two points
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Check if point is inside a circle
 */
export function pointInCircle(px, py, cx, cy, radius) {
    return distance(px, py, cx, cy) <= radius;
}

/**
 * Check if point is near a line segment
 */
export function pointNearLine(px, py, x1, y1, x2, y2, threshold = 10) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return distance(px, py, x1, y1) <= threshold;

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    return distance(px, py, projX, projY) <= threshold;
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians) {
    return radians * 180 / Math.PI;
}
