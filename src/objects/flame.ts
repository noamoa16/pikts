import { Color3, StandardMaterial, Vector3 } from "#vendor/babylon";
import { Game } from "../game";
import { Shape } from "../physics/figure";
import { Entity } from "./entity";
import { Minion } from "./minion/minion";

/** Minion に燃焼を起こす、移動を妨げない炎。 */
export class Flame extends Entity {
    constructor(game: Game, position: Vector3) {
        super(game, "flame", Shape.Cylinder, 0.25, position, {
            fall: false,
            height: 1,
        });
        this.checkCollisions = false;
        this.collisionEventsEnabled = true;

        const outerMaterial = new StandardMaterial("flame.outer.material", this.scene);
        outerMaterial.diffuseColor = new Color3(0.95, 0.08, 0.02);
        outerMaterial.emissiveColor = new Color3(0.45, 0.02, 0);
        outerMaterial.backFaceCulling = false;
        this.mesh.material = outerMaterial;

    }

    override onCollisionEnter(entity: Entity): void {
        if (entity instanceof Minion) entity.becomeBurning();
    }
}
