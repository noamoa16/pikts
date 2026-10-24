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

/** 一旦、赤1ペレットだけ考える */
export class Pellet1 extends Carriable {
    protected static readonly _MIN_CARRIERS: number = 1;
    protected static readonly _MAX_CARRIERS: number = 2;

    constructor(game: Game, position: Vector3) {
        super(game, position, 0.375);
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
        context.strokeText("1", 128, 128);
        context.fillText("1", 128, 128);
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
        // 何もしない
    }
}
