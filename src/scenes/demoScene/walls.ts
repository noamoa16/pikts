import {
    CreateLines, 
    CreateBox, 
    type Mesh, 
    Scene, 
    Vector3, 
    Color3,
} from "#vendor/babylon";

const WALL_THICKNESS = 1;
const WALL_DEPTH = 1;

/** エリアを表す四角形を生成 */
export function createBounds(scene: Scene, playArea: number, boundsZ: number){
    const bounds = CreateLines(
        "bounds",
        {
            points: [
                new Vector3(-playArea, -playArea, boundsZ),
                new Vector3(playArea, -playArea, boundsZ),
                new Vector3(playArea, playArea, boundsZ),
                new Vector3(-playArea, playArea, boundsZ),
                new Vector3(-playArea, -playArea, boundsZ),
            ],
        },
        scene,
    );
    bounds.color = new Color3(0.75, 0.75, 0.8);
}

/** プレイエリアを囲む当たり判定付きの壁を4辺に生成 */
export function createBoundaryWalls(scene: Scene, playArea: number): Mesh[] {
    const span = playArea * 2 + WALL_THICKNESS * 2;
    const offset = playArea + WALL_THICKNESS / 2;

    return [
        createCollisionWall(
            scene,
            "wall-top",
            { width: span, height: WALL_THICKNESS, depth: WALL_DEPTH },
            new Vector3(0, offset, 0),
        ),
        createCollisionWall(
            scene,
            "wall-bottom",
            { width: span, height: WALL_THICKNESS, depth: WALL_DEPTH },
            new Vector3(0, -offset, 0),
        ),
        createCollisionWall(
            scene,
            "wall-right",
            { width: WALL_THICKNESS, height: span, depth: WALL_DEPTH },
            new Vector3(offset, 0, 0),
        ),
        createCollisionWall(
            scene,
            "wall-left",
            { width: WALL_THICKNESS, height: span, depth: WALL_DEPTH },
            new Vector3(-offset, 0, 0),
        ),
    ];
}

/** 指定サイズと位置で不可視の衝突用壁メッシュを生成 */
function createCollisionWall(
    scene: Scene,
    name: string,
    size: { width: number; height: number; depth: number },
    position: Vector3,
): Mesh {
    const wall = CreateBox(name, size, scene);
    wall.position = position;
    wall.isVisible = false;
    wall.checkCollisions = true;
    return wall;
}
