import { Vector3 } from "#vendor/babylon";
import { clamp } from "../../core/math";
import { RectangularPrism, Cylinder } from "../figure";
import { IFigureImpl } from "./figureImpl";

export class Cylinder2RectPrism implements IFigureImpl {
    constructor(private cylinder: Cylinder, private rectPrism: RectangularPrism){}
    public intersects(): boolean{
        const center = this.rectPrism.center.subtract(this.cylinder.center);
        
        // 立方体の各軸に対する境界
        const minX = center.x - this.rectPrism.edgeLengths.x / 2;
        const maxX = center.x + this.rectPrism.edgeLengths.x / 2;
        const minY = center.y - this.rectPrism.edgeLengths.y / 2;
        const maxY = center.y + this.rectPrism.edgeLengths.y / 2;

        // 直方体内で球に最も近い点
        const dx = clamp(0, minX, maxX);
        const dy = clamp(0, minY, maxY);
        const dxy2 = dx * dx + dy * dy;

        return (
            dxy2 < (this.cylinder.radius - Number.EPSILON) * (this.cylinder.radius - Number.EPSILON) &&
            Math.abs(center.z) < this.cylinder.height / 2 + this.rectPrism.edgeLengths.z / 2
        );
    }
    public space(_dir: Vector3): number{
        // 既に衝突している
        if(this.intersects()) return 0;

        // xy平面上の円と直方体の衝突を考えればよい
        // 円：中心が原点、半径が r
        // 直方体：中心が c、長さが (l.x, l.y, l.z)
        const r = this.cylinder.radius;
        const c = this.rectPrism.center.subtract(this.cylinder.center);
        const l = this.rectPrism.edgeLengths;
        l.z += this.cylinder.height;

        const min = c.subtract(l.scale(1 / 2)).asArray();
        const max = c.add(l.scale(1 / 2)).asArray();
        
        const dir = _dir.clone().normalize();
        const u = [dir.x, dir.y, dir.z];

        // 円の中心が、各軸の min/max を通過する時刻で区間を分割する
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

        for (let j = 0; j < ts.length - 1; j++) {
            const a = ts[j];
            const b = ts[j + 1];

            // 区間の代表座標を計算する用のサンプル時刻
            const mid = (a + b) / 2;

            // z座標が衝突しているか
            if(!(min[2] <= dir.z * mid && dir.z * mid <= max[2])){
                continue;
            }

            // q：立方体の座標 (衝突点)
            // u: 移動ベクトル
            // |u * t - q| = r
            // |u|^2 * t^2 - 2 * (q * u) * t + |q|^2 - r^2 = 0
            let A = 0, B = 0, C = -r * r;
            for (let i = 0; i < 2; i++) {
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

            if (A === 0){
                // x,y座標の条件を満たさないときはスキップ
                if(C === 0 || dir.z === 0){
                    continue;
                }
                const t1 = min[2] / dir.z;
                const t2 = max[2] / dir.z;
                if(t1 >= 0){
                    return t1;
                }
                if(t2 >= 0){
                    return t2;
                }
            }

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