import {
    Vector3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { MinionColor, minionColorToColor3 } from "../minion/color";
import { Pellet } from "./pellet";

export const RED_PELLET_COLOR = minionColorToColor3(MinionColor.red);
const BLUE_COLOR = minionColorToColor3(MinionColor.blue);
const YELLOW_COLOR = minionColorToColor3(MinionColor.yellow);

abstract class Pellet1 extends Pellet {
    protected static override readonly _MIN_CARRIERS = 1;
    protected static override readonly _MAX_CARRIERS = 2;
    protected static override readonly _NUTRITION = 2;

    constructor(game: Game, position: Vector3) {
        super(game, position, 1);
    }
}

abstract class Pellet5 extends Pellet {
    protected static override readonly _MIN_CARRIERS = 5;
    protected static override readonly _MAX_CARRIERS = 10;
    protected static override readonly _NUTRITION = 5;

    constructor(game: Game, position: Vector3) {
        super(game, position, 5);
    }
}

abstract class Pellet10 extends Pellet {
    protected static override readonly _MIN_CARRIERS = 10;
    protected static override readonly _MAX_CARRIERS = 20;
    protected static override readonly _NUTRITION = 10;

    constructor(game: Game, position: Vector3) {
        super(game, position, 10);
    }
}

abstract class Pellet20 extends Pellet {
    protected static override readonly _MIN_CARRIERS = 20;
    protected static override readonly _MAX_CARRIERS = 50;
    protected static override readonly _NUTRITION = 20;

    constructor(game: Game, position: Vector3) {
        super(game, position, 20);
    }
}

export class RedPellet1 extends Pellet1 {
    protected static override readonly _BASE_COLOR = RED_PELLET_COLOR;
}
export class RedPellet5 extends Pellet5 {
    protected static override readonly _BASE_COLOR = RED_PELLET_COLOR;
}
export class RedPellet10 extends Pellet10 {
    protected static override readonly _BASE_COLOR = RED_PELLET_COLOR;
}
export class RedPellet20 extends Pellet20 {
    protected static override readonly _BASE_COLOR = RED_PELLET_COLOR;
}

export class BluePellet1 extends Pellet1 {
    protected static override readonly _BASE_COLOR = BLUE_COLOR;
}
export class BluePellet5 extends Pellet5 {
    protected static override readonly _BASE_COLOR = BLUE_COLOR;
}
export class BluePellet10 extends Pellet10 {
    protected static override readonly _BASE_COLOR = BLUE_COLOR;
}
export class BluePellet20 extends Pellet20 {
    protected static override readonly _BASE_COLOR = BLUE_COLOR;
}

export class YellowPellet1 extends Pellet1 {
    protected static override readonly _BASE_COLOR = YELLOW_COLOR;
}
export class YellowPellet5 extends Pellet5 {
    protected static override readonly _BASE_COLOR = YELLOW_COLOR;
}
export class YellowPellet10 extends Pellet10 {
    protected static override readonly _BASE_COLOR = YELLOW_COLOR;
}
export class YellowPellet20 extends Pellet20 {
    protected static override readonly _BASE_COLOR = YELLOW_COLOR;
}
