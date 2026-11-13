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
import { Cursor } from "../player/parts/cursor";
import { MinionState } from "./state";
import { updateMinionState, type MinionStateUpdateActions } from "./updateState";
import {
    calcHeldPosition,
    calcThrownSafeInitialPosition,
    calcThrownInitialVelocity,
    canMinionSpawnAt,
} from "./throw";
import { Random } from "../../core/random";
import { Carriable } from "../carriable/carriable";
import { MinionColor, minionColorToColor3 } from "./color";
import { Plant } from "./parts/plant";
import { SeedMotion } from "./seedMotion";
import {
    separateFromNearbyCarriables,
    separateFromOverlappingEntities,
    separateFromOverlappingMinions,
} from "./separation";

export { MinionState } from "./state";

export abstract class Minion extends Entity {
    protected static readonly _MINION_COLOR: MinionColor = MinionColor.red;
    public get minionColor(){ return (this.constructor as typeof Minion)._MINION_COLOR; }
    private get baseColor(): Color3 {
        const color = minionColorToColor3(this.minionColor);
        return new Color3(color.r * 0.95, color.g * 0.95, color.b * 0.95);
    }
    private get freeColor(): Color3 {
        const color = minionColorToColor3(this.minionColor);
        return new Color3(
            color.r > 0 ? 0.95 : 0.5,
            color.g > 0 ? 0.95 : 0.5,
            color.b > 0 ? 0.95 : 0.5,
        );
    }
    public state: MinionState = MinionState.free;
    public follower: Player | null = null;
    public carried: Carriable | null = null;
    private readonly seedMotion = new SeedMotion();
    private readonly plant: Plant;

    /**
     * Minionの更新時アクション
     */
    private readonly stateUpdateActions: MinionStateUpdateActions = {
        moveFor: (direction, ignoredEntities) => { this.moveFor(direction, { ignoredEntities }); },
        separateFromOverlappingEntities: deltaSeconds => separateFromOverlappingEntities(
            this, this.game.objects, deltaSeconds,
        ),
        getNearbyCarriables: maxDistance => this.getNearbyCarriables(maxDistance),
        tryBecomeCarrying: carriable => this.tryBecomeCarrying(carriable),
        stopCarrying: () => this.stopCarrying(),
        stopSelfMovement: () => {
            this.velocity.x = 0;
            this.velocity.y = 0;
        },
        stopMovement: () => { this.velocity = Vector3.Zero(); },
        updateHeldPosition: () => this.updateHeldPosition(),
        isThrownLanded: () => this.velocity.z === 0 || this.velocity.z > this.prevVelocity.z,
        finishThrow: () => {
            console.log('Minion 着地', {
                id: this.id,
                position: this.position,
                velocity: this.velocity.clone(),
                prevVelocity: this.prevVelocity.clone(),
            });
            this.becomeFree();
        },
        setCollisionsEnabled: enabled => { this.checkCollisions = enabled; },
    };

    // 掴み/投げ
    protected static readonly _THROWN_MAX_HEIGHT: number = 2.25;
    private get thrownMaxHeight(){ return (this.constructor as typeof Minion)._THROWN_MAX_HEIGHT; }

    constructor(game: Game, position: Vector3) {
        super(game, "minion", Shape.Sphere, 0.125, position, { fall: true });
        this.mesh.isPickable = true;
        this.speed = 3;
        this.collisionEventsEnabled = true;

        const material = new StandardMaterial(`${this.name}.material`, this.scene);
        material.backFaceCulling = false;
        this.mesh.material = material;

        // 葉っぱパーツ
        this.plant = new Plant(this.scene, this);
    }

    override update(deltaSeconds: number): void {
        if (this.state === MinionState.seed || this.state === MinionState.buried) {
            if (this.state === MinionState.seed) {
                this.updateSeed(deltaSeconds);
            }
            this.updateColor();
            return;
        }

        const positionBeforePhysicsUpdate = this.position.clone();
        super.update(deltaSeconds);
        const positionBeforeStateUpdate = this.position.clone();
        updateMinionState(this, deltaSeconds, this.stateUpdateActions);
        if ([
                MinionState.free,
                MinionState.following,
                MinionState.carrying,
            ].includes(this.state)) {
            separateFromNearbyCarriables(this, this.game.objects, deltaSeconds);
        }

        if (this.state === MinionState.thrown) {
            this.rotateWhileThrown(this.position.subtract(positionBeforePhysicsUpdate));
        }
        else if (this.state !== MinionState.held) {
            this.rotateToDirection(this.position.subtract(positionBeforeStateUpdate), deltaSeconds);
        }

        this.updateColor();
    }

    private updateColor(): void {
        this.plant.setBuriedGlow(
            this.state === MinionState.buried
                ? minionColorToColor3(this.minionColor)
                : null,
        );

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

    /** Onion から生まれた直後の軌道を設定する */
    public becomeSeed(startPoint: Vector3, endPoint: Vector3, radius: number): void {
        this.state = MinionState.seed;
        this.seedMotion.start(startPoint, endPoint, radius);
        this.velocity = Vector3.Zero();
        this.checkCollisions = false;
        this.groundingPosition = endPoint.clone();
        const rotation = this.seedMotion.initialRotation();
        this.rotation.x = rotation.x;
        this.rotation.y = rotation.y;
    }

    private updateSeed(deltaSeconds: number): void {
        const update = this.seedMotion.update(deltaSeconds);
        if (!update) {
            this.becomeBuried();
            return;
        }
        this.groundingPosition = update.position;
        this.rotation.x = update.rotationX;
        this.rotation.y = update.rotationY;
        this.velocity = Vector3.Zero();

        if (update.finished) this.becomeBuried();
    }

    private becomeBuried(): void {
        this.state = MinionState.buried;
        this.velocity = Vector3.Zero();
        this.checkCollisions = false;
        const buriedOriginZ = this.seedMotion.buriedOriginZ;
        if (buriedOriginZ !== null) this.position.z = buriedOriginZ;
    }

    public becomePickedFromBuried(player: Player): void {
        if (this.state !== MinionState.buried) return;
        this.carried = null;
        this.state = MinionState.following;
        this.follower = player;
        this.position.z += this.size * 3 / 2;
        this.velocity = new Vector3(0, 0, 3);
        this.checkCollisions = true;
    }

    public override moveFor(
        dir: Vector3,
        options: { ignoredEntities?: readonly Entity[]; strict?: boolean } = {}
    ): Vector3 {
        // 投げ状態のときはスロープに触れたときに移動を止めるようにする
        return super.moveFor(dir, {
            ...options,
            strict: this.state == MinionState.thrown,
        });
    }

    override onCollisionEnter(entity: Entity): void {
        if(entity instanceof Player){
            if(this.state == MinionState.free){
                this.becomeFollowing(entity, 'プレイヤーと衝突');
            }
        }
    }

    private getColor(): Color3{
        return {
            [MinionState.free]: this.freeColor,
            [MinionState.following]: this.baseColor,
            [MinionState.held]: this.baseColor,
            [MinionState.thrown]: this.baseColor,
            [MinionState.carrying]: this.baseColor,
            [MinionState.seed]: this.baseColor,
            [MinionState.buried]: this.baseColor,
        }[this.state];
    }

    public becomeFree(){
        this.state = MinionState.free;
        this.velocity = Vector3.Zero();
        separateFromOverlappingMinions(this, this.game.objects);
    }

    protected override isBlockedBy(entity: Entity): boolean {
        // 運搬中は他の運搬物、Minion、Playerを通り抜ける
        if(
            this.state === MinionState.carrying
            && (entity instanceof Carriable || entity instanceof Minion || entity instanceof Player)
        ){
            return false;
        }
        // 投げ状態であれば、他のMinionを無視して移動する
        if(this.state === MinionState.thrown && entity instanceof Minion){
            return false;
        }
        return super.isBlockedBy(entity);
    }

    public becomeFollowing(player: Player, src?: string){
        if(this.state == MinionState.free || this.state == MinionState.carrying){
            this.carried = null;
            this.state = MinionState.following;
            this.follower = player;
            this.velocity.z = 1;
        }
        console.log('Minion.becomeFollowing', {
            id: this.id,
            src,
            position: this.position.clone(),
        });
    }
    public becomeHeld(player: Player){
        this.state = MinionState.held;
        this.follower = player;
        console.log('Minion.becomeHeld', {
            id: this.id,
            beforePosition: this.position.clone(),
        });
    }
    private updateHeldPosition(){
        if(!this.follower) return;
        this.position = calcHeldPosition(this.follower.position, this.follower.rotation.z);
    }

    /** 投擲中は水平移動に合わせて転がるように回転する */
    private rotateWhileThrown(displacement: Vector3): void {
        const radius = this.size / 2;
        if (radius <= 0) return;

        const ROTATION_RATE = 0.25;
        this.rotation.x -= displacement.y / radius * ROTATION_RATE;
        this.rotation.y += displacement.x / radius * ROTATION_RATE;
    }

    public tryBecomeCarrying(carriable: Carriable): boolean{
        if(this.state == MinionState.free && carriable.tryAddCarrier(this)){
            this.state = MinionState.carrying;
            this.carried = carriable;
            return true;
        }
        else{
            return false;
        }
    }

    private stopCarrying(): void {
        const carriable = this.carried;
        this.carried = null;
        carriable?.removeCarrier(this);
        this.becomeFree();
    }

    /**
     * 近くの運搬物を探し、距離が近い順に返す
     * @param _maxDistance - この距離以下の運搬物を探す
     */
    private getNearbyCarriables(maxDistance: number): Carriable[] {
        return this.game.objects
            .filter((object): object is Carriable =>
                object instanceof Carriable && object.canAcceptCarrier,
            )
            .map(carriable => ({
                carriable,
                distance: Vector3.Distance(
                    carriable.position, this.position,
                ) - carriable.radius,
            }))
            .filter(candidate => candidate.distance <= maxDistance)
            .sort((a, b) => a.distance - b.distance)
            .map(candidate => candidate.carriable);
    }
    
    /** Minionを投げる際の安全な初期位置 */
    private calcThrownSafeInitialPosition(): Vector3 {
        if(!this.follower){
            throw new Error("Player should not be null");
        }

        return calcThrownSafeInitialPosition({
            playerPosition: this.follower.position,
            playerRotation: this.follower.rotation.z,
            cursorPosition: this.follower.cursor.unrotatedPosition,
            playerSpeed: Player.SPEED,
            gravityZ: this.scene.gravity.z,
            thrownMaxHeight: this.thrownMaxHeight,
            minionSize: this.size,
            cursorDistance: Cursor.CURSOR_DISTANCE,
            canSpawnAt: position => canMinionSpawnAt(
                position, this.id, this.size, this.game.objects,
            ),
        });
    }
    public becomeThrown(){
        this.state = MinionState.thrown;
        if(!this.follower){
            throw new Error("Player should not be null");
        }
        this.position = this.calcThrownSafeInitialPosition();

        const MAX_ANGLE = Math.PI / 128;

        // Minionごとにベクトルを少しずらして重ならないようにする
        const deltaAngle = Random.uniform(-MAX_ANGLE, MAX_ANGLE);
        const velocity = calcThrownInitialVelocity(
            this.follower.cursor.unrotatedPosition,
            this.follower.velocity,
            Player.SPEED,
            this.scene.gravity.z,
            this.thrownMaxHeight,
            deltaAngle,
        );
        this.velocity = velocity.clone();
        console.log('Minion.becomeThrown', {
            id: this.id,
            velocity,
            cursorVector: this.follower.cursor.unrotatedPosition,
        });
        this.follower = null;
    }
}

/** Carriable の吸収から生成する、色を指定できる Minion */
export class SeedMinion extends Minion {
    constructor(game: Game, position: Vector3, private readonly seedColor: MinionColor) {
        super(game, position);
    }

    override get minionColor(): MinionColor {
        return this.seedColor;
    }
}
