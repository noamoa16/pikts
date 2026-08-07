import { Color3, CreateTorus, Scene, StandardMaterial, Vector2, Vector3 } from "#vendor/babylon";
import { atan, normalizeAngle, rotate2D, toVector2, toVector3 } from "../../core/math";
import { Color } from "../../rendering/color";
import { Player } from "./player";

export class Cursor {
    public readonly mesh;
    public static readonly CURSOR_DISTANCE = 2.5;
    public static readonly CURSOR_SPEED = 10.0;

    constructor(
        scene: Scene,
        private readonly player: Player
    ){
        this.mesh = CreateTorus(
            `${this.player.name}.cursor`,
            {
                diameter: this.player.size,
                thickness: this.player.size / 12,
                tessellation: 16,
            }
        );
        this.mesh.parent = this.player.mesh;
        this.mesh.position = new Vector3(Cursor.CURSOR_DISTANCE, 0, 0);
        this.mesh.rotation = new Vector3(Math.PI / 2, 0, 0);
        const cursorMaterial = new StandardMaterial(`${this.player.name}.cursor.material`, scene);
        cursorMaterial.backFaceCulling = false;
        Color.set(cursorMaterial, new Color3(0.9, 0.4, 0.7), {
            metallicity: 0.1,
            luminance: 0.25,
        });
        this.mesh.material = cursorMaterial;

        this._unrotatedPosition = rotate2D(toVector2(this.mesh.position), this.player.rotation.z);
    }
    public getAbsolutePosition(): Vector3 {
        return this.mesh.getAbsolutePosition();
    }

    // プレイヤーの回転を無視した位置
    private _unrotatedPosition: Vector2;
    public get unrotatedPosition(): Vector2{
        return this._unrotatedPosition;
    }
    private set unrotatedPosition(value: Vector2){
        this._unrotatedPosition = value;
        this.updateMeshPosition();
    }
    public update(){
        this.updateMeshPosition();
    }
    private updateMeshPosition(){
        if(
            this.unrotatedPosition.lengthSquared()
                > Cursor.CURSOR_DISTANCE * Cursor.CURSOR_DISTANCE
        ){
            this.unrotatedPosition.scaleInPlace(Cursor.CURSOR_DISTANCE / this.unrotatedPosition.length());
        }
        this.mesh.position = toVector3(rotate2D(this.unrotatedPosition, -this.player.rotation.z));
    }
    public moveFor(dir: Vector2, deltaSeconds: number){
        if(dir.lengthSquared() === 0) return;
        const scaledDir = dir.normalize().scale(deltaSeconds * Cursor.CURSOR_SPEED);
        let added = this.unrotatedPosition.add(scaledDir);

        // 範囲外に出そうな場合は角度を動かす
        if(added.lengthSquared()
            > Cursor.CURSOR_DISTANCE * Cursor.CURSOR_DISTANCE
        ){
            added.scaleInPlace(Cursor.CURSOR_DISTANCE / added.length());
            const diffThera = normalizeAngle(atan(scaledDir) - atan(added));
            const theta = scaledDir.length() / Cursor.CURSOR_DISTANCE;
            if(diffThera > 0){
                added = rotate2D(added, Math.min(theta, diffThera));
            }
            else{
                added = rotate2D(added, Math.max(-theta, diffThera));
            }
        }

        this.unrotatedPosition = added;
    }
}