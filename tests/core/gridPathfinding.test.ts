import { describe, expect, it } from "vitest";
import { findGridPath, type GridMap, type GridPoint } from "../../src/core/gridPathfinding";

function map(
    bounds: GridMap["bounds"],
    blocked: readonly GridPoint[] = [],
): GridMap {
    return { bounds, blocked };
}

describe("core/gridPathfinding", () => {
    it("returns the shortest route as 8-direction movement deltas", () => {
        const path = findGridPath(
            { x: 0, y: 0 },
            { x: 2, y: 2 },
            map({ minX: 0, maxX: 2, minY: 0, maxY: 2 }),
        );

        expect(path).toEqual([{ x: 1, y: 1 }, { x: 1, y: 1 }]);
    });

    it("routes around blocked cells", () => {
        const path = findGridPath(
            { x: 0, y: 1 },
            { x: 2, y: 1 },
            map(
                { minX: 0, maxX: 2, minY: 0, maxY: 2 },
                [{ x: 1, y: 1 }],
            ),
        );

        expect(path).not.toBeNull();
        const visited = [{ x: 0, y: 1 }];
        for (const step of path!) {
            const previous = visited[visited.length - 1];
            visited.push({ x: previous.x + step.x, y: previous.y + step.y });
        }
        expect(visited.at(-1)).toEqual({ x: 2, y: 1 });
        expect(visited).not.toContainEqual({ x: 1, y: 1 });
        expect(path).toHaveLength(4);
    });

    it("does not cut diagonally between two blocked cells", () => {
        const path = findGridPath(
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            map(
                { minX: 0, maxX: 1, minY: 0, maxY: 1 },
                [{ x: 1, y: 0 }, { x: 0, y: 1 }],
            ),
        );

        expect(path).toBeNull();
    });

    it("returns an empty route when start and goal are the same", () => {
        expect(findGridPath(
            { x: -1, y: 3 },
            { x: -1, y: 3 },
            map({ minX: -2, maxX: 2, minY: 0, maxY: 4 }),
        )).toEqual([]);
    });

    it("returns null for blocked endpoints and unreachable goals", () => {
        const board = map(
            { minX: 0, maxX: 2, minY: 0, maxY: 0 },
            [{ x: 1, y: 0 }],
        );
        expect(findGridPath({ x: 1, y: 0 }, { x: 2, y: 0 }, board)).toBeNull();
        expect(findGridPath({ x: 0, y: 0 }, { x: 1, y: 0 }, board)).toBeNull();
        expect(findGridPath({ x: 0, y: 0 }, { x: 2, y: 0 }, board)).toBeNull();
    });

    it("returns null when an endpoint is outside the map or not a grid point", () => {
        const board = map({ minX: 0, maxX: 2, minY: 0, maxY: 2 });
        expect(findGridPath({ x: -1, y: 0 }, { x: 2, y: 2 }, board)).toBeNull();
        expect(findGridPath({ x: 0.5, y: 0 }, { x: 2, y: 2 }, board)).toBeNull();
    });
});
