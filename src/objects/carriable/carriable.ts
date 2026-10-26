import {
    Color3,
    CreatePlane,
    DynamicTexture,
    Mesh,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Shape } from "../../physics/figure";
import { Game } from "../../game";
import { Color } from "../../rendering/color";
import { Entity } from "../entity";
import { Minion, MinionState } from "../minion/minion";
import { MinionColor } from "../minion/color";

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

    private readonly carrierCountTexture: DynamicTexture;
    private readonly carrierCountLabel: Mesh;
    private lastCarrierCountLabel: string = "";

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

    override update(_: number): void {
        this.carriers = this.carriers.filter(m => m.state == MinionState.carrying);
        if(this.carriers.length >= this.minCarriers){
            this.state = CarriableState.carried;
        }
        else{
            this.state = CarriableState.free;
        }

        this.updateCarrierCountLabel();
    }

    /** キャリアのうち最も多い色を返す。同数の場合は先に現れた色を返す。 */
    public getMostCommonCarrierColor(): MinionColor | null {
        if(this.carriers.length === 0){
            return null;
        }

        const counts = new Map<MinionColor, { count: number; firstIndex: number }>();
        this.carriers.forEach((carrier, index) => {
            const color = (carrier.constructor as typeof Minion).minionColor;
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

    private updateCarrierCountLabel(): void {
        const count = this.carriers.length;
        this.carrierCountLabel.isVisible = count > 0;
        if(count === 0) return;

        const label = `${count}/${this.minCarriers}`;
        if(label === this.lastCarrierCountLabel) return;
        this.lastCarrierCountLabel = label;

        const context = this.carrierCountTexture.getContext() as CanvasRenderingContext2D;
        context.clearRect(0, 0, 256, 256);
        context.fillStyle = count >= this.minCarriers ? "white" : "#B0B0B0";
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
}
