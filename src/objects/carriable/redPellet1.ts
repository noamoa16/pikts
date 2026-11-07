import {
    Vector3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { MinionColor, minionColorToColor3 } from "../minion/color";
import { Pellet } from "./pellet";

export class RedPellet1 extends Pellet {
    protected static readonly _BASE_COLOR = minionColorToColor3(MinionColor.red);
    protected static readonly _MIN_CARRIERS: number = 1;
    protected static readonly _MAX_CARRIERS: number = 2;
    protected static readonly _NUTRITION: number = 2;

    constructor(game: Game, position: Vector3) {
        super(game, position, 1);
    }
}
