import { Scene } from "#vendor/babylon";
import { Entity } from "./objects/entity";
import { MainCamera } from "./rendering/camera";

export class Game {
    public readonly objects: Entity[] = [];
    public readonly camera: MainCamera;

    constructor(public readonly scene: Scene){
        this.camera = new MainCamera(this.scene);
    }
}