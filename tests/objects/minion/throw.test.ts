import { describe, expect, it } from "vitest";
import { Vector2, Vector3 } from "../../../src/vendor/babylon";
import {
    calcHeldPosition,
    calcThrownInitialPosition,
    calcThrownInitialVelocity,
} from "../../../src/objects/minion/throw";

describe("Minion の掴み・投擲計算", () => {
    it("プレイヤーの向きに応じた掴み位置を計算する", () => {
        const position = calcHeldPosition(new Vector3(1, 2, 3), 0);
        expect(position.x).toBeCloseTo(1.25);
        expect(position.y).toBeCloseTo(2);
        expect(position.z).toBeCloseTo(3.125);
        const rotated = calcHeldPosition(Vector3.Zero(), Math.PI / 2);
        expect(rotated.x).toBeCloseTo(0);
        expect(rotated.y).toBeCloseTo(0.25);
        expect(rotated.z).toBeCloseTo(0.125);
    });

    it("プレイヤーの向きに応じた投擲初期位置を計算する", () => {
        const position = calcThrownInitialPosition(new Vector3(1, 2, 3), 0);
        expect(position.x).toBeCloseTo(1.25);
        expect(position.y).toBeCloseTo(2);
        expect(position.z).toBeCloseTo(3.5);
    });

    it("カーソル方向に沿った投擲初速を計算する", () => {
        const gravity = 10;
        const maxHeight = 2.25;
        const verticalVelocity = Math.sqrt(2 * gravity * (maxHeight - 1 / 8));
        const horizontalVelocity = gravity * (1 - 1 / 4)
            / (verticalVelocity + Math.sqrt(2 * gravity * maxHeight));
        const velocity = calcThrownInitialVelocity(
            new Vector2(1, 0), Vector3.Zero(), 3, -gravity, maxHeight,
        );
        expect(velocity.x).toBeCloseTo(horizontalVelocity);
        expect(velocity.y).toBeCloseTo(0);
        expect(velocity.z).toBeCloseTo(verticalVelocity);
    });

    it("プレイヤーの移動速度に応じて投擲距離を伸ばす", () => {
        const cursor = new Vector2(1, 0);
        const base = calcThrownInitialVelocity(cursor, Vector3.Zero(), 3, -10, 2.25);
        const running = calcThrownInitialVelocity(cursor, new Vector3(3, 0, 0), 3, -10, 2.25);
        expect(running.x).toBeGreaterThan(base.x);
        expect(running.z).toBeCloseTo(base.z);
    });

    it("deltaAngle で投擲方向を回転する", () => {
        const angle = Math.PI / 4;
        const velocity = calcThrownInitialVelocity(
            new Vector2(1, 0), Vector3.Zero(), 3, -10, 2.25, angle,
        );
        expect(velocity.y / velocity.x).toBeCloseTo(Math.tan(angle));
    });
});
