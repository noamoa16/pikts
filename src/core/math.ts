import { Vector2, Vector3 } from "#vendor/babylon";

export function hashInt32(x: number): number {
    x |= 0;
    x ^= x >>> 16;
    x = Math.imul(x, 0x7feb352d);
    x ^= x >>> 15;
    x = Math.imul(x, 0x846ca68b);
    x ^= x >>> 16;
    return x >>> 0;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}

/**
 * 角度を [-π, π) の範囲に正規化する
 * includePi が true ならば、(-π, π]
 */
export function normalizeAngle(angle: number, { includePi = false } = {}): number {
    const twoPi = 2 * Math.PI;
    let a = ((angle + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
    if (includePi && a === -Math.PI) {
        a = Math.PI;
    }
    return a;
}

export function atan(v: Vector2): number {
    return Math.atan2(v.y, v.x);
}

export function rotate2D(x: number, y: number, angle: number): Vector2;
export function rotate2D(v: Vector2, angle: number): Vector2;
export function rotate2D(a: any, b: any, c?: any): Vector2 {
    const angle: number = typeof c === 'number' ? c : b;

    let x: number, y: number;
    if (a instanceof Vector2) {
        x = a.x;
        y = a.y;
    } else {
        x = a;
        y = b as number;
    }

    const cVal = Math.cos(angle);
    const sVal = Math.sin(angle);
    return new Vector2(
        x * cVal - y * sVal,
        x * sVal + y * cVal,
    );
}

export function toVector3(v: Vector2, z = 0): Vector3 {
    return new Vector3(v.x, v.y, z);
}

export function toVector2(v: Vector3): Vector2 {
    return new Vector2(v.x, v.y);
}
