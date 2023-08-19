import { app, backgroundLayer, gasManager, uiLayer, worldUiLayer } from "index";
import { BaseTexture, Container, FORMATS, Geometry, Mesh, MeshMaterial, Program, SCALE_MODES, Sprite, Texture } from "pixi.js";
export let gasSprite: Mesh;
import vertex from "./filters/gas/gas.vert";
import fragment from "./filters/gas/gas.frag";
import { Camera } from "camera";
import { GasManager } from "@shared/gasManager";

export function addGas() {
    let gasProg = Program.from(vertex, fragment);
    let uniforms = {
        uViewport: [0, 0, 0, 0],
        uScale: 0,
        uTime: 0,
        uSize: 250,
        uChunkCount: 40,
    };

    let material = new MeshMaterial(Texture.EMPTY, {
        program: gasProg,
        uniforms: uniforms,
    });

    let geometry = new Geometry();
    geometry.addAttribute("aVertexPosition", [0, 0, 1, 0, 1, 1, 0, 1], 2);
    geometry.addAttribute("aTextureCoord", [0, 0, 1, 0, 1, 1, 0, 1], 2);
    geometry.addIndex([0, 1, 2, 2, 3, 0]);

    gasSprite = new Mesh(geometry, material);

    app.stage.addChild(gasSprite);

    Texture.fromURL("/assets/sample.png").then((e) => (gasSprite.texture = e));
}

export function updateTexture() {
    const gasBytes = new Uint8Array(40 * 40);
    console.log(Camera.size.x, Camera.size.y);
    gasSprite.material.uniforms.uViewport = [Camera.position.x, Camera.position.y, Camera.size.x, Camera.size.y];
    gasSprite.material.uniforms.uScale = Camera.scale;

    gasSprite.scale.x = Camera.size.x;
    gasSprite.scale.y = Camera.size.y;

    gasSprite.position.x = -Camera.size.x / 2;
    gasSprite.position.y = -Camera.size.y / 2;

    let i = 0;
    for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 40; x++) {
            gasBytes[i] = gasManager.getGas({ x: x - Math.floor(Camera.position.x / GasManager.gasScale), y: y - Math.floor(Camera.position.y / GasManager.gasScale) });
            i++;
        }
    }

    gasSprite.texture = new Texture(
        BaseTexture.fromBuffer(gasBytes, 40, 40, {
            scaleMode: SCALE_MODES.LINEAR,
            format: FORMATS.ALPHA,
        })
    );
}
