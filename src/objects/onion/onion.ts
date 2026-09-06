import {
    Color3,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { Shape } from "../../physics/figure";
import { Color } from "../../rendering/color";
import { Entity } from "../entity";

export abstract class Onion extends Entity {
    protected static readonly _BASE_COLOR: Color3 = new Color3(0, 0.95, 0);
    protected static readonly _SIZE = 3.0;
    private get baseColor(){ return (this.constructor as typeof Onion)._BASE_COLOR; }

    constructor(game: Game, position: Vector3) {
        const spherePosition = new Vector3(
            position.x,
            position.y,
            position.z + Onion._SIZE * 3 / 8,
        );
        super(game, "onion", Shape.Sphere, Onion._SIZE / 4, spherePosition, { fall: false });
        const material = new StandardMaterial(`${this.name}.material`, this.scene);
        material.backFaceCulling = false;
        Color.set(material, this.baseColor);
        this.mesh.material = material;
        this.mesh.checkCollisions = false;

        // 足作成
        for(let i = 0; i < 3; i++){
            const theta = Math.PI + (Math.PI * 2 / 3) * i;
            // TODO
            // new Pillar(scene, this, theta);
        }
    }

    override update(_: number): void {
        // 何もしない
    }
}
