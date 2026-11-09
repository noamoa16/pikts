import {
    Mesh, Scene, Vector3,
} from "#vendor/babylon";
import { Dir4, Figure, Shape, Sphere, Slope } from "../physics/figure";
import { Game } from "../game";
import { atan, clearLow16Bits, hashInt32, normalizeAngle, normalizeAngles, toVector2 } from "../core/math";
import { Sphere2Slope } from "../physics/figureImpl/sphere2Slope";
import { createEntityFigure, createEntityShape } from "./entityShape";

const GROUND_CLAMP_TOLERANCE = 1e-6;

/** 実体を持つオブジェクト */
export abstract class Entity {
    
    // 固有ID
    private static count = 0;
    public readonly id: number;
    public get hash() { return hashInt32(this.id); }

    // 主要オブジェクト
    public readonly mesh: Mesh;
    protected get scene(): Scene {
        return this.game.scene;
    }
    
    // 位置
    public get position(): Vector3 { return this.mesh.position; }
    protected set position(value: Vector3) { this.mesh.position = value; }
    private get groundingOffset(): number {
        return this.shape === Shape.Cylinder ? this.size / 4 : this.size / 2;
    }
    public get groundingPosition(): Vector3 {
        return this.mesh.position.subtract(new Vector3(0, 0, this.groundingOffset));
    }
    protected set groundingPosition(value: Vector3) {
        this.mesh.position = value.add(new Vector3(0, 0, this.groundingOffset));
    }

    // 回転
    private rotationViewTarget: Vector3 | null = null;
    private rotationView: Vector3 | null = null;
    public get rotation(): Vector3 {
        const target = this.mesh.rotation;
        if (this.rotationViewTarget !== target || !this.rotationView) {
            this.rotationViewTarget = target;
            this.rotationView = new Proxy(target, {
                set(target, property, value): boolean {
                    const normalizedValue =
                        property === "x" || property === "y" || property === "z"
                            ? normalizeAngle(value)
                            : value;
                    return Reflect.set(target, property, normalizedValue, target);
                },
            });
        }
        return this.rotationView!;
    }
    protected set rotation(value: Vector3) {
        this.mesh.rotation = normalizeAngles(value);
    }

    // サイズ
    private _size: number = 1;
    public get size(): number { return this._size; }
    protected set size(value: number) { this._size = value; }

    // 基本移動スピード
    private _speed: number = 0;
    public get speed(): number { return this._speed; }
    protected set speed(value: number) { this._speed = value; }

    // 速度
    private _velocity: Vector3 = Vector3.Zero();
    public get velocity(): Vector3 { return this._velocity; }
    protected set velocity(value: Vector3) { this._velocity = value; }
    protected prevVelocity: Vector3 = Vector3.Zero();

    // 形状
    private figureCache: {
        shape: Shape;
        position: Vector3;
        x: number;
        y: number;
        z: number;
        size: number;
        figure: Figure;
    } | null = null;
    public get figure(): Figure {
        const position = this.position;
        const { x, y, z } = position;
        const size = this.size;
        const cached = this.figureCache;
        if (
            cached
            && cached.shape === this.shape
            && cached.position === position // 古い参照を返したくないので
            && cached.x === x && cached.y === y && cached.z === z
            && cached.size === size
        ) {
            return cached.figure;
        }

        const figure = createEntityFigure(this.shape, position, size);
        this.figureCache = { shape: this.shape, position, x, y, z, size, figure };
        return figure;
    }

    // 衝突判定
    public get checkCollisions(): boolean { return this.mesh.checkCollisions; }
    protected set checkCollisions(value: boolean) { this.mesh.checkCollisions = value; }

    // 性質
    protected readonly fall: boolean;
    public get isVisible(): boolean { return this.mesh.isVisible; }
    public set isVisible(value: boolean) { this.mesh.isVisible = value; }

    constructor(
        protected readonly game: Game,
        public readonly name: string,
        public readonly shape: Shape,
        size: number,
        position: Vector3,
        options: {
            fall: boolean,
            upward?: Dir4,
        },
    ) {
        this.id = Entity.count++;
        this.size = size;
        this.fall = options.fall;
        this.game.objects.push(this);
        const shapeDefinition = createEntityShape(this.shape, {
            scene: this.scene,
            name: this.name,
            size: this.size,
            position,
            upward: options.upward ?? Dir4.Right,
        });
        this.mesh = shapeDefinition.mesh;
        this.mesh.rotation = shapeDefinition.initialRotation;
        this.mesh.isPickable = false; // クリックによるオブジェクト選択を無効化 (軽量化のため)
        this.mesh.checkCollisions = true;
        this.groundingPosition = position.clone();
    }

    // 移動
    protected moveFor(dir: Vector3, options: { ignoredEntities?: readonly Entity[], strict?: boolean } = {}): Vector3 {
        const dir1 = new Vector3(dir.x, 0, 0);
        const dir2 = new Vector3(0, dir.y, 0);
        const dir3 = new Vector3(0, 0, dir.z);
        const prevPosition = this.position.clone();
        for(const dir of [dir1, dir2, dir3]){

            if(dir.lengthSquared() == 0) continue;
            
            let space = Infinity;
            for(const entity of this.game.objects){
                if(!entity.checkCollisions){ // 衝突判定を行わないオブジェクトは無視
                    continue;
                }
                if(this.id === entity.id){ // 自分自身とは衝突判定しない
                    continue;
                }
                if(options.ignoredEntities?.includes(entity)){
                    continue;
                }
                if(!this.isBlockedBy(entity)){
                    continue;
                }
                space = Math.min(this.figure.space(entity.figure, dir, options?.strict === true), space);
            }
            if(space <= 3 * Number.EPSILON){ // 移動不可
                continue;
            }
            let moveVec = dir.clone().normalize();
            moveVec = moveVec.scale(Math.min(dir.length(), space));
            moveVec = new Vector3(
                clearLow16Bits(moveVec.x),
                clearLow16Bits(moveVec.y),
                clearLow16Bits(moveVec.z),
            );
            this.position.addInPlace(moveVec);
        }
        return this.position.subtract(prevPosition);
    }

    /** 水平方向の移動に合わせて向きを滑らかに変える */
    protected rotateToDirection(direction: Vector3, deltaSeconds: number): void {
        if (deltaSeconds <= 0 || (direction.x === 0 && direction.y === 0)) return;

        const currentTheta = this.rotation.z;
        const targetTheta = atan(toVector2(direction));
        const diffTheta = normalizeAngle(
            targetTheta - currentTheta,
            { includePi: Math.cos(currentTheta) >= 0 },
        );
        const ROTATION_SPEED = 2.5;
        this.rotation.z = currentTheta + Math.sign(diffTheta) * Math.min(
            Math.PI * deltaSeconds * ROTATION_SPEED,
            Math.abs(diffTheta),
        );
    }

    public update(deltaSeconds: number): void {

        /* 重力 */

        if(!this.fall) return;

        // dv = a * dt
        this.velocity.addInPlace(this.scene.gravity.scale(deltaSeconds))

        // dx = v * dt
        const movedExpected = this.velocity.scale(deltaSeconds);
        const movedActual = this.moveFor(movedExpected.clone());

        // 移動しきれなかった場合は速度0にする
        this.prevVelocity = this.velocity.clone();
        if(Math.abs(movedActual.x) < Math.abs(movedExpected.x) / 2) this.velocity.x = 0;
        if(Math.abs(movedActual.y) < Math.abs(movedExpected.y) / 2) this.velocity.y = 0;
        if(Math.abs(movedActual.z) < Math.abs(movedExpected.z) / 2) this.velocity.z = 0;

        // スロープへのめり込み時処理
        if(
            movedExpected.lengthSquared() > 0 && // 移動しようとしたオブジェクトのみ対象
            this.figure instanceof Sphere // 球体オブジェクトのみ対象
        ){
            let distance = 0;
            for(const entity of this.game.objects){
                if(entity.figure instanceof Slope){
                    const impl = new Sphere2Slope(this.figure, entity.figure);
                    distance = Math.max(distance, impl.resolveOverlapUpDistance());
                }
            }
            if(distance > 0){
                this.position.addInPlace(new Vector3(0, 0, distance));
            }
        }

        const groundingPosition = this.groundingPosition;
        if (
            groundingPosition.z < 0
            && groundingPosition.z >= -GROUND_CLAMP_TOLERANCE
        ) {
            groundingPosition.z = 0;
            this.groundingPosition = groundingPosition;
            this.velocity.z = 0;
        }
    }

    /**
     * 移動の際に他オブジェクトの邪魔をするかどうか
     */
    protected isBlockedBy(_: Entity): boolean {
        return true;
    }

    // Collisionイベントを発生させるか
    private _collisionEventsEnabled: boolean = false;
    public get collisionEventsEnabled(): boolean { return this._collisionEventsEnabled; }
    protected set collisionEventsEnabled(value: boolean) { this._collisionEventsEnabled = value; }

    /**
     * 他の Entity と衝突し始めたときに呼ばれる
     */
    public onCollisionEnter(_: Entity): void {
        // 何もしない
    }

    /**
     * 他の Entity と衝突している間、毎フレーム呼ばれる
     */
    public onCollisionStay(_: Entity): void {
        // 何もしない
    }

    /**
     * 他の Entity との衝突が終わったときに呼ばれる
     */
    public onCollisionExit(_: Entity): void {
        // 何もしない
    }
}
