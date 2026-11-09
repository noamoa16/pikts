import type { Engine } from "#vendor/babylon";
import type { Game } from "../../game";
import type { Player } from "../../objects/player/player";
import { createDebugInfo, createDebugPanel } from "./debugPanel";
import { TransformEditor } from "./transformEditor";
import { getViewportUiScale } from "../viewportScale";

export class PlayerDebugOverlay {
    private readonly panel: HTMLDivElement | null = null;
    private readonly info: HTMLPreElement | null = null;
    private transformEditor: TransformEditor | null = null;

    constructor(
        private readonly game: Game,
        private readonly player: Player,
        engine: Engine | null,
    ) {
        if (!engine) {
            return;
        }

        const parent = engine.getRenderingCanvas()?.parentElement ?? null;
        const panel = createDebugPanel(parent, "right");
        if (!panel) return;

        this.transformEditor = new TransformEditor(() => this.player);

        const info = createDebugInfo();
        info.textContent = "Loading ...";
        panel.append(info, this.transformEditor.element);

        this.panel = panel;
        this.info = info;
        this.adjustLayout();
        window.addEventListener("resize", this.adjustLayout);
    }

    public update(): void {
        if (!this.info) {
            return;
        }

        this.info.textContent = [
            "Player",
            `Update: ${this.game.frameTimerUpdate.averageTime.toFixed(2)} ms`,
            `Collision: ${this.game.frameTimerCollision.averageTime.toFixed(2)} ms`,
        ].join("\n");
        this.transformEditor?.update();
    }

    public remove(): void {
        window.removeEventListener("resize", this.adjustLayout);
        this.panel?.remove();
    }

    private readonly adjustLayout = (): void => {
        if (this.panel) {
            this.panel.style.zoom = getViewportUiScale().toString();
        }
    };
}
