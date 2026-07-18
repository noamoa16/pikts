import {
    Color3,
    CreateSphere,
    type Scene,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Action } from "../actions/action";
import { normalizeAngle } from "../core/math";
import { MainCamera } from "../rendering/camera";
import { Color } from "../rendering/color";
import { Entity } from "./entity";

type InputSource = "keyboard" | "virtual";

type PlayerInputState = {
    keyboard: Record<Action, boolean>;
    virtual: Record<Action, boolean>;
};

export class Player extends Entity {
    private readonly scene: Scene;
    private readonly camera: MainCamera;
    private readonly inputState: PlayerInputState = {
        keyboard: {
            up: false,
            down: false,
            left: false,
            right: false,
        },
        virtual: {
            up: false,
            down: false,
            left: false,
            right: false,
        },
    };
    private readonly onKeyDown: (event: KeyboardEvent) => void;
    private readonly onKeyUp: (event: KeyboardEvent) => void;

    constructor(scene: Scene, position: Vector3, camera: MainCamera) {
        super("player", { fall: true });
        this.scene = scene;
        this.camera = camera;
        this.size = 0.5;
        this.speed = 4;
        this.mesh = CreateSphere(this.name, { diameter: this.size }, scene);
        this.groundingPosition = position.clone();
        this.mesh.ellipsoid = new Vector3(
            this.size / 2,
            this.size / 2,
            this.size / 2,
        );
        this.checkCollisions = true;
        this.collisionEventsEnabled = true;

        const material = new StandardMaterial(`${this.name}.material`, scene);
        material.backFaceCulling = false;
        Color.set(material, new Color3(0.95, 0.8, 0.7), {
            metalicity: 0.1,
            luminance: 0.3,
        });
        this.mesh.material = material;

        // 鼻パーツ
        const nose = CreateSphere(`${this.name}.nose`, { diameter: this.size / 4 }, scene);
        nose.parent = this.mesh;
        nose.position = new Vector3(this.size / 2, 0, 0);
        const noseMaterial = new StandardMaterial(`${this.name}.nose.material`, scene);
        noseMaterial.backFaceCulling = false;
        Color.set(noseMaterial, new Color3(0.5, 0.2, 0.2), {
            metalicity: 0.1,
            luminance: 0.2,
        });
        nose.material = noseMaterial;

        // キー入力
        this.onKeyDown = this.createKeyHandler(true);
        this.onKeyUp = this.createKeyHandler(false);
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
        scene.onDisposeObservable.add(() => {
            window.removeEventListener("keydown", this.onKeyDown);
            window.removeEventListener("keyup", this.onKeyUp);
        });
    }

    override update(deltaSeconds: number): void {
        // 移動
        const moveX =
            Number(this.isDirectionActive("right")) - Number(this.isDirectionActive("left"));
        const moveY =
            Number(this.isDirectionActive("up")) - Number(this.isDirectionActive("down"));
        const horizontalDisplacement =
            moveX === 0 && moveY === 0
                ? Vector3.Zero()
                : new Vector3(moveX, moveY, 0)
                      .normalize()
                      .scale(this.speed * deltaSeconds);
        const gravityDisplacement = this.fall
            ? this.scene.gravity.scale(deltaSeconds)
            : Vector3.Zero();
        this.mesh.moveWithCollisions(horizontalDisplacement.add(gravityDisplacement));

        // 向きを変える
        if(!horizontalDisplacement.equals(Vector3.Zero())){
            const ROTATION_SPEED = 2.5;
            const currentTheta = this.rotation.z;
            const targetTheta = Math.atan2(horizontalDisplacement.y, horizontalDisplacement.x);
            const diffThera = normalizeAngle(
                targetTheta - currentTheta,
                { includePi: (Math.cos(this.rotation.z) >= 0) },
            );
            this.rotation.z = currentTheta + Math.sign(diffThera) * Math.min(
                Math.PI * deltaSeconds * ROTATION_SPEED,
                Math.abs(diffThera),
            );
        }

        // カメラのアングルも計算に入れる予定
        this.camera;
    }

    public setVirtualInput(direction: Action, pressed: boolean): void {
        this.setInput("virtual", direction, pressed);
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
            }
        };
    }

    private setInput(
        source: InputSource,
        direction: Action,
        pressed: boolean,
    ): void {
        this.inputState[source][direction] = pressed;
    }

    private isDirectionActive(direction: Action): boolean {
        return this.inputState.keyboard[direction] || this.inputState.virtual[direction];
    }

    public removeEvents(){
        this.setVirtualInput("up", false);
        this.setVirtualInput("down", false);
        this.setVirtualInput("left", false);
        this.setVirtualInput("right", false);
    }
}
