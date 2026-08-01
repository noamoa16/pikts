import { Color3, CreateTorus, Scene, StandardMaterial, Vector3 } from "#vendor/babylon";
import { Color } from "../../rendering/color";
import { Player } from "./player";

export class Cursor {
    public readonly mesh;
    constructor(scene: Scene, player: Player){
        const CURSOR_DISTANCE = 4;
        const cursor = CreateTorus(
            `${player.name}.cursor`,
            {
                diameter: player.size,
                thickness: player.size / 12,
                tessellation: 16,
            }
        );
        cursor.parent = player.mesh;
        cursor.position = new Vector3(player.size * CURSOR_DISTANCE, 0, 0);
        cursor.rotation = new Vector3(Math.PI / 2, 0, 0);
        const cursorMaterial = new StandardMaterial(`${player.name}.cursor.material`, scene);
        cursorMaterial.backFaceCulling = false;
        Color.set(cursorMaterial, new Color3(0.9, 0.4, 0.7), {
            metallicity: 0.1,
            luminance: 0.25,
        });
        cursor.material = cursorMaterial;
        this.mesh = cursor;
    }
    public getAbsolutePosition(): Vector3 {
        return this.mesh.getAbsolutePosition();
    }
}