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
import { MinionState } from "./minionState";
import {
    calcMinionFollowMoveVector,
    calcSeparationDirection,
} from "./minionMovement";
import {
    calcHeldPosition,
    calcThrownLaunchDirection,
    calcThrownStartPosition,
    calcThrownVelocity,
} from "./minionThrow";

export { MinionState } from "./minionState";

export abstract class Minion extends Entity {
    protected static readonly _BASE_COLOR: Color3 = new Color3(0, 0.95, 0);
    protected static readonly _FREE_COLOR: Color3 = new Color3(0.5, 0.95, 0.5);
    private get baseColor(){ return (this.constructor as typeof Minion)._BASE_COLOR; }
    private get freeColor(){ return (this.constructor as typeof Minion)._FREE_COLOR; }
    public state: MinionState = MinionState.free;
    public follower: Player | null = null;

    // 掴み/投げ
    protected static readonly _THROWN_MAX_HEIGHT = 2.25;
    private get thrownMaxHeight(){ return (this.constructor as typeof Minion)._THROWN_MAX_HEIGHT; }

    constructor(game: Game, position: Vector3) {
        super(game, "minion", Shape.Sphere, 0.15, position, { fall: true });
        this.speed = 3;
        this.collisionEventsEnabled = true;

        const material = new StandardMaterial(`${this.name}.material`, this.scene);
        material.backFaceCulling = false;
        this.mesh.material = material;
    }

    override update(deltaSeconds: number): void {
        super.update(deltaSeconds);

        if(this.state === MinionState.following && this.follower){
            const moveVector = calcMinionFollowMoveVector(
                this.groundingPosition,
                this.follower.groundingPosition,
                this.speed,
                deltaSeconds,
            );
            this.moveFor(moveVector);
            if(moveVector.lengthSquared() === 0){
                this.avoidDuplication(deltaSeconds);
            }
            this.checkCollisions = true;
        }
        else if(this.state === MinionState.held && this.follower){
            this.updateHeldPosition();
            this.checkCollisions = false;
        }
        else if(this.state === MinionState.thrown){
            if(
                this.velocity.z == 0 || // 衝突
                this.velocity.z > this.prevVelocity.z // 落下速度が減衰した
            ){
                console.log('Minion 着地', {
                    id: this.id,
                    position: this.position,
                    velocity: this.velocity.clone(),
                    prevVelocity: this.prevVelocity.clone(),
                })
                
                // 投げ状態終了
                this.becomeFree();
            }
            this.checkCollisions = true;
        }
        else if(this.state === MinionState.free){
            this.avoidDuplication(deltaSeconds);
            this.checkCollisions = true;
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
                this.becomeFollowing(entity, 'プレイヤーと衝突');
            }
        }
    }

    private getColor(): Color3{
        return {
            [MinionState.following]: this.baseColor,
            [MinionState.held]: this.baseColor,
            [MinionState.thrown]: this.baseColor,
            [MinionState.free]: this.freeColor,
        }[this.state];
    }

    /** 他の Figure と (x, y) 座標が重複するのを避けるように動く */
    private avoidDuplication(deltaSeconds: number){
        const VELOCITY = 0.5;
        const DISTANCE_DELTA = 0.01;
        const MIN_DISTANCE_SQ = 0.000001;
        const MAX_ANGLE = Math.PI / 8;
        let dir = new Vector2();
        const ignoreEntities: Entity[] = [];
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
                    dir.addInPlace(diff2d.scale(Math.pow(MIN_DISTANCE_SQ, -1 / 2)));
                }
                else{
                    dir.addInPlace(diff2d.scale(Math.pow(distanceSq2d, -3 / 2)));
                }
                if(object instanceof Minion){
                    ignoreEntities.push(object);
                }
            }
        }
        if(dir.lengthSquared() > 0){
            dir = dir.normalize().scale(VELOCITY * deltaSeconds);

            // Minionごとにベクトルを少しずらして重ならないようにする
            const angle = (Math.random() * 2 - 1) * MAX_ANGLE;
            dir = rotate2D(dir, angle);
            this.moveFor(toVector3(dir), { ignoreEntities });
        }
    }

    private isAvoidanceTarget(object: Entity): boolean {
        if(object === this) return false;
        if(object instanceof Minion){
            return [MinionState.following, MinionState.free].includes(object.state);
        }
        return object instanceof Player;
    }

    private resolveLandingOverlap(): void {
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
            this.moveFor(toVector3(moveVector), { ignoreEntities: overlaps });
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

    public get isFree(): boolean{
        return this.state == MinionState.free;
    }

    public becomeFree(){
        this.state = MinionState.free;
        this.velocity = Vector3.Zero();
        this.resolveLandingOverlap();
    }

    protected override shouldBlockMovement(entity: Entity): boolean {
        if(this.state === MinionState.thrown && entity instanceof Minion){
            return false;
        }
        return super.shouldBlockMovement(entity);
    }

    public becomeFollowing(player: Player, src?: string){
        if(this.state == MinionState.free){
            this.state = MinionState.following;
            this.follower = player;
            this.velocity.z = 1;
        }
        console.log('Minion.becomeFollowing', {
            id: this.id,
            src,
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
    private calcThrownLaunchDirection(): Vector3{
        if(!this.follower){
            throw new Error("Player is null");
        }

        return calcThrownLaunchDirection(
            this.follower.cursor.unrotatedPosition,
            this.scene.gravity.z,
            this.thrownMaxHeight,
        );
    }
    private isSpawnBlocked(position: Vector3): boolean{
        const candidate = new Sphere(position, this.size / 2);
        return this.game.objects.some(object => {
            if(object === this || object === this.follower) return false;
            if(object instanceof Player) return false;
            if(!object.checkCollisions) return false;
            return candidate.intersects(object.figure);
        });
    }
    private calcSafeThrownPosition(): Vector3{
        if(!this.follower){
            throw new Error("Player should not be null");
        }

        const playerPos = this.follower.position;
        const playerRot = this.follower.rotation.z;
        const launchDirection = this.calcThrownLaunchDirection();
        let candidate = calcThrownStartPosition(playerPos, playerRot);

        if(!this.isSpawnBlocked(candidate)){
            return candidate;
        }

        const STEP = 1 / 64;
        const MAX_TRAVEL = Cursor.CURSOR_DISTANCE + this.size;
        let traveled = 0;
        while(traveled < MAX_TRAVEL && this.isSpawnBlocked(candidate)){
            candidate = candidate.subtract(launchDirection.scale(STEP));
            traveled += STEP;
        }

        return candidate;
    }
    public becomeThrown(){
        this.state = MinionState.thrown;
        if(!this.follower){
            throw new Error("Player should not be null");
        }
        this.position = this.calcSafeThrownPosition();

        const MAX_ANGLE = Math.PI / 128;

        // Minionごとにベクトルを少しずらして重ならないようにする
        const deltaAngle = (Math.random() * 2 - 1) * MAX_ANGLE;
        const velocity = calcThrownVelocity(
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
