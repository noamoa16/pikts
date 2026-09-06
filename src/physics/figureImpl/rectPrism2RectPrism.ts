import { Vector3 } from "#vendor/babylon";
import { RectangularPrism } from "../figure";
import { IFigureImpl } from "./figureImpl";

export class RectPrism2RectPrism implements IFigureImpl {
    constructor(private rectPrism1: RectangularPrism, private rectPrism2: RectangularPrism){}
    public intersects(): boolean{
        const dx = (
            Math.abs(this.rectPrism1.center.x - this.rectPrism2.center.x) 
            - this.rectPrism1.edgeLengths.x / 2 - this.rectPrism2.edgeLengths.x / 2
        );
        const dy = (
            Math.abs(this.rectPrism1.center.y - this.rectPrism2.center.y) 
            - this.rectPrism1.edgeLengths.y / 2 - this.rectPrism2.edgeLengths.y / 2
        );
        const dz = (
            Math.abs(this.rectPrism1.center.z - this.rectPrism2.center.z) 
            - this.rectPrism1.edgeLengths.z / 2 - this.rectPrism2.edgeLengths.z / 2
        );
        return dx < 0 && dy < 0 && dz < 0;
    }
    public space(_dir: Vector3): number{
        const dir = _dir.clone().normalize();
        const half = this.rectPrism1.edgeLengths.add(this.rectPrism2.edgeLengths).scale(1 / 2);
            
        let tmin = -Infinity;
        let tmax = Infinity;

        const c = this.rectPrism2.center.subtract(this.rectPrism1.center); // thisの座標を原点にずらす

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
}