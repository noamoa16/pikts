import { Vector2, Vector3 } from "#vendor/babylon";
import { hashInt32, toVector2, toVector3 } from "../../core/math";
import { Entity } from "../entity";

/**
 * Minion が Player に対して追従する際の移動ベクトルを計算
 * 距離を `MIN_DISTANCE` (0.5) 〜 `MAX_DISTANCE` (1.0) の範囲に収める方向に移動
 */
export function calcMinionFollowMoveVector(
    minionPosition: Vector3,
    playerPosition: Vector3,
    speed: number,
    deltaSeconds: number,
): Vector3 {
    const MAX_DISTANCE = 1.0;
    const MIN_DISTANCE = 0.5;
    const minionPosition2d = toVector2(minionPosition);
    const targetPosition = toVector2(playerPosition);
    const toTarget = targetPosition.subtract(minionPosition2d);
    const distance = toTarget.length();

    // 距離が遠すぎる場合は近付こうとする
    if (distance > MAX_DISTANCE) {
        return toVector3(toTarget
            .normalize()
            .scale(Math.min(speed * deltaSeconds, distance - MAX_DISTANCE)));
    }
    //距離が近すぎる場合は離れようとする
    if (distance < MIN_DISTANCE) {
        if(distance === 0) return Vector3.Zero();
        return toVector3(minionPosition2d
            .subtract(targetPosition)
            .normalize()
            .scale(Math.min(speed * deltaSeconds, MIN_DISTANCE - distance)));
    }

    return Vector3.Zero();
}

/**
 * 二つのエンティティ間で、衝突を回避するために使用する「分離方向」 (単位ベクトル) を計算
 */
export function calcSeparationDirection(self: Entity, entity: Entity): Vector2 {
    const lowId = Math.min(self.id, entity.id);
    const highId = Math.max(self.id, entity.id);
    const theta = hashInt32(lowId * 65537 + highId) / 0xffffffff * Math.PI * 2;
    const dir = new Vector2(Math.cos(theta), Math.sin(theta));
    return self.id === lowId ? dir : dir.scale(-1);
}
