import { Scene, Vector3 } from "#vendor/babylon";
import { FrameTimer } from "./core/frameTimer";
import { Entity } from "./objects/entity";
import { Collision } from "./physics/collision";
import { Minion, MinionState } from "./objects/minion/minion";
import { Player } from "./objects/player/player";
import { MainCamera } from "./rendering/camera";

export class Game {
    public readonly objects: Entity[] = [];
    public readonly camera: MainCamera;
    public readonly frameTimerUpdate = new FrameTimer(30);
    public readonly frameTimerCollision = new FrameTimer(30);

    private _cachedCharacterPos: Vector3[] = [];
    public get cachedCharacterPos() { return this._cachedCharacterPos; }
    private set cachedCharacterPos(value: Vector3[]) { this._cachedCharacterPos = value; }
    private readonly collision = new Collision();

    constructor(public readonly scene: Scene){
        this.camera = new MainCamera(this.scene);
    }

    private cacheCharacterPos(){
        this.cachedCharacterPos = [];
        for(const object of this.objects){
            if(object instanceof Player){
                this.cachedCharacterPos.push(object.position);
            }
            if(object instanceof Minion){
                if(![MinionState.following, MinionState.free].includes(object.state)){
                    continue;
                }
                this.cachedCharacterPos.push(object.position);
            }
        }
    }

    public updateObjects(deltaSeconds: number): void {
        this.cacheCharacterPos();
        this.frameTimerUpdate.measure(() => {
            this.objects.forEach(object => object.update(deltaSeconds));
        });
    }

    public dispatchCollisionEvents(): void {
        this.frameTimerCollision.measure(() => {
            this.collision.dispatchEvents(this.objects);
        });
    }
}
