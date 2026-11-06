import { Minion } from "./minion";
import { MinionColor } from "./color";

export class YellowMinion extends Minion {
    protected static readonly _MINION_COLOR = MinionColor.yellow;
    protected static readonly _THROWN_MAX_HEIGHT: number = 3.25;
}
