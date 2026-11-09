import { Vector3 } from "#vendor/babylon";
import { Random } from "../../core/random";

export type SeedMotionUpdate = {
    position: Vector3;
    rotationX: number;
    rotationY: number;
    finished: boolean;
};

/** Onion から生まれる Minion の種の軌道を管理する */
export class SeedMotion {
    private startPoint: Vector3 | null = null;
    private height = 0;
    private radius = 0;
    private theta = 0;
    private elapsedSeconds = 0;
    private buriedOrigin: Vector3 | null = null;

    public get buriedOriginZ(): number | null {
        return this.buriedOrigin?.z ?? null;
    }

    public start(startPoint: Vector3, endPoint: Vector3, radius: number): void {
        this.startPoint = startPoint.clone();
        this.buriedOrigin = startPoint.clone();
        this.height = endPoint.z - startPoint.z;
        this.radius = Math.max(0, radius);
        this.theta = Random.uniform(0, 2 * Math.PI);
        this.elapsedSeconds = 0;
    }

    public initialRotation(): { x: number; y: number } {
        return {
            x: Math.sin(this.theta) * Math.PI / 2,
            y: -Math.cos(this.theta) * Math.PI / 2,
        };
    }

    public update(deltaSeconds: number, speed: number): SeedMotionUpdate | null {
        const startPoint = this.startPoint;
        if (!startPoint) return null;

        this.elapsedSeconds += Math.max(0, deltaSeconds);
        const totalLength = this.getArcLengthAt(this.radius);
        const distance = Math.min(this.elapsedSeconds * speed, totalLength);
        let low = 0;
        let high = this.radius;
        // Invert the curve's arc length so the seed moves at a constant speed.
        for (let i = 0; i < 24; i++) {
            const middle = (low + high) / 2;
            if (this.getArcLengthAt(middle) < distance) low = middle;
            else high = middle;
        }
        const a = distance >= totalLength ? this.radius : (low + high) / 2;
        const k = this.radius > 0 ? 2 * this.height / (this.radius * this.radius) : 0;
        const tilt = Math.PI / 2 - Math.atan(k * a);
        const radialFraction = this.radius > 0 ? a / this.radius : 0;
        const update: SeedMotionUpdate = {
            position: new Vector3(
                startPoint.x + a * Math.cos(this.theta),
                startPoint.y + a * Math.sin(this.theta),
                startPoint.z + this.height * (1 - radialFraction ** 2), // z = h * (1 - (a/r)^2)
            ),
            rotationX: Math.sin(this.theta) * tilt,
            rotationY: -Math.cos(this.theta) * tilt,
            finished: distance >= totalLength,
        };

        if (update.finished) {
            update.rotationX = 0;
            update.rotationY = 0;
            this.startPoint = null;
        }
        return update;
    }

    /**
     * 軌道: z = h * (1 - (a/r)^2)
     * integral (0 to a) sqrt(1 + (2h/r^2 * x)^2) dx
     * integral sqrt(1 + (kx)^2) dx = x/2 * sqrt(1 + (kx)^2) + 1/2k arcsinh(kx) + C
     *   arcsinh(x) = ln(x + sqrt(1 + x^2))
     */
    private getArcLengthAt(a: number): number {
        if (this.radius <= 0 || this.height === 0) return a;
        const k = 2 * this.height / (this.radius * this.radius);
        const ka = k * a;
        return 0.5 * (a * Math.sqrt(1 + ka * ka) + Math.asinh(ka) / k);
    }
}
