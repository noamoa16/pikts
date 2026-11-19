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
import { Shape } from "../../physics/figure";
import { Color } from "../../rendering/color";
import { Enemy } from "./enemy";
import { Minion, MinionState } from "../minion/minion";

export enum KochappyState {
    free,
    chase,
}

export class Kochappy extends Enemy {
    private static readonly MINION_SEARCH_MIN_DISTANCE = 0.5;
    private static readonly MINION_SEARCH_MAX_DISTANCE = 1.5;
    private static readonly CHASE_SPEED = 0.5;
    private static readonly EYE_CENTER_Z = 2 - Math.SQRT2 / 2;

    private currentState = KochappyState.free;
    public get state(): KochappyState { return this.currentState; }

    constructor(game: Game, position: Vector3) {
        super(game, position, 0.5, 20, undefined, Shape.Sphere);
        // Keep the mesh axes aligned with the coordinates used below.
        this.mesh.rotation = Vector3.Zero();
        this.speed = Kochappy.CHASE_SPEED;

        const bodyMaterial = new StandardMaterial(`${this.name}.${this.id}.material`, game.scene);
        Color.set(bodyMaterial, Color3.Red());
        this.mesh.material = bodyMaterial;

        const r = this.size / 2;

        // 顔パーツ
        const headMaterial = new StandardMaterial(`${this.name}.${this.id}.head.material`, game.scene);
        const faceColor = new Color3(1, 0.75, 0.4);
        Color.set(headMaterial, faceColor, { luminance: 0.2 });
        headMaterial.backFaceCulling = false;
        const head = this.createLowerHemisphere(
            `${this.name}.${this.id}.shell`,
            r * (1 + 1 / 16),
            game,
        );
        head.parent = this.mesh;
        head.material = headMaterial;
        head.isPickable = false;
        head.checkCollisions = false;

        // 目（装飾パーツのため当たり判定なし）
        const eyeMaterial = new StandardMaterial(`${this.name}.${this.id}.eyes.material`, game.scene);
        Color.set(eyeMaterial, faceColor, { luminance: 0.2 });
        const eyeWhiteMaterial = new StandardMaterial(`${this.name}.${this.id}.eyes.white.material`, game.scene);
        Color.set(eyeWhiteMaterial, Color3.White());
        const pupilMaterial = new StandardMaterial(`${this.name}.${this.id}.eyes.pupil.material`, game.scene);
        Color.set(pupilMaterial, Color3.Black());
        for (let index = 0; index < 2; index++) {
            const side = index === 0 ? 1 : -1;
            const x = side * r / 2;
            const y = -r / 2;
            const z = Kochappy.EYE_CENTER_Z * r;

            // z 軸方向の細い土台
            const stem = CreateCylinder(
                `${this.name}.${this.id}.eye.${index}.stem`,
                {
                    height: (Kochappy.EYE_CENTER_Z - 1 / 2) * r,
                    diameter: r / 8,
                    tessellation: 24,
                },
                game.scene,
            );
            stem.parent = this.mesh;
            stem.position.set(x, y, (Kochappy.EYE_CENTER_Z + 1 / 2) * r / 2);
            stem.rotation.x = Math.PI / 2;
            stem.material = eyeMaterial;
            stem.isPickable = false;
            stem.checkCollisions = false;

            const eye = CreateSphere(
                `${this.name}.${this.id}.eye.${index}.white`,
                { diameter: r * 3 / 8, segments: 16 },
                game.scene,
            );
            eye.parent = this.mesh;
            eye.position.set(x, y, z);
            eye.material = eyeWhiteMaterial;
            eye.isPickable = false;
            eye.checkCollisions = false;

            // 白目の外側に、顔と同じ色の薄い半球面を重ねる
            const eyeOutline = this.createEyeCap(
                `${this.name}.${this.id}.eye.${index}.outline`,
                new Vector3(x, y, z),
                (r * 3 / 16) * (1 + 1 / 2),
                game,
            );
            eyeOutline.parent = this.mesh;
            eyeOutline.material = eyeMaterial;
            eyeOutline.isPickable = false;
            eyeOutline.checkCollisions = false;

            const pupil = CreateSphere(
                `${this.name}.${this.id}.eye.${index}.pupil`,
                { diameter: r * 3 / 16, segments: 12 },
                game.scene,
            );
            pupil.parent = this.mesh;
            pupil.position.set(x, y - r * 3 / 16, z);
            pupil.material = pupilMaterial;
            pupil.isPickable = false;
            pupil.checkCollisions = false;
        }

        // 背中の斑点
        const spotMaterial = new StandardMaterial(`${this.name}.${this.id}.spots.material`, game.scene);
        Color.set(spotMaterial, Color3.White());
        this.createSpot(game, "0", new Vector3(0, r, 0), new Vector3(0, 1, 0), r, spotMaterial);
        for (let index = 0; index < 6; index++) {
            const angle = 2 * Math.PI * index / 6;
            const radial = new Vector3(
                Math.sqrt(3) / 2 * Math.cos(angle),
                1 / 2,
                Math.sqrt(3) / 2 * Math.sin(angle),
            );
            const center = radial.scale(r);
            this.createSpot(game, `${index + 1}`, center, radial, r, spotMaterial);
        }
    }

    public override update(deltaSeconds: number): void {
        super.update(deltaSeconds);
        this.velocity.x = 0;
        this.velocity.y = 0;

        const target = this.findNearestMinion();
        this.currentState = target ? KochappyState.chase : KochappyState.free;
        if (!target) return;

        const direction = target.groundingPosition.subtract(this.groundingPosition);
        direction.z = 0;
        if (direction.lengthSquared() === 0) return;

        const displacement = direction.normalize().scale(this.speed * deltaSeconds);
        const actualDisplacement = this.moveFor(displacement);
        if (deltaSeconds > 0) {
            this.velocity.x = actualDisplacement.x / deltaSeconds;
            this.velocity.y = actualDisplacement.y / deltaSeconds;
        }
        this.rotateToDirection(
            new Vector3(-actualDisplacement.y, actualDisplacement.x, 0),
            deltaSeconds,
        );
    }

    private findNearestMinion(): Minion | null {
        return this.getNearbyEntities(
            Kochappy.MINION_SEARCH_MAX_DISTANCE,
            (entity): entity is Minion =>
                entity instanceof Minion
                && entity.state !== MinionState.seed
                && entity.state !== MinionState.buried,
        ).find(entity =>
            this.distanceToSurface(entity) >= Kochappy.MINION_SEARCH_MIN_DISTANCE,
        ) ?? null;
    }

    private createLowerHemisphere(name: string, radius: number, game: Game): Mesh {
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

    private createSpot(
        game: Game,
        index: string,
        center: Vector3,
        axis: Vector3,
        radius: number,
        material: StandardMaterial,
    ): void {
        const spot = CreateCylinder(
            `${this.name}.${this.id}.spot.${index}`,
            { height: radius / 32, diameter: radius / 4, tessellation: 24 },
            game.scene,
        );
        spot.parent = this.mesh;
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

    private createEyeCap(name: string, center: Vector3, radius: number, game: Game): Mesh {
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
}
