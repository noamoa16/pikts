import { Vector3 } from "#vendor/babylon";
import { toVector2 } from "../../core/math";
import { Minion } from "./minion";
import { MinionState } from "./state";
import {
    calcCarriableApproachMoveVector,
    calcEnemyApproachMoveVector,
    calcMinionFollowMoveVector,
} from "./movement";
import type { Carriable } from "../carriable/carriable";
import type { Enemy } from "../enemy/enemy";
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
    getNearbyEnemies(maxDistance: number): Enemy[];
    tryBecomeCarrying(carriable: Carriable): boolean;
    tryBecomeAttacking(enemy: Enemy): boolean;
    damageAttackTarget(): void;
    stopAttacking(): void;
    stopCarrying(): void;
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
        case MinionState.attack:
            updateAttack(minion, deltaSeconds, actions);
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

/**
 * フリー状態のとき
 */
function updateFree(
    minion: Minion,
    deltaSeconds: number,
    actions: MinionStateUpdateActions,
): void {
    // 距離 FREE_SEARCH_DISTANCE 以下の運搬物を探す
    const nearbyCarriables = actions.getNearbyCarriables(Minion.FREE_SEARCH_DISTANCE);
    const nearbyEnemies = actions.getNearbyEnemies(Minion.FREE_SEARCH_DISTANCE);

    // Candidates are already ordered by distance; compute each surface distance once.
    const carriableDistances = nearbyCarriables.map(carriable => ({
        target: carriable,
        distance: minion.distanceToSurface(carriable),
    }));
    const enemyDistances = nearbyEnemies.map(enemy => ({
        target: enemy,
        distance: minion.distanceToSurface(enemy),
    }));
    const carriableInRange = carriableDistances.find(candidate =>
        candidate.distance <= Minion.FREE_PICKUP_DISTANCE,
    );
    const enemyInRange = enemyDistances.find(candidate =>
        candidate.distance <= Minion.FREE_PICKUP_DISTANCE,
    );

    if (
        enemyInRange
        && enemyInRange.distance < (carriableInRange?.distance ?? Infinity)
        && actions.tryBecomeAttacking(enemyInRange.target)
    ) {
        actions.stopSelfMovement();
        actions.setCollisionsEnabled(true);
        return;
    }

    // 距離 FREE_PICKUP_DISTANCE 以下なら運搬開始可能
    if (carriableInRange && actions.tryBecomeCarrying(carriableInRange.target)) {
        actions.stopSelfMovement();
        actions.setCollisionsEnabled(true);
        return;
    }

    const target = carriableDistances[0];
    const enemyTarget = enemyDistances[0];
    if (enemyTarget && (!target || enemyTarget.distance < target.distance)) {
        actions.stopSelfMovement();
        actions.moveFor(calcEnemyApproachMoveVector(
            minion.position,
            enemyTarget.target.position,
            minion.speed,
            deltaSeconds,
            enemyTarget.target.size / 2
                + minion.size / 2
                + Minion.FREE_PICKUP_DISTANCE,
        ));
        actions.setCollisionsEnabled(true);
        return;
    }
    if (target) {
        actions.stopSelfMovement();
        actions.moveFor(calcCarriableApproachMoveVector(
            minion.position,
            target.target.position,
            minion.speed,
            deltaSeconds,
            target.target.size / 2
                + minion.size / 2
                + Minion.FREE_PICKUP_DISTANCE,
        ));
    }
    else {
        actions.stopSelfMovement();
        actions.separateFromOverlappingEntities(deltaSeconds);
    }
    actions.setCollisionsEnabled(true);
}

function updateAttack(
    minion: Minion,
    deltaSeconds: number,
    actions: MinionStateUpdateActions,
): void {
    actions.stopMovement();
    const enemy = minion.attackTarget;
    if (!enemy || !enemy.isAlive) {
        actions.stopAttacking();
        actions.setCollisionsEnabled(true);
        return;
    }

    const stoppingDistance = enemy.size / 2 + minion.size / 2 + 1 / 32;
    const angle = (minion.id * 2.399963229728653) % (Math.PI * 2);
    const targetPosition = new Vector3(
        enemy.position.x + Math.cos(angle) * stoppingDistance,
        enemy.position.y + Math.sin(angle) * stoppingDistance,
        enemy.position.z,
    );
    const move = calcEnemyApproachMoveVector(
        minion.position,
        targetPosition,
        minion.speed,
        deltaSeconds,
        0,
    );
    actions.moveFor(move, [enemy]);
    minion.updateAttack(deltaSeconds, actions.damageAttackTarget);
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
        const distance = toVector2(minion.position.subtract(carriable.position)).length();
        if (distance > carriable.radius + 0.5) {
            actions.stopCarrying();
            actions.setCollisionsEnabled(true);
            return;
        }

        const stoppingDistance = carriable.radius + minion.size / 2 + 1 / 32;
        const targetPosition = carriable.getCarrierFormationPosition(minion, stoppingDistance);
        if (targetPosition) {
            const move = calcCarriableApproachMoveVector(
                minion.position,
                targetPosition,
                minion.speed,
                deltaSeconds,
                0,
            );
            const heightDifference = targetPosition.z - minion.position.z;
            move.z = Math.sign(heightDifference) * Math.min(
                minion.speed * deltaSeconds,
                Math.abs(heightDifference),
            );
            actions.moveFor(move, [carriable]);
        }
    }
    actions.setCollisionsEnabled(true);
}
