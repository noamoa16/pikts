import { Vector2, Vector3 } from "#vendor/babylon";
import { atan, toVector2 } from "../../core/math";
import { Sphere } from "../../physics/figure";
import type { Entity } from "../entity";
import { Player } from "../player/player";

const HELD_DIFF_HORIZONTAL = 1 / 4;
const HELD_DIFF_VERTICAL = 1 / 8;
const THROWN_DIFF_HORIZONTAL = 1 / 4;
const THROWN_DIFF_VERTICAL = 1 / 2;

/**
 * プレイヤーの位置と向きから、Minionが掴まれているときの位置を計算
 */
export function calcHeldPosition(playerPosition: Vector3, playerRotation: number): Vector3 {
    return playerPosition.add(new Vector3(
        HELD_DIFF_HORIZONTAL * Math.cos(playerRotation),
        HELD_DIFF_HORIZONTAL * Math.sin(playerRotation),
        HELD_DIFF_VERTICAL,
    ));
}

/**
 * プレイヤーの位置と向きから、Minionが投げられるときの初期位置を計算
 */
export function calcThrownInitialPosition(playerPosition: Vector3, playerRotation: number): Vector3 {
    return playerPosition.add(new Vector3(
        THROWN_DIFF_HORIZONTAL * Math.cos(playerRotation),
        THROWN_DIFF_HORIZONTAL * Math.sin(playerRotation),
        THROWN_DIFF_VERTICAL,
    ));
}

/** 指定位置に Minion が衝突せず出現できるかを判定する */
export function canMinionSpawnAt(
    position: Vector3,
    minionId: number,
    minionSize: number,
    entities: readonly Entity[],
): boolean {
    const candidate = new Sphere(position, minionSize / 2);
    return entities.every(entity => {
        if (entity.id === minionId) return true;
        if (entity instanceof Player) return true;
        if (!entity.checkCollisions) return true;
        return !candidate.intersects(entity.figure);
    });
}

/** 衝突を避けられる Minion の投擲初期位置を探す */
export function calcThrownSafeInitialPosition(options: {
    playerPosition: Vector3;
    playerRotation: number;
    cursorPosition: Vector2;
    playerSpeed: number;
    gravityZ: number;
    thrownMaxHeight: number;
    minionSize: number;
    cursorDistance: number;
    canSpawnAt(position: Vector3): boolean;
}): Vector3 {
    const {
        playerPosition, playerRotation, cursorPosition, playerSpeed,
        gravityZ, thrownMaxHeight, minionSize, cursorDistance, canSpawnAt,
    } = options;
    const initialVelocity = calcThrownInitialVelocity(
        cursorPosition,
        Vector3.Zero(),
        playerSpeed,
        gravityZ,
        thrownMaxHeight,
    );
    let candidate = calcThrownInitialPosition(playerPosition, playerRotation);
    if (canSpawnAt(candidate)) return candidate;

    const STEP = 1 / 64;
    const MAX_TRAVEL = cursorDistance + minionSize;
    let traveled = 0;
    while (traveled < MAX_TRAVEL && !canSpawnAt(candidate)) {
        candidate = candidate.subtract(initialVelocity.scale(STEP));
        traveled += STEP;
    }
    return candidate;
}

export function calcThrownInitialVelocity(
    cursorPosition: Vector2,
    playerVelocity: Vector3,
    playerSpeed: number,
    gravityZ: number,
    thrownMaxHeight: number,
    deltaAngle: number = 0,
): Vector3 {
    // 重力加速度 g
    // 初期位置 : p0 = (p0.x, p0.y)
    // 初期速度 : v0 = (v0.x, v0.y)
    // 頂点までの対空時間 : t1 = v0.y / g
    // 最大高度 : y_max = p0.y + 1/2 * v0.y ^ 2 / g
    // 頂点から着地までの対空時間 : t2 - t1 = sqrt(2 * y_max / g)
    // 水平移動距離 : x_max = p0.x + v0.x * t2 = p0.x + v0.x * {v0.y / g + sqrt(2 * y_max / g)}

    // v0.y = sqrt{2 * g * (y_max - p0.y)}
    // v0.x = g * (x_max - p0.x) / {v0.y + sqrt(2 * g * y_max)}

    const g = Math.abs(gravityZ);
    const p0 = new Vector2(HELD_DIFF_HORIZONTAL, HELD_DIFF_VERTICAL);
    const xMaxBase = cursorPosition.length();
    const xMaxAccelerated = xMaxBase * 1.25;
    const accelerationRate = toVector2(playerVelocity).length() / playerSpeed;
    const xMax = xMaxBase * (1 - accelerationRate) + xMaxAccelerated * accelerationRate;
    const yMax = thrownMaxHeight;
    const verticalVelocity = Math.sqrt(2 * g * (yMax - p0.y));
    const horizontalVelocity = g * (xMax - p0.x) / (verticalVelocity + Math.sqrt(2 * g * yMax));
    const rot = atan(cursorPosition) + deltaAngle;

    return new Vector3(
        horizontalVelocity * Math.cos(rot),
        horizontalVelocity * Math.sin(rot),
        verticalVelocity,
    );
}
