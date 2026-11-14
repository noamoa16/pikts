import type { Game } from "../game";
import { Minion, MinionState } from "../objects/minion/minion";
import { getViewportUiScale } from "./viewportScale";

export class MinionCountDisplay {
    private static readonly SIZE = 96;
    private static readonly MIN_SIZE = 36;

    private readonly container: HTMLDivElement | null = null;
    private readonly counts: [HTMLDivElement, HTMLDivElement] | null = null;

    constructor(
        private readonly game: Game,
        private readonly canvas: HTMLCanvasElement | null,
    ) {
        const parent = this.canvas?.parentElement;
        if (!(parent instanceof HTMLDivElement)) {
            return;
        }

        const counts = ["Following", "Total"].map(() => {
            const count = document.createElement("div");
            Object.assign(count.style, {
                boxSizing: "border-box",
                width: "60px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(5, 8, 22, 0.82)",
                color: "#f7f6d8",
                fontSize: "18px",
                lineHeight: "1.5",
                fontFamily: "monospace",
                textAlign: "center",
                pointerEvents: "none",
                whiteSpace: "nowrap",
            } satisfies Partial<CSSStyleDeclaration>);
            count.textContent = "0";
            return count;
        });
        const container = document.createElement("div");
        Object.assign(container.style, {
            position: "absolute",
            left: "50%",
            bottom: "20px",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "8px",
        } satisfies Partial<CSSStyleDeclaration>);
        container.append(...counts);
        parent.append(container);

        this.container = container;
        this.counts = counts as [HTMLDivElement, HTMLDivElement];
        this.adjustLayout();
        window.addEventListener("resize", this.adjustLayout);
    }

    public update(): void {
        if (!this.counts) {
            return;
        }

        const minions = this.game.objects.filter((object): object is Minion => object instanceof Minion);
        this.counts[0].textContent = `${minions.filter(minion => minion.state === MinionState.following).length}`;
        this.counts[1].textContent = `${minions.length}`;
    }

    public drawRecordingOverlay(context: CanvasRenderingContext2D): void {
        if (!this.container || !this.counts || !this.canvas) return;

        const canvasBounds = this.canvas.getBoundingClientRect();
        if (canvasBounds.width === 0 || canvasBounds.height === 0) return;

        const scaleX = this.canvas.width / canvasBounds.width;
        const scaleY = this.canvas.height / canvasBounds.height;
        for (const count of this.counts) {
            const bounds = count.getBoundingClientRect();
            const x = (bounds.left - canvasBounds.left) * scaleX;
            const y = (bounds.top - canvasBounds.top) * scaleY;
            const width = bounds.width * scaleX;
            const height = bounds.height * scaleY;
            const style = window.getComputedStyle(count);

            context.fillStyle = style.backgroundColor;
            context.beginPath();
            context.roundRect(x, y, width, height, parseFloat(style.borderRadius) * scaleX);
            context.fill();

            context.fillStyle = style.color;
            context.font = `${style.fontWeight} ${parseFloat(style.fontSize) * scaleY}px ${style.fontFamily}`;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(count.textContent ?? "", x + width / 2, y + height / 2);
        }
    }

    public remove(): void {
        window.removeEventListener("resize", this.adjustLayout);
        this.container?.remove();
    }

    private readonly adjustLayout = (): void => {
        if (this.container) {
            this.container.style.zoom = getViewportUiScale(
                MinionCountDisplay.SIZE,
                MinionCountDisplay.MIN_SIZE,
            ).toString();
        }
    };
}
