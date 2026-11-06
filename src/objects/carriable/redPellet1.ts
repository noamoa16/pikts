import {
    Vector3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { MinionColor, minionColorToColor3 } from "../minion/color";
import { Pellet } from "./pellet";

/** 一旦、赤ペレットだけ考える */
export class RedPellet1 extends Pellet {
    protected static readonly _BASE_COLOR = minionColorToColor3(MinionColor.red);
    protected static readonly _MIN_CARRIERS: number = 1;
    protected static readonly _MAX_CARRIERS: number = 2;

    constructor(game: Game, position: Vector3) {
        super(game, position, 1);
    }
}
