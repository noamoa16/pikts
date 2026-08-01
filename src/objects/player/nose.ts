import { Color3, CreateSphere, Scene, StandardMaterial, Vector3 } from "#vendor/babylon";
import { Color } from "../../rendering/color";
import { Player } from "./player";

export class Nose {
    constructor(scene: Scene, player: Player){
        const nose = CreateSphere(`${player.name}.nose`, { diameter: player.size / 4 }, scene);
        nose.parent = player.mesh;
        nose.position = new Vector3(player.size / 2, 0, 0);
        const noseMaterial = new StandardMaterial(`${player.name}.nose.material`, scene);
        noseMaterial.backFaceCulling = false;
        Color.set(noseMaterial, new Color3(0.5, 0.2, 0.2), {
            metallicity: 0.1,
            luminance: 0.2,
        });
        nose.material = noseMaterial;
    }
}