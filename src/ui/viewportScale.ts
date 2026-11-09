import { clamp } from "../core/math";

/** Scale UI with the dpad's viewport sizing, keeping its 48px minimum. */
export function getViewportUiScale(): number {
    const shortestSide = Math.min(window.innerWidth, window.innerHeight);
    const buttonSize = clamp(Math.round(shortestSide * 0.12), 48, 96);
    return buttonSize / 96;
}
