import { Vector2 } from "#vendor/babylon";
import type { PlayerAction } from "../../actions/action";

type InputSource = "keyboard" | "virtual";

type PlayerInputState = Record<InputSource, Record<PlayerAction, boolean>>;

const initialActionState = (): Record<PlayerAction, boolean> => ({
    up: false,
    down: false,
    left: false,
    right: false,
    whistle: false,
    hold: false,
});

const keyboardActions: Partial<Record<string, PlayerAction>> = {
    KeyW: "up",
    KeyS: "down",
    KeyA: "left",
    KeyD: "right",
};

export class PlayerInput {
    private readonly state: PlayerInputState = {
        keyboard: initialActionState(),
        virtual: initialActionState(),
    };
    private readonly onKeyDown = this.createKeyHandler(true);
    private readonly onKeyUp = this.createKeyHandler(false);

    public constructor(private readonly target: Window = window) {
        this.target.addEventListener("keydown", this.onKeyDown);
        this.target.addEventListener("keyup", this.onKeyUp);
    }

    public setVirtual(action: PlayerAction, pressed: boolean): void {
        this.setInput("virtual", action, pressed);
    }

    public getMovement(): Vector2 {
        return new Vector2(
            Number(this.isActive("right")) - Number(this.isActive("left")),
            Number(this.isActive("up")) - Number(this.isActive("down")),
        );
    }

    public clearVirtualMovement(): void {
        this.setVirtual("up", false);
        this.setVirtual("down", false);
        this.setVirtual("left", false);
        this.setVirtual("right", false);
    }

    public dispose(): void {
        this.target.removeEventListener("keydown", this.onKeyDown);
        this.target.removeEventListener("keyup", this.onKeyUp);
    }

    private createKeyHandler(pressed: boolean): (event: KeyboardEvent) => void {
        return (event: KeyboardEvent) => {
            const action = keyboardActions[event.code];
            if (action) {
                this.setInput("keyboard", action, pressed);
            }
        };
    }

    private setInput(
        source: InputSource,
        action: PlayerAction,
        pressed: boolean,
    ): void {
        this.state[source][action] = pressed;
    }

    private isActive(action: PlayerAction): boolean {
        return this.state.keyboard[action] || this.state.virtual[action];
    }
}
