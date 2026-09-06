import { Color3 } from "#vendor/babylon";
import { Onion } from "./onion";

export class RedOnion extends Onion {
    protected static readonly _BASE_COLOR: Color3 = new Color3(0.95, 0.2, 0.2);
}