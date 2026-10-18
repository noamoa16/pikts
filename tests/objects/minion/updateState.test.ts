import { describe, expect, it, vi } from "vitest";
import { Vector3 } from "../../../src/vendor/babylon";
import type { Minion } from "../../../src/objects/minion/minion";
import { MinionState } from "../../../src/objects/minion/state";
import { updateMinionState, type MinionStateUpdateActions } from "../../../src/objects/minion/updateState";

function makeActions(): MinionStateUpdateActions {
    return {
        moveFor: vi.fn(),
        avoidDuplication: vi.fn(),
        updateHeldPosition: vi.fn(),
        isThrownLanded: vi.fn(() => false),
        finishThrow: vi.fn(),
        setCollisionsEnabled: vi.fn(),
    };
}

function makeMinion(overrides: Partial<Minion> = {}): Minion {
    return {
        state: MinionState.free,
        follower: null,
        groundingPosition: new Vector3(0, 0, 0),
        speed: 3,
        ...overrides,
    } as Minion;
}

describe("updateMinionState", () => {
    it("追従対象がいない場合は移動せず、衝突判定を有効にする", () => {
        const minion = makeMinion({ state: MinionState.following });
        const actions = makeActions();
        updateMinionState(minion, 1 / 60, actions);
        expect(actions.moveFor).not.toHaveBeenCalled();
        expect(actions.avoidDuplication).not.toHaveBeenCalled();
        expect(actions.setCollisionsEnabled).toHaveBeenCalledWith(true);
        expect(actions.setCollisionsEnabled).toHaveBeenCalledTimes(1);
    });

    it("追従対象から遠い場合は計算した方向へ移動する", () => {
        const minion = makeMinion({
            state: MinionState.following,
            groundingPosition: new Vector3(0, 0, 0),
            follower: { groundingPosition: new Vector3(2, 0, 0) } as unknown as NonNullable<Minion["follower"]>,
        });
        const actions = makeActions();
        updateMinionState(minion, 0.1, actions);
        expect(actions.moveFor).toHaveBeenCalledTimes(1);
        const move = vi.mocked(actions.moveFor).mock.calls[0][0];
        expect(move.x).toBeCloseTo(0.3);
        expect(move.y).toBe(0);
        expect(move.z).toBe(0);
        expect(actions.avoidDuplication).not.toHaveBeenCalled();
        expect(actions.setCollisionsEnabled).toHaveBeenCalledWith(true);
    });

    it("追従時に移動ベクトルがゼロなら重複回避を行う", () => {
        const minion = makeMinion({
            state: MinionState.following,
            groundingPosition: new Vector3(0, 0, 0),
            follower: { groundingPosition: new Vector3(0.75, 0, 0) } as unknown as NonNullable<Minion["follower"]>,
        });
        const actions = makeActions();
        updateMinionState(minion, 0.1, actions);
        expect(actions.moveFor).toHaveBeenCalledTimes(1);
        expect(vi.mocked(actions.moveFor).mock.calls[0][0].lengthSquared()).toBe(0);
        expect(actions.avoidDuplication).toHaveBeenCalledWith(0.1);
    });

    it("掴まれていて追従対象がいる場合は位置を更新し、衝突判定を無効にする", () => {
        const minion = makeMinion({ state: MinionState.held, follower: {} as unknown as NonNullable<Minion["follower"]> });
        const actions = makeActions();
        updateMinionState(minion, 0.1, actions);
        expect(actions.updateHeldPosition).toHaveBeenCalledTimes(1);
        expect(actions.setCollisionsEnabled).toHaveBeenCalledWith(false);
    });

    it("掴まれていて追従対象がいない場合は衝突判定を有効にする", () => {
        const minion = makeMinion({ state: MinionState.held });
        const actions = makeActions();
        updateMinionState(minion, 0.1, actions);
        expect(actions.updateHeldPosition).not.toHaveBeenCalled();
        expect(actions.setCollisionsEnabled).toHaveBeenCalledWith(true);
    });

    it("投擲中に着地した場合は投擲を終了する", () => {
        const minion = makeMinion({ state: MinionState.thrown });
        const actions = makeActions();
        vi.mocked(actions.isThrownLanded).mockReturnValue(true);
        updateMinionState(minion, 0.1, actions);
        expect(actions.finishThrow).toHaveBeenCalledTimes(1);
        expect(actions.setCollisionsEnabled).toHaveBeenCalledWith(true);
    });

    it("投擲中で未着地なら投擲を終了しない", () => {
        const minion = makeMinion({ state: MinionState.thrown });
        const actions = makeActions();
        updateMinionState(minion, 0.1, actions);
        expect(actions.finishThrow).not.toHaveBeenCalled();
        expect(actions.setCollisionsEnabled).toHaveBeenCalledWith(true);
    });

    it("自由状態では重複回避を行い、衝突判定を有効にする", () => {
        const minion = makeMinion({ state: MinionState.free });
        const actions = makeActions();
        updateMinionState(minion, 0.1, actions);
        expect(actions.avoidDuplication).toHaveBeenCalledWith(0.1);
        expect(actions.setCollisionsEnabled).toHaveBeenCalledWith(true);
    });
});

