import type { Game } from "../game";
import { Player } from "../objects/player/player";
import { Minion, MinionState } from "../objects/minion/minion";
import { minionColorToString } from "../objects/minion/color";
import { getViewportUiScale } from "./viewportScale";

export class MinionCountDisplay {
    private static readonly SIZE = 96;
    private static readonly MIN_SIZE = 36;

    private readonly container: HTMLDivElement | null = null;
    private readonly counts: [HTMLDivElement, HTMLDivElement] | null = null;
    private readonly heldMinionIndicator: HTMLDivElement | null = null;
    private readonly playerHpIndicator: HTMLDivElement | null = null;
    private readonly playerHpFill: HTMLDivElement | null = null;
    private readonly playerLabel: HTMLDivElement | null = null;

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
        const heldMinionIndicator = document.createElement("div");
        Object.assign(heldMinionIndicator.style, {
            alignSelf: "center",
            width: "40px",
            height: "40px",
            flex: "none",
            borderRadius: "50%",
            backgroundColor: "black",
            pointerEvents: "none",
        } satisfies Partial<CSSStyleDeclaration>);
        const playerHpIndicator = document.createElement("div");
        Object.assign(playerHpIndicator.style, {
            position: "relative",
            alignSelf: "center",
            width: "40px",
            height: "40px",
            flex: "none",
            borderRadius: "50%",
            backgroundColor: "black",
            pointerEvents: "none",
            marginRight: "32px",
        } satisfies Partial<CSSStyleDeclaration>);
        const playerHpFill = document.createElement("div");
        Object.assign(playerHpFill.style, {
            position: "absolute",
            inset: "0",
            borderRadius: "50%",
        } satisfies Partial<CSSStyleDeclaration>);
        const playerLabel = document.createElement("div");
        Object.assign(playerLabel.style, {
            position: "absolute",
            left: "50%",
            bottom: "100%",
            transform: "translateX(-50%)",
            marginBottom: "4px",
            color: "#f7f6d8",
            fontSize: "14px",
            lineHeight: "1",
            fontFamily: "monospace",
            textShadow: "0 1px 3px #050816",
            whiteSpace: "nowrap",
        } satisfies Partial<CSSStyleDeclaration>);
        playerLabel.textContent = "Player";
        playerHpIndicator.append(playerHpFill, playerLabel);
        container.append(playerHpIndicator, heldMinionIndicator, ...counts);
        parent.append(container);

        this.container = container;
        this.counts = counts as [HTMLDivElement, HTMLDivElement];
        this.heldMinionIndicator = heldMinionIndicator;
        this.playerHpIndicator = playerHpIndicator;
        this.playerHpFill = playerHpFill;
        this.playerLabel = playerLabel;
        this.adjustLayout();
        window.addEventListener("resize", this.adjustLayout);
    }

    public update(): void {
        if (!this.counts || !this.heldMinionIndicator || !this.playerHpFill) {
            return;
        }

        const minions = this.game.objects.filter((object): object is Minion => object instanceof Minion);
        const heldMinion = minions.find(minion => minion.state === MinionState.held);
        const heldMinionColor = heldMinion ? minionColorToString(heldMinion.minionColor) : null;
        this.heldMinionIndicator.style.backgroundColor = heldMinionColor ?? "black";
        const player = this.game.objects.find((object): object is Player => object instanceof Player);
        const hpRatio = player ? Math.max(0, Math.min(1, player.hp / player.maxHp)) : 0;
        const hpColor = getHpColor(hpRatio);
        this.playerHpFill.style.background = `conic-gradient(${hpColor} 0deg ${hpRatio * 360}deg, transparent ${hpRatio * 360}deg 360deg)`;
        this.counts[0].textContent = `${minions.filter(minion => minion.state === MinionState.following).length}`;
        this.counts[1].textContent = `${minions.length}`;
    }

    public drawRecordingOverlay(context: CanvasRenderingContext2D): void {
        if (!this.container || !this.counts || !this.heldMinionIndicator || !this.playerHpIndicator || !this.playerHpFill || !this.playerLabel || !this.canvas) return;

        const canvasBounds = this.canvas.getBoundingClientRect();
        if (canvasBounds.width === 0 || canvasBounds.height === 0) return;

        const scaleX = this.canvas.width / canvasBounds.width;
        const scaleY = this.canvas.height / canvasBounds.height;
        for (const count of [this.playerHpIndicator, this.heldMinionIndicator, ...this.counts]) {
            const bounds = count.getBoundingClientRect();
            const x = (bounds.left - canvasBounds.left) * scaleX;
            const y = (bounds.top - canvasBounds.top) * scaleY;
            const width = bounds.width * scaleX;
            const height = bounds.height * scaleY;
            const style = window.getComputedStyle(count);

            context.beginPath();
            if (count === this.playerHpIndicator) {
                context.fillStyle = style.backgroundColor;
                context.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
                context.fill();
                const playerHpFillBounds = this.playerHpFill.getBoundingClientRect();
                const player = this.game.objects.find((object): object is Player => object instanceof Player);
                const hpRatio = player ? Math.max(0, Math.min(1, player.hp / player.maxHp)) : 0;
                if (hpRatio > 0) {
                    const fillX = (playerHpFillBounds.left - canvasBounds.left) * scaleX;
                    const fillY = (playerHpFillBounds.top - canvasBounds.top) * scaleY;
                    context.fillStyle = getHpColor(hpRatio);
                    context.beginPath();
                    context.moveTo(fillX + width / 2, fillY + height / 2);
                    context.arc(fillX + width / 2, fillY + height / 2, width / 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpRatio);
                    context.closePath();
                    context.fill();
                }
                const labelBounds = this.playerLabel.getBoundingClientRect();
                const labelStyle = window.getComputedStyle(this.playerLabel);
                context.fillStyle = labelStyle.color;
                context.font = `${labelStyle.fontWeight} ${parseFloat(labelStyle.fontSize) * scaleY}px ${labelStyle.fontFamily}`;
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillText("Player", (labelBounds.left - canvasBounds.left + labelBounds.width / 2) * scaleX, (labelBounds.top - canvasBounds.top + labelBounds.height / 2) * scaleY);
                continue;
            } else if (count === this.heldMinionIndicator) {
                context.fillStyle = style.backgroundColor;
                context.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
            } else {
                context.fillStyle = style.backgroundColor;
                context.roundRect(x, y, width, height, parseFloat(style.borderRadius) * scaleX);
            }
            context.fill();

            if (count === this.heldMinionIndicator) continue;
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

function getHpColor(ratio: number): string {
    const red = [255, 0, 0];
    const yellow = [255, 255, 0];
    const green = [0, 255, 0];
    const from = ratio <= 0.5 ? red : yellow;
    const to = ratio <= 0.5 ? yellow : green;
    const progress = ratio <= 0.5 ? ratio * 2 : (ratio - 0.5) * 2;
    const channels = from.map((channel, index) => Math.round(channel + (to[index] - channel) * progress));
    return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
}
