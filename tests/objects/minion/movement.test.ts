import { describe, expect, it } from "vitest";
import { Vector3 } from "../../../src/vendor/babylon";
import { calcMinionFollowMoveVector } from "../../../src/objects/minion/movement";

describe("calcMinionFollowMoveVector", () => {
    it("最大距離より遠い場合は近づく", () => {
        const move = calcMinionFollowMoveVector(
            new Vector3(0, 0, 10), new Vector3(3, 4, -10), 2, 0.5,
        );
        expect(move.x).toBeCloseTo(0.6);
        expect(move.y).toBeCloseTo(0.8);
        expect(move.z).toBe(0);
        expect(move.length()).toBeCloseTo(1);
    });

    it("移動範囲内ではゼロベクトルを返す", () => {
        for (const distance of [0.5, 0.75, 1]) {
            const move = calcMinionFollowMoveVector(
                Vector3.Zero(), new Vector3(distance, 0, 0), 3, 1,
            );
            expect(move.lengthSquared()).toBe(0);
        }
    });

    it("最小距離より近い場合は離れる", () => {
        const move = calcMinionFollowMoveVector(
            Vector3.Zero(), new Vector3(0.25, 0, 0), 1, 1,
        );
        expect(move.x).toBeCloseTo(-0.25);
        expect(move.y).toBe(0);
        expect(move.z).toBe(0);
    });

    it("同じ位置にいる場合はゼロベクトルを返す", () => {
        const move = calcMinionFollowMoveVector(
            new Vector3(2, 3, 4), new Vector3(2, 3, -4), 3, 1,
        );
        expect(move.lengthSquared()).toBe(0);
    });

    it("目標距離を越えないように移動量を制限する", () => {
        const move = calcMinionFollowMoveVector(
            Vector3.Zero(), new Vector3(1.1, 0, 0), 100, 1,
        );
        expect(move.x).toBeCloseTo(0.1);
        expect(move.y).toBe(0);
        expect(move.z).toBe(0);
    });
});
