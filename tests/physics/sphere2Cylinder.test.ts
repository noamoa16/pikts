import { describe, expect, it } from "vitest";
import { Vector3 } from "../../src/vendor/babylon";
import { Cylinder, Sphere } from "../../src/physics/figure";

const delta = Math.pow(2, -40); // float64 の誤差で消えない程度の差分

describe("Figure.intersects", () => {
    it("球と円柱がx方向で重なっているときに true を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 2);
        const right = new Cylinder(new Vector3(4 - delta, 0, 0), 2, 4);
        expect(left.intersects(right)).toBe(true);
        expect(right.intersects(left)).toBe(true);
    });
    it("球と円柱がx方向で接する場合に false を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 2);
        const right = new Cylinder(new Vector3(4, 0, 0), 2, 4);
        expect(left.intersects(right)).toBe(false);
        expect(right.intersects(left)).toBe(false);
    });

    it("球と円柱が斜めで重なっているときに true を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 2);
        const right = new Cylinder(new Vector3(2 * Math.SQRT2 - delta, 2 * Math.SQRT2, 0), 2, 4);
        expect(left.intersects(right)).toBe(true);
        expect(right.intersects(left)).toBe(true);
    });
    it("球と円柱が斜めで接する場合に false を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 2);
        const right = new Cylinder(new Vector3(2 * Math.SQRT2, 2 * Math.SQRT2, 0), 2, 4);
        expect(left.intersects(right)).toBe(false);
        expect(right.intersects(left)).toBe(false);
    });

    it("球と円柱がz方向で重なっているときに true を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 2 - delta), 1);
        const right = new Cylinder(new Vector3(0, 0, 0), 2, 2);
        expect(left.intersects(right)).toBe(true);
        expect(right.intersects(left)).toBe(true);
    });
    it("球と円柱がz方向で接する場合に false を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 2), 1);
        const right = new Cylinder(new Vector3(0, 0, 0), 2, 2);
        expect(left.intersects(right)).toBe(false);
        expect(right.intersects(left)).toBe(false);
    });
});

describe("Figure.space", () => {
    it("球-円柱のx+方向の移動時に最初の接触距離を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 1);
        const right = new Cylinder(new Vector3(3, 0, 0), 1, 2);
        expect(left.space(right, new Vector3(1, 0, 0))).toBe(1);
        expect(right.space(left, new Vector3(-1, 0, 0))).toBe(1);
    });
    it("球-円柱のx+y+方向の移動時に最初の接触距離を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 1);
        const right = new Cylinder(new Vector3(3, 3, 0), 1, 2);
        expect(left.space(right, new Vector3(1, 1, 0))).toBeCloseTo(3 * Math.SQRT2 - 2);
        expect(right.space(left, new Vector3(-1, -1, 0))).toBeCloseTo(3 * Math.SQRT2 - 2);
    });
    it("球が円柱に接触しているときに 0 を返す", () => {
        const moving = new Sphere(new Vector3(Math.SQRT2 - delta, Math.SQRT2 - delta, 0), 1);
        const stationary = new Cylinder(new Vector3(0, 0, 0), 1, 2);
        expect(moving.space(stationary, new Vector3(1, 1, 0))).toBe(0);
        expect(stationary.space(moving, new Vector3(-1, -1, 0))).toBe(0);
    });
    it("球が円柱から遠ざかる方向に移動したときに Infinity を返す", () => {
        const moving = new Sphere(new Vector3(Math.SQRT2 + delta, Math.SQRT2 + delta, 0), 1);
        const stationary = new Cylinder(new Vector3(0, 0, 0), 1, 2);
        expect(moving.space(stationary, new Vector3(1, 1, 0))).toBe(Infinity);
        expect(stationary.space(moving, new Vector3(-1, -1, 0))).toBe(Infinity);
    });

    it("球-円柱がギリギリですれ違うときに Infinity を返す", () => {
        const moving = new Sphere(new Vector3(0, 0, 0), 1);
        const stationary = new Cylinder(new Vector3(2, 2, 0), 1, 2);
        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBe(Infinity);
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBe(Infinity);
    });
    it("球-円柱がギリギリで衝突する", () => {
        const moving = new Sphere(new Vector3(0, 0, 0), 1);
        const stationary = new Cylinder(new Vector3(2, 2 - delta, 0), 1, 2);
        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBeCloseTo(2 - Math.sqrt(2 * delta));
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBeCloseTo(2 - Math.sqrt(2 * delta));
    });

    it("球-円柱のz方向の移動時に最初の接触距離を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 3), 1);
        const right = new Cylinder(new Vector3(0, 0, 0), 1, 2);
        expect(left.space(right, new Vector3(0, 0, -1))).toBe(1);
        expect(right.space(left, new Vector3(0, 0, 1))).toBe(1);
    });
});
