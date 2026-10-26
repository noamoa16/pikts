import {
    Color3,
    StandardMaterial,
    Vector2,
    Vector3,
} from "#vendor/babylon";
import { Shape, Sphere } from "../../physics/figure";
import { Game } from "../../game";
import { Color } from "../../rendering/color";
import { Entity } from "../entity";
import { Player } from "../player/player";
import { rotate2D, toVector2, toVector3 } from "../../core/math";
import { Cursor } from "../player/cursor";
import { MinionState } from "./state";
import { calcSeparationDirection } from "./movement";
import { updateMinionState, type MinionStateUpdateActions } from "./updateState";
import {
    calcHeldPosition,
    calcThrownInitialPosition,
    calcThrownInitialVelocity,
} from "./throw";
import { Random } from "../../core/random";
import { Carriable } from "../carriable/carriable";
import { MinionColor } from "./color";

export { MinionState } from "./state";

export abstract class Minion extends Entity {
    public static readonly minionColor: MinionColor = MinionColor.red;
    protected static readonly _BASE_COLOR: Color3 = new Color3(0, 0.95, 0);
    protected static readonly _FREE_COLOR: Color3 = new Color3(0.5, 0.95, 0.5);
    private get baseColor(){ return (this.constructor as typeof Minion)._BASE_COLOR; }
    private get freeColor(){ return (this.constructor as typeof Minion)._FREE_COLOR; }
    public state: MinionState = MinionState.free;
    public follower: Player | null = null;
    public carried: Carriable | null = null;

    /**
     * Minionの更新時アクション
     */
    private readonly stateUpdateActions: MinionStateUpdateActions = {
        moveFor: (direction, ignoredEntities) => { this.moveFor(direction, { ignoredEntities }); },
        separateFromOverlappingEntities: deltaSeconds => this.separateFromOverlappingEntities(deltaSeconds),
        getNearbyCarriables: maxDistance => this.getNearbyCarriables(maxDistance),
        tryBecomeCarrying: carriable => this.tryBecomeCarrying(carriable),
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
    }

    override update(deltaSeconds: number): void {
        super.update(deltaSeconds);
        updateMinionState(this, deltaSeconds, this.stateUpdateActions);
        if ([MinionState.free, MinionState.following, MinionState.carrying].includes(this.state)) {
            this.separateFromNearbyCarriables(deltaSeconds);
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

    protected moveFor(
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
        }[this.state];
    }

    /** 他の Figure と (x, y) 座標が重複するのを避けるように動く */
    private separateFromOverlappingEntities(deltaSeconds: number){
        const VELOCITY = 0.5;
        const DISTANCE_DELTA = 0.01;
        const MIN_DISTANCE_SQ = 0.000001;
        const MAX_ANGLE = Math.PI / 8;
        let dir = new Vector2();
        const ignoredEntities: Entity[] = [];
        for(const object of this.game.objects){
            if(!this.isAvoidanceTarget(object)) continue;

            const figure = object.figure;
            const extendedFigure = this.figure.scaled(1 + DISTANCE_DELTA);
            const diff = this.position.subtract(figure.center);
            // 衝突 or 衝突寸前
            if(extendedFigure.intersects(figure)){
                let diff2d = toVector2(diff);
                const distanceSq2d = diff2d.lengthSquared();
                if(distanceSq2d < MIN_DISTANCE_SQ){
                    if(!(object instanceof Minion)) continue;
                    diff2d = calcSeparationDirection(this, object);
                    // MIN_DISTANCE だけ離す
                    dir.addInPlace(diff2d.scale(Math.pow(MIN_DISTANCE_SQ, -1 / 2)));
                }
                else{
                    // 引力 r / |r|^3 を加える (引力係数は1)
                    dir.addInPlace(diff2d.scale(Math.pow(distanceSq2d, -3 / 2)));
                }
                if(object instanceof Minion){
                    ignoredEntities.push(object);
                }
            }
        }
        if(dir.lengthSquared() > 0){
            dir = dir.normalize().scale(VELOCITY * deltaSeconds);

            // Minionごとにベクトルを少しずらして重ならないようにする
            const angle = Random.uniform(-MAX_ANGLE, MAX_ANGLE);
            dir = rotate2D(dir, angle);
            this.moveFor(toVector3(dir), { ignoredEntities });
        }
    }

    /** 運搬物にめり込んだ Minion を、運搬物から離れる方向へ移動させる */
    private separateFromNearbyCarriables(deltaSeconds: number): void {
        const PROXIMITY_MARGIN = 1 / 32;
        const SEPARATION_SPEED = 0.5;
        const MIN_DISTANCE_SQ = 0.000001;
        const carriables = this.game.objects.filter(
            (object): object is Carriable => object instanceof Carriable,
        );
        let direction = new Vector2();
        const ignoredEntities: Carriable[] = [];

        for (const carriable of carriables) {
            const diff = toVector2(this.position.subtract(carriable.position));
            const distance = diff.length();
            const minDistance = carriable.radius + this.size / 2 + PROXIMITY_MARGIN;
            if (distance >= minDistance) continue;

            if (distance * distance < MIN_DISTANCE_SQ) {
                diff.copyFrom(calcSeparationDirection(this, carriable));
            }
            // 重なりが深いほど強く離れる方向に寄与させる
            direction.addInPlace(diff.normalize().scale(minDistance - distance));
            ignoredEntities.push(carriable);
        }

        if (direction.lengthSquared() === 0) return;
        const move = direction.normalize().scale(SEPARATION_SPEED * deltaSeconds);
        this.moveFor(toVector3(move), { ignoredEntities });
    }

    private isAvoidanceTarget(object: Entity): boolean {
        if(object === this) return false;
        if(object instanceof Minion){
            return [MinionState.following, MinionState.free].includes(object.state);
        }
        return object instanceof Player;
    }

    private separateFromOverlappingMinions(): void {
        const MOVE_DISTANCE = this.size + 0.01;
        const MIN_DISTANCE_SQ = 0.000001;
        const MAX_ATTEMPTS = 12;

        for(let attempt = 0; attempt < MAX_ATTEMPTS; attempt++){
            const overlaps = this.getOverlappingMinions();
            if(overlaps.length === 0) return;

            let dir = new Vector2();
            for(const minion of overlaps){
                const diff2d = toVector2(this.position.subtract(minion.position));
                if(diff2d.lengthSquared() < MIN_DISTANCE_SQ){
                    dir.addInPlace(calcSeparationDirection(this, minion));
                }
                else{
                    dir.addInPlace(diff2d.normalize());
                }
            }
            if(dir.lengthSquared() === 0) return;

            const angleStep = Math.ceil(attempt / 2) * Math.PI / 8;
            const angle = attempt === 0 ? 0 : angleStep * (attempt % 2 === 0 ? 1 : -1);
            const moveVector = rotate2D(dir.normalize(), angle).scale(MOVE_DISTANCE);
            this.moveFor(toVector3(moveVector), { ignoredEntities: overlaps });
        }
    }

    private getOverlappingMinions(): Minion[] {
        return this.game.objects.filter((object): object is Minion => {
            if(object === this) return false;
            if(!(object instanceof Minion)) return false;
            if(![MinionState.following, MinionState.free].includes(object.state)) return false;
            return this.figure.intersects(object.figure);
        });
    }

    public becomeFree(){
        this.state = MinionState.free;
        this.velocity = Vector3.Zero();
        this.separateFromOverlappingMinions();
    }

    protected override isBlockedBy(entity: Entity): boolean {
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

    private getNearbyCarriables(maxDistance: number): Carriable[] {
        const maxDistanceSquared = maxDistance * maxDistance;
        return this.game.objects
            .filter((object): object is Carriable =>
                object instanceof Carriable && object.canAcceptCarrier,
            )
            .map(carriable => ({
                carriable,
                distanceSquared: (carriable.position.x - this.position.x) ** 2
                    + (carriable.position.y - this.position.y) ** 2,
            }))
            .filter(candidate => candidate.distanceSquared <= maxDistanceSquared)
            .sort((a, b) => a.distanceSquared - b.distanceSquared)
            .map(candidate => candidate.carriable);
    }
    
    /**
     * 指定した位置に Minion が瞬間移動可能か
     */
    private canSpawnAt(position: Vector3): boolean{
        const candidate = new Sphere(position, this.size / 2);
        return this.game.objects.every(object => {
            if(object.id === this.id) return true;
            if(object instanceof Player) return true;
            if(!object.checkCollisions) return true;
            return !candidate.intersects(object.figure);
        });
    }
    /**
     * Minionを投げる際の、Minionの安全な初期位置
     */
    private calcThrownSafeInitialPosition(): Vector3{
        if(!this.follower){
            throw new Error("Player should not be null");
        }

        const playerPos = this.follower.position;
        const playerRot = this.follower.rotation.z;
        const initialVelocity = calcThrownInitialVelocity(
            this.follower.cursor.unrotatedPosition,
            Vector3.Zero(),
            Player.SPEED,
            this.scene.gravity.z,
            this.thrownMaxHeight,
        );
        let candidate = calcThrownInitialPosition(playerPos, playerRot);

        if(this.canSpawnAt(candidate)){
            return candidate;
        }

        const STEP = 1 / 64;
        const MAX_TRAVEL = Cursor.CURSOR_DISTANCE + this.size;
        let traveled = 0;
        while(traveled < MAX_TRAVEL && !this.canSpawnAt(candidate)){
            candidate = candidate.subtract(initialVelocity.scale(STEP));
            traveled += STEP;
        }

        return candidate;
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
