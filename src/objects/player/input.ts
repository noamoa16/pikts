import { Vector2 } from "#vendor/babylon";
import { isMoveAction, type Action, type PlayerAction } from "../../actions/action";
import { getKeyboardAction } from "../../actions/keyboardBindings";

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

export class PlayerInput {
    private readonly state: PlayerInputState = {
        keyboard: initialActionState(),
        virtual: initialActionState(),
    };
    private actionHandler: ((action: Action, pressed: boolean) => void) | null = null;

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

    public setActionHandler(handler: (action: Action, pressed: boolean) => void): void {
        this.actionHandler = handler;
    }

    public dispose(): void {
        this.target.removeEventListener("keydown", this.onKeyDown);
        this.target.removeEventListener("keyup", this.onKeyUp);
    }

    private readonly onKeyDown = (event: KeyboardEvent): void => {
        this.handleKeyboardEvent(event, true);
    };

    private readonly onKeyUp = (event: KeyboardEvent): void => {
        this.handleKeyboardEvent(event, false);
    };

    private handleKeyboardEvent(event: KeyboardEvent, pressed: boolean): void {
        const action = getKeyboardAction(event);
        if (!action) {
            return;
        }
        if (isMoveAction(action)) {
            this.setInput("keyboard", action, pressed);
        }
        this.actionHandler?.(action, pressed);
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
