import {
    Color3,
    CreatePlane,
    DynamicTexture,
    type Mesh,
    Scene,
    StandardMaterial,
    Texture,
    Vector3,
} from "#vendor/babylon";
import { Random } from "../../core/random";
import { Game } from "../../game";
import { Block } from "../../objects/block";

export function createDemoFloor(game: Game, playArea: number): Block {
    createGrassFloor(game.scene, playArea);
    const block = new Block(game, new Vector3(0, 0, -playArea * 2), playArea * 2);
    block.isVisible = false;
    return block;
}

function createGrassFloor(scene: Scene, playArea: number): Mesh {
    const size = playArea * 2;
    const floor = CreatePlane(
        "floor",
        {
            width: size,
            height: size,
        },
        scene,
    );
    floor.receiveShadows = true;
    floor.isPickable = false;
    const texture = new DynamicTexture(
        "grassTexture",
        { width: 512, height: 512 },
        scene,
    );
    drawGrassTexture(texture);
    texture.wrapU = Texture.WRAP_ADDRESSMODE;
    texture.wrapV = Texture.WRAP_ADDRESSMODE;
    texture.uScale = 5;
    texture.vScale = 5;

    const material = new StandardMaterial("floorMaterial", scene);
    material.backFaceCulling = false;
    material.diffuseTexture = texture;
    material.ambientColor = new Color3(0.45, 0.52, 0.38);
    material.emissiveColor = new Color3(0.12, 0.18, 0.08);
    material.specularColor = new Color3(0.04, 0.04, 0.04);
    floor.material = material;

    return floor;
}

function drawGrassTexture(texture: DynamicTexture): void {
    const context = texture.getContext();
    const width = 512;
    const height = 512;

    context.fillStyle = "#79ad43";
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < 1800; index += 1) {
        const x = Random.uniform(0, width);
        const y = Random.uniform(0, height);
        const size = Random.uniform(2, 8);
        context.fillStyle =
            index % 3 === 0 ? "#5e8d31" : index % 3 === 1 ? "#8cc152" : "#6fa83b";
        context.fillRect(x, y, size, size);
    }

    context.lineWidth = 1;

    for (let index = 0; index < 700; index += 1) {
        const x = Random.uniform(0, width);
        const y = Random.uniform(0, height);
        const bladeHeight = Random.uniform(4, 12);
        context.strokeStyle =
            index % 2 === 0 ? "rgba(53, 94, 25, 0.55)" : "rgba(167, 214, 103, 0.35)";
        context.beginPath();
        context.moveTo(x, y + bladeHeight / 2);
        context.lineTo(x + Random.uniform(-1.5, 1.5), y - bladeHeight / 2);
        context.stroke();
    }

    texture.update();
}
