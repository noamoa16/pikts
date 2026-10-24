import {
    Color3,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Shape } from "../../physics/figure";
import { Game } from "../../game";
import { Color } from "../../rendering/color";
import { Entity } from "../entity";
import { Minion, MinionState } from "../minion/minion";

export enum CarriableState {
    free,
    carried,
}

export class Carriable extends Entity {
    protected static readonly _MIN_CARRIERS: number = 1;
    protected static readonly _MAX_CARRIERS: number = 1;
    public get minCarriers(){ return (this.constructor as typeof Carriable)._MIN_CARRIERS; }
    public get maxCarriers(){ return (this.constructor as typeof Carriable)._MAX_CARRIERS; }
    protected carriers: Minion[] = [];
    public get carrierCount(): number { return this.carriers.length; }
    public get radius(): number { return this.size / 2; }
    public get canAcceptCarrier(): boolean { return this.carriers.length < this.maxCarriers; }

    public state: CarriableState = CarriableState.free;

    constructor(game: Game, position: Vector3, size: number = 1) {
        super(game, "carriable", Shape.Cylinder, size, position, { fall: true });

        const material = new StandardMaterial(`${this.name}.material`, this.scene);
        material.backFaceCulling = false;
        Color.set(material, new Color3(0, 1, 0));
        this.mesh.material = material;
    }

    override update(_: number): void {
        this.carriers = this.carriers.filter(m => m.state == MinionState.carrying);
        if(this.carriers.length >= this.minCarriers){
            this.state = CarriableState.carried;
        }
        else{
            this.state = CarriableState.free;
        }
    }

    public tryAddCarrier(minion: Minion): boolean{
        if(this.canAcceptCarrier){
            this.carriers.push(minion);
            return true;
        }
        else{
            return false;
        }
    }
}
