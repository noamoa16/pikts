import type { Action } from "../../actions/action";

type GridPlacement = number | string | { start: number; end: number };

export class DpadButton {
    public readonly element: HTMLButtonElement;
    private pointerPressed = false;
    private keyboardPressed = false;

    constructor(
        action: Action,
        label: string,
        onPressed: (action: Action, pressed: boolean) => void,
        gridColumn: GridPlacement,
        gridRow: GridPlacement,
        onHoldDescriptionCreated?: (element: HTMLSpanElement) => void,
    ) {
        this.element = document.createElement("button");
        this.element.type = "button";
        this.element.setAttribute("aria-label", label);
        const column = getPlacement(gridColumn);
        const row = getPlacement(gridRow);
        Object.assign(this.element.style, {
            gridColumn: column.value,
            gridRow: row.value,
            width: `calc(var(--dpad-button-size) * ${column.span})`,
            height: `calc(var(--dpad-button-size) * ${row.span})`,
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
        this.element.style.setProperty("-webkit-tap-highlight-color", "transparent");
        this.element.append(createButtonContent(action, onHoldDescriptionCreated));
        this.syncPressedStyle();

        const setPointerPressed = (pressed: boolean) => {
            this.pointerPressed = pressed;
            this.syncPressedStyle();
            onPressed(action, pressed);
        };
        this.element.addEventListener("pointerdown", event => {
            event.preventDefault();
            this.element.setPointerCapture(event.pointerId);
            setPointerPressed(true);
        });
        const release = () => setPointerPressed(false);
        this.element.addEventListener("pointerup", release);
        this.element.addEventListener("pointercancel", release);
        this.element.addEventListener("lostpointercapture", release);
        this.element.addEventListener("contextmenu", event => event.preventDefault());
    }

    public setKeyboardPressed(pressed: boolean): void {
        this.keyboardPressed = pressed;
        this.syncPressedStyle();
    }

    private syncPressedStyle(): void {
        const pressed = this.pointerPressed || this.keyboardPressed;
        this.element.style.background = pressed
            ? "rgba(214, 226, 242, 0.98)"
            : "rgba(238, 246, 255, 0.92)";
        this.element.style.transform = pressed ? "translateY(1px)" : "translateY(0)";
    }
}

function getPlacement(placement: GridPlacement): { value: string; span: number } {
    if (typeof placement !== "object") return { value: String(placement), span: 1 };
    return {
        value: `${placement.start} / ${placement.end}`,
        span: placement.end - placement.start + 1,
    };
}

function createButtonContent(
    action: Action,
    onHoldDescriptionCreated?: (element: HTMLSpanElement) => void,
): HTMLElement {
    if (action === "rotate") return createLabel("F", "(rotate)");
    if (action === "whistle") return createLabel("[", "(whistle)");
    if (action === "hold") return createLabel("Enter", "(hold)", onHoldDescriptionCreated);

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
    const inset = 20;
    const clips = {
        up: `polygon(50% 0%, 0% ${100 - inset}%, 100% ${100 - inset}%)`,
        down: `polygon(0% ${inset}%, 100% ${inset}%, 50% 100%)`,
        left: `polygon(0% 50%, ${100 - inset}% 0%, ${100 - inset}% 100%)`,
        right: `polygon(${inset}% 0%, 100% 50%, ${inset}% 100%)`,
    };
    arrow.style.clipPath = clips[action];
    const keyLabels = { up: "W", down: "S", left: "A", right: "D" };
    const content = document.createElement("span");
    Object.assign(content.style, {
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)", color: "#fff", fontWeight: "700",
        lineHeight: "1.15", whiteSpace: "pre", textAlign: "center",
        pointerEvents: "none", userSelect: "none",
    } satisfies Partial<CSSStyleDeclaration>);
    const key = document.createElement("span");
    key.textContent = keyLabels[action];
    Object.assign(key.style, {
        display: "block", fontSize: "calc(var(--dpad-button-size) * 0.30)",
        fontWeight: "700", lineHeight: "1",
    } satisfies Partial<CSSStyleDeclaration>);
    content.append(key);
    const wrapper = document.createElement("span");
    wrapper.append(arrow, content);
    return wrapper;
}

function createLabel(
    keyLabel: string,
    description: string,
    onDescriptionCreated?: (element: HTMLSpanElement) => void,
): HTMLSpanElement {
    const content = document.createElement("span");
    Object.assign(content.style, {
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)", color: "#000", fontWeight: "700",
        lineHeight: "1.15", whiteSpace: "pre", textAlign: "center",
        pointerEvents: "none", userSelect: "none",
    } satisfies Partial<CSSStyleDeclaration>);
    const key = document.createElement("span");
    key.textContent = keyLabel;
    Object.assign(key.style, {
        display: "block", fontSize: "calc(var(--dpad-button-size) * 0.42)",
        fontWeight: "700", lineHeight: "1",
    } satisfies Partial<CSSStyleDeclaration>);
    const descriptionElement = document.createElement("span");
    descriptionElement.textContent = description;
    onDescriptionCreated?.(descriptionElement);
    const fontSizeCoeff = Math.min(2.0 / Math.max(description.length, 1), 0.25);
    Object.assign(descriptionElement.style, {
        display: "block", fontSize: `calc(var(--dpad-button-size) * ${fontSizeCoeff})`,
        fontWeight: "400", lineHeight: "1.2", marginTop: "2px",
    } satisfies Partial<CSSStyleDeclaration>);
    content.append(key, descriptionElement);
    return content;
}
