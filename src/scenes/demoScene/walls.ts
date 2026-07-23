import {
    CreateLines, 
    Vector3, 
    Color3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { Block } from "../../objects/block";

/** プレイエリアを囲む当たり判定付きの壁を4辺に生成 */
export function createBoundaryWalls(game: Game, playArea: number, boundsZ: number): Block[] {
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
        game.scene,
    );
    bounds.color = new Color3(0.75, 0.75, 0.8);
    const blocks = [
        new Block(game, new Vector3(0, playArea * 2, 0), playArea * 2),
        new Block(game, new Vector3(0, -playArea * 2, 0), playArea * 2),
        new Block(game, new Vector3(playArea * 2, 0, 0), playArea * 2),
        new Block(game, new Vector3(-playArea * 2, 0, 0), playArea * 2),
    ];
    blocks.forEach(block => {
        block.isVisible = false;
    });
    return blocks;
}