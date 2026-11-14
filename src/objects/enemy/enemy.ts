import { Vector3 } from "#vendor/babylon";
import { Game } from "../../game";
import { Shape } from "../../physics/figure";
import { Entity } from "../entity";

export abstract class Enemy extends Entity {
    private _hp: number = 0;
    public get hp(): number { return this._hp; }
    private set hp(value: number) { this._hp = value; }

    private _maxHp: number = 0;
    public get maxHp(): number { return this._maxHp; }
    private set maxHp(value: number) { this._maxHp = value; } 

    protected static readonly MAX_HP: number = 1;

    constructor(game: Game, position: Vector3, size: number, hp: number, height?: number){
        super(game, "enemy", Shape.Cylinder, size, position, { fall: true, height });
        this.hp = this.maxHp = hp;
    }

    public damage(damage: number){
        this.hp = Math.max(this.hp - damage, 0);
        if(this.hp === 0){
            this.die();
        }
    }
    public heal(heal: number){
        this.hp = Math.min(this.hp + heal, this.maxHp);
    }

    protected die(){
        // 現状は何もしない
    }
}
