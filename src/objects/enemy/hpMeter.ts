import {
    Color3,
    CreateDisc,
    Mesh,
    Scene,
    StandardMaterial,
    Vector3,
    VertexData,
} from "#vendor/babylon";

const DIAMETER = 3 / 8;
const RADIUS = DIAMETER / 2;
const START_ANGLE = -3 * Math.PI / 2;
const SEGMENTS_PER_REVOLUTION = 64;

/** 敵の頭上に表示する HP 円形メーター */
export class HpMeter {
    private readonly background: Mesh;
    private readonly fill: Mesh;
    private readonly fillMaterial: StandardMaterial;

    constructor(parent: Mesh, scene: Scene, height: number) {
        const background = CreateDisc(
            `${parent.name}.hp-meter.background`,
            { radius: RADIUS, tessellation: SEGMENTS_PER_REVOLUTION, sideOrientation: Mesh.DOUBLESIDE },
            scene,
        );
        background.parent = parent;
        background.position = new Vector3(0, 0, height / 2 + 3 / 2);
        background.billboardMode = Mesh.BILLBOARDMODE_ALL;
        background.isPickable = false;
        background.checkCollisions = false;

        const backgroundMaterial = new StandardMaterial(`${parent.name}.hp-meter.background.material`, scene);
        backgroundMaterial.disableLighting = true;
        backgroundMaterial.emissiveColor = Color3.Black();
        backgroundMaterial.diffuseColor = Color3.Black();
        backgroundMaterial.backFaceCulling = false;
        background.material = backgroundMaterial;

        const fill = new Mesh(`${parent.name}.hp-meter.fill`, scene);
        fill.parent = parent;
        fill.position = new Vector3(0, 0, height / 2 + 3 / 2 + 0.001);
        fill.billboardMode = Mesh.BILLBOARDMODE_ALL;
        // The game canvas is mirrored horizontally; compensate so the sweep
        // follows the requested angle direction as seen on screen.
        fill.scaling.x = -1;
        fill.isPickable = false;
        fill.checkCollisions = false;

        const fillMaterial = new StandardMaterial(`${parent.name}.hp-meter.fill.material`, scene);
        fillMaterial.disableLighting = true;
        fillMaterial.backFaceCulling = false;
        fill.material = fillMaterial;

        this.background = background;
        this.fill = fill;
        this.fillMaterial = fillMaterial;
        this.update(1, 1);
    }

    public update(hp: number, maxHp: number): void {
        const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
        const color = ratio <= 0.5
            ? Color3.Lerp(Color3.Red(), Color3.Yellow(), ratio * 2)
            : Color3.Lerp(Color3.Yellow(), Color3.Green(), (ratio - 0.5) * 2);
        this.fillMaterial.diffuseColor = color;
        this.fillMaterial.emissiveColor = color;

        const segmentCount = Math.ceil(SEGMENTS_PER_REVOLUTION * ratio);
        const positions: number[] = [0, 0, 0];
        for (let index = 0; index <= segmentCount; index++) {
            const angle = START_ANGLE + 2 * Math.PI * ratio * index / Math.max(segmentCount, 1);
            positions.push(RADIUS * Math.cos(angle), RADIUS * Math.sin(angle), 0);
        }

        const indices: number[] = [];
        for (let index = 0; index < segmentCount; index++) {
            indices.push(0, index + 1, index + 2);
        }
        const normals: number[] = [];
        VertexData.ComputeNormals(positions, indices, normals);
        const vertexData = new VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;
        vertexData.applyToMesh(this.fill, true);

        const visible = hp < maxHp;
        this.background.isVisible = visible;
        this.fill.isVisible = visible && ratio > 0;
    }
}
