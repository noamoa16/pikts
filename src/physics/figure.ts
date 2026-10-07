import { Vector2, Vector3 } from "#vendor/babylon"
import { atan, rotate2D } from "../core/math";
import { getFigureImpl } from "./figureImpl/figureImpl";

export enum Shape {
    Sphere,
    RectangularPrism,
    Cube,
    Cylinder,
    Slope,
}
export function shapeToString(shape: Shape){
    return {
        [Shape.Sphere]: "Sphere",
        [Shape.RectangularPrism]: "RectangularPrism",
        [Shape.Cube]: "Cube",
        [Shape.Cylinder]: "Cylinder",
        [Shape.Slope]: "Slope",
    }[shape];
}
export enum Dir4 {
    Right,
    Left,
    Front,
    Back,
}
export function dir4ToVector3(dir: Dir4): Vector3 {
    return {
        [Dir4.Right]: new Vector3(1, 0, 0),
        [Dir4.Left]: new Vector3(-1, 0, 0),
        [Dir4.Front]: new Vector3(0, 1, 0),
        [Dir4.Back]: new Vector3(0, -1, 0),
    }[dir];
}
export function dir4ToVector2(dir: Dir4): Vector2 {
    return {
        [Dir4.Right]: new Vector2(1, 0,),
        [Dir4.Left]: new Vector2(-1, 0,),
        [Dir4.Front]: new Vector2(0, 1),
        [Dir4.Back]: new Vector2(0, -1),
    }[dir];
}
export function rotateByDir4(v: Vector3, dir: Dir4): Vector3 {
    v = v.clone();
    const theta = atan(dir4ToVector2(dir)); // dirの角度
    const rotatedCenter2 = rotate2D(v.x, v.y, theta);
    v.x = rotatedCenter2.x;
    v.y = rotatedCenter2.y;
    return v;
}
export function invRotateByDir4(v: Vector3, dir: Dir4): Vector3 {
    v = v.clone();
    const theta = atan(dir4ToVector2(dir)); // dirの角度
    const rotatedCenter2 = rotate2D(v.x, v.y, -theta);
    v.x = rotatedCenter2.x;
    v.y = rotatedCenter2.y;
    return v;
}

export abstract class Figure {
    public abstract readonly shape: Shape;
    constructor(public center: Vector3) {}
    
    /** 図形同士が重なっているか */
    public intersects(other: Figure): boolean {

        // Shapeの順序的に、this < other にする
        if(this.shape > other.shape){
            return other.intersects(this);
        }
        return getFigureImpl(this, other).intersects();
    }

    /** この図形は、other に衝突することなく dir の方向にどれだけ移動可能か */
    public space(other: Figure, _dir: Vector3, strict: boolean = false): number {
    
        // dir がゼロなら無限に移動できる
        if (_dir.lengthSquared() === 0) return Infinity;

        // Shapeの順序的に、this < other にする
        if(this.shape > other.shape){
            return other.space(this, _dir.negate(), strict);
        }
        return getFigureImpl(this, other).space(_dir, strict);
    }

    public abstract scaled(_: number): Figure;
}

export class Sphere extends Figure {
    public readonly shape: Shape = Shape.Sphere;
    public get radius() { return this._radius; }
    private set radius(value: number) { this._radius = value; }
    constructor(center: Vector3, private _radius: number){
        super(center);
    }
    public scaled(ratio: number): Sphere {
        return new Sphere(
            this.center,
            this.radius * ratio,
        );
    }
}

export class RectangularPrism extends Figure {
    public readonly shape: Shape = Shape.RectangularPrism;
    public get edgeLengths() { return this._edgeLengths.clone(); }
    protected set edgeLengths(value: Vector3) {this._edgeLengths = value.clone(); }
    constructor(center: Vector3, private _edgeLengths: Vector3) {
        super(center);
    }
    public scaled(ratio: number): RectangularPrism {
        return new RectangularPrism(
            this.center,
            this.edgeLengths.scale(ratio),
        );
    }
}

export class Cube extends RectangularPrism {
    public readonly shape: Shape = Shape.Cube;
    public get edgeLength() { return this.edgeLengths.x; }
    private set edgeLength(v: number) { this.edgeLengths = new Vector3(v, v, v); }
    constructor(center: Vector3, _edgeLength: number) {
        super(center, new Vector3(_edgeLength, _edgeLength, _edgeLength));
    }
    public scaled(ratio: number): Cube {
        return new Cube(
            this.center,
            this.edgeLength * ratio
        );
    }
}

export class Cylinder extends Figure {
    public readonly shape: Shape = Shape.Cylinder;
    public get radius() { return this._radius; }
    private set radius(value: number) { this._radius = value; }
    public get height() { return this._height; }
    private set height(value: number) { this._height = value; }
    constructor(center: Vector3, private _radius: number, private _height: number){
        super(center);
    }
    public scaled(ratio: number): Cylinder {
        return new Cylinder(
            this.center,
            this.radius * ratio,
            this.height * ratio,
        );
    }
}

export class Slope extends Figure {
    public readonly shape: Shape = Shape.Slope;
    public get width() { return this._width; }
    private set width(v: number) { this._width = v; }
    public get length() { return this._length; }
    private set length(v: number) { this._length = v; }
    public get gradient() { return this._gradient; }
    private set gradient(v: number) { this._gradient = v; }
    public get height() { return this.length * this.gradient; }
    public get upward() { return this._upward; }
    private set upward(v: Dir4) { this._upward = v; }
    constructor(
        center: Vector3,
        private _width: number,
        private _length: number,
        private _gradient: number,
        private _upward: Dir4 = Dir4.Right, // 上昇する方向
    ) {
        super(center);
    }
    public scaled(ratio: number): Slope {
        return new Slope(
            this.center,
            this.width * ratio,
            this.length * ratio,
            this.gradient,
            this.upward,
        );
    }
    public scaledAsTriangle(ratio: number): Slope {
        const gap = invRotateByDir4(
            new Vector3(
                (1 - ratio) * this.length / 2,
                0,
                (1 - ratio) * -this.height / 2,
            ),
            this.upward,
        );
        return new Slope(
            this.center.add(gap),
            this.width,
            this.length * ratio,
            this.gradient,
            this.upward,
        );
    }
    public rectPrism(alpha: number = 0): RectangularPrism {
        const center = this.center.clone();
        let edgeLengths = new Vector3(
            this.length,
            this.width,
            this.height * (1 + alpha),
        );
        const rotatedCenter = rotateByDir4(center, this.upward);
        if(this.upward == Dir4.Front || this.upward == Dir4.Back){
            edgeLengths = new Vector3(
                edgeLengths.y,
                edgeLengths.x,
                edgeLengths.z,
            );
        }
        return new RectangularPrism(
            rotatedCenter,
            edgeLengths,
        );
    }
}
