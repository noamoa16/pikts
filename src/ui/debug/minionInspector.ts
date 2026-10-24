import { Color3, HighlightLayer, type Engine } from "#vendor/babylon";
import { Game } from "../../game";
import { Minion } from "../../objects/minion/minion";

export class MinionInspector {
    private readonly canvas: HTMLCanvasElement | null;
    private readonly panel: HTMLDivElement | null;
    private readonly highlightLayer: HighlightLayer;
    private pointerPosition: { x: number; y: number } | null = null;
    private highlightedMinion: Minion | null = null;

    constructor(
        private readonly game: Game,
        engine: Engine,
    ) {
        this.canvas = engine.getRenderingCanvas();
        this.panel = this.createPanel(this.canvas?.parentElement ?? null);
        this.highlightLayer = new HighlightLayer("minion-debug-highlight", game.scene);

        this.canvas?.addEventListener("pointermove", this.onPointerMove);
        this.canvas?.addEventListener("pointerleave", this.onPointerLeave);
        game.scene.onDisposeObservable.add(() => this.remove());
    }

    private createPanel(parent: HTMLElement | null): HTMLDivElement | null {
        if (!(parent instanceof HTMLDivElement)) {
            return null;
        }
        const panel = document.createElement("div");
        Object.assign(panel.style, {
            position: "absolute",
            top: "12px",
            left: "12px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: "rgba(5, 8, 22, 0.82)",
            color: "#f7f6d8",
            fontSize: "13px",
            lineHeight: "1.5",
            fontFamily: "monospace",
            pointerEvents: "none",
            whiteSpace: "pre",
        } satisfies Partial<CSSStyleDeclaration>);
        panel.hidden = true;
        parent.append(panel);
        return panel;
    }

    private readonly onPointerMove = (event: PointerEvent): void => {
        const rect = this.canvas?.getBoundingClientRect();
        if (!rect || !this.canvas) {
            this.pointerPosition = null;
            return;
        }
        const x = event.clientX - rect.left;
        this.pointerPosition = {
            // The rendered canvas is mirrored by MainCamera's CSS transform.
            x: this.canvas.clientWidth - x,
            y: event.clientY - rect.top,
        };
    };

    private readonly onPointerLeave = (): void => {
        this.pointerPosition = null;
        this.setHighlightedMinion(null);
        this.panel?.setAttribute("hidden", "");
    };

    public update(): void {
        if (!this.pointerPosition || !this.panel) {
            return;
        }
        const { x, y } = this.pointerPosition;
        const result = this.game.scene.pick(
            x,
            y,
            mesh => this.game.objects.some(
                object => object instanceof Minion && object.mesh === mesh,
            ),
        );
        const minion = result?.hit
            ? this.game.objects.find(
                (object): object is Minion => object instanceof Minion && object.mesh === result.pickedMesh,
            ) ?? null
            : null;

        this.setHighlightedMinion(minion);
        if (!minion) {
            this.panel.hidden = true;
            return;
        }

        const { x: px, y: py, z: pz } = minion.groundingPosition;
        this.panel.textContent = [
            `Minion #${minion.id}`,
            `Position: x=${px} `,
            `          y=${py}`,
            `          z=${pz}`,
        ].join("\n");
        this.panel.hidden = false;
    }

    private setHighlightedMinion(minion: Minion | null): void {
        if (this.highlightedMinion === minion) {
            return;
        }
        if (this.highlightedMinion) {
            this.highlightLayer.removeMesh(this.highlightedMinion.mesh);
        }
        this.highlightedMinion = minion;
        if (minion) {
            this.highlightLayer.addMesh(minion.mesh, new Color3(1, 0.85, 0.15));
        }
    }

    public remove(): void {
        this.canvas?.removeEventListener("pointermove", this.onPointerMove);
        this.canvas?.removeEventListener("pointerleave", this.onPointerLeave);
        this.setHighlightedMinion(null);
        this.panel?.remove();
        this.highlightLayer.dispose();
    }
}
