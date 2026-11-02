import {
    Color3,
    Vector3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { Pellet } from "./pellet";

/** 一旦、赤ペレットだけ考える */
export class BluePellet5 extends Pellet {
    protected static readonly _BASE_COLOR: Color3 = new Color3(0, 0, 1);
    protected static readonly _MIN_CARRIERS: number = 5;
    protected static readonly _MAX_CARRIERS: number = 10;

    constructor(game: Game, position: Vector3) {
        super(game, position, 5);
    }
}
