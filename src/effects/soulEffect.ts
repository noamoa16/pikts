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
    private static readonly INIT_ALPHA = 0.3;
    private readonly startPosition: Vector3;
    private readonly material: StandardMaterial;

    constructor(game: Game, position: Vector3) {
        const mesh = CreateSphere("soul-effect", { diameter: 1 / 8, segments: 16 }, game.scene);
        super(game, mesh);
        this.material = new StandardMaterial("soul-effect.material", game.scene);
        this.material.diffuseColor = new Color3(0, 0, 1);
        this.material.emissiveColor = new Color3(0, 0, 1);
        this.material.alpha = SoulEffect.INIT_ALPHA;
        this.material.backFaceCulling = false;
        mesh.material = this.material;
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
        this.material.alpha = (1 - progress) * SoulEffect.INIT_ALPHA;
        if (progress >= 1) this.game.removeEffect(this);
    }
}
