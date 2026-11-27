import { Vector3, type Engine } from "#vendor/babylon";
import { isMoveAction, type Action } from "../actions/action";
import type { Game } from "../game";
import { Minion } from "../objects/minion/minion";
import { MinionColor } from "../objects/minion/color";
import { MinionState } from "../objects/minion/state";
import { RedMinion, YellowMinion, BlueMinion } from "../objects/minion/minions";
import { Player } from "../objects/player/player";
import { Dpad } from "../ui/dpad";

const DISBAND_COLOR_TARGET_MIN_DISTANCE = 1.25;

/** ゲーム共通のキーボード・D-pad入力とアクションを管理する。 */
export class GameInput {
    private readonly dpad: Dpad;

    constructor(
        private readonly game: Game,
        private readonly player: Player,
        engine: Engine,
    ) {
        this.dpad = new Dpad(
            engine,
            (action, pressed) => this.handleAction(action, pressed),
            game.isDevelopment ? {
                onGameSpeed2xChange: enabled => {
                    game.debugGameSpeed2x = enabled;
                },
                onAddMinions: () => this.addMinions(),
            } : undefined,
            context => game.gameHudDisplay.drawRecordingOverlay(context),
        );

        player.setKeyboardActionHandler((action, pressed) => {
            this.dpad.setKeyboardPressed(action, pressed);
            if (!isMoveAction(action)) this.handleAction(action, pressed);
        });

        const onResize = () => this.dpad.adjustLayout();
        window.addEventListener("resize", onResize);
        game.scene.onBeforeRenderObservable.add(() => {
            this.dpad.setHoldPrompt(player.hasNearbyBuriedMinion());
            this.dpad.setWhistlePrompt(player.hasHoldingMinion);
        });
        game.scene.onDisposeObservable.add(() => {
            window.removeEventListener("resize", onResize);
            this.dpad.remove();
        });
    }

    private handleAction(action: Action, pressed: boolean): void {
        if (isMoveAction(action)) {
            this.player.setVirtualInput(action, pressed);
            return;
        }

        switch (action) {
            case "whistle":
                if (pressed && this.player.hasHoldingMinion) this.player.trySwitchMinion();
                this.player.whistle.active = pressed && !this.player.hasHoldingMinion;
                break;
            case "rotate":
                if (pressed) this.game.camera.startRotate(this.player.rotation.z);
                break;
            case "cameraAngle":
                if (pressed) this.game.camera.cycleAngle();
                break;
            case "cameraZoom":
                if (pressed) this.game.camera.cycleZoom();
                break;
            case "disband":
                if (pressed) this.disbandFollowingMinions();
                break;
            case "hold":
                if (pressed) this.player.handleHoldPressed();
                else this.player.handleHoldReleased();
                break;
            default:
                break;
        }
    }

    private disbandFollowingMinions(): void {
        const following = this.game.objects.filter((object): object is Minion =>
            object instanceof Minion && object.state === MinionState.following,
        );
        const averageByColor = new Map<MinionColor, { x: number; y: number; count: number }>();
        for (const minion of following) {
            const average = averageByColor.get(minion.minionColor) ?? { x: 0, y: 0, count: 0 };
            average.x += minion.groundingPosition.x;
            average.y += minion.groundingPosition.y;
            average.count++;
            averageByColor.set(minion.minionColor, average);
        }

        const targetsByColor = new Map<MinionColor, { x: number; y: number }>();
        for (const color of Minion.COLOR_ORDER) {
            const average = averageByColor.get(color);
            if (average) {
                targetsByColor.set(color, { x: average.x / average.count, y: average.y / average.count });
            }
        }
        separateDisbandTargets(targetsByColor);

        for (const minion of following) {
            const target = targetsByColor.get(minion.minionColor)!;
            minion.becomeDisbanded(new Vector3(
                target.x,
                target.y,
                0,
            ));
        }
    }

    private addMinions(): void {
        const minionCount = this.game.objects.filter(object => object instanceof Minion).length;
        if (minionCount > 200) return;

        const spawnPosition = this.player.position.add(new Vector3(0, 0, 2));
        for (let i = 0; i < 5; i++) new RedMinion(this.game, spawnPosition.clone());
        for (let i = 0; i < 5; i++) new YellowMinion(this.game, spawnPosition.clone());
        for (let i = 0; i < 5; i++) new BlueMinion(this.game, spawnPosition.clone());
    }
}

function separateDisbandTargets(targetsByColor: Map<MinionColor, { x: number; y: number }>): void {
    const targets = [...targetsByColor.entries()];

    // Push nearby color averages apart while keeping their original averages as much as possible.
    for (let iteration = 0; iteration < 32; iteration++) {
        let moved = false;
        for (let firstIndex = 0; firstIndex < targets.length; firstIndex++) {
            const [firstColor, first] = targets[firstIndex];
            for (let secondIndex = firstIndex + 1; secondIndex < targets.length; secondIndex++) {
                const [secondColor, second] = targets[secondIndex];
                let dx = second.x - first.x;
                let dy = second.y - first.y;
                let distance = Math.hypot(dx, dy);
                if (distance >= DISBAND_COLOR_TARGET_MIN_DISTANCE) continue;

                let directionLength = distance;
                if (distance === 0) {
                    const colorPairIndex = Minion.COLOR_ORDER.indexOf(firstColor) * Minion.COLOR_ORDER.length
                        + Minion.COLOR_ORDER.indexOf(secondColor);
                    const angle = colorPairIndex * Math.PI / Minion.COLOR_ORDER.length;
                    dx = Math.cos(angle);
                    dy = Math.sin(angle);
                    directionLength = 1;
                }

                const pushDistance = (DISBAND_COLOR_TARGET_MIN_DISTANCE - distance) / 2;
                const pushX = dx / directionLength * pushDistance;
                const pushY = dy / directionLength * pushDistance;
                first.x -= pushX;
                first.y -= pushY;
                second.x += pushX;
                second.y += pushY;
                moved = true;
            }
        }
        if (!moved) break;
    }
}
