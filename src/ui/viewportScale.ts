import { clamp } from "../core/math";

/** Scale a UI component against its own target and minimum sizes. */
export function getViewportUiScale(size: number, minSize: number): number {
    const shortestSide = Math.min(window.innerWidth, window.innerHeight);
    const viewportSize = clamp(Math.round(shortestSide * 0.12), minSize, size);
    return viewportSize / size;
}
