import {
    Color3,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { Color } from "../../rendering/color";
import { Carriable } from "./carriable";

/** 一旦、赤1ペレットだけ考える */
export class Pellet1 extends Carriable {
    constructor(game: Game, position: Vector3) {
        super(game, position, 0.25);
        const material = this.mesh.material;
        if(material instanceof StandardMaterial){
            Color.set(material, new Color3(1, 0, 0));
        }
    }

    override update(_: number): void {
        // 何もしない
    }
}
