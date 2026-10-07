import {
    Color3,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Dir4, Figure, Shape, Slope as SlopeFigure } from "../physics/figure";
import { Game } from "../game";
import { Color } from "../rendering/color";
import { Entity } from "./entity";

export class Slope extends Entity {
    constructor(game: Game, position: Vector3, size: number = 1, private upward: Dir4 = Dir4.Right) {
        super(game, "slope", Shape.Slope, size, position, { fall: false, upward });
        
        const material = new StandardMaterial(`${this.name}.material`, this.scene);
        material.backFaceCulling = false;
        Color.set(material, new Color3(0.7, 0.7, 0.7));
        this.mesh.material = material;
    }

    public override get figure(): Figure {
        // 坂道の先にあるブロックに登るため、1 / 64 だけ高くする
        return new SlopeFigure(this.position, this.size, 2 * this.size, 1 / 2 * (1 + 1 / 64), this.upward);
    }

    override update(_: number): void {
        // 何もしない
    }
}
