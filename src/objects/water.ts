import { Color3, StandardMaterial, Vector3 } from "#vendor/babylon";
import { Game } from "../game";
import { Shape } from "../physics/figure";
import { Entity } from "./entity";

const GROUND_CLEARANCE = 0.01;

/** 半透明で、他のオブジェクトの移動を妨げない水。 */
export class Water extends Entity {
    constructor(game: Game, position: Vector3) {
        super(
            game,
            "water",
            Shape.RectangularPrism,
            1,
            position.add(new Vector3(0, 0, GROUND_CLEARANCE)),
            {
                fall: false,
                height: 1 / 8,
            },
        );
        this.checkCollisions = false;
        this.collisionEventsEnabled = true;

        const material = new StandardMaterial(`${this.name}.material`, this.scene);
        material.diffuseColor = new Color3(0.2, 0.7, 0.95);
        material.specularColor = new Color3(0.8, 0.95, 1);
        material.alpha = 0.55;
        material.backFaceCulling = false;
        this.mesh.material = material;
    }

    override update(_: number): void {
        // 何もしない
    }
}
