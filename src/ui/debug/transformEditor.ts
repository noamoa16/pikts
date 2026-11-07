import type { Entity } from "../../objects/entity";
import { createVectorEditor, type VectorAxis, type VectorEditor } from "./vectorEditor";

export class TransformEditor {
    public readonly element: HTMLDivElement;
    private readonly positionEditor: VectorEditor;
    private readonly rotationEditor: VectorEditor;

    constructor(private readonly getEntity: () => Entity | null) {
        this.positionEditor = createVectorEditor("Position", this.onPositionChange);
        this.rotationEditor = createVectorEditor("Rotation (rad)", this.onRotationChange);
        this.element = document.createElement("div");
        this.element.append(this.positionEditor.element, this.rotationEditor.element);
    }

    public update(): void {
        const entity = this.getEntity();
        if (!entity) return;

        const position = entity.groundingPosition;
        const rotation = entity.rotation;
        this.positionEditor.setValues([position.x, position.y, position.z]);
        this.rotationEditor.setValues([rotation.x, rotation.y, rotation.z]);
    }

    private readonly onPositionChange = (axis: VectorAxis, value: number): void => {
        const entity = this.getEntity();
        if (!entity) return;

        const position = entity.groundingPosition;
        const verticalOffset = entity.mesh.position.z - position.z;
        if (axis === "x") entity.mesh.position.x = value;
        else if (axis === "y") entity.mesh.position.y = value;
        else entity.mesh.position.z = value + verticalOffset;
    };

    private readonly onRotationChange = (axis: VectorAxis, value: number): void => {
        const entity = this.getEntity();
        if (entity) entity.rotation[axis] = value;
    };
}
