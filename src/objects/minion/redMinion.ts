import { Color3 } from "#vendor/babylon";
import { Minion } from "./minion";
import { MinionColor } from "./color";

export class RedMinion extends Minion {
    protected static readonly _MINION_COLOR = MinionColor.red;
    protected static readonly _BASE_COLOR: Color3 = new Color3(0.95, 0, 0);
    protected static readonly _FREE_COLOR: Color3 = new Color3(0.95, 0.5, 0.5);
}
