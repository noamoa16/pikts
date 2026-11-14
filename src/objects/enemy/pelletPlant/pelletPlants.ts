import { Color3, StandardMaterial, Vector3 } from "#vendor/babylon";
import { Game } from "../../../game";
import { Color } from "../../../rendering/color";
import { Enemy } from "../enemy";

export class RedPelletPlant1 extends Enemy {
    constructor(game: Game, position: Vector3){
        const size = 1 / 8;
        super(game, position, size, 10, 4 * size);
        const stemMaterial = new StandardMaterial(`${this.name}.stem.material`, game.scene);
        stemMaterial.backFaceCulling = false;
        Color.set(stemMaterial, new Color3(0, 0.4, 0), {
            metallicity: 0.05,
            luminance: 0.1,
        });
        this.mesh.material = stemMaterial;
    }
    protected override die(){
        // TODO: RedPellet1 を position + new Vector3(0, 0, size / 4) に出現させる
        super.die();
    }
}
