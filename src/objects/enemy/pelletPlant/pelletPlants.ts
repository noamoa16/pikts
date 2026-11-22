import { Color3, CreateCylinder, StandardMaterial, Vector3 } from "#vendor/babylon";
import { Game } from "../../../game";
import { Color } from "../../../rendering/color";
import {
    RED_PELLET_COLOR,
    YELLOW_PELLET_COLOR,
    BLUE_PELLET_COLOR,
    RedPellet1,
    YellowPellet1,
    BluePellet1,
} from "../../carriable/pellets";
import { createPelletAppearance } from "../../carriable/pellet";
import { Enemy } from "../enemy";

const FLOWER_PETAL_COUNT = 8;

export abstract class PelletPlant1 extends Enemy {
    private pelletMaterial!: StandardMaterial;

    constructor(game: Game, position: Vector3){
        const size = 1 / 8;
        super(game, position, size, 10, 4 * size);

        // Stem
        const stemMaterial = new StandardMaterial(`${this.name}.stem.material`, game.scene);
        stemMaterial.backFaceCulling = false;
        Color.set(stemMaterial, new Color3(0, 0.4, 0), {
            metallicity: 0.05,
            luminance: 0.1,
        });
        this.mesh.material = stemMaterial;

        // Pellet
        const pelletSize = (Math.floor(Math.sqrt(1)) + 1) * 3 / 16;
        const pellet = CreateCylinder(
            `${this.name}.${this.id}.pelletAppearance`,
            { height: pelletSize * 3 / 8, diameter: pelletSize },
            game.scene,
        );
        pellet.parent = this.mesh;
        pellet.rotation.x = -Math.PI / 2; // 正面を向くようにする
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
            this.pelletColor,
            "positiveY",
        );
        this.pelletMaterial = pellet.material as StandardMaterial;

        // Flower
        const flowerMaterial = new StandardMaterial(
            `${pellet.name}.flower.material`,
            game.scene,
        );
        flowerMaterial.diffuseColor = Color3.White();
        const theta = 2 * Math.PI / FLOWER_PETAL_COUNT;
        const petalRadius = (pelletSize / 2) * Math.sin(theta / 2);
        for(let k = 0; k < FLOWER_PETAL_COUNT; k++){
            const angle = k * theta;
            const flowerPetal = CreateCylinder(
                `${pellet.name}.flowerAppearance.${k}`,
                {
                    height: pelletSize * 3 / 16,
                    diameter: petalRadius * 2,
                },
                game.scene,
            );
            flowerPetal.parent = pellet;
            flowerPetal.position = new Vector3(
                pelletSize / 2 * Math.cos(angle),
                0,
                pelletSize / 2 * Math.sin(angle),
            );
            flowerPetal.material = flowerMaterial;
            flowerPetal.isPickable = false;
            flowerPetal.checkCollisions = false;
        }
    }
    protected override die(){
        // Pellet をドロップする
        const pelletPosition = this.position.add(new Vector3(0, 0, this.size / 4));
        super.die();
        this.dropPellet(pelletPosition);
    }

    protected get pelletColor(): Color3 {
        return RED_PELLET_COLOR;
    }
    protected abstract dropPellet(position: Vector3): void;

    protected updatePelletColor(): void {
        Color.set(this.pelletMaterial, this.pelletColor);
    }
}

export class RedPelletPlant1 extends PelletPlant1 {
    protected get pelletColor(): Color3 {
        return RED_PELLET_COLOR;
    }

    protected dropPellet(position: Vector3): void {
        new RedPellet1(this.game, position);
    }
}

export class YellowRedPelletPlant1 extends PelletPlant1 {
    protected get pelletColor(): Color3 {
        return YELLOW_PELLET_COLOR;
    }

    protected dropPellet(position: Vector3): void {
        new YellowPellet1(this.game, position);
    }
}

export class BlueRedPelletPlant1 extends PelletPlant1 {
    protected get pelletColor(): Color3 {
        return BLUE_PELLET_COLOR;
    }

    protected dropPellet(position: Vector3): void {
        new BluePellet1(this.game, position);
    }
}

export class RandomPelletPlant1 extends PelletPlant1 {
    private static readonly RANDOM_PELLET_PLANT_COLOR_PERIOD = 1.5;

    private colorIndex = 0;
    private elapsedSeconds = 0;

    protected get pelletColor(): Color3 {
        switch (this.colorIndex ?? 0) {
            case 0:
                return RED_PELLET_COLOR;
            case 1:
                return YELLOW_PELLET_COLOR;
            case 2:
                return BLUE_PELLET_COLOR;
        }
        return RED_PELLET_COLOR;
    }

    public override update(deltaSeconds: number): void {
        super.update(deltaSeconds);
        this.elapsedSeconds += deltaSeconds;
        while (this.elapsedSeconds >= RandomPelletPlant1.RANDOM_PELLET_PLANT_COLOR_PERIOD) {
            this.elapsedSeconds -= RandomPelletPlant1.RANDOM_PELLET_PLANT_COLOR_PERIOD;
            this.colorIndex = (this.colorIndex + 1) % 3;
            this.updatePelletColor();
        }
    }

    protected dropPellet(position: Vector3): void {
        switch (this.colorIndex) {
            case 0:
                new RedPellet1(this.game, position);
                break;
            case 1:
                new YellowPellet1(this.game, position);
                break;
            case 2:
                new BluePellet1(this.game, position);
                break;
        }
    }
}
