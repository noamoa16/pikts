export type VectorAxis = "x" | "y" | "z";
export type VectorValues = readonly [number, number, number];

export interface VectorEditor {
    readonly element: HTMLDivElement;
    setValues(values: VectorValues): void;
}

const AXES: readonly VectorAxis[] = ["x", "y", "z"];

export function createVectorEditor(
    label: string,
    onChange: (axis: VectorAxis, value: number) => void,
): VectorEditor {
    const row = document.createElement("div");
    Object.assign(row.style, {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        margin: "4px 0",
    } satisfies Partial<CSSStyleDeclaration>);

    const title = document.createElement("span");
    title.textContent = `${label}:`;
    row.append(title);

    const inputs = AXES.map(axis => {
        const input = document.createElement("input");
        input.type = "number";
        input.step = "0.1";
        input.setAttribute("aria-label", `${label} ${axis}`);
        Object.assign(input.style, { width: "62px", fontFamily: "monospace" });
        input.addEventListener("change", () => {
            const value = Number(input.value);
            if (input.value.trim() !== "" && Number.isFinite(value)) {
                onChange(axis, value);
            }
        });
        row.append(input);
        return input;
    });

    return {
        element: row,
        setValues(values): void {
            inputs.forEach((input, index) => {
                if (document.activeElement !== input) {
                    input.value = values[index].toFixed(2);
                }
            });
        },
    };
}
