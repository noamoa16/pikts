import { Color3, Mesh, Scene, StandardMaterial } from "#vendor/babylon";
import { Color } from "../../rendering/color";
import { MinionColor, minionColorToColor3 } from "./color";
import { MinionState } from "./state";
import { Plant } from "./parts/plant";

export class MinionAppearance {
    constructor(
        private readonly mesh: Mesh,
        private readonly plant: Plant,
        name: string,
        scene: Scene,
    ) {
        const material = new StandardMaterial(`${name}.material`, scene);
        material.backFaceCulling = false;
        this.mesh.material = material;
    }

    public update(color: MinionColor, state: MinionState): void {
        const glowColor = state === MinionState.buried
            ? minionColorToColor3(color)
            : null;
        this.plant.setBuriedGlow(glowColor);

        const material = this.mesh.material;
        if (material) {
            Color.set(
                material as StandardMaterial,
                state === MinionState.free ? freeColor(color) : baseColor(color),
                { metallicity: 0.1, luminance: 0.3 },
            );
        }
    }
}

function baseColor(color: MinionColor): Color3 {
    const rgb = minionColorToColor3(color);
    return new Color3(rgb.r * 0.95, rgb.g * 0.95, rgb.b * 0.95);
}

function freeColor(color: MinionColor): Color3 {
    const rgb = minionColorToColor3(color);
    return new Color3(
        rgb.r > 0 ? 0.95 : 0.5,
        rgb.g > 0 ? 0.95 : 0.5,
        rgb.b > 0 ? 0.95 : 0.5,
    );
}
