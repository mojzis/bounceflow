/**
 * Remembers the current level across page reloads (per browser).
 * Storage can be missing or blocked (private mode), so every access is
 * wrapped and failures just mean "nothing saved".
 */
const KEY = 'bounceflow.level';

export function loadSavedLevel() {
    try {
        const n = parseInt(window.localStorage.getItem(KEY), 10);
        return Number.isInteger(n) ? n : null;
    } catch {
        return null;
    }
}

export function saveLevel(levelId) {
    try {
        window.localStorage.setItem(KEY, String(levelId));
    } catch {
        // Not saved; the game works the same
    }
}
