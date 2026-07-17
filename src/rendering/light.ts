import {
    Color3,
    DirectionalLight,
    HemisphericLight,
    type Mesh,
    Scene,
    ShadowGenerator,
    Vector3,
} from "#vendor/babylon";

export function createFillLight(scene: Scene): HemisphericLight {
    const fillLight = new HemisphericLight(
        "fillLight",
        new Vector3(0.2, 0.3, -1),
        scene,
    );
    fillLight.intensity = 0.4;
    fillLight.diffuse = new Color3(1, 0.99, 0.95);
    fillLight.groundColor = new Color3(0.5, 0.56, 0.4);
    return fillLight;
}

export function createSunLight(scene: Scene): DirectionalLight {
    const sunLight = new DirectionalLight(
        "sunLight",
        new Vector3(0, 0, -1),
        scene,
    );
    sunLight.position = new Vector3(0, 0, 10);
    sunLight.intensity = 0.9;
    sunLight.diffuse = new Color3(1, 0.98, 0.9);
    sunLight.specular = new Color3(0.45, 0.45, 0.4);
    sunLight.autoUpdateExtends = true;
    sunLight.autoCalcShadowZBounds = true;
    return sunLight;
}

export function createShadowMap(
    light: DirectionalLight,
    shadowCasters: Mesh[],
): ShadowGenerator {
    const shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
    shadowGenerator.bias = 0.0015;
    shadowGenerator.normalBias = 0.02;

    for (const mesh of shadowCasters) {
        shadowGenerator.addShadowCaster(mesh);
    }

    return shadowGenerator;
}
