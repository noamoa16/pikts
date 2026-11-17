import { Dir4, Slope as SlopeFigure } from "../physics/figure";
import type { Entity } from "../objects/entity";
import { Block } from "../objects/block";
import { Slope as SlopeEntity } from "../objects/slope";
import type { GridBounds, GridMap, GridObstacle } from "./gridPathfinding";

/** Builds the pathfinding grid from the current world entities. */
export function buildGridMap(objects: readonly Entity[]): GridMap {
    return {
        bounds: createGridMapBounds(objects),
        blocked: createGridObstaclePoints(objects),
    };
}

function getFootprint(object: Entity): { halfX: number; halfY: number } {
    if (object instanceof SlopeEntity && object.figure instanceof SlopeFigure) {
        const figure = object.figure;
        return figure.upward === Dir4.Right || figure.upward === Dir4.Left
            ? { halfX: figure.length / 2, halfY: figure.width / 2 }
            : { halfX: figure.width / 2, halfY: figure.length / 2 };
    }
    return { halfX: object.size / 2, halfY: object.size / 2 };
}

function createGridObstaclePoints(objects: readonly Entity[]): GridObstacle[] {
    const points = new Map<string, GridObstacle>();
    for (const object of objects) {
        if (!(object instanceof Block || object instanceof SlopeEntity)) continue;

        const { halfX, halfY } = getFootprint(object);
        let minZ = object.position.z - object.size / 2;
        let maxZ = object.position.z + object.size / 2;
        if (object instanceof SlopeEntity && object.figure instanceof SlopeFigure) {
            minZ = object.figure.center.z - object.figure.height / 2;
            maxZ = object.figure.center.z + object.figure.height / 2;
        }

        const minX = Math.ceil(object.position.x - halfX - 1e-6);
        const maxX = Math.floor(object.position.x + halfX + 1e-6);
        const minY = Math.ceil(object.position.y - halfY - 1e-6);
        const maxY = Math.floor(object.position.y + halfY + 1e-6);
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const point = { x, y, minZ, maxZ };
                points.set(`${x},${y},${minZ},${maxZ}`, point);
            }
        }
    }
    return [...points.values()];
}

function createGridMapBounds(objects: readonly Entity[]): GridBounds {
    if (objects.length === 0) {
        return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const object of objects) {
        const { halfX, halfY } = getFootprint(object);
        minX = Math.min(minX, object.position.x - halfX);
        maxX = Math.max(maxX, object.position.x + halfX);
        minY = Math.min(minY, object.position.y - halfY);
        maxY = Math.max(maxY, object.position.y + halfY);
    }
    return {
        minX: Math.floor(minX),
        maxX: Math.ceil(maxX),
        minY: Math.floor(minY),
        maxY: Math.ceil(maxY),
    };
}
