import { Scene, Vector3 } from "#vendor/babylon";
import { Entity } from "./objects/entity";
import { Minion, MinionState } from "./objects/minion/minion";
import { Player } from "./objects/player/player";
import { MainCamera } from "./rendering/camera";

export class Game {
    public readonly objects: Entity[] = [];
    public readonly camera: MainCamera;

    private _cachedCharacterPos: Vector3[] = [];
    public get cachedCharacterPos() { return this._cachedCharacterPos; }
    private set cachedCharacterPos(value: Vector3[]) { this._cachedCharacterPos = value; }

    constructor(public readonly scene: Scene){
        this.camera = new MainCamera(this.scene);
    }

    public cacheCharacterPos(){
        this.cachedCharacterPos = [];
        for(const object of this.objects){
            if(object instanceof Player){
                this.cachedCharacterPos.push(object.position);
            }
            if(object instanceof Minion){
                if(![MinionState.following, MinionState.free].includes(object.state)){
                    continue;
                }
                this.cachedCharacterPos.push(object.position);
            }
        }
    }
}