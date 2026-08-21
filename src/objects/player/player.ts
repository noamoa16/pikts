import {
    Color3,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { PlayerAction } from "../../actions/action";
import { atan, normalizeAngle, rotate2D, toVector2, toVector3 } from "../../core/math";
import { Shape } from "../../physics/figure";
import { Game } from "../../game";
import { Color } from "../../rendering/color";
import { Entity } from "../entity";
import { Nose } from "./nose";
import { Cursor } from "./cursor";
import { Whistle } from "./whistle";
import { Minion, MinionState } from "../minion/minion";
import { PlayerInput } from "./playerInput";

export class Player extends Entity {
    public static readonly SPEED = 4.0;
    private readonly input = new PlayerInput();

    public readonly cursor: Cursor;
    public readonly whistle: Whistle;

    private holdingMinion: Minion | null = null;

    constructor(game: Game, position: Vector3) {
        super(game, "player", Shape.Sphere, 0.5, position, { fall: true });
        this.speed = Player.SPEED;
        this.collisionEventsEnabled = true;

        const material = new StandardMaterial(`${this.name}.material`, this.scene);
        material.backFaceCulling = false;
        Color.set(material, new Color3(0.95, 0.8, 0.7), {
            metallicity: 0.1,
            luminance: 0.3,
        });
        this.mesh.material = material;

        // 鼻パーツ
        new Nose(this.scene, this);

        // カーソル
        this.cursor = new Cursor(this.scene, this);

        // 笛
        this.whistle = new Whistle(this.game, this, this.cursor);

        // キー入力
        this.scene.onDisposeObservable.add(() => {
            this.input.dispose();
        });
    }

    override update(deltaSeconds: number): void {
        this.velocity.x = 0;
        this.velocity.y = 0;
        super.update(deltaSeconds);

        // 移動
        const movement = this.input.getMovement();
        const horizontalDisplacement =
            movement.equalsToFloats(0, 0)
                ? Vector3.Zero()
                : toVector3(rotate2D(movement, this.game.camera.rotation - Math.PI / 2))
                    .normalize()
                    .scale(this.speed * deltaSeconds);
        const positionBeforeHorizontalMove = this.position.clone();
        this.mesh.moveWithCollisions(horizontalDisplacement);
        const actualHorizontalDisplacement = this.position.subtract(positionBeforeHorizontalMove);
        if(deltaSeconds > 0){
            this.velocity.x = actualHorizontalDisplacement.x / deltaSeconds;
            this.velocity.y = actualHorizontalDisplacement.y / deltaSeconds;
        }

        // 向きを変える
        if(!horizontalDisplacement.equals(Vector3.Zero())){
            const currentTheta = this.rotation.z;
            const targetTheta = atan(toVector2(horizontalDisplacement));
            const diffThera = normalizeAngle(
                targetTheta - currentTheta,
                { includePi: (Math.cos(currentTheta) >= 0) },
            );
            const ROTATION_SPEED = 2.5;
            this.rotation.z = currentTheta + Math.sign(diffThera) * Math.min(
                Math.PI * deltaSeconds * ROTATION_SPEED,
                Math.abs(diffThera),
            );
        }

        this.cursor.update();
        this.cursor.moveFor(toVector2(horizontalDisplacement), deltaSeconds);
    }

    public getHoldableMinion(): Minion | null{
        const HOLDABLE_DISTANCE = 1.5;
        let candidate: Minion | null = null;
        let minDistanceSq = HOLDABLE_DISTANCE * HOLDABLE_DISTANCE;
        for(const object of this.game.objects){
            if(!(object instanceof Minion)) continue;
            if(object.state !== MinionState.following) continue;
            const distanceSq = Vector3.DistanceSquared(this.groundingPosition, object.groundingPosition);
            if(distanceSq < minDistanceSq){
                minDistanceSq = distanceSq;
                candidate = object; 
            }
        }
        return candidate;
    }
    public tryHoldMinion(){
        if(this.holdingMinion) return;
        this.holdingMinion = this.getHoldableMinion();
        if(!this.holdingMinion) return;
        this.holdingMinion.becomeHeld(this);
    }
    public tryReleaseMinion(){
        if(!this.holdingMinion) return;
        this.holdingMinion.becomeThrown();
        this.holdingMinion = null;
    }

    public setVirtualInput(action: PlayerAction, pressed: boolean): void {
        this.input.setVirtual(action, pressed);
    }

    public removeEvents(){
        this.input.clearVirtualMovement();
        this.input.dispose();
    }
}
