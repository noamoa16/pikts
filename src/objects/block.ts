import {
    Color3,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Shape } from "../core/figure";
import { Game } from "../game";
import { Color } from "../rendering/color";
import { Entity } from "./entity";

export class Block extends Entity {
    constructor(game: Game, position: Vector3, size: number = 1) {
        super(game, "block", Shape.Cube, size, position, { fall: false });

        const material = new StandardMaterial(`${this.name}.material`, this.scene);
        material.backFaceCulling = false;
        Color.set(material, new Color3(0.7, 0.7, 0.7));
        this.mesh.material = material;
    }

    override update(_: number): void {
        // 何もしない
    }
}
