import { describe, expect, it } from "vitest";
import { Vector3 } from "../../src/vendor/babylon";
import { Cylinder, Dir4, Slope } from "../../src/physics/figure";
import { Cylinder2Slope } from "../../src/physics/figureImpl/cylinder2Slope";

const delta = Math.pow(2, -40); // float64 の誤差で消えない程度の差分

describe("Cylinder2Slope.intersectsFull", () => {
    it("円柱とスロープがy方向で重なっている場合に true を返す", () => {
        const left = new Cylinder(new Vector3(0, 0, 0), 2, 4);
        const right = new Slope(new Vector3(0, 3 - delta, 0), 2, 4, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.intersectsFull()).toBe(true);
    });
    it("円柱とスロープがy方向で接する場合に false を返す", () => {
        const left = new Cylinder(new Vector3(0, 0, 0), 2, 4);
        const right = new Slope(new Vector3(0, 3, 0), 2, 4, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.intersectsFull()).toBe(false);
    });
    it("円柱とスロープが斜面で重なっている場合に true を返す", () => {
        const left = new Cylinder(new Vector3(0, 0, 3 / 2 - delta), 1, 2);
        const right = new Slope(new Vector3(0, 0, 0), 2, 4, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.intersectsFull()).toBe(true);
    });
    it("円柱とスロープが斜面で接する場合に false を返す", () => {
        const left = new Cylinder(new Vector3(0, 0, 3 / 2), 1, 2);
        const right = new Slope(new Vector3(0, 0, 0), 2, 4, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.intersectsFull()).toBe(false);
    });
    it("円柱がスロープの右側で重なっている場合に true を返す", () => {
        const left = new Cylinder(new Vector3(2, 0, 0), 1 + delta, 4);
        const right = new Slope(new Vector3(0, 0, 0), 2, 2, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.intersectsFull()).toBe(true);
    });
    it("円柱がスロープの右側で接する場合に false を返す", () => {
        const left = new Cylinder(new Vector3(2, 0, 0), 1, 4);
        const right = new Slope(new Vector3(0, 0, 0), 2, 2, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.intersectsFull()).toBe(false);
    });
    it("円柱がスロープの下側で重なっている場合に true を返す", () => {
        const left = new Cylinder(new Vector3(0, 0, -3 / 2), 1, 2 + delta);
        const right = new Slope(new Vector3(0, 0, 0), 2, 2, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.intersectsFull()).toBe(true);
    });
    it("円柱がスロープの下側で接する場合に false を返す", () => {
        const left = new Cylinder(new Vector3(0, 0, -3 / 2), 1, 2);
        const right = new Slope(new Vector3(0, 0, 0), 2, 2, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.intersectsFull()).toBe(false);
    });
    it("スロープの回転が適用される", () => {
        const left = new Cylinder(new Vector3(10, 0, 2), 1 + delta, 4);
        const right = new Slope(new Vector3(11, 0, 0), 2, 4, 1 / 2, Dir4.Right);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.intersectsFull()).toBe(true);
        for(const d of [Dir4.Front, Dir4.Left, Dir4.Back]){
            const right = new Slope(new Vector3(3, 0, 0), 2, 4, 1 / 2, d);
            const impl = new Cylinder2Slope(left, right);
            expect(impl.intersectsFull()).toBe(false);
        }
    });
});

describe("Cylinder2Slope.spaceFull", () => {
    it("円柱がスロープのy-方向から衝突する", () => {
        const left = new Cylinder(new Vector3(0, 0, 0), 2, 4);
        const right = new Slope(new Vector3(0, 4, 0), 2, 4, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.spaceFull(new Vector3(0, 1, 0))).toBe(1);
    });
    it("円柱がスロープのy+方向から衝突する", () => {
        const left = new Cylinder(new Vector3(0, 0, 0), 2, 4);
        const right = new Slope(new Vector3(0, -4, 0), 2, 4, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.spaceFull(new Vector3(0, -1, 0))).toBe(1);
    });
    it("円柱がスロープの斜面に衝突する", () => {
        const left = new Cylinder(new Vector3(-2, 0, 1), 1, 2);
        const right = new Slope(new Vector3(0, 0, 0), 2, 4, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.spaceFull(new Vector3(1, 0, 0))).toBe(1);
        expect(impl.spaceFull(new Vector3(0, 0, -1))).toBe(1 / 2);
    });
    
    it("円柱がスロープの右側から衝突する", () => {
        const left = new Cylinder(new Vector3(3, 0, 0), 1, 2);
        const right = new Slope(new Vector3(0, 0, 0), 2, 2, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.spaceFull(new Vector3(-1, 0, 0))).toBe(1);
    });
    it("円柱がスロープの下側から衝突する", () => {
        const left = new Cylinder(new Vector3(0, 0, -5 / 2), 1, 2);
        const right = new Slope(new Vector3(0, 0, 0), 2, 2, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.spaceFull(new Vector3(0, 0, 1))).toBe(1);
    });

    it("回転したスロープの側面に向かう移動方向をローカル座標で判定する", () => {
        const cylinder = new Cylinder(new Vector3(-3, 0, -3 / 2), 1 / 2, 2);
        const slope = new Slope(new Vector3(0, 0, 0), 2, 4, 1 / 2, Dir4.Front);
        const impl = new Cylinder2Slope(cylinder, slope);
        expect(impl.spaceFull(new Vector3(1, 0, 0))).toBeCloseTo(3 / 2);
    });
    it("円柱がスロープのy-方向側面スレスレで落下する", () => {
        const left = new Cylinder(new Vector3(0, -3, 0), 2, 4);
        const right = new Slope(new Vector3(0, 0, 0), 2, 4, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.spaceFull(new Vector3(0, 0, -1))).toBe(Infinity);
    });
    it("円柱がスロープのy-方向側面スレスレで触れる", () => {
        const left = new Cylinder(new Vector3(0, -3 + delta, 0), 2, 4);
        const right = new Slope(new Vector3(0, 0, 0), 2, 4, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.spaceFull(new Vector3(0, 0, -1))).toBe(0);
    });
    it("円柱がスロープのy+方向側面スレスレで落下する", () => {
        const left = new Cylinder(new Vector3(0, 3, 0), 2, 4);
        const right = new Slope(new Vector3(0, 0, 0), 2, 4, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.spaceFull(new Vector3(0, 0, -1))).toBe(Infinity);
    });
    it("円柱がスロープのy+方向側面スレスレで触れる", () => {
        const left = new Cylinder(new Vector3(0, 3 - delta, 0), 2, 4);
        const right = new Slope(new Vector3(0, 0, 0), 2, 4, 1 / 2);
        const impl = new Cylinder2Slope(left, right);
        expect(impl.spaceFull(new Vector3(0, 0, -1))).toBe(0);
    });
});

describe("Cylinder2Slope.resolveOverlapUpDistance", () => {
    it("スロープの下側", () => {
        const cylinder = new Cylinder(new Vector3(0, 0, 0), 1, 2);
        const slope = new Slope(new Vector3(1, 0, 0.5), 2, 2, 1 / 2);
        expect(new Cylinder2Slope(cylinder, slope).resolveOverlapUpDistance()).toBe(3 / 2);
    });
    it("スロープの中間", () => {
        const cylinder = new Cylinder(new Vector3(0, 1.5, 0), 1, 2);
        const slope = new Slope(new Vector3(0, 0, 0), 2, 2, 1 / 2);
        expect(new Cylinder2Slope(cylinder, slope).resolveOverlapUpDistance()).toBeCloseTo(1 + Math.sqrt(3) / 4);
    });
    it("スロープの上側", () => {
        const cylinder = new Cylinder(new Vector3(0, 0, 0), 1, 2);
        const slope = new Slope(new Vector3(-1, 0, -0.5), 2, 2, 1 / 2);
        expect(new Cylinder2Slope(cylinder, slope).resolveOverlapUpDistance()).toBe(1);
    });
});