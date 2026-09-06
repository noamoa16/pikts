// import { Color3, CreateTube, Scene } from "#vendor/babylon";
// import { Color } from "../../rendering/color";
// import { Onion } from "./onion";

// export class Pillar {
//     constructor(scene: Scene, onion: Onion, theta: number){
//         const pillar = CreateTube(
//             `${onion.name}.pillar`,
//             { radius: onion.size / 32 },
//             scene,
//         );
//         pillar.parent = onion.mesh;
//         pillar.position = new Vector3(player.size / 2, 0, 0);
//         const pillarMaterial = new StandardMaterial(`${onion.name}.pillar.material`, scene);
//         pillarMaterial.backFaceCulling = false;
//         Color.set(pillarMaterial, new Color3(0.5, 0.2, 0.2), {
//             metallicity: 0.1,
//             luminance: 0.2,
//         });
//         pillar.material = pillarMaterial;
//     }
// }