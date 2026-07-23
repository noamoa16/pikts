import {
    Mesh, Scene, Vector3,
    CreateSphere, CreateBox,
} from "#vendor/babylon";
import { Cube, Figure, Shape, Sphere } from "../physics/figure";
import { Game } from "../game";

/** 実体を持つオブジェクト */
export abstract class Entity {
    
    private static count = 0;

    constructor(
        protected readonly game: Game,
        public readonly name: string,
        public readonly shape: Shape,
        size: number,
        position: Vector3,
        options: { fall: boolean },
    ) {
        this.id = Entity.count++;
        this.size = size;
        this.fall = options.fall;
        this.game.objects.push(this);
        switch(this.shape){
            case Shape.Sphere:
                this.mesh = CreateSphere(this.name, { diameter: this.size }, this.scene);
                this.mesh.ellipsoid = new Vector3(
                    this.size / 2,
                    this.size / 2,
                    this.size / 2,
                );
                break;
            case Shape.Cube:
                this.mesh = CreateBox(
                    this.name,
                    { width: this.size, height: this.size, depth: this.size },
                    this.scene,
                );
                break;
        }
        this.mesh.rotation = new Vector3(0, 0, Math.PI * 3 / 2); // 前方を向く
        this.mesh.isPickable = false; // クリックによるオブジェクト選択を無効化 (軽量化のため)
        this.mesh.checkCollisions = true;
        this.groundingPosition = position.clone();
    }

    public readonly mesh: Mesh;

    protected get scene(): Scene {
        return this.game.scene;
    }

    // 固有ID
    public readonly id: number;

    // サイズ
    private _size: number = 1;
    public get size(): number {
        return this._size;
    }
    protected set size(value: number) {
        this._size = value;
    }

    public get figure(): Figure {
        switch(this.shape){
            case Shape.Sphere:
                return new Sphere(this.position, this.size / 2);
            case Shape.Cube:
                return new Cube(this.position, this.size);
        }
    }

    // Collisionイベントを発生させるか
    private _collisionEventsEnabled: boolean = false;
    public get collisionEventsEnabled(): boolean {
        return this._collisionEventsEnabled;
    }
    protected set collisionEventsEnabled(value: boolean) {
        this._collisionEventsEnabled = value;
    }


    protected readonly fall: boolean;

    // 移動スピード
    private _speed: number = 0;
    public get speed(): number {
        return this._speed;
    }
    protected set speed(value: number) {
        this._speed = value;
    }
    
    // 基本はtrue
    // 他の物体をすり抜けるように設定したい場合はfalse
    // ON/OFFを切り替えられるようにしたいので、Entityのクラス分けはしない
    public get checkCollisions(): boolean {
        return this.mesh.checkCollisions;
    }
    protected set checkCollisions(value: boolean) {
        this.mesh.checkCollisions = value;
    }

    public get isVisible(): boolean {
        return this.mesh.isVisible;
    }
    public set isVisible(value: boolean) {
        this.mesh.isVisible = value;
    }

    // 位置
    public get position(): Vector3 {
        return this.mesh.position;
    }
    protected set position(value: Vector3) {
        this.mesh.position = value;
    }
    public get groundingPosition(): Vector3 {
        return this.mesh.position.subtract(new Vector3(0, 0, this.size / 2));
    }
    protected set groundingPosition(value: Vector3) {
        this.mesh.position = value.add(new Vector3(0, 0, this.size / 2));
    }

    // 移動
    protected moveTo(dir: Vector3) {
        const dir1 = new Vector3(dir.x, 0, 0);
        const dir2 = new Vector3(0, dir.y, 0);
        const dir3 = new Vector3(0, 0, dir.z);
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
                space = Math.min(this.figure.space(entity.figure, dir), space);
            }
            if(space <= 3 * Number.EPSILON){ // 移動不可
                continue;
            }
            let moveVec = dir.clone().normalize();
            moveVec = moveVec.scale(Math.min(dir.length(), space));
            this.position.addInPlace(moveVec);
        }
    }

    // 回転
    public get rotation(): Vector3 {
        return this.mesh.rotation;
    }
    protected set rotation(value: Vector3) {
        this.mesh.rotation = value;
    }

    public abstract update(deltaSeconds: number): void;

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
