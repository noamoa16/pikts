import {
    Color3,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Shape } from "../../physics/figure";
import { Game } from "../../game";
import { Color } from "../../rendering/color";
import { Entity } from "../entity";

export class Carriable extends Entity {
    constructor(game: Game, position: Vector3, size: number = 1) {
        super(game, "carriable", Shape.Sphere, size, position, { fall: true }); // 円柱にしたい (仮に旧にしている)

        const material = new StandardMaterial(`${this.name}.material`, this.scene);
        material.backFaceCulling = false;
        Color.set(material, new Color3(0, 1, 0));
        this.mesh.material = material;
    }

    override update(_: number): void {
        // 何もしない
    }
}
