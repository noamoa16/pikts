import type { Engine } from "#vendor/babylon";
import { Action } from "../actions/action";

type OnPressed = (action: Action, pressed: boolean) => void;

export class Dpad {
    private container: HTMLDivElement | null = null;
    constructor(engine: Engine, onPressed: OnPressed) {
        const parent = engine.getRenderingCanvas()?.parentElement;
        if (!(parent instanceof HTMLDivElement)) {
            return;
        }
        this.container = document.createElement("div");
        Object.assign(this.container.style, {
            position: "absolute",
            left: "var(--dpad-offset)",
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

        this.container.append(
            Dpad.createButton("up", "Move up", onPressed, 2, 2),
            Dpad.createButton("left", "Move left", onPressed, 1, 3),
            Dpad.createButton("right", "Move right", onPressed, 3, 3),
            Dpad.createButton("down", "Move down", onPressed, 2, 4),
            Dpad.createButton("rotate", "Rotate", onPressed, 3, 1),
        );

        parent.append(this.container);
        this.adjustLayout();
    }

    private static createButton(
        action: Action,
        label: string,
        onPressed: OnPressed,
        gridColumn: number | string,
        gridRow: number | string,
    ): HTMLButtonElement {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("aria-label", label);
        Object.assign(button.style, {
            gridColumn: gridColumn.toString(),
            gridRow: gridRow.toString(),
            width: "var(--dpad-button-size)",
            height: "var(--dpad-button-size)",
            padding: "0",
            border: "3px solid #111",
            background: "rgba(238, 246, 255, 0.92)",
            borderRadius: "2px",
            boxSizing: "border-box",
            position: "relative",
            cursor: "pointer",
            touchAction: "none",
            userSelect: "none",
            transition: "transform 0.08s ease, background 0.08s ease",
        } satisfies Partial<CSSStyleDeclaration>);
        button.style.setProperty(
            "-webkit-tap-highlight-color",
            "transparent",
        );

        if (action === "rotate") {
            const content = Dpad.createButtonText("F", "(rotate)");
            button.append(content);
        } else {
            const arrow = document.createElement("span");
            Object.assign(arrow.style, {
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "calc(var(--dpad-button-size) * 0.75)",
                height: "calc(var(--dpad-button-size) * 0.75)",
                transform: "translate(-50%, -50%)",
                background: "#000",
                pointerEvents: "none",
            } satisfies Partial<CSSStyleDeclaration>);

            const d = 20;
            switch (action) {
                case "up":
                    arrow.style.clipPath =
                        `polygon(50% 0%, 0% ${100-d}%, 100% ${100-d}%)`;
                    break;
                case "down":
                    arrow.style.clipPath =
                        `polygon(0% ${d}%, 100% ${d}%, 50% 100%)`;
                    break;
                case "left":
                    arrow.style.clipPath =
                        `polygon(0% 50%, ${100-d}% 0%, ${100-d}% 100%)`;
                    break;
                case "right":
                    arrow.style.clipPath =
                        `polygon(${d}% 0%, 100% 50%, ${d}% 100%)`;
                    break;
            }

            button.append(arrow);

            const content = Dpad.createMoveButtonText({
                'up': 'W',
                'down': 'S',
                'left': 'A',
                'right': 'D',
            }[action])
            button.append(content);
        }

        const setPressed = (pressed: boolean) => {
            button.style.background = pressed
                ? "rgba(214, 226, 242, 0.98)"
                : "rgba(238, 246, 255, 0.92)";
            button.style.transform = pressed
                ? "translateY(1px)"
                : "translateY(0)";
            onPressed(action, pressed);
        };

        const release = () => {
            setPressed(false);
        };

        button.addEventListener("pointerdown", event => {
            event.preventDefault();
            button.setPointerCapture(event.pointerId);
            setPressed(true);
        });
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("lostpointercapture", release);
        button.addEventListener("contextmenu", event => event.preventDefault());

        return button;
    }

    private static createButtonTextBase(color: string): HTMLSpanElement{
        const content = document.createElement("span");
        Object.assign(content.style, {
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            color: color,
            fontWeight: "700",
            lineHeight: "1.15",
            whiteSpace: "pre",
            textAlign: "center",
            pointerEvents: "none",
            userSelect: "none",
        } satisfies Partial<CSSStyleDeclaration>);
        return content;
    }

    private static createMoveButtonText(
        keyLabel: string,
    ): HTMLSpanElement {
        const content = Dpad.createButtonTextBase('#fff');

        const key = document.createElement("span");
        key.textContent = keyLabel;

        Object.assign(key.style, {
            display: "block",
            fontSize: "calc(var(--dpad-button-size) * 0.30)",
            fontWeight: "700",
            lineHeight: "1",
        } satisfies Partial<CSSStyleDeclaration>);

        content.append(key);

        return content;
    }

    private static createButtonText(
        keyLabel: string,
        description: string,
    ): HTMLSpanElement {
        const content = Dpad.createButtonTextBase('#000');

        const key = document.createElement("span");
        key.textContent = keyLabel;

        Object.assign(key.style, {
            display: "block",
            fontSize: "calc(var(--dpad-button-size) * 0.42)",
            fontWeight: "700",
            lineHeight: "1",
        } satisfies Partial<CSSStyleDeclaration>);

        const descriptionElement = document.createElement("span");
        descriptionElement.textContent = description;

        Object.assign(descriptionElement.style, {
            display: "block",
            fontSize: "calc(var(--dpad-button-size) * 0.24)",
            fontWeight: "400",
            lineHeight: "1.2",
            marginTop: "2px",
        } satisfies Partial<CSSStyleDeclaration>);

        content.append(key, descriptionElement);

        return content;
    }

    public adjustLayout() {
        if (this.container) {
            const shortestSide = Math.min(window.innerWidth, window.innerHeight);
            const buttonSize = Math.max(
                48,
                Math.min(96, Math.round(shortestSide * 0.12)),
            );
            const offset = Math.max(16, Math.round(buttonSize * 0.4));

            this.container.style.setProperty(
                "--dpad-button-size",
                `${buttonSize}px`,
            );
            this.container.style.setProperty(
                "--dpad-offset",
                `${offset}px`,
            );
        }
    }

    public remove() {
        this.container?.remove();
    }
}
