import {
    Color3,
    Color4,
    type Engine,
    Scene,
    Vector3,
} from "#vendor/babylon";
import { DebugInfo } from "../ui/debug/debugInfo";
import { EntityInspector } from "../ui/debug/entityInspector";
import { createFillLight, createShadowMap, createSunLight } from "../rendering/light";
import { Block } from "../objects/block";
import { Player } from "../objects/player/player";
import { Dpad } from "../ui/dpad";
import { createDemoFloor } from "./demoScene/floor";
import { createBoundaryWalls } from "./demoScene/walls";
import { RedMinion } from "../objects/minion/redMinion";
import { Game } from "../game";
import { isMoveAction, type Action } from "../actions/action";
import { RedOnion } from "../objects/onion/redOnion";
import { Slope } from "../objects/slope";
import { Dir4 } from "../physics/figure";
import { Pellet1 } from "../objects/carriable/pellet1";
import { Pellet5 } from "../objects/carriable/pellet5";
import { YellowMinion } from "../objects/minion/yellowMinion";
import { BlueMinion } from "../objects/minion/blueMinion";

const PLAY_AREA = 5;
const BOUNDS_Z = 0.5;
const IS_DEV = import.meta.env.DEV;

// let shadowGen: ShadowGenerator;

export function createDemoScene(engine: Engine): Scene {
    const game = new Game(new Scene(engine));
    game.scene.collisionsEnabled = true; // 物体同士の衝突を有効化
    game.scene.gravity = new Vector3(0, 0, -15);
    game.scene.clearColor = new Color4(0.79, 0.9, 0.98, 1); // 背景色 (水色)
    game.scene.ambientColor = new Color3(0.4, 0.4, 0.4); // 均一光 (白色)

    createFillLight(game.scene);
    const sunLight = createSunLight(game.scene);
    createDemoFloor(game, PLAY_AREA);
    createBoundaryWalls(game, PLAY_AREA, BOUNDS_Z);

    // オブジェクト生成
    const player = new Player(game, new Vector3(0, 0, 0));
    new Block(game, new Vector3(2, 1, 0));
    new Slope(game, new Vector3(-2, -3, 0), 1, Dir4.Right);
    new Block(game, new Vector3(-0.5, -3, 0));
    new Slope(game, new Vector3(2.5, -3, 0), 1, Dir4.Right);
    for(let i = -3; i <= -2; i += 0.5) new RedMinion(game, new Vector3(i, 0, 0));
    for(let i = -3; i <= -2; i += 0.5) new YellowMinion(game, new Vector3(i, 0.5, 0));
    for(let i = -3; i <= -2; i += 0.5) new BlueMinion(game, new Vector3(i, 1, 0));
    new RedOnion(game, new Vector3(-3, 3, 0));
    new Pellet1(game, new Vector3(-2, -1, 0));
    new Pellet5(game, new Vector3(-2, 1, 0));
    // shadowGen =
    createShadowMap(sunLight, game.objects.map(o => o.mesh));
    const debugInfo = new DebugInfo(IS_DEV ? engine : null);
    const entityInspector = IS_DEV ? new EntityInspector(game, engine) : null;
    const handleNonMovementAction = (action: Action, pressed: boolean) => {
        switch (action) {
            case "whistle":
                player.whistle.active = pressed;
                break;
            case "rotate":
                if (pressed) {
                    game.camera.startRotate(player.rotation.z);
                }
                break;
            case "hold":
                if (pressed) {
                    player.tryHoldMinion();
                }
                else {
                    player.tryReleaseMinion();
                }
                break;
            default:
                break;
        }
    };
    const dpad = new Dpad(
        engine,
       (action, pressed) => {
            if(isMoveAction(action)){
                player.setVirtualInput(action, pressed);
            }
            else {
                handleNonMovementAction(action, pressed);
            }
        }
    );
    player.setKeyboardActionHandler((action, pressed) => {
        dpad.setKeyboardPressed(action, pressed);
        if (!isMoveAction(action)) {
            handleNonMovementAction(action, pressed);
        }
    });

    // 定期実行
    game.scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = Math.min(engine.getDeltaTime() / 1000, 1 / Game.TARGET_FPS);
        game.update(deltaSeconds);
        game.camera.update(deltaSeconds, player.position);
        player.whistle.update(deltaSeconds, game.objects);

        // デバッグ出力
        if (debugInfo.valid) {
            const position = player.groundingPosition;
            const playerInfo = `Player: x=${position.x.toFixed(2)} y=${position.y.toFixed(2)} z=${position.z.toFixed(2)}`;
            const fpsInfoUpdate = `Update: ${game.frameTimerUpdate.averageTime.toFixed(2)} ms`;
            const fpsInfoCollision = `Collision: ${game.frameTimerCollision.averageTime.toFixed(2)} ms`;
            debugInfo.text = `${playerInfo}, ${fpsInfoUpdate}, ${fpsInfoCollision}`;
        }
        entityInspector?.update();
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
