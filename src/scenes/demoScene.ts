import {
    Color3,
    Color4,
    type Engine,
    Scene,
    Vector3,
} from "#vendor/babylon";
import { DebugInfo } from "../ui/debug/debugInfo";
import { MainCamera } from "../rendering/camera";
import { createFillLight, createShadowMap, createSunLight } from "../rendering/light";
import { Block } from "../objects/block";
import { Entity } from "../objects/entity";
import { Player } from "../objects/player";
import { Collision } from "../physics/collision";
import { Dpad } from "../ui/dpad";
import { createDemoFloor } from "./demoScene/floor";
import { createBoundaryWalls, createBounds } from "./demoScene/walls";
import { RedMinion } from "../objects/minion/redMinion";

const PLAY_AREA = 5;
const BOUNDS_Z = 0.5;
const IS_DEV = import.meta.env.DEV;

// let shadowGen: ShadowGenerator;

export function createDemoScene(engine: Engine): Scene {
    const scene = new Scene(engine);
    scene.collisionsEnabled = true; // 物体同士の衝突を有効化
    scene.gravity = new Vector3(0, 0, -5);
    scene.clearColor = new Color4(0.79, 0.9, 0.98, 1); // 背景色 (水色)
    scene.ambientColor = new Color3(0.4, 0.4, 0.4); // 均一光 (白色)

    const mainCamera = new MainCamera(scene);

    createFillLight(scene);
    const sunLight = createSunLight(scene);
    createDemoFloor(scene, PLAY_AREA);

    // オブジェクト生成
    const player = new Player(scene, new Vector3(0, 0, 0), mainCamera);
    let objects: Entity[] = [
        player,
        new Block(scene, new Vector3(2, 1, 0)),
    ];
    for(let i = -3; i <= -1; i++){
        for(let j = -3; j <= -1; j++){
            objects.push(new RedMinion(scene, new Vector3(i, j, 0)));
        }
    }
    const collision = new Collision();
    createBoundaryWalls(scene, PLAY_AREA);
    createBounds(scene, PLAY_AREA, BOUNDS_Z);
    // shadowGen =
    createShadowMap(sunLight, objects.map(o => o.mesh));
    const debugInfo = new DebugInfo(IS_DEV ? engine : null);
    const dpad = new Dpad(
        engine,
        (action, pressed) => player.setVirtualInput(action, pressed)
    );

    // 定期実行
    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        objects.forEach(o => o.update(deltaSeconds));
        collision.dispatchEvents(objects);
        mainCamera.target = player.position;

        // デバッグ出力
        if (debugInfo.valid) {
            const position = player.position;
            debugInfo.text = `Player: x=${position.x.toFixed(2)} y=${position.y.toFixed(2)} z=${position.z.toFixed(2)}`;
        }
    });

    // 画面がリサイズされたら
    const onResize = () => {
        dpad.adjustLayout();
    };
    window.addEventListener("resize", onResize);

    // Sceneが破棄されたらイベントを無効化
    scene.onDisposeObservable.add(() => {
        window.removeEventListener("resize", onResize);
        debugInfo.remove();
        player.removeEvents();
        dpad.remove();
    });

    return scene;
}
