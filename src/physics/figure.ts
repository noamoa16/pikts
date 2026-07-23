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
            const closestX = clamp(this.center.x, minX, maxX);
            const closestY = clamp(this.center.y, minY, maxY);
            const closestZ = clamp(this.center.z, minZ, maxZ);

            // 球の中心とその最短点間距離（平方）
            const d = this.center.subtract(new Vector3(closestX, closestY, closestZ));
            const distanceSq = d.lengthSquared();

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
            const d0 = other.center.subtract(this.center);
            const R  = this.radius + other.radius;
    
            // ||t * u - d0|| = R となる t が答え
            // 解方程式: t^2 - 2(d0·u)t + (|d0|^2 - R^2) = 0
            // u は移動方向のベクトル
            const a = 1; // |u|^2 == 1
            const b = -2 * d0.dot(dir);
            const c = d0.lengthSquared() - R * R;
    
            const disc = b * b - 4 * a * c;
            if (disc < 0) return Infinity; // 接触しない
    
            const sqrtDisc = Math.sqrt(disc);
            const t1 = (-b - sqrtDisc) / (2 * a); // 早い解
            const t2 = (-b + sqrtDisc) / (2 * a); // 遅い解
    
            if (t1 >= 0) return t1;
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
            const half = other.edgeLength / 2;
            const minX = other.center.x - half - this.radius;
            const maxX = other.center.x + half + this.radius;
            const minY = other.center.y - half - this.radius;
            const maxY = other.center.y + half + this.radius;
            const minZ = other.center.z - half - this.radius;
            const maxZ = other.center.z + half + this.radius;
    
            const d = dir.clone();
            for(const dim of ['x', 'y', 'z'] as const){
                if(d[dim] > 0) d[dim] = 1;
                if(d[dim] < 0) d[dim] = -1;
            }
            let tmin = -Infinity;
            let tmax = Infinity;
    
            // X軸
            if (d.x !== 0) {
                const t1 = (minX - this.center.x) / d.x;
                const t2 = (maxX - this.center.x) / d.x;
                tmin = Math.max(tmin, Math.min(t1, t2));
                tmax = Math.min(tmax, Math.max(t1, t2));
            } else {
                if (
                    this.center.x < minX + Number.EPSILON ||
                    this.center.x > maxX - Number.EPSILON
                ) return Infinity;
            }
    
            // Y軸
            if (d.y !== 0) {
                const t1 = (minY - this.center.y) / d.y;
                const t2 = (maxY - this.center.y) / d.y;
                tmin = Math.max(tmin, Math.min(t1, t2));
                tmax = Math.min(tmax, Math.max(t1, t2));
            } else {
                if (
                    this.center.y < minY + Number.EPSILON ||
                    this.center.y > maxY - Number.EPSILON
                ) return Infinity;
            }
    
            // Z軸
            if (d.z !== 0) {
                const t1 = (minZ - this.center.z) / d.z;
                const t2 = (maxZ - this.center.z) / d.z;
                tmin = Math.max(tmin, Math.min(t1, t2));
                tmax = Math.min(tmax, Math.max(t1, t2));
            } else {
                if (
                    this.center.z < minZ + Number.EPSILON ||
                    this.center.z > maxZ - Number.EPSILON
                ) return Infinity;
            }
    
            // 交差しない場合
            if (tmax < Number.EPSILON || tmin > tmax) return Infinity;
    
            // 交差が起こる距離
            const t = Math.max(tmin, 0);
            return t;
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
    
            const c1 = this.center.clone(); // moving
            const c2 = other.center.clone(); // stationary
    
            for (const axis of ['x', 'y', 'z'] as const) {
                const v = dir[axis];
                const left1  = c1[axis] - half1;
                const right1 = c1[axis] + half1;
                const left2  = c2[axis] - half2;
                const right2 = c2[axis] + half2;
    
                if (v === 0) {
                    // 静止している軸
                    if (left1 > right2 || left2 > right1) return Infinity; // 別々で衝突しない
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
}

export class Sphere extends Figure {
    public readonly shape: Shape = Shape.Sphere;
    constructor(center: Vector3, public readonly radius: number){
        super(center);
    }
}

export class Cube extends Figure {
    public readonly shape: Shape = Shape.Cube;
    constructor(center: Vector3, public readonly edgeLength: number){
        super(center);
    }
}
