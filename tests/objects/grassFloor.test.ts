import { describe, expect, it } from "vitest";
import { Vector3 } from "../../src/vendor/babylon";
import { GrassFloor } from "../../src/objects/grassFloor";

describe("GrassFloor", () => {
    it("落下は支えるが、水平移動や上昇はブロックしない", () => {
        const floor = Object.create(GrassFloor.prototype) as GrassFloor;

        expect(floor.blocksMovementInDirection(new Vector3(0, 0, -1))).toBe(true);
        expect(floor.blocksMovementInDirection(new Vector3(-1, 0, 0))).toBe(false);
        expect(floor.blocksMovementInDirection(new Vector3(0, 1, 0))).toBe(false);
        expect(floor.blocksMovementInDirection(new Vector3(0, 0, 1))).toBe(false);
    });
});
