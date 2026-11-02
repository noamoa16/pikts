import { Engine } from "#vendor/babylon";

export class DebugInfo {
    private panel: HTMLDivElement | null = null;
    private info: HTMLPreElement | null = null;
    private minionCount: HTMLDivElement | null = null;
    constructor(engine: Engine | null) {
        if(!engine){
            return;
        }
        const parent = engine.getRenderingCanvas()?.parentElement;
        if (!(parent instanceof HTMLDivElement)) {
            return;
        }
        this.panel = document.createElement("div");
        Object.assign(this.panel.style, {
            position: "absolute",
            top: "12px",
            right: "12px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: "rgba(5, 8, 22, 0.82)",
            color: "#f7f6d8",
            fontSize: "13px",
            lineHeight: "1.5",
            fontFamily: "monospace",
            pointerEvents: "none",
        } satisfies Partial<CSSStyleDeclaration>);
        this.info = document.createElement("pre");
        Object.assign(this.info.style, {
            margin: "0",
            whiteSpace: "pre",
        } satisfies Partial<CSSStyleDeclaration>);
        this.info.textContent = "Loading ...";
        this.panel.append(this.info);
        this.minionCount = document.createElement("div");
        Object.assign(this.minionCount.style, {
            position: "absolute",
            left: "50%",
            bottom: "20px",
            transform: "translateX(-50%)",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "rgba(5, 8, 22, 0.82)",
            color: "#f7f6d8",
            fontSize: "13px",
            lineHeight: "1.5",
            fontFamily: "monospace",
            pointerEvents: "none",
            whiteSpace: "nowrap",
        } satisfies Partial<CSSStyleDeclaration>);
        parent.append(this.panel, this.minionCount);
    }
    get valid(){
        return this.info !== null;
    }
    set text(value: string){
        if(this.info){
            this.info.textContent = value;
        }
    }
    set minionCountText(value: string){
        if(this.minionCount){
            this.minionCount.textContent = value;
        }
    }
    public remove(){
        this.panel?.remove();
        this.minionCount?.remove();
    }
}
