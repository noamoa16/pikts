import { Color3, CreateCylinder, StandardMaterial, Vector3 } from "#vendor/babylon";
import { Game } from "../../../game";
import { Color } from "../../../rendering/color";
import { RED_PELLET_COLOR, RedPellet1 } from "../../carriable/pellets";
import { createPelletAppearance } from "../../carriable/pellet";
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

        const pelletSize = (Math.floor(Math.sqrt(1)) + 1) * 3 / 16;
        const pellet = CreateCylinder(
            `${this.name}.${this.id}.pelletAppearance`,
            { height: pelletSize * 3 / 8, diameter: pelletSize },
            game.scene,
        );
        pellet.parent = this.mesh;
        // Cancel the plant entity's rotation so the pellet cylinder's axis
        // stays on world Y, leaving its circular face in the XZ plane.
        pellet.rotation.x = -Math.PI / 2;
        this.mesh.computeWorldMatrix(true);
        pellet.computeWorldMatrix(true);
        pellet.setAbsolutePosition(this.topPosition.add(new Vector3(0, 0, size / 2)));
        pellet.isPickable = false;
        pellet.checkCollisions = false;
        createPelletAppearance(
            pellet,
            1,
            pelletSize,
            pellet.name,
            game.scene,
            RED_PELLET_COLOR,
            "positiveY",
        );
    }
    protected override die(){
        const pelletPosition = this.position.add(new Vector3(0, 0, this.size / 4));
        super.die();
        new RedPellet1(this.game, pelletPosition);
    }
}
