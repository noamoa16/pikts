export enum MinionColor {
    red,
    yellow,
    blue,
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