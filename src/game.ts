import { Scene } from "#vendor/babylon";
import { FrameTimer } from "./core/frameTimer";
import { buildGridMap } from "./core/gridMapBuilder";
import { Entity } from "./objects/entity";
import { Collision } from "./physics/collision";
import { Minion, MinionState } from "./objects/minion/minion";
import { Player } from "./objects/player/player";
import { MainCamera } from "./rendering/camera";
import type { Figure } from "./physics/figure";
import type { GridMap } from "./core/gridPathfinding";
import { Onion } from "./objects/onion/onion";
import { EntityInspector } from "./ui/debug/entityInspector";
import { MinionCountDisplay } from "./ui/minionCountDisplay";

export class Game {
    public readonly isDevelopment = import.meta.env.DEV;
    /** 開発時の運搬速度チート */
    public debugCarrySpeed2x = false;
    public readonly objects: Entity[] = [];
    public readonly camera: MainCamera;
    public readonly minionCountDisplay: MinionCountDisplay;
    public readonly entityInspector: EntityInspector | null;
    public readonly frameTimerUpdate = new FrameTimer(30);
    public readonly frameTimerCollision = new FrameTimer(30);

    private _cachedFigure: Figure[] = [];
    public get cachedFigure() { return this._cachedFigure; }
    private set cachedFigure(value: Figure[]) { this._cachedFigure = value; }
    private readonly collision = new Collision();

    private _gridMap: GridMap = {
        bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
        blocked: [],
    };
    /** Snapshot of the current grid bounds and cells occupied by Blocks/Slopes. */
    public get gridMap(): GridMap { return this._gridMap; }

    private _onions: Onion[] = [];
    public get onions(): Onion[] { return this._onions; }

    public static readonly TARGET_FPS = 60;

    private _time = 0;
    /** ゲーム内時間 */
    public get time(){ return this._time; }
    private set time(value: number){ this._time = value; }

    constructor(public readonly scene: Scene){
        this.camera = new MainCamera(this.scene);
        const canvas = this.scene.getEngine().getRenderingCanvas();
        this.minionCountDisplay = new MinionCountDisplay(this, canvas);
        this.entityInspector = this.isDevelopment
            ? new EntityInspector(this, canvas)
            : null;
        this.scene.onDisposeObservable.add(() => this.minionCountDisplay.remove());
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
            for(const object of [...this.objects]){
                if(this.objects.includes(object)) object.update(deltaSeconds);
            }
        });
    }

    public removeObject(object: Entity): void {
        const index = this.objects.indexOf(object);
        if(index < 0) return;
        this.objects.splice(index, 1);
        object.mesh.dispose(false, true);
    }

    private updateGridMap(): void {
        this._gridMap = buildGridMap(this.objects);
    }

    private dispatchCollisionEvents(): void {
        this.frameTimerCollision.measure(() => {
            this.collision.dispatchCollisionEvents(this.objects);
        });
    }

    public update(deltaSeconds: number): void {
        this.time += deltaSeconds;
        this.updateObjects(deltaSeconds);
        this.updateGridMap();
        this._onions = this.objects
            .filter((object): object is Onion =>
                object instanceof Onion,
            );
        this.dispatchCollisionEvents();

        const player = this.objects.find((object): object is Player => object instanceof Player);
        if (player) {
            this.camera.update(deltaSeconds, player.position);
            player.whistle.update(deltaSeconds, this.objects);
        }
        this.minionCountDisplay.update();
        this.entityInspector?.update();
    }
}
