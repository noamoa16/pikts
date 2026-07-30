export type MoveAction = "up" | "down" | "left" | "right";
export type Action = MoveAction | "rotate";

export function isMoveAction(action: Action): action is MoveAction {
    return ['up', 'down','left', 'right'].includes(action);
}