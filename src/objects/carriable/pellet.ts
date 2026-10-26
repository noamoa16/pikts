import {
    Color3,
    CreatePlane,
    DynamicTexture,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { Color } from "../../rendering/color";
import { Carriable } from "./carriable";

export class Pellet extends Carriable {
    constructor(game: Game, position: Vector3, public readonly num: number) {
        super(game, position, (num + 3) * 3 / 32);
        const material = this.mesh.material;
        if(material instanceof StandardMaterial){
            Color.set(material, new Color3(1, 0, 0));
            material.alpha = 0.5;
        }

        // 文字
        const labelTexture = new DynamicTexture(
            `${this.name}.labelTexture`,
            { width: 256, height: 256 },
            this.scene,
        );
        labelTexture.hasAlpha = true;
        const context = labelTexture.getContext() as CanvasRenderingContext2D;
        context.clearRect(0, 0, 256, 256);
        context.fillStyle = "white";
        context.font = "bold 220px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.lineWidth = 12; // 文字の太さ
        context.lineJoin = "round";
        context.strokeStyle = "white";
        context.strokeText(this.num.toString(), 128, 128);
        context.fillText(this.num.toString(), 128, 128);
        labelTexture.update();

        const labelMaterial = new StandardMaterial(`${this.name}.labelMaterial`, this.scene);
        labelMaterial.diffuseTexture = labelTexture;
        labelMaterial.useAlphaFromDiffuseTexture = true;
        labelMaterial.emissiveColor = Color3.White();
        labelMaterial.backFaceCulling = false;

        const labelSize = this.size * 0.75;
        const capOffset = this.size / 4 + 0.001;
        for(const side of [-1, 1]){
            const label = CreatePlane(
                `${this.name}.label.${side}`,
                { size: labelSize },
                this.scene,
            );
            label.parent = this.mesh;
            label.position = new Vector3(0, side * capOffset, 0);
            label.rotation.x = -side * Math.PI / 2;
            label.material = labelMaterial;
            label.isPickable = false;
        }
    }

    override update(_: number): void {
        super.update(_);
    }
}
