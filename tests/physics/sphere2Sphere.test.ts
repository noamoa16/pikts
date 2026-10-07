import { describe, expect, it } from "vitest";
import { Vector3 } from "../../src/vendor/babylon";
import { Sphere } from "../../src/physics/figure";

const delta = Math.pow(2, -40); // float64 の誤差で消えない程度の差分

describe("Figure.intersects", () => {
    it("球同士が重なっているときに true を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 2);
        const right = new Sphere(new Vector3(4 - delta, 0, 0), 2);
        expect(left.intersects(right)).toBe(true);
        expect(right.intersects(left)).toBe(true);
    });
    it("球同士が接する場合に false を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 2);
        const right = new Sphere(new Vector3(4, 0, 0), 2);
        expect(left.intersects(right)).toBe(false);
        expect(right.intersects(left)).toBe(false);
    });

    it("球同士が斜めで重なっているときに true を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 2);
        const right = new Sphere(new Vector3(2 * Math.SQRT2 - delta, 2 * Math.SQRT2, 0), 2);
        expect(left.intersects(right)).toBe(true);
        expect(right.intersects(left)).toBe(true);
    });
    it("球同士が斜めで接する場合に false を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 2);
        const right = new Sphere(new Vector3(2 * Math.SQRT2, 2 * Math.SQRT2, 0), 2);
        expect(left.intersects(right)).toBe(false);
        expect(right.intersects(left)).toBe(false);
    });
});

describe("Figure.space", () => {
    it("球-球の移動時に最初の接触距離を返す", () => {
        const moving = new Sphere(new Vector3(0, 0, 0), 1);
        const stationary = new Sphere(new Vector3(3, 3, 0), 2);
        expect(moving.space(stationary, new Vector3(1, 1, 0))).toBeCloseTo(3 * Math.SQRT2 - 3);
        expect(stationary.space(moving, new Vector3(-1, -1, 0))).toBeCloseTo(3 * Math.SQRT2 - 3);
    });

    it("球が遠ざかる方向に移動したときに Infinity を返す", () => {
        const moving = new Sphere(new Vector3(0, 0, 0), 1);
        const stationary = new Sphere(new Vector3(5, 0, 0), 2);
        expect(moving.space(stationary, new Vector3(-1, 0, 0))).toBe(Infinity);
        expect(stationary.space(moving, new Vector3(1, 0, 0))).toBe(Infinity);
    });

    it("球が別の球とギリギリですれ違うときに Infinity を返す", () => {
        const moving = new Sphere(new Vector3(0, 0, 0), 1);
        const stationary = new Sphere(new Vector3(2, 2, 0), 1);
        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBe(Infinity);
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBe(Infinity);
    });
    it("球が別の球とギリギリで衝突する", () => {
        const moving = new Sphere(new Vector3(0, 0, 0), 1);
        const stationary = new Sphere(new Vector3(2, 2 - delta, 0), 1);
        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBeCloseTo(2 - Math.sqrt(4 * delta));
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBeCloseTo(2 - Math.sqrt(4 * delta));
    });
});
