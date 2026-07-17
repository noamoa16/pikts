import { Engine, type Scene } from "#vendor/babylon";
import { createDemoScene } from "./scenes/demoScene";
import { showTitleScreen } from "./scenes/titleScreen";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
    throw new Error("#app was not found.");
}

applyGlobalLayoutStyles(app);

const canvas = document.createElement("canvas");
canvas.style.display = "block";
canvas.style.width = "100%";
canvas.style.height = "100%";
canvas.style.touchAction = "none";
canvas.style.outline = "none";
canvas.tabIndex = 0;
app.append(canvas);

const engine = new Engine(canvas, true);
let currentScene: Scene | null = null;

// タイトルスクリーンから始まる
showTitleScreen({
    app,
    // スタートが押されたらDemoSceneに移る
    onStart: () => {
        currentScene = createDemoScene(engine);
        canvas.focus();
    },
});

const TARGRT_FPS = 60;
window.setInterval(() => {
    engine.beginFrame();
    currentScene?.render();
    engine.endFrame();
}, 1000 / TARGRT_FPS);

window.addEventListener("resize", () => {
    engine.resize();
});

function applyGlobalLayoutStyles(app: HTMLDivElement): void {
    document.documentElement.style.width = "100%";
    document.documentElement.style.height = "100%";
    document.body.style.margin = "0";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.overflow = "hidden";
    document.body.style.background = "#050816";
    app.style.position = "relative";
    app.style.width = "100%";
    app.style.height = "100%";
    app.style.fontFamily = '"Trebuchet MS", "Hiragino Sans", sans-serif';
}
