import { Vector3 } from "#vendor/babylon";
import { clamp, rotate2D } from "../../core/math";
import { RectangularPrism, invRotateByDir4, Slope, Sphere } from "../figure";
import { getFigureImpl, IFigureImpl } from "./figureImpl";
import { Sphere2RectPrism } from "./sphere2RectPrism";

export class Sphere2Slope implements IFigureImpl {
    constructor(private sphere: Sphere, private slope: Slope){}

    public intersects(): boolean{
        return this.intersectsFull();
    }

    /**
     * スロープの右下 7/8 だけで計算
     */
    public intersectsScaled(): boolean{
        return new Sphere2Slope(this.sphere, this.slope.scaledAsTriangle(7 / 8)).intersectsFull();
    }
    
    /**
     * 完全なスロープとして計算
     */
    public intersectsFull(alpha: number = 0): boolean{
        const center = invRotateByDir4(
            this.slope.center.subtract(this.sphere.center),
            this.slope.upward,
        );

        // 直方体とみなして計算
        const straightRect = this.slope.rectPrism();

        /*
        xz平面上で -arctan(g) 回転
        θ = -arctan(g)
        tanθ = -g
        cosθ = 1 / sqrt(1 + g^2)
        sinθ = -g / sqrt(1 + g^2)
        */
        const originSphere = new Sphere(Vector3.Zero(), this.sphere.radius);
        const rectHeight = this.slope.height;
        const rotatedPoint = rotate2D(center.x, center.z, -Math.atan(this.slope.gradient + alpha));
        const diagRect = new RectangularPrism(
            new Vector3(
                rotatedPoint.x,
                center.y,
                rotatedPoint.y - rectHeight,
            ),
            new Vector3(
                Math.sqrt(1 + this.slope.gradient * this.slope.gradient) * this.slope.length, // 1 / cosθ * length
                this.slope.width,
                2 * rectHeight,
            ),
        );
        
        return (
            getFigureImpl(this.sphere, straightRect).intersects() &&
            getFigureImpl(originSphere, diagRect).intersects()
        );
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
        return new Sphere2Slope(this.sphere, this.slope.scaledAsTriangle(7 / 8)).spaceFull(_dir);
    }

    /**
     * 完全なスロープとして計算
     */
    public spaceFull(_dir: Vector3): number{
        // 既に衝突している
        if(this.intersectsFull()) return 0;

        const center = invRotateByDir4(
            this.slope.center.subtract(this.sphere.center),
            this.slope.upward,
        );
        _dir = invRotateByDir4(
            _dir,
            this.slope.upward,
        );

        const straightRect = this.slope.rectPrism();
        straightRect.center = center.clone();
        const originSphere = new Sphere(Vector3.Zero(), this.sphere.radius);
        const SQRT5 = Math.sqrt(5);
        const SQRT1_5 = 1 / SQRT5;
        const diagonalRect = new RectangularPrism(
            new Vector3(
                (2 * center.x + center.z) * SQRT1_5,
                center.y,
                (-center.x + 2 * center.z) * SQRT1_5 - this.slope.height,
            ),
            new Vector3(
                SQRT5 * this.slope.height,
                this.slope.width,
                2 * this.slope.height,
            ),
        );
        const _dirForDiag = new Vector3(
            2 * _dir.x + _dir.z,
            _dir.y,
            -_dir.x + 2 * _dir.z,
        );
        return Math.max(
            new Sphere2RectPrism(originSphere, straightRect).space(_dir),
            new Sphere2RectPrism(originSphere, diagonalRect).space(_dirForDiag),
        );
    }

    /**
     * スロープの底面のみで計算
     */
    public spaceBottom(_dir: Vector3): number{
        const center = invRotateByDir4(
            this.slope.center.subtract(this.sphere.center),
            this.slope.upward,
        );
        _dir = invRotateByDir4(
            _dir,
            this.slope.upward,
        );
        const originSphere = new Sphere(Vector3.Zero(), this.sphere.radius);
        const rectPrism = new RectangularPrism(
            new Vector3(
                center.x,
                center.y,
                center.z - this.slope.height / 2,
            ),
            new Vector3(
                2 * this.slope.height,
                this.slope.width,
                0,
            ),
        );
        return getFigureImpl(originSphere, rectPrism).space(_dir);
    }

    /**
     * 重複を解消するためにどれだけ上に動けばいいか
     */
    public resolveOverlapUpDistance(alpha: number = 0): number{
        /*
        y = gx
        gx - y = 0
        点と直線の距離は
        d = |gx - y| / sqrt(1 + g^2)
        y+ で距離が増加するので
        d = (-gx + y) / sqrt(1 + g^2)
        斜面の傾きは θ = arctan(g)
        1/cosθ = sqrt(1 + g^2)
        y方向の距離は sqrt(1 + g^2) * d
        球の直径分は sqrt(1 + g^2) * r
        u = sqrt(1 + g^2) * (d + r) 
          = -gx + y + sqrt(1 + g^2) * r
        */

        if(!this.intersectsFull(alpha)) return 0;

        const center = invRotateByDir4(
            this.slope.center.subtract(this.sphere.center),
            this.slope.upward,
        );

        const dy = clamp(0, center.y - this.slope.width / 2, center.y + this.slope.width / 2);
        const rSq = this.sphere.radius * this.sphere.radius - dy * dy;

        if(rSq <= 0){
            return 0;
        }

        const g = this.slope.gradient + alpha;
        const top = center.z + this.slope.height / 2;
        const d = -g * center.x + center.z;
        const r = Math.sqrt((1 + g * g) * rSq);
        const u = d + r;

        return clamp(u, 0, top + Math.sqrt(rSq));
    }
}