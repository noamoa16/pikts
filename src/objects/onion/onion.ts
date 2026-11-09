import {
    Color3,
    CreateDisc,
    Mesh,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { Shape } from "../../physics/figure";
import { getGlowLayer } from "../../rendering/glowLayer";
import { Entity } from "../entity";
import { MinionColor, minionColorToColor3 } from "../minion/color";
import { Base } from "./parts/base";
import { Pillar } from "./parts/pillar";

export abstract class Onion extends Entity {
    protected static readonly _SIZE = 2.5;

    private get baseColor(): Color3 {
        const color = minionColorToColor3(this.minionColor);
        return new Color3(
            color.r > 0 ? 0.95 : 0.2,
            color.g > 0 ? 0.95 : 0.2,
            color.b > 0 ? 0.95 : 0.2,
        );
    }
    private readonly parts: Mesh;
    private jumpTime: number | null = null;
    private static readonly JUMP_INITIAL_VELOCITY = 1.5;
    private static readonly JUMP_GRAVITY = 5;
    protected static readonly _MINION_COLOR: MinionColor = MinionColor.red;
    public get minionColor(){ return (this.constructor as typeof Onion)._MINION_COLOR; }

    public get absorbingStartPoint() { return this.groundingPosition.clone(); }
    public get absorbingEndPoint() {
        return this.groundingPosition.add(new Vector3(0, 0, this.size * 1 / 2));
    }

    constructor(game: Game, position: Vector3) {
        super(game, "onion", Shape.Sphere, Onion._SIZE, position, { fall: false });
        this.isVisible = false;
        this.mesh.checkCollisions = false;

        // Onion 本体の座標や当たり判定を変えず、見た目のパーツだけ動かす。
        this.parts = new Mesh(`${this.name}.parts`, this.scene);
        this.parts.parent = this.mesh;

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

        getGlowLayer(this.scene).addIncludedOnlyMesh(groundCircle);

        // 球体作成
        new Base(this.scene, this, this.baseColor);

        // 足作成
        for(let i = 0; i < 3; i++){
            new Pillar(this.scene, this, i, this.baseColor);
        }
    }

    override update(deltaSeconds: number): void {
        if(this.jumpTime === null) return;

        this.jumpTime += deltaSeconds;
        const velocity = Onion.JUMP_INITIAL_VELOCITY;
        const gravity = Onion.JUMP_GRAVITY;
        const duration = 2 * velocity / gravity;
        if(this.jumpTime >= duration){
            this.jumpTime = null;
            this.parts.position.z = 0;
            return;
        }
        this.parts.position.z = velocity * this.jumpTime - gravity * this.jumpTime ** 2 / 2;
    }

    /** Carriable が届いたときにパーツを放物線状に跳ねさせる */
    public jump(): void {
        const velocity = Onion.JUMP_INITIAL_VELOCITY;
        const gravity = Onion.JUMP_GRAVITY;
        const height = this.parts.position.z;
        const discriminant = Math.max(0, velocity ** 2 - 2 * gravity * height);
        // 同じ高さに対応する時刻のうち、小さい方を選んで上昇中に戻す。
        this.jumpTime = (velocity - Math.sqrt(discriminant)) / gravity;
    }

    public get partsMesh(): Mesh { return this.parts; }
}
