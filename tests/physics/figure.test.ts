import { describe, expect, it } from "vitest";

import { Vector3 } from "../../src/vendor/babylon";
import { Cube, Slope, Sphere } from "../../src/physics/figure";
import { Sphere2Slope } from "../../src/physics/figureImpl/sphere2Slope";

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

    it("球とスロープがy方向で重なっている場合に true を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 2);
        const right = new Slope(new Vector3(0, 3 - delta, 0), 2, 2);
        expect(left.intersects(right)).toBe(true);
        expect(right.intersects(left)).toBe(true);
    });
    it("球とスロープがy方向で接する場合に false を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 2);
        const right = new Slope(new Vector3(0, 3, 0), 2, 2);
        expect(left.intersects(right)).toBe(false);
        expect(right.intersects(left)).toBe(false);
    });
    it("球とスロープが斜面で重なっている場合に true を返す", () => {
        const left = new Sphere(new Vector3(-1, 0, 2), Math.sqrt(5) + delta);
        const right = new Slope(new Vector3(0, 0, 0), 2, 2);
        expect(left.intersects(right)).toBe(true);
        expect(right.intersects(left)).toBe(true);
    });
    it("球とスロープが斜面で接する場合に true を返す", () => {
        const left = new Sphere(new Vector3(-1, 0, 2), Math.sqrt(5) - delta);
        const right = new Slope(new Vector3(0, 0, 0), 2, 2);
        expect(left.intersects(right)).toBe(false);
        expect(right.intersects(left)).toBe(false);
    });
    it("球がスロープの右側で重なっている場合に true を返す", () => {
        const left = new Sphere(new Vector3(2, 0, 0), 1 + delta);
        const right = new Slope(new Vector3(0, 0, 0), 2, 1);
        expect(left.intersects(right)).toBe(true);
        expect(right.intersects(left)).toBe(true);
    });
    it("球がスロープの右側で接する場合に true を返す", () => {
        const left = new Sphere(new Vector3(2, 0, 0), 1);
        const right = new Slope(new Vector3(0, 0, 0), 2, 1);
        expect(left.intersects(right)).toBe(false);
        expect(right.intersects(left)).toBe(false);
    });
    it("球がスロープの下側で重なっている場合に true を返す", () => {
        const left = new Sphere(new Vector3(0, 0, -3 / 2), 1 + delta);
        const right = new Slope(new Vector3(0, 0, 0), 2, 1);
        expect(left.intersects(right)).toBe(true);
        expect(right.intersects(left)).toBe(true);
    });
    it("球がスロープの下側で接する場合に true を返す", () => {
        const left = new Sphere(new Vector3(0, 0, -3 / 2), 1);
        const right = new Slope(new Vector3(0, 0, 0), 2, 1);
        expect(left.intersects(right)).toBe(false);
        expect(right.intersects(left)).toBe(false);
    });
});

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

    it("立方体の上辺に止まった球を外側へ動かすことができる", () => {
        const radius = 0.0625;
        const moving = new Sphere(new Vector3(0.5, 0, 1 + radius), radius);
        const stationary = new Cube(new Vector3(0, 0, 0.5), 1);

        expect(moving.space(stationary, new Vector3(1, 0, 0))).toBe(Infinity);
        expect(stationary.space(moving, new Vector3(-1, 0, 0))).toBe(Infinity);
    });

    it("球が長方形の上側から衝突する", () => {
        const sphere = new Sphere(new Vector3(0, 0, 2), 1);
        const slope = new Slope(new Vector3(0, 0, 0.5), 2, 1);
        expect(sphere.space(slope, new Vector3(0, 0, -1))).toBe(1);
        expect(slope.space(sphere, new Vector3(0, 0, 1))).toBe(1);
    });
    it("球が長方形の下側から衝突する", () => {
        const sphere = new Sphere(new Vector3(0, 0, -2), 1);
        const slope = new Slope(new Vector3(0, 0, 0.5), 2, 1);
        expect(sphere.space(slope, new Vector3(0, 0, 1))).toBe(1);
        expect(slope.space(sphere, new Vector3(0, 0, -1))).toBe(1);
    });

    it("球が長方形とギリギリですれ違う", () => {
        const sphere = new Sphere(new Vector3(-3, 0, 1), 1);
        const slope = new Slope(new Vector3(0, 0, 0.5), 2, 1);
        expect(sphere.space(slope, new Vector3(1, 0, 0))).toBe(Infinity);
        expect(slope.space(sphere, new Vector3(-1, 0, 0))).toBe(Infinity);
    });
    it("球が長方形とギリギリ衝突する", () => {
        const sphere = new Sphere(new Vector3(-3, 0, 1 - delta), 1);
        const slope = new Slope(new Vector3(0, 0, 0.5), 2, 1);
        expect(sphere.space(slope, new Vector3(1, 0, 0))).toBeCloseTo(2 - Math.sqrt(2 * delta));
        expect(slope.space(sphere, new Vector3(-1, 0, 0))).toBeCloseTo(2 - Math.sqrt(2 * delta));
    });
});

describe("Sphere2Slope.resolveOverlapUpDistance", () => {
    it("スロープの下側", () => {
        const sphere = new Sphere(new Vector3(0, 0, 0), 1);
        const slope = new Slope(new Vector3(1, 0, 0.5), 2, 1);
        expect(new Sphere2Slope(sphere, slope).resolveOverlapUpDistance()).toBeCloseTo(Math.sqrt(5) / 2);
    });
    it("スロープの中間", () => {
        const sphere = new Sphere(new Vector3(0, 1.5, 0), 1);
        const slope = new Slope(new Vector3(0, 0, 0), 2, 1);
        expect(new Sphere2Slope(sphere, slope).resolveOverlapUpDistance()).toBeCloseTo(Math.sqrt(15 / 4) / 2);
    });
    it("スロープの上側", () => {
        const sphere = new Sphere(new Vector3(0, 0, 0), 1);
        const slope = new Slope(new Vector3(-1, 0, -0.5), 2, 1);
        expect(new Sphere2Slope(sphere, slope).resolveOverlapUpDistance()).toBe(1);
    });
});