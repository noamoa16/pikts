import { Vector3 } from "#vendor/babylon";
import { toVector2 } from "../../core/math";
import type { Minion } from "./minion";
import { MinionState } from "./state";
import { calcCarriableApproachMoveVector, calcMinionFollowMoveVector } from "./movement";
import type { Carriable } from "../carriable/carriable";
import type { Entity } from "../entity";

/**
 * Minionの更新時アクションをまとめたクラス
 */
export type MinionStateUpdateActions = {
    moveFor(direction: Vector3, ignoredEntities?: readonly Entity[]): void;
    separateFromOverlappingEntities(deltaSeconds: number): void;
    updateHeldPosition(): void;
    isThrownLanded(): boolean;
    finishThrow(): void;
    setCollisionsEnabled(enabled: boolean): void;
    getNearbyCarriables(maxDistance: number): Carriable[];
    tryBecomeCarrying(carriable: Carriable): boolean;
    stopSelfMovement(): void;
    stopMovement(): void;
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
            updateFree(minion, deltaSeconds, actions);
            return;
        case MinionState.carrying:
            updateCarrying(minion, deltaSeconds, actions);
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
        actions.separateFromOverlappingEntities(deltaSeconds);
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
    minion: Minion,
    deltaSeconds: number,
    actions: MinionStateUpdateActions,
): void {
    const nearby = actions.getNearbyCarriables(1);
    const inPickupRange = nearby.find(carriable =>
        toVector2(minion.position.subtract(carriable.position)).length() <= 0.5,
    );
    if (inPickupRange && actions.tryBecomeCarrying(inPickupRange)) {
        actions.stopSelfMovement();
        actions.setCollisionsEnabled(true);
        return;
    }

    const target = nearby[0];
    if (target) {
        actions.stopSelfMovement();
        actions.moveFor(calcCarriableApproachMoveVector(
            minion.position,
            target.position,
            minion.speed,
            deltaSeconds,
            0.5,
        ));
    }
    else {
        actions.stopSelfMovement();
        actions.separateFromOverlappingEntities(deltaSeconds);
    }
    actions.setCollisionsEnabled(true);
}

function updateCarrying(
    minion: Minion,
    deltaSeconds: number,
    actions: MinionStateUpdateActions,
): void {
    actions.stopMovement();
    if (minion.carried) {
        actions.moveFor(calcCarriableApproachMoveVector(
            minion.position,
            minion.carried.position,
            minion.speed,
            deltaSeconds,
            minion.carried.radius + 1 / 32,
        ));
    }
    actions.setCollisionsEnabled(true);
}
