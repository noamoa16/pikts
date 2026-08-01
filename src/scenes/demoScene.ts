import {
    Color3,
    Color4,
    type Engine,
    Scene,
    Vector3,
} from "#vendor/babylon";
import { DebugInfo } from "../ui/debug/debugInfo";
import { createFillLight, createShadowMap, createSunLight } from "../rendering/light";
import { Block } from "../objects/block";
import { Player } from "../objects/player/player";
import { Collision } from "../physics/collision";
import { Dpad } from "../ui/dpad";
import { createDemoFloor } from "./demoScene/floor";
import { createBoundaryWalls } from "./demoScene/walls";
import { RedMinion } from "../objects/minion/redMinion";
import { FrameTimer } from "../core/frameTimer";
import { Game } from "../game";
import { isMoveAction } from "../actions/action";

const PLAY_AREA = 5;
const BOUNDS_Z = 0.5;
const IS_DEV = import.meta.env.DEV;

// let shadowGen: ShadowGenerator;

export function createDemoScene(engine: Engine): Scene {
    const game = new Game(new Scene(engine));
    game.scene.collisionsEnabled = true; // 物体同士の衝突を有効化
    game.scene.gravity = new Vector3(0, 0, -5);
    game.scene.clearColor = new Color4(0.79, 0.9, 0.98, 1); // 背景色 (水色)
    game.scene.ambientColor = new Color3(0.4, 0.4, 0.4); // 均一光 (白色)

    createFillLight(game.scene);
    const sunLight = createSunLight(game.scene);
    createDemoFloor(game, PLAY_AREA);
    createBoundaryWalls(game, PLAY_AREA, BOUNDS_Z);

    // オブジェクト生成
    const player = new Player(game, new Vector3(0, 0, 0));
    new Block(game, new Vector3(2, 1, 0))
    for(let i = -3; i <= -1; i++){
        for(let j = -3; j <= -1; j++){
            new RedMinion(game, new Vector3(i, j, 0));
        }
    }
    const collision = new Collision();
    // shadowGen =
    createShadowMap(sunLight, game.objects.map(o => o.mesh));
    const debugInfo = new DebugInfo(IS_DEV ? engine : null);
    const dpad = new Dpad(
        engine,
       (action, pressed) => {
            if(isMoveAction(action)){
                player.setVirtualInput(action, pressed);
            }
            else if(action === 'rotate'){
                if(pressed){
                    game.camera.startRotate(player.rotation.z);
                }
            }
            else if(action === 'whistle'){
                player.whistle.active = pressed;
            }
            else if(action === 'hold'){
                if(pressed) player.tryHoldMinion();
                else player.tryReleaseMinion();
            }
        }
    );
    document.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key.toLowerCase() === 'f') {
            game.camera.startRotate(player.rotation.z);
        }
        else if(event.key.toLowerCase() === '[') {
            player.whistle.active = true;
        }
        else if(event.key.toLowerCase() === 'enter') {
            player.tryHoldMinion();
        }
    });
    document.addEventListener("keyup", (event: KeyboardEvent) => {
        if (event.key.toLowerCase() === '[') {
            player.whistle.active = false;
        }
        else if(event.key.toLowerCase() === 'enter') {
            player.tryReleaseMinion();
        }
    });

    // 定期実行
    const frameTimerUpdate = new FrameTimer(30);
    const frameTimerCollision = new FrameTimer(30);
    game.scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        frameTimerUpdate.measure(() => {
            game.objects.forEach(o => o.update(deltaSeconds));
        });
        frameTimerCollision.measure(() => {
            collision.dispatchEvents(game.objects);
        });
        game.camera.target = player.position;
        game.camera.update(deltaSeconds);
        player.whistle.update(deltaSeconds, game.objects);

        // デバッグ出力
        if (debugInfo.valid) {
            const position = player.groundingPosition;
            const playerInfo = `Player: x=${position.x.toFixed(2)} y=${position.y.toFixed(2)} z=${position.z.toFixed(2)}`;
            const fpsInfoUpdate = `Update: ${frameTimerUpdate.averageTime.toFixed(2)} ms`;
            const fpsInfoCollision = `Collision: ${frameTimerCollision.averageTime.toFixed(2)} ms`;
            debugInfo.text = `${playerInfo}, ${fpsInfoUpdate}, ${fpsInfoCollision}`;
        }
    });

    // 画面がリサイズされたら
    const onResize = () => {
        dpad.adjustLayout();
    };
    window.addEventListener("resize", onResize);

    // Sceneが破棄されたらイベントを無効化
    game.scene.onDisposeObservable.add(() => {
        window.removeEventListener("resize", onResize);
        debugInfo.remove();
        player.removeEvents();
        dpad.remove();
    });

    return game.scene;
}
