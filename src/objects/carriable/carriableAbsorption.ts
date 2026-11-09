import { Vector3 } from "#vendor/babylon";
import { Game } from "../../game";
import { Minion, SeedMinion } from "../minion/minion";
import { Onion } from "../onion/onion";
import type { Carriable } from "./carriable";

export class CarriableAbsorption {
    private elapsedSeconds = 0;
    private baseRotation: Vector3 | null = null;
    private baseScale: Vector3 | null = null;
    private onion: Onion | null = null;
    private nutrition = 0;

    constructor(
        private readonly carriable: Carriable,
        private readonly game: Game,
    ) {}

    start(onion: Onion, carriers: Minion[], nutrition: number): void {
        for(const carrier of carriers){
            carrier.carried = null;
            carrier.becomeFree();
        }
        this.nutrition = nutrition;
        this.elapsedSeconds = 0;
        this.baseRotation = this.carriable.rotation.clone();
        this.baseScale = this.carriable.mesh.scaling.clone();
        this.onion = onion;
    }

    update(deltaSeconds: number): void {
        const ABSORBING_WAIT = 0.5;
        const ABSORBING_MOVE = 1.0;
        const elapsed = this.elapsedSeconds;
        this.elapsedSeconds += deltaSeconds;

        // Onion に吸収される
        if(this.elapsedSeconds >= ABSORBING_WAIT + ABSORBING_MOVE){
            this.onion?.jump();
            this.game.removeObject(this.carriable);
            void this.spawnSeedMinions();
            return;
        }

        const baseRotation = this.baseRotation ?? this.carriable.rotation;
        const wobble = Math.sin(this.elapsedSeconds * Math.PI * 8) * 0.08;
        this.carriable.rotation.x = baseRotation.x + wobble;
        this.carriable.rotation.y = baseRotation.y;
        this.carriable.rotation.z = baseRotation.z + wobble * 0.5;

        if(elapsed < ABSORBING_WAIT && this.elapsedSeconds <= ABSORBING_WAIT) return;

        const onion = this.onion;
        if(!onion) return;
        const moveElapsed = Math.max(0, this.elapsedSeconds - ABSORBING_WAIT) / ABSORBING_MOVE;
        const progress = Math.min(moveElapsed, 1); // [0, 1]
        const lerp = progress ** 3; // y = x^3 で動かす
        const scale = 1 - lerp / 2;
        this.carriable.mesh.scaling = (this.baseScale ?? Vector3.One()).scale(scale);
        this.carriable.mesh.position = Vector3.Lerp(
            onion.absorbingStartPoint,
            onion.absorbingEndPoint,
            lerp,
        );
    }

    /**
     * 栄養価に応じて、Minionを生成する
     */
    private async spawnSeedMinions(): Promise<void> {
        const onion = this.onion;
        if(!onion) return;

        await this.sleep(1_000);

        const startPoint = onion.absorbingStartPoint;
        const endPoint = onion.absorbingEndPoint;
        const radius = onion.size / 2;
        for(let i = 0; i < this.nutrition; i++){
            const minion = new SeedMinion(
                this.game,
                endPoint,
                onion.minionColor,
            );
            minion.becomeSeed(startPoint, endPoint, radius);

            if(i < this.nutrition - 1){
                await this.sleep(100);
            }
        }
    }

    private sleep(milliseconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
}
