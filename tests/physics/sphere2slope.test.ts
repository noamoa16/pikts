import { describe, expect, it } from "vitest";
import { Vector3 } from "../../src/vendor/babylon";
import { Slope, Sphere } from "../../src/physics/figure";
import { Sphere2Slope } from "../../src/physics/figureImpl/sphere2Slope";

const delta = Math.pow(2, -40); // float64 の誤差で消えない程度の差分

describe("Sphere2Slope.intersectsFull", () => {
    it("球とスロープがy方向で重なっている場合に true を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 2);
        const right = new Slope(new Vector3(0, 3 - delta, 0), 2, 2);
        const impl = new Sphere2Slope(left, right);
        expect(impl.intersectsFull()).toBe(true);
    });
    it("球とスロープがy方向で接する場合に false を返す", () => {
        const left = new Sphere(new Vector3(0, 0, 0), 2);
        const right = new Slope(new Vector3(0, 3, 0), 2, 2);
        const impl = new Sphere2Slope(left, right);
        expect(impl.intersectsFull()).toBe(false);
    });
    it("球とスロープが斜面で重なっている場合に true を返す", () => {
        const left = new Sphere(new Vector3(-1, 0, 2), Math.sqrt(5) + delta);
        const right = new Slope(new Vector3(0, 0, 0), 2, 2);
        const impl = new Sphere2Slope(left, right);
        expect(impl.intersectsFull()).toBe(true);
    });
    it("球とスロープが斜面で接する場合に true を返す", () => {
        const left = new Sphere(new Vector3(-1, 0, 2), Math.sqrt(5) - delta);
        const right = new Slope(new Vector3(0, 0, 0), 2, 2);
        const impl = new Sphere2Slope(left, right);
        expect(impl.intersectsFull()).toBe(false);
    });
    it("球がスロープの右側で重なっている場合に true を返す", () => {
        const left = new Sphere(new Vector3(2, 0, 0), 1 + delta);
        const right = new Slope(new Vector3(0, 0, 0), 2, 1);
        const impl = new Sphere2Slope(left, right);
        expect(impl.intersectsFull()).toBe(true);
    });
    it("球がスロープの右側で接する場合に true を返す", () => {
        const left = new Sphere(new Vector3(2, 0, 0), 1);
        const right = new Slope(new Vector3(0, 0, 0), 2, 1);
        const impl = new Sphere2Slope(left, right);
        expect(impl.intersectsFull()).toBe(false);
    });
    it("球がスロープの下側で重なっている場合に true を返す", () => {
        const left = new Sphere(new Vector3(0, 0, -3 / 2), 1 + delta);
        const right = new Slope(new Vector3(0, 0, 0), 2, 1);
        const impl = new Sphere2Slope(left, right);
        expect(impl.intersectsFull()).toBe(true);
    });
    it("球がスロープの下側で接する場合に true を返す", () => {
        const left = new Sphere(new Vector3(0, 0, -3 / 2), 1);
        const right = new Slope(new Vector3(0, 0, 0), 2, 1);
        const impl = new Sphere2Slope(left, right);
        expect(impl.intersectsFull()).toBe(false);
    });
});

describe("Sphere2Slope.spaceBottom", () => {
    it("球が長方形の上側から衝突する", () => {
        const sphere = new Sphere(new Vector3(0, 0, 2), 1);
        const slope = new Slope(new Vector3(0, 0, 0.5), 2, 1);
        expect(new Sphere2Slope(sphere, slope).spaceBottom(new Vector3(0, 0, -1))).toBe(1);
    });
    it("球が長方形の下側から衝突する", () => {
        const sphere = new Sphere(new Vector3(0, 0, -2), 1);
        const slope = new Slope(new Vector3(0, 0, 0.5), 2, 1);
        expect(new Sphere2Slope(sphere, slope).spaceBottom(new Vector3(0, 0, 1))).toBe(1);
    });

    it("球が長方形とギリギリですれ違う", () => {
        const sphere = new Sphere(new Vector3(-3, 0, 1), 1);
        const slope = new Slope(new Vector3(0, 0, 0.5), 2, 1);
        expect(new Sphere2Slope(sphere, slope).spaceBottom(new Vector3(1, 0, 0))).toBe(Infinity);
    });
    it("球が長方形とギリギリ衝突する", () => {
        const sphere = new Sphere(new Vector3(-3, 0, 1 - delta), 1);
        const slope = new Slope(new Vector3(0, 0, 0.5), 2, 1);
        expect(new Sphere2Slope(sphere, slope).spaceBottom(new Vector3(1, 0, 0))).toBeCloseTo(2 - Math.sqrt(2 * delta));
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