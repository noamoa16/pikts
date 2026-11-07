import { Vector2 } from "#vendor/babylon";
import { rotate2D, toVector2, toVector3 } from "../../core/math";
import { Random } from "../../core/random";
import { Carriable } from "../carriable/carriable";
import { Entity } from "../entity";
import { Player } from "../player/player";
import { calcSeparationDirection } from "./movement";
import { Minion } from "./minion";
import { MinionState } from "./state";

/** 重なった Entity から Minion を押し出す */
export function separateFromOverlappingEntities(
    minion: Minion,
    entities: readonly Entity[],
    deltaSeconds: number,
): void {
    const VELOCITY = 0.5;
    const DISTANCE_DELTA = 0.01;
    const MIN_DISTANCE_SQ = 0.000001;
    const MAX_ANGLE = Math.PI / 8;
    let direction = new Vector2();
    const ignoredEntities: Entity[] = [];

    for (const object of entities) {
        if (!isAvoidanceTarget(minion, object)) continue;

        const figure = object.figure;
        const extendedFigure = minion.figure.scaled(1 + DISTANCE_DELTA);
        const diff = minion.position.subtract(figure.center);
        if (!extendedFigure.intersects(figure)) continue;

        let diff2d = toVector2(diff);
        const distanceSq2d = diff2d.lengthSquared();
        if (distanceSq2d < MIN_DISTANCE_SQ) {
            if (!(object instanceof Minion)) continue;
            diff2d = calcSeparationDirection(minion, object);
            direction.addInPlace(diff2d.scale(Math.pow(MIN_DISTANCE_SQ, -1 / 2)));
        }
        else {
            direction.addInPlace(diff2d.scale(Math.pow(distanceSq2d, -3 / 2)));
        }

        if (object instanceof Minion) ignoredEntities.push(object);
    }

    if (direction.lengthSquared() === 0) return;
    direction = direction.normalize().scale(VELOCITY * deltaSeconds);
    direction = rotate2D(direction, Random.uniform(-MAX_ANGLE, MAX_ANGLE));
    minion.moveFor(toVector3(direction), { ignoredEntities });
}

/** 運搬物にめり込んだ Minion を、運搬物から離す */
export function separateFromNearbyCarriables(
    minion: Minion,
    entities: readonly Entity[],
    deltaSeconds: number,
): void {
    const PROXIMITY_MARGIN = 1 / 32;
    const SEPARATION_SPEED = 0.5;
    const MIN_DISTANCE_SQ = 0.000001;
    let direction = new Vector2();
    const ignoredEntities: Carriable[] = [];

    for (const carriable of entities) {
        if (!(carriable instanceof Carriable)) continue;
        // 運搬中は、運んでいる物との距離だけを保つ。他の運搬物は通り抜ける。
        if (minion.state === MinionState.carrying && carriable !== minion.carried) continue;

        const diff = toVector2(minion.position.subtract(carriable.position));
        const distance = diff.length();
        const minDistance = carriable.radius + minion.size / 2 + PROXIMITY_MARGIN;
        if (distance >= minDistance) continue;

        if (distance * distance < MIN_DISTANCE_SQ) {
            diff.copyFrom(calcSeparationDirection(minion, carriable));
        }
        direction.addInPlace(diff.normalize().scale(minDistance - distance));
        ignoredEntities.push(carriable);
    }

    if (direction.lengthSquared() === 0) return;
    const move = direction.normalize().scale(SEPARATION_SPEED * deltaSeconds);
    minion.moveFor(toVector3(move), { ignoredEntities });
}

/** Free / following 状態の Minion 同士の重なりを解消する */
export function separateFromOverlappingMinions(
    minion: Minion,
    entities: readonly Entity[],
): void {
    const MOVE_DISTANCE = minion.size + 0.01;
    const MIN_DISTANCE_SQ = 0.000001;
    const MAX_ATTEMPTS = 12;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const overlaps = getOverlappingMinions(minion, entities);
        if (overlaps.length === 0) return;

        let direction = new Vector2();
        for (const other of overlaps) {
            const diff = toVector2(minion.position.subtract(other.position));
            if (diff.lengthSquared() < MIN_DISTANCE_SQ) {
                direction.addInPlace(calcSeparationDirection(minion, other));
            }
            else {
                direction.addInPlace(diff.normalize());
            }
        }
        if (direction.lengthSquared() === 0) return;

        const angleStep = Math.ceil(attempt / 2) * Math.PI / 8;
        const angle = attempt === 0 ? 0 : angleStep * (attempt % 2 === 0 ? 1 : -1);
        const move = rotate2D(direction.normalize(), angle).scale(MOVE_DISTANCE);
        minion.moveFor(toVector3(move), { ignoredEntities: overlaps });
    }
}

function isAvoidanceTarget(minion: Minion, object: Entity): boolean {
    if (object === minion) return false;
    if (object instanceof Minion) {
        return [MinionState.following, MinionState.free].includes(object.state);
    }
    return object instanceof Player;
}

function getOverlappingMinions(minion: Minion, entities: readonly Entity[]): Minion[] {
    return entities.filter((object): object is Minion => {
        if (object === minion || !(object instanceof Minion)) return false;
        if (![MinionState.following, MinionState.free].includes(object.state)) return false;
        return minion.figure.intersects(object.figure);
    });
}
