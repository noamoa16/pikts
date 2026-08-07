import { Scene } from "#vendor/babylon";
import { FrameTimer } from "./core/frameTimer";
import { Entity } from "./objects/entity";
import { Collision } from "./physics/collision";
import { Minion, MinionState } from "./objects/minion/minion";
import { Player } from "./objects/player/player";
import { MainCamera } from "./rendering/camera";
import { Figure } from "./physics/figure";

export class Game {
    public readonly objects: Entity[] = [];
    public readonly camera: MainCamera;
    public readonly frameTimerUpdate = new FrameTimer(30);
    public readonly frameTimerCollision = new FrameTimer(30);

    private _cachedFigure: Figure[] = [];
    public get cachedFigure() { return this._cachedFigure; }
    private set cachedFigure(value: Figure[]) { this._cachedFigure = value; }
    private readonly collision = new Collision();

    public static readonly TARGET_FPS = 60;

    private _time = 0;
    /** ゲーム内時間 */
    public get time(){ return this._time; }
    private set time(value: number){ this._time = value; }

    constructor(public readonly scene: Scene){
        this.camera = new MainCamera(this.scene);
    }

    private cacheFigure(){
        this.cachedFigure = [];
        for(const object of this.objects){
            if(object instanceof Player){
                this.cachedFigure.push(object.figure);
            }
            if(object instanceof Minion){
                if(![MinionState.following, MinionState.free].includes(object.state)){
                    continue;
                }
                this.cachedFigure.push(object.figure);
            }
        }
    }

    private updateObjects(deltaSeconds: number): void {
        this.cacheFigure();
        this.frameTimerUpdate.measure(() => {
            this.objects.forEach(object => object.update(deltaSeconds));
        });
    }

    private dispatchCollisionEvents(): void {
        this.frameTimerCollision.measure(() => {
            this.collision.dispatchEvents(this.objects);
        });
    }

    public update(deltaSeconds: number): void {
        this.time += deltaSeconds;
        this.updateObjects(deltaSeconds);
        this.dispatchCollisionEvents();
    }
}
