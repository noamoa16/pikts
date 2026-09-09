import { Vector3 } from "#vendor/babylon"
import { atan, rotate2D, toVector2 } from "../core/math";
import { getFigureImpl } from "./figureImpl/figureImpl";

export enum Shape {
    Sphere,
    RectangularPrism,
    Cube,
    Slope,
}
export function shapeToString(shape: Shape){
    return {
        [Shape.Sphere]: "Sphere",
        [Shape.RectangularPrism]: "RectangularPrism",
        [Shape.Cube]: "Cube",
        [Shape.Slope]: "Slope",
    }[shape];
}
export enum Dir4 {
    Right,
    Left,
    Front,
    Back,
}
export function dir4ToVector(dir: Dir4): Vector3 {
    return {
        [Dir4.Right]: new Vector3(1, 0, 0),
        [Dir4.Left]: new Vector3(-1, 0, 0),
        [Dir4.Front]: new Vector3(0, 1, 0),
        [Dir4.Back]: new Vector3(0, -1, 0),
    }[dir];
}
export function rotateByDir4(v: Vector3, dir: Dir4): Vector3 {
    v = v.clone();
    const theta = atan(toVector2(dir4ToVector(dir))); // dirの角度
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
    public space(other: Figure, _dir: Vector3): number {
    
        // dir がゼロなら無限に移動できる
        if (_dir.lengthSquared() === 0) return Infinity;

        // Shapeの順序的に、this < other にする
        if(this.shape > other.shape){
            return other.space(this, _dir.negate());
        }
        return getFigureImpl(this, other).space(_dir);
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

/**
 * -h / 2 <= z - c_z <= (x - c_x) / 2 <= h / 2
 * -w / 2 <= y - c_y <= w / 2
 * 
 * -x方向が低く、+x方向が高い
 * 後でスロープの向き (4通り) も考える
 * */
export class Slope extends Figure {
    public readonly shape: Shape = Shape.Slope;
    public get width() { return this._width; }
    private set width(v: number) { this._width = v; }
    public get height() { return this._height; }
    private set height(v: number) { this._height = v; }
    public get upward() { return this._upward; }
    private set upward(v: Dir4) { this._upward = v; }
    constructor(
        center: Vector3,
        private _width: number,
        private _height: number,
        private _upward: Dir4 = Dir4.Right,
    ) {
        super(center);
    }
    public scaled(ratio: number): Slope {
        return new Slope(
            this.center,
            this.width * ratio,
            this.height * ratio,
            this.upward,
        );
    }
}