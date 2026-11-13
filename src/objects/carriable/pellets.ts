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
export class RedPellet5 extends Pellet {
    protected static readonly _BASE_COLOR = minionColorToColor3(MinionColor.red);
    protected static readonly _MIN_CARRIERS: number = 5;
    protected static readonly _MAX_CARRIERS: number = 10;
    protected static readonly _NUTRITION: number = 5;

    constructor(game: Game, position: Vector3) {
        super(game, position, 5);
    }
}
export class RedPellet10 extends Pellet {
    protected static readonly _BASE_COLOR = minionColorToColor3(MinionColor.red);
    protected static readonly _MIN_CARRIERS: number = 10;
    protected static readonly _MAX_CARRIERS: number = 20;
    protected static readonly _NUTRITION: number = 10;

    constructor(game: Game, position: Vector3) {
        super(game, position, 10);
    }
}
export class RedPellet20 extends Pellet {
    protected static readonly _BASE_COLOR = minionColorToColor3(MinionColor.red);
    protected static readonly _MIN_CARRIERS: number = 20;
    protected static readonly _MAX_CARRIERS: number = 50;
    protected static readonly _NUTRITION: number = 20;

    constructor(game: Game, position: Vector3) {
        super(game, position, 20);
    }
}

export class BluePellet1 extends Pellet {
    protected static readonly _BASE_COLOR = minionColorToColor3(MinionColor.blue);
    protected static readonly _MIN_CARRIERS: number = 1;
    protected static readonly _MAX_CARRIERS: number = 2;
    protected static readonly _NUTRITION: number = 2;

    constructor(game: Game, position: Vector3) {
        super(game, position, 1);
    }
}
export class BluePellet5 extends Pellet {
    protected static readonly _BASE_COLOR = minionColorToColor3(MinionColor.blue);
    protected static readonly _MIN_CARRIERS: number = 5;
    protected static readonly _MAX_CARRIERS: number = 10;
    protected static readonly _NUTRITION: number = 5;

    constructor(game: Game, position: Vector3) {
        super(game, position, 5);
    }
}
export class BluePellet10 extends Pellet {
    protected static readonly _BASE_COLOR = minionColorToColor3(MinionColor.blue);
    protected static readonly _MIN_CARRIERS: number = 10;
    protected static readonly _MAX_CARRIERS: number = 20;
    protected static readonly _NUTRITION: number = 10;

    constructor(game: Game, position: Vector3) {
        super(game, position, 10);
    }
}
export class BluePellet20 extends Pellet {
    protected static readonly _BASE_COLOR = minionColorToColor3(MinionColor.blue);
    protected static readonly _MIN_CARRIERS: number = 20;
    protected static readonly _MAX_CARRIERS: number = 50;
    protected static readonly _NUTRITION: number = 20;

    constructor(game: Game, position: Vector3) {
        super(game, position, 20);
    }
}

export class YellowPellet1 extends Pellet {
    protected static readonly _BASE_COLOR = minionColorToColor3(MinionColor.yellow);
    protected static readonly _MIN_CARRIERS: number = 1;
    protected static readonly _MAX_CARRIERS: number = 2;
    protected static readonly _NUTRITION: number = 2;

    constructor(game: Game, position: Vector3) {
        super(game, position, 1);
    }
}
export class YellowPellet5 extends Pellet {
    protected static readonly _BASE_COLOR = minionColorToColor3(MinionColor.yellow);
    protected static readonly _MIN_CARRIERS: number = 5;
    protected static readonly _MAX_CARRIERS: number = 10;
    protected static readonly _NUTRITION: number = 5;

    constructor(game: Game, position: Vector3) {
        super(game, position, 5);
    }
}
export class YellowPellet10 extends Pellet {
    protected static readonly _BASE_COLOR = minionColorToColor3(MinionColor.yellow);
    protected static readonly _MIN_CARRIERS: number = 10;
    protected static readonly _MAX_CARRIERS: number = 20;
    protected static readonly _NUTRITION: number = 10;

    constructor(game: Game, position: Vector3) {
        super(game, position, 10);
    }
}
export class YellowPellet20 extends Pellet {
    protected static readonly _BASE_COLOR = minionColorToColor3(MinionColor.yellow);
    protected static readonly _MIN_CARRIERS: number = 20;
    protected static readonly _MAX_CARRIERS: number = 50;
    protected static readonly _NUTRITION: number = 20;

    constructor(game: Game, position: Vector3) {
        super(game, position, 20);
    }
}