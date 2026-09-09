import { Color3, CreateSphere, Scene, StandardMaterial, Vector3 } from "#vendor/babylon";
import { Color } from "../../rendering/color";
import { Onion } from "./onion";

export class Base {
    constructor(scene: Scene, onion: Onion, color: Color3){
        const base = CreateSphere(
            `${onion.name}.base`,
            { diameter: onion.size / 4 },
            scene,
        );
        base.parent = onion.mesh;
        base.position = new Vector3(0, 0, onion.size * 3 / 16);
        const baseMaterial = new StandardMaterial(`${onion.name}.base.material`, scene);
        baseMaterial.backFaceCulling = false;
        Color.set(baseMaterial, color, {
            metallicity: 0.1,
            luminance: 0.2,
        });
        base.material = baseMaterial;
    }
}