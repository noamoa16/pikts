import { Mesh, MeshBuilder, Scene, VertexData } from "#vendor/babylon";
import { Slope } from "./figure";

export function createSlopeMesh(scene: Scene, slope: Slope): Mesh {

    const w = slope.width;
    const h = slope.height;

    // 頂点座標
    // ABが底面、BCが側面、CAが斜面
    const positions = [
        // y- 側
        -h, -w / 2, -h / 2, // 0: A-
        h, -w / 2, -h / 2, // 1: B-
        h, -w / 2, h / 2, // 2: C-

        // y+ 側
        -h, w / 2, -h / 2, // 3: A+
        h, w / 2, -h / 2, // 4: B+
        h, w / 2, h / 2, // 5: C+
    ];
    const A0 = 0, B0 = 1, C0 = 2, A1 = 3, B1 = 4, C1 = 5;

    // 三角形の組
    const indices = [
        // y方向側面
        A0, C0, B0,
        A1, B1, C1,

        // A-B 側面
        A0, B0, B1,
        A0, B1, A1,

        // B-C 側面
        B0, C0, C1,
        B0, C1, B1,

        // C-A 側面
        C0, A0, A1,
        C0, A1, C1,
    ];

    const vertexData = new VertexData();

    vertexData.positions = positions;
    vertexData.indices = indices;

    // 法線を計算
    const normals: number[] = [];
    VertexData.ComputeNormals(
        positions,
        indices,
        normals
    );
    vertexData.normals = normals;

    const mesh = MeshBuilder.CreateBox(
        "triangularPrism",
        { size: 0 },
        scene
    );
    vertexData.applyToMesh(mesh);

    mesh.position.copyFrom(slope.center);

    return mesh;
}