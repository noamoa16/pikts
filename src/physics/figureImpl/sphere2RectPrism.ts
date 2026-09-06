import { Vector3 } from "#vendor/babylon";
import { clamp } from "../../core/math";
import { RectangularPrism, Sphere } from "../figure";
import { IFigureImpl } from "./figureImpl";

export class Sphere2RectPrism implements IFigureImpl {
    constructor(private sphere: Sphere, private rectPrism: RectangularPrism){}
    public intersects(): boolean{
        const center = this.rectPrism.center.subtract(this.sphere.center);
        
        // 立方体の各軸に対する境界
        const minX = center.x - this.rectPrism.edgeLengths.x / 2;
        const maxX = center.x + this.rectPrism.edgeLengths.x / 2;
        const minY = center.y - this.rectPrism.edgeLengths.y / 2;
        const maxY = center.y + this.rectPrism.edgeLengths.y / 2;
        const minZ = center.z - this.rectPrism.edgeLengths.z / 2;
        const maxZ = center.z + this.rectPrism.edgeLengths.z / 2;

        // 直方体内で球に最も近い点
        const closest = new Vector3(
            clamp(0, minX, maxX),
            clamp(0, minY, maxY),
            clamp(0, minZ, maxZ),
        );

        // 球の中心とその最短点間距離（平方）
        const distanceSq = closest.lengthSquared();

        // 球の半径平方と比較して交差判定
        return distanceSq <
            (this.sphere.radius - Number.EPSILON) *
            (this.sphere.radius - Number.EPSILON);
    }
    public space(_dir: Vector3): number{
        // 中心が既に球の衝突領域内なら 0
        if(this.intersects()) return 0;

        // 球の中心が原点に来るようにずらす
        const min = [ // 立方体の面 (小さい方の座標)
            this.rectPrism.center.x - this.sphere.center.x - this.rectPrism.edgeLengths.x / 2,
            this.rectPrism.center.y - this.sphere.center.y - this.rectPrism.edgeLengths.y / 2,
            this.rectPrism.center.z - this.sphere.center.z - this.rectPrism.edgeLengths.z / 2,
        ];
        const max = [ // 立方体の面 (大きい方の座標)
            this.rectPrism.center.x - this.sphere.center.x + this.rectPrism.edgeLengths.x / 2,
            this.rectPrism.center.y - this.sphere.center.y + this.rectPrism.edgeLengths.y / 2,
            this.rectPrism.center.z - this.sphere.center.z + this.rectPrism.edgeLengths.z / 2,
        ];
        const dir = _dir.clone().normalize();
        const u = [dir.x, dir.y, dir.z];
        const r = this.sphere.radius;

        // 球の中心が、各軸の min/max を通過する時刻で区間を分割する
        // (区間ごとに距離関数が変わる)
        const ts = [0];
        for (let i = 0; i < 3; i++) {
            if (u[i] === 0) continue;
            for (const x of [min[i], max[i]]) {
                const t = x / u[i];
                if (t > 0) ts.push(t);
            }
        }
        ts.sort((a, b) => a - b);

        // 各区間では AABB までの距離^2 が二次関数になる
        for (let j = 0; j < ts.length - 1; j++) {
            const a = ts[j];
            const b = ts[j + 1];

            // 区間の代表座標を計算する用のサンプル時刻
            const mid = (a + b) / 2;

            // q：立方体の座標 (衝突点)
            // u: 移動ベクトル
            // |u * t - q| = r
            // |u|^2 * t^2 - 2 * (q * u) * t + |q|^2 - r^2 = 0
            let A = 0, B = 0, C = -r * r;
            for (let i = 0; i < 3; i++) {
                const x = u[i] * mid;
                if (x < min[i]) {
                    const q = min[i];
                    A += u[i] * u[i];
                    B += -q * u[i];
                    C += q * q;
                } else if (x > max[i]) {
                    const q = max[i];
                    A += u[i] * u[i];
                    B += -q * u[i];
                    C += q * q;
                }
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