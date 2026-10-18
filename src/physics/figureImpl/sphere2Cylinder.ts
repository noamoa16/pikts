import { Vector3 } from "#vendor/babylon";
import { clamp } from "../../core/math";
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

        // 円柱までの距離は、有限円柱への最近点距離で求める。
        // 上下端の角では水平距離と垂直距離を個別に膨らませる近似が
        // 誤った早期接触を返すため、端面と側面を含む実際の距離を使う。
        const distanceSquaredAt = (time: number): number => {
            const x = dir.x * time - c.x;
            const y = dir.y * time - c.y;
            const z = dir.z * time - c.z;
            const radialDistance = Math.hypot(x, y);
            const radialGap = Math.max(radialDistance - cylinderRadius, 0);
            const verticalGap = Math.max(Math.abs(z) - halfHeight, 0);
            return radialGap * radialGap + verticalGap * verticalGap;
        };

        // 円柱を囲む球から、衝突し得る探索区間の上限を作る。
        const cylinderBoundRadius = Math.hypot(cylinderRadius, halfHeight);
        const upperBound = c.length() + cylinderBoundRadius + radius;

        // 凸な円柱までの距離関数を三分探索して、レイ上の最小距離を探す。
        let low = 0;
        let high = upperBound;
        for (let i = 0; i < 80; i++) {
            const first = (2 * low + high) / 3;
            const second = (low + 2 * high) / 3;
            if (distanceSquaredAt(first) <= distanceSquaredAt(second)) {
                high = second;
            } else {
                low = first;
            }
        }
        const closestTime = (low + high) / 2;
        if (distanceSquaredAt(closestTime) > contactRadius * contactRadius) return Infinity;

        // t=0 は intersects() で除外済み。最初の接触点を二分探索する。
        low = 0;
        high = closestTime;
        for (let i = 0; i < 80; i++) {
            const mid = (low + high) / 2;
            if (distanceSquaredAt(mid) <= contactRadius * contactRadius) {
                high = mid;
            } else {
                low = mid;
            }
        }
        return high;
    }
}
