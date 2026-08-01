import {
    Color3,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Shape } from "../../physics/figure";
import { Game } from "../../game";
import { Color } from "../../rendering/color";
import { Entity } from "../entity";
import { Player } from "../player/player";

export enum MinionState {
    free,
    following,
    held,
}

export abstract class Minion extends Entity {
    protected readonly baseColor: Color3 = new Color3(0, 0.95, 0);
    protected readonly freeColor: Color3 = new Color3(0.5, 0.95, 0.5);
    public state: MinionState = MinionState.free;
    public follower: Player | undefined = undefined;

    constructor(game: Game, position: Vector3) {
        super(game, "minion", Shape.Sphere, 0.25, position, { fall: true });
        this.speed = 3;
        this.collisionEventsEnabled = true;

        const material = new StandardMaterial(`${this.name}.material`, this.scene);
        material.backFaceCulling = false;
        this.mesh.material = material;
    }

    override update(deltaSeconds: number): void {
        super.update(deltaSeconds);

        if(this.state === MinionState.following && this.follower){
            const moveVector = this.calcMoveVector(this.follower.groundingPosition, deltaSeconds)
            this.moveFor(moveVector);
            this.checkCollisions = true;
        }
        else if(this.state === MinionState.held && this.follower){
            const playerPos = this.follower.position;
            const playerRot = this.follower.rotation.z;
            this.position = playerPos.add(new Vector3(
                this.follower.size / 2 * Math.cos(playerRot),
                this.follower.size / 2 * Math.sin(playerRot),
                this.follower.size / 4,
            ));
            this.checkCollisions = false;
        }
        else{
            this.checkCollisions = true;
        }

        // 色
        const material = this.mesh.material;
        if(material){
            Color.set(
                material as StandardMaterial, 
                this.getColor(), 
                { metallicity: 0.1, luminance: 0.3 },
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
            [MinionState.following]: this.baseColor,
            [MinionState.held]: this.baseColor,
            [MinionState.free]: this.freeColor,
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
        return this.state == MinionState.free;
    }

    public startFollowing(player: Player){
        if(this.state == MinionState.free){
            this.state = MinionState.following;
            this.follower = player;
            this.velocity.z = 1;
        }
    }
    public startHeld(player: Player){
        this.state = MinionState.held;
        this.follower = player;
    }
}
