import {
    Color3,
    Color4,
    type Engine,
    Scene,
    Vector3,
} from "#vendor/babylon";
import { PlayerDebugOverlay } from "../ui/debug/playerDebugOverlay";
import { createFillLight, createShadowMap, createSunLight } from "../rendering/light";
import { Block } from "../objects/block";
import { Player } from "../objects/player/player";
import { Dpad } from "../ui/dpad";
import { GrassFloor } from "../objects/grassFloor";
import { BoundaryWall } from "../objects/boundaryWall";
import { Game } from "../game";
import { isMoveAction, type Action } from "../actions/action";
import { Minion } from "../objects/minion/minion";
import { RedMinion, YellowMinion, BlueMinion } from "../objects/minion/minions";
import { RedOnion, YellowOnion, BlueOnion } from "../objects/onion/onions";
import { Slope } from "../objects/slope";
import { Dir4 } from "../physics/figure";
import {
    RedPellet1,
    RedPellet5,
    BluePellet1,
    YellowPellet1,
    BluePellet5,
    YellowPellet5,
    RedPellet10,
    YellowPellet10,
    BluePellet10,
    RedPellet20,
    YellowPellet20,
    BluePellet20,
} from "../objects/carriable/pellets";
import { RedPelletPlant1 } from "../objects/enemy/pelletPlant/pelletPlants";

// let shadowGen: ShadowGenerator;

export function createDemoScene(engine: Engine): Scene {
    const game = new Game(new Scene(engine));
    game.scene.collisionsEnabled = true; // 物体同士の衝突を有効化
    game.scene.gravity = new Vector3(0, 0, -15);
    game.scene.clearColor = new Color4(0.79, 0.9, 0.98, 1); // 背景色 (水色)
    game.scene.ambientColor = new Color3(0.4, 0.4, 0.4); // 均一光 (白色)

    createFillLight(game.scene);
    const sunLight = createSunLight(game.scene);

    const PLAY_AREA = 10;
    new GrassFloor(game, new Vector3(-PLAY_AREA, 0, 0), PLAY_AREA);
    new GrassFloor(game, new Vector3(0, 0, 0), PLAY_AREA);
    new BoundaryWall(game, new Vector3(0, PLAY_AREA, 0), PLAY_AREA, game.isDevelopment);
    new BoundaryWall(game, new Vector3(0, -PLAY_AREA, 0), PLAY_AREA, game.isDevelopment);
    new BoundaryWall(game, new Vector3(PLAY_AREA, 0, 0), PLAY_AREA, game.isDevelopment);

    // オブジェクト生成
    const player = new Player(game, new Vector3(0, 0, 0));
    new Block(game, new Vector3(3, 1, 0));
    new Slope(game, new Vector3(-2, -3, 0), 1, Dir4.Right);
    new Block(game, new Vector3(-0.5, -3, 0));
    new Slope(game, new Vector3(2.5, -3, 0), 1, Dir4.Right);
    for(let i = -2; i <= -0.5; i += 0.2) new RedMinion(game, new Vector3(i, 0, 0));
    for(let i = -2; i <= -0.5; i += 0.2) new YellowMinion(game, new Vector3(i, 0.5, 0));
    for(let i = -2; i <= -0.5; i += 0.2) new BlueMinion(game, new Vector3(i, 1, 0));
    new RedOnion(game, new Vector3(-3, 3, 0));
    new YellowOnion(game, new Vector3(-1, 3, 0));
    new BlueOnion(game, new Vector3(1, 3, 0));
    new RedPellet5(game, new Vector3(-3, 1, 0));
    new BluePellet1(game, new Vector3(3, 0, 1));
    new YellowPellet1(game, new Vector3(3, 1, 1));
    new YellowPellet5(game, new Vector3(3, -2, 0));

    new RedPelletPlant1(game, new Vector3(-2, -1, 0));

    new Block(game, new Vector3(-5, -1, 0));
    new RedPellet1(game, new Vector3(-5, -1, 1));
    new BluePellet5(game, new Vector3(-6, -4, 0));

    new RedPellet10(game, new Vector3(-7, 0, 0));
    new YellowPellet10(game, new Vector3(-9, 0, 0));
    new BluePellet10(game, new Vector3(-11, 0, 0));
    new RedPellet20(game, new Vector3(-7, 3, 0));
    new YellowPellet20(game, new Vector3(-9, 3, 0));
    new BluePellet20(game, new Vector3(-11, 3, 0));

    // shadowGen =
    createShadowMap(sunLight, game.objects.map(o => o.mesh));
    const playerDebugOverlay = new PlayerDebugOverlay(game, player, game.isDevelopment ? engine : null);
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
                    player.handleHoldPressed();
                }
                else {
                    player.handleHoldReleased();
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
        },
        game.isDevelopment ? {
            onCarrySpeed2xChange: enabled => {
                game.debugCarrySpeed2x = enabled;
            },
            onAddMinions: () => {
                const minionCount = game.objects.filter(object => object instanceof Minion).length;
                if (minionCount > 200) return;

                const spawnPosition = player.position.add(new Vector3(0, 0, 2));
                for (let i = 0; i < 5; i++) new RedMinion(game, spawnPosition.clone());
                for (let i = 0; i < 5; i++) new YellowMinion(game, spawnPosition.clone());
                for (let i = 0; i < 5; i++) new BlueMinion(game, spawnPosition.clone());
            },
        } : undefined,
        context => game.minionCountDisplay.drawRecordingOverlay(context),
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
        dpad.setHoldPrompt(player.hasNearbyBuriedMinion());

        playerDebugOverlay.update();
    });

    // 画面がリサイズされたら
    const onResize = () => {
        dpad.adjustLayout();
    };
    window.addEventListener("resize", onResize);

    // Sceneが破棄されたらイベントを無効化
    game.scene.onDisposeObservable.add(() => {
        window.removeEventListener("resize", onResize);
        playerDebugOverlay.remove();
        player.removeEvents();
        dpad.remove();
    });

    return game.scene;
}
