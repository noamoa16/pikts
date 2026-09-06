import { Vector3 } from "#vendor/babylon";
import { Sphere } from "../figure";
import { IFigureImpl } from "./figureImpl";

export class Sphere2Sphere implements IFigureImpl {
    constructor(private sphere1: Sphere, private sphere2: Sphere){}
    public intersects(): boolean{
        const distanceSq = Vector3.DistanceSquared(this.sphere1.center, this.sphere2.center);
        return distanceSq <
            (this.sphere1.radius + this.sphere2.radius) *
            (this.sphere1.radius + this.sphere2.radius);
    }
    public space(_dir: Vector3): number{
        const u = _dir.clone().normalize();
        const d = this.sphere2.center.subtract(this.sphere1.center);
        const R = this.sphere1.radius + this.sphere2.radius;

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
}