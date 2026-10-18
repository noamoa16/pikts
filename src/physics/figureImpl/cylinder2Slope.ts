import { Vector3 } from "#vendor/babylon";
import { clamp } from "../../core/math";
import { RectangularPrism, invRotateByDir4, Slope, Cylinder } from "../figure";
import { Cylinder2RectPrism } from "./cylinder2RectPrism";
import { IFigureImpl } from "./figureImpl";

export class Cylinder2Slope implements IFigureImpl {
    constructor(private cylinder: Cylinder, private slope: Slope){}

    public intersects(): boolean{
        return this.intersectsFull();
    }

    /**
     * スロープの右下 7/8 だけで計算
     */
    public intersectsScaled(): boolean{
        return new Cylinder2Slope(this.cylinder, this.slope.scaledAsTriangle(7 / 8)).intersectsFull();
    }
    
    /**
     * 完全なスロープとして計算
     */
    public intersectsFull(): boolean{
        const center = invRotateByDir4(
            this.slope.center.subtract(this.cylinder.center),
            this.slope.upward,
        );
        const r = this.cylinder.radius;

        // 「円 vs. スロープ」 と 「円 vs. 直方体」に分割して解く
        // 円：中心が原点、半径r
        const vsSlope = () => {
            // スロープ：中心がc、長さl、傾きg、高さh (=gl)、幅w
            const c = center.add(new Vector3(0, 0, this.cylinder.height / 2));
            const l = this.slope.length;
            const h = this.slope.height;
            const w = this.slope.width;

            // 円のz座標が、スロープの下からどれくらいの位置にあるか
            const zRate = 1 / 2 - c.z / h;            
            if(!(0 <= zRate && zRate <= 1)){
                return false;
            }

            const minX = c.x - l / 2 + zRate * l;
            const maxX = c.x + l / 2;
            const minY = c.y - w / 2;
            const maxY = c.y + w / 2;
            const dx = clamp(0, minX, maxX);
            const dy = clamp(0, minY, maxY);

            return dx * dx + dy * dy < r * r;
        };
        const vsRect = () => {
            // 直方体：中心がc、長さ (l.x, l.y, l.z)
            const c = new Vector3(
                center.x,
                center.y,
                center.z - this.slope.height / 2,
            );
            const l = new Vector3(
                this.slope.length,
                this.slope.width,
                this.cylinder.height,
            );
            
            // z座標
            if(!(c.z - l.z / 2 < 0 && 0 < c.z + l.z / 2)){
                return false;
            }

            const minX = c.x - l.x / 2;
            const maxX = c.x + l.x / 2;
            const minY = c.y - l.y / 2;
            const maxY = c.y + l.y / 2;
            const dx = clamp(0, minX, maxX);
            const dy = clamp(0, minY, maxY);

            return dx * dx + dy * dy < r * r;
        };

        return vsSlope() || vsRect();
    }
    
    public space(_dir: Vector3, strict: boolean = false): number{
        if(strict){
            return this.spaceFull(_dir);
        }
        else{
            return this.spaceScaled(_dir);
        }
    }

    /**
     * 右下 7/8 のスロープとして計算
     */
    public spaceScaled(_dir: Vector3): number{
        return new Cylinder2Slope(this.cylinder, this.slope.scaledAsTriangle(7 / 8)).spaceFull(_dir);
    }

    /**
     * 完全なスロープとして計算
     */
    public spaceFull(_dir: Vector3): number{
        // 既に衝突している
        if(this.intersectsFull()) return 0;

        const center = invRotateByDir4(
            this.slope.center.subtract(this.cylinder.center),
            this.slope.upward,
        );
        const dir = invRotateByDir4(
            _dir,
            this.slope.upward,
        ).clone();
        const u = [dir.x, dir.y, dir.z];
        const r = this.cylinder.radius;

        // 「円 vs. スロープ」 と 「円 vs. 直方体」に分割して解く
        // 円：中心が原点、半径r
        const vsSlope = () => {
            // スロープ：中心がc、長さl、傾きg、高さh (=gl)、幅w
            const c = center.add(new Vector3(0, 0, this.cylinder.height / 2));
            const l = this.slope.length;
            const g = this.slope.gradient;
            const h = this.slope.height;
            const w = this.slope.width;

            const min = [c.x - l / 2, c.y - w / 2, c.z - h / 2];
            const max = [c.x + l / 2, c.y + w / 2, c.z + h / 2];

            const ts = [0, Infinity];
            if(dir.x !== 0){
                const x = c.x + l / 2;
                const t = x / dir.x;
                if (t > 0) ts.push(t);
            }
            // 坂：z - c.z <= g * (x - c.x)
            // (u_x * t, u_z * t) が z - c.z = g * (x - c.x) 上にあるときのtを求める
            // g * x - z - g * c.x + c.z
            // |g * u_x * t - u_z * t - g * c.x + c.z| / sqrt(g^2 + 1) = 0
            // (g * u_x - u_z) * t - g * c.x + c.z = 0
            // t = (g * c.x - c.z) / (g * u_x - u_z)
            if(dir.z - g * dir.x !== 0){
                const t = (g * c.x - c.z) / (g * dir.x - dir.z);
                if (t > 0) ts.push(t);
            }
            for (let i = 1; i < 3; i++) {
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
                const mid = b !== Infinity ? (a + b) / 2 : a + 1;

                // z座標が衝突しているか
                if(!(c.z - h / 2 <= dir.z * mid && dir.z * mid <= c.z + h / 2)){
                    continue;
                }

                let A = 0, B = 0, C = -r * r;

                // y座標
                for (let i = 1; i < 2; i++) {
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

                // xz座標
                // スロープの右側にいる場合
                if(c.x + l / 2 < dir.x * mid){
                    A += dir.x * dir.x;
                    B += -dir.x * (c.x + l / 2);
                    C += (c.x + l / 2) * (c.x + l / 2);
                }
                // スロープの坂道側にいる場合
                else{
                    // スロープは無限に続く坂とみなせる
                    // 坂：z - c.z <= g * (x - c.x)

                    // 坂の外部
                    if(dir.z * mid - c.z > g * (dir.x * mid - c.x)){
                        // 点と直線の距離を求め、x方向に写像
                        // d = (u_z * t - g * u_x * t + g * c.x - c.z) / sqrt(g^2 + 1)
                        // d = ((u_z - g * u_x) * t + g * c.x - c.z) / sqrt(g^2 + 1)
                        // tanθ = g
                        // sinθ = g / sqrt(g^2 + 1)
                        // dx = d / sinθ = ((u_z - g * u_x) * t + g * c.x - c.z) / g
                        const a = (dir.z - g * dir.x) / g;
                        const b = (g * c.x - c.z) / g;
                        A += a * a;
                        B += a * b;
                        C += b * b;
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
        };

        const vsRect = () => {
            const cylinder = new Cylinder(
                Vector3.Zero(),
                r,
                this.cylinder.height,
            )
            const rect = new RectangularPrism(
                new Vector3(
                    center.x,
                    center.y,
                    center.z - this.slope.height / 2,
                ),
                new Vector3(
                    this.slope.length,
                    this.slope.width,
                    0,
                )
            );
            return new Cylinder2RectPrism(cylinder, rect).space(_dir);
        };
        return Math.min(vsSlope(), vsRect());
    }

    /**
     * 重複を解消するためにどれだけ上に動けばいいか
     */
    public resolveOverlapUpDistance(): number{
        /*
        (r, -h/2 + a) と y = gx の距離が0になる点が答え
        a = gr + h/2
        */

        if(!this.intersectsFull()) return 0;

        const center = invRotateByDir4(
            this.slope.center.subtract(this.cylinder.center),
            this.slope.upward,
        );

        const dy = clamp(0, center.y - this.slope.width / 2, center.y + this.slope.width / 2);
        const rSq = this.cylinder.radius * this.cylinder.radius - dy * dy;

        if(rSq <= 0){
            return 0;
        }

        const g = this.slope.gradient;
        const top = center.z + this.slope.height / 2 + this.cylinder.height / 2;
        const d = -g * center.x + center.z;
        const r = g * Math.sqrt(rSq) + this.cylinder.height / 2;
        const u = d + r;

        return clamp(u, 0, top);
    }
}