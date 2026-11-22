import { Mesh, Scene, Vector3 } from "#vendor/babylon";
import { Game } from "../game";

/** 描画だけを行い、Entity の衝突・物理判定には参加しないエフェクト。 */
export abstract class Effect {
    protected elapsedSeconds = 0;

    protected constructor(
        protected readonly game: Game,
        public readonly mesh: Mesh,
    ) {
        this.mesh.isPickable = false;
        this.mesh.checkCollisions = false;
        this.game.addEffect(this);
    }

    public abstract update(deltaSeconds: number): void;

    public dispose(): void {
        this.mesh.dispose(false, true);
    }

    protected get scene(): Scene {
        return this.game.scene;
    }

    protected setPosition(position: Vector3): void {
        this.mesh.position.copyFrom(position);
    }
}
