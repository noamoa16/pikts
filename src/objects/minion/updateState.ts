import { Vector3 } from "#vendor/babylon";
import type { Minion } from "./minion";
import { MinionState } from "./state";
import { calcMinionFollowMoveVector } from "./movement";

export type MinionStateUpdateActions = {
    moveFor(direction: Vector3): void;
    avoidDuplication(deltaSeconds: number): void;
    updateHeldPosition(): void;
    isThrownLanded(): boolean;
    finishThrow(): void;
    setCollisionsEnabled(enabled: boolean): void;
};

export function updateMinionState(
    minion: Minion,
    deltaSeconds: number,
    actions: MinionStateUpdateActions,
): void {
    switch (minion.state) {
        case MinionState.following:
            updateFollowing(minion, deltaSeconds, actions);
            return;
        case MinionState.held:
            updateHeld(minion, actions);
            return;
        case MinionState.thrown:
            updateThrown(actions);
            return;
        case MinionState.free:
            updateFree(deltaSeconds, actions);
            return;
        default:
            actions.setCollisionsEnabled(true);
    }
}

function updateFollowing(
    minion: Minion,
    deltaSeconds: number,
    actions: MinionStateUpdateActions,
): void {
    if (!minion.follower) {
        actions.setCollisionsEnabled(true);
        return;
    }

    const moveVector = calcMinionFollowMoveVector(
        minion.groundingPosition,
        minion.follower.groundingPosition,
        minion.speed,
        deltaSeconds,
    );
    actions.moveFor(moveVector);
    if (moveVector.lengthSquared() === 0) {
        actions.avoidDuplication(deltaSeconds);
    }
    actions.setCollisionsEnabled(true);
}

function updateHeld(
    minion: Minion,
    actions: MinionStateUpdateActions,
): void {
    if (minion.follower) {
        actions.updateHeldPosition();
        actions.setCollisionsEnabled(false);
        return;
    }
    actions.setCollisionsEnabled(true);
}

function updateThrown(actions: MinionStateUpdateActions): void {
    if (actions.isThrownLanded()) {
        actions.finishThrow();
    }
    actions.setCollisionsEnabled(true);
}

function updateFree(
    deltaSeconds: number,
    actions: MinionStateUpdateActions,
): void {
    actions.avoidDuplication(deltaSeconds);
    actions.setCollisionsEnabled(true);
}
