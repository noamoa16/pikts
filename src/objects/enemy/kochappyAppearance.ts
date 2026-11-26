import {
    Color3,
    CreateCylinder,
    CreateSphere,
    Mesh,
    Quaternion,
    StandardMaterial,
    Vector3,
    VertexData,
} from "#vendor/babylon";
import { Game } from "../../game";
import { Color } from "../../rendering/color";

export class KochappyAppearance {
    private static readonly EYE_CENTER_Z = 2 - Math.SQRT2 / 2;

    constructor(mesh: Mesh, size: number, name: string, game: Game) {
        // Keep the mesh axes aligned with the coordinates used below.
        mesh.rotation = Vector3.Zero();

        const bodyMaterial = new StandardMaterial(`${name}.material`, game.scene);
        Color.set(bodyMaterial, Color3.Red());
        mesh.material = bodyMaterial;

        const r = size / 2;

        // 顔パーツ
        const headMaterial = new StandardMaterial(`${name}.head.material`, game.scene);
        const faceColor = new Color3(1, 0.75, 0.4);
        Color.set(headMaterial, faceColor, { luminance: 0.2 });
        headMaterial.backFaceCulling = false;
        const head = createLowerHemisphere(`${name}.shell`, r * (1 + 1 / 16), game);
        head.parent = mesh;
        head.material = headMaterial;
        head.isPickable = false;
        head.checkCollisions = false;

        // 口は z 軸方向の円柱。装飾パーツのため当たり判定なし。
        const mouthMaterial = new StandardMaterial(`${name}.mouth.material`, game.scene);
        Color.set(mouthMaterial, new Color3(0.5, 0.25, 0.25));
        const mouth = CreateCylinder(
            `${name}.mouth`,
            { height: r / 8, diameter: r * 1.68, tessellation: 32 },
            game.scene,
        );
        mouth.parent = mesh;
        mouth.position.set(0, -r / 4, -r / 16);
        mouth.rotation.x = Math.PI / 2;
        mouth.material = mouthMaterial;
        mouth.isPickable = false;
        mouth.checkCollisions = false;

        // 目（装飾パーツのため当たり判定なし）
        const eyeMaterial = new StandardMaterial(`${name}.eyes.material`, game.scene);
        Color.set(eyeMaterial, faceColor, { luminance: 0.2 });
        const eyeWhiteMaterial = new StandardMaterial(`${name}.eyes.white.material`, game.scene);
        Color.set(eyeWhiteMaterial, Color3.White());
        const pupilMaterial = new StandardMaterial(`${name}.eyes.pupil.material`, game.scene);
        Color.set(pupilMaterial, Color3.Black());
        for (let index = 0; index < 2; index++) {
            const side = index === 0 ? 1 : -1;
            const x = side * r / 2;
            const y = -r / 2;
            const z = KochappyAppearance.EYE_CENTER_Z * r;

            // z 軸方向の細い土台
            const stem = CreateCylinder(
                `${name}.eye.${index}.stem`,
                {
                    height: (KochappyAppearance.EYE_CENTER_Z - 1 / 2) * r,
                    diameter: r / 8,
                    tessellation: 24,
                },
                game.scene,
            );
            stem.parent = mesh;
            stem.position.set(x, y, (KochappyAppearance.EYE_CENTER_Z + 1 / 2) * r / 2);
            stem.rotation.x = Math.PI / 2;
            stem.material = eyeMaterial;
            stem.isPickable = false;
            stem.checkCollisions = false;

            const eye = CreateSphere(
                `${name}.eye.${index}.white`,
                { diameter: r * 3 / 8, segments: 16 },
                game.scene,
            );
            eye.parent = mesh;
            eye.position.set(x, y, z);
            eye.material = eyeWhiteMaterial;
            eye.isPickable = false;
            eye.checkCollisions = false;

            // 白目の外側に、顔と同じ色の薄い半球面を重ねる
            const eyeOutline = createEyeCap(
                `${name}.eye.${index}.outline`,
                new Vector3(x, y, z),
                (r * 3 / 16) * (1 + 1 / 2),
                game,
            );
            eyeOutline.parent = mesh;
            eyeOutline.material = eyeMaterial;
            eyeOutline.isPickable = false;
            eyeOutline.checkCollisions = false;

            const pupil = CreateSphere(
                `${name}.eye.${index}.pupil`,
                { diameter: r * 3 / 16, segments: 12 },
                game.scene,
            );
            pupil.parent = mesh;
            pupil.position.set(x, y - r * 3 / 16, z);
            pupil.material = pupilMaterial;
            pupil.isPickable = false;
            pupil.checkCollisions = false;
        }

        // 背中の斑点
        const spotMaterial = new StandardMaterial(`${name}.spots.material`, game.scene);
        Color.set(spotMaterial, Color3.White());
        createSpot(mesh, name, "0", new Vector3(0, r, 0), new Vector3(0, 1, 0), r, spotMaterial, game);
        for (let index = 0; index < 6; index++) {
            const angle = 2 * Math.PI * index / 6;
            const radial = new Vector3(
                Math.sqrt(3) / 2 * Math.cos(angle),
                1 / 2,
                Math.sqrt(3) / 2 * Math.sin(angle),
            );
            const center = radial.scale(r);
            createSpot(mesh, name, `${index + 1}`, center, radial, r, spotMaterial, game);
        }
    }
}

function createLowerHemisphere(name: string, radius: number, game: Game): Mesh {
    const latitudeSegments = 16;
    const longitudeSegments = 48;
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    for (let latitude = 0; latitude <= latitudeSegments; latitude++) {
        const theta = Math.PI / 2 + Math.PI / 2 * latitude / latitudeSegments;
        for (let longitude = 0; longitude <= longitudeSegments; longitude++) {
            const phi = 2 * Math.PI * longitude / longitudeSegments;
            const x = Math.sin(theta) * Math.cos(phi);
            const y = Math.cos(theta);
            const z = Math.sin(theta) * Math.sin(phi);
            positions.push(radius * x, radius * y, radius * z);
            normals.push(x, y, z);
        }
    }

    for (let latitude = 0; latitude < latitudeSegments; latitude++) {
        for (let longitude = 0; longitude < longitudeSegments; longitude++) {
            const current = latitude * (longitudeSegments + 1) + longitude;
            const nextRow = current + longitudeSegments + 1;
            indices.push(current, current + 1, nextRow);
            indices.push(current + 1, nextRow + 1, nextRow);
        }
    }

    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    const shell = new Mesh(name, game.scene);
    vertexData.applyToMesh(shell);
    return shell;
}

function createSpot(
    mesh: Mesh,
    name: string,
    index: string,
    center: Vector3,
    axis: Vector3,
    radius: number,
    material: StandardMaterial,
    game: Game,
): void {
    const spot = CreateCylinder(
        `${name}.spot.${index}`,
        { height: radius / 32, diameter: radius / 4, tessellation: 24 },
        game.scene,
    );
    spot.parent = mesh;
    spot.position = center;
    // Babylon cylinders use local Y as their axis.
    const from = Vector3.Up();
    const dot = Math.max(-1, Math.min(1, Vector3.Dot(from, axis)));
    let rotationAxis = Vector3.Cross(from, axis);
    if (rotationAxis.lengthSquared() < 1e-10) {
        rotationAxis = new Vector3(1, 0, 0);
    } else {
        rotationAxis.normalize();
    }
    spot.rotationQuaternion = Quaternion.RotationAxis(rotationAxis, Math.acos(dot));
    spot.material = material;
    spot.isPickable = false;
    spot.checkCollisions = false;
}

function createEyeCap(name: string, center: Vector3, radius: number, game: Game): Mesh {
    const latitudeSegments = 12;
    const longitudeSegments = 24;
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    // 半球の向きは +y 側。白目より少し大きくして縁を見せる。
    for (let latitude = 0; latitude <= latitudeSegments; latitude++) {
        const theta = Math.PI / 2 * latitude / latitudeSegments;
        for (let longitude = 0; longitude <= longitudeSegments; longitude++) {
            const phi = 2 * Math.PI * longitude / longitudeSegments;
            const nx = Math.sin(theta) * Math.cos(phi);
            const ny = Math.cos(theta);
            const nz = Math.sin(theta) * Math.sin(phi);
            positions.push(center.x + radius * nx, center.y + radius * ny, center.z + radius * nz);
            normals.push(nx, ny, nz);
        }
    }

    for (let latitude = 0; latitude < latitudeSegments; latitude++) {
        for (let longitude = 0; longitude < longitudeSegments; longitude++) {
            const current = latitude * (longitudeSegments + 1) + longitude;
            const nextRow = current + longitudeSegments + 1;
            indices.push(current, current + 1, nextRow);
            indices.push(current + 1, nextRow + 1, nextRow);
        }
    }

    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    const cap = new Mesh(name, game.scene);
    vertexData.applyToMesh(cap);
    return cap;
}
