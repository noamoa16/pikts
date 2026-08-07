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
import { atan, rotate2D, toVector2, toVector3 } from "../../core/math";
import { Cursor } from "../player/cursor";

export enum MinionState {
    free,
    following,
    held,
    thrown,
}

export abstract class Minion extends Entity {
    protected static readonly _BASE_COLOR: Color3 = new Color3(0, 0.95, 0);
    protected static readonly _FREE_COLOR: Color3 = new Color3(0.5, 0.95, 0.5);
    private get baseColor(){ return (this.constructor as typeof Minion)._BASE_COLOR; }
    private get freeColor(){ return (this.constructor as typeof Minion)._FREE_COLOR; }
    public state: MinionState = MinionState.free;
    public follower: Player | null = null;

    // 掴み/投げ
    private static readonly HELD_DIFF_HORIZONTAL = 1 / 4;
    private static readonly HELD_DIFF_VERTICAL = 1 / 8;
    private static readonly THROWN_DIFF_HORIZONTAL = 1 / 4;
    private static readonly THROWN_DIFF_VERTICAL = 1 / 2;
    protected static readonly _THROWN_MAX_HEIGHT = 2.25;
    private get thrownMaxHeight(){ return (this.constructor as typeof Minion)._THROWN_MAX_HEIGHT; }

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
            if(this.velocity.z == 0){
                console.log('Minion 着地', {
                    id: this.id,
                    position: this.position,
                    velocity: this.velocity.clone(),
                })
                
                // 投げ状態終了
                this.becomeFree();
            }
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

    /** 他の Figure と (x, y) 座標が重複するのを避けるように動く */
    private avoidDuplication(deltaSeconds: number){
        const VELOCITY = 0.5;
        const DISTANCE_DELTA = 0.01;
        const MAX_ANGLE = Math.PI / 8;
        const ANGLE_NUM = 16;
        let dir = new Vector2();
        for(const figure of this.game.cachedFigure){
            const extendedFigure = this.figure.scaled(1 + DISTANCE_DELTA);
            const diff = this.position.subtract(figure.center);
            const distanceSq = diff.lengthSquared();
            // 衝突 or 衝突寸前
            if(Number.EPSILON * Number.EPSILON < distanceSq && extendedFigure.intersects(figure)){
                const diff2d = toVector2(diff);
                const distanceSq2d = diff2d.lengthSquared();
                dir.addInPlace(diff2d.scale(Math.pow(distanceSq2d, -3 / 2)));
            }
        }
        if(dir.lengthSquared() > 0){
            dir = dir.normalize().scale(VELOCITY * deltaSeconds);

            // Minionごとにベクトルを少しずらして重ならないようにする
            const angle = (this.id % ANGLE_NUM - (ANGLE_NUM - 1) / 2) / ((ANGLE_NUM - 1) / 2) * MAX_ANGLE;
            dir = rotate2D(dir, angle);
            this.moveFor(toVector3(dir));
        }
    }

    public get isFree(): boolean{
        return this.state == MinionState.free;
    }

    public becomeFree(){
        this.state = MinionState.free;
        this.velocity = Vector3.Zero();
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
        });
    }
    private updateHeldPosition(){
        if(!this.follower) return;
        const playerPos = this.follower.position;
        const playerRot = this.follower.rotation.z;
        this.position = playerPos.add(new Vector3(
            Minion.HELD_DIFF_HORIZONTAL * Math.cos(playerRot),
            Minion.HELD_DIFF_HORIZONTAL * Math.sin(playerRot),
            Minion.HELD_DIFF_VERTICAL,
        ));
    }
    private calcThrownLaunchDirection(): Vector3{
        if(!this.follower){
            throw new Error("Player is null");
        }

        const g = Math.abs(this.scene.gravity.z);
        const p0 = new Vector2(Minion.HELD_DIFF_HORIZONTAL, Minion.HELD_DIFF_VERTICAL);
        const xMax = this.follower.cursor.unrotatedPosition.length();
        const yMax = this.thrownMaxHeight;
        const verticalVelocity = Math.sqrt(2 * g * (yMax - p0.y));
        const horizontalVelocity =
            g * (xMax - p0.x) / (verticalVelocity + Math.sqrt(2 * g * yMax));
        const rot = atan(this.follower.cursor.unrotatedPosition);

        return new Vector3(
            horizontalVelocity * Math.cos(rot),
            horizontalVelocity * Math.sin(rot),
            verticalVelocity,
        ).normalize();
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
        let candidate = playerPos.add(new Vector3(
            Minion.THROWN_DIFF_HORIZONTAL * Math.cos(playerRot),
            Minion.THROWN_DIFF_HORIZONTAL * Math.sin(playerRot),
            Minion.THROWN_DIFF_VERTICAL,
        ));

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

        // 重力加速度 g
        // 初期位置　　　　　　　　　　: p0      = (p0.x, p0.y)
        // 初期速度　　　　　　　　　　: v0      = (v0.x, v0.y)
        // 頂点までの対空時間　　　　　: t1      = v0.y / g
        // 最大高度　　　　　　　　　　: y_max   = p0.y + 1/2 * v0.y ^ 2 / g
        // 頂点から着地までの対空時間　: t2 - t1 = sqrt(2 * y_max / g)
        // 水平移動距離　　　　　　　　: x_max   = p0.x + v0.x * t2 
        // 　　　　　　　　　　　　　　:         = p0.x + v0.x * {v0.y / g + sqrt(2 * y_max / g)}

        // v0.y = sqrt{2 * g * (y_max - p0.y)}
        // v0.x = g * (x_max - p0.x) / {v0.y + sqrt(2 * g * y_max)}

        const g = Math.abs(this.scene.gravity.z);
        const p0 = new Vector2(Minion.HELD_DIFF_HORIZONTAL, Minion.HELD_DIFF_VERTICAL);
 
        // 加速投げ (未実装)
        // 実装にはPlayerの速度取得が必要
        // const xMaxBase = Cursor.CURSOR_DISTANCE;
        // const xMaxAccelerated = Cursor.CURSOR_DISTANCE * 1.5;
        // const accelerationRate = toVector2(this.follower.velocity).length() / Player.SPEED;
        // const xMax = xMaxBase * (1 - accelerationRate) + xMaxAccelerated * accelerationRate;

        const xMax = this.follower.cursor.unrotatedPosition.length();
        const yMax = this.thrownMaxHeight;
        const VERTICAL_VELOCITY = Math.sqrt(2 * g * (yMax - p0.y));
        const HOLIZONTAL_VELOCITY = g * (xMax - p0.x) / (VERTICAL_VELOCITY + Math.sqrt(2 * g * yMax));

        const rot = atan(this.follower.cursor.unrotatedPosition);
        const velocity = new Vector3(
            HOLIZONTAL_VELOCITY * Math.cos(rot),
            HOLIZONTAL_VELOCITY * Math.sin(rot),
            VERTICAL_VELOCITY,
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
