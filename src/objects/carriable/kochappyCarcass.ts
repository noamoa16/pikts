import { Mesh, Vector3 } from "#vendor/babylon";
import { Game } from "../../game";
import { Carriable } from "./carriable";

/** Kochappy の死骸。見た目だけ Kochappy のメッシュを z 軸反転して使う。 */
export class KochappyCarcass extends Carriable {
    protected static override readonly _MIN_CARRIERS = 3;
    protected static override readonly _MAX_CARRIERS = 6;
    protected static override readonly _NUTRITION = 4;

    constructor(game: Game, position: Vector3, sourceMesh: Mesh, size: number) {
        super(game, position, size);

        // Entity の位置を死亡時の Kochappy と一致させる。
        this.position.copyFrom(position);

        const appearance = sourceMesh.clone(`${this.name}.${this.id}.appearance`, null, false);
        if (!appearance) throw new Error("Could not clone Kochappy appearance");
        appearance.parent = this.mesh;
        appearance.position.set(0, 0, 0);
        // Carriable's cylinder mesh is rotated to align its height with Z.
        // Cancel that parent rotation so the cloned Kochappy keeps its own axes.
        appearance.rotation.set(
            -this.mesh.rotation.x,
            -this.mesh.rotation.y,
            -this.mesh.rotation.z,
        );
        appearance.rotationQuaternion = null;
        appearance.scaling.z = -1;
        appearance.isPickable = false;
        appearance.checkCollisions = false;
        this.mesh.material = null;
        this.mesh.isVisible = false;

        // Cloned meshes share source materials by default. Clone them so the
        // carcass stays valid when the original enemy is removed.
        const meshes = [appearance, ...appearance.getChildMeshes()];
        for (const mesh of meshes) {
            if (mesh.material) mesh.material = mesh.material.clone(`${mesh.material.name}.carcass.${this.id}`);
        }
    }
}
