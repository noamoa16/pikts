import {
    Color3,
    Vector3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { Pellet } from "./pellet";

export class YellowPellet5 extends Pellet {
    protected static readonly _BASE_COLOR: Color3 = new Color3(1, 1, 0);
    protected static readonly _MIN_CARRIERS: number = 5;
    protected static readonly _MAX_CARRIERS: number = 10;
    protected static readonly _NUTRITION: number = 5;

    constructor(game: Game, position: Vector3) {
        super(game, position, 5);
    }
}
