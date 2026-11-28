import { Vector3 } from "#vendor/babylon";
import { Shape } from "../../physics/figure";
import { Game } from "../../game";
import { Entity } from "../entity";
import { Block } from "../block";
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
import { Enemy } from "../enemy/enemy";
import { MinionColor, minionColorToColor3 } from "./color";
import { Plant } from "./parts/plant";
import { SeedMotion } from "./seedMotion";
import { MinionAppearance } from "./appearance";
import { MinionRotation } from "./rotation";
import { SoulEffect } from "../../effects/soulEffect";
import {
    separateFromNearbyCarriables,
    separateFromOverlappingEntities,
    separateFromOverlappingMinions,
} from "./separation";

export { MinionState } from "./state";

export abstract class Minion extends Entity {
    private static readonly BLOCK_WALL_NUDGE = 0.01;
    private static readonly BLOCK_WALL_CONTACT_TOLERANCE = 0.02;
    public static readonly COLOR_ORDER: readonly MinionColor[] = [
        MinionColor.red,
        MinionColor.yellow,
        MinionColor.blue,
    ];
    public static readonly FREE_SEARCH_DISTANCE = 0.75;
    public static readonly FREE_PICKUP_DISTANCE = 0.5;
    public static readonly FOLLOW_ENEMY_AVOIDANCE_DISTANCE = 0.75;

    protected static readonly _ATTACK_POWER: number = 1.0;
    private get attackPower(): number { return (this.constructor as typeof Minion)._ATTACK_POWER; }

    protected static readonly _MINION_COLOR: MinionColor = MinionColor.red;
    public get minionColor(){ return (this.constructor as typeof Minion)._MINION_COLOR; }
    private currentState: MinionState = MinionState.free;
    public get state(): MinionState { return this.currentState; }
    public set state(state: MinionState) {
        const previousState = this.currentState;
        if (previousState !== MinionState.thrown && state === MinionState.thrown) {
            this.rotationEffects.beginThrow(this.rotation);
        }
        this.currentState = state;
        if (previousState === MinionState.thrown && state !== MinionState.thrown) {
            this.rotationEffects.finishThrow(this.rotation);
        }
    }
    public follower: Player | null = null;
    public carried: Carriable | null = null;
    public attackTarget: Enemy | null = null;
    private attackElapsedSeconds = 0;
    private lastThrownPreviousPosition: Vector3 | null = null;
    private lastThrownCurrentPosition: Vector3 | null = null;
    private lastThrownWasDescending = false;
    private disbandTarget: Vector3 | null = null;
    private disbandRemainingSeconds = 0;
    private readonly seedMotion = new SeedMotion();
    private readonly appearance: MinionAppearance;
    private readonly rotationEffects = new MinionRotation();

    /**
     * Minionの更新時アクション
     */
    private readonly stateUpdateActions: MinionStateUpdateActions = {
        moveFor: (direction, ignoredEntities) => { this.moveFor(direction, { ignoredEntities }); },
        separateFromOverlappingEntities: deltaSeconds => separateFromOverlappingEntities(
            this, this.game.objects, deltaSeconds,
        ),
        getNearbyCarriables: maxDistance => this.getNearbyCarriables(maxDistance),
        getNearbyEnemies: maxDistance => this.getNearbyEnemies(maxDistance),
        tryBecomeCarrying: carriable => this.tryBecomeCarrying(carriable),
        tryBecomeAttacking: enemy => this.tryBecomeAttacking(enemy),
        damageAttackTarget: () => this.damageAttackTarget(),
        stopAttacking: () => this.stopAttacking(),
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

        // 葉っぱパーツ
        const plant = new Plant(this.scene, this);
        this.appearance = new MinionAppearance(this.mesh, plant, this.name, this.scene);
    }

    override update(deltaSeconds: number): void {
        this.lastThrownPreviousPosition = null;
        this.lastThrownCurrentPosition = null;
        this.lastThrownWasDescending = false;

        if (this.state === MinionState.eaten) {
            this.updateColor();
            return;
        }

        if (this.state === MinionState.seed || this.state === MinionState.buried) {
            if (this.state === MinionState.seed) {
                this.updateSeed(deltaSeconds);
            }
            this.updateColor();
            return;
        }

        const positionBeforePhysicsUpdate = this.position.clone();
        super.update(deltaSeconds);
        if (this.state === MinionState.thrown) {
            this.lastThrownPreviousPosition = positionBeforePhysicsUpdate;
            this.lastThrownCurrentPosition = this.position.clone();
            this.lastThrownWasDescending = this.prevVelocity.z < 0;
        }
        const positionBeforeStateUpdate = this.position.clone();
        updateMinionState(this, deltaSeconds, this.stateUpdateActions);
        if ([
                MinionState.free,
                MinionState.following,
                MinionState.carrying,
                MinionState.attack,
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
        this.appearance.update(this.minionColor, this.state);
    }

    /** Whether the most recent thrown update ended in a downward landing on an Enemy's top. */
    public wasThrownOntoTopOf(enemy: Enemy): boolean {
        const previousPosition = this.lastThrownPreviousPosition;
        const currentPosition = this.lastThrownCurrentPosition;
        if (!previousPosition || !currentPosition || !this.lastThrownWasDescending) return false;

        if (enemy.shape === Shape.Sphere) {
            return currentPosition.z >= enemy.position.z;
        }

        const enemyTop = enemy.topPosition.z;
        const previousBottom = previousPosition.z - this.size / 2;
        const currentBottom = currentPosition.z - this.size / 2;
        const tolerance = 1e-4;
        return previousBottom >= enemyTop - tolerance
            && currentBottom <= enemyTop + tolerance;
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
        const actual = super.moveFor(dir, {
            ...options,
            strict: this.state == MinionState.thrown,
        });
        if (this.wasMovementBlocked(dir, actual)) {
            const escape = this.getBlockWallEscape(dir, options.ignoredEntities);
            if (escape) {
                if (escape.overlapping) {
                    // Collision movement cannot escape an existing overlap, so resolve it directly.
                    this.position.addInPlace(escape.displacement);
                } else {
                    super.moveFor(escape.displacement, options);
                }
            }
        }
        return actual;
    }

    private wasMovementBlocked(requested: Vector3, actual: Vector3): boolean {
        const requestedLength = Math.hypot(requested.x, requested.y);
        if (requestedLength <= Number.EPSILON) return false;
        const actualAlongRequest = (actual.x * requested.x + actual.y * requested.y) / requestedLength;
        return actualAlongRequest < requestedLength - this.size * 0.05;
    }

    private getBlockWallEscape(
        requested: Vector3,
        ignoredEntities: readonly Entity[] = [],
    ): { displacement: Vector3; overlapping: boolean } | null {
        const radius = this.size / 2;
        for (const entity of this.game.objects) {
            if (!(entity instanceof Block) || !entity.checkCollisions || ignoredEntities.includes(entity)) {
                continue;
            }
            const half = entity.size / 2;
            const dx = this.position.x - entity.position.x;
            const dy = this.position.y - entity.position.y;
            if (Math.abs(this.position.z - entity.position.z) >= radius + half) continue;

            let awayX = 0;
            let awayY = 0;
            let penetration: number;
            const outsideX = Math.abs(dx) > half;
            const outsideY = Math.abs(dy) > half;
            if (!outsideX && !outsideY) {
                // The center is over the block footprint. Exit through its nearest side.
                const clearX = half - Math.abs(dx);
                const clearY = half - Math.abs(dy);
                if (clearX <= clearY) {
                    awayX = dx === 0 ? -Math.sign(requested.x || 1) : Math.sign(dx);
                    penetration = clearX + radius;
                } else {
                    awayY = dy === 0 ? -Math.sign(requested.y || 1) : Math.sign(dy);
                    penetration = clearY + radius;
                }
            } else {
                const closestX = Math.max(-half, Math.min(half, dx));
                const closestY = Math.max(-half, Math.min(half, dy));
                awayX = dx - closestX;
                awayY = dy - closestY;
                const distance = Math.hypot(awayX, awayY);
                if (distance <= Number.EPSILON) continue;
                penetration = radius - distance;
                awayX /= distance;
                awayY /= distance;
            }

            const overlapping = penetration >= 0;
            if (!overlapping) {
                const gap = -penetration;
                if (gap > Minion.BLOCK_WALL_CONTACT_TOLERANCE) continue;
                if (requested.x * awayX + requested.y * awayY >= 0) continue;
            }
            const distance = overlapping
                ? penetration + Minion.BLOCK_WALL_NUDGE
                : Minion.BLOCK_WALL_NUDGE;
            return {
                displacement: new Vector3(awayX * distance, awayY * distance, 0),
                overlapping,
            };
        }
        return null;
    }

    override onCollisionEnter(entity: Entity): void {
        if(entity instanceof Player){
            if(this.state == MinionState.free){
                this.becomeFollowing(entity, 'プレイヤーと衝突');
            }
        }
    }

    public becomeFree(){
        this.state = MinionState.free;
        this.velocity = Vector3.Zero();
        this.checkCollisions = true;
        separateFromOverlappingMinions(this, this.game.objects);
    }

    /** Kochappy の捕食対象になる。捕食中は状態更新と衝突を停止する。 */
    public becomeEaten(): void {
        this.follower = null;
        this.carried = null;
        this.attackTarget = null;
        this.attackElapsedSeconds = 0;
        this.clearDisbandMovement();
        this.state = MinionState.eaten;
        this.velocity = Vector3.Zero();
        this.checkCollisions = false;
    }

    /** 捕食中の Minion を指定した接地位置へ移動する。 */
    public moveToEatenPosition(position: Vector3): void {
        if (this.state !== MinionState.eaten) return;
        this.groundingPosition = position.clone();
    }

    /** 捕食者が捕食中に倒された場合に呼ぶ。 */
    public dieFromEating(): void {
        const deathPosition = this.position.clone();
        this.remove();
        new SoulEffect(this.game, deathPosition, {
            color: minionColorToColor3(this.minionColor),
            zScale: 2,
        });
    }

    public becomeDisbanded(target: Vector3): void {
        if (this.state !== MinionState.following) return;
        this.follower = null;
        this.state = MinionState.free;
        this.velocity = Vector3.Zero();
        this.disbandTarget = target.clone();
        this.disbandRemainingSeconds = 3;
        separateFromOverlappingMinions(this, this.game.objects);
    }

    /** Disband steering time remaining for free-state updates. */
    public takeDisbandMoveTime(deltaSeconds: number): number {
        if (!this.disbandTarget || this.disbandRemainingSeconds <= 0) {
            this.disbandTarget = null;
            return 0;
        }
        const moveTime = Math.min(deltaSeconds, this.disbandRemainingSeconds);
        this.disbandRemainingSeconds -= moveTime;
        if (this.disbandRemainingSeconds <= 0) this.disbandTarget = null;
        return moveTime;
    }

    public getDisbandTarget(): Vector3 | null {
        return this.disbandTarget;
    }

    public clearDisbandMovement(): void {
        this.disbandTarget = null;
        this.disbandRemainingSeconds = 0;
    }

    protected override isBlockedBy(entity: Entity): boolean {
        // 運搬中は他の運搬物、Minion、Playerを通り抜ける
        if(
            this.state === MinionState.carrying
            && (
                entity instanceof Carriable
                || entity instanceof Minion
                || entity instanceof Player
                || entity instanceof Enemy
            )
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
        if(this.state == MinionState.free || this.state == MinionState.carrying || this.state === MinionState.attack){
            this.carried = null;
            this.attackTarget = null;
            this.attackElapsedSeconds = 0;
            this.clearDisbandMovement();
            this.state = MinionState.following;
            this.follower = player;
            this.velocity = new Vector3(0, 0, 1);
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
    public becomeFollowingFromHeld(player: Player): void {
        if (this.state !== MinionState.held) return;
        this.position = calcHeldPosition(player.position, player.rotation.z + Math.PI);
        this.state = MinionState.following;
        this.follower = player;
        this.velocity = new Vector3(0, 0, 1);
    }
    private updateHeldPosition(){
        if(!this.follower) return;
        this.position = calcHeldPosition(this.follower.position, this.follower.rotation.z);
    }

    /** 投擲中は水平移動に合わせて転がるように回転する */
    private rotateWhileThrown(displacement: Vector3): void {
        this.rotationEffects.updateThrown(this.rotation, displacement, this.size);
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

    public tryBecomeAttacking(enemy: Enemy): boolean {
        if (this.state !== MinionState.free || !enemy.isAlive) return false;
        this.attackTarget = enemy;
        this.attackElapsedSeconds = 0;
        this.state = MinionState.attack;
        return true;
    }

    private damageAttackTarget(): void {
        this.attackTarget?.damage(this.attackPower);
    }

    private stopAttacking(): void {
        this.attackTarget = null;
        this.attackElapsedSeconds = 0;
        this.becomeFree();
    }

    public updateAttack(deltaSeconds: number, damageAttackTarget: () => void): void {
        this.attackElapsedSeconds += deltaSeconds;
        while (
            this.attackElapsedSeconds >= 0.5
            && this.state === MinionState.attack
            && this.attackTarget?.isAlive
        ) {
            this.attackElapsedSeconds -= 0.5;
            damageAttackTarget();
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
     * @param maxDistance - この距離以下の運搬物を探す
     */
    private getNearbyCarriables(maxDistance: number): Carriable[] {
        return this.getNearbyEntities(
            maxDistance,
            (object): object is Carriable =>
                object instanceof Carriable && object.canAcceptCarrier,
        );
    }

    private getNearbyEnemies(maxDistance: number): Enemy[] {
        return this.getNearbyEntities(
            maxDistance,
            (object): object is Enemy => object instanceof Enemy && object.isAlive,
        );
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
