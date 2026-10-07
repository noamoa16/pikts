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
        return dxy * dxy + dz * dz < this.sphere.radius * this.sphere.radius;
    }
    space(_dir: Vector3): number {
        if(this.intersects()) return 0;

        /*
        (x - u_x * t)^2 + (y - u_y * t)^2 + (z - u_z * t)^2 = r_s^2
        (x - c_x)^2 + (y ^ c_y)^2 = r_c^2 and c_z - h/2 <= z <= c_z + h/2

        距離関数：
        d(t)^2 = max((u_x * t - c_x)^2 + (u_y * t - c_y)^2 - r_c^2, 0) + 
                 clamp(0, u_z * t - (c_z - h/2), u_z * t - (c_z + h/2))^2
        */
        const c = this.cylinder.center.subtract(this.sphere.center);
        const h = this.cylinder.height;
        const dir = _dir.clone().normalize();
        const rs = this.sphere.radius;
        const rc = this.cylinder.radius;

        const ts = [0, Infinity];

        /*
        xy平面上で、ベクトルが円と交わる時刻を求める
        ベクトル：u * t
        円：|(x, y) - c| = r_c
        |u * t - c| = r_c
        t^2 - 2 * (u * c) * t + |c|^2 - r_c^2 = 0
        */
        const B = -dir.dot(c);
        const C = c.lengthSquared() - rc * rc;
        const D = B * B - C;
        if(D == 0){
            const root = -B;
            if(root > 0){
                ts.push(root);
            }
        }
        else if(D > 0){
            const root1 = -B - Math.sqrt(D);
            const root2 = -B + Math.sqrt(D);
            if(root1 > 0){
                ts.push(root1);
            }
            if(root2 > 0){
                ts.push(root2);
            }
        }

        /*
        z軸上で、ベクトルが面と交わる時刻を求める
        */
        if(dir.z != 0){
            for (const x of [c.z - h / 2, c.z + h / 2]) {
                const t = x / dir.z;
                if (t > 0) ts.push(t);
            }
        }

        ts.sort((a, b) => a - b);

        // 距離関数の区間ごとに計算
        // d(t)^2 = At^2 + Bt + C = r_s^2 の形にする
        for (let j = 0; j < ts.length - 1; j++) {
            const a = ts[j];
            const b = ts[j + 1];
            const mid = b !== Infinity ? (a + b) / 2 : a + 1;

            let A = 0, B = 0, C = -rs * rs;

            const ut = dir.scale(mid); // u * t (tは代表値)

            // xy平面上で中心点同士の距離
            const dSq = (ut.x - c.x) * (ut.x - c.x) + (ut.y - c.y) * (ut.y - c.y);
            if(dSq > rc * rc){
                //   (u_x * t - c_x)^2 + (u_y * t - c_y)^2 - r_c^2
                // = (u_x^2 + u_y^2) t^2 - 2 (u_x * c_x + u_y * c_y) t + c_x^2 + c_y^2 - r_c^2
                A += dir.x * dir.x + dir.y * dir.y;
                B += -(dir.x * c.x + dir.y * c.y);
                C = c.x * c.x + c.y * c.y - (rs + rc) * (rs + rc);
            }

            // z方向で中心点同士の距離
            if(ut.z < c.z - h / 2){
                const q = c.z - h / 2;
                A += dir.z * dir.z;
                B += -q * dir.z;
                C += q * q;
            }
            else if(ut.z > c.z + h / 2){
                const q = c.z + h / 2;
                A += dir.z * dir.z;
                B += -q * dir.z;
                C += q * q;
            }

            if (A === 0) continue;

            // 近付かない or 遠ざかる方向に動く
            if (B >= 0){
                continue;
            }

            const disc = B * B - A * C; // D/4 = b^2 - ac
            if (disc <= 0) continue;

            const sqrtDisc = Math.sqrt(disc);
            const t1 = (-B - sqrtDisc) / A; // 接触開始時刻
            // 接触終了時刻 は使わない
            const t = Math.max(a, t1); // 区間内で初めに接触する時刻

            return t;
        }

        return Infinity;
    }
}
