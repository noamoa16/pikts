import type { Engine } from "#vendor/babylon";
import type { Action } from "../../actions/action";
import { CarrySpeedControl } from "../carrySpeedControl";
import { RecordingControl } from "../recordingControl";
import { getViewportUiScale } from "../viewportScale";
import { DpadButton } from "./button";

type OnPressed = (action: Action, pressed: boolean) => void;
type DebugControls = {
    onCarrySpeed2xChange: (enabled: boolean) => void;
    onAddMinions: () => void;
};

export class Dpad {
    private static readonly SIZE = 96;
    private static readonly MIN_SIZE = 30;

    private readonly container: HTMLDivElement;
    private readonly buttons = new Map<Action, DpadButton>();
    private holdDescription: HTMLSpanElement | null = null;
    private whistleDescription: HTMLSpanElement | null = null;
    private carrySpeedControl: CarrySpeedControl | null = null;
    private recordingControl: RecordingControl | null = null;

    constructor(
        engine: Engine,
        onPressed: OnPressed,
        debugControls?: DebugControls,
        drawRecordingOverlay?: (context: CanvasRenderingContext2D) => void,
    ) {
        const parent = engine.getRenderingCanvas()?.parentElement;
        if (!(parent instanceof HTMLDivElement)) {
            throw new Error('parent is not HTMLDivElement');
        }
        this.container = document.createElement("div");

        const leftContainer = this.createButtonGrid("left");
        leftContainer.append(
            this.createButton("up", "Move up", onPressed, 2, 2).element,
            this.createButton("left", "Move left", onPressed, 1, 3).element,
            this.createButton("right", "Move right", onPressed, 3, 3).element,
            this.createButton("down", "Move down", onPressed, 2, 4).element,
            this.createButton("rotate", "Rotate", onPressed, 3, 1).element,
        );
        this.container.append(leftContainer);

        const rightContainer = this.createButtonGrid("right");
        rightContainer.append(
            this.createButton("hold", "Hold", onPressed, { start: 2, end: 3 }, { start: 2, end: 4 }).element,
            this.createButton("whistle", "Whistle", onPressed, 1, 1).element,
        );
        this.container.append(rightContainer);

        if (debugControls) {
            this.container.append(this.createDebugControls(
                debugControls,
                engine.getRenderingCanvas(),
                drawRecordingOverlay,
            ));
        }

        parent.append(this.container);
        this.adjustLayout();
    }

    private createButtonGrid(side: "left" | "right"): HTMLDivElement {
        const container = document.createElement("div");
        Object.assign(container.style, {
            position: "absolute",
            [side]: "var(--dpad-offset)",
            bottom: "var(--dpad-offset)",
            width: "calc(var(--dpad-button-size) * 3)",
            height: "calc(var(--dpad-button-size) * 4)",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "repeat(4, 1fr)",
            placeItems: "center",
            pointerEvents: "auto",
            touchAction: "none",
            userSelect: "none",
            zIndex: "10",
        } satisfies Partial<CSSStyleDeclaration>);
        return container;
    }

    private createDebugControls(
        controls: DebugControls,
        canvas: HTMLCanvasElement | null,
        drawRecordingOverlay?: (context: CanvasRenderingContext2D) => void,
    ): HTMLDivElement {
        const panel = document.createElement("div");
        Object.assign(panel.style, {
            position: "absolute",
            right: "calc(var(--dpad-offset) + var(--dpad-button-size) * 3 + 12px)",
            bottom: "var(--dpad-offset)",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: "5px",
            width: "max-content",
            maxWidth: "min(200px, 38vw)",
            zIndex: "10",
            font: "600 12px/1.2 sans-serif",
            color: "#111",
            touchAction: "manipulation",
        } satisfies Partial<CSSStyleDeclaration>);

        this.carrySpeedControl = new CarrySpeedControl(controls.onCarrySpeed2xChange);
        this.recordingControl = new RecordingControl(canvas, drawRecordingOverlay);
        panel.append(this.carrySpeedControl.element, this.recordingControl.element);
        return panel;
    }

    public setKeyboardPressed(action: Action, pressed: boolean): void {
        this.buttons.get(action)?.setKeyboardPressed(pressed);
    }

    private createButton(
        action: Action,
        label: string,
        onPressed: OnPressed,
        gridColumn: number | string | { start: number; end: number },
        gridRow: number | string | { start: number; end: number },
    ): DpadButton {
        const button = new DpadButton(
            action, label, onPressed, gridColumn, gridRow,
            element => {
                if (action === "hold") this.holdDescription = element;
                if (action === "whistle") this.whistleDescription = element;
            },
        );
        this.buttons.set(action, button);
        return button;
    }

    public adjustLayout(): void {
        const buttonSize = getViewportUiScale(Dpad.SIZE, Dpad.MIN_SIZE) * Dpad.SIZE;
        const offset = Math.max(16, Math.round(buttonSize * 0.4));
        this.container.style.setProperty("--dpad-button-size", `${buttonSize}px`);
        this.container.style.setProperty("--dpad-offset", `${offset}px`);
    }

    public setHoldPrompt(pick: boolean): void {
        if (this.holdDescription) {
            this.holdDescription.textContent = pick ? "(pick)" : "(hold)";
        }
    }

    public setWhistlePrompt(switchMinion: boolean): void {
        if (this.whistleDescription) {
            this.whistleDescription.textContent = switchMinion ? "(switch)" : "(whistle)";
        }
    }

    public remove(): void {
        this.carrySpeedControl?.dispose();
        this.recordingControl?.dispose();
        this.container.remove();
    }
}
