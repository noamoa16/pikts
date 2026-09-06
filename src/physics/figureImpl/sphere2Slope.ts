import { Vector3 } from "#vendor/babylon";
import { clamp } from "../../core/math";
import { RectangularPrism, rotateByDir4, Slope, Sphere } from "../figure";
import { getFigureImpl, IFigureImpl } from "./figureImpl";

export class Sphere2Slope implements IFigureImpl {
    constructor(private sphere: Sphere, private slope: Slope){}
    public intersects(): boolean{
        const center = rotateByDir4(
            this.slope.center.subtract(this.sphere.center),
            this.slope.upward,
        );

        // 円の中心からスロープまでの最短地点が側面の場合
        if(center.z >= center.x / 2){
            // 直方体とみなして計算
            const rectPrism = new RectangularPrism(
                this.slope.center.clone(),
                new Vector3(
                    2 * this.slope.height,
                    this.slope.width,
                    this.slope.height,
                ),
            );
            return getFigureImpl(this.sphere, rectPrism).intersects();
        }
        else{
            // xz平面上で -arctan(1/2) 回転させ、sqrt(5)倍にスケールを拡大
            const originSphere = new Sphere(Vector3.Zero(), Math.sqrt(5) * this.sphere.radius);
            const rectPrism = new RectangularPrism(
                new Vector3(
                    2 * center.x + center.z,
                    center.y,
                    -center.x + 2 * center.z - this.slope.height,
                ),
                new Vector3(
                    Math.sqrt(5) * this.slope.height,
                    this.slope.width,
                    2 * this.slope.height,
                ),
            );
            return getFigureImpl(originSphere, rectPrism).intersects();
        }
    }

    // スロープの底面のみで計算する
    public space(_dir: Vector3): number{
        const center = rotateByDir4(
            this.slope.center.subtract(this.sphere.center),
            this.slope.upward,
        );
        _dir = rotateByDir4(
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

    //　重複を解消するためにどれだけ上に動けばいいか
    public resolveOverlapUpDistance(): number{
        if(!this.intersects()) return 0;

        const center = rotateByDir4(
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