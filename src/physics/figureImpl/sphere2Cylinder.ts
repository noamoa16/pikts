import { Vector3 } from "#vendor/babylon";
import { clamp, solveQuadratic, solveQuartic } from "../../core/math";
import { Cylinder, Sphere } from "../figure";
import { IFigureImpl } from "./figureImpl";

export class Sphere2Cylinder implements IFigureImpl {
    constructor(private sphere: Sphere, private cylinder: Cylinder){}
    intersects(): boolean {
        const center = this.cylinder.center.subtract(this.sphere.center);
        const dx = center.x;
        const dy = center.y;
        const dxy = Math.max(
            Math.sqrt(dx * dx + dy * dy) - this.cylinder.radius,
            0,
        );
        const dz = clamp(0, center.z - this.cylinder.height / 2, center.z + this.cylinder.height / 2);
        return dxy * dxy + dz * dz <
            (this.sphere.radius - Number.EPSILON) * (this.sphere.radius - Number.EPSILON);
    }
    space(_dir: Vector3): number {
        if(this.intersects()) return 0;

        const c = this.cylinder.center.subtract(this.sphere.center);
        const dir = _dir.clone().normalize();
        const halfHeight = this.cylinder.height / 2;
        const radius = this.sphere.radius;
        const contactRadius = radius - Number.EPSILON;
        const cylinderRadius = this.cylinder.radius;

        // 有限円柱までの距離は、側面・端面・上端角で式が切り替わる。
        // その境界時刻で区間を分け、各区間で最初の接触を求める。
        // 円柱を囲む球から、衝突し得る探索区間の上限を作る。
        const cylinderBoundRadius = Math.hypot(cylinderRadius, halfHeight);
        const upperBound = c.length() + cylinderBoundRadius + radius;
        const breakpoints = [0, upperBound];
        const radialVelocitySquared = dir.x * dir.x + dir.y * dir.y;
        const radialClosestTime = radialVelocitySquared === 0
            ? 0
            : (dir.x * c.x + dir.y * c.y) / radialVelocitySquared;
        if (radialClosestTime > 0 && radialClosestTime < upperBound) {
            breakpoints.push(radialClosestTime);
        }

        // 円柱側面との境界 |p_xy(t)| = cylinderRadius の時刻。
        if (radialVelocitySquared > 0) {
            const radialB = -2 * (dir.x * c.x + dir.y * c.y);
            const radialC = c.x * c.x + c.y * c.y - cylinderRadius * cylinderRadius;
            for (const time of solveQuadratic(radialVelocitySquared, radialB, radialC)) {
                if (time > 0 && time < upperBound) breakpoints.push(time);
            }
        }

        // 上下端面との境界時刻。
        if (dir.z !== 0) {
            for (const z of [-halfHeight, halfHeight]) {
                const time = (c.z + z) / dir.z;
                if (time > 0 && time < upperBound) breakpoints.push(time);
            }
        }
        breakpoints.sort((a, b) => a - b);

        const contactSquared = contactRadius * contactRadius;
        const firstQuadraticRoot = (a: number, b: number, c0: number, start: number, end: number): number => {
            return solveQuadratic(a, 2 * b, c0).find(time => time >= start && time <= end) ?? Infinity;
        };

        for (let i = 0; i < breakpoints.length - 1; i++) {
            const start = breakpoints[i];
            const end = breakpoints[i + 1];
            const sample = (start + end) / 2;
            const x = dir.x * sample - c.x;
            const y = dir.y * sample - c.y;
            const z = dir.z * sample - c.z;
            const radial = Math.hypot(x, y);
            const radialOutside = radial > cylinderRadius;
            const verticalOutside = Math.abs(z) > halfHeight;

            if (radialOutside && !verticalOutside) {
                // 側面領域: |p_xy(t)| = cylinderRadius + sphereRadius。
                const a = radialVelocitySquared;
                const b = dir.x * -c.x + dir.y * -c.y;
                const c0 = c.x * c.x + c.y * c.y - (cylinderRadius + contactRadius) ** 2;
                const time = firstQuadraticRoot(a, b, c0, start, end);
                if (time !== Infinity) return time;
                continue;
            }
            if (!radialOutside && verticalOutside) {
                // 端面領域: z が端面から sphereRadius の位置に来る時刻。
                const capZ = Math.sign(z) * (halfHeight + contactRadius);
                const time = dir.z === 0 ? Infinity : (c.z + capZ) / dir.z;
                if (time >= start && time <= end) return time;
                continue;
            }
            if (!radialOutside || !verticalOutside) continue;

            // 角領域では (sqrt(q(t)) - R)^2 + w(t)^2 = r^2。
            // 両辺を二乗すると四次方程式になるため、閉形式で根を求め、
            // 元の距離式でも確認して二乗による余分な根を除く。
            const capSign = Math.sign(z);
            const q0 = c.x * c.x + c.y * c.y;
            const q1 = -2 * (dir.x * c.x + dir.y * c.y);
            const q2 = radialVelocitySquared;
            const w0 = -c.z - capSign * halfHeight;
            const w1 = dir.z;
            const l0 = q0 + cylinderRadius * cylinderRadius + w0 * w0 - contactSquared;
            const l1 = q1 + 2 * w0 * w1;
            const l2 = q2 + w1 * w1;
            const polynomial0 = l0 * l0 - 4 * cylinderRadius * cylinderRadius * q0;
            const polynomial1 = 2 * l0 * l1 - 4 * cylinderRadius * cylinderRadius * q1;
            const polynomial2 = l1 * l1 + 2 * l0 * l2 - 4 * cylinderRadius * cylinderRadius * q2;
            const polynomial3 = 2 * l1 * l2;
            const polynomial4 = l2 * l2;
            const roots = solveQuartic(polynomial4, polynomial3, polynomial2, polynomial1, polynomial0)
                .filter(time => time >= start && time <= end)
                .sort((a, b) => a - b);
            for (const time of roots) {
                const px = dir.x * time - c.x;
                const py = dir.y * time - c.y;
                const pz = dir.z * time - c.z;
                if (Math.hypot(px, py) <= cylinderRadius || Math.sign(pz) !== capSign) continue;
                const radialSquared = px * px + py * py;
                const verticalOffset = pz - capSign * halfHeight;
                const lhs = radialSquared + cylinderRadius * cylinderRadius
                    + verticalOffset * verticalOffset - contactSquared;
                // The quartic's signed branch is the contact equation; avoid
                // rejecting its root due to a final floating-point rounding bit.
                if (lhs < 0) continue;
                return time;
            }
        }
        return Infinity;
    }
}
