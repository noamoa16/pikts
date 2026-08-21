import { Vector3 } from "#vendor/babylon"
import { clamp } from "../core/math";

export enum Shape {
    Sphere,
    Cube,
}

export abstract class Figure {
    public abstract readonly shape: Shape;
    constructor(public center: Vector3) {}
    
    /** 図形同士が重なっているか */
    public intersects(other: Figure): boolean {

        // Shapeの順序的に、this < other にする
        if(this.shape > other.shape){
            return other.intersects(this);
        }

        if(this instanceof Sphere && other instanceof Sphere){
            const distanceSq = Vector3.DistanceSquared(this.center, other.center);
            return distanceSq <
                (this.radius + other.radius - Number.EPSILON) *
                (this.radius + other.radius - Number.EPSILON);
        }
        else if(this instanceof Sphere && other instanceof Cube){
            // 立方体の半辺長
            const half = other.edgeLength / 2;

            // 立方体の各軸に対する境界
            const minX = other.center.x - half;
            const maxX = other.center.x + half;
            const minY = other.center.y - half;
            const maxY = other.center.y + half;
            const minZ = other.center.z - half;
            const maxZ = other.center.z + half;

            // 球の中心を立方体に最も近い点へクリップ
            const closest = new Vector3(
                clamp(this.center.x, minX, maxX),
                clamp(this.center.y, minY, maxY),
                clamp(this.center.z, minZ, maxZ),
            );

            // 球の中心とその最短点間距離（平方）
            const distanceSq = this.center.subtract(closest).lengthSquared();

            // 球の半径平方と比較して交差判定
            return distanceSq <
                (this.radius - Number.EPSILON) *
                (this.radius - Number.EPSILON);
        }
        else if(this instanceof Cube && other instanceof Cube){
            const dx = Math.abs(this.center.x - other.center.x) - this.edgeLength / 2 - other.edgeLength / 2;
            const dy = Math.abs(this.center.y - other.center.y) - this.edgeLength / 2 - other.edgeLength / 2;
            const dz = Math.abs(this.center.z - other.center.z) - this.edgeLength / 2 - other.edgeLength / 2;
            return dx < -Number.EPSILON && dy < -Number.EPSILON && dz < -Number.EPSILON;
        }
        throw new Error(`intersects() not implemented for ${this.shape} vs ${other.shape}`);
    }

    /** この図形は、other に衝突することなく dir の方向にどれだけ移動可能か */
    public space(other: Figure, _dir: Vector3): number {
    
        // dir がゼロなら無限に移動できる
        if (_dir.lengthSquared() === 0) return Infinity;
    
        // 移動方向を正規化
        const dir = _dir.clone().normalize();
    
        /* ---------- Sphere – Sphere ---------- */
        if (this instanceof Sphere && other instanceof Sphere) {
            const d = other.center.subtract(this.center);

            const u = dir.clone();

            const R = this.radius + other.radius;
    
            // ||t * u - d0|| = R となる t が答え
            // 解方程式: t^2 - 2(d0·u)t + (|d0|^2 - R^2) = 0
            // u は移動方向のベクトル
            const b = d.dot(u);
            const c = d.lengthSquared() - R * R;
    
            const disc = b * b - c; // D/4 = b^2 - ac = |d * u|^2 - |d|^2 + R^2
            if (disc <= 0) return Infinity; // 接触しない
    
            const sqrtDisc = Math.sqrt(disc);
            const t1 = b - sqrtDisc; // 接触開始時刻
            const t2 = b + sqrtDisc; // 接触終了時刻
    
            if (t1 >= 0) return t1;

            // 重複回避処理
            if (t2 >= -Number.EPSILON){
                if(Math.abs(t1) > Math.abs(t2)){ 
                    return Infinity;// 動くべき側
                }
                else{
                    return 0; //　制止するべき側
                }
            }

            return Infinity;
        }
    
        /* ---------- Sphere – Cube ---------- */
        if (this instanceof Sphere && other instanceof Cube) {

            // 中心が既に球の衝突領域内なら 0
            if(this.intersects(other)) return 0;

            const half = other.edgeLength / 2;
            const min = [ // 立方体の面 (小さい方の座標)
                other.center.x - half,
                other.center.y - half,
                other.center.z - half,
            ];
            const max = [ // 立方体の面 (大きい方の座標)
                other.center.x + half,
                other.center.y + half,
                other.center.z + half,
            ];
            const p = [this.center.x, this.center.y, this.center.z];
            const u = [dir.x, dir.y, dir.z];
            const r = this.radius;

            // 球の中心が、各軸の min/max を通過する時刻で区間を分割する
            // (区間ごとに距離関数が変わる)
            const ts = [0, Infinity];
            for (let i = 0; i < 3; i++) {
                if (u[i] === 0) continue;
                for (const x of [min[i], max[i]]) {
                    const t = (x - p[i]) / u[i];
                    if (t > 0) ts.push(t);
                }
            }
            ts.sort((a, b) => a - b);

            // 各区間では AABB までの距離^2 が二次関数になる
            for (let j = 0; j < ts.length - 1; j++) {
                const a = ts[j];
                const b = ts[j + 1];

                // 区間の代表座標を計算する用のサンプル時刻
                const mid = Number.isFinite(b) ? (a + b) / 2 : a + 1;

                // p: 球の座標
                // u: 移動ベクトル
                // |u * t + q| = r
                // |u|^2 * t^2 + 2 * (q * u) * t + |q|^2 - r^2 = 0
                let A = 0, B = 0, C = -r * r;
                for (let i = 0; i < 3; i++) {
                    const x = p[i] + u[i] * mid;
                    if (x < min[i]) {
                        const q = p[i] - min[i];
                        A += u[i] * u[i];
                        B += q * u[i];
                        C += q * q;
                    } else if (x > max[i]) {
                        const q = p[i] - max[i];
                        A += u[i] * u[i];
                        B += q * u[i];
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
    
        /* ---------- Cube – Sphere (対称) ---------- */
        if (this instanceof Cube && other instanceof Sphere) {
            return other.space(this, dir.negate());
        }
    
        /* ---------- Cube – Cube ---------- */
        if (this instanceof Cube && other instanceof Cube) {
            const half1 = this.edgeLength / 2;
            const half2 = other.edgeLength / 2;
    
            let tmin = -Infinity;
            let tmax = Infinity;
    
            const c1 = this.center; // moving
            const c2 = other.center; // stationary
    
            for (const axis of ['x', 'y', 'z'] as const) {
                const v = dir[axis];
                const left1  = c1[axis] - half1;
                const right1 = c1[axis] + half1;
                const left2  = c2[axis] - half2;
                const right2 = c2[axis] + half2;
    
                if (v === 0) {
                    // 静止している軸
                    if (left1 >= right2 || left2 >= right1) {
                        return Infinity; // 別々で衝突しない
                    }
                    continue;
                }
    
                const invV = 1 / v;
                let t0: number, t1: number;
    
                if (v > 0) {
                    t0 = (left2 - right1) * invV;
                    t1 = (right2 - left1) * invV;
                } else {
                    t0 = (right2 - left1) * invV;
                    t1 = (left2 - right1) * invV;
                }
    
                const tminAxis = Math.min(t0, t1);
                const tmaxAxis = Math.max(t0, t1);
    
                tmin = Math.max(tmin, tminAxis);
                tmax = Math.min(tmax, tmaxAxis);
            }
    
            if (tmax < 0 || tmin > tmax) return Infinity;
            const t = Math.max(tmin, 0);
            return t;
        }
        throw new Error(`space() not implemented for ${this.shape} vs ${other.shape}`);
    }

    public abstract scaled(_: number): Figure;
}

export class Sphere extends Figure {
    public readonly shape: Shape = Shape.Sphere;
    public get radius() { return this._radius; }
    private set radius(value: number) { this._radius = value; }
    constructor(center: Vector3, private _radius: number){
        super(center);
    }
    public scaled(ratio: number): Sphere {
        return new Sphere(
            this.center,
            this.radius * ratio,
        );
    }
}

export class Cube extends Figure {
    public readonly shape: Shape = Shape.Cube;
    public get edgeLength() { return this._edgeLength; }
    private set edgeLength(value: number) { this._edgeLength = value; }
    constructor(center: Vector3, private _edgeLength: number){
        super(center);
    }
    public scaled(ratio: number): Cube {
        return new Cube(
            this.center,
            this.edgeLength * ratio,
        );
    }
}
