import { describe, expect, it } from "vitest";
import { Vector3 } from "../../src/vendor/babylon";
import { Cube, Sphere } from "../../src/physics/figure";

const delta = Math.pow(2, -40); // float64 の誤差で消えない程度の差分

describe("Figure.intersects", () => {
    it("球が立方体と重なっているときに true を返す", () => {
        const sphere = new Sphere(new Vector3(0, 0, 0), 2);
        const cube = new Cube(new Vector3(2 - delta, 0, 0), 2);
        expect(sphere.intersects(cube)).toBe(true);
        expect(cube.intersects(sphere)).toBe(true);
    });
    it("球と立方体が接する場合に false を返す", () => {
        const sphere = new Sphere(new Vector3(0, 0, 0), 1);
        const cube = new Cube(new Vector3(2, 0, 0), 2);
        expect(sphere.intersects(cube)).toBe(false);
        expect(cube.intersects(sphere)).toBe(false);
    });

    it("球と立方体が斜めで重なっているときに true を返す", () => {
        const sphere = new Sphere(new Vector3(0, 0, 0), 1);
        const cube = new Cube(new Vector3(1 + Math.SQRT2 / 2 - delta, 1 + Math.SQRT2 / 2, 0), 2);
        expect(sphere.intersects(cube)).toBe(true);
        expect(cube.intersects(sphere)).toBe(true);
    });
    it("球と立方体が斜めでほぼ接する場合に false を返す", () => {
        const sphere = new Sphere(new Vector3(0, 0, 0), 1);
        const cube = new Cube(new Vector3(1 + Math.SQRT2 / 2 + delta, 1 + Math.SQRT2 / 2 + delta, 0), 2);
        expect(sphere.intersects(cube)).toBe(false);
    });
});

describe("Figure.space", () => {
    it("球-立方体の移動時に最初の接触距離を返す", () => {
        const moving = new Sphere(new Vector3(0, 0, 0), 1);
        const stationary = new Cube(new Vector3(5, 0, 0), 2);
        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBe(3);
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBe(3);
    });

    it("球が立方体から遠ざかる方向に移動したときに Infinity を返す", () => {
        const moving = new Sphere(new Vector3(1 + Math.SQRT2 / 2 + delta, 1 + Math.SQRT2 / 2 + delta, 0), 1);
        const stationary = new Cube(new Vector3(0, 0, 0), 2);
        expect(moving.space(stationary, new Vector3(1, 1, 0))).toBe(Infinity);
        expect(stationary.space(moving, new Vector3(-1, -1, 0))).toBe(Infinity);
    });

    it("球-立方体がギリギリですれ違うときに Infinity を返す", () => {
        const moving = new Sphere(new Vector3(-1, -1, 0.125), 0.125);
        const stationary = new Cube(new Vector3(0, 0, -5), 10);
        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBe(Infinity);
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBe(Infinity);
    });
    it("球-立方体がギリギリで衝突する", () => {
        const moving = new Sphere(new Vector3(0, 0, 0), 1);
        const stationary = new Cube(new Vector3(2, 2 - delta, 0), 2);
        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBeCloseTo(1 - Math.sqrt(2 * delta));
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBeCloseTo(1 - Math.sqrt(2 * delta));
    });

    it("立方体の上辺に止まった球を外側へ動かすことができる", () => {
        const radius = 0.0625;
        const moving = new Sphere(new Vector3(0.5, 0, 1 + radius), radius);
        const stationary = new Cube(new Vector3(0, 0, 0.5), 1);

        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBe(Infinity);
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBe(Infinity);
    });
});
