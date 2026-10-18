import { describe, expect, it } from "vitest";
import { Vector2, Vector3 } from "../../src/vendor/babylon";
import {
    atan,
    clamp,
    clearLow16Bits,
    hashInt32,
    normalizeAngle,
    rotate2D,
    toVector2,
    toVector3,
} from "../../src/core/math";

describe("core/math", () => {
    it("hashInt32 は同じ32bit整数に同じハッシュを返す", () => {
        expect(hashInt32(123)).toBe(hashInt32(123));
        expect(hashInt32(123)).toBe(hashInt32(123 + 2 ** 32));
        expect(hashInt32(-1)).toBeGreaterThanOrEqual(0);
        expect(hashInt32(-1)).toBeLessThanOrEqual(0xffffffff);
    });

    it("clamp は値を指定範囲内に収める", () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-1, 0, 10)).toBe(0);
        expect(clamp(11, 0, 10)).toBe(10);
    });

    it("clearLow16Bits は下位16bitをクリアする", () => {
        expect(clearLow16Bits(1.0000000000000002)).toBe(1);
        expect(clearLow16Bits(-1.0000000000000002)).toBe(-1);
    });

    it("normalizeAngle は角度を [-π, π) に正規化する", () => {
        expect(normalizeAngle(Math.PI)).toBe(-Math.PI);
        expect(normalizeAngle(-Math.PI)).toBe(-Math.PI);
        expect(normalizeAngle(3 * Math.PI)).toBe(-Math.PI);
        expect(normalizeAngle(5 * Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    });

    it("includePi を指定すると境界の -π を π にする", () => {
        expect(normalizeAngle(Math.PI, { includePi: true })).toBe(Math.PI);
        expect(normalizeAngle(-Math.PI, { includePi: true })).toBe(Math.PI);
    });

    it("atan はベクトルの偏角を返す", () => {
        expect(atan(new Vector2(0, 1))).toBeCloseTo(Math.PI / 2);
        expect(atan(new Vector2(-1, 0))).toBeCloseTo(Math.PI);
    });

    it("rotate2D は数値引数と Vector2 引数の両方を回転する", () => {
        const byComponents = rotate2D(1, 0, Math.PI / 2);
        const byVector = rotate2D(new Vector2(1, 0), Math.PI / 2);
        expect(byComponents.x).toBeCloseTo(0);
        expect(byComponents.y).toBeCloseTo(1);
        expect(byVector.x).toBeCloseTo(0);
        expect(byVector.y).toBeCloseTo(1);
    });

    it("rotate2D はゼロ角と π の特殊値を正規化する", () => {
        const unchanged = rotate2D(-2, 3, 0);
        const reversed = rotate2D(-2, 3, Math.PI);
        expect(unchanged.x).toBe(-2);
        expect(unchanged.y).toBe(3);
        expect(reversed.x).toBe(2);
        expect(reversed.y).toBe(-3);
        expect(Object.is(reversed.x, -0)).toBe(false);
        expect(Object.is(reversed.y, -0)).toBe(false);
    });

    it("Vector2 と Vector3 を相互変換し、z の既定値を0にする", () => {
        const vector3 = toVector3(new Vector2(1, 2));
        const vector2 = toVector2(new Vector3(3, 4, 5));
        expect(vector3.x).toBe(1);
        expect(vector3.y).toBe(2);
        expect(vector3.z).toBe(0);
        expect(vector2.x).toBe(3);
        expect(vector2.y).toBe(4);
    });
});
