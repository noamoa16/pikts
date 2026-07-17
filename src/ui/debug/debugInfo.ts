import { Engine } from "#vendor/babylon";

export class DebugInfo {
    private label: HTMLDivElement | null = null;
    constructor(engine: Engine | null) {
        this.label = null;
        if(!engine){
            return;
        }
        const parent = engine.getRenderingCanvas()?.parentElement;
        if (!(parent instanceof HTMLDivElement)) {
            return;
        }
        this.label = document.createElement("div");
        Object.assign(this.label.style, {
            position: "absolute",
            left: "50%",
            bottom: "20px",
            transform: "translateX(-50%)",
            padding: "8px 12px",
            borderRadius: "999px",
            background: "rgba(5, 8, 22, 0.78)",
            color: "#f7f6d8",
            fontSize: "14px",
            lineHeight: "1",
            letterSpacing: "0.04em",
            pointerEvents: "none",
            whiteSpace: "nowrap",
        } satisfies Partial<CSSStyleDeclaration>);
        this.label.textContent = "Loading ...";
        parent.append(this.label);
    }
    get valid(){
        return this.label !== null;
    }
    set text(value: string){
        if(this.label){
            this.label.textContent = value;
        }
    }
    public remove(){
        this.label?.remove();
    }
}
