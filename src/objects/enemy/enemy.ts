import { Vector3 } from "#vendor/babylon";
import { Game } from "../../game";
import { Shape } from "../../physics/figure";
import { Entity } from "../entity";
import { HpMeter } from "./hpMeter";
import { Minion } from "../minion/minion";

export abstract class Enemy extends Entity {
    private readonly hpMeter: HpMeter;
    private _hp: number = 0;
    public get hp(): number { return this._hp; }
    private set hp(value: number) { this._hp = value; }

    private _maxHp: number = 0;
    public get maxHp(): number { return this._maxHp; }
    private set maxHp(value: number) { this._maxHp = value; } 
    public get isAlive(): boolean {
        return this.hp > 0 && this.game.objects.includes(this);
    }

    protected static readonly MAX_HP: number = 1;

    /** 上に Minion を当てた際に10ダメージを与える */
    protected static readonly TAKES_THROWN_MINION_TOP_HIT_DAMAGE: boolean = false;
    private get takesThrownMinionTopHitDamage(): boolean {
        return (this.constructor as typeof Enemy).TAKES_THROWN_MINION_TOP_HIT_DAMAGE;
    }

    constructor(
        game: Game,
        position: Vector3,
        size: number,
        hp: number,
        height?: number,
        shape: Shape = Shape.Cylinder,
    ){
        super(game, "enemy", shape, size, position, { fall: true, height });
        this.hp = this.maxHp = hp;
        this.hpMeter = new HpMeter(this.mesh, this.scene, this.height);
        this.collisionEventsEnabled = this.takesThrownMinionTopHitDamage;
    }

    public override onCollisionEnter(entity: Entity): void {
        if (
            this.takesThrownMinionTopHitDamage
            && entity instanceof Minion
            && entity.wasThrownOntoTopOf(this)
        ) {
            this.damage(10);
        }
    }

    public damage(damage: number){
        this.hp = Math.max(this.hp - damage, 0);
        this.hpMeter.update(this.hp, this.maxHp);
        if(this.hp === 0){
            this.die();
        }
    }
    public heal(heal: number){
        this.hp = Math.min(this.hp + heal, this.maxHp);
        this.hpMeter.update(this.hp, this.maxHp);
    }

    protected die(){
        this.disposeHpMeter();
        this.remove();
    }

    protected disposeHpMeter(): void {
        this.hpMeter.dispose();
    }
}
