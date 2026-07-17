import { Color3 } from "#vendor/babylon";
import { Minion } from "./minion";

export class RedMinion extends Minion {
    protected readonly baseColor: Color3 = new Color3(0.95, 0, 0);
    protected readonly freeColor: Color3 = new Color3(0.95, 0.5, 0.5);
}