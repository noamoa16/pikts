import { MinionColor } from "../minion/color";
import { Onion } from "./onion";

export class RedOnion extends Onion {
    protected static readonly _MINION_COLOR = MinionColor.red;
}
export class BlueOnion extends Onion {
    protected static readonly _MINION_COLOR = MinionColor.blue;
}
export class YellowOnion extends Onion {
    protected static readonly _MINION_COLOR = MinionColor.yellow;
}
