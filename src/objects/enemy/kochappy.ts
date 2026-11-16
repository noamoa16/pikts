import {
    Color3,
    CreateCylinder,
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

/** Kochappy: a red spherical enemy with its characteristic shell and spots. */
export class Kochappy extends Enemy {
    private static readonly SIZE = 0.5;
    private static readonly HP = 20;

    constructor(game: Game, position: Vector3) {
        super(game, position, Kochappy.SIZE, Kochappy.HP, undefined, Shape.Sphere);
        // Keep the mesh axes aligned with the coordinates used below.
        this.mesh.rotation = Vector3.Zero();

        const bodyMaterial = new StandardMaterial(`${this.name}.${this.id}.material`, game.scene);
        Color.set(bodyMaterial, Color3.Red());
        this.mesh.material = bodyMaterial;

        const r = this.size / 2;
        const shellMaterial = new StandardMaterial(`${this.name}.${this.id}.shell.material`, game.scene);
        Color.set(shellMaterial, new Color3(1, 0.75, 0.4), { luminance: 0.2 });
        // The half shell is an open surface, so render it from either side.
        shellMaterial.backFaceCulling = false;

        const shell = this.createLowerHemisphere(
            `${this.name}.${this.id}.shell`,
            r * (1 + 1 / 16),
            game,
        );
        shell.parent = this.mesh;
        shell.material = shellMaterial;
        shell.isPickable = false;
        shell.checkCollisions = false;

        const spotMaterial = new StandardMaterial(`${this.name}.${this.id}.spots.material`, game.scene);
        Color.set(spotMaterial, Color3.White());

        // S0 is centered on the positive Y pole.
        this.createSpot(game, "0", new Vector3(0, r, 0), new Vector3(0, 1, 0), r, spotMaterial);

        // Six equally spaced centers form a regular hexagon at y = r / 2.
        const ringRadius = r * Math.sqrt(3) / 2;
        for (let index = 0; index < 6; index++) {
            const angle = 2 * Math.PI * index / 6;
            const radial = new Vector3(
                Math.sqrt(3) / 2 * Math.cos(angle),
                1 / 2,
                Math.sqrt(3) / 2 * Math.sin(angle),
            );
            const center = new Vector3(
                ringRadius * Math.cos(angle),
                r / 2,
                ringRadius * Math.sin(angle),
            );
            this.createSpot(game, `${index + 1}`, center, radial, r, spotMaterial);
        }
    }

    private createLowerHemisphere(name: string, radius: number, game: Game): Mesh {
        const latitudeSegments = 16;
        const longitudeSegments = 48;
        const positions: number[] = [];
        const normals: number[] = [];
        const indices: number[] = [];

        // Build y <= 0 directly so the shell does not depend on slice or
        // negative-scale behavior.
        for (let latitude = 0; latitude <= latitudeSegments; latitude++) {
            const theta = Math.PI / 2 + Math.PI / 2 * latitude / latitudeSegments;
            for (let longitude = 0; longitude <= longitudeSegments; longitude++) {
                const phi = 2 * Math.PI * longitude / longitudeSegments;
                const x = Math.sin(theta) * Math.cos(phi);
                const y = Math.cos(theta);
                const z = Math.sin(theta) * Math.sin(phi);
                positions.push(radius * x, radius * y, radius * z);
                // Keep lighting correct even if Babylon treats the triangle
                // winding differently for the active coordinate handedness.
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
}
