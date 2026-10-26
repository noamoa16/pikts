import {
    CreateBox,
    CreateCylinder,
    CreateSphere,
    Mesh,
    Scene,
    Vector3,
} from "#vendor/babylon";
import { atan } from "../core/math";
import { createSlopeMesh } from "../physics/mesh";
import {
    Cube,
    Cylinder,
    Dir4,
    dir4ToVector2,
    Figure,
    Shape,
    shapeToString,
    Sphere,
    Slope,
} from "../physics/figure";

type EntityShapeContext = {
    scene: Scene;
    name: string;
    size: number;
    position: Vector3;
    upward: Dir4;
};

type EntityShapeDefinition = {
    createMesh(context: EntityShapeContext): Mesh;
    createFigure?(center: Vector3, size: number): Figure;
    getInitialRotation(context: EntityShapeContext): Vector3;
};

const ENTITY_SHAPES: Record<Shape, EntityShapeDefinition> = {
    [Shape.Sphere]: {
        createMesh: ({ scene, name, size }) => {
            const mesh = CreateSphere(name, { diameter: size }, scene);
            mesh.ellipsoid = new Vector3(size / 2, size / 2, size / 2);
            return mesh;
        },
        createFigure: (center, size) => new Sphere(center, size / 2),
        getInitialRotation: () => new Vector3(0, 0, Math.PI * 3 / 2),
    },
    [Shape.Cube]: {
        createMesh: ({ scene, name, size }) => CreateBox(
            name,
            { width: size, height: size, depth: size },
            scene,
        ),
        createFigure: (center, size) => new Cube(center, size),
        getInitialRotation: () => new Vector3(0, 0, Math.PI * 3 / 2),
    },
    [Shape.Cylinder]: {
        createMesh: ({ scene, name, size }) => CreateCylinder(
            name,
            { height: size / 4, diameter: size },
            scene,
        ),
        createFigure: (center, size) => new Cylinder(center, size / 2, size / 2),
        getInitialRotation: () => new Vector3(Math.PI / 2, 0, 0),
    },
    [Shape.RectangularPrism]: unsupportedShapeDefinition(Shape.RectangularPrism),
    [Shape.Slope]: {
        createMesh: ({ scene, position, size, upward }) => createSlopeMesh(
            scene,
            new Slope(position.clone(), size, 2 * size, 1 / 2, upward),
        ),
        getInitialRotation: ({ upward }) => new Vector3(
            0,
            0,
            atan(dir4ToVector2(upward)),
        ),
    },
};

function unsupportedShapeDefinition(shape: Shape): EntityShapeDefinition {
    return {
        createMesh: () => {
            throw new Error(`Entity() not implemented for ${shapeToString(shape)}`);
        },
        getInitialRotation: () => Vector3.Zero(),
    };
}

export function createEntityShape(
    shape: Shape,
    context: EntityShapeContext,
): { mesh: Mesh; initialRotation: Vector3 } {
    const definition = ENTITY_SHAPES[shape];
    return {
        mesh: definition.createMesh(context),
        initialRotation: definition.getInitialRotation(context),
    };
}

export function createEntityFigure(
    shape: Shape,
    center: Vector3,
    size: number,
): Figure {
    const createFigure = ENTITY_SHAPES[shape].createFigure;
    if (!createFigure) {
        throw new Error(`figure() not implemented for ${shapeToString(shape)}`);
    }
    return createFigure(center, size);
}
