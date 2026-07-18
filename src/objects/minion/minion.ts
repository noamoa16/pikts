import {
    Color3,
    CreateSphere,
    Scene,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Color } from "../../rendering/color";
import { Entity } from "../entity";
import { Player } from "../player";

enum State {
    free,
    following,
}

export abstract class Minion extends Entity {
    private readonly scene: Scene;
    protected readonly baseColor: Color3 = new Color3(0, 0.95, 0);
    protected readonly freeColor: Color3 = new Color3(0.5, 0.95, 0.5);
    public state: State = State.free;
    public follower: Player | undefined = undefined;

    constructor(scene: Scene, position: Vector3) {
        super("minion", { fall: true });
        this.scene = scene;
        this.size = 0.25;
        this.speed = 3;
        this.mesh = CreateSphere(this.name, { diameter: this.size }, scene);
        this.groundingPosition = position.clone();
        this.mesh.ellipsoid = new Vector3(
            this.size / 2,
            this.size / 2,
            this.size / 2,
        );
        this.collisionEventsEnabled = true;

        const material = new StandardMaterial(`${this.name}.material`, scene);
        material.backFaceCulling = false;
        this.mesh.material = material;
    }

    override update(deltaSeconds: number): void {
        const horizontalDisplacement =
            this.state === State.following && this.follower
                ? this.calcMoveVector(this.follower.groundingPosition, deltaSeconds)
                : Vector3.Zero();
        const gravityDisplacement = this.fall
            ? this.scene.gravity.scale(deltaSeconds)
            : Vector3.Zero();
        this.mesh.moveWithCollisions(horizontalDisplacement.add(gravityDisplacement));

        // 色
        const material = this.mesh.material;
        if(material){
            Color.set(
                material as StandardMaterial, 
                this.getColor(), 
                { metalicity: 0.1, luminance: 0.3 },
            );
        }
    }

    override onCollisionEnter(entity: Entity): void {
        if(entity instanceof Player){
            if(this.isFree){
                this.startFollowing(entity);
            }
        }
    }

    private getColor(): Color3{
        return {
            [State.following]: this.baseColor,
            [State.free]: this.freeColor,
        }[this.state];
    }

    /** プレイヤーに向かう移動ベクトルを計算 */
    private calcMoveVector(playerPosition: Vector3, deltaSeconds: number): Vector3 {
        const MAX_DISTANCE = 1.0;
        const MIN_DISTANCE = 0.5;
        const distance = Vector3.Distance(this.groundingPosition, playerPosition);

        // 距離が遠すぎる場合は近付こうとする
        if (distance > MAX_DISTANCE) {
            return playerPosition
                .subtract(this.groundingPosition)
                .normalize()
                .scale(Math.min(this.speed * deltaSeconds, distance - MAX_DISTANCE));
        }
        //距離が近すぎる場合は離れようとする
        if (distance < MIN_DISTANCE) {
            return this.groundingPosition
                .subtract(playerPosition)
                .normalize()
                .scale(Math.min(this.speed * deltaSeconds, MIN_DISTANCE - distance));
        }

        return Vector3.Zero();
    }

    public get isFree(): boolean{
        return this.state == State.free;
    }

    private startFollowing(player: Player){
        this.state = State.following;
        this.follower = player;
    }
}
