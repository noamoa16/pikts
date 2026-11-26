import { Vector3 } from "#vendor/babylon";
import { toVector2 } from "../../core/math";
import { Minion } from "./minion";
import { MinionState } from "./state";
import {
    calcCarriableApproachMoveVector,
    calcEnemyAvoidanceMoveVector,
    calcEnemyApproachMoveVector,
    calcMinionHoldFormationMoveVector,
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

    const moveVector = minion.follower.hasHoldingMinion
        ? calcMinionHoldFormationMoveVector(
            minion.groundingPosition,
            minion.follower.groundingPosition,
            minion.follower.rotation.z,
            minion.minionColor,
            minion.follower.heldMinionColor ?? minion.minionColor,
            minion.speed,
            deltaSeconds,
        )
        : calcMinionFollowMoveVector(
            minion.groundingPosition,
            minion.follower.groundingPosition,
            minion.speed,
            deltaSeconds,
        );
    const nearbyEnemies = actions.getNearbyEnemies(Minion.FOLLOW_ENEMY_AVOIDANCE_DISTANCE);
    const avoidanceVector = calcEnemyAvoidanceMoveVector(
        minion,
        nearbyEnemies,
        minion.speed,
        deltaSeconds,
    );
    const combinedMove = moveVector.add(avoidanceVector);
    const maxMoveDistance = minion.speed * deltaSeconds;
    if (combinedMove.length() > maxMoveDistance && maxMoveDistance > 0) {
        combinedMove.normalize().scaleInPlace(maxMoveDistance);
    }
    const overlappingEnemies = nearbyEnemies.filter(enemy =>
        minion.distanceToSurface(enemy) <= 0,
    );
    actions.moveFor(combinedMove, overlappingEnemies);
    if (combinedMove.lengthSquared() === 0) {
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
    const disbandTarget = minion.getDisbandTarget();
    const disbandMoveTime = minion.takeDisbandMoveTime(deltaSeconds);
    // 近くの運搬物と敵を探す
    const nearbyCarriables = actions.getNearbyCarriables(Minion.FREE_SEARCH_DISTANCE);
    const nearbyEnemies = actions.getNearbyEnemies(Minion.FREE_SEARCH_DISTANCE);
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

    // 十分に距離の近い敵または運搬物に対しては行動開始
    if (
        enemyInRange
        && enemyInRange.distance < (carriableInRange?.distance ?? Infinity)
        && actions.tryBecomeAttacking(enemyInRange.target)
    ) {
        minion.clearDisbandMovement();
        actions.stopSelfMovement();
        actions.setCollisionsEnabled(true);
        return;
    }
    if (carriableInRange && actions.tryBecomeCarrying(carriableInRange.target)) {
        minion.clearDisbandMovement();
        actions.stopSelfMovement();
        actions.setCollisionsEnabled(true);
        return;
    }

    if (disbandTarget && disbandMoveTime > 0) {
        actions.stopSelfMovement();
        actions.moveFor(calcCarriableApproachMoveVector(
            minion.position,
            disbandTarget,
            minion.speed,
            disbandMoveTime,
            0,
        ));
        actions.setCollisionsEnabled(true);
        return;
    }

    const carriableTarget = carriableDistances[0];
    const enemyTarget = enemyDistances[0];
    if (enemyTarget && (!carriableTarget || enemyTarget.distance < carriableTarget.distance)) {
        // 敵に近づく
        actions.stopSelfMovement();
        actions.moveFor(calcEnemyApproachMoveVector(
            minion.position,
            enemyTarget.target.position,
            minion.speed,
            deltaSeconds,
            enemyTarget.target.size / 2
                + minion.size / 2
                + Minion.FREE_PICKUP_DISTANCE / 2,
        ));
        actions.setCollisionsEnabled(true);
        return;
    }
    if (carriableTarget) {
        // 運搬物に近づく
        actions.stopSelfMovement();
        actions.moveFor(calcCarriableApproachMoveVector(
            minion.position,
            carriableTarget.target.position,
            minion.speed,
            deltaSeconds,
            carriableTarget.target.size / 2
                + minion.size / 2
                + Minion.FREE_PICKUP_DISTANCE / 2,
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
        if (distance > carriable.radius + Minion.FREE_SEARCH_DISTANCE) {
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
