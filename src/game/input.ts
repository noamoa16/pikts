import { Vector3, type Engine } from "#vendor/babylon";
import { isMoveAction, type Action } from "../actions/action";
import { Game } from "../game";
import { Minion } from "../objects/minion/minion";
import { MinionColor } from "../objects/minion/color";
import { MinionState } from "../objects/minion/state";
import { RedMinion, YellowMinion, BlueMinion } from "../objects/minion/minions";
import { Player } from "../objects/player/player";
import { Dpad } from "../ui/dpad";

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
                onCarrySpeed2xChange: enabled => {
                    game.debugCarrySpeed2x = enabled;
                },
                onAddMinions: () => this.addMinions(),
            } : undefined,
            context => game.minionCountDisplay.drawRecordingOverlay(context),
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
        for (const minion of following) {
            const average = averageByColor.get(minion.minionColor)!;
            minion.becomeDisbanded(new Vector3(
                average.x / average.count,
                average.y / average.count,
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
