import { ArcRotateCamera, Scene, Vector3 } from "#vendor/babylon";

const CAMERA_RADIUS = 9;
const CAMERA_FOV = Math.PI / 3;

export class MainCamera {
    private readonly camera: ArcRotateCamera;
    private readonly canvas: HTMLCanvasElement | null;
    private readonly previousTransform: string;
    private readonly previousTransformOrigin: string;

    constructor(scene: Scene) {
        this.canvas = scene.getEngine().getRenderingCanvas();
        this.previousTransform = this.canvas?.style.transform ?? "";
        this.previousTransformOrigin = this.canvas?.style.transformOrigin ?? "";
        if (this.canvas) {
            this.canvas.style.transform = "scaleX(-1)";
            this.canvas.style.transformOrigin = "center center";
        }

        this.camera = new ArcRotateCamera(
            "camera",
            Math.PI / 2,
            Math.PI / 4,
            CAMERA_RADIUS,
            Vector3.Zero(),
            scene,
        );
        this.camera.upVector = new Vector3(0, 0, 1);
        this.camera.fov = CAMERA_FOV;
        this.camera.inputs.clear();
        this.camera.lowerRadiusLimit = CAMERA_RADIUS;
        this.camera.upperRadiusLimit = CAMERA_RADIUS;

        scene.onDisposeObservable.add(() => {
            if (!this.canvas) {
                return;
            }
            this.canvas.style.transform = this.previousTransform;
            this.canvas.style.transformOrigin = this.previousTransformOrigin;
        });
    }

    set target(value: Vector3) {
        this.camera.target = value;
    }
    get rotation(): number {
        return -this.camera.alpha + Math.PI;
    }
    set rotation(value: number) {
        this.camera.alpha = Math.PI - value;
    }
}
