import { Minion } from "./minion";
import { MinionColor } from "./color";

export class RedMinion extends Minion {
    protected static readonly _MINION_COLOR = MinionColor.red;
    protected static readonly _ATTACK_POWER: number = 1.5;
}
