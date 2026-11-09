import {
    Color3,
    CreateCylinder,
    CreateSphere,
    Scene,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { getGlowLayer } from "../../../rendering/glowLayer";
import { Minion } from "../minion";

/** Minion の頭頂部に付ける、当たり判定のない植物パーツ */
export class Plant {
    private readonly leafMaterial: StandardMaterial;
    private readonly glowMaterial: StandardMaterial;

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
        this.leafMaterial = this.createMaterial(
            scene,
            `${minion.name}.plant.leaf.material`,
            new Color3(0.2, 0.75, 0.2),
        );
        leaf.material = this.leafMaterial;

        const glow = CreateSphere(
            `${minion.name}.plant.glow`,
            { diameter: 2, segments: 16 },
            scene,
        );
        glow.parent = minion.mesh;
        glow.position = root.add(new Vector3(0, 0, scale * 1.1));
        glow.scaling = new Vector3(scale * 2.2, scale * 1.2, scale * 2.2);
        glow.isPickable = false;
        glow.checkCollisions = false;
        this.glowMaterial = new StandardMaterial(`${minion.name}.plant.glow.material`, scene);
        this.glowMaterial.disableLighting = true;
        this.glowMaterial.backFaceCulling = false;
        this.glowMaterial.alpha = 0;
        glow.material = this.glowMaterial;
        getGlowLayer(scene).addIncludedOnlyMesh(glow);

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

    public setBuriedGlow(color: Color3 | null): void {
        this.leafMaterial.emissiveColor = color
            ? color.scale(0.6)
            : new Color3(0, 0, 0);
        this.glowMaterial.diffuseColor = color ?? new Color3(0, 0, 0);
        this.glowMaterial.emissiveColor = color ?? new Color3(0, 0, 0);
        this.glowMaterial.alpha = color ? 0.18 : 0;
    }

    private createMaterial(scene: Scene, name: string, color: Color3): StandardMaterial {
        const material = new StandardMaterial(name, scene);
        material.diffuseColor = color;
        material.backFaceCulling = false;
        return material;
    }
}
