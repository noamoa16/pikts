import { Vector2, Vector3 } from "#vendor/babylon";
import { atan, toVector2 } from "../../core/math";

const HELD_DIFF_HORIZONTAL = 1 / 4;
const HELD_DIFF_VERTICAL = 1 / 8;
const THROWN_DIFF_HORIZONTAL = 1 / 4;
const THROWN_DIFF_VERTICAL = 1 / 2;

export function calcHeldPosition(playerPosition: Vector3, playerRotation: number): Vector3 {
    return playerPosition.add(new Vector3(
        HELD_DIFF_HORIZONTAL * Math.cos(playerRotation),
        HELD_DIFF_HORIZONTAL * Math.sin(playerRotation),
        HELD_DIFF_VERTICAL,
    ));
}

export function calcThrownStartPosition(playerPosition: Vector3, playerRotation: number): Vector3 {
    return playerPosition.add(new Vector3(
        THROWN_DIFF_HORIZONTAL * Math.cos(playerRotation),
        THROWN_DIFF_HORIZONTAL * Math.sin(playerRotation),
        THROWN_DIFF_VERTICAL,
    ));
}

export function calcThrownLaunchDirection(
    cursorPosition: Vector2,
    gravityZ: number,
    thrownMaxHeight: number,
): Vector3 {
    const g = Math.abs(gravityZ);
    const p0 = new Vector2(HELD_DIFF_HORIZONTAL, HELD_DIFF_VERTICAL);
    const xMax = cursorPosition.length();
    const yMax = thrownMaxHeight;
    const verticalVelocity = Math.sqrt(2 * g * (yMax - p0.y));
    const horizontalVelocity =
        g * (xMax - p0.x) / (verticalVelocity + Math.sqrt(2 * g * yMax));
    const rot = atan(cursorPosition);

    return new Vector3(
        horizontalVelocity * Math.cos(rot),
        horizontalVelocity * Math.sin(rot),
        verticalVelocity,
    ).normalize();
}

export function calcThrownVelocity(
    cursorPosition: Vector2,
    playerVelocity: Vector3,
    playerSpeed: number,
    gravityZ: number,
    thrownMaxHeight: number,
    deltaAngle: number,
): Vector3 {
    // 重力加速度 g
    // 初期位置                    : p0      = (p0.x, p0.y)
    // 初期速度                    : v0      = (v0.x, v0.y)
    // 頂点までの対空時間          : t1      = v0.y / g
    // 最大高度                    : y_max   = p0.y + 1/2 * v0.y ^ 2 / g
    // 頂点から着地までの対空時間  : t2 - t1 = sqrt(2 * y_max / g)
    // 水平移動距離                : x_max   = p0.x + v0.x * t2
    //                             :         = p0.x + v0.x * {v0.y / g + sqrt(2 * y_max / g)}

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
