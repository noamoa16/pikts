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
        const cxy2 = c.x * c.x + c.y * c.y;
        const dir = _dir.clone().normalize();
        const h2 = this.cylinder.height / 2;
        const rs = this.sphere.radius;
        const rse = rs - Number.EPSILON;
        const rse2 = rse * rse;
        const rc = this.cylinder.radius;
        const uxy2 = dir.x * dir.x + dir.y * dir.y;

        // 時刻の上界
        const upperBound = c.length() + Math.hypot(rc, h2) + rs;

        // 有限円柱までの距離は、側面・端面・上端角で式が切り替わる。
        // その境界時刻で区間を分け、各区間で最初の接触を求める。
        // 円柱を囲む球から、衝突し得る探索区間の上限を作る。
        const breakpoints = [0, upperBound];
        const radialClosestTime = uxy2 === 0
            ? 0
            : (dir.x * c.x + dir.y * c.y) / uxy2;
        if (radialClosestTime > 0 && radialClosestTime < upperBound) {
            breakpoints.push(radialClosestTime);
        }

        // 円柱側面との境界 |p_xy(t)| = cylinderRadius の時刻。
        // |u_xy * t - c_xy| = r_c
        if (uxy2 > 0) {
            const radialB = -2 * (dir.x * c.x + dir.y * c.y);
            const radialC = cxy2 - rc * rc;
            for (const time of solveQuadratic(uxy2, radialB, radialC)) {
                if (0 < time && time < upperBound) breakpoints.push(time);
            }
        }

        // 上下端面との境界時刻。
        // |u_z * t - c_z| = h/2
        if (dir.z !== 0) {
            for (const z of [-h2, h2]) {
                const time = (c.z + z) / dir.z;
                if (0 < time && time < upperBound) breakpoints.push(time);
            }
        }
        breakpoints.sort((a, b) => a - b);

        const firstQuadraticRoot = (a: number, b: number, c0: number, start: number, end: number): number => {
            return solveQuadratic(a, 2 * b, c0).find(time => start <= time && time <= end) ?? Infinity;
        };

        for (let i = 0; i < breakpoints.length - 1; i++) {
            const start = breakpoints[i];
            const end = breakpoints[i + 1];
            const sample = (start + end) / 2;
            const x = dir.x * sample - c.x;
            const y = dir.y * sample - c.y;
            const z = dir.z * sample - c.z;
            const radial = Math.hypot(x, y);
            const radialOutside = radial > rc;
            const verticalOutside = Math.abs(z) > h2;

            if (radialOutside && !verticalOutside) {
                // xy: 外部、z: 内部
                // xy平面上での球同士の衝突
                // |u_xy * t - c_xy| = r_c + r_s
                const a = uxy2;
                const b = -(dir.x * c.x + dir.y * c.y);
                const c0 = cxy2 - (rc + rse) ** 2;
                const time = firstQuadraticRoot(a, b, c0, start, end);
                if (time !== Infinity) return time;
                continue;
            }
            else if (!radialOutside && verticalOutside) {
                // xy: 内部、z: 外部
                // |u_z * t - c_z| = h/2 + r_s
                const capZ = Math.sign(z) * (h2 + rse);
                const time = dir.z === 0 ? Infinity : (c.z + capZ) / dir.z;
                if (start <= time && time <= end) return time;
                continue;
            }
            else if (!radialOutside || !verticalOutside) continue;
            else {
                /*
                xy: 外部、z: 外部
                (|u_xy * t - c_xy| - r_c)^2 + (|u_z * t - c_z| - h/2)^2 = r_s^2
                q(t) = q2 * t^2 + q1 * t + q0
                q2 = |u_xy|^2, q1 = -2 u_xy * c_xy, q0 = |c_xy|^2
                w(t) = w1 * t + w0
                w1 = u_z, w0 = - c_z - sign(u_z * t - c_z) * h/2
                (√q(t) - r_c)^2 + w(t)^2 = r_s^2
                q(t) + w(t)^2 + r_c^2 - r_s^2 = 2 r_c √q(t)
                (q2 + w1^2) * t^2 + (q1 + 2 w_0 w_1) * t + (q0 + w0^2 + r_c^2 - r_s^2) = 2 r_c √q(t)
                l2 * t^2 + l1 * t + l0 = 2 r_c √q(t)
                (l2 * t^2 + l1 * t + l0)^2 = 4 r_c^2 q(t)
                元の距離式でも確認して二乗による余分な根を除く。
                */
                const capSign = Math.sign(z);
                const q0 = cxy2;
                const q1 = -2 * (dir.x * c.x + dir.y * c.y);
                const q2 = uxy2;
                const w0 = -c.z - capSign * h2;
                const w1 = dir.z;
                const l0 = q0 + w0 * w0 + rc * rc - rse2;
                const l1 = q1 + 2 * w0 * w1;
                const l2 = q2 + w1 * w1;
                const polynomial0 = l0 * l0                 - 4 * rc * rc * q0;
                const polynomial1 = 2 * l0 * l1             - 4 * rc * rc * q1;
                const polynomial2 = l1 * l1 + 2 * l0 * l2   - 4 * rc * rc * q2;
                const polynomial3 = 2 * l1 * l2;
                const polynomial4 = l2 * l2;
                const roots = solveQuartic(polynomial4, polynomial3, polynomial2, polynomial1, polynomial0)
                    .filter(time => start <= time && time <= end)
                    .sort((a, b) => a - b);
                for (const time of roots) {
                    const px = dir.x * time - c.x;
                    const py = dir.y * time - c.y;
                    const pz = dir.z * time - c.z;
                    if (Math.hypot(px, py) <= rc || Math.sign(pz) !== capSign) continue;
                    const radialSquared = px * px + py * py;
                    const verticalOffset = pz - capSign * h2;
                    const lhs = radialSquared + rc * rc
                        + verticalOffset * verticalOffset - rse2;
                    // The quartic's signed branch is the contact equation; avoid
                    // rejecting its root due to a final floating-point rounding bit.
                    if (lhs < 0) continue;
                    return time;
                }
            }
        }
        return Infinity;
    }
}
