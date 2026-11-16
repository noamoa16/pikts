import { getViewportUiScale } from "./viewportScale";

/** Development toggle for changing the speed of carried objects. */
export class CarrySpeedControl {
    private static readonly SIZE = 96;
    private static readonly MIN_SIZE = 30;

    public readonly element: HTMLLabelElement;

    constructor(onChange: (enabled: boolean) => void) {
        const label = document.createElement("label");
        Object.assign(label.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "7px",
            padding: "7px 9px",
            border: "2px solid #111",
            borderRadius: "4px",
            background: "rgba(238, 246, 255, 0.96)",
            cursor: "pointer",
            userSelect: "none",
        } satisfies Partial<CSSStyleDeclaration>);

        const text = document.createElement("span");
        text.textContent = "Carry Speed 2x";

        const status = document.createElement("span");
        status.textContent = "OFF";
        status.setAttribute("aria-hidden", "true");

        const toggle = document.createElement("input");
        toggle.type = "checkbox";
        toggle.checked = false;
        toggle.setAttribute("role", "switch");
        toggle.setAttribute("aria-checked", "false");
        toggle.setAttribute("aria-label", "Carry Speed 2x");
        Object.assign(toggle.style, {
            width: "16px",
            height: "16px",
            margin: "0",
            flex: "none",
            accentColor: "#1d6fce",
        } satisfies Partial<CSSStyleDeclaration>);
        toggle.addEventListener("change", () => {
            status.textContent = toggle.checked ? "ON" : "OFF";
            toggle.setAttribute("aria-checked", String(toggle.checked));
            onChange(toggle.checked);
        });

        label.append(text, status, toggle);
        this.element = label;
        this.adjustLayout();
        window.addEventListener("resize", this.adjustLayout);
    }

    private readonly adjustLayout = (): void => {
        this.element.style.zoom = getViewportUiScale(
            CarrySpeedControl.SIZE,
            CarrySpeedControl.MIN_SIZE,
        ).toString();
    };

    public dispose(): void {
        window.removeEventListener("resize", this.adjustLayout);
        this.element.remove();
    }
}
