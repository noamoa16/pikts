import {
    Color3,
    CreateSphere,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Game } from "../game";
import { Effect } from "./effect";

/** Kochappy が倒れたときに上昇して消える魂。 */
export class SoulEffect extends Effect {
    private static readonly DURATION_SECONDS = 3;
    private static readonly RISE_DISTANCE = 3;
    private readonly startPosition: Vector3;

    constructor(game: Game, position: Vector3) {
        const mesh = CreateSphere("soul-effect", { diameter: 1 / 8, segments: 16 }, game.scene);
        const material = new StandardMaterial("soul-effect.material", game.scene);
        material.diffuseColor = new Color3(0, 0, 1);
        material.emissiveColor = new Color3(0, 0, 1);
        material.alpha = 0.15;
        material.backFaceCulling = false;
        mesh.material = material;
        super(game, mesh);
        this.startPosition = position.clone();
        this.setPosition(this.startPosition);
    }

    public override update(deltaSeconds: number): void {
        this.elapsedSeconds = Math.min(
            this.elapsedSeconds + deltaSeconds,
            SoulEffect.DURATION_SECONDS,
        );
        const progress = this.elapsedSeconds / SoulEffect.DURATION_SECONDS;
        this.mesh.position.set(
            this.startPosition.x,
            this.startPosition.y,
            this.startPosition.z + SoulEffect.RISE_DISTANCE * progress,
        );
        if (progress >= 1) this.game.removeEffect(this);
    }
}
