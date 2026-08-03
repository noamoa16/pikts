import {
    Color3,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { PlayerAction } from "../../actions/action";
import { normalizeAngle, rotate2D, toVector3 } from "../../core/math";
import { Shape } from "../../physics/figure";
import { Game } from "../../game";
import { Color } from "../../rendering/color";
import { Entity } from "../entity";
import { Nose } from "./nose";
import { Cursor } from "./cursor";
import { Whistle } from "./whistle";
import { Minion, MinionState } from "../minion/minion";

type InputSource = "keyboard" | "virtual";

type PlayerInputState = {
    keyboard: Record<PlayerAction, boolean>;
    virtual: Record<PlayerAction, boolean>;
};

export class Player extends Entity {
    private readonly inputState: PlayerInputState = {
        keyboard: {
            up: false,
            down: false,
            left: false,
            right: false,
            whistle: false,
            hold: false,
        },
        virtual: {
            up: false,
            down: false,
            left: false,
            right: false,
            whistle: false,
            hold: false,
        },
    };
    private readonly onKeyDown: (event: KeyboardEvent) => void;
    private readonly onKeyUp: (event: KeyboardEvent) => void;

    public readonly cursor: Cursor;
    public readonly whistle: Whistle;

    private holdingMinion: Minion | null = null;

    constructor(game: Game, position: Vector3) {
        super(game, "player", Shape.Sphere, 0.5, position, { fall: true });
        this.speed = 4;
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
        this.whistle = new Whistle(this.scene, this, this.cursor);

        // キー入力
        this.onKeyDown = this.createKeyHandler(true);
        this.onKeyUp = this.createKeyHandler(false);
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
        this.scene.onDisposeObservable.add(() => {
            window.removeEventListener("keydown", this.onKeyDown);
            window.removeEventListener("keyup", this.onKeyUp);
        });
    }

    override update(deltaSeconds: number): void {
        super.update(deltaSeconds);

        // 移動
        const moveX =
            Number(this.isActionActive("right")) - Number(this.isActionActive("left"));
        const moveY =
            Number(this.isActionActive("up")) - Number(this.isActionActive("down"));
        const horizontalDisplacement =
            moveX === 0 && moveY === 0
                ? Vector3.Zero()
                : toVector3(rotate2D(moveX, moveY, this.game.camera.rotation - Math.PI / 2))
                    .normalize()
                    .scale(this.speed * deltaSeconds);
        this.mesh.moveWithCollisions(horizontalDisplacement);

        // 向きを変える
        if(!horizontalDisplacement.equals(Vector3.Zero())){
            const currentTheta = this.rotation.z;
            const targetTheta = Math.atan2(horizontalDisplacement.y, horizontalDisplacement.x);
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
        this.setInput("virtual", action, pressed);
    }

    private createKeyHandler(pressed: boolean): (event: KeyboardEvent) => void {
        return (event: KeyboardEvent) => {
            switch (event.code) {
                case "KeyW":
                    this.setInput("keyboard", "up", pressed);
                    break;
                case "KeyS":
                    this.setInput("keyboard", "down", pressed);
                    break;
                case "KeyA":
                    this.setInput("keyboard", "left", pressed);
                    break;
                case "KeyD":
                    this.setInput("keyboard", "right", pressed);
                    break;
                // case "Enter":
            }
        };
    }

    private setInput(
        source: InputSource,
        action: PlayerAction,
        pressed: boolean,
    ): void {
        this.inputState[source][action] = pressed;
    }

    private isActionActive(action: PlayerAction): boolean {
        return this.inputState.keyboard[action] || this.inputState.virtual[action];
    }

    public removeEvents(){
        this.setVirtualInput("up", false);
        this.setVirtualInput("down", false);
        this.setVirtualInput("left", false);
        this.setVirtualInput("right", false);
    }
}
