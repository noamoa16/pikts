import {
    Color3,
    Vector3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { Pellet } from "./pellet";

export class BluePellet1 extends Pellet {
    protected static readonly _BASE_COLOR: Color3 = new Color3(0, 0, 1);
    protected static readonly _MIN_CARRIERS: number = 1;
    protected static readonly _MAX_CARRIERS: number = 2;
    protected static readonly _NUTRITION: number = 2;

    constructor(game: Game, position: Vector3) {
        super(game, position, 1);
    }
}
