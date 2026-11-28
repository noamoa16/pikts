import { Vector3 } from "#vendor/babylon";
import { Game } from "../../game";
import { Shape } from "../../physics/figure";
import { Enemy } from "./enemy";
import { Minion, MinionState } from "../minion/minion";
import { KochappyCarcass } from "../carriable/kochappyCarcass";
import { SoulEffect } from "../../effects/soulEffect";
import { KochappyAppearance } from "./kochappyAppearance";

export enum KochappyState {
    free,
    chase,
    feeding,
    eating,
}

export class Kochappy extends Enemy {
    protected static override readonly TAKES_THROWN_MINION_TOP_HIT_DAMAGE = true;
    private static readonly MINION_SEARCH_MIN_DISTANCE = 0.5;
    private static readonly MINION_SEARCH_MAX_DISTANCE = 1.5;
    private static readonly FEEDING_TURN_SECONDS = 0.4;
    private static readonly FEEDING_RETURN_SECONDS = 0.4;
    private static readonly FEEDING_COOLDOWN_SECONDS = 1;
    private static readonly FEEDING_TURN_RADIANS = Math.PI / 4;
    private static readonly PREDATION_DURATION_SECONDS = 4;
    private static readonly EATING_DURATION_SECONDS = Kochappy.PREDATION_DURATION_SECONDS
        - Kochappy.FEEDING_TURN_SECONDS
        - Kochappy.FEEDING_RETURN_SECONDS;
    private static readonly EATING_TILT_RADIANS = Math.PI / 8;
    private static readonly EATING_ROTATION_RADIANS = Math.PI / 4;
    private static readonly CHASE_SPEED = 0.5;
    private currentState = KochappyState.free;
    public get state(): KochappyState { return this.currentState; }
    private feedingElapsedSeconds = 0;
    private feedingCooldownRemainingSeconds = 0;
    private feedingStartRotationX = 0;
    private feedingStartRotationY = 0;
    private feedingStartFacingAngle = 0;
    private eatenMinionStartRotationZ = 0;
    private predationElapsedSeconds = 0;
    private eatingElapsedSeconds = 0;
    private eatenMinion: Minion | null = null;

    protected override die(): void {
        this.releaseEatenMinion();
        const deathPosition = this.position.clone();
        this.disposeHpMeter();
        new KochappyCarcass(this.game, deathPosition, this.mesh, this.size);
        new SoulEffect(this.game, deathPosition, { radiusScale: 2 });
        super.die();
    }

    constructor(game: Game, position: Vector3) {
        super(game, position, 0.5, 15, undefined, Shape.Sphere);
        this.speed = Kochappy.CHASE_SPEED;
        new KochappyAppearance(this.mesh, this.size, `${this.name}.${this.id}`, game);
    }

    public override update(deltaSeconds: number): void {
        super.update(deltaSeconds);
        this.velocity.x = 0;
        this.velocity.y = 0;

        if (this.currentState === KochappyState.feeding) {
            this.updateFeeding(deltaSeconds);
            return;
        }
        if (this.currentState === KochappyState.eating) {
            this.updateEating(deltaSeconds);
            return;
        }

        this.feedingCooldownRemainingSeconds = Math.max(
            0,
            this.feedingCooldownRemainingSeconds - deltaSeconds,
        );
        const minionInFront = this.feedingCooldownRemainingSeconds === 0
            ? this.findMinionInFront()
            : null;
        if (minionInFront) {
            this.startFeeding(minionInFront);
            this.updateFeeding(deltaSeconds);
            return;
        }

        const target = this.findNearestMinion();
        this.currentState = target ? KochappyState.chase : KochappyState.free;
        if (!target) return;

        const direction = target.groundingPosition.subtract(this.groundingPosition);
        direction.z = 0;
        if (direction.lengthSquared() === 0) return;

        const displacement = direction.normalize().scale(this.speed * deltaSeconds);
        const actualDisplacement = this.moveFor(displacement);
        if (deltaSeconds > 0) {
            this.velocity.x = actualDisplacement.x / deltaSeconds;
            this.velocity.y = actualDisplacement.y / deltaSeconds;
        }
        this.rotateToDirection(
            new Vector3(-actualDisplacement.y, actualDisplacement.x, 0),
            deltaSeconds,
        );
    }

    private findNearestMinion(): Minion | null {
        return this.getNearbyEntities(
            Kochappy.MINION_SEARCH_MAX_DISTANCE,
            (entity): entity is Minion =>
                entity instanceof Minion
                && entity.state !== MinionState.seed
                && entity.state !== MinionState.buried
                && entity.state !== MinionState.eaten,
        ).find(entity =>
            this.distanceToSurface(entity) >= Kochappy.MINION_SEARCH_MIN_DISTANCE,
        ) ?? null;
    }

    private findMinionInFront(): Minion | null {
        // Kochappy が向いている向き
        const facing = new Vector3(Math.sin(this.rotation.z), -Math.cos(this.rotation.z), 0);

        let bestMinion: Minion | null = null;
        let bestSimilarity = Math.SQRT1_2;
        for (const minion of this.getNearbyEntities(
            Kochappy.MINION_SEARCH_MIN_DISTANCE,
            (entity): entity is Minion =>
                entity instanceof Minion
                && entity.state !== MinionState.seed
                && entity.state !== MinionState.buried
                && entity.state !== MinionState.eaten,
        )) {
            const toMinion = minion.groundingPosition.subtract(this.groundingPosition);
            toMinion.z = 0;
            if (toMinion.lengthSquared() === 0) continue;

            const similarity = Vector3.Dot(facing, toMinion.normalize());
            if (similarity >= bestSimilarity) {
                bestMinion = minion;
                bestSimilarity = similarity;
            }
        }
        return bestMinion;
    }

    /** 捕食処理を開始 */
    private startFeeding(minion: Minion): void {
        this.eatenMinion = minion;
        minion.becomeEaten();
        this.currentState = KochappyState.feeding;
        this.feedingElapsedSeconds = 0;
        this.predationElapsedSeconds = 0;
        this.feedingStartRotationX = this.rotation.x;
        this.feedingStartRotationY = this.rotation.y;
        this.feedingStartFacingAngle = this.rotation.z;
        this.eatenMinionStartRotationZ = minion.rotation.z;
    }

    /**
     * 捕食しようとする際のアクション
     * 実際に捕食している場合とそうでない場合の両方で実行する
     */
    private updateFeeding(deltaSeconds: number): void {
        const duration = Kochappy.FEEDING_TURN_SECONDS + Kochappy.FEEDING_RETURN_SECONDS;
        this.feedingElapsedSeconds = Math.min(this.feedingElapsedSeconds + deltaSeconds, duration);
        this.predationElapsedSeconds = Math.min(
            this.predationElapsedSeconds + deltaSeconds,
            Kochappy.PREDATION_DURATION_SECONDS,
        );

        const turnProgress = Math.min( // [0, 1]
            this.feedingElapsedSeconds / Kochappy.FEEDING_TURN_SECONDS,
            1,
        );
        const returnProgress = Math.max( // [0, 1]
            0,
            (this.feedingElapsedSeconds - Kochappy.FEEDING_TURN_SECONDS)
                / Kochappy.FEEDING_RETURN_SECONDS,
        );

        // 動作の進捗に応じて前に回転させる
        const clockwiseTurn = Kochappy.FEEDING_TURN_RADIANS * (turnProgress - returnProgress);
        this.rotation.x = this.feedingStartRotationX
            + Math.cos(this.feedingStartFacingAngle) * clockwiseTurn;
        this.rotation.y = this.feedingStartRotationY
            + Math.sin(this.feedingStartFacingAngle) * clockwiseTurn;

        if (this.feedingElapsedSeconds >= duration) {
            /** 捕食中であることを示す動作に切り替える */
            this.rotation.x = this.feedingStartRotationX;
            this.rotation.y = this.feedingStartRotationY;
            this.eatingElapsedSeconds = 0;
            this.currentState = KochappyState.eating;
            this.moveEatenMinionInFront();
            this.setEatingPose();
        }
        if (this.predationElapsedSeconds >= Kochappy.PREDATION_DURATION_SECONDS) {
            this.finishPredation();
        }
    }

    /**
     * 実際に捕食しているときのアクション
     */
    private updateEating(deltaSeconds: number): void {
        this.eatingElapsedSeconds = Math.min(
            this.eatingElapsedSeconds + deltaSeconds,
            Kochappy.EATING_DURATION_SECONDS,
        );
        this.predationElapsedSeconds = Math.min(
            this.predationElapsedSeconds + deltaSeconds,
            Kochappy.PREDATION_DURATION_SECONDS,
        );
        this.setEatingPose();
        this.setEatingRotation();
        this.moveEatenMinionInFront();
        if (this.predationElapsedSeconds >= Kochappy.PREDATION_DURATION_SECONDS) {
            this.finishPredation();
        }
    }

    /** 捕食中に向きを「−θ → +2θ → −θ」と動かす。 */
    private setEatingRotation(): void {
        const phaseDuration = Kochappy.EATING_DURATION_SECONDS / 3;
        const phase = Math.min(
            Math.floor(this.eatingElapsedSeconds / phaseDuration),
            2,
        );
        const phaseProgress = Math.min(
            (this.eatingElapsedSeconds - phase * phaseDuration) / phaseDuration,
            1,
        );
        const theta = Kochappy.EATING_ROTATION_RADIANS;
        const offset = phase === 0
            ? -theta * phaseProgress
            : phase === 1
                ? -theta + 2 * theta * phaseProgress
                : theta - theta * phaseProgress;

        this.rotation.z = this.feedingStartFacingAngle + offset;
    }

    /**
     * 実際に捕食しているときに、体を前方に傾けて固定する
     */
    private setEatingPose(): void {
        const tilt = Kochappy.EATING_TILT_RADIANS;
        this.rotation.x = this.feedingStartRotationX
            + Math.cos(this.feedingStartFacingAngle) * tilt;
        this.rotation.y = this.feedingStartRotationY
            + Math.sin(this.feedingStartFacingAngle) * tilt;
    }

    /** Minion を Kochappy の正面に置き、Kochappy の回転に合わせて向きを動かす。 */
    private moveEatenMinionInFront(): void {
        const minion = this.eatenMinion;
        if (!minion) return;

        const facingAngle = this.rotation.z;
        const facing = new Vector3(
            Math.sin(facingAngle),
            -Math.cos(facingAngle),
            0,
        );
        const distance = (this.size + minion.size) / 2;
        minion.moveToEatenPosition(
            this.groundingPosition.add(facing.scale(distance)),
        );
        minion.rotation.z = this.eatenMinionStartRotationZ
            + facingAngle
            - this.feedingStartFacingAngle;
    }

    /**
     * Minion を完全に捕食しきったときに実行
     */
    private finishPredation(): void {
        const minion = this.eatenMinion;
        this.eatenMinion = null;
        minion?.dieFromEating();
        this.rotation.x = this.feedingStartRotationX;
        this.rotation.y = this.feedingStartRotationY;
        this.rotation.z = this.feedingStartFacingAngle;
        this.currentState = KochappyState.free;
        this.feedingCooldownRemainingSeconds = Kochappy.FEEDING_COOLDOWN_SECONDS;
    }

    /**
     * 捕食処理を中断
     */
    private releaseEatenMinion(): void {
        const minion = this.eatenMinion;
        this.eatenMinion = null;
        if (minion?.state === MinionState.eaten) minion.becomeFree();
    }

}
