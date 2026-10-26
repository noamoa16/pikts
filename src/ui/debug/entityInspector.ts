import { Color3, HighlightLayer, type Engine } from "#vendor/babylon";
import { Game } from "../../game";
import { Carriable, CarriableState } from "../../objects/carriable/carriable";
import { Minion, MinionState } from "../../objects/minion/minion";

type InspectedEntity = Minion | Carriable;

export class EntityInspector {
    private readonly canvas: HTMLCanvasElement | null;
    private readonly panel: HTMLDivElement | null;
    private readonly info: HTMLPreElement | null;
    private readonly copyButton: HTMLButtonElement | null;
    private readonly highlightLayer: HighlightLayer;
    private pointerPosition: { x: number; y: number } | null = null;
    private highlightedEntity: InspectedEntity | null = null;
    private pinnedEntity: InspectedEntity | null = null;

    constructor(
        private readonly game: Game,
        engine: Engine,
    ) {
        this.canvas = engine.getRenderingCanvas();
        this.panel = this.createPanel(this.canvas?.parentElement ?? null);
        this.info = this.panel?.querySelector("pre") ?? null;
        this.copyButton = this.panel?.querySelector("button") ?? null;
        this.highlightLayer = new HighlightLayer("entity-debug-highlight", game.scene);

        this.canvas?.addEventListener("pointermove", this.onPointerMove);
        this.canvas?.addEventListener("pointerleave", this.onPointerLeave);
        document.addEventListener("pointerdown", this.onPointerDown);
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
            pointerEvents: "auto",
        } satisfies Partial<CSSStyleDeclaration>);
        const info = document.createElement("pre");
        Object.assign(info.style, {
            margin: "0 0 8px",
            whiteSpace: "pre",
            userSelect: "text",
            cursor: "text",
        } satisfies Partial<CSSStyleDeclaration>);
        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.textContent = "Copy";
        copyButton.addEventListener("click", this.onCopyClick);
        panel.append(info, copyButton);
        panel.hidden = true;
        parent.append(panel);
        return panel;
    }

    private readonly onCopyClick = (): void => {
        if (this.info?.textContent) {
            void navigator.clipboard.writeText(this.info.textContent);
        }
    };

    private readonly onPointerMove = (event: PointerEvent): void => {
        const rect = this.canvas?.getBoundingClientRect();
        if (!rect || !this.canvas) {
            this.pointerPosition = null;
            return;
        }
        this.pointerPosition = {
            // The rendered canvas is mirrored by MainCamera's CSS transform.
            x: this.canvas.clientWidth - (event.clientX - rect.left),
            y: event.clientY - rect.top,
        };
    };

    private readonly onPointerLeave = (): void => {
        this.pointerPosition = null;
        if (!this.pinnedEntity) {
            this.setHighlightedEntity(null);
            this.panel?.setAttribute("hidden", "");
        }
    };

    private readonly onPointerDown = (event: PointerEvent): void => {
        if (event.button !== 0) {
            return;
        }
        if (event.target instanceof Node && this.panel?.contains(event.target)) {
            return;
        }
        const rect = this.canvas?.getBoundingClientRect();
        const insideCanvas = !!rect
            && event.clientX >= rect.left && event.clientX <= rect.right
            && event.clientY >= rect.top && event.clientY <= rect.bottom;
        const clickedEntity = insideCanvas && this.canvas && rect
            ? this.pickEntityAt(
                this.canvas.clientWidth - (event.clientX - rect.left),
                event.clientY - rect.top,
            )
            : null;

        if (this.pinnedEntity && clickedEntity !== this.pinnedEntity) {
            this.pinnedEntity = null;
        } else if (!this.pinnedEntity && clickedEntity) {
            this.pinnedEntity = clickedEntity;
        }
    };

    public update(): void {
        if (this.pinnedEntity && !this.game.objects.includes(this.pinnedEntity)) {
            this.pinnedEntity = null;
        }
        if (!this.panel) {
            return;
        }
        const entity = this.pinnedEntity ?? (this.pointerPosition
            ? this.pickEntityAt(this.pointerPosition.x, this.pointerPosition.y)
            : null);
        this.setHighlightedEntity(entity);
        if (!entity) {
            this.panel.hidden = true;
            return;
        }

        this.info!.textContent = this.formatInfo(entity);
        this.panel.hidden = false;
    }

    private formatInfo(entity: InspectedEntity): string {
        if (entity instanceof Minion) {
            const { x, y, z } = entity.groundingPosition;
            return [
                `${entity.constructor.name} #${entity.id}`,
                `State: ${MinionState[entity.state]}`,
                `Position: x=${x}`,
                `          y=${y}`,
                `          z=${z}`,
            ].join("\n");
        }

        const { x, y, z } = entity.position;
        return [
            `${entity.constructor.name} #${entity.id}`,
            `State: ${CarriableState[entity.state]}`,
            `Carriers: ${entity.carrierCount} (${entity.minCarriers}~${entity.maxCarriers})`,
            `Position: x=${x} y=${y} z=${z}`,
        ].join("\n");
    }

    private pickEntityAt(x: number, y: number): InspectedEntity | null {
        const result = this.game.scene.pick(
            x,
            y,
            mesh => this.game.objects.some(
                object => (object instanceof Minion || object instanceof Carriable)
                    && object.mesh === mesh,
            ),
        );
        return result?.hit
            ? this.game.objects.find(
                (object): object is InspectedEntity =>
                    (object instanceof Minion || object instanceof Carriable)
                    && object.mesh === result.pickedMesh,
            ) ?? null
            : null;
    }

    private setHighlightedEntity(entity: InspectedEntity | null): void {
        if (this.highlightedEntity === entity) {
            return;
        }
        if (this.highlightedEntity) {
            this.highlightLayer.removeMesh(this.highlightedEntity.mesh);
        }
        this.highlightedEntity = entity;
        if (entity) {
            this.highlightLayer.addMesh(entity.mesh, new Color3(1, 0.85, 0.15));
        }
    }

    public remove(): void {
        this.canvas?.removeEventListener("pointermove", this.onPointerMove);
        this.canvas?.removeEventListener("pointerleave", this.onPointerLeave);
        document.removeEventListener("pointerdown", this.onPointerDown);
        this.copyButton?.removeEventListener("click", this.onCopyClick);
        this.setHighlightedEntity(null);
        this.panel?.remove();
        this.highlightLayer.dispose();
    }
}
