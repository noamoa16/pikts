import { Entity } from "../objects/entity";

export class Collision {
    private activeCollisionPairs = new Set<string>();
    public dispatchEvents(objects: Entity[]): void {
        const nextCollisionPairs = new Set<string>();
        objects = objects.filter(o => o.collisionEventsEnabled);
        objects.forEach(o => o.mesh.computeWorldMatrix(true));
        const idToObjects = new Map(objects.map(o => [o.id, o]));

        for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
                const left = objects[i];
                const right = objects[j];
                if (!left.mesh.intersectsMesh(right.mesh, true)) {
                    continue;
                }

                const pairKey = createCollisionPairKey(left.id, right.id);
                nextCollisionPairs.add(pairKey);

                if (this.activeCollisionPairs.has(pairKey)) {
                    left.onCollisionStay(right);
                    right.onCollisionStay(left);
                } else {
                    left.onCollisionEnter(right);
                    right.onCollisionEnter(left);
                }
            }
        }

        this.activeCollisionPairs.forEach(pairKey => {
            if (nextCollisionPairs.has(pairKey)) {
                return;
            }

            const [leftId, rightId] = pairKey.split(":").map(Number);
            const left = idToObjects.get(leftId);
            const right = idToObjects.get(rightId);
            if (!left || !right) {
                return;
            }

            left.onCollisionExit(right);
            right.onCollisionExit(left);
        });

        this.activeCollisionPairs.clear();
        nextCollisionPairs.forEach(pairKey => this.activeCollisionPairs.add(pairKey));
    }
}

function createCollisionPairKey(leftIndex: number, rightIndex: number): string {
    return `${leftIndex}:${rightIndex}`;
}