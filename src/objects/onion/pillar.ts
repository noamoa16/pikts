import { Axis, Color3, CreateCylinder, Quaternion, Scene, StandardMaterial, Vector3 } from "#vendor/babylon";
import { Color } from "../../rendering/color";
import { Onion } from "./onion";

export class Pillar {
    constructor(scene: Scene, onion: Onion, index: number, color: Color3){
        const theta = Math.PI / 3 + (Math.PI * 2 / 3) * index;
        const root = new Vector3(0, 0, onion.size / 4);
        const foot = new Vector3(
            onion.size / 2 * Math.cos(theta),
            onion.size / 2 * Math.sin(theta),
            -onion.size / 2,
        );
        const axis = foot.subtract(root);
        const height = axis.length();
        const center = root.add(foot).scale(0.5);
        const pillar = CreateCylinder(
            `${onion.name}.pillar.${index + 1}`,
            {
                height: height,
                diameter: onion.size / 32,
                tessellation: 32,
            },
            scene,
        );
        pillar.position = center;
        pillar.rotationQuaternion = Quaternion.FromUnitVectorsToRef(
            Axis.Y,
            axis.normalize(),
            new Quaternion(),
        );
        pillar.parent = onion.mesh;
        const pillarMaterial = new StandardMaterial(`${onion.name}.pillar.material`, scene);
        pillarMaterial.backFaceCulling = false;
        Color.set(pillarMaterial, color);
        pillar.material = pillarMaterial;
    }
}