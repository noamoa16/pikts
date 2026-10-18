import { Vector3 } from "#vendor/babylon";
import { Cylinder } from "../figure";
import { IFigureImpl } from "./figureImpl";

export class Cylinder2Cylinder implements IFigureImpl {
    constructor(private cylinder1: Cylinder, private cylinder2: Cylinder){}
    intersects(): boolean {
        // 原点と合成cylinderの衝突を考えればよい
        const c = this.cylinder2.center.subtract(this.cylinder1.center);
        const r = this.cylinder1.radius + this.cylinder2.radius;
        const h = this.cylinder1.height + this.cylinder2.height;
        const dxy2 = c.x * c.x + c.y * c.y;
        const dz = Math.abs(c.z);
        return dxy2 < r * r && dz < h / 2;
    }
    space(_dir: Vector3): number {
        if(this.intersects()) return 0;

        const c = this.cylinder2.center.subtract(this.cylinder1.center);
        const h = this.cylinder1.height + this.cylinder2.height;
        const dir = _dir.clone().normalize();
        const r = this.cylinder1.radius + this.cylinder2.radius;

        const ts = [0, Infinity];

        /*
        xy平面上で、ベクトルが円と交わる時刻を求める
        ベクトル：u * t
        円：|(x, y) - c| = r_c
        |u * t - c| = r_c
        t^2 - 2 * (u * c) * t + |c|^2 - r_c^2 = 0
        */
        const B = -dir.dot(c);
        const C = c.lengthSquared() - r * r;
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

            let A = 0, B = 0, C = 0;
            let isSurface = true; // 表面に向かって衝突する場合

            const ut = dir.scale(mid); // u * t (tは代表値)

            // xy平面上で中心点同士の距離
            const dSq = (ut.x - c.x) * (ut.x - c.x) + (ut.y - c.y) * (ut.y - c.y);
            if(dSq > r * r){
                //   (u_x * t - c_x)^2 + (u_y * t - c_y)^2 - r_c^2
                // = (u_x^2 + u_y^2) t^2 - 2 (u_x * c_x + u_y * c_y) t + c_x^2 + c_y^2 - r_c^2
                A += dir.x * dir.x + dir.y * dir.y;
                B += -(dir.x * c.x + dir.y * c.y);
                C = c.x * c.x + c.y * c.y - r * r;
                isSurface = false;
            }

            // z方向で中心点同士の距離
            // 距離: |u * t - q|
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
            if (
                (isSurface && disc < 0) ||
                (!isSurface && disc <= 0)
            ){
                continue;
            }

            const sqrtDisc = Math.sqrt(disc);
            const t1 = (-B - sqrtDisc) / A; // 接触開始時刻
            // 接触終了時刻 は使わない
            const t = Math.max(a, t1); // 区間内で初めに接触する時刻

            return t;
        }

        return Infinity;
    }
}
