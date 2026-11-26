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
}

export class Kochappy extends Enemy {
    private static readonly MINION_SEARCH_MIN_DISTANCE = 0.5;
    private static readonly MINION_SEARCH_MAX_DISTANCE = 1.5;
    private static readonly FEEDING_TURN_SECONDS = 0.4;
    private static readonly FEEDING_RETURN_SECONDS = 0.4;
    private static readonly FEEDING_TURN_RADIANS = Math.PI / 4;
    private static readonly CHASE_SPEED = 0.5;
    private currentState = KochappyState.free;
    public get state(): KochappyState { return this.currentState; }
    private feedingElapsedSeconds = 0;
    private feedingStartRotationX = 0;
    private feedingStartRotationY = 0;
    private feedingStartFacingAngle = 0;

    protected override die(): void {
        const deathPosition = this.position.clone();
        this.disposeHpMeter();
        new KochappyCarcass(this.game, deathPosition, this.mesh, this.size);
        new SoulEffect(this.game, deathPosition);
        super.die();
    }

    constructor(game: Game, position: Vector3) {
        super(game, position, 0.5, 20, undefined, Shape.Sphere);
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

        const minionInFront = this.findMinionInFront();
        if (minionInFront) {
            this.startFeeding();
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
                && entity.state !== MinionState.buried,
        ).find(entity =>
            this.distanceToSurface(entity) >= Kochappy.MINION_SEARCH_MIN_DISTANCE,
        ) ?? null;
    }

    private findMinionInFront(): Minion | null {
        // Kochappy が向いている向き
        const facing = new Vector3(Math.sin(this.rotation.z), -Math.cos(this.rotation.z), 0);
        
        return this.getNearbyEntities(
            Kochappy.MINION_SEARCH_MIN_DISTANCE,
            (entity): entity is Minion =>
                entity instanceof Minion
                && entity.state !== MinionState.seed
                && entity.state !== MinionState.buried,
        ).find(minion => {
            const toMinion = minion.groundingPosition.subtract(this.groundingPosition);
            toMinion.z = 0;
            return toMinion.lengthSquared() > 0
                && Vector3.Dot(facing, toMinion.normalize()) >= Math.SQRT1_2;
        }) ?? null;
    }

    private startFeeding(): void {
        this.currentState = KochappyState.feeding;
        this.feedingElapsedSeconds = 0;
        this.feedingStartRotationX = this.rotation.x;
        this.feedingStartRotationY = this.rotation.y;
        this.feedingStartFacingAngle = this.rotation.z;
    }

    private updateFeeding(deltaSeconds: number): void {
        const duration = Kochappy.FEEDING_TURN_SECONDS + Kochappy.FEEDING_RETURN_SECONDS;
        this.feedingElapsedSeconds = Math.min(this.feedingElapsedSeconds + deltaSeconds, duration);

        const turnProgress = Math.min(
            this.feedingElapsedSeconds / Kochappy.FEEDING_TURN_SECONDS,
            1,
        );
        const returnProgress = Math.max(
            0,
            (this.feedingElapsedSeconds - Kochappy.FEEDING_TURN_SECONDS)
                / Kochappy.FEEDING_RETURN_SECONDS,
        );
        const clockwiseTurn = Kochappy.FEEDING_TURN_RADIANS * (turnProgress - returnProgress);
        this.rotation.x = this.feedingStartRotationX
            + Math.cos(this.feedingStartFacingAngle) * clockwiseTurn;
        this.rotation.y = this.feedingStartRotationY
            + Math.sin(this.feedingStartFacingAngle) * clockwiseTurn;

        if (this.feedingElapsedSeconds >= duration) {
            this.rotation.x = this.feedingStartRotationX;
            this.rotation.y = this.feedingStartRotationY;
            this.currentState = KochappyState.free;
        }
    }

}
