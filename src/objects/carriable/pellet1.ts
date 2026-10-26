import {
    Vector3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { Pellet } from "./pellet";

/** 一旦、赤ペレットだけ考える */
export class Pellet1 extends Pellet {
    protected static readonly _MIN_CARRIERS: number = 1;
    protected static readonly _MAX_CARRIERS: number = 2;

    constructor(game: Game, position: Vector3) {
        super(game, position, 1);
    }
}
