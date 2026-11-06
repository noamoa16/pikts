import {
    Color3,
    CreateCylinder,
    CreateSphere,
    Scene,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Minion } from "../minion";

/** Minion の頭頂部に付ける、当たり判定のない植物パーツ */
export class Plant {
    constructor(scene: Scene, minion: Minion) {
        // 指定形状の高さ 2 を Minion の直径に合わせて縮小する。
        const scale = minion.size / 2;
        const root = new Vector3(0, 0, minion.size / 2);

        const stem = CreateCylinder(
            `${minion.name}.plant.stem`,
            {
                height: scale,
                diameter: 2 * Math.sqrt(0.125) * scale,
                tessellation: 16,
            },
            scene,
        );
        stem.parent = minion.mesh;
        stem.position = root.add(new Vector3(0, 0, scale / 2));
        stem.rotation.x = Math.PI / 2;
        stem.isPickable = false;
        stem.checkCollisions = false;
        stem.material = this.createMaterial(
            scene,
            `${minion.name}.plant.stem.material`,
            new Color3(0.12, 0.55, 0.12),
        );

        // x-z 平面に広がる楕円形の葉を、球体を薄くして表現する。
        const leaf = CreateSphere(
            `${minion.name}.plant.leaf`,
            { diameter: 2 },
            scene,
        );
        leaf.parent = minion.mesh;
        leaf.position = root.add(new Vector3(0, 0, scale * 1.5));
        leaf.rotation.x = Math.PI / 2;
        leaf.scaling = new Vector3(scale, scale * 0.125, scale * 0.5);
        leaf.isPickable = false;
        leaf.checkCollisions = false;
        leaf.material = this.createMaterial(
            scene,
            `${minion.name}.plant.leaf.material`,
            new Color3(0.2, 0.75, 0.2),
        );

        const vein = CreateCylinder(
            `${minion.name}.plant.vein`,
            {
                height: scale,
                diameter: scale * 0.04,
                tessellation: 8,
            },
            scene,
        );
        vein.parent = minion.mesh;
        vein.position = root.add(new Vector3(0, 0, scale * 1.5));
        vein.rotation.x = Math.PI / 2;
        vein.isPickable = false;
        vein.checkCollisions = false;
        vein.material = this.createMaterial(
            scene,
            `${minion.name}.plant.vein.material`,
            new Color3(0.02, 0.25, 0.04),
        );
    }

    private createMaterial(scene: Scene, name: string, color: Color3): StandardMaterial {
        const material = new StandardMaterial(name, scene);
        material.diffuseColor = color;
        material.backFaceCulling = false;
        return material;
    }
}
