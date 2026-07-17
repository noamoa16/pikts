export function normalizeAngle(angle: number, { includePi = false } = {}): number {
    const twoPi = 2 * Math.PI;
    let a = ((angle + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
    if (includePi && a === -Math.PI) {
        a = Math.PI;
    }
    return a;
}