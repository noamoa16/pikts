import { Scene } from "#vendor/babylon";
import { FrameTimer } from "./core/frameTimer";
import { Entity } from "./objects/entity";
import { Collision } from "./physics/collision";
import { Minion, MinionState } from "./objects/minion/minion";
import { Player } from "./objects/player/player";
import { MainCamera } from "./rendering/camera";
import { Block } from "./objects/block";
import { Slope as SlopeEntity } from "./objects/slope";
import { Dir4, Figure, Slope as SlopeFigure } from "./physics/figure";
import { type GridBounds, type GridMap, type GridObstacle } from "./core/gridPathfinding";
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

    private createGridObstaclePoints(): GridObstacle[] {
        const points = new Map<string, GridObstacle>();
        for (const object of this.objects) {
            if (!(object instanceof Block || object instanceof SlopeEntity)) continue;

            let halfX = object.size / 2;
            let halfY = object.size / 2;
            let minZ = object.position.z - object.size / 2;
            let maxZ = object.position.z + object.size / 2;
            if (object instanceof SlopeEntity && object.figure instanceof SlopeFigure) {
                const figure = object.figure;
                if (figure.upward === Dir4.Right || figure.upward === Dir4.Left) {
                    halfX = figure.length / 2;
                    halfY = figure.width / 2;
                } else {
                    halfX = figure.width / 2;
                    halfY = figure.length / 2;
                }
                minZ = figure.center.z - figure.height / 2;
                maxZ = figure.center.z + figure.height / 2;
            }

            const minX = Math.ceil(object.position.x - halfX - 1e-6);
            const maxX = Math.floor(object.position.x + halfX + 1e-6);
            const minY = Math.ceil(object.position.y - halfY - 1e-6);
            const maxY = Math.floor(object.position.y + halfY + 1e-6);
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    const point = { x, y, minZ, maxZ };
                    points.set(`${x},${y},${minZ},${maxZ}`, point);
                }
            }
        }
        return [...points.values()];
    }

    private createGridMapBounds(): GridBounds {
        if (this.objects.length === 0) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        }

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const object of this.objects) {
            let halfX = object.size / 2;
            let halfY = object.size / 2;
            if (object instanceof SlopeEntity && object.figure instanceof SlopeFigure) {
                const figure = object.figure;
                if (figure.upward === Dir4.Right || figure.upward === Dir4.Left) {
                    halfX = figure.length / 2;
                    halfY = figure.width / 2;
                } else {
                    halfX = figure.width / 2;
                    halfY = figure.length / 2;
                }
            }
            minX = Math.min(minX, object.position.x - halfX);
            maxX = Math.max(maxX, object.position.x + halfX);
            minY = Math.min(minY, object.position.y - halfY);
            maxY = Math.max(maxY, object.position.y + halfY);
        }
        return {
            minX: Math.floor(minX),
            maxX: Math.ceil(maxX),
            minY: Math.floor(minY),
            maxY: Math.ceil(maxY),
        };
    }

    private updateGridMap(): void {
        this._gridMap = {
            bounds: this.createGridMapBounds(),
            blocked: this.createGridObstaclePoints(),
        };
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
