import { Color3, CreateTube, Mesh, Scene, StandardMaterial, Vector3 } from "#vendor/babylon";
import { Sphere } from "../../physics/figure";
import { Color } from "../../rendering/color";
import { Entity } from "../entity";
import { Minion } from "../minion/minion";
import { Cursor } from "./cursor";
import { Player } from "./player";

export class Whistle {
    private static readonly NUM_WHISTLE_PARTS = 24;
    private readonly cursor: Cursor;
    private readonly tubes: Mesh[] = [];
    private readonly player: Player;
    public active: boolean = false;
    private activeSeconds: number = 0;

    private static readonly MAX_RADIUS = 2.0;
    private static readonly EXPANDING_SECONDS = 0.5;
    private static readonly KEEPING_SECONDS = 0.5;

    private createPath(radius: number, tubeIndex: number): Vector3[] {
        const path: Vector3[] = [];
        for(let i = 0; i < Whistle.NUM_WHISTLE_PARTS + 1; i++){
            const theta = i / Whistle.NUM_WHISTLE_PARTS * 2 * Math.PI;
            const y = (this.player.size / 48) * (i % 3 == tubeIndex ? -1 : 1);
            path.push(new Vector3(
                radius * Math.cos(theta),
                y,
                radius * Math.sin(theta),
            ));
        }
        return path;
    }

    constructor(scene: Scene, player: Player, cursor: Cursor){
        this.player = player;
        this.cursor = cursor;
        for(let c = 0; c < 3; c++){
            const tube = CreateTube(
                `${player.name}.whistle.part${c + 1}`,
                {
                    path: this.createPath(this.radius, c),
                    radius: player.size / 18,
                    updatable: true,
                }
            )
            tube.parent = cursor.mesh;
            const tubeMaterial = new StandardMaterial(`${player.name}.whistle.part${c + 1}.material`, scene);
            tubeMaterial.backFaceCulling = false;
            const baseColor = new Color3(
                c == 0 ? 0.9 : 0.3,
                c == 1 ? 0.9 : 0.3,
                c == 2 ? 0.9 : 0.3,
            );
            Color.set(tubeMaterial, baseColor, {
                metallicity: 0.1,
                luminance: 0.25,
            });
            tube.material = tubeMaterial;
            this.tubes.push(tube);
        }
        this.radius = 0;
    }

    private _radius: number = 1;
    public get radius() { return this._radius; }
    private set radius(radius: number) {
        if(this._radius == radius){
            return;
        }
        this._radius = radius;
        if(radius == 0){
            this.tubes.forEach(tube => tube.isVisible = false);
            return;
        }
        this.tubes.forEach(tube => tube.isVisible = true);

        for(let c = 0; c < 3; c++){
            CreateTube(this.tubes[c].name, {
                path: this.createPath(radius, c),
                radius: this.player.size / 18,
                instance: this.tubes[c],
            });
            this.tubes[c].refreshBoundingInfo();
        }
    }

    public update(deltaSeconds: number, objects: Entity[]) {
        if(this.active){
            this.activeSeconds += deltaSeconds;
        }
        else{
            this.activeSeconds = 0;
        }
        
        if(this.activeSeconds > Whistle.EXPANDING_SECONDS + Whistle.KEEPING_SECONDS){
            this.radius = 0;
        }
        else{
            this.radius = Whistle.MAX_RADIUS * Math.min(this.activeSeconds / Whistle.EXPANDING_SECONDS, 1);
        }

        // ピクミンを呼ぶ
        const whistleFigure = new Sphere(this.getAbsolutePosition(), this.radius);
        for(const object of objects){
            if(object instanceof Minion){
                if(object.figure.intersects(whistleFigure)){
                    object.startFollowing(this.player);
                }
            }
        }
    }

    public getAbsolutePosition(): Vector3 {
        return this.cursor.getAbsolutePosition();
    }
}
