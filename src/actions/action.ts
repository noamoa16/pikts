export type MoveAction = "up" | "down" | "left" | "right";
export type PlayerAction = MoveAction | "hold" | "whistle";
export type Action = PlayerAction | "rotate";

export function isMoveAction(action: Action): action is MoveAction {
    return ['up', 'down','left', 'right'].includes(action);
}