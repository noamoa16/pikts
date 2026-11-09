import {
    Color3,
    StandardMaterial,
    Vector2,
    Vector3,
} from "#vendor/babylon";
import { toVector3 } from "../../core/math";
import { findGridPath, getNearestGridPoint, type GridPoint } from "../../core/gridPathfinding";
import { Shape } from "../../physics/figure";
import { Game } from "../../game";
import { Color } from "../../rendering/color";
import { Entity } from "../entity";
import { Minion, MinionState } from "../minion/minion";
import { MinionColor } from "../minion/color";
import { Player } from "../player/player";
import { Onion } from "../onion/onion";
import { CarrierCountLabel } from "./carrierCountLabel";
import { CarriableAbsorption } from "./carriableAbsorption";

export enum CarriableState {
    free,
    carried,
    absorbed,
}

export class Carriable extends Entity {
    protected static readonly _NUTRITION: number = 1;
    protected static readonly _MIN_CARRIERS: number = 1;
    protected static readonly _MAX_CARRIERS: number = 1;
    public get nutrition(): number { return (this.constructor as typeof Carriable)._NUTRITION; }
    public get minCarriers(){ return (this.constructor as typeof Carriable)._MIN_CARRIERS; }
    public get maxCarriers(){ return (this.constructor as typeof Carriable)._MAX_CARRIERS; }
    protected carriers: Minion[] = [];
    public get carrierCount(): number { return this.carriers.length; }
    public get radius(): number { return this.size / 2; }
    public get canAcceptCarrier(): boolean {
        return this.state !== CarriableState.absorbed && this.carriers.length < this.maxCarriers;
    }

    private readonly absorption: CarriableAbsorption;

    /** 運搬 Minion が円周上で占める、均等配置された位置を返す */
    public getCarrierFormationPosition(minion: Minion, distance: number): Vector3 | null {
        const index = this.carriers.indexOf(minion);
        if(index < 0) return null;

        const firstCarrier = this.carriers[0];
        const firstDirection = new Vector2(
            firstCarrier.position.x - this.position.x,
            firstCarrier.position.y - this.position.y,
        );
        const baseAngle = firstDirection.lengthSquared() > 0
            ? Math.atan2(firstDirection.y, firstDirection.x)
            : 0;
        const angle = baseAngle + index * 2 * Math.PI / this.carriers.length;
        return new Vector3(
            this.position.x + Math.cos(angle) * distance,
            this.position.y + Math.sin(angle) * distance,
            this.groundingPosition.z + minion.size / 2,
        );
    }

    public state: CarriableState = CarriableState.free;

    private readonly carrierCountLabel: CarrierCountLabel;

    constructor(game: Game, position: Vector3, size: number = 1) {
        super(game, "carriable", Shape.Cylinder, size, position, { fall: true });

        const material = new StandardMaterial(`${this.name}.material`, this.scene);
        material.backFaceCulling = false;
        Color.set(material, new Color3(0, 1, 0));
        this.mesh.material = material;

        this.carrierCountLabel = new CarrierCountLabel(this, this.scene);
        this.absorption = new CarriableAbsorption(this, game);
    }

    override update(deltaSeconds: number): void {
        if(this.state === CarriableState.absorbed){
            this.absorption.update(deltaSeconds);
            this.carrierCountLabel.update();
            return;
        }

        this.carriers = this.carriers.filter(m => m.state == MinionState.carrying);
        if(this.carriers.length >= this.minCarriers){
            this.state = CarriableState.carried;
        }
        else{
            this.state = CarriableState.free;
        }

        let absorbed = false;
        if(this.state === CarriableState.carried){
            this.moveToOnion(deltaSeconds);
            absorbed = this.absorbIfNearOnion();
        }

        // Carriables keep falling while being carried; the carriers control
        // horizontal movement, while collision and gravity resolve height.
        if(!absorbed){
            super.update(deltaSeconds);
        }

        this.carrierCountLabel.update();
    }

    /** 運搬者のうち最も多い色を返す。同数の場合は先に現れた色を返す。 */
    public getMostCommonCarrierColor(): MinionColor | null {
        if(this.carriers.length === 0){
            return null;
        }

        const counts = new Map<MinionColor, { count: number; firstIndex: number }>();
        this.carriers.forEach((carrier, index) => {
            const color = carrier.minionColor;
            const entry = counts.get(color);
            if(entry){
                entry.count++;
            }
            else{
                counts.set(color, { count: 1, firstIndex: index });
            }
        });

        let mostCommonColor: MinionColor | undefined;
        let mostCommonCount = 0;
        let firstIndex = Infinity;
        for(const [color, entry] of counts){
            if(entry.count > mostCommonCount || (entry.count === mostCommonCount && entry.firstIndex < firstIndex)){
                mostCommonColor = color;
                mostCommonCount = entry.count;
                firstIndex = entry.firstIndex;
            }
        }
        if(mostCommonColor === undefined){
            throw new Error("A carriable must have at least one carrier to determine its color");
        }
        return mostCommonColor;
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

    public removeCarrier(minion: Minion): void {
        this.carriers = this.carriers.filter(carrier => carrier !== minion);
    }

    public calcCarryingSpeed(): number{
        const count = this.carriers.length;
        if(count >= this.minCarriers){
            const baseSpeed = 1.0 * ((count - this.minCarriers + 1) / this.maxCarriers + 1);
            return baseSpeed * (this.game.isDevelopment && this.game.debugCarrySpeed2x ? 2 : 1);
        }
        else{
            return 0;
        }
    }

    private getTargetOnion(): Onion | null{
        const onions = this.game.onions.filter(
            onion => onion.minionColor === this.getMostCommonCarrierColor(),
        );
        return onions[0] ?? null;
    }

    private absorbIfNearOnion(): boolean {
        const target = this.getTargetOnion();
        if(!target) return false;
        const distanceSquared = (this.position.x - target.position.x) ** 2
            + (this.position.y - target.position.y) ** 2;
        if(distanceSquared > 0.5 * 0.5) return false;

        this.absorption.start(target, this.carriers, this.nutrition);
        this.carriers = [];
        this.state = CarriableState.absorbed;
        return true;
    }

    private moveToOnion(deltaSeconds: number): void{
        const target = this.getTargetOnion();
        if(!target) return;

        const goal = getNearestGridPoint(target.position.x, target.position.y);
        const start = getNearestGridPoint(
            this.position.x,
            this.position.y,
            goal,
        );
        const startDistance = Math.hypot(
            start.x - this.position.x,
            start.y - this.position.y,
        );

        // Grid movement must begin at a grid point. Move toward the nearest
        // one first, then calculate and follow the grid path on later frames.
        if(startDistance > 1e-6){
            this.moveTowardGridPoint(start, deltaSeconds);
            return;
        }
        if(startDistance > 0){
            this.position = new Vector3(start.x, start.y, this.position.z);
        }

        const direction = findGridPath(
            start,
            goal,
            this.game.gridMap,
            this.groundingPosition.z,
            this.size / 2,
        )?.[0];
        if(!direction) return;

        const next = { x: start.x + direction.x, y: start.y + direction.y };
        this.moveTowardGridPoint(next, deltaSeconds);
    }

    private moveTowardGridPoint(point: GridPoint, deltaSeconds: number): void{
        const direction = new Vector2(
            point.x - this.position.x,
            point.y - this.position.y,
        );
        const distance = direction.length();
        if(distance === 0) return;

        const moveDistance = Math.min(this.calcCarryingSpeed() * deltaSeconds, distance);
        this.moveFor(
            toVector3(direction.normalize().scale(moveDistance)),
            { ignoredEntities: this.carriers },
        );
    }

    protected override isBlockedBy(entity: Entity): boolean{
        if(
            this.state === CarriableState.carried
            && (entity instanceof Carriable || entity instanceof Minion || entity instanceof Player)
        ){
            return false;
        }
        return super.isBlockedBy(entity);
    }
}
