import { Color3 } from "#vendor/babylon";

export enum MinionColor {
    red,
    yellow,
    blue,
}

export function minionColorToColor3(minionColor: MinionColor): Color3 {
    switch(minionColor){
        case MinionColor.red:
            return new Color3(1, 0, 0);
        case MinionColor.yellow:
            return new Color3(1, 1, 0);
        case MinionColor.blue:
            return new Color3(0, 0, 1);
        default:
            throw new Error(`Unknown minion color: ${minionColor}`);
    }
}

export function minionColorToString(minionColor: MinionColor | null){
    if(minionColor === null){
        return "null";
    }
    return {
        [MinionColor.red]: "red",
        [MinionColor.blue]: "blue",
        [MinionColor.yellow]: "yellow",
    }[minionColor];
}
