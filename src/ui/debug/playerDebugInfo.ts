import type { Engine } from "#vendor/babylon";
import type { Game } from "../../game";
import { Minion, MinionState } from "../../objects/minion/minion";
import type { Player } from "../../objects/player/player";

export class PlayerDebugInfo {
    private readonly panel: HTMLDivElement | null = null;
    private readonly info: HTMLPreElement | null = null;
    private readonly minionCount: HTMLDivElement | null = null;

    constructor(
        private readonly game: Game,
        private readonly player: Player,
        engine: Engine | null,
    ) {
        if (!engine) {
            return;
        }

        const parent = engine.getRenderingCanvas()?.parentElement;
        if (!(parent instanceof HTMLDivElement)) {
            return;
        }

        const panel = document.createElement("div");
        Object.assign(panel.style, {
            position: "absolute",
            top: "12px",
            right: "12px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: "rgba(5, 8, 22, 0.82)",
            color: "#f7f6d8",
            fontSize: "13px",
            lineHeight: "1.5",
            fontFamily: "monospace",
            pointerEvents: "none",
        } satisfies Partial<CSSStyleDeclaration>);
        const info = document.createElement("pre");
        Object.assign(info.style, {
            margin: "0",
            whiteSpace: "pre",
        } satisfies Partial<CSSStyleDeclaration>);
        info.textContent = "Loading ...";
        panel.append(info);

        const minionCount = document.createElement("div");
        Object.assign(minionCount.style, {
            position: "absolute",
            left: "50%",
            bottom: "20px",
            transform: "translateX(-50%)",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "rgba(5, 8, 22, 0.82)",
            color: "#f7f6d8",
            fontSize: "13px",
            lineHeight: "1.5",
            fontFamily: "monospace",
            pointerEvents: "none",
            whiteSpace: "nowrap",
        } satisfies Partial<CSSStyleDeclaration>);

        parent.append(panel, minionCount);
        this.panel = panel;
        this.info = info;
        this.minionCount = minionCount;
    }

    public update(): void {
        if (!this.info) {
            return;
        }

        const position = this.player.groundingPosition;
        this.info.textContent = [
            "Player",
            `Position: x=${position.x.toFixed(2)} y=${position.y.toFixed(2)} z=${position.z.toFixed(2)}`,
            `Update: ${this.game.frameTimerUpdate.averageTime.toFixed(2)} ms`,
            `Collision: ${this.game.frameTimerCollision.averageTime.toFixed(2)} ms`,
        ].join("\n");

        const minions = this.game.objects.filter((object): object is Minion => object instanceof Minion);
        const followingMinions = minions.filter(minion => minion.state === MinionState.following).length;
        if (this.minionCount) {
            this.minionCount.textContent = `${followingMinions}, ${minions.length}`;
        }
    }

    public remove(): void {
        this.panel?.remove();
        this.minionCount?.remove();
    }
}
