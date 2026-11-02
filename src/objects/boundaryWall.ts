import { Color3, CreateDashedLines, Vector3 } from "#vendor/babylon";
import { Game } from "../game";
import { Shape } from "../physics/figure";
import { Entity } from "./entity";

export class BoundaryWall extends Entity {
    constructor(game: Game, position: Vector3, size: number, debug = false) {
        super(game, "boundaryWall", Shape.Cube, size, position, { fall: false });
        this.isVisible = false;

        if (debug) {
            this.createDebugEdges();
        }
    }

    override update(_: number): void {
        // 何もしない
    }

    private createDebugEdges(): void {
        const halfSize = this.size / 2;
        const min = this.position.subtract(new Vector3(halfSize, halfSize, halfSize));
        const max = this.position.add(new Vector3(halfSize, halfSize, halfSize));
        const corners = [
            new Vector3(min.x, min.y, min.z),
            new Vector3(max.x, min.y, min.z),
            new Vector3(min.x, max.y, min.z),
            new Vector3(max.x, max.y, min.z),
            new Vector3(min.x, min.y, max.z),
            new Vector3(max.x, min.y, max.z),
            new Vector3(min.x, max.y, max.z),
            new Vector3(max.x, max.y, max.z),
        ];
        const edges: [number, number][] = [
            [0, 1], [0, 2], [1, 3], [2, 3],
            [4, 5], [4, 6], [5, 7], [6, 7],
            [0, 4], [1, 5], [2, 6], [3, 7],
        ];

        edges.forEach(([start, end], index) => {
            const line = CreateDashedLines(
                `${this.name}.debugEdge${index}`,
                {
                    points: [corners[start], corners[end]],
                    dashSize: 0.2,
                    gapSize: 0.1,
                    dashNb: Math.max(1, Math.round(this.size / 0.3)),
                },
                this.scene,
            );
            line.color = new Color3(0.75, 0.75, 0.8);
            line.isPickable = false;
        });
    }
}
