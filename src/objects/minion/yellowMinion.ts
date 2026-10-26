import { Color3 } from "#vendor/babylon";
import { Minion } from "./minion";

export class YellowMinion extends Minion {
    protected static readonly _BASE_COLOR: Color3 = new Color3(0.95, 0.95, 0);
    protected static readonly _FREE_COLOR: Color3 = new Color3(0.95, 0.95, 0.5);

    protected static readonly _THROWN_MAX_HEIGHT: number = 3.25;
}