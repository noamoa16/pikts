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
    // 距離1.25以下の運搬物を探す
    const nearby = actions.getNearbyCarriables(1.25);

    // 距離0.5以下なら運搬開始可能
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
        const carriable = minion.carried;
        const stoppingDistance = carriable.radius + minion.size / 2 + 1 / 32;
        const targetPosition = carriable.getCarrierFormationPosition(minion, stoppingDistance);
        if (targetPosition) {
            actions.moveFor(calcCarriableApproachMoveVector(
                minion.position,
                targetPosition,
                minion.speed,
                deltaSeconds,
                0,
            ), [carriable]);
        }
    }
    actions.setCollisionsEnabled(true);
}
