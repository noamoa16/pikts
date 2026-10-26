import { Color3 } from "#vendor/babylon";
import { Minion } from "./minion";
import { MinionColor } from "./color";

export class BlueMinion extends Minion {
    public static override readonly minionColor = MinionColor.blue;
    protected static readonly _BASE_COLOR: Color3 = new Color3(0, 0, 0.95);
    protected static readonly _FREE_COLOR: Color3 = new Color3(0.5, 0.5, 0.95);
}
