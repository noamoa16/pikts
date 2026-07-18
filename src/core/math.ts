import { Vector3 } from "#vendor/babylon";
import { Vector2 } from "@babylonjs/core";

export function normalizeAngle(angle: number, { includePi = false } = {}): number {
    const twoPi = 2 * Math.PI;
    let a = ((angle + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
    if (includePi && a === -Math.PI) {
        a = Math.PI;
    }
    return a;
}

export function rotate2D(x: number, y: number, angle: number) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Vector2(
        x * c - y * s,
        x * s + y * c,
    );
}

export function toVector3(v: Vector2, z = 0): Vector3 {
    return new Vector3(v.x, v.y, z);
}

export function toVector2(v: Vector3): Vector2 {
    return new Vector2(v.x, v.y);
}
