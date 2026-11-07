import {
    Color3,
    CreatePlane,
    DynamicTexture,
    Mesh,
    Scene,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { minionColorToString } from "../minion/color";
import type { Carriable } from "./carriable";

export class CarrierCountLabel {
    private readonly texture: DynamicTexture;
    private readonly mesh: Mesh;

    constructor(private readonly carriable: Carriable, scene: Scene) {
        const texture = new DynamicTexture(
            `${carriable.name}.carrierCountTexture`,
            { width: 256, height: 256 },
            scene,
        );
        texture.hasAlpha = true;

        const material = new StandardMaterial(`${carriable.name}.carrierCountMaterial`, scene);
        material.diffuseTexture = texture;
        material.useAlphaFromDiffuseTexture = true;
        material.emissiveColor = Color3.White();
        material.backFaceCulling = false;

        const SIZE = 1.0; // 分数のサイズ
        const mesh = CreatePlane(
            `${carriable.name}.carrierCountLabel`,
            { size: SIZE },
            scene,
        );
        mesh.parent = carriable.mesh;
        mesh.position = new Vector3(0, 0, carriable.size / 2 + SIZE);
        mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
        // The game mirrors its canvas horizontally, so mirror the label to keep its text readable.
        mesh.scaling.x = -1;
        mesh.material = material;
        mesh.isPickable = false;
        mesh.checkCollisions = false;
        mesh.isVisible = false;

        this.texture = texture;
        this.mesh = mesh;
    }

    update(): void {
        const count = this.carriable.carrierCount;
        this.mesh.isVisible = count > 0;
        if(count === 0) return;

        const context = this.texture.getContext() as CanvasRenderingContext2D;
        context.clearRect(0, 0, 256, 256);
        if(count >= this.carriable.minCarriers){
            const mostCommonColor = this.carriable.getMostCommonCarrierColor();
            context.fillStyle = mostCommonColor === null
                ? "white"
                : minionColorToString(mostCommonColor);
        }
        else{
            context.fillStyle = "#B0B0B0";
        }
        context.font = "bold 88px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(count.toString(), 128, 64);
        context.fillRect(48, 126, 160, 8);
        context.fillText(this.carriable.minCarriers.toString(), 128, 192);
        this.texture.update();
    }
}
