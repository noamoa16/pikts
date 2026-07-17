import {
    Color3,
    StandardMaterial,
} from "#vendor/babylon";

export class Color {
    static set(
        material: StandardMaterial, 
        baseColor: Color3, 
        options: {metalicity?: number, luminance?: number} = {},
    ): void {
        const { metalicity = 0, luminance = 0 } = options;
        material.diffuseColor = new Color3(
            (1 - metalicity) * baseColor.r,
            (1 - metalicity) * baseColor.g,
            (1 - metalicity) * baseColor.b,
        );
        material.emissiveColor = new Color3(
            luminance * baseColor.r,
            luminance * baseColor.g,
            luminance * baseColor.b,
        );
        material.specularColor = new Color3(
            (1 - metalicity) * 0.04 + metalicity * baseColor.r,
            (1 - metalicity) * 0.04 + metalicity * baseColor.g,
            (1 - metalicity) * 0.04 + metalicity * baseColor.b,
        );
    }
}