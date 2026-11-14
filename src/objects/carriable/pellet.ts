import {
    Color3,
    CreatePlane,
    DynamicTexture,
    Mesh,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { Color } from "../../rendering/color";
import { minionColorToColor3 } from "../minion/color";
import { Carriable } from "./carriable";

/** Pellet body and number label visuals, applied to an existing mesh. */
export function createPelletAppearance(
    mesh: Mesh,
    num: number,
    size: number,
    name: string,
    scene: Game["scene"],
    baseColor: Color3,
    labelFacing: "topBottom" | "positiveY" = "topBottom",
): void {
    const material = mesh.material instanceof StandardMaterial
        ? mesh.material
        : new StandardMaterial(`${name}.material`, scene);
    mesh.material = material;
    Color.set(material, baseColor);
    material.alpha = 0.6;

    const labelMaterial = createPelletLabelMaterial(
        `${name}.labelMaterial`,
        scene,
        num,
        labelFacing === "positiveY",
        labelFacing === "positiveY",
    );
    const negativeYLabelMaterial = labelFacing === "positiveY"
        ? createPelletLabelMaterial(`${name}.negativeY.labelMaterial`, scene, num, false, false)
        : labelMaterial;

    const labelSize = size * 0.8;
    const capOffset = size / 4 + 0.001;
    const sides = [-1, 1];
    for(const side of sides){
        const label = CreatePlane(
            `${name}.label.${side}`,
            { size: labelSize },
            scene,
        );
        label.parent = mesh;
        if(labelFacing === "topBottom"){
            label.position = new Vector3(0, side * capOffset, 0);
            label.rotation.x = -side * Math.PI / 2;
        }
        else{
            label.position = new Vector3(0, side * capOffset, 0);
            label.rotation.x = -side * Math.PI / 2;
        }
        label.material = labelFacing === "positiveY" && side < 0
            ? negativeYLabelMaterial
            : labelMaterial;
        label.isPickable = false;
        label.checkCollisions = false;
    }
}

function createPelletLabelMaterial(
    name: string,
    scene: Game["scene"],
    num: number,
    flipVertical: boolean,
    flipHorizontal: boolean,
): StandardMaterial {
    const labelTexture = new DynamicTexture(
        `${name}.texture`,
        { width: 256, height: 256 },
        scene,
    );
    labelTexture.hasAlpha = true;
    const context = labelTexture.getContext() as CanvasRenderingContext2D;
    context.clearRect(0, 0, 256, 256);
    if(flipHorizontal){
        context.translate(256, 0);
        context.scale(-1, 1);
    }
    if(flipVertical){
        context.translate(0, 256);
        context.scale(1, -1);
    }
    context.fillStyle = "white";
    const textSize = 220 - 50 * (num.toString().length - 1);
    context.font = `bold ${textSize}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = 12;
    context.lineJoin = "round";
    context.strokeStyle = "white";
    context.strokeText(num.toString(), 128, 128);
    context.fillText(num.toString(), 128, 128);
    labelTexture.update();

    const material = new StandardMaterial(name, scene);
    material.diffuseTexture = labelTexture;
    material.useAlphaFromDiffuseTexture = true;
    material.emissiveColor = Color3.White();
    material.backFaceCulling = false;
    return material;
}

export abstract class Pellet extends Carriable {
    protected static readonly _BASE_COLOR: Color3 = new Color3(0, 1, 0);
    private get baseColor(){ return (this.constructor as typeof Pellet)._BASE_COLOR; }

    public override get nutrition(): number {
        const carrierColor = this.getMostCommonCarrierColor();
        const baseColor = this.baseColor;
        const matchesBaseColor = carrierColor !== null
            && minionColorToColor3(carrierColor).equals(baseColor);

        return matchesBaseColor ? super.nutrition : Math.ceil(super.nutrition / 2);
    }

    constructor(game: Game, position: Vector3, public readonly num: number) {
        const size = (Math.floor(Math.sqrt(num)) + 1) * 3 / 16;
        super(game, position, size, size / 4);
        createPelletAppearance(
            this.mesh,
            num,
            this.size,
            this.name,
            this.scene,
            this.baseColor,
        );
    }

    override update(_: number): void {
        super.update(_);
    }
}
