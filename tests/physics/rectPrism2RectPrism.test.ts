import { describe, expect, it } from "vitest";
import { Vector3 } from "../../src/vendor/babylon";
import { Cube } from "../../src/physics/figure";

const delta = Math.pow(2, -40); // float64 の誤差で消えない程度の差分

describe("Figure.intersects", () => {
    it("立方体同士が重なっているときに true を返す", () => {
        const left = new Cube(new Vector3(0, 0, 0), 2);
        const right = new Cube(new Vector3(2 - delta, 0, 0), 2);
        expect(left.intersects(right)).toBe(true);
        expect(right.intersects(left)).toBe(true);
    });
    it("立方体同士が接する場合に false を返す", () => {
        const left = new Cube(new Vector3(0, 0, 0), 2);
        const right = new Cube(new Vector3(2, 0, 0), 2);
        expect(left.intersects(right)).toBe(false);
        expect(right.intersects(left)).toBe(false);
    });

    it("立方体同士が斜めで重なっているときに true を返す", () => {
        const left = new Cube(new Vector3(0, 0, 0), 2);
        const right = new Cube(new Vector3(2 - delta, 2 - delta, 0), 2);
        expect(left.intersects(right)).toBe(true);
        expect(right.intersects(left)).toBe(true);
    });
    it("立方体同士が斜めで接する場合に false を返す", () => {
        const left = new Cube(new Vector3(0, 0, 0), 2);
        const right = new Cube(new Vector3(2, 2, 0), 2);
        expect(left.intersects(right)).toBe(false);
        expect(right.intersects(left)).toBe(false);
    });
});

describe("Figure.space", () => {
    it("立方体-立方体の移動時に最初の接触距離を返す", () => {
        const moving = new Cube(new Vector3(0, 0, 0), 2);
        const stationary = new Cube(new Vector3(5, 0, 0), 2);
        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBe(3);
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBe(3);
    });
    it("立方体-立方体がギリギリですれ違うときに Infinity を返す", () => {
        const moving = new Cube(new Vector3(0, 0, 0), 2);
        const stationary = new Cube(new Vector3(2, 2, 0), 2);
        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBe(Infinity);
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBe(Infinity);
    });
    it("立方体-立方体がギリギリで衝突する", () => {
        const moving = new Cube(new Vector3(0, 0, 0), 2);
        const stationary = new Cube(new Vector3(2, 2 - delta, 0), 2);
        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBe(0);
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBe(0);
    });
});
