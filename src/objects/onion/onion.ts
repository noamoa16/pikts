import {
    Color3,
    CreateDisc,
    GlowLayer,
    Mesh,
    StandardMaterial,
    type Scene,
    Vector3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { Shape } from "../../physics/figure";
import { Entity } from "../entity";
import { MinionColor } from "../minion/color";
import { Base } from "./base";
import { Pillar } from "./pillar";

export abstract class Onion extends Entity {
    protected static readonly _SIZE = 2.5;
    private static readonly glowLayers = new WeakMap<Scene, GlowLayer>();

    protected static readonly _BASE_COLOR: Color3 = new Color3(0, 0.95, 0);
    private get baseColor(){ return (this.constructor as typeof Onion)._BASE_COLOR; }
    protected static readonly _MINION_COLOR: MinionColor = MinionColor.red;
    public get minionColor(){ return (this.constructor as typeof Onion)._MINION_COLOR; }

    constructor(game: Game, position: Vector3) {
        super(game, "onion", Shape.Sphere, Onion._SIZE, position, { fall: false });
        this.isVisible = false;
        this.mesh.checkCollisions = false;

        // 地面の発光円
        const groundCircle = CreateDisc(
            `${this.name}.ground-circle`,
            {
                radius: Onion._SIZE * 1 / 8,
                tessellation: 32,
                sideOrientation: Mesh.DOUBLESIDE,
            },
            this.scene,
        );
        groundCircle.position = this.groundingPosition.clone();
        groundCircle.isPickable = false;
        groundCircle.checkCollisions = false;
        const groundCircleMaterial = new StandardMaterial(`${this.name}.ground-circle.material`, this.scene);
        groundCircleMaterial.disableLighting = true;
        groundCircleMaterial.backFaceCulling = false;
        groundCircleMaterial.zOffset = -1;
        groundCircleMaterial.diffuseColor = this.baseColor;
        groundCircleMaterial.emissiveColor = this.baseColor.scale(1.0);
        groundCircleMaterial.alpha = 0.25;
        groundCircle.material = groundCircleMaterial;

        let glowLayer = Onion.glowLayers.get(this.scene);
        if (!glowLayer) {
            glowLayer = new GlowLayer("onion-glow", this.scene);
            Onion.glowLayers.set(this.scene, glowLayer);
        }
        glowLayer.addIncludedOnlyMesh(groundCircle);

        // 球体作成
        new Base(this.scene, this, this.baseColor);

        // 足作成
        for(let i = 0; i < 3; i++){
            new Pillar(this.scene, this, i, this.baseColor);
        }
    }

    override update(_: number): void {
        // 何もしない
    }
}
