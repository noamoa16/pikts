import { describe, expect, it } from "vitest";
import { Vector3 } from "../../src/vendor/babylon";
import { Cube, Sphere } from "../../src/physics/figure";

describe("Figure.space", () => {
    it("移動方向がゼロの場合に Infinity を返す", () => {
        const sphere1 = new Sphere(new Vector3(0, 0, 0), 1);
        const sphere2 = new Sphere(new Vector3(0, 6, 0), 1);
        const cube1 = new Cube(new Vector3(5, 0, 0), 2);
        const cube2 = new Cube(new Vector3(0, 4, 0), 2);
        const figures = [sphere1, sphere2, cube1, cube2];
        for(const figure1 of figures){
            for(const figure2 of figures){
                expect(figure1.space(figure2, Vector3.Zero())).toBe(Infinity);
            }
        }
    });
});
