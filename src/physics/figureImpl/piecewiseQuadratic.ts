export type QuadraticCoefficients = {
    /** Coefficient of t^2. */
    a: number;
    /** Half the coefficient of t. */
    b: number;
    /** Constant term. */
    c: number;
    /** Whether a tangent contact is accepted for this interval. */
    allowTangency?: boolean;
};

export type PiecewiseContactSegment = QuadraticCoefficients | {
    /** A contact distance found by a shape-specific degenerate case. */
    contactDistance: number;
};

/** Find the first contact across piecewise-quadratic distance regions. */
export function findFirstContactDistance(
    breakpoints: readonly number[],
    getSegment: (sampleTime: number) => PiecewiseContactSegment | null,
): number {
    for (let i = 0; i < breakpoints.length - 1; i++) {
        const start = breakpoints[i];
        const end = breakpoints[i + 1];
        const sampleTime = end === Infinity ? start + 1 : (start + end) / 2;
        const segment = getSegment(sampleTime);
        if (!segment) continue;
        if ("contactDistance" in segment) return segment.contactDistance;

        const { a, b, c, allowTangency = false } = segment;
        if (a === 0 || b >= 0) continue;

        // For a*t^2 + 2*b*t + c, the discriminant divided by four is b^2-a*c.
        const discriminant = b * b - a * c;
        if (discriminant < 0 || (!allowTangency && discriminant === 0)) {
            continue;
        }

        const firstRoot = (-b - Math.sqrt(discriminant)) / a;
        return Math.max(start, firstRoot);
    }

    return Infinity;
}
