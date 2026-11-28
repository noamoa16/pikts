import {
    Color3,
    CreateSphere,
    StandardMaterial,
    Vector3,
} from "#vendor/babylon";
import { Game } from "../game";
import { Effect } from "./effect";

type SoulEffectOptions = {
    color?: Color3;
    /** 基準半径に掛ける倍率 */
    radiusScale?: number;
    /** 球の z 軸方向の倍率 */
    zScale?: number;
    /** 上昇中にカメラ角度に沿った XY 軌道を描く */
    moveInXY?: boolean;
};

/** 敵や Minion が倒れたときに上昇して消える魂。 */
export class SoulEffect extends Effect {
    private static readonly DURATION_SECONDS = 3;
    private static readonly RISE_DISTANCE = 3;
    private static readonly INIT_ALPHA = 0.4;
    private readonly startPosition: Vector3;
    private readonly material: StandardMaterial;
    private readonly xyDirection: number;
    private readonly cameraAngle: number;

    constructor(game: Game, position: Vector3, options: SoulEffectOptions = {}) {
        const {
            color = new Color3(0, 0, 1),
            radiusScale = 1,
            zScale = 1,
            moveInXY = false,
        } = options;
        const mesh = CreateSphere("soul-effect", {
            diameter: (1 / 8) * radiusScale,
            segments: 16,
        }, game.scene);
        mesh.scaling.z = zScale;
        super(game, mesh);
        this.material = new StandardMaterial("soul-effect.material", game.scene);
        this.material.diffuseColor = color.clone();
        this.material.emissiveColor = color.clone();
        this.material.alpha = SoulEffect.INIT_ALPHA;
        this.material.backFaceCulling = false;
        mesh.material = this.material;
        this.startPosition = position.clone();
        this.xyDirection = Math.random() < 0.5 ? -1 : 1;
        // MainCamera.rotation is π/2 at its default view; subtract it so that
        // the default camera angle is treated as θ = 0.
        this.cameraAngle = moveInXY ? game.camera.rotation - Math.PI / 2 : 0;
        this.moveInXY = moveInXY;
        this.setPosition(this.startPosition);
    }

    private readonly moveInXY: boolean;

    public override update(deltaSeconds: number): void {
        this.elapsedSeconds = Math.min(
            this.elapsedSeconds + deltaSeconds,
            SoulEffect.DURATION_SECONDS,
        );
        const progress = this.elapsedSeconds / SoulEffect.DURATION_SECONDS;
        const radialOffset = this.moveInXY
            ? this.xyDirection * Math.sin(2 * Math.PI * progress) / 2
            : 0;
        this.mesh.position.set(
            this.startPosition.x + radialOffset * Math.cos(this.cameraAngle),
            this.startPosition.y + radialOffset * Math.sin(this.cameraAngle),
            this.startPosition.z + SoulEffect.RISE_DISTANCE * progress,
        );
        this.material.alpha = (1 - progress) * SoulEffect.INIT_ALPHA;
        if (progress >= 1) this.game.removeEffect(this);
    }
}
