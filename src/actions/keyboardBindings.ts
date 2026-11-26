import type { Action } from "./action";

type KeyboardBinding = {
    action: Action;
    code?: string;
    key?: string;
};

const KEYBOARD_BINDINGS: readonly KeyboardBinding[] = [
    { action: "up", code: "KeyW" },
    { action: "down", code: "KeyS" },
    { action: "left", code: "KeyA" },
    { action: "right", code: "KeyD" },
    { action: "whistle", code: "BracketLeft", key: "[" },
    { action: "cameraAngle", code: "Digit2", key: "@" },
    { action: "cameraAngle", key: "@" },
    { action: "cameraZoom", code: "Semicolon", key: ":" },
    { action: "cameraZoom", key: ":" },
    { action: "rotate", code: "KeyF" },
    { action: "disband", code: "KeyR" },
    { action: "hold", code: "Enter" },
    { action: "hold", code: "NumpadEnter" },
];

export function getKeyboardAction(event: KeyboardEvent): Action | undefined {
    return KEYBOARD_BINDINGS.find(binding =>
        (binding.code === event.code &&
            (binding.key === undefined || binding.key === event.key)) ||
        binding.key === event.key
    )?.action;
}
