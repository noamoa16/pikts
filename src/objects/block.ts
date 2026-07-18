import {
    Color3,
    CreateBox,
    type Scene,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Color } from "../rendering/color";
import { Entity } from "./entity";

export class Block extends Entity {
    constructor(scene: Scene, position: Vector3) {
        super("block", { fall: false });
        this.size = 1;
        this.mesh = CreateBox(
            this.name,
            { width: this.size, height: this.size, depth: this.size },
            scene,
        );
        this.groundingPosition = position.clone();

        const material = new StandardMaterial(`${this.name}.material`, scene);
        material.backFaceCulling = false;
        Color.set(material, new Color3(0.7, 0.7, 0.7));
        this.mesh.material = material;
        this.checkCollisions = true;
    }

    override update(_: number): void {
        // 何もしない
    }
}
