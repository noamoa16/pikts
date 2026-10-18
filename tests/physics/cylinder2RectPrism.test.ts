import { describe, expect, it } from "vitest";
import { Vector3 } from "../../src/vendor/babylon";
import { Cube, Cylinder } from "../../src/physics/figure";

const delta = Math.pow(2, -40); // float64 の誤差で消えない程度の差分

describe("Figure.intersects", () => {
    it("円柱が立方体と重なっているときに true を返す", () => {
        const cylinder = new Cylinder(new Vector3(0, 0, 0), 2, 2);
        const cube = new Cube(new Vector3(2 - delta, 0, 0), 2);
        expect(cylinder.intersects(cube)).toBe(true);
        expect(cube.intersects(cylinder)).toBe(true);
    });
    it("円柱と立方体が接する場合に false を返す", () => {
        const cylinder = new Cylinder(new Vector3(0, 0, 0), 1, 2);
        const cube = new Cube(new Vector3(2, 0, 0), 2);
        expect(cylinder.intersects(cube)).toBe(false);
        expect(cube.intersects(cylinder)).toBe(false);
    });

    it("円柱と立方体が斜めで重なっているときに true を返す", () => {
        const cylinder = new Cylinder(new Vector3(0, 0, 0), 1, 2);
        const cube = new Cube(new Vector3(1 + Math.SQRT2 / 2 - delta, 1 + Math.SQRT2 / 2, 0), 2);
        expect(cylinder.intersects(cube)).toBe(true);
        expect(cube.intersects(cylinder)).toBe(true);
    });
    it("円柱と立方体が斜めでほぼ接する場合に false を返す", () => {
        const cylinder = new Cylinder(new Vector3(0, 0, 0), 1, 2);
        const cube = new Cube(new Vector3(1 + Math.SQRT2 / 2 + delta, 1 + Math.SQRT2 / 2 + delta, 0), 2);
        expect(cylinder.intersects(cube)).toBe(false);
    });
});

describe("Figure.space", () => {
    it("円柱-立方体の移動時に最初の接触距離を返す", () => {
        const moving = new Cylinder(new Vector3(0, 0, 0), 1, 2);
        const stationary = new Cube(new Vector3(5, 0, 0), 2);
        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBe(3);
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBe(3);
    });

    it("円柱が立方体から遠ざかる方向に移動したときに Infinity を返す", () => {
        const moving = new Cylinder(new Vector3(1 + Math.SQRT2 / 2 + delta, 1 + Math.SQRT2 / 2 + delta, 0), 1, 2);
        const stationary = new Cube(new Vector3(0, 0, 0), 2);
        expect(moving.space(stationary, new Vector3(1, 1, 0))).toBe(Infinity);
        expect(stationary.space(moving, new Vector3(-1, -1, 0))).toBe(Infinity);
    });
    it("円柱が立方体に接触しているときに 0 を返す", () => {
        const moving = new Cylinder(new Vector3(1 + Math.SQRT2 / 2 - delta, 1 + Math.SQRT2 / 2 - delta, 0), 1, 2);
        const stationary = new Cube(new Vector3(0, 0, 0), 2);
        expect(moving.space(stationary, new Vector3(1, 1, 0))).toBe(0);
        expect(stationary.space(moving, new Vector3(-1, -1, 0))).toBe(0);
    });
    
    it("円柱-立方体がギリギリですれ違うときに Infinity を返す", () => {
        const moving = new Cylinder(new Vector3(-1, -1, 0.125), 0.125, 0.25);
        const stationary = new Cube(new Vector3(0, 0, -5), 10);
        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBe(Infinity);
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBe(Infinity);
    });
    it("円柱-立方体がギリギリで衝突する", () => {
        const moving = new Cylinder(new Vector3(0, 0, 0), 1, 2);
        const stationary = new Cube(new Vector3(2, 2 - delta, 0), 2);
        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBeCloseTo(1 - Math.sqrt(2 * delta));
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBeCloseTo(1 - Math.sqrt(2 * delta));
    });

    it("立方体の上辺に止まった円柱を外側へ動かすことができる", () => {
        const height = 0.125;
        const moving = new Cylinder(new Vector3(0.5, 0, 1 + height / 2), 1, height);
        const stationary = new Cube(new Vector3(0, 0, 0.5), 1);

        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBe(Infinity);
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBe(Infinity);
    });
});
