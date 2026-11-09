import { GlowLayer, type Scene } from "#vendor/babylon";

const glowLayers = new WeakMap<Scene, GlowLayer>();

/** SceneごとにGlowLayerを共有し、発光用メッシュを登録する。 */
export function getGlowLayer(scene: Scene): GlowLayer {
    let glowLayer = glowLayers.get(scene);
    if (!glowLayer) {
        glowLayer = new GlowLayer("scene-glow", scene);
        glowLayers.set(scene, glowLayer);
    }
    return glowLayer;
}
