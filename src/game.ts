import { Scene, type Engine } from "#vendor/babylon";
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
import { GameHudDisplay } from "./ui/gameHudDisplay";
import { Effect } from "./effects/effect";
import { AudioManager } from "./audio/audioManager";
import { GameInput } from "./game/input";
import { PlayerDebugOverlay } from "./ui/debug/playerDebugOverlay";

export class Game {
    public readonly isDevelopment = import.meta.env.DEV;
    /** 開発時のゲーム速度切替 */
    public debugGameSpeed2x = false;
    public readonly objects: Entity[] = [];
    public readonly effects: Effect[] = [];
    public readonly camera: MainCamera;
    public readonly gameHudDisplay: GameHudDisplay;
    public readonly entityInspector: EntityInspector | null;
    public readonly frameTimerUpdate = new FrameTimer(30);
    public readonly frameTimerCollision = new FrameTimer(30);
    private readonly audio = new AudioManager();

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

    private frame = 0;
    private started = false;
    private readonly frameWaiters: { targetFrame: number; resolve: () => void }[] = [];

    private _time = 0;
    /** ゲーム内時間 */
    public get time(){ return this._time; }
    private set time(value: number){ this._time = value; }

    /** ゲーム内フレーム数を基準に待機する。 */
    public waitFrames(frames: number): Promise<void> {
        const targetFrame = this.frame + Math.max(0, Math.ceil(frames));
        if (targetFrame <= this.frame) return Promise.resolve();
        return new Promise(resolve => this.frameWaiters.push({ targetFrame, resolve }));
    }

    /** 秒数をゲームフレーム数に換算して待機する。 */
    public waitSeconds(seconds: number): Promise<void> {
        return this.waitFrames(seconds * Game.TARGET_FPS);
    }

    constructor(public readonly scene: Scene){
        this.camera = new MainCamera(this.scene);
        const canvas = this.scene.getEngine().getRenderingCanvas();
        this.gameHudDisplay = new GameHudDisplay(this, canvas);
        this.entityInspector = this.isDevelopment
            ? new EntityInspector(this, canvas)
            : null;
        this.scene.onDisposeObservable.add(() => {
            this.gameHudDisplay.remove();
            this.audio.dispose();
        });
    }

    /** 効果音を再生する。name は public/audio/sfx からの相対パス（拡張子省略可）。 */
    public playSoundEffect(name: string): void {
        this.audio.playSoundEffect(name);
    }

    /** BGM をループ再生する。name は public/audio/bgm からの相対パス（拡張子省略可）。 */
    public playBgm(name: string): void {
        this.audio.playBgm(name);
    }

    /** 再生中の BGM を停止する。 */
    public stopBgm(): void {
        this.audio.stopBgm();
    }

    /** ゲームを開始し、フレーム更新と任意のシーンイベント処理を登録する。 */
    public start(options: {
        player?: Player;
        engine?: Engine;
        onBeforeRender?: () => void;
        onDispose?: () => void;
    } = {}): void {
        if (this.started) return;

        const { player, engine, onBeforeRender, onDispose } = options;
        if (player && !engine) {
            throw new Error("Game.start requires an engine when a player is provided.");
        }
        this.started = true;
        const playerDebugOverlay = player
            ? new PlayerDebugOverlay(this, player, this.isDevelopment ? engine! : null)
            : null;
        if (player) new GameInput(this, player, engine!);

        this.scene.onBeforeRenderObservable.add(() => {
            const frameCount = this.debugGameSpeed2x ? 2 : 1;
            for (let frame = 0; frame < frameCount; frame++) this.update();
            playerDebugOverlay?.update();
            onBeforeRender?.();
        });

        this.scene.onDisposeObservable.add(() => {
            playerDebugOverlay?.remove();
            onDispose?.();
        });
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

    public addEffect(effect: Effect): void {
        this.effects.push(effect);
    }

    public removeEffect(effect: Effect): void {
        const index = this.effects.indexOf(effect);
        if (index < 0) return;
        this.effects.splice(index, 1);
        effect.dispose();
    }

    private updateGridMap(): void {
        this._gridMap = buildGridMap(this.objects);
    }

    private dispatchCollisionEvents(): void {
        this.frameTimerCollision.measure(() => {
            this.collision.dispatchCollisionEvents(this.objects);
        });
    }

    public update(): void {
        const deltaSeconds = 1 / Game.TARGET_FPS;
        this.frame++;
        for (let i = this.frameWaiters.length - 1; i >= 0; i--) {
            if (this.frameWaiters[i].targetFrame <= this.frame) {
                this.frameWaiters.splice(i, 1)[0].resolve();
            }
        }
        this.time += deltaSeconds;
        this.updateObjects(deltaSeconds);
        for (const effect of [...this.effects]) {
            if (this.effects.includes(effect)) effect.update(deltaSeconds);
        }
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
        this.gameHudDisplay.update();
        this.entityInspector?.update();
    }
}
