import {
    Color3,
    CreateSphere,
    CreateTorus,
    CreateTube,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { MoveAction } from "../actions/action";
import { normalizeAngle, rotate2D, toVector3 } from "../core/math";
import { Shape } from "../physics/figure";
import { Game } from "../game";
import { Color } from "../rendering/color";
import { Entity } from "./entity";

type InputSource = "keyboard" | "virtual";

type PlayerInputState = {
    keyboard: Record<MoveAction, boolean>;
    virtual: Record<MoveAction, boolean>;
};

export class Player extends Entity {
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
        const nose = CreateSphere(`${this.name}.nose`, { diameter: this.size / 4 }, this.scene);
        nose.parent = this.mesh;
        nose.position = new Vector3(this.size / 2, 0, 0);
        const noseMaterial = new StandardMaterial(`${this.name}.nose.material`, this.scene);
        noseMaterial.backFaceCulling = false;
        Color.set(noseMaterial, new Color3(0.5, 0.2, 0.2), {
            metallicity: 0.1,
            luminance: 0.2,
        });
        nose.material = noseMaterial;

        // カーソル
        const cursor = CreateTorus(
            `${this.name}.cursor`,
            {
                diameter: this.size,
                thickness: this.size / 12,
                tessellation: 16,
            }
        );
        cursor.parent = this.mesh;
        cursor.position = new Vector3(this.size * 4, 0, 0);
        cursor.rotation = new Vector3(Math.PI / 2, 0, 0);
        const cursorMaterial = new StandardMaterial(`${this.name}.cursor.material`, this.scene);
        cursorMaterial.backFaceCulling = false;
        Color.set(cursorMaterial, new Color3(0.9, 0.4, 0.7), {
            metallicity: 0.1,
            luminance: 0.25,
        });
        cursor.material = cursorMaterial;

        // 笛
        const NUM_WHISTLE_PARTS = 24;
        let path = [];
        for(let i = 0; i < NUM_WHISTLE_PARTS; i++){
            const theta = i / NUM_WHISTLE_PARTS * 2 * Math.PI;
            path.push(new Vector3(Math.cos(theta), 0, Math.sin(theta)));
        }
        path.push(new Vector3(1, 0, 0))
        const pipe = CreateTube(
            `${this.name}.whistle`,
            {
                path,
                radius: this.size / 12,
            }
        )
        pipe.parent = cursor;

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
            Number(this.isDirectionActive("right")) - Number(this.isDirectionActive("left"));
        const moveY =
            Number(this.isDirectionActive("up")) - Number(this.isDirectionActive("down"));
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

    public setVirtualInput(direction: MoveAction, pressed: boolean): void {
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
        direction: MoveAction,
        pressed: boolean,
    ): void {
        this.inputState[source][direction] = pressed;
    }

    private isDirectionActive(direction: MoveAction): boolean {
        return this.inputState.keyboard[direction] || this.inputState.virtual[direction];
    }

    public removeEvents(){
        this.setVirtualInput("up", false);
        this.setVirtualInput("down", false);
        this.setVirtualInput("left", false);
        this.setVirtualInput("right", false);
    }
}
