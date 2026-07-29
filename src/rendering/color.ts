import {
    Color3,
    StandardMaterial,
} from "#vendor/babylon";

export class Color {
    static set(
        material: StandardMaterial, 
        baseColor: Color3, 
        options: { metallicity?: number, luminance?: number } = {},
    ): void {
        const { metallicity = 0, luminance = 0 } = options;
        material.diffuseColor = new Color3(
            (1 - metallicity) * baseColor.r,
            (1 - metallicity) * baseColor.g,
            (1 - metallicity) * baseColor.b,
        );
        material.emissiveColor = new Color3(
            luminance * baseColor.r,
            luminance * baseColor.g,
            luminance * baseColor.b,
        );
        material.specularColor = new Color3(
            (1 - metallicity) * 0.04 + metallicity * baseColor.r,
            (1 - metallicity) * 0.04 + metallicity * baseColor.g,
            (1 - metallicity) * 0.04 + metallicity * baseColor.b,
        );
    }
}
