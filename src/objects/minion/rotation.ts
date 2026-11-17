import { Vector3 } from "#vendor/babylon";

export class MinionRotation {
    private rotationBeforeThrow: { x: number; y: number } | null = null;

    public beginThrow(rotation: Vector3): void {
        this.rotationBeforeThrow = { x: rotation.x, y: rotation.y };
    }

    public finishThrow(rotation: Vector3): void {
        if (!this.rotationBeforeThrow) return;
        rotation.x = this.rotationBeforeThrow.x;
        rotation.y = this.rotationBeforeThrow.y;
        this.rotationBeforeThrow = null;
    }

    /** Roll the minion as it moves horizontally while thrown. */
    public updateThrown(rotation: Vector3, displacement: Vector3, size: number): void {
        const radius = size / 2;
        if (radius <= 0) return;

        const rotationRate = 0.5;
        rotation.x -= displacement.y / radius * rotationRate;
        rotation.y += displacement.x / radius * rotationRate;
    }
}
