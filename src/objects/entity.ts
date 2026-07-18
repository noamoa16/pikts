import { Mesh, Vector3 } from "#vendor/babylon";

/** 実体を持つオブジェクト */
export abstract class Entity {
    
    private static count = 0;

    constructor(name: string, options: { fall: boolean }) {
        this.id = Entity.count++;
        this.name = name;
        this.fall = options.fall;
    }

    // 固有ID
    public readonly id: number;

    // 名前
    public readonly name: string;

    // サイズ
    private _size: number = 1;
    public get size(): number {
        return this._size;
    }
    protected set size(value: number) {
        this._size = value;
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

    // Entityのコンストラクタに渡す形だと、superを呼ぶまでthisが使えなくなってしまう
    // meshの初期化処理を共通化できれば、!を上手く外せるかも
    private _mesh!: Mesh;
    public get mesh(): Mesh {
        return this._mesh;
    }
    protected set mesh(value: Mesh) {
        this._mesh = value;
        this._mesh.rotation = new Vector3(0, 0, Math.PI * 3 / 2); // 前方を向く
        this._mesh.checkCollisions = true;
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
