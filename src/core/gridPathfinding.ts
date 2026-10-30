/** An integer coordinate on the game board. */
export interface GridPoint {
    readonly x: number;
    readonly y: number;
}

/** Inclusive, finite bounds for a grid map. */
export interface GridBounds {
    readonly minX: number;
    readonly maxX: number;
    readonly minY: number;
    readonly maxY: number;
}

/** Cells occupied by pathfinding obstacles, such as Blocks and Slopes. */
export interface GridMap {
    readonly bounds: GridBounds;
    readonly blocked: readonly GridPoint[];
}

/** One of the eight possible grid moves. */
export interface GridDirection {
    readonly x: -1 | 0 | 1;
    readonly y: -1 | 0 | 1;
}

const DIRECTIONS: readonly GridDirection[] = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
];

function key(point: GridPoint): string {
    return `${point.x},${point.y}`;
}

function isIntegerPoint(point: GridPoint): boolean {
    return Number.isInteger(point.x) && Number.isInteger(point.y);
}

function isInBounds(point: GridPoint, bounds: GridBounds): boolean {
    return point.x >= bounds.minX && point.x <= bounds.maxX
        && point.y >= bounds.minY && point.y <= bounds.maxY;
}

interface QueueEntry {
    readonly point: GridPoint;
    readonly distance: number;
}

export function getNearestGridPoint(
    x: number,
    y: number,
    goal: GridPoint | null = null,
): GridPoint {
    let xDelta = 0.5, yDelta = 0.5;
    if(goal){
        if(!Number.isInteger(x)){
            if(x > goal.x) xDelta = 0;
            else xDelta = 1;
        }
        if(!Number.isInteger(y)){
            if(y > goal.y) yDelta = 0;
            else yDelta = 1;
        }
    }
    const xInt = Math.floor(x + xDelta);
    const yInt = Math.floor(y + yDelta);
    return {x: xInt, y: yInt};
}

/**
 * 有限グリッド内でダイクストラのアルゴリズムを使って最短経路を求める。
 * 戻り値は絶対座標ではなく、移動量です。斜め移動は √2 のコスト、縦横移動は 1 のコストで計算し、
 * 対角移動が可能なのは 両隣接セル（縦横）に障害物が無いときのみ。
 * 開始点または終了点が無効／ブロック状態、もしくは経路が存在しない場合には null を返す。
 * マップの境界は含む。
 */
export function findGridPath(
    start: GridPoint,
    goal: GridPoint,
    map: GridMap,
): GridDirection[] | null {
    const { bounds } = map;
    if (
        !isIntegerPoint(start)
        || !isIntegerPoint(goal)
        || !isIntegerPoint({ x: bounds.minX, y: bounds.minY })
        || !isIntegerPoint({ x: bounds.maxX, y: bounds.maxY })
        || bounds.minX > bounds.maxX
        || bounds.minY > bounds.maxY
        || !isInBounds(start, bounds)
        || !isInBounds(goal, bounds)
    ) {
        return null;
    }

    const blocked = new Set(map.blocked.map(key));
    const startKey = key(start);
    const goalKey = key(goal);
    if (blocked.has(startKey) || blocked.has(goalKey)) return null;
    if (startKey === goalKey) return [];

    // The maps here are finite and modest in size. A simple minimum scan keeps
    // the queue implementation small while preserving Dijkstra's ordering.
    const queue: QueueEntry[] = [{ point: start, distance: 0 }];
    const distances = new Map<string, number>([[startKey, 0]]);
    const previous = new Map<string, { from: string; direction: GridDirection }>();

    while (queue.length > 0) {
        let minIndex = 0;
        for (let i = 1; i < queue.length; i++) {
            if (queue[i].distance < queue[minIndex].distance) minIndex = i;
        }
        const [current] = queue.splice(minIndex, 1);
        const currentKey = key(current.point);
        if (current.distance !== distances.get(currentKey)) continue;
        if (currentKey === goalKey) break;

        for (const direction of DIRECTIONS) {
            const next = { x: current.point.x + direction.x, y: current.point.y + direction.y };
            const nextKey = key(next);
            if (!isInBounds(next, bounds) || blocked.has(nextKey)) continue;

            if (direction.x !== 0 && direction.y !== 0) {
                const sideX = key({ x: next.x, y: current.point.y });
                const sideY = key({ x: current.point.x, y: next.y });
                if (blocked.has(sideX) || blocked.has(sideY)) continue;
            }

            const candidateDistance = current.distance + (direction.x !== 0 && direction.y !== 0 ? Math.SQRT2 : 1);
            if (candidateDistance >= (distances.get(nextKey) ?? Infinity)) continue;

            distances.set(nextKey, candidateDistance);
            previous.set(nextKey, { from: currentKey, direction });
            queue.push({ point: next, distance: candidateDistance });
        }
    }

    if (!previous.has(goalKey)) return null;
    const path: GridDirection[] = [];
    let cursor = goalKey;
    while (cursor !== startKey) {
        const step = previous.get(cursor);
        if (!step) return null;
        path.push(step.direction);
        cursor = step.from;
    }
    path.reverse();
    return path;
}
