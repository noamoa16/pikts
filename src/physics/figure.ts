import { Vector3 } from "#vendor/babylon"
import { clamp } from "../core/math";

export enum Shape {
    Sphere,
    RectangularPrism,
    Cube,
    Slope,
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
                (this.radius + other.radius) *
                (this.radius + other.radius);
        }
        else if(this instanceof Sphere && other instanceof RectangularPrism){

            const center = other.center.subtract(this.center);

            // 立方体の各軸に対する境界
            const minX = center.x - other.edgeLengths.x / 2;
            const maxX = center.x + other.edgeLengths.x / 2;
            const minY = center.y - other.edgeLengths.y / 2;
            const maxY = center.y + other.edgeLengths.y / 2;
            const minZ = center.z - other.edgeLengths.z / 2;
            const maxZ = center.z + other.edgeLengths.z / 2;

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
                (this.radius - Number.EPSILON) *
                (this.radius - Number.EPSILON);
        }
        else if(this instanceof RectangularPrism && other instanceof RectangularPrism){
            const dx = Math.abs(this.center.x - other.center.x) - this.edgeLengths.x / 2 - other.edgeLengths.x / 2;
            const dy = Math.abs(this.center.y - other.center.y) - this.edgeLengths.y / 2 - other.edgeLengths.y / 2;
            const dz = Math.abs(this.center.z - other.center.z) - this.edgeLengths.z / 2 - other.edgeLengths.z / 2;
            return dx < 0 && dy < 0 && dz < 0;
        }
        else if(this instanceof Sphere && other instanceof Slope){
            // 未デバッグ
            const center = other.center.subtract(this.center);
            const dy = clamp(0, center.y - other.width / 2, center.y + other.width / 2);
            const rSq = (this.radius - Number.EPSILON) * (this.radius - Number.EPSILON) - dy * dy;

            // y座標が衝突しない
            if(rSq < 0){
                return false;
            }

            // 円の中心が三角形の右側にある場合
            if(center.x + other.height <= 0){
                const dx = center.x + other.height;
                const dy = clamp(0, center.z - other.height / 2, center.z - other.height / 2);
                return dx * dx + dy * dy < rSq;
            }    
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
    
        /* ---------- Sphere – RectangularPrism ---------- */
        if (this instanceof Sphere && other instanceof RectangularPrism) {

            // 中心が既に球の衝突領域内なら 0
            if(this.intersects(other)) return 0;

            // 球の中心が原点に来るようにずらす
            const min = [ // 立方体の面 (小さい方の座標)
                other.center.x - this.center.x - other.edgeLengths.x / 2,
                other.center.y - this.center.y - other.edgeLengths.y / 2,
                other.center.z - this.center.z - other.edgeLengths.z / 2,
            ];
            const max = [ // 立方体の面 (大きい方の座標)
                other.center.x - this.center.x + other.edgeLengths.x / 2,
                other.center.y - this.center.y + other.edgeLengths.y / 2,
                other.center.z - this.center.z + other.edgeLengths.z / 2,
            ];
            const u = [dir.x, dir.y, dir.z];
            const r = this.radius;

            // 球の中心が、各軸の min/max を通過する時刻で区間を分割する
            // (区間ごとに距離関数が変わる)
            const ts = [0, Infinity];
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
                const mid = Number.isFinite(b) ? (a + b) / 2 : a + 1;

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
    
        /* ---------- RectangularPrism – Sphere (対称) ---------- */
        if (this instanceof RectangularPrism && other instanceof Sphere) {
            return other.space(this, dir.negate());
        }
    
        /* ---------- RectangularPrism – RectangularPrism ---------- */
        // thisを点に、otherを1辺 this.edgeLength + other.edgeLength の立方体に置き換えて考える
        if (this instanceof RectangularPrism && other instanceof RectangularPrism) {
            // const half = (this.edgeLength + other.edgeLength) / 2;
            const half = this.edgeLengths.add(other.edgeLengths).scale(1 / 2);
    
            let tmin = -Infinity;
            let tmax = Infinity;
    
            const c = other.center.subtract(this.center); // thisの座標を原点にずらす

            // dirを非負にする
            if(dir.x < 0){ dir.x *= -1; c.x *= -1; }
            if(dir.y < 0){ dir.y *= -1; c.y *= -1; }
            if(dir.z < 0){ dir.z *= -1; c.z *= -1; }
    
            for (const axis of ['x', 'y', 'z'] as const) {
                const v = dir[axis];
    
                if (v === 0) {
                    // 静止している軸
                    if (Math.abs(c[axis]) >= half[axis]) {
                        return Infinity; // 別々で衝突しない
                    }
                    continue;
                }
    
                const invV = 1 / v;
                const t0 = (c[axis] - half[axis]) * invV;
                const t1 = (c[axis] + half[axis]) * invV;
    
                tmin = Math.max(tmin, t0);
                tmax = Math.min(tmax, t1);
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

export class RectangularPrism extends Figure {
    public readonly shape: Shape = Shape.RectangularPrism;
    public get edgeLengths() { return this._edgeLengths.clone(); }
    protected set edgeLengths(value: Vector3) {this._edgeLengths = value.clone(); }
    constructor(center: Vector3, private _edgeLengths: Vector3) {
        super(center);
    }
    public scaled(ratio: number): RectangularPrism {
        return new RectangularPrism(
            this.center,
            this.edgeLengths.scale(ratio),
        );
    }
}

export class Cube extends RectangularPrism {
    public readonly shape: Shape = Shape.Cube;
    public get edgeLength() { return this.edgeLengths.x; }
    private set edgeLength(v: number) { this.edgeLengths = new Vector3(v, v, v); }
    constructor(center: Vector3, _edgeLength: number) {
        super(center, new Vector3(_edgeLength, _edgeLength, _edgeLength));
    }
    public scaled(ratio: number): Cube {
        return new Cube(
            this.center,
            this.edgeLength * ratio
        );
    }
}

/**
 * WIP 
 * 
 * -h / 2 <= z - c_z <= (x - c_x) / 2 <= h / 2
 * -w / 2 <= y - c_y <= w / 2
 * 
 * -x方向が低く、+x方向が高い
 * 後でスロープの向き (4通り) も考える
 * */
export class Slope extends Figure {
    public readonly shape: Shape = Shape.Slope;
    public get width() { return this._width; }
    private set width(v: number) { this._width = v; }
    public get height() { return this._height; }
    private set height(v: number) { this._height = v; }
    constructor(center: Vector3, private _width: number, private _height: number) {
        super(center);
    }
    public scaled(ratio: number): Slope {
        return new Slope(
            this.center,
            this.width * ratio,
            this.height * ratio,
        );
    }
}