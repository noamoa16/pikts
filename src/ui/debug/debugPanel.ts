export type DebugPanelSide = "left" | "right";

export function createDebugPanel(
    parent: HTMLElement | null,
    side: DebugPanelSide,
): HTMLDivElement | null {
    if (!(parent instanceof HTMLDivElement)) return null;

    const panel = document.createElement("div");
    Object.assign(panel.style, {
        position: "absolute",
        top: "12px",
        [side]: "12px",
        padding: "10px 12px",
        borderRadius: "8px",
        background: "rgba(5, 8, 22, 0.82)",
        color: "#f7f6d8",
        fontSize: "13px",
        lineHeight: "1.5",
        fontFamily: "monospace",
        pointerEvents: "auto",
    } satisfies Partial<CSSStyleDeclaration>);
    parent.append(panel);
    return panel;
}

export function createDebugInfo(): HTMLPreElement {
    const info = document.createElement("pre");
    Object.assign(info.style, {
        margin: "0",
        whiteSpace: "pre",
    } satisfies Partial<CSSStyleDeclaration>);
    return info;
}
