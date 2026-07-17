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
            height: "calc(var(--dpad-button-size) * 3)",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "repeat(3, 1fr)",
            placeItems: "center",
            pointerEvents: "auto",
            touchAction: "none",
            userSelect: "none",
            zIndex: "10",
        } satisfies Partial<CSSStyleDeclaration>);

        this.container.append(
            Dpad.createButton("up", "Move up", onPressed, "2", "1"),
            Dpad.createButton("left", "Move left", onPressed, "1", "2"),
            Dpad.createButton("right", "Move right", onPressed, "3", "2"),
            Dpad.createButton("down", "Move down", onPressed, "2", "3"),
        );

        parent.append(this.container);
        this.adjustLayout();
    }

    private static createButton(
        direction: "up" | "down" | "left" | "right",
        label: string,
        onPressed: OnPressed,
        gridColumn: string,
        gridRow: string,
    ): HTMLButtonElement {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("aria-label", label);
        Object.assign(button.style, {
            gridColumn,
            gridRow,
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
        button.style.setProperty("-webkit-tap-highlight-color", "transparent");
    
        const arrow = document.createElement("span");
        Object.assign(arrow.style, {
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "calc(var(--dpad-button-size) * 0.46)",
            height: "calc(var(--dpad-button-size) * 0.46)",
            transform: "translate(-50%, -50%)",
            background: "#000",
            pointerEvents: "none",
        } satisfies Partial<CSSStyleDeclaration>);
    
        switch (direction) {
            case "up":
                arrow.style.clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
                break;
            case "down":
                arrow.style.clipPath = "polygon(0% 0%, 100% 0%, 50% 100%)";
                break;
            case "left":
                arrow.style.clipPath = "polygon(0% 50%, 100% 0%, 100% 100%)";
                break;
            case "right":
                arrow.style.clipPath = "polygon(0% 0%, 100% 50%, 0% 100%)";
                break;
        }
    
        const setPressed = (pressed: boolean) => {
            button.style.background = pressed
                ? "rgba(214, 226, 242, 0.98)"
                : "rgba(238, 246, 255, 0.92)";
            button.style.transform = pressed ? "translateY(1px)" : "translateY(0)";
            onPressed(direction, pressed);
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
    
        button.append(arrow);
        return button;
    }

    public adjustLayout(){
        if(this.container){
            const shortestSide = Math.min(window.innerWidth, window.innerHeight);
            const buttonSize = Math.max(48, Math.min(96, Math.round(shortestSide * 0.12)));
            const offset = Math.max(16, Math.round(buttonSize * 0.4));
            this.container.style.setProperty("--dpad-button-size", `${buttonSize}px`);
            this.container.style.setProperty("--dpad-offset", `${offset}px`);
        }
    }

    public remove(){
        this.container?.remove();
    }
}
