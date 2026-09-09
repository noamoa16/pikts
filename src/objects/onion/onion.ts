import {
    Color3,
    Vector3,
} from "#vendor/babylon";
import { Game } from "../../game";
import { Shape } from "../../physics/figure";
import { Entity } from "../entity";
import { Base } from "./base";
import { Pillar } from "./pillar";

export abstract class Onion extends Entity {
    protected static readonly _BASE_COLOR: Color3 = new Color3(0, 0.95, 0);
    protected static readonly _SIZE = 2.5;
    private get baseColor(){ return (this.constructor as typeof Onion)._BASE_COLOR; }

    constructor(game: Game, position: Vector3) {
        super(game, "onion", Shape.Sphere, Onion._SIZE, position, { fall: false });
        this.isVisible = false;
        this.mesh.checkCollisions = false;

        // 球体作成
        new Base(this.scene, this, this.baseColor);

        // 足作成
        for(let i = 0; i < 3; i++){
            new Pillar(this.scene, this, i, this.baseColor);
        }
    }

    override update(_: number): void {
        // 何もしない
    }
}
