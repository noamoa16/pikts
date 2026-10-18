import { describe, expect, it } from "vitest";
import { getKeyboardAction } from "../../src/actions/keyboardBindings";

function keyboardEvent(code: string, key: string): KeyboardEvent {
    return { code, key } as KeyboardEvent;
}

describe("getKeyboardAction", () => {
    it.each([
        ["KeyW", "w", "up"], ["KeyS", "s", "down"],
        ["KeyA", "a", "left"], ["KeyD", "d", "right"],
        ["KeyF", "f", "rotate"], ["Enter", "Enter", "hold"],
        ["NumpadEnter", "Enter", "hold"], ["BracketLeft", "[", "whistle"],
    ] as const)("%s の入力を %s アクションに対応付ける", (code, key, action) => {
        expect(getKeyboardAction(keyboardEvent(code, key))).toBe(action);
    });

    it("未対応のキーでは undefined を返す", () => {
        expect(getKeyboardAction(keyboardEvent("KeyQ", "q"))).toBeUndefined();
    });

    it("[ は event.code が異なっていても whistle に対応付ける", () => {
        expect(getKeyboardAction(keyboardEvent("Unidentified", "["))).toBe("whistle");
    });
});
