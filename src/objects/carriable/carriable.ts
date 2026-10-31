import {
    Color3,
    CreatePlane,
    DynamicTexture,
    Mesh,
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
import { MinionColor, minionColorToString } from "../minion/color";
import { Player } from "../player/player";
import { Onion } from "../onion/onion";

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
            this.position.z,
        );
    }

    public state: CarriableState = CarriableState.free;

    private readonly carrierCountTexture: DynamicTexture;
    private readonly carrierCountLabel: Mesh;

    constructor(game: Game, position: Vector3, size: number = 1) {
        super(game, "carriable", Shape.Cylinder, size, position, { fall: true });

        const material = new StandardMaterial(`${this.name}.material`, this.scene);
        material.backFaceCulling = false;
        Color.set(material, new Color3(0, 1, 0));
        this.mesh.material = material;

        const carrierCountLabel = this.createCarrierCountLabel();
        this.carrierCountTexture = carrierCountLabel.texture;
        this.carrierCountLabel = carrierCountLabel.mesh;
    }

    override update(deltaSeconds: number): void {
        this.carriers = this.carriers.filter(m => m.state == MinionState.carrying);
        if(this.carriers.length >= this.minCarriers){
            this.state = CarriableState.carried;
        }
        else{
            this.state = CarriableState.free;
        }

        if(this.state === CarriableState.carried){
            this.moveToOnion(deltaSeconds);
        }

        this.updateCarrierCountLabel();
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

    /**
     * 分数ラベルを更新
     */
    private updateCarrierCountLabel(): void {
        const count = this.carriers.length;
        this.carrierCountLabel.isVisible = count > 0;
        if(count === 0) return;

        const context = this.carrierCountTexture.getContext() as CanvasRenderingContext2D;
        context.clearRect(0, 0, 256, 256);
        if(count >= this.minCarriers){
            const mostCommonColor = this.getMostCommonCarrierColor();
            if(mostCommonColor !== null){
                context.fillStyle = minionColorToString(mostCommonColor);
            }
            else{
                context.fillStyle = "white";
            }
        }
        else{
            context.fillStyle = "#B0B0B0";
        }
        context.font = "bold 88px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(count.toString(), 128, 64);
        context.fillRect(48, 126, 160, 8);
        context.fillText(this.minCarriers.toString(), 128, 192);
        this.carrierCountTexture.update();
    }

    private createCarrierCountLabel(): { texture: DynamicTexture; mesh: Mesh } {
        const texture = new DynamicTexture(
            `${this.name}.carrierCountTexture`,
            { width: 256, height: 256 },
            this.scene,
        );
        texture.hasAlpha = true;

        const material = new StandardMaterial(`${this.name}.carrierCountMaterial`, this.scene);
        material.diffuseTexture = texture;
        material.useAlphaFromDiffuseTexture = true;
        material.emissiveColor = Color3.White();
        material.backFaceCulling = false;

        const SIZE = 1.0; // 分数のサイズ
        const mesh = CreatePlane(
            `${this.name}.carrierCountLabel`,
            { size: SIZE },
            this.scene,
        );
        mesh.parent = this.mesh;
        mesh.position = new Vector3(0, 0, this.size / 2 + SIZE);
        mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
        // The game mirrors its canvas horizontally, so mirror the label to keep its text readable.
        mesh.scaling.x = -1;
        mesh.material = material;
        mesh.isPickable = false;
        mesh.checkCollisions = false;
        mesh.isVisible = false;

        return { texture, mesh };
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

    private calcCarryingSpeed(): number{
        const count = this.carriers.length;
        if(count >= this.minCarriers){
            return (count - this.minCarriers + 1) / this.maxCarriers + 1;
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

        const direction = findGridPath(start, goal, this.game.gridMap)?.[0];
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
