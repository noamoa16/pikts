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

/** Solve a*x^2 + b*x + c = 0 and return its real roots in ascending order. */
export function solveQuadratic(a: number, b: number, c: number): number[] {
    if (a === 0) return b === 0 ? [] : [-c / b];
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return [];
    const sqrtDiscriminant = Math.sqrt(discriminant);
    const first = (-b - sqrtDiscriminant) / (2 * a);
    const second = (-b + sqrtDiscriminant) / (2 * a);
    return first <= second ? [first, second] : [second, first];
}

/** Solve a*x^3 + b*x^2 + c*x + d = 0 and return its real roots. */
export function solveCubic(a: number, b: number, c: number, d: number): number[] {
    if (a === 0) return solveQuadratic(b, c, d);
    const A = b / a;
    const B = c / a;
    const C = d / a;
    const p = B - A * A / 3;
    const q = 2 * A * A * A / 27 - A * B / 3 + C;
    const discriminant = q * q / 4 + p * p * p / 27;
    const shift = A / 3;
    let roots: number[];
    if (discriminant > 0) {
        const sqrtDiscriminant = Math.sqrt(discriminant);
        roots = [
            Math.cbrt(-q / 2 + sqrtDiscriminant)
            + Math.cbrt(-q / 2 - sqrtDiscriminant)
            - shift,
        ];
    } else if (p === 0) {
        roots = [-shift];
    } else {
        const radius = 2 * Math.sqrt(-p / 3);
        const angle = Math.acos(Math.max(-1, Math.min(1,
            (3 * q / (2 * p)) * Math.sqrt(-3 / p),
        ))) / 3;
        roots = [0, 1, 2].map(i => radius * Math.cos(angle - 2 * Math.PI * i / 3) - shift);
    }
    return roots.sort((x, y) => x - y);
}

/** Solve a*x^4 + b*x^3 + c*x^2 + d*x + e = 0 and return its real roots. */
export function solveQuartic(a: number, b: number, c: number, d: number, e: number): number[] {
    if (a === 0) return solveCubic(b, c, d, e);
    const A = b / a;
    const B = c / a;
    const C = d / a;
    const D = e / a;
    const p = B - 3 * A * A / 8;
    const q = C - A * B / 2 + A * A * A / 8;
    const r = D - A * C / 4 + A * A * B / 16 - 3 * A * A * A * A / 256;
    const shift = A / 4;
    const roots: number[] = [];

    if (Math.abs(q) <= Number.EPSILON * (Math.abs(p) + Math.abs(r) + 1)) {
        for (const ySquared of solveQuadratic(1, p, r)) {
            if (ySquared >= 0) {
                const y = Math.sqrt(ySquared);
                roots.push(y - shift, -y - shift);
            }
        }
        return roots.sort((x, y) => x - y);
    }

    // z = alpha^2 is a positive root of the resolvent cubic.
    const positiveResolventRoots = solveCubic(1, 2 * p, p * p - 4 * r, -q * q)
        .filter(value => value > 0);
    if (positiveResolventRoots.length === 0) return roots;
    const alpha = Math.sqrt(Math.max(...positiveResolventRoots));
    const beta = (p + alpha * alpha - q / alpha) / 2;
    const gamma = (p + alpha * alpha + q / alpha) / 2;
    for (const y of solveQuadratic(1, alpha, beta)) roots.push(y - shift);
    for (const y of solveQuadratic(1, -alpha, gamma)) roots.push(y - shift);
    return roots.sort((x, y) => x - y);
}

/**
 * double（IEEE‑754 64bit）の下位 16bit をクリアする
 *
 * @param x 入力 double（JavaScript の number）
 * @returns クリア後の数値
 */
export function clearLow16Bits(x: number): number {
    // バッファを作る（8 バイト = 64bit）
    const buffer = new ArrayBuffer(8);
    const view   = new DataView(buffer);
  
    // 入力値を Float64 として書き込む
    view.setFloat64(0, x, true);   // little‑endian
  
    /* ---- ビット列を取得 & 下位16bitクリア ---- */
    // BigUint64 を使うとコードが簡潔
    const bits   = view.getBigUint64(0, true);
    const clearedBits = bits & 0xFFFFFFFFFFFF0000n;   // 下位16bitを0に
  
    // クリアしたビット列を書き戻す
    view.setBigUint64(0, clearedBits, true);
  
    /* ---- Float64 として読み取る ---- */
    return view.getFloat64(0, true);
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
export function normalizeAngles(angles: Vector3, { includePi = false } = {}): Vector3 {
    return new Vector3(
        normalizeAngle(angles.x, { includePi }),
        normalizeAngle(angles.y, { includePi }),
        normalizeAngle(angles.z, { includePi }),
    );
}

function normalizeZero(value: number): number {
    if(Math.abs(value) < Number.EPSILON){
        return 0;
    }
    else{
        return value;
    }
}

export function atan(v: Vector2): number {
    return Math.atan2(v.y, v.x);
}

export function rotate2D(x: number, y: number, angle: number): Vector2;
export function rotate2D(v: Vector2, angle: number): Vector2;
export function rotate2D(a: any, b: any, c?: any): Vector2 {
    let angle: number = typeof c === 'number' ? c : b;
    angle = normalizeAngle(angle);

    let x: number, y: number;
    if (a instanceof Vector2) {
        x = a.x;
        y = a.y;
    } else {
        x = a;
        y = b as number;
    }

    if(Math.abs(angle) < Number.EPSILON){
        return new Vector2(x, y);
    }
    else if(Math.abs(angle - Math.PI) < Number.EPSILON || Math.abs(angle - (-Math.PI)) < Number.EPSILON){
        return new Vector2(normalizeZero(-x), normalizeZero(-y));
    }
    else if(Math.abs(angle - (-Math.PI / 2)) < Number.EPSILON){
        return new Vector2(y, normalizeZero(-x));
    }
    else if(Math.abs(angle - (Math.PI / 2)) < Number.EPSILON){
        return new Vector2(normalizeZero(-y), x);
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
