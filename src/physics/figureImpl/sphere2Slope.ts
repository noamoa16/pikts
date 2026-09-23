import { Vector3 } from "#vendor/babylon";
import { clamp } from "../../core/math";
import { RectangularPrism, invRotateByDir4, Slope, Sphere } from "../figure";
import { getFigureImpl, IFigureImpl } from "./figureImpl";
import { Sphere2RectPrism } from "./sphere2RectPrism";

export class Sphere2Slope implements IFigureImpl {
    constructor(private sphere: Sphere, private slope: Slope){}

    public intersects(): boolean{
        return this.intersectsFull(); // 仮
    }

    /**
     * スロープの右下半分だけで計算
     */
    public intersectsHalf(): boolean{
        return new Sphere2Slope(this.sphere, this.slope.half()).intersectsFull();
    }
    
    /**
     * 完全なスロープとして計算
     */
    public intersectsFull(): boolean{
        const center = invRotateByDir4(
            this.slope.center.subtract(this.sphere.center),
            this.slope.upward,
        );

        // 直方体とみなして計算
        const straightRect = this.slope.rectPrism();

        // xz平面上で -arctan(1/2) 回転させ、sqrt(5)倍にスケールを拡大
        const originSphere = new Sphere(Vector3.Zero(), Math.sqrt(5) * this.sphere.radius);
        const diagRect = new RectangularPrism(
            new Vector3(
                2 * center.x + center.z,
                center.y,
                -center.x + 2 * center.z - this.slope.height,
            ),
            new Vector3(
                5 * this.slope.height,
                this.slope.width,
                2 * this.slope.height,
            ),
        );
        
        return (
            getFigureImpl(this.sphere, straightRect).intersects() &&
            getFigureImpl(originSphere, diagRect).intersects()
        );
    }
    
    public space(_dir: Vector3): number{
        return this.spaceHalf(_dir); // 仮
    }

    /**
     * 右下半分のスロープとして計算
     */
    public spaceHalf(_dir: Vector3): number{
        return new Sphere2Slope(this.sphere, this.slope.half()).spaceFull(_dir);
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
    public resolveOverlapUpDistance(): number{
        if(!this.intersects()) return 0;

        const center = invRotateByDir4(
            this.slope.center.subtract(this.sphere.center),
            this.slope.upward,
        );

        const dy = clamp(0, center.y - this.slope.width / 2, center.y + this.slope.width / 2);
        const rSq = this.sphere.radius * this.sphere.radius - dy * dy;

        if(rSq <= 0){
            return 0;
        }

        const top = center.z + this.slope.height / 2;
        const u = (-center.x + 2 * center.z + Math.sqrt(5 * rSq)) / 2;

        return Math.min(u, top + Math.sqrt(rSq));
    }
}